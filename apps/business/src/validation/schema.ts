/** Lỗi có cấu trúc: chỉ giữ tên field/lý do cố định, không giữ giá trị đầu vào. */
export class ValidationError extends Error {
  /** @brief Tạo lỗi an toàn để consumer phân biệt lỗi stream với body sai. */
  constructor(
    readonly layer: 'boundary' | 'body' | 'source',
    readonly reason: string,
    readonly field: string | null = null,
  ) {
    super(`Validation failed: ${reason}`);
    this.name = 'ValidationError';
  }
}

export type JsonObject = Record<string, unknown>;

/** @brief Từ chối schema sai; field do schema truyền vào, không lấy key lạ từ input. */
export function invalid(field: string): never {
  throw new ValidationError('body', 'INVALID_ARGUMENT', field);
}

/** @brief Nhận object thường có own properties; không nhận null/array/class instance. */
export function object(value: unknown, field = 'body'): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid(field);
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid(field);
  return value as JsonObject;
}

/** @brief Kiểm own keys và required; không bỏ qua key lạ hoặc xem null là thiếu. */
export function exactKeys(value: unknown, required: readonly string[], optional: readonly string[] = [], field = 'body'): JsonObject {
  const result = object(value, field);
  if (Object.keys(result).some((key) => !required.includes(key) && !optional.includes(key))) invalid(field);
  for (const key of required) {
    if (!Object.hasOwn(result, key)) invalid(key);
  }
  return result;
}

/** @brief Kiểm số nguyên theo giá trị, không ép kiểu chuỗi hoặc làm tròn. */
export function integer(value: unknown, min: number, max: number, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) invalid(field);
  return value;
}

/** @brief Giữ nguyên ID int64 dưới dạng string để không mất chính xác qua Number. */
export function id(value: unknown, field: string): string {
  if (typeof value !== 'string' || /^[1-9][0-9]{0,18}$/.exec(value)?.[0] !== value ||
      BigInt(value) > 9223372036854775807n) invalid(field);
  return value;
}

/** @brief Đọc ID nullable; undefined vẫn sai, caller phải kiểm required riêng. */
export function nullableId(value: unknown, field: string): string | null {
  return value === null ? null : id(value, field);
}

/** @brief Kiểm enum phân biệt hoa thường, không coercion. */
export function enumeration<T extends string>(value: unknown, choices: readonly T[], field: string): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) invalid(field);
  return value as T;
}

/** @brief Kiểm boolean thực, không nhận 0/1 hoặc chuỗi. */
export function boolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') invalid(field);
  return value;
}

/** @brief Kiểm chuỗi Unicode scalar, cấm NUL; byte limit tính sau decode/trim ASCII. */
export function text(value: unknown, field: string, min: number, max: number,
                     options: { trim?: boolean; allowLineTab?: boolean } = {}): string {
  if (typeof value !== 'string' || !value.isWellFormed()) invalid(field);
  const result = options.trim ? value.replace(/^[\x09-\x0d\x20]+|[\x09-\x0d\x20]+$/g, '') : value;
  const controls = options.allowLineTab ? /[\x00-\x08\x0b-\x1f\x7f]/ : /[\x00-\x1f\x7f]/;
  if (controls.test(result)) invalid(field);
  const bytes = Buffer.byteLength(result, 'utf8');
  if (bytes < min || bytes > max) invalid(field);
  return result;
}

/** @brief Default chỉ khi field không hiện diện; null/undefined hiện diện phải qua schema. */
export function optionalInteger(record: JsonObject, field: string, fallback: number, min: number, max: number): number {
  return Object.hasOwn(record, field) ? integer(record[field], min, max, field) : fallback;
}

/** @brief Kiểm ID ngẫu nhiên 128 bit dưới dạng 32 hex thường. */
export function hexId(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length !== 32 || !/^[0-9a-f]+$/.test(value)) invalid(field);
  return value;
}
