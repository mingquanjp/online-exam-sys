// Adapter kiểm fixture cho Node/main; C dùng cùng raw/expected và accessor của C ở T44.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

/** Kiểm input nguyên văn và DTO sau default; không triển khai canonical/fingerprint. */
export function checkSchemaVectors(decode, schema) {
  const vectors = JSON.parse(readFileSync(new URL('./schema-vectors.json', import.meta.url)));
  for (const vector of vectors) {
    const normalize = () => {
      const row = schema.exactKeys(decode(Buffer.from(vector.raw), 'NET'), ['after_id'], ['limit']);
      return { after_id: schema.nullableId(row.after_id, 'after_id'), limit: schema.optionalInteger(row, 'limit', 20, 1, 20) };
    };
    if (vector.error_field) {
      assert.throws(normalize, (error) => error.layer === 'body' && error.reason === 'INVALID_ARGUMENT' && error.field === vector.error_field, vector.name);
    } else {
      assert.deepEqual(normalize(), vector.expected, vector.name);
    }
  }
}
