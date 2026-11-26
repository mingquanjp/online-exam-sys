import test from 'node:test';
import assert from 'node:assert/strict';
import { assertIpcSource, validateIpcCall } from '../.test-output/apps/desktop/src/main/ipc-validation.js';
import { decodeObject } from '../.test-output/apps/business/src/validation/strict-json.js';
import { readFileSync } from 'node:fs';

const url = 'http://127.0.0.1:5173/';
const frame = { url };
const contents = { mainFrame: frame };
const event = { sender: contents, senderFrame: frame };
const request = (type = 'local.status', body = {}) => ({ v: 1, kind: 'request', request_id: 'a'.repeat(32), type, operation_id: null, body });

test('main dùng cùng bộ wire vectors, không copy validator', () => {
  const vectors = JSON.parse(readFileSync(new URL('../../../tests/fixtures/validation/wire-vectors.json', import.meta.url)));
  for (const vector of vectors) {
    const bytes = vector.hex ? Buffer.from(vector.hex, 'hex') : Buffer.from(vector.raw);
    if (vector.expected_reason) assert.throws(() => decodeObject(bytes, vector.channel), (e) => e.reason === vector.expected_reason);
    else decodeObject(bytes, vector.channel);
  }
});

test('nguồn đúng WebContents, mainFrame và URL; hash route được phép', () => {
  assertIpcSource(event, contents, url);
  frame.url = url + '#/login';
  assertIpcSource(event, contents, url);
  frame.url = url;
  for (const bad of [
    { sender: {}, senderFrame: frame },
    { sender: contents, senderFrame: null },
    { sender: contents, senderFrame: { url } },
  ]) assert.throws(() => assertIpcSource(bad, contents, url), (e) => e.layer === 'source');
  for (const bad of ['http://127.0.0.1:5173.evil/', 'http://127.0.0.1:5173/other', 'https://evil.test', url + '?x=1', 'not-a-url']) {
    frame.url = bad;
    assert.throws(() => assertIpcSource(event, contents, url), (e) => e.layer === 'source');
  }
  frame.url = url;
});

test('production file URL phải khớp file ứng dụng, không chỉ origin file://', () => {
  frame.url = 'file:///Applications/Exam/renderer/index.html';
  assertIpcSource(event, contents, frame.url);
  assert.throws(() => assertIpcSource(event, contents, 'file:///tmp/other.html'));
  frame.url = url;
});

test('guard source chạy trước schema, không nhận API tùy ý hoặc NET-only', () => {
  assert.equal(validateIpcCall(event, contents, url, request()).type, 'local.status');
  assert.deepEqual(validateIpcCall(event, contents, url, request('local.connect', { host: '127.0.0.1', port: 1234 })).body, { host: '127.0.0.1', port: 1234 });
  for (const type of ['auth.resume', 'sys.ping', 'execute', 'ipcRenderer.invoke']) assert.throws(() => validateIpcCall(event, contents, url, request(type)));
  assert.throws(() => validateIpcCall({ ...event, senderFrame: null }, contents, url, null), (e) => e.layer === 'source');
  assert.throws(() => validateIpcCall(event, contents, url, request('local.status', { token: 'secret' })), (e) => e.layer === 'body');
});

test('object renderer vẫn bị kiểm byte/depth/Unicode trước serialize sang pipe', () => {
  const body = {}; body.self = body;
  assert.throws(() => validateIpcCall(event, contents, url, request('room.list', body)), (e) => e.reason === 'DEPTH');
  assert.throws(() => validateIpcCall(event, contents, url, request('room.list', { x: 1n })), (e) => e.layer === 'body');
  assert.throws(() => validateIpcCall(event, contents, url, request('room.list', { x: '\ud800' })), (e) => e.reason === 'STRING_ESCAPE');
  assert.throws(() => validateIpcCall(event, contents, url, request('room.list', { x: 'x'.repeat(65536) })), (e) => e.reason === 'LENGTH');
});

test('main chạy cùng schema vectors và expected DTO sau default', async () => {
  const { checkSchemaVectors } = await import('../../../tests/fixtures/validation/check-schema-vectors.mjs');
  const schema = await import('../.test-output/apps/business/src/validation/schema.js');
  checkSchemaVectors(decodeObject, schema);
});
