import type { IpcMainInvokeEvent, WebContents } from 'electron';
import { checkDepth, decodeObject } from '../../../business/src/validation/strict-json.js';
import { ValidationError } from '../../../business/src/validation/schema.js';
import { requestEnvelope, localBody, LOCAL_TYPES, type RequestDto } from '../../../business/src/validation/envelope.js';

/**
 * @brief Chỉ nhận IPC từ main frame của cửa sổ và URL renderer do ứng dụng đã chọn.
 * @param event Metadata do Electron cung cấp, không lấy từ body renderer.
 * @param contents WebContents của cửa sổ được phép gọi API.
 * @param rendererUrl URL đầy đủ của UI dev hoặc file đóng gói; so chính xác, cho phép hash UI.
 * @note Consumer gọi trước mọi handler. Không dựa riêng vào origin file:// hoặc URL prefix.
 */
export function assertIpcSource(event: Pick<IpcMainInvokeEvent, 'sender' | 'senderFrame'>,
                                contents: WebContents, rendererUrl: string): void {
  const frame = event.senderFrame;
  if (event.sender !== contents || frame === null || frame !== contents.mainFrame) {
    throw new ValidationError('source', 'IPC_SOURCE');
  }
  let actual: URL;
  let expected: URL;
  try { actual = new URL(frame.url); expected = new URL(rendererUrl); } catch {
    throw new ValidationError('source', 'IPC_SOURCE');
  }
  actual.hash = '';
  expected.hash = '';
  if (actual.href !== expected.href) throw new ValidationError('source', 'IPC_SOURCE');
}

/**
 * @brief Guard cho consumer đăng ký IPC: kiểm source rồi request whitelist/schema local.
 * @note Không xuất invoke tùy ý qua preload. Owner handler kiểm schema body nghiệp vụ
 * và phân quyền server; guard này không mở pipe hoặc trả ACK connect/shutdown giả.
 */
export function validateIpcCall(event: Pick<IpcMainInvokeEvent, 'sender' | 'senderFrame'>,
                                contents: WebContents, rendererUrl: string, value: unknown): RequestDto {
  assertIpcSource(event, contents, rendererUrl);
  const request = requestEnvelope(value, 'IPC');
  // Object từ structured clone không có duplicate key; vẫn kiểm depth/byte/escape
  // trước khi consumer serialize sang pipe. Không nhận cycles hoặc BigInt.
  checkDepth(request, 16);
  try {
    decodeObject(Buffer.from(JSON.stringify(request), 'utf8'), 'IPC');
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('body', 'INVALID_ARGUMENT', 'body');
  }
  if ((LOCAL_TYPES as readonly string[]).includes(request.type)) {
    request.body = localBody(request.type, request.body);
  }
  return request;
}
