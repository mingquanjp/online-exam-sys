# Vector validation C/TypeScript

Nguồn 03 §3.1/5.1 và PT-24. Không chứa credential/key thật.

- `wire-vectors.json`: 35 input nguyên văn (`raw`) hoặc byte (`hex` cho UTF-8
  sai), kênh và expected_reason. Null nghĩa guard JSON chấp nhận, không khẳng
  định envelope/body hợp lệ. Một số vector cố ý có field không thuộc schema.
- `schema-vectors.json`: 12 raw object cho schema ví dụ page có required
  after_id nullable và optional limit 1..20/default 20; expected là DTO sau
  normalize/default hoặc error_field với INVALID_ARGUMENT ở tầng body.
- `check-schema-vectors.mjs`: adapter test Node/main, không phải validator thứ
  hai. C viết adapter tương ứng ở T44; so byte/string ID/giá trị nguyên/default,
  không bắt enum lỗi nội bộ C có cùng giá trị số với TS.

NET/IPC depth tính root object=1, BP=18 nhưng payload NET có root riêng=1/max16.
Các ca envelope/BP/IPC source đang được kiểm thêm trong business/desktop tests.
C chưa chạy những vector này; không ghi PT-24 toàn phần PASS hoặc canonical hash
đạt từ expected DTO ở đây. Fingerprint thuộc T45.
