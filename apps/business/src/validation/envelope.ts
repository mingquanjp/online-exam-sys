import { isIP } from 'node:net';
import { isAbsolute } from 'node:path';
import {
  ValidationError, exactKeys, object, integer, id, nullableId, hexId,
  enumeration, text, boolean, type JsonObject,
} from './schema.js';
import { checkDepth, decodeObject, type WireChannel } from './strict-json.js';

// Bảng type hiện hành ở 03 §6/7/9; không nhận tên hàm hoặc channel tùy ý từ UI.
export const WRITE_TYPES = [
  'room.create', 'room.configure', 'room.join', 'room.leave', 'room.cancel', 'room.start', 'room.end',
  'admin.topic.create', 'admin.topic.update', 'admin.question.create', 'admin.question.update',
  'practice.start', 'answer.save', 'attempt.submit',
] as const;
export const READ_TYPES = [
  'state.get', 'operation.get', 'room.list', 'room.get', 'catalog.list', 'admin.topic.list',
  'admin.question.list', 'attempt.get', 'attempt.items', 'result.get', 'result.items',
  'room.results', 'history.list', 'auth.register', 'auth.login', 'auth.logout',
] as const;
export const LOCAL_TYPES = ['local.connect', 'local.status', 'local.shutdown'] as const;
export const IPC_TYPES = [...WRITE_TYPES, ...READ_TYPES, ...LOCAL_TYPES] as const;
const NET_TYPES = [...WRITE_TYPES, ...READ_TYPES, 'auth.resume', 'sys.ping', 'sys.hello'] as const;

export interface RequestDto {
  v: 1;
  kind: 'request';
  request_id: string;
  type: string;
  operation_id: string | null;
  body: unknown;
}

/** @brief Đổi lỗi schema envelope thành lỗi boundary; không đưa giá trị input vào error. */
function boundary<T>(read: () => T): T {
  try { return read(); } catch (error) {
    if (error instanceof ValidationError) throw new ValidationError('boundary', error.reason, error.field);
    throw error;
  }
}

/** @brief Kiểm envelope request; body được owner handler validate sau để map INVALID_ARGUMENT đúng tầng. */
export function requestEnvelope(value: unknown, channel: 'NET' | 'IPC'): RequestDto {
  const request = boundary(() => {
    const row = exactKeys(value, ['v', 'kind', 'request_id', 'type', 'operation_id', 'body']);
    integer(row.v, 1, 2147483647, 'v');
    if (row.v !== 1) throw new ValidationError('boundary', 'UNSUPPORTED_VERSION');
    enumeration(row.kind, ['request'], 'kind');
    const type = text(row.type, 'type', 1, 64);
    const operation = row.operation_id === null ? null : hexId(row.operation_id, 'operation_id');
    const isWrite = (WRITE_TYPES as readonly string[]).includes(type);
    if ((NET_TYPES as readonly string[]).includes(type) || (LOCAL_TYPES as readonly string[]).includes(type)) {
      if (isWrite !== (operation !== null)) throw new ValidationError('boundary', 'OPERATION_ID');
    }
    return { v: 1 as const, kind: 'request' as const, request_id: hexId(row.request_id, 'request_id'),
      type, operation_id: operation, body: row.body };
  });
  // NET type chưa biết được giao dispatcher cùng ID tin cậy để trả lỗi tương quan.
  // IPC chỉ được gọi API whitelist, không xuất quyền gửi message tùy ý từ UI.
  if (channel === 'IPC') enumeration(request.type, IPC_TYPES, 'type');
  return request;
}

/** @brief Kiểm schema ba lệnh local; chưa thực thi connect/shutdown hoặc giả lập ACK. */
export function localBody(type: string, value: unknown): JsonObject {
  if (type === 'local.connect') {
    const row = exactKeys(value, ['host', 'port']);
    const host = text(row.host, 'host', 7, 15);
    if (isIP(host) !== 4) throw new ValidationError('body', 'INVALID_ARGUMENT', 'host');
    return { host, port: integer(row.port, 1, 65535, 'port') };
  }
  if (type === 'local.status' || type === 'local.shutdown') {
    exactKeys(value, []);
    return {};
  }
  throw new ValidationError('body', 'INVALID_ARGUMENT', 'type');
}

