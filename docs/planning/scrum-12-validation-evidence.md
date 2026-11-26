# SCRUM-12 — Bàn giao validation TypeScript/main

Ngày: 26/11/2026. Tác giả: Nguyễn Minh Quân; reviewer: Đặng Hoàng Quân.
Nhánh `feature/SCRUM-12-typescript-validation`, base main `3670557`.

## Phạm vi

Theo 03 §2.4/3/5.1/9/18, 02 §4.3/10 và contract SCRUM-9 §3:
strict decode/guard, schema accessors, envelope/error base, whitelist và IPC
source guard. Không thêm framework/dependency, parser AST thứ hai, handler domain,
canonical/fingerprint, socket hoặc bridge lifecycle. Source chung ở
`apps/business/src/validation`, Electron main tái sử dụng, không copy validator.

## Đầu ra và kiểm chứng

Môi trường: macOS arm64, Node 24.15.0; TypeScript hiện có của repo.

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run test:validation --workspace @exam/business` | PASS 49/49 |
| `npm run test:validation --workspace @exam/desktop` | PASS 6/6 |
| `npm run test:storage --workspace @exam/business` | PASS 12/12 regression storage |
| `npm run check` | PASS typecheck và desktop/business build |
| `git diff --check` và whitespace file mới | PASS |

35 wire vectors + 12 schema vectors giữ raw bytes/JSON và expected. Các nhóm ca:

- Duplicate decoded key ở object/nested; escaped quote/backslash; raw/escaped
  NUL, surrogate lẻ, UTF-8 sai/overlong, BOM/trailing/root sai/cú pháp số sai.
- Depth NET/IPC 16/BP 18 và quá một mức; NET payload trong BP kiểm riêng depth16
  và encoded 65536 byte. Đúng/vượt byte cap từng kênh.
- Required/null/default/exact keys/sai hoa thường; integer 1/1.0/1e0 so với số
  lẻ/chuỗi/nonfinite; ID >2^53 giữ string, overflow/leading zero/newline bị chặn.
- Unicode byte bounds, trim có chủ đích, control/password; enum và boolean.
- Request R/W operation ID, type bị cấm qua IPC; local.connect/status/shutdown
  schema. Envelope tin cậy nhưng body/type sai giữ layer body/INVALID_ARGUMENT.
- BP lifecycle/control base, metadata cap, request/response/event base. Type NET
  không hỗ trợ không biến thành lỗi BP terminal; sys.hello/ping không gửi Node.
- Regression response: NET/BP nhận INVALID_ARGUMENT cho type chưa hỗ trợ,
  vẫn chặn response thành công hoặc mã lỗi khác cho type này; IPC giữ whitelist.
  LOCAL_TIMEOUT/LOCAL_CONNECTION_LOST/LOCAL_BRIDGE_CLOSED chỉ nhận trên IPC,
  bị chặn trên NET và response NET bọc BP. Correlation vẫn thuộc consumer.
- Source guard đúng WebContents + mainFrame + URL ứng dụng; sai frame/origin/
  file path/query bị chặn, hash route được phép; source được xét trước schema.
- Renderer object có cycle/BigInt/surrogate/encoded quá cap bị từ chối, không
  phụ thuộc TypeScript annotation. Error không chứa tên key lạ/giá trị input.

## Giới hạn và consumer

- Guard Electron chạy bằng Node với fixture metadata (không import runtime
  Electron). Chưa invoke trên Electron thật, chưa đọc pipe/BP/TCP ứng dụng.
- Foundation chưa có invoke handler/dispatcher để gắn guard. Consumer T10/T11/
  T12/T50 gọi entrypoint khi triển khai; không tạo endpoint giả để nhận PASS.
  Preload hiện chỉ có stage, không xuất generic invoke/quyền hệ thống.
- Schema body/details/public projection theo từng type do owner handler thêm.
  Envelope base hợp lệ chưa cho phép relay dữ liệu thô tới renderer hoặc DB.
- T44 chưa triển khai C validator; vector bàn giao chưa là C/TS equivalence PASS.
  Canonical/default DTO đã có expected, hash/canonical runtime thuộc T45.
- PT-24 chỉ kiểm phần helper/schema/guard TS; PT-25 chỉ kiểm schema local, chưa
  connect/status/shutdown lifecycle hoặc catalog paging. Không đánh toàn AC-30,
  FR-02/13, LAN hay 50 người đạt. Không thay human review.

## Checkpoint bảo vệ

JSON.parse đã bỏ mất key trước khi kiểm duplicate nên phải so key sau decode
ngay trong guard token. Trường thiếu dùng Object.hasOwn, không dùng truthiness
hoặc nullish default để biến null thành mặc định. ID lớn giữ string/BigInt để
không mất chính xác. Sender/frame/URL đến từ Electron, không lấy từ body renderer;
server vẫn phải kiểm authority riêng.
