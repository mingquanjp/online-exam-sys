# Config vectors — SCRUM-9 / V03 DRAFT

Nguồn: [bảng config](../../../config/README.md#v03--bảng-cấu-hình-đề-xuất-scrum-9).
**Chờ review/nhóm xác nhận V03; C/TS loader runtime NOT_RUN.**

`manifest.json` liệt kê input nguyên văn, loại server/client, absolute config path
giả định và expected accept/reject. `expected/*.json` là effective config đầy đủ
sau default và lexical path resolution của ca accepted. Các đường `/workspace/…`
chỉ là fixture, không đọc/ghi DB hay kiểm executable thật ở đó.

## Cách consumer T47 sử dụng

1. Đọc **raw bytes** `inputs/*.json`, không parse/serialize lại bằng test runner
   trước khi đưa vào loader: việc đó sẽ mất duplicate key và JSON sai.
2. C và TS chạy cùng input/config_path, đối chiếu accept/reject và effective config.
   Với accepted, trường có default phải xuất hiện đúng trong effective config;
   path resolve từ config dir, không phụ thuộc cwd.
3. Rejected phải dừng boundary config; startup không listen. `category` và `field`
   là expected diagnostic ngữ nghĩa, không yêu cầu code lỗi public hay nguyên văn
   stderr. `alternatives` cho phép một trong các lỗi thật khi input vi phạm nhiều
   điều kiện, không buộc thứ tự validate.
4. `path_contexts` yêu cầu cùng kết quả khi đổi cwd với cùng absolute config path.
   Filesystem/executable/DB/lock/BP init encoded size cần ca startup riêng của
   T09/T47; các fixtures chỉ kiểm schema/default/path transformation.
5. Chỉ ghi runtime PASS sau chạy **cả loader thật** ở boundary liên quan. Khi nhóm
   đổi bound/default, sửa contract + expected + fixtures trong cùng thay đổi.

## Nội dung

Từ repo root, kiểm inventory, đủ trường bảng config và expected default/path:

```sh
python3 tests/fixtures/config/check_inventory.py
```

Lệnh này **không chạy validator** và không kiểm rejection/runtime. Nó chỉ phát
hiện thiếu fixture, expected bị lệch mẫu/default/path hoặc trường config thiếu
trong bảng. Các kết luận runtime vẫn NOT_RUN dù lệnh đạt STATIC PASS.

43 ca ban đầu: 10 accepted, 33 rejected. Gồm full/minimal/default, port 1/65535,
startup/shutdown 1000/60000, integer theo giá trị, absolute/relative path và
khoảng trắng trong path; thiếu/unknown/case-sensitive/duplicate key, null/type,
bound cố định, quan hệ queue/heartbeat/unauth và JSON lỗi/trailing/NUL.

Các ca relation có thể bị từ chối sớm vì fixed bound: kết quả đó **không chứng
minh nhánh relation runtime đã được chạy**. T47 cần unit test helper relation nếu
implementation có nhánh đó, không nới config production để tạo input hợp lệ giả.
Đây không phải corpus đầy đủ PT-24: UTF-8 lỗi/depth/surrogate/envelope và validator
runtime thuộc T44/T04. Không có secret hoặc key đáp án thật trong fixture.
