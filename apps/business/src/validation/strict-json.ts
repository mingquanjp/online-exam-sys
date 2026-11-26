import { TextDecoder } from 'node:util';
import { ValidationError, type JsonObject } from './schema.js';

export type WireChannel = 'NET' | 'IPC' | 'BP';

/** @brief Giới hạn wire đã chốt; không nhận cap do peer tự khai. */
export function channelLimits(channel: WireChannel): { bytes: number; depth: number } {
  return channel === 'BP' ? { bytes: 69632, depth: 18 } : { bytes: 65536, depth: 16 };
}

/** @brief Quét guard JSON trước parse để không mất duplicate decoded keys; không tạo cây dữ liệu.
 * @note JSON.parse vẫn chịu trách nhiệm tạo object. Mọi lỗi đều bỏ nội dung input.
 */
export function decodeObject(bytes: Uint8Array, channel: WireChannel): JsonObject {
  const limits = channelLimits(channel);
  const fail = (reason: string): never => { throw new ValidationError('boundary', reason); };
  if (bytes.byteLength < 2 || bytes.byteLength > limits.bytes) fail('LENGTH');
  let source: string;
  try {
    // Giữ BOM để từ chối tường minh, không để decoder tự bỏ byte này.
    source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return fail('UTF8');
  }
  let offset = 0;
  /** @brief Bỏ đúng bốn JSON whitespace, không nhận BOM hoặc Unicode whitespace khác. */
  function whitespace(): void {
    while (offset < source.length && ' \t\r\n'.includes(source[offset]!)) offset++;
  }
  /** @brief Decode riêng token string để so key và kiểm Unicode, không parse cả object sớm. */
  function string(): string {
    const start = offset++;
    while (offset < source.length) {
      const char = source[offset++]!;
      if (char === '\\') { offset++; continue; }
      if (char !== '"') continue;
      let decoded: unknown;
      try { decoded = JSON.parse(source.slice(start, offset)); } catch { return fail('JSON'); }
      if (typeof decoded !== 'string') return fail('JSON');
      if (!decoded.isWellFormed() || decoded.includes('\0')) return fail('STRING_ESCAPE');
      return decoded;
    }
    return fail('JSON');
  }
  /** @brief Đi qua cấu trúc để kiểm depth/key trùng; không giữ AST hoặc giá trị nghiệp vụ. */
  function value(parentDepth: number): void {
    whitespace();
    const char = source[offset];
    if (char === '{' || char === '[') {
      const depth = parentDepth + 1;
      if (depth > limits.depth) fail('DEPTH');
      const isObject = char === '{';
      const end = isObject ? '}' : ']';
      const keys = new Set<string>();
      offset++;
      whitespace();
      if (source[offset] === end) { offset++; return; }
      while (offset < source.length) {
        if (isObject) {
          if (source[offset] !== '"') fail('JSON');
          const key = string();
          if (keys.has(key)) fail('DUPLICATE_KEY');
          keys.add(key);
          whitespace();
          if (source[offset++] !== ':') fail('JSON');
        }
        value(depth);
        whitespace();
        const delimiter = source[offset++];
        if (delimiter === end) return;
        if (delimiter !== ',') fail('JSON');
        whitespace();
      }
      fail('JSON');
    } else if (char === '"') {
      string();
    } else {
      const token = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(source.slice(offset));
      if (!token) return fail('JSON');
      offset += token[0].length;
    }
  }
  value(0);
  whitespace();
  if (offset !== source.length) fail('JSON');
  let parsed: unknown;
  try { parsed = JSON.parse(source); } catch { return fail('JSON'); }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return fail('ROOT');
  return parsed as JsonObject;
}

/** @brief Kiểm lại depth của NET payload nằm trong BP, root payload được tính là 1. */
export function checkDepth(value: unknown, max: number, depth = 0): void {
  if (value === null || typeof value !== 'object') return;
  const next = depth + 1;
  if (next > max) throw new ValidationError('boundary', 'DEPTH');
  for (const child of Object.values(value)) checkDepth(child, max, next);
}
