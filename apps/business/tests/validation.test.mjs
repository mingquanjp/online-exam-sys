import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeObject, checkDepth } from '../dist/validation/strict-json.js';
import * as schema from '../dist/validation/schema.js';
import { requestEnvelope, localBody, bpEnvelope, decodeEnvelope, responseEnvelope, errorDto } from '../dist/validation/envelope.js';

const vectors = JSON.parse(readFileSync(new URL('../../../tests/fixtures/validation/wire-vectors.json', import.meta.url)));
const request = (type = 'room.list', body = {}) => ({ v: 1, kind: 'request', request_id: '1'.repeat(32), type, operation_id: null, body });
const fails = (fn, layer, reason) => assert.throws(fn, (e) => e instanceof schema.ValidationError && e.layer === layer && (!reason || e.reason === reason));

for (const vector of vectors) {
  test(`wire: ${vector.name}`, () => {
    const bytes = vector.hex ? Buffer.from(vector.hex, 'hex') : Buffer.from(vector.raw);
    if (vector.expected_reason) fails(() => decodeObject(bytes, vector.channel), 'boundary', vector.expected_reason);
    else assert.equal(typeof decodeObject(bytes, vector.channel), 'object');
  });
}

test('cap theo kênh đếm byte, không đếm ký tự', () => {
  for (const [channel, cap] of [['NET', 65536], ['IPC', 65536], ['BP', 69632]]) {
    const raw = '{"x":"' + 'x'.repeat(cap - 8) + '"}';
    assert.equal(Buffer.byteLength(raw), cap);
    assert.equal(typeof decodeObject(Buffer.from(raw), channel), 'object');
    fails(() => decodeObject(Buffer.from(raw + ' '), channel), 'boundary', 'LENGTH');
  }
  fails(() => decodeObject(Buffer.from('{'), 'NET'), 'boundary', 'LENGTH');
});

test('required/optional/null/default và exact keys', () => {
  const readPage = (input) => {
    const row = schema.exactKeys(input, ['after_id'], ['limit']);
    return { after_id: schema.nullableId(row.after_id, 'after_id'), limit: schema.optionalInteger(row, 'limit', 20, 1, 20) };
  };
  assert.deepEqual(readPage({ after_id: null }), { after_id: null, limit: 20 });
  assert.deepEqual(readPage({ after_id: '9007199254740993', limit: 1 }), { after_id: '9007199254740993', limit: 1 });
  for (const bad of [{}, { after_id: null, limit: null }, { after_id: null, limit: undefined }, { after_id: null, limit: 0 }, { after_id: null, limit: 21 }, { after_id: null, Limit: 1 }]) {
    fails(() => readPage(bad), 'body', 'INVALID_ARGUMENT');
  }
  const inherited = Object.create({ after_id: null });
  fails(() => readPage(inherited), 'body');
  fails(() => schema.exactKeys(JSON.parse('{"__proto__":{}}'), []), 'body');
  assert.equal({}.polluted, undefined);
});

test('integer theo giá trị và ID int64 không qua Number', () => {
  for (const raw of ['1', '1.0', '1e0']) assert.equal(schema.integer(JSON.parse(raw), 0, 10, 'n'), 1);
  for (const value of [1.5, '1', NaN, Infinity, -1, 11, Number.MAX_SAFE_INTEGER + 1]) fails(() => schema.integer(value, 0, 10, 'n'), 'body');
  for (const value of ['1', '9007199254740993', '9223372036854775807']) assert.equal(schema.id(value, 'id'), value);
  for (const value of ['0', '01', '-1', '1.0', '9223372036854775808', '1\n', '1\u2028', 9007199254740992, null]) fails(() => schema.id(value, 'id'), 'body');
});

test('text bytes/trim/control/password và enum/boolean', () => {
  assert.equal(schema.text('  tiếng Việt  ', 'name', 1, 100, { trim: true }), 'tiếng Việt');
  assert.equal(schema.text(' é ', 'password', 1, 4), ' é ');
  fails(() => schema.text('é', 'name', 1, 1), 'body');
  fails(() => schema.text('\ud800', 'name', 1, 100), 'body');
  fails(() => schema.text('abc\0', 'password', 1, 128), 'body');
  assert.equal(schema.text('a\n\tb', 'prompt', 1, 100, { allowLineTab: true }), 'a\n\tb');
  fails(() => schema.text('a\rb', 'prompt', 1, 100, { allowLineTab: true }), 'body');
  assert.equal(schema.enumeration('A', ['A', 'B'], 'option'), 'A');
  fails(() => schema.enumeration('a', ['A', 'B'], 'option'), 'body');
  fails(() => schema.boolean(1, 'active'), 'body');
});