/** @brief Kiểm error base; owner mã lỗi kiểm schema details, không serialize exception thô. */
export function errorDto(value: unknown): JsonObject {
  const row = exactKeys(value, ['code', 'message', 'retry_after_ms', 'details'], [], 'error');
  const code = text(row.code, 'code', 1, 64);
  if (!/^[A-Z][A-Z0-9_]*$/.test(code)) throw new ValidationError('body', 'INVALID_ARGUMENT', 'code');
  return { code, message: text(row.message, 'message', 1, 65536),
    retry_after_ms: row.retry_after_ms === null ? null : integer(row.retry_after_ms, 0, Number.MAX_SAFE_INTEGER, 'retry_after_ms'),
    details: object(row.details, 'details') };
}

/** @brief Kiểm khung response; schema body/details theo type do owner bổ sung trước khi đưa tới UI. */
export function responseEnvelope(value: unknown): JsonObject {
  return boundary(() => {
    const row = exactKeys(value, ['v', 'kind', 'request_id', 'type', 'operation_id', 'ok', 'effect', 'replayed', 'body', 'error']);
    integer(row.v, 1, 1, 'v');
    enumeration(row.kind, ['response'], 'kind');
    hexId(row.request_id, 'request_id');
    text(row.type, 'type', 1, 64);
    if (row.operation_id !== null) hexId(row.operation_id, 'operation_id');
    boolean(row.ok, 'ok');
    enumeration(row.effect, ['NONE', 'APPLIED', 'UNKNOWN'], 'effect');
    boolean(row.replayed, 'replayed');
    if (row.ok) {
      object(row.body);
      if (row.error !== null) throw new ValidationError('boundary', 'RESPONSE_SHAPE');
    } else {
      if (row.body !== null) throw new ValidationError('boundary', 'RESPONSE_SHAPE');
      errorDto(row.error);
    }
    return row;
  });
}

/** @brief Kiểm event base và whitelist theo kênh; schema body do consumer theo type bổ sung. */
export function eventEnvelope(value: unknown, channel: 'NET' | 'IPC'): JsonObject {
  return boundary(() => {
    const row = exactKeys(value, ['v', 'kind', 'type', 'event_seq', 'body']);
    integer(row.v, 1, 1, 'v');
    enumeration(row.kind, ['event'], 'kind');
    const types = channel === 'IPC'
      ? ['local.ready', 'local.connection_changed', 'local.auth_changed', 'room.changed', 'attempt.changed']
      : ['session.revoked', 'room.changed', 'attempt.changed'];
    enumeration(row.type, types, 'type');
    const sequence = text(row.event_seq, 'event_seq', 1, 65536);
    if (/^(?:0|[1-9][0-9]*)$/.exec(sequence)?.[0] !== sequence) {
      throw new ValidationError('boundary', 'EVENT_SEQ');
    }
    object(row.body);
    return row;
  });
}

/** @brief Kiểm NET payload được bọc BP: giới hạn riêng byte và depth vẫn giữ nguyên. */
function netPayload(value: unknown): void {
  checkDepth(value, 16);
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 65536) {
    throw new ValidationError('boundary', 'LENGTH');
  }
}

