# SCRUM-9 — Bàn giao và bằng chứng tự kiểm

Ngày: 22/11/2026. Nguyễn Minh Quân thực hiện với Codex.
Cập nhật 23/11/2026: xử lý hai góp ý về TX class và control counter cục bộ theo
hướng nhóm đồng ý; chưa thay cho review chéo của Hoàng Quân hoặc duyệt V03.
Branch: `feature/SCRUM-9-shared-contracts`, xuất phát `ce5755d` trên
`feature/project-foundation`; working tree sạch khi bắt đầu. Local main còn ở
commit nền ban đầu `a03caf2`; chưa xác minh PR foundation đã merge trên remote.
Không tự merge/reset main hoặc coi foundation là phần chức năng SCRUM-9.
Chuẩn bị PR ngày 23/11/2026: đã fetch origin và xác minh PR nền #1 đã merge;
`origin/main` ở `589c98a`, chứa baseline `ce5755d`. PR SCRUM-9 dùng base main,
không mang lại các commit scaffold của foundation.

## Mục tiêu, nguồn và phạm vi

[Ticket nguồn EXAM-T01](sprint-1-tickets.md#exam-t01) tương ứng
[SCRUM-9](https://ltm-project.atlassian.net/browse/SCRUM-9) theo mapping workflow
và ticket người dùng cung cấp. Không gọi Jira API trong task này.

Baseline đọc tại `ce5755d`: 01 v1.8 AC-28/30; 02 v2.0 §5/7–9/11;
03 v0.8 §2/3/10–12/13.5/18; 05 v0.7 §4; config samples/README;
review 17/11 F08/F09 và gate F10 của T06. Không sửa nghiệp vụ, wire, dependency,
estimate, phân công hoặc ticket description.

Đầu ra:

- [Interface nền](shared-interface-contracts.md): C RX/TX/BP, schema/error và
  Node DB/clock/activity/generator/finalizer/receipt; ownership/transaction.
- [V03](../../config/README.md#v03--bảng-cấu-hình-đề-xuất-scrum-9): đủ 20 server
  + 6 client fields, required/default/bound/quan hệ/owner. Giữ default mẫu.
- [Config fixtures](../../tests/fixtures/config/README.md): 43 input nguyên văn,
  10 expected effective configs, manifest và checker inventory/default/path.
- Link từ các mục liên quan 02/03/05 và tests/README, không viết lại năm tài liệu.
- Sau review: `tx_enqueue` nhận TX_NORMAL/TX_CONTROL từ caller đã validate;
  control BP dùng counter TX/RX độc lập, có mốc trả buffer cụ thể. Đồng bộ 02/03
  và dự toán 04: 15 MiB credit thường + 2 MiB control hai đầu/hai chiều, không
  gọi cap cục bộ là cap end-to-end. Giữ 16 MiB dự toán bản sao, subtotal tăng
  1 MiB thành khoảng 114.5/129.1 MiB; đây vẫn là dự toán, không là số đo RSS.

## Tự kiểm thực tế

Môi trường: macOS / Darwin arm64, Python 3.9.6; không chạy DB/migration/socket.
Từ repo root:

```sh
python3 tests/fixtures/config/check_inventory.py
python3 tools/jira/prepare_backlog.py
git diff --check
```

| Kiểm tra | Kết quả / giới hạn |
| --- | --- |
| Inventory/bảng config/default/path fixture | STATIC PASS: bảng đủ 26 trường khớp mẫu; 43 input có manifest, không orphan; 10 expected khớp defaults mẫu + override + lexical resolve path. Checker không chạy validator/rejection hay cwd runtime. |
| Backlog offline | PASS_LOCAL_VALIDATION: 4 Epic, 65 ticket, 86 coverage refs, 101 dependency edges, không cycle; Jira mutations=0. |
| Whitespace diff | PASS `git diff --check`; kiểm file mới bằng static/link checker riêng trước bàn giao. |
| Canonical vector gốc | Kiểm Python hashlib: 107 byte, SHA-256 khớp 03 §13.5; không thay vector hoặc chạy production canonical codec. |
| BP số học | 50×69636=3481800; floor(7864320/69636)=112; response + event credit cùng pool, không lấy 112 làm admission guarantee. Đây là số học/đối chiếu contract. |
| Links và file mới | Kiểm đường dẫn local trong Markdown và whitespace file mới; không kiểm mạng, không xác nhận fragment/render của mọi Markdown viewer. |

Tự đối chiếu tài liệu: enqueue FULL giữ ownership caller; partial send giữ offset;
receipt lookup không bắt mở write transaction chỉ để replay; reserve cùng ref là
no-op; nộp sớm không release activity phòng; start lỗi rollback tất cả đề; timer
sau commit; auth response reservation chỉ một lần; parse BP chưa trả credit;
terminal auth không mở ngoại lệ cho domain response.

Đối chiếu bổ sung 23/11: TX class không lên wire/không parse JSON trong TX;
normal không lấy reserve, control vẫn chịu tổng slot/byte và FIFO. BP request/
response/event (kể cả auth response) là normal; lifecycle control theo whitelist
03 §18.2. TX control partial giữ charge; Node giữ tới write callback/cleanup,
không trả chỉ từ `write()`/`drain`. RX giữ tới xử lý xong/hết giữ buffer. Counter
hai đầu không ACK/mirror; response reservation/event credit giữ mốc trả cũ.
Năm ca biên được ghi tại interface §4.2 và đối chiếu tĩnh với 03 §12/18.4;
không gọi đây là thực thi `tx_enqueue` hay test pipe/Writable.

## Truy vết nghiệm thu, không thay runtime

| Ref / đầu ra | Trạng thái hiện tại | Còn cần |
| --- | --- | --- |
| Interface/schema/ownership | Soạn và tự đối chiếu xong; chưa human review | Hoàng Quân review DB/credit/canonical và interface phía TX/B |
| F08 / V03 | DRAFT — chưa nhóm duyệt | Hai thành viên xác nhận bound/quan hệ/string rules; cập nhật nếu có góp ý |
| F09 BP | Bảng counter/diễn tiến đã soạn, không tăng cap/thêm wire ACK | Review; implementation/counter runtime PT-27/28 ở ticket liên quan |
| AC-28 config | Bảng + expected fixtures đã chuẩn bị | C/TS loader thật T47; startup/no-listen/cwd/path/file/lock T09/T47 |
| AC-30 / PT-24 | Quy tắc schema/error/default đã dẫn; không tuyên bố toàn ref PASS | Validator thật T04/T44 và các ca body/envelope/pagination đúng phạm vi sau |
| F10 DB policy | Không đóng trong SCRUM-9 | Hoàng Quân chốt timeout/mapping có hiệu lực ở T06, Minh Quân review timer |

**Runtime C/TS loader, socket, SQLite transaction, BP saturation, tải 50 người:
NOT_RUN.** Không cần build toàn app cho thay đổi contract/fixtures này; build
scaffold cũng không chứng minh các AC trên. Tại thời điểm tự kiểm ban đầu chưa
commit/push/mở PR. Người dùng đã giao xuất bản branch/PR ngày 23/11; human review,
merge và cập nhật trạng thái Jira vẫn chưa được thực hiện trong lượt bàn giao này.

## Bàn giao và gate tiếp theo

1. Hoàng Quân review contract, đặc biệt TX ownership, DB và BP/canonical.
2. Nhóm xác nhận V03 bằng bảng cụ thể ở config/README; không dùng sự đồng ý triển
   khai SCRUM-9 làm bằng chứng duyệt các bound mới.
3. Consumer nhận đúng phiên bản contract/fixtures. T47 chỉ dùng bound mới sau
   gate xác nhận; T09 giữ startup trước listen/lock/cleanup theo nguồn hiện hành.
4. Khi chuẩn bị PR, xác minh foundation đã merge và chọn base phù hợp trước,
   tránh đưa toàn bộ scaffold vào diff SCRUM-9. Done theo AC/human review/merge,
   không từ trạng thái tự kiểm tài liệu.

Checkpoint bảo vệ: byte cap ngăn một vài payload lớn chiếm hết bộ nhớ, slot cap
ngăn nhiều message nhỏ tạo vô hạn object/ticket. Parse BP chỉ đổi nơi giữ output;
TCP TX nhận ownership hoặc drop đúng target mới cho phép trả response/event
credit. TCP send/ACK vẫn không thay SQLite commit hay application ACK.