test('request envelope whitelist và operation_id theo R/W', () => {
  assert.equal(requestEnvelope(request(), 'IPC').type, 'room.list');
  const write = { ...request('answer.save'), operation_id: 'a'.repeat(32) };
  assert.equal(requestEnvelope(write, 'NET').operation_id, 'a'.repeat(32));
  fails(() => requestEnvelope(request('answer.save'), 'NET'), 'boundary', 'OPERATION_ID');
  fails(() => requestEnvelope({ ...request(), operation_id: 'a'.repeat(32) }, 'NET'), 'boundary', 'OPERATION_ID');
  for (const type of ['auth.resume', 'sys.ping', 'sys.hello', 'execute', 'Room.list']) fails(() => requestEnvelope(request(type), 'IPC'), 'body');
  assert.equal(requestEnvelope(request('sys.hello'), 'NET').type, 'sys.hello');
  assert.equal(requestEnvelope(request('unknown.type'), 'NET').type, 'unknown.type');
  fails(() => requestEnvelope({ ...request(), session: 'secret' }, 'IPC'), 'boundary');
  fails(() => requestEnvelope({ ...request(), v: 2 }, 'NET'), 'boundary', 'UNSUPPORTED_VERSION');
  fails(() => requestEnvelope({ ...request(), request_id: 'A'.repeat(32) }, 'NET'), 'boundary');
});

test('body sai chỉ INVALID_ARGUMENT sau envelope tin cậy; không lộ input', () => {
  const value = request('local.connect', { host: '127.0.0.1', port: 0 });
  const dto = decodeEnvelope(Buffer.from(JSON.stringify(value)), 'IPC');
  fails(() => localBody(dto.type, dto.body), 'body', 'INVALID_ARGUMENT');
  assert.deepEqual(localBody('local.connect', { host: '192.168.1.5', port: 65535 }), { host: '192.168.1.5', port: 65535 });
  for (const bad of [null, { extra: 'secret' }]) fails(() => localBody('local.status', bad), 'body');
  assert.deepEqual(localBody('local.shutdown', {}), {});
  for (const host of ['localhost', '127.0.0.01', '127.1', '::1', 'http://127.0.0.1']) fails(() => localBody('local.connect', { host, port: 123 }), 'body');
  try { schema.exactKeys({ 'secret-password': 'secret-value' }, []); } catch (e) {
    assert.equal(JSON.stringify(e).includes('secret'), false);
    assert.equal(e.message.includes('secret'), false);
  }
});

test('BP root depth 18 nhưng payload NET vẫn root depth 16', () => {
  const nest = (depth) => { let value = {}; for (let i = 1; i < depth; i++) value = { a: value }; return value; };
  checkDepth(nest(16), 16);
  fails(() => checkDepth(nest(17), 16), 'boundary', 'DEPTH');
  const bp = (body) => ({ bridge_v: 1, kind: 'request', connection_id: '1', generation: 1, payload: request('room.list', body) });
  // body depth 15 + NET root = 16; BP root thêm một mức.
  decodeEnvelope(Buffer.from(JSON.stringify(bp(nest(15)))), 'BP');
  fails(() => decodeEnvelope(Buffer.from(JSON.stringify(bp(nest(16)))), 'BP'), 'boundary', 'DEPTH');
  assert.equal(bpEnvelope({ bridge_v: 1, kind: 'shutdown' }).kind, 'shutdown');
  fails(() => bpEnvelope({ bridge_v: 1, kind: 'shutdown', body: {} }), 'boundary');
  fails(() => bpEnvelope({ bridge_v: 1, kind: 'request', connection_id: 1, generation: 1, payload: request() }), 'boundary');
});