/** @brief Kiểm envelope BP theo kind; không quyết định authority hoặc thay dispatcher nghiệp vụ. */
export function bpEnvelope(value: unknown): JsonObject {
  const checked = boundary(() => {
    const row = object(value);
    const fields: Record<string, readonly string[]> = {
      init: ['server_config_path'], ready: ['server_instance_id', 'protocol_version', 'bridge_max_payload_bytes'],
      event_credit: ['frames', 'bytes'], opened: ['connection_id', 'generation', 'peer_ip'],
      request: ['connection_id', 'generation', 'payload'], closed: ['connection_id', 'generation', 'reason'],
      binding: ['connection_id', 'generation', 'user_id', 'binding_epoch', 'authenticated'],
      response: ['connection_id', 'generation', 'authority_epoch', 'terminal_auth', 'payload'],
      event: ['connection_id', 'generation', 'authority_epoch', 'type', 'body'],
      close: ['connection_id', 'generation', 'reason'], shutdown: [], stopped: [],
    };
    const kind = enumeration(row.kind, Object.keys(fields), 'kind');
    exactKeys(row, ['bridge_v', 'kind', ...fields[kind]!]);
    integer(row.bridge_v, 1, 1, 'bridge_v');
    if (Object.hasOwn(row, 'connection_id')) id(row.connection_id, 'connection_id');
    if (Object.hasOwn(row, 'generation')) integer(row.generation, 1, 2147483647, 'generation');
    if (Object.hasOwn(row, 'authority_epoch')) nullableId(row.authority_epoch, 'authority_epoch');
    if (Object.hasOwn(row, 'reason')) text(row.reason, 'reason', 1, 64);
    switch (kind) {
      case 'init': {
        const path = text(row.server_config_path, 'server_config_path', 1, 4096);
        if (!isAbsolute(path)) throw new ValidationError('boundary', 'CONFIG_PATH');
        break;
      }
      case 'ready':
        hexId(row.server_instance_id, 'server_instance_id');
        integer(row.protocol_version, 1, 1, 'protocol_version');
        integer(row.bridge_max_payload_bytes, 69632, 69632, 'bridge_max_payload_bytes');
        break;
      case 'event_credit':
        integer(row.frames, 0, 960, 'frames');
        integer(row.bytes, 0, 7864320, 'bytes');
        break;
      case 'opened': {
        const ip = text(row.peer_ip, 'peer_ip', 1, 45);
        if (isIP(ip) === 0) throw new ValidationError('boundary', 'PEER_IP');
        break;
      }
      case 'request':
        netPayload(row.payload);
        break;
      case 'response':
        netPayload(row.payload);
        boolean(row.terminal_auth, 'terminal_auth');
        responseEnvelope(row.payload);
        break;
      case 'binding':
        nullableId(row.user_id, 'user_id');
        nullableId(row.binding_epoch, 'binding_epoch');
        boolean(row.authenticated, 'authenticated');
        break;
      case 'event':
        id(row.authority_epoch, 'authority_epoch');
        enumeration(row.type, ['room.changed', 'attempt.changed'], 'type');
        object(row.body);
        // Lúc bọc thành NET event, root envelope thêm một mức trên body.
        netPayload({ v: 1, kind: 'event', type: row.type, event_seq: '1', body: row.body });
        break;
    }
    // Metadata BP có cap riêng, không tính payload/body của message nghiệp vụ.
    const { payload: _payload, body: _body, ...metadata } = row;
    if (Buffer.byteLength(JSON.stringify(metadata), 'utf8') > 4096) {
      throw new ValidationError('boundary', 'METADATA_LENGTH');
    }
    return row;
  });
  if (checked.kind === 'request') {
    // Envelope BP tin cậy không biến lỗi type/body của NET thành lỗi đóng bridge.
    const request = requestEnvelope(checked.payload, 'NET');
    if (request.type === 'sys.hello' || request.type === 'sys.ping') {
      throw new ValidationError('boundary', 'BP_TYPE');
    }
  }
  return checked;
}

/** @brief Entry point cho payload đã được framer tách; không tự đọc pipe/socket. */
export function decodeEnvelope(bytes: Uint8Array, channel: WireChannel): JsonObject | RequestDto {
  const value = decodeObject(bytes, channel);
  if (channel === 'BP') return bpEnvelope(value);
  if (value.kind === 'request') return requestEnvelope(value, channel);
  if (value.kind === 'response') {
    const response = responseEnvelope(value);
    return boundary(() => {
      enumeration(response.type, channel === 'IPC' ? IPC_TYPES : NET_TYPES, 'type');
      return response;
    });
  }
  if (value.kind === 'event') return eventEnvelope(value, channel);
  throw new ValidationError('boundary', 'KIND');
}
