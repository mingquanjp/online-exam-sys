# Validation dùng chung — SCRUM-12

Nguồn: 03 §2.4/3/5.1/9/18, 02 §4.3/10 và contract SCRUM-9 §3.
Node business và Electron main dùng cùng source tại thư mục này; main import
trực tiếp các module cần thiết. Không thêm package/workspace/dependency hoặc
cho renderer/preload import các module Node này.

## Gọi theo ranh giới

- Payload từ framer: `decodeEnvelope(bytes, 'BP' | 'IPC' | 'NET')`. Hàm kiểm
  byte/UTF-8/escape/depth/duplicate key, parse object và kiểm envelope base.
- Guard main: `validateIpcCall(event, window.webContents, rendererUrl, input)`
  tại `apps/desktop/src/main/ipc-validation.ts`. URL phải do app chọn từ đường
  load UI, không lấy từ renderer. Guard kiểm sender/mainFrame/URL, whitelist,
  byte/depth/Unicode và body của local.connect/status/shutdown.
- Sau envelope: owner handler kiểm schema body bằng helpers trong `schema.ts`.
  `requestEnvelope` trả body unknown, không có nghĩa body đã được chấp nhận.
  `responseEnvelope`/`eventEnvelope` cũng chỉ kiểm base; owner phải kiểm body,
  details, correlation và lọc public DTO trước khi chuyển tới UI.

Consumer T10/T11/T12/T50 gắn các hàm này vào reader/dispatcher/IPC thật khi có
provider. Foundation hiện không đăng ký invoke handler hay spawn client C/Node.
Preload đang chỉ xuất stage, không có generic invoke; SCRUM-12 không thêm API
UI gọi vào handler chưa tồn tại hoặc tạo response local giả.

## Ba lớp kiểm tra

1. `strict-json.ts`: payload NET/IPC 2..65536 byte, BP 2..69632; UTF-8 fatal,
   root object, không BOM/trailing JSON/NUL/surrogate lẻ. Lượt quét chỉ giữ
   offset/key set của container, không dựng AST; JSON.parse tạo object sau guard.
   Depth NET/IPC 16, BP 18; BP payload kiểm NET root riêng <=16 và encoded <=65536.
2. `schema.ts`: object/exact keys, integer hữu hạn an toàn, ID int64 string,
   enum/boolean/text, nullable ID, optional integer/default. Không coercion.
   Thiếu trường khác null; mặc định chỉ khi thiếu, trước canonical của T45.
3. `envelope.ts`: request whitelist R/W và operation_id, local bodies,
   response/event/error base, BP kind/metadata. Chưa phân quyền, rate limit,
   kiểm tổng credit outstanding, correlation/receipt hoặc schema mọi domain.
   BP transport sys.hello/ping phải do C xử lý, không gửi cho Node dispatcher.

Lib TypeScript main/business dùng ES2024 để có declaration cho String.isWellFormed
trên Node 24 đã chốt; target vẫn ES2022. Không đổi runtime hoặc dependency.

## Lỗi và consumer

`ValidationError` chỉ giữ layer/reason/field cố định, không giữ input.

| layer | Consumer xử lý |
| --- | --- |
| boundary | Lỗi byte/JSON/envelope/BP: đóng kênh theo 03 §2.4; UNSUPPORTED_VERSION có thể trả trước đóng nếu còn tin được envelope |
| body | Envelope tin được nhưng type/body sai: map INVALID_ARGUMENT, effect NONE, tên field an toàn; không đóng bridge chỉ vì type NET không hỗ trợ |
| source | Từ chối IPC không đến từ main frame/UI được phép, không forward tới child |

Không serialize Error/exception thành response. Handler dựng code/message/details
whitelist theo mã; `errorDto` kiểm base đầu vào, không tự xác nhận details an toàn
hay tự lọc secret. Main không được relay body response/event chưa kiểm chỉ vì
base envelope hợp lệ. Phân quyền vẫn do server, guard client không thay authority.

## Ví dụ schema nhỏ trước canonical

```ts
const row = exactKeys(input, ['after_id'], ['limit']);
const normalized = {
  after_id: nullableId(row.after_id, 'after_id'),
  limit: optionalInteger(row, 'limit', 20, 1, 20),
};
```

ID không qua Number. String limit theo byte UTF-8 sau decode/trim đúng schema;
password không trim. Helpers nhận field do schema cung cấp, không truyền key lạ
hoặc giá trị bí mật của peer làm field/message. Không hash/canonical input thô.

## Kiểm thử và giới hạn

```sh
npm run test:validation --workspace @exam/business
npm run test:validation --workspace @exam/desktop
npm run check
```

Desktop test compile source guard cùng module dùng chung, rồi kiểm bằng Node với
snapshot sender/frame; chưa phải invoke trên Electron thật. Test output nằm trong
`.test-output/` được ignore. C dùng lại raw vectors tại `tests/fixtures/validation`
ở T44; chưa có bằng chứng C/TS đồng nhất hoặc LAN/50 người từ SCRUM-12.

NET type chưa biết vẫn giữ envelope/ID cho dispatcher trả INVALID_ARGUMENT;
không tự đóng BP hoặc bỏ mất context request. Consumer kiểm chiều kind BP
(C→Node/Node→C), schema theo type và trạng thái lifecycle trước dispatch.
Lỗi guard renderer trước khi gửi không được dùng làm lý do đóng child khỏe;
consumer chỉ từ chối invocation đó, còn lỗi từ stream áp policy đóng kênh.