test('BP base schemas cho lifecycle/control và authority', () => {
  const samples = [
    { kind: 'init', server_config_path: '/tmp/server.json' },
    { kind: 'ready', server_instance_id: 'a'.repeat(32), protocol_version: 1, bridge_max_payload_bytes: 69632 },
    { kind: 'event_credit', frames: 960, bytes: 7864320 },
    { kind: 'opened', connection_id: '1', generation: 1, peer_ip: '::1' },
    { kind: 'closed', connection_id: '1', generation: 1, reason: 'EOF' },
    { kind: 'close', connection_id: '1', generation: 1, reason: 'PROTOCOL_ERROR' },
    { kind: 'binding', connection_id: '1', generation: 1, user_id: null, binding_epoch: null, authenticated: false },
    { kind: 'event', connection_id: '1', generation: 1, authority_epoch: '1', type: 'room.changed', body: { room_id: '1', reason: 'STARTED' } },
    { kind: 'stopped' },
  ];
  for (const value of samples) assert.equal(bpEnvelope({ bridge_v: 1, ...value }).kind, value.kind);
  fails(() => bpEnvelope({ bridge_v: 1, kind: 'init', server_config_path: 'relative.json' }), 'boundary');
  fails(() => bpEnvelope({ bridge_v: 1, kind: 'event_credit', frames: 961, bytes: 0 }), 'boundary');
  fails(() => bpEnvelope({ bridge_v: 1, kind: 'init', server_config_path: '/' + 'é'.repeat(2047) }), 'boundary', 'METADATA_LENGTH');
});

test('response/error base không nhận body lỗi hoặc error null trái trạng thái', () => {
  const error = { code: 'INVALID_ARGUMENT', message: 'Dữ liệu không hợp lệ.', retry_after_ms: null, details: {} };
  assert.deepEqual(errorDto(error), error);
  const response = { ...request(), kind: 'response', ok: false, effect: 'NONE', replayed: false, body: null, error };
  assert.equal(responseEnvelope(response).ok, false);
  assert.equal(bpEnvelope({ bridge_v: 1, kind: 'response', connection_id: '1', generation: 1, authority_epoch: null, terminal_auth: false, payload: response }).kind, 'response');
  fails(() => responseEnvelope({ ...response, body: {} }), 'boundary');
  fails(() => responseEnvelope({ ...response, error: null }), 'boundary');
  fails(() => errorDto({ ...error, stack: 'secret' }), 'body');
});

test('event whitelist theo kênh; không relay event NET tùy ý sang renderer', () => {
  const event = { v: 1, kind: 'event', type: 'local.ready', event_seq: '1', body: { client_version: '0.1.0', protocol_version: 1 } };
  assert.equal(decodeEnvelope(Buffer.from(JSON.stringify(event)), 'IPC').kind, 'event');
  fails(() => decodeEnvelope(Buffer.from(JSON.stringify(event)), 'NET'), 'boundary');
  fails(() => decodeEnvelope(Buffer.from(JSON.stringify({ ...event, type: 'custom.event' })), 'IPC'), 'boundary');
  fails(() => decodeEnvelope(Buffer.from(JSON.stringify({ ...event, event_seq: '01' })), 'IPC'), 'boundary');
  const response = { ...request('auth.resume'), kind: 'response', ok: true, effect: 'APPLIED', replayed: false, error: null };
  fails(() => decodeEnvelope(Buffer.from(JSON.stringify(response)), 'IPC'), 'boundary');
});

test('NET payload byte cap trong BP và phân biệt BP lỗi với type NET không hỗ trợ', () => {
  const bp = (payload) => ({ bridge_v: 1, kind: 'request', connection_id: '1', generation: 1, payload });
  fails(() => decodeEnvelope(Buffer.from(JSON.stringify(bp(request('room.list', { x: 'x'.repeat(65536) })))), 'BP'), 'boundary', 'LENGTH');
  assert.equal(bpEnvelope(bp(request('unknown.type'))).payload.type, 'unknown.type');
  fails(() => bpEnvelope(bp(request('sys.hello'))), 'boundary', 'BP_TYPE');
});

test('schema vectors bàn giao C: required/null/default/integer/ID', async () => {
  const { checkSchemaVectors } = await import('../../../tests/fixtures/validation/check-schema-vectors.mjs');
  checkSchemaVectors(decodeObject, schema);
});
