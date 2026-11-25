# 03. Đặc tả giao thức

Nhóm 4 — Nguyễn Minh Quân (20235816), Đặng Hoàng Quân (20235813).

**Trạng thái: v0.8 — hoàn thiện nội dung đặc tả; thông số mới là baseline đề xuất.**
Ngày soạn: 01/11/2026. Căn cứ: [nghiệp vụ v1.8](01-requirements-and-business-flows.md)
và [kiến trúc v2.0](02-architecture-and-data.md). Không thay phân công, stack hoặc
quy tắc phòng/bài đã chốt. Các giới hạn và timeout dưới đây là baseline đề xuất
để triển khai/đo, chưa phải yêu cầu thầy chỉ định hay năng lực đã nghiệm thu.

Review chéo ngày 17/11/2026: [báo cáo 5 tài liệu](research/five-document-consistency-review.md)
ghi các phép tính đã kiểm và những chi tiết credit/config cần khóa trước triển khai.

## 1. Mục đích và các kênh

**V01 đã chốt ngày 17/11/2026:** giữ uint32 BE length + JSON UTF-8, không thêm
CRC32 vào phiên bản đầu. Chưa có yêu cầu trực tiếp đã xác nhận của thầy bắt buộc
checksum tầng ứng dụng. Giới hạn an toàn ở §2.3 vẫn áp dụng; không coi validation
hoặc fingerprint thao tác là checksum đường truyền. Xem
[review trước triển khai](research/pre-implementation-review.md).

| Kênh | Hai đầu | Nội dung và ranh giới |
| --- | --- | --- |
| IPC | Electron main ↔ client C qua pipe stdin/stdout | Lệnh UI được kiểm tra schema, kết quả, trạng thái kết nối; không xuất token resume cho UI. |
| NET | Client C ↔ server C qua một TCP/LAN | Handshake, xác thực, nghiệp vụ, heartbeat và sự kiện server. |
| BP | Server C ↔ Node TypeScript qua pipe riêng | Startup/lifecycle, NET request routing, authority control và response/event theo §18. |

Renderer chỉ gọi API chức năng giới hạn qua preload; không được viết frame, chọn
message tùy ý hoặc truy cập socket. IPC/NET/BP dùng length-prefix JSON,
nhưng whitelist lệnh khác nhau. Client C không chuyển nguyên mọi byte IPC sang NET.
Không có HTTP, WebSocket, UDP, truyền file hoặc cổng localhost bổ sung trong v1.
C01–C06 đã duyệt ngày 02/11/2026; C07–C12 đã duyệt ngày 03/11/2026.
C11 chuẩn hóa tải/số mẫu, C12 giữ core và điều chỉnh phần chung/UI theo tài liệu 04–05;
không đổi framing/schema do hai quyết định này. Ngày 15/11/2026 M01 chuyển
nghiệp vụ/SQLite sang Node. NET và desktop IPC giữ body API hiện hành. BP có
envelope/giới hạn riêng ở §18.

Server quyết định danh tính từ binding của kết nối, không từ user_id người gọi
tự khai. Room/attempt ID là địa chỉ tài nguyên, không phải bằng chứng có quyền.

## 2. Đóng khung byte

### 2.1. Một frame

```text
+-------------------------------+-------------------------------+
| payload_length: uint32 BE      | payload: JSON UTF-8           |
| 4 byte                        | đúng payload_length byte      |
+-------------------------------+-------------------------------+
```

- Header chỉ chứa độ dài payload, không tính 4 byte header; không có ký tự kết
  thúc, byte NUL, magic hoặc CRC. Payload tối đa **65.536 byte**, tối thiểu 2 byte.
- Dùng network byte order, đọc qua byte/ntohl; không cast con trỏ buffer sang
  struct C có padding/alignment phụ thuộc máy.
- Ví dụ payload `{}` có header hex `00 00 00 02`. Frame này hợp lệ ở mức framing
  nhưng bị từ chối ở mức envelope vì thiếu trường.
- JSON version nằm trong payload. V1 chỉ nhận v=1; không có thương lượng tự hạ
  phiên bản hoặc đoán header khi gặp dữ liệu khác định dạng.

### 2.2. Thuật toán nhận và gửi

Nhận: tích lũy đủ 4 byte → kiểm tra length trước cấp phát → tích lũy đủ payload
→ parse/validate → chuyển một message → tiếp tục với frame còn lại. Header có thể
bị chia 1+3 byte, payload có thể chia nhiều lần; một lần recv có thể chứa nhiều
frame. Không bỏ phần dư hoặc parse payload chưa đủ byte.

Gửi: encode một lần → enqueue buffer bất biến → giữ offset → write/send tiếp
phần còn thiếu khi writable. EINTR thử lại; EAGAIN/EWOULDBLOCK đợi readiness;
recv=0 là EOF, lỗi không phục hồi thì đóng. Khi EOF giữa frame, bỏ frame dở, không
đưa thành lệnh nghiệp vụ. Không gửi lại toàn bộ frame trên cùng stream sau partial
send vì sẽ nhân đôi byte. Retry nghiệp vụ chỉ dùng frame mới theo mục 10.

TCP cung cấp luồng byte, không cung cấp ranh giới message. TCP ACK không chứng
minh SQLite đã commit. [Nguồn: RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html).

### 2.3. Kiểm tra toàn vẹn và phạm vi an toàn

V1 không thêm CRC32: kiểm tra length, JSON, schema, ID, revision và trạng thái
nghiệp vụ; TCP xử lý truyền tải theo cơ chế của TCP. SHA-256 ở mục 10 chỉ dùng
so sánh nội dung thao tác retry, không thay TLS hoặc xác thực dữ liệu trên mạng.
Không tuyên bố phát hiện mọi lỗi bit/giả mạo, chống hook hoặc mã hóa TCP thuần.
Nếu sau này cần TLS/MAC/CRC, phải sửa hợp đồng phiên bản, không tự chèn byte.

### 2.4. Lỗi ở mức stream

| Lỗi | Hành vi |
| --- | --- |
| Length ngoài khoảng hoặc không đủ tài nguyên nhận frame | Đóng kênh, không đọc tiếp theo length do bên kia khai. |
| UTF-8/JSON lỗi, key trùng, root không phải object, envelope sai | Đóng kênh; có thể phát lỗi chẩn đoán đã lọc, không phụ thuộc gửi được error frame. |
| Envelope hợp lệ nhưng v không hỗ trợ | Trả UNSUPPORTED_VERSION theo v1 nếu có thể rồi đóng. |
| Envelope hợp lệ nhưng type/body không hợp lệ | Trả lỗi tương ứng, giữ kênh nếu chưa vượt giới hạn vi phạm. |
| IPC stdout lẫn log hoặc frame IPC sai | Electron báo LOCAL_BRIDGE_PROTOCOL_ERROR, dừng child có kiểm soát; không đoán bỏ dòng log rồi tiếp tục. |

Client C ghi log vào stderr, chỉ frame lên stdout. Pipe cũng có giới hạn dung
lượng; Electron xử lý write=false/drain và áp hard cap riêng. highWaterMark là
ngưỡng điều tiết, không phải giới hạn cứng RAM.
[Nguồn: Node streams](https://nodejs.org/api/stream.html#buffering).

## 3. Kiểu dữ liệu và validation

| Tên | Quy ước v1 |
| --- | --- |
| ID tài nguyên | Chuỗi thập phân từ "1" đến "9223372036854775807", không dấu/leading zero; C parse có kiểm tra tràn sang int64. |
| request_id, operation_id | Chuỗi 32 ký tự hex thường, 128 bit random an toàn; không dùng thời gian hoặc số thứ tự tự reset làm operation_id. |
| server_instance_id | 32 hex random mỗi lần server khởi động; không phải phiên/token. |
| event_seq | Chuỗi số thập phân không âm, tăng theo kết nối, không phải log bền. |
| revision/version | JSON integer 0..2.147.483.647; tạo mới dùng version=1, answer chưa có dùng revision=0. Không nhận số có phần lẻ, âm hoặc chuỗi; integer xét theo giá trị như §3.1. |
| Thời gian | JSON integer Unix ms hoặc duration/remaining_ms nguyên; không gửi monotonic timestamp nội bộ. |
| Enum | Phân biệt hoa thường: EASY/MEDIUM/HARD, WAITING/RUNNING/ENDED/CANCELLED, OPEN/FINALIZED, A/B/C/D. |
| Username | 3..32 ký tự ASCII [a-zA-Z0-9_], server chuyển chữ thường thành username_key. |
| Password | 8..128 byte UTF-8, không trim/normalize; không nhận NUL/control; không log hoặc lưu rõ. |
| Tên hiển thị/phòng/chủ đề | UTF-8 hợp lệ, 1..100 byte sau trim ASCII đầu/cuối; không control. |
| Topic name_key | V1 bằng tên đã trim, so sánh UTF-8 chính xác có phân biệt hoa/dấu; chưa hứa gộp Unicode tương đương. |
| Prompt | 1..4.096 byte UTF-8; option A–D mỗi trường 1..1.024 byte. Cho LF/tab, cấm control khác và NUL. |
| Cấu hình bài | topic_id là ID hoặc null=tất cả; easy_count/medium_count/hard_count mỗi số 0..100, tổng 1..100; duration_seconds 60..7.200. |
| Phân trang | limit 1..20, mặc định 20; trang item đề limit 1..5, mặc định 5; server có thể trả ít hơn để vừa frame. |

ID dạng chuỗi tránh mất chính xác khi đi qua JavaScript hoặc number của cJSON.
Mọi JSON number nhận vào vẫn phải kiểm tra hữu hạn/nguyên/khoảng trước cast.
Version đạt trần trả RESOURCE_LIMIT, không wrap về 0.

Parser yêu cầu đúng một JSON object, không trailing JSON, không BOM, không key
trùng ở mọi cấp; nesting tối đa 16. Không chấp nhận escape tạo NUL hoặc surrogate
không hợp lệ. Các trường không có trong schema bị từ chối INVALID_ARGUMENT;
trường nullable bắt buộc hiện diện nhưng được mang null, trường optional được
ghi rõ bằng ? bên dưới. Thiếu và null là hai trường hợp khác nhau.
String limit tính trên UTF-8 đã decode, frame limit tính trên JSON đã encode.
Không mặc định thư viện đã kiểm tra UTF-8, key trùng hoặc mọi constraint ứng dụng.

cJSON có giới hạn/cách biểu diễn riêng, gồm number và chuỗi; lớp validation của
nhóm phải bổ sung phần hợp đồng cần thiết. JSON trao đổi dùng UTF-8 theo RFC.
[Nguồn: cJSON](https://github.com/DaveGamble/cJSON),
[RFC 8259](https://www.rfc-editor.org/rfc/rfc8259.html).

### 3.1. C09 — validation C và TypeScript

Pipeline C: kiểm tra length/UTF-8/token/escape trên buffer có độ dài → parse
cJSON với length/end-pointer → depth/key trùng → envelope → transport schema.
Pipeline Node: strict UTF-8 decode/token/escape/depth/key trùng trước JSON.parse
→ kiểm tra BP/envelope → schema nghiệp vụ → DTO có kiểu. JSON.parse và TypeScript
type annotation cần bổ sung kiểm tra runtime để thực thi C09. Depth tính root object là mức 1, object/array con
thêm 1, tối đa 16; kiểm tra trước parse để không dựa vào mặc định sâu của thư viện.
Chỉ JSON whitespace hợp lệ được phép sau object, không có BOM/trailing JSON/raw NUL.
Không nhận escape \u0000, surrogate lẻ, UTF-8 lỗi hoặc cú pháp số không đúng JSON.
Khóa được so sau decode: `type` và `\u0074ype` là trùng; phân biệt hoa thường.

Dùng accessor CaseSensitive; từ chối khóa lạ trong request body/envelope theo
schema v1, không bỏ qua để đoán ý. Helper chung gồm đọc string bắt buộc/có giới
hạn, số nguyên có khoảng, nullable ID, enum và tập khóa cho phép. Main kiểm tra
IPC và C kiểm tra transport/envelope, Node kiểm tra lại BP và nghiệp vụ tại ranh giới
của mình. Bộ schema/vectors dùng chung giữa các bản triển khai.
Lỗi JSON/envelope theo §2.4; envelope đúng nhưng body sai trả INVALID_ARGUMENT.

Integer xét theo **giá trị số JSON** hữu hạn, nguyên và trong khoảng: `1`, `1.0`,
`1e0` cùng giá trị; `1.5` hoặc chuỗi `"1"` không hợp lệ cho trường integer.
Sender chuẩn luôn serialize integer dạng thập phân không phần lẻ/exponent;
canonical fingerprint dùng DTO sau normalize/default, không lexical JSON đầu vào.
ID int64 vẫn là chuỗi theo §3, không đi qua double; không cast number trước khi
kiểm tra hữu hạn/nguyên/khoảng. Không thêm lexer chỉ để cấm cách viết 1.0.

Mỗi parse/cây JSON thuộc một thread và được giải phóng bởi owner; không chia
sẻ cây mutable. Dùng end-pointer của lần parse, không dùng cJSON_GetErrorPtr để
truyền lỗi giữa threads. InitHooks chỉ trước khi khởi tạo threads nếu cần; không
đổi hooks/locale lúc chạy. Serializer tạo object schema cố định và kiểm tra byte
encoded trước enqueue; không tự viết JSON parser/framework tổng quát.
Caveats này được đối chiếu [cJSON](https://github.com/DaveGamble/cJSON#caveats)
và [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259.html); quy tắc giới hạn cụ thể
là lựa chọn v1 của nhóm, không phải mọi quy tắc đều do thư viện bảo đảm.

## 4. Envelope chung

### 4.1. Request

```json
{
  "v": 1,
  "kind": "request",
  "request_id": "11111111111111111111111111111111",
  "type": "answer.save",
  "operation_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "body": {
    "attempt_id": "101",
    "position": 1,
    "selected_option": "B",
    "expected_revision": 0
  }
}
```

Tất cả trường envelope hiện diện. Lệnh đọc/control/auth dùng operation_id=null;
lệnh thay đổi bền có dấu W trong mục 7 bắt buộc operation_id. request_id không
lặp trong một kết nối; server chỉ cần giữ tập request đang xử lý, client bảo đảm
không tái dùng ID kể cả khi request trước đã hoàn thành. Yêu cầu song song có
request_id riêng, không suy ra tương quan từ thứ tự phản hồi.

### 4.2. Response thành công

```json
{
  "v": 1,
  "kind": "response",
  "request_id": "11111111111111111111111111111111",
  "type": "answer.save",
  "operation_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "ok": true,
  "effect": "APPLIED",
  "replayed": false,
  "body": {
    "attempt_id": "101",
    "position": 1,
    "selected_option": "B",
    "revision": 1,
    "saved_at": 1793494800000
  },
  "error": null
}
```

- response lặp đúng type/operation_id của request; request_id của **lần gửi mới**
  nếu là retry. Mỗi request tối đa một response cuối; không có response “đang xử lý”.
- effect=NONE cho đọc hoặc từ chối không áp dụng; APPLIED cho hiệu ứng đã áp dụng
  hoặc receipt replay; UNKNOWN khi không thể kết luận. Với W, APPLIED chỉ sau
  commit. Login/resume/logout APPLIED là thay đổi phiên RAM, không phải ghi DB.
- replayed=true chỉ khi W lấy receipt trước đó. Receipt không phải snapshot mới;
  client không dùng receipt cũ để mở lại bài đã chốt.

### 4.3. Response lỗi

```json
{
  "v": 1,
  "kind": "response",
  "request_id": "22222222222222222222222222222222",
  "type": "answer.save",
  "operation_id": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "ok": false,
  "effect": "NONE",
  "replayed": false,
  "body": null,
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Lựa chọn đã thay đổi; cần đồng bộ lại.",
    "retry_after_ms": null,
    "details": {"position": 1, "current_revision": 2}
  }
}
```

message chỉ để hiển thị, client rẽ nhánh theo code. details là object có schema
theo mã lỗi, mặc định {}; không chứa SQL, stacktrace, password, token hoặc key.
Lỗi timeout local của C dùng cùng response envelope trên IPC; không giả mạo thành
response đã nhận từ server. error.code nhóm LOCAL_* chỉ tồn tại trên IPC.

### 4.4. Event

```json
{
  "v": 1,
  "kind": "event",
  "type": "room.changed",
  "event_seq": "7",
  "body": {"room_id": "12", "reason": "MEMBERSHIP"}
}
```

Event không có request_id/operation_id, không được client trả ACK nghiệp vụ.
Số thứ tự NET bắt đầu 1 sau hello, tăng cho từng event được enqueue. IPC có seq
riêng do C cấp cho tất cả event local/được lọc từ NET; không chuyển seq NET thành
seq IPC. Event gap, reconnect hoặc reload thì sync; không replay từ một event log.
Push là thông báo cần đọc lại trạng thái, không phải nguồn sự thật duy nhất.

## 5. Các object dùng chung

Ký hiệu `?` chỉ trường optional. Các object dưới đây là danh sách trường cho phép,
không dùng hàng DB thô. `Config` có đúng 5 trường ở mục 3.

| Object | Trường |
| --- | --- |
| User | user_id, username (đã chuẩn hóa), display_name, role (USER/ADMIN). |
| RoomSummary | room_id, name, owner: User, state, member_count, capacity=50, config: Config, config_version, created_at, waiting_expires_at, cancelled_at nullable, cancel_reason nullable, started_at (null nếu chưa thi), deadline_at (null nếu chưa thi), ended_at (null trừ ENDED). |
| Member | user: User, is_owner, connected (boolean). Không kèm bài/điểm của người khác. |
| RoomView | room: RoomSummary, members: Member[], my_attempt_id (null khi chưa có), server_time_ms, remaining_ms (null khi chưa thi, 0 khi hết hạn thi), waiting_remaining_ms (null nếu không WAITING), accepts_members (boolean). |
| Activity | kind (NONE/ROOM/PRACTICE), room_id (nullable), attempt_id (nullable). NONE: cả hai null; ROOM: room_id có giá trị, attempt_id null lúc chờ; PRACTICE: chỉ attempt_id có giá trị. |
| AttemptMeta | attempt_id, kind, room_id nullable, state, config, total_count, started_at, deadline_at, finalized_at nullable, finalize_reason nullable, writable, result_available, server_time_ms, remaining_ms. |
| Item | position, topic_name, difficulty, prompt, options: {A,B,C,D}. Không source_question_id, correct_option hoặc correctness. |
| SavedAnswer | position, selected_option, revision, saved_at. Vắng hàng nghĩa chưa có lựa chọn/revision=0. |
| Score | correct_count, total_count, score_text (chuỗi thang 10, ví dụ "7.50"). |
| PublishedResult | attempt_id, kind, room_id nullable, finalized_at, finalize_reason, score: Score. |
| Page | items: array, next_after (string ID hoặc null), has_more boolean. |

Config được chụp cùng bài. topic_name trong Item lấy snapshot, không tra tên hiện
tại để thay đổi nhãn đề cũ. finalize_reason: EARLY_SUBMIT/TIME_EXPIRED/HOST_END;
PRACTICE không dùng HOST_END. writable=false khi đã hết hạn dù DB còn OPEN vì
transaction chốt đang lỗi. result_available chỉ true cho PRACTICE FINALIZED hoặc
EXAM có room ENDED và kết quả đã lưu. Không trả Score trong AttemptMeta.

Room list sort room_id giảm dần; history sort attempt_id giảm dần. `after_id`
nullable là ID cuối trang trước; server lấy ID nhỏ hơn, không phải offset. Admin
list topics/questions và catalog.list sort topic/question ID tăng dần và lấy
lớn hơn after_id. Catalog chỉ active topics, all_available tính tại lượt đọc
dispatcher hiện tại, không cộng dồn các trang để suy ra tổng. Không hứa snapshot
nhất quán của cả danh sách nếu admin đang sửa; quay về đầu để refresh.

Roster tối đa 50, trả cùng RoomView một frame sau kiểm tra kích thước. Mọi endpoint
phân trang (kể cả admin.question.list) trả tối đa limit nhưng có thể ít hơn theo
byte budget; cursor là ID/position cuối thực sự trả, không phải cuối limit yêu cầu.
Server encode UTF-8 không
escape mọi ký tự Unicode sang ASCII; luôn kiểm tra byte encoded trước enqueue.
Mục 3 bảo đảm một Item tối đa hợp lệ có thể nằm trong frame; không cắt chuỗi JSON.

### 5.1. Presence/default và cursor đã chốt theo C09

| Trường/ngữ cảnh | Bắt buộc | Giá trị khi thiếu / null |
| --- | --- | --- |
| Envelope request (v, kind, request_id, type, operation_id, body) | Có, mọi trường | Không default; operation_id=null cho R/auth/control/local, W bền phải có ID. |
| Config | Có đủ topic_id, easy_count, medium_count, hard_count, duration_seconds | topic_id=null là toàn kho; các count/duration không nhận null, không tự bù count. |
| limit? của room/catalog/admin/history lists | Không | Thiếu: 20; có: integer 1..20; null bị từ chối. |
| limit? của attempt.items/result.items | Không | Thiếu: 5; có: integer 1..5; null bị từ chối. |
| after_id nullable của các list | Có | null là trang đầu; không mặc định khi thiếu. |
| after_position của attempt.items/result.items | Có | Integer 0..100; 0 là đầu; thiếu/null bị từ chối. |
| Các filter nullable (state/topic_id/difficulty/active) | Có khi bảng request có trường đó | null là không lọc; giá trị khác phải đúng enum/ID/boolean. |
| Body local.status/local.shutdown | Có | Object rỗng {}, không nhận null/khóa lạ. |
| Trường còn lại không có ? | Có | Không default; chỉ nhận null nếu schema ghi nullable/null. |

Response/event luôn chứa các trường đã liệt kê, trừ trường đánh dấu ? rõ trong
schema; không tự bỏ trường nullable. error.details bắt buộc là object, mặc định {}. Schema chi tiết của từng DTO/API ở
§3–9 vẫn áp dụng, bảng này không làm mọi trường nullable thành optional.
Các ví dụ request ghi limit rõ vẫn hợp lệ. Default được áp dụng trước canonical.

Page không có hàng: items=[], has_more=false, next_after=null. Có trang kế tiếp:
next_after là ID cuối thực sự trả (position dùng next_after_position); nếu không
còn trang thì cursor=null. has_more được xác định bằng kiểm tra hàng hợp lệ kế
tiếp, không suy ra chỉ từ items.length==limit. Không hứa snapshot xuyên các lần
đọc danh sách đang đổi; refresh bắt đầu bằng cursor đầu. Snapshot đề cố định và
thứ tự position vẫn giữ nguyên dù ngân hàng thay đổi.

## 6. Handshake, phiên và heartbeat NET

### 6.1. State kết nối

```text
TCP_CONNECTED → HELLO_OK → UNAUTHENTICATED → AUTH_PENDING → AUTHENTICATED
                                      ↖ auth sai ↙             |
                                      logout/revoke/hết hạn ←──┘
Mọi trạng thái có thể → CLOSED; reconnect tạo kết nối mới và hello lại.
```

`sys.hello` là request đầu tiên, trong 5 giây từ accept; body
`{client_name, client_version}`, mỗi chuỗi ASCII 1..32 byte. Reply
`{server_instance_id, protocol_version:1, max_payload_bytes:65536,
heartbeat_interval_ms:10000, idle_timeout_ms:35000}`. Không lặp hello trên một TCP.
Trước hello chỉ xử lý hello; request khác trả HANDSHAKE_REQUIRED rồi đóng.

Sau hello, sys.ping được phép ở mọi trạng thái. auth.register/login/resume chỉ
khi chưa xác thực và không có auth đang chờ. Chỉ một job auth đang chờ/kết nối;
lệnh cần xác thực trong thời gian này trả AUTH_IN_PROGRESS, không tích sau login.
Kết nối chưa xác thực tối đa 60 giây, trừ job auth hợp lệ đang chạy tới deadline
job; không dùng heartbeat giữ kết nối chưa xác thực vô hạn.
Đăng ký hoàn tất vẫn ở UNAUTHENTICATED, sau đó người dùng login; chỉ login/resume
thành công mới chuyển AUTHENTICATED. Node dispatcher kiểm tra hạn job/ticket trước áp dụng
kết quả hash, không cấp phiên hoặc tạo tài khoản từ job đã hết hạn/hủy.

### 6.2. Lệnh xác thực

| Type | Request body | Reply body thành công | Quy tắc |
| --- | --- | --- | --- |
| auth.register | username, display_name, password | user: User | Tạo USER, không tự login; không operation ledger. Trùng tên USERNAME_TAKEN. |
| auth.login | username, password | user: User, resume_token, idle_ttl_ms:86400000 | Xác thực xong mới thay phiên cũ. C giữ token, lọc khỏi IPC. |
| auth.resume | resume_token | user: User, idle_ttl_ms:86400000 | Token không đổi khi resume; chuyển binding, vô hiệu quyền kết nối cũ. Không coi resume là join. |
| auth.logout | {} | logged_out:true | Chỉ cho binding hiện hành; revoke rồi mới trả. Không rời/nộp, không W. |
| sys.ping | nonce (32 hex) | nonce (echo), server_time_ms | Chỉ kiểm tra liveness, không chứng minh commit/được quyền thi. |

Token: 32 byte random biểu diễn 64 hex thường. Server chỉ giữ hash token trong
RAM; C giữ bản gốc RAM. Không gắn token vào mọi request; binding kết nối đã xác
thực là authority được Node dispatcher kiểm tra lại mỗi lần. Token cũ sau login mới hoặc
server restart không còn hiệu lực. Resume gửi lại token ổn định giải quyết trường
hợp resume thành công rồi mất response, không cần cơ chế rotation nhiều thế hệ.

Session hết hạn sau 24 giờ không có request nghiệp vụ hợp lệ từ binding hiện
hành; ping và auth thất bại không gia hạn. Khi room RUNNING hoặc PRACTICE OPEN,
không cho idle expiry cắt bài trước deadline + 5 phút; pin thời gian này không
ngăn logout/revoke/login mới. Khi thời hạn pin/idle đều hết thì phải đăng nhập
lại; dữ liệu bài và reservation vẫn giữ. Room WAITING không pin phiên vô hạn.
Mọi phép tính TTL trong lần chạy dùng monotonic; C không tự đoán token còn hợp lệ.

Server đóng kết nối cũ sau khi binding được thay, có thể gửi session.revoked trước
đóng nếu còn ngân sách. Client nhận SESSION_REPLACED hoặc revoked phải dừng tự
resume token cũ, yêu cầu login theo ý người dùng; không đấu reconnect giành phiên.

### 6.3. Liveness

Client C gửi ping mỗi 10 giây không có ping đang chờ; server trả cùng nonce.
Reactor đánh dấu timeout nếu 35 giây không nhận frame NET hợp lệ hoàn chỉnh;
C tương tự nếu 35 giây không có frame hợp lệ từ server. Có deadline frame dở
10 giây từ byte đầu tiên, không reset theo từng byte để chống giữ frame vô hạn.
Server vẫn có rate limit; ping liên tục không được coi là lệnh nghiệp vụ.

Heartbeat có thể thành công trong khi Node/SQLite bị chậm. Request nghiệp vụ có
timeout riêng; presence connected chỉ phản ánh binding/transport còn sống.

## 7. Danh mục lệnh nghiệp vụ NET

Tất cả lệnh mục này cần AUTHENTICATED. R=đọc, W=ghi bền + operation_id. Body không
được thêm user_id/role để đổi người gọi. Trừ khi nêu khác, lỗi dùng mục 11; mỗi
request được Node dispatcher kiểm tra quyền hiện tại ngay cả khi tìm receipt.

### 7.1. Trạng thái người dùng và phòng — A chủ trì

| Type | R/W | Request body | Reply body | Quyền/điều kiện chính |
| --- | --- | --- | --- | --- |
| state.get | R | {} | user: User, activity: Activity, server_time_ms | Chỉ chính người gọi; dùng ngay sau login/resume. |
| operation.get | R | operation_id | found:boolean, receipt nullable | Chỉ thao tác của chính user/quyền tài nguyên hiện hành; chi tiết mục 10.5. |
| room.list | R | state (WAITING/RUNNING/ENDED/CANCELLED hoặc null), after_id nullable, limit? | Page<RoomSummary> | Hiện cả phòng đang thi/đã kết thúc; UI chỉ join WAITING. |
| room.create | W | name, config: Config | room_id, config_version:1 | Không reservation, đủ câu, chủ tự tham gia. |
| room.configure | W | room_id, expected_config_version, name, config | room_id, config_version mới | Chủ phòng, WAITING, đủ câu; thay toàn bộ cấu hình, không patch ngầm. |
| room.get | R | room_id | RoomView | Thành viên phòng; người ngoài chỉ đọc RoomSummary qua list. |
| room.join | W | room_id | room_id, joined:true | WAITING, còn chỗ, không hoạt động khác. Thành viên hiện có cùng phòng trả joined:true, không nhân bản. |
| room.leave | W | room_id | room_id, left:true | Thành viên thường, WAITING; chủ không được rời. Đã rời và room còn WAITING trả left:true; không cho phép lách leave sau start. |
| room.cancel | W | room_id | room_id, state:CANCELLED, cancelled_at, cancel_reason | Chủ, WAITING còn hạn; nếu đã CANCELLED trả trạng thái đã lưu, không tạo bài/điểm. RUNNING/ENDED từ chối ROOM_NOT_WAITING. |
| room.start | W | room_id, expected_config_version | room_id, state:RUNNING, started_at, deadline_at, my_attempt_id | Chủ, WAITING, đủ câu, tất cả snapshot commit; gọi B generator. |
| room.end | W | room_id | room_id, state:ENDED, ended_at | Chủ, RUNNING; gọi B finalizer. Đã ENDED trả trạng thái hiện tại, không chấm lại. |

room.start dùng config_version chống bắt đầu nhầm cấu hình đã được thay sau khi
UI đọc. Join/start xử lý tuần tự: join commit trước thì được gán; start trước thì
người mới nhận ROOM_NOT_WAITING. Thành viên cũ quay lại dùng state.get/room.get và
attempt.get, không gọi join để tạo bài. Sau start, my_attempt_id của từng người
được đọc từ room.get/state.get, không dùng ID bài của chủ cho cả phòng.

Phòng chờ có waiting_expires_at cố định từ create + 30 phút. Thời điểm hiện tại
và waiting_remaining_ms do server tính; accepts_members chỉ true nếu WAITING còn
hạn, còn chỗ, không pending expiry. Config/join/reconnect không gia hạn. Sau
RUNNING chỉ deadline bài thi có hiệu lực, waiting_remaining_ms=null. cancel_reason
là HOST_CANCEL hoặc WAIT_TIMEOUT, NULL ở phòng chưa bị hủy. CANCELLED không có
attempt, room.results trả ROOM_CANCELLED, không nằm trong history.list bài làm.
RoomSummary vẫn cho thấy phòng bị hủy; RoomView chỉ cho thành viên như trước.

Hết hạn: Node dispatcher xử lý internal cancel trước mutation, trả ROOM_WAIT_EXPIRED nếu
DB còn WAITING nhưng hết hạn chưa commit hủy, hoặc ROOM_CANCELLED nếu đã hủy.
Không trả kết quả điểm rỗng thay trạng thái hủy. room.cancel/retry giữ nguyên
reason/thời điểm nếu timer đã hủy; không đổi WAIT_TIMEOUT thành HOST_CANCEL.
Event CANCELLED chỉ sau commit, gửi tới roster kể cả vừa giải phóng reservation;
người offline lấy state/room khi quay lại. Sau giải phóng, state.get.activity
có thể NONE hoặc activity mới, không dùng reservation làm quyền đọc roster cũ.

### 7.2. Kho câu và chủ đề — B chủ trì

| Type | R/W | Request body | Reply body | Quyền/điều kiện |
| --- | --- | --- | --- | --- |
| catalog.list | R | after_id nullable, limit? | Page<{topic_id,name,available:{easy,medium,hard}}>, all_available:{easy,medium,hard} | Mọi user; chỉ active topics/questions, không nội dung/key. all_available là tổng cả kho, không chỉ trang. |
| admin.topic.list | R | active (boolean/null), after_id nullable, limit? | Page<Topic> | ADMIN; Topic={topic_id,name,active,version}. |
| admin.topic.create | W | name | topic_id, version:1 | ADMIN, name_key duy nhất. |
| admin.topic.update | W | topic_id, expected_version, name, active | topic_id, version mới | ADMIN, cập nhật version; không xóa cứng. |
| admin.question.list | R | topic_id nullable, difficulty nullable, active nullable, after_id nullable, limit? | Page<Question> | ADMIN; có key, không cấp endpoint này cho người thường. |
| admin.question.create | W | topic_id, difficulty, prompt, options:{A,B,C,D}, correct_option, active | question_id, version:1 | ADMIN, chủ đề tồn tại/active khi tạo câu active. |
| admin.question.update | W | question_id, expected_version, topic_id, difficulty, prompt, options:{A,B,C,D}, correct_option, active | question_id, version mới | ADMIN, thay toàn bộ bản câu, không đổi snapshot cũ. |

Question={question_id,topic_id,difficulty,prompt,options,correct_option,active,
version}. Không có API xóa cứng hay import file. Ngừng chủ đề không tự sửa hàng
questions.active; điều kiện khả dụng là cả hai active. Catalog không khóa câu;
create/configure/start/practice.start đều kiểm tra lại số lượng theo transaction.

### 7.3. Đề, làm bài và luyện tập — B chủ trì

| Type | R/W | Request body | Reply body | Quyền/điều kiện |
| --- | --- | --- | --- | --- |
| practice.start | W | config: Config | attempt: AttemptMeta | Không reservation; sinh snapshot/deadline riêng, chưa kèm cả đề. |
| attempt.get | R | attempt_id | attempt: AttemptMeta, answers: SavedAnswer[] | Chính chủ bài, tối đa 100 answers; dùng đồng bộ sau reconnect. |
| attempt.items | R | attempt_id, after_position (0..100), limit? | attempt_id, items: Item[], next_after_position nullable, has_more | Chính chủ bài; lấy snapshot bất biến theo position tăng dần. |
| answer.save | W | attempt_id, position, selected_option, expected_revision | attempt_id, position, selected_option, revision, saved_at | Chính chủ, OPEN, trước deadline; CAS theo revision. |
| attempt.submit | W | attempt_id | attempt_id, state:FINALIZED, finalized_at, finalize_reason | Chính chủ; chốt một lần. Không trả điểm, kể cả PRACTICE; lấy điểm qua result.get. |

after_position=0 lấy từ câu 1; trang sau dùng next_after_position (position cuối),
không offset số byte. Items lấy lại giống nhau qua reconnect/sửa kho. Metadata
và answers phải được đọc cùng một lượt Node dispatcher nhất quán; item tĩnh có thể lấy
nhiều trang. Client không gửi cả bản đề hoặc điểm lên khi submit.

Save/submit dùng chung mốc xét hạn và bảng kết quả C07 tại §10.4. TIME_EXPIRED
trả DEADLINE_EXCEEDED; HOST_END trả ATTEMPT_FINALIZED. Submit đã EARLY_SUBMIT trả
trạng thái hiện tại thành công, lưu receipt no-op cho operation mới, không chấm lại.
Retry operation đã commit trước hạn trả receipt trước đó, không xét lại hạn.

### 7.4. Kết quả/lịch sử/biểu đồ — B chủ trì

| Type | R/W | Request body | Reply body | Quyền/điều kiện |
| --- | --- | --- | --- | --- |
| result.get | R | attempt_id | result: PublishedResult | Chính chủ, được công bố. |
| result.items | R | attempt_id, after_position, limit? | attempt_id, items:[{position,selected_option nullable,is_correct}], next_after_position nullable, has_more | Chính chủ, đã công bố; dùng attempt.items lấy nội dung; không correct_option. |
| room.results | R | room_id | room_id, items:[{user:User,result:PublishedResult}] | Chủ phòng, ENDED; tối đa 50, không chi tiết lựa chọn người khác. |
| history.list | R | after_id nullable, limit? | Page<PublishedResult> | Chính chủ, chỉ bài đã công bố; UI dùng cùng dữ liệu vẽ biểu đồ. |

Không có API chart mở đường đọc điểm sớm. History không đưa score=null cùng số
đúng hoặc cờ đúng/sai làm lộ điểm. Nộp sớm có thể xem trạng thái qua attempt.get
nhưng result.get vẫn RESULTS_NOT_RELEASED cho tới ENDED. Tính score_text bằng
làm tròn half-up tỷ lệ 10×correct/total tới 2 chữ số; ví dụ 1/16 → "0.63".

## 8. Sự kiện NET và đồng bộ

| Type | Body | Đối tượng/ý nghĩa |
| --- | --- | --- |
| room.changed | room_id, reason (MEMBERSHIP/PRESENCE/CONFIG/STARTED/ENDED/CANCELLED) | Binding thành viên hiện hành; gọi room.get, STARTED lấy bài của chính mình. |
| attempt.changed | attempt_id, reason (FINALIZED) | Chính chủ; gọi attempt.get, chỉ result.get khi result_available. |
| session.revoked | reason (NEW_LOGIN/RESUMED_ELSEWHERE/EXPIRED/ACCOUNT_CHANGED) | Kết nối bị thu hồi; dừng thao tác/resume tự động và đóng. |

Không broadcast đề/key/answer đến cả phòng. Event chỉ gợi ý refresh, có thể gộp
nhiều room.changed chưa gửi thành một reason mới nhất; client luôn lấy RoomView
toàn phần. Node dispatcher commit rồi mới phát event. Nếu event đến trước response của
request khác, client không được suy ra request đó thành công/thất bại chỉ từ event.

Client refresh room đang mở mỗi 5 giây nếu không có refresh đang chờ, có jitter
±1 giây để tránh 50 máy gọi cùng nhịp; state.get sau reconnect, reload và khi có
event gap. Sự kiện mất hoàn toàn trong TCP mới vẫn được bù bởi refresh. UI throttle
refresh tối đa một lần/giây; không một event tạo một luồng truy vấn vô hạn.

RoomView phải phản ánh connected của binding mới. Close event của fd cũ sau
resume không đánh dấu binding mới offline. Presence không phải trạng thái bài;
offline vẫn nằm trong roster và được gán đề lúc start.

## 9. Giao thức IPC Electron–client C

### 9.1. Khởi động và lệnh local

Client C phát event local.ready đầu tiên với `{client_version,protocol_version:1}`;
Electron đợi tối đa 5 giây, không viết vào child chưa sẵn sàng. Không đưa endpoint,
password hoặc token vào argv/env. Sau ready, main gửi local.connect.

| Type | Request body | Reply body/hiệu ứng |
| --- | --- | --- |
| local.connect | host (IPv4 dotted decimal), port (1..65535) | connected:true, server_instance_id sau TCP + hello; chỉ khi chưa kết nối, không đổi server giữa bài. |
| local.status | {} | transport (DISCONNECTED/CONNECTING/HANDSHAKING/CONNECTED/RECONNECTING), auth (UNAUTHENTICATED/PENDING/AUTHENTICATED/REAUTH_REQUIRED), user nullable, server_instance_id nullable. |
| local.shutdown | {} | stopping:true rồi flush trong giới hạn và thoát; không tự logout/leave/submit. |

V1 cấu hình IPv4 trực tiếp, không thêm DNS blocking vào vòng I/O. Endpoint là cấu
hình UI đã kiểm tra, không là quyền cho renderer tự gọi socket. Đổi endpoint phải
dừng child/cảnh báo công việc chưa rõ rồi khởi chạy lại theo ý người dùng.

Các local.* dùng envelope §4 với operation_id=null; thành công ok=true,
effect=NONE, replayed=false. NONE nghĩa không có mutation bền server, không có
nghĩa local.connect/shutdown không đổi lifecycle. local.shutdown ACK chỉ xác nhận
đang dừng; không chứng minh child đã thoát hoặc server đã revoke/logout.
Lỗi local dùng cùng envelope theo §11, không tạo receipt/operation ledger.

### 9.2. Lệnh nghiệp vụ qua IPC

IPC cho gọi các type mục 7 và auth.register/login/logout, **không cho** auth.resume,
sys.hello, sys.ping hoặc tự cấp token. C tự quản lý ba type NET này. Schema body
nghiệp vụ giống NET. IPC không truyền trường session/connection_id để vượt quyền.

Electron tạo request_id IPC mới cho một lần gọi; mutation tạo operation_id một
lần cho một ý định và giữ trong pending registry của main, không sinh lại khi UI
refresh. C tạo request_id NET riêng và giữ mapping IPC↔NET. Timeout/retry nội bộ
NET không thay operation_id; phản hồi cuối IPC dùng ID IPC gốc, chỉ một lần.

Login/resume NET reply được C lọc thành IPC `{user}`; không token, hash token hoặc
TTL nội bộ cần dùng để resume. C đưa user/sự kiện local.auth_changed ra main, main đưa
dữ liệu được phép qua preload. Password tồn tại tạm khi nhập/gọi auth; main/C dọn
sớm sau gửi hoặc hủy, không giữ password để tự login. Không hứa xóa tuyệt đối mọi
bản sao string JavaScript trong bộ nhớ có GC.

Khi pipe lỗi/C chết, main đánh dấu request pending theo độ chắc chắn: chưa chuyển
khỏi main là NONE; đã chuyển mà chưa có response là UNKNOWN. Không báo lỗi server
đã rollback. Renderer reload dùng registry main và local.status/state.get, không
spawn C thứ hai. App đóng làm mất pending RAM: không bảo đảm giữ op ID chưa rõ
sau mở app mới; bắt buộc sync activity/bài/kho trước tạo ý định tương tự.

C03: app mở lại lấy dữ liệu server sau xác thực, không tự phục hồi mọi draft cũ
hoặc hứa dữ liệu chưa ACK đã mất. Không có durable offline queue trong scope.
C05 đã duyệt API giới hạn **Electron main ↔ preload ↔ renderer**, không phải
lệnh NET hoặc một request mới gửi tới client C:

- getPendingOperations(): Promise<{items: PendingOperation[]}>; mỗi item gồm
  request_id, operation_id nullable, type, server_instance_id nullable, resource_id
  nullable, position nullable, selected_option nullable, status PENDING/UNKNOWN.
  selected_option chỉ dùng cho answer.save của chính user; không password/token/
  toàn bộ payload auth/admin. Áp pending cap main hiện có (32 request), không có
  history queue bền hoặc registry user cũ được renderer user mới truy cập.
- onPendingChanged(callback): subscription thông báo cần đọc lại registry; trả
  hàm unsubscribe, không xuất ipcRenderer thô. Main cập nhật registry khi request
  được nhận, hoàn tất, timeout hoặc đổi auth/instance context.
- UI subscribe trước đọc snapshot; lấy pending và state/attempt server, nếu có
  thay đổi trong lúc sync thì đọc lại trước mở sửa. Response đọc cũ không đè sync
  mới. Không nhận sửa trên vùng bài chưa đồng bộ; không giả định registry rỗng
  tự chứng minh mọi write đã lưu nếu chưa đọc trạng thái server.

Đây chỉ giữ request đã nhận trong RAM. Không có cam kết phục hồi click/draft
chưa gửi hoặc lưu draft qua đóng app; không thêm generic message API phía UI.

### 9.3. Event IPC

| Type | Body |
| --- | --- |
| local.ready | client_version, protocol_version |
| local.connection_changed | transport, reason (START/NETWORK_ERROR/TIMEOUT/RETRY/CONNECTED/STOPPED/SERVER_CHANGED) |
| local.auth_changed | auth, user nullable, reason (LOGIN/RESUME/LOGOUT/REPLACED/EXPIRED/PROCESS_START/SERVER_CHANGED) |
| room.changed / attempt.changed | Body NET đã kiểm tra, seq IPC mới |

session.revoked NET được chuyển thành local.auth_changed REAUTH_REQUIRED, không
đẩy token. Event/frame NET lạ không được chuyển nguyên vào renderer. local.status
và state.get là cách lấy trạng thái khi main/renderer bỏ lỡ event.

### 9.4. Logout tối thiểu — C06 đã duyệt

Nhận auth.logout IPC kể cả khi NET đang mất để xử lý logout local: chặn thao tác
thi mới và auto-resume của phiên cũ ngay; nếu NET có binding thì gửi auth.logout.
Dùng timeout nghiệp vụ 5s hiện có. Có logged_out:true từ server mới hiển thị đã
thu hồi server; không có mạng/timeout thì dùng lỗi LOCAL_NOT_CONNECTED hoặc
LOCAL_TIMEOUT theo effect có thể xác định, kèm thông báo đã đăng xuất local,
chưa xác nhận thu hồi server. Không tự tạo logged_out:true giả trên IPC.

Sau response/timeout/offline: xóa token local, đóng TCP cũ, local.auth_changed
UNAUTHENTICATED/LOGOUT, về login. Main không tiếp tục replay/logout nền; lần login
sau kết nối mới theo local.connect. Registry/personal UI cũ được dọn hoặc tách
khỏi context user mới, không hủy W đã gửi. Login mới theo D03 vẫn revoke phiên
server trước đó nếu logout offline chưa revoke. Không thêm refresh-token/rotation.

Server revoke rồi trả response logout đúng request/connection generation, không
bắt epoch cũ còn active sau revoke. Quy tắc tương tự áp dụng terminal response
login/resume theo ticket; domain response cũ vẫn bị lọc theo authority/context,
không được đưa vào UI user mới. Server có thể trở về UNAUTHENTICATED chờ client
đóng socket; client chọn đóng không làm đổi state phòng/bài.

## 10. Thứ tự, retry, revision và reconnect

### 10.1. Thứ tự xử lý

Reactor xếp command theo thứ tự frame của mỗi kết nối; Node dispatcher xử lý domain tuần
tự, kiểm tra deadline trước lệnh. Auth hoàn tất bất đồng bộ không hứa theo thứ tự
với client khác. Mọi completion kiểm tra connection ID/generation, session epoch
và authority phù hợp; không gửi response cho người nhận lại cùng fd.

Không nhận auth.login trên kết nối đã xác thực để thay user trong lúc lệnh cũ
đang chờ. Muốn login mới, logout/đóng rồi kết nối mới. Điều này không ngăn tài
khoản đăng nhập ở máy khác; login mới ở máy khác thu hồi phiên cũ theo D03.

### 10.2. Operation ledger và fingerprint

Với W, thứ tự: kiểm tra auth/quyền tài nguyên hiện tại → tìm user+operation_id →
nếu có thì so fingerprint và trả receipt; nếu chưa có thì validate yêu cầu và
bắt đầu transaction → kiểm tra state, lấy mốc xét deadline theo §10.4 → kiểm tra
revision → thay đổi + receipt → commit → response/event.
Mốc xét hạn nằm sau BEGIN, ngay trước phần mutation; không có chờ queue/hash/socket
giữa mốc xét hạn và mutation. Transaction không hợp lệ phải rollback.
Không kiểm tra OPEN/deadline trước replay, vì receipt lưu trước hạn phải tra lại
được sau khi bài chốt. Quyền tra bài cũ không phụ thuộc reservation hiện hành.

Fingerprint tính tại Node bằng node:crypto SHA-256 từ type + body hợp lệ theo codec canonical
của ứng dụng, không hash raw JSON. Định nghĩa canonical: cây sau decode/validate;
object key sort tăng theo byte ASCII; giữ thứ tự array; null/boolean/integer ở
biểu diễn JSON chuẩn không khoảng trắng; string UTF-8 giữ nguyên Unicode, chỉ
escape quote/backslash, LF thành `\n`, tab thành `\t`; schema đã cấm control khác.
Bọc canonical object `{body:<body>,type:<type>}` theo cùng quy tắc. Không gồm
request_id, operation_id, token, epoch hoặc dấu thời gian server. Không dựa vào
thứ tự key đầu vào hay formatter mặc định của hai thư viện.

Cùng user+op, cùng fingerprint: receipt cũ, request_id mới, replayed=true. Khác
type/body: OPERATION_CONFLICT, không áp dụng nội dung mới. Lưu cả no-op W thành
công; lỗi validation/quyền/conflict/busy không ghi receipt. Lỗi không commit có
thể được thử lại, nhưng không đổi body với op cũ nếu chưa biết lần cũ đã commit.

**V1 giữ operations cùng vòng đời dữ liệu nghiệp vụ, chưa tự xóa theo TTL.** Không
cho retry ledger bị xóa rồi tự áp dụng như lệnh mới. Tài liệu 4 tính dung lượng,
đặt ngưỡng và vận hành theo C08 tại §12.3/tài liệu 04 §5.3. Không chặn mọi W
chung một nhánh: ngừng nhận mới nhưng ưu tiên lưu/nộp/chốt của ca đang thi khi DB
còn ghi được. Đọc/replay vẫn được phục vụ theo quyền/credit; không tự purge.

Quyền replay được xét theo tài nguyên gốc: thành viên đã leave vẫn được tra receipt
leave do chính mình tạo; chủ phòng vẫn tra được create/start/end của phòng mình;
bài cũ vẫn thuộc user sau khi đã được giải phóng reservation. Với admin mutation,
vẫn yêu cầu ADMIN hiện hành. Không áp điều kiện phải còn reservation/OPEN/WAITING
để cấm receipt hợp lệ; cũng không dùng receipt để phục hồi quyền đã revoke.

### 10.3. Lưu đáp án

Mỗi câu chỉ một save chưa rõ kết quả đang bay ở client. Người dùng đổi nhanh thì
giữ lựa chọn mới nhất trong pending local của câu, đợi save trước xác nhận/reconcile
rồi mới gửi save mới với operation_id mới và expected_revision hiện hành. Không
đổi body của save cũ để thay lựa chọn. Nhiều câu khác nhau có thể có save đang chờ
trong giới hạn chung; client không đánh dấu lựa chọn mới “đã lưu” nhờ ACK lựa chọn cũ.

REVISION_CONFLICT trả current_revision (và chỉ trong quyền bài của chính mình).
Client attempt.get rồi đối chiếu lựa chọn; không tự nâng revision và ghi đè mù.
Lựa chọn local chưa xác nhận không được sync lên đè trạng thái mới sau reconnect.
UI thể hiện riêng server_saved và current_selection/pending; số câu đã lưu tính
theo server_saved. Mỗi write thành công tăng revision một lần dù retry bao nhiêu.

### 10.4. Nộp bài

UI xác nhận ý định → khóa sửa mới → gửi nốt các lựa chọn hiện tại → đợi xác nhận
tất cả save → attempt.submit. Nếu còn save UNKNOWN, sync/retry **cùng op** trước,
không cứ gửi submit rồi báo nộp đủ. Nếu deadline đến trong khi đợi, server chốt
những gì đã lưu; UI sync và báo đúng, không ép save muộn vào bài.

**C07 — đã duyệt ngày 03/11/2026.** Với save/submit mới, kiểm tra auth/quyền,
tra receipt/fingerprint, validate yêu cầu, bắt đầu transaction rồi kiểm tra state
và lấy t_admit bằng clock monotonic ngay trước phần mutation. Chỉ nhận khi
`t_admit < deadline`; bằng deadline là hết giờ. Kiểm tra revision và mutation
liền nhau trong Node dispatcher sở hữu DB, không chờ I/O/hash/queue ở giữa. Validation/BEGIN
kéo quá hạn thì từ chối; không tái dùng mốc lúc Node dispatcher nhận lệnh hoặc reactor nhận
frame. Write được nhận trước hạn có thể commit sau hạn; chỉ ACK khi commit thành
công. Nếu rollback, không có receipt thành công. Timer chốt không đợi client online.

Thứ tự ưu tiên với request hợp lệ: auth/quyền → receipt replay/conflict →
state/deadline → revision. Việc xử lý timer trước lệnh không được xóa khả năng
replay receipt cũ. Sau khi kiểm tra quyền, trạng thái đã FINALIZED được xét theo
reason đã lưu, không đổi EARLY_SUBMIT/HOST_END thành TIME_EXPIRED chỉ vì giờ đã qua.

| Điều kiện sau khi không tìm thấy receipt cũ | answer.save mới | attempt.submit mới |
| --- | --- | --- |
| FINALIZED, TIME_EXPIRED | DEADLINE_EXCEEDED | DEADLINE_EXCEEDED |
| FINALIZED, HOST_END | ATTEMPT_FINALIZED | ATTEMPT_FINALIZED |
| FINALIZED, EARLY_SUBMIT | ATTEMPT_FINALIZED | Thành công no-op, receipt mới, không chấm lại |
| OPEN, đã tới hạn, chốt TIME_EXPIRED thành công | DEADLINE_EXCEEDED | DEADLINE_EXCEEDED |
| OPEN, đã tới hạn nhưng chốt DB chưa thành công | FINALIZATION_PENDING | FINALIZATION_PENDING |
| OPEN, còn hạn | Kiểm tra revision rồi lưu | Chốt EARLY_SUBMIT |

Khi tới hạn, B finalizer được A timer/handler gọi để chốt; transaction cần rollback
nếu lỗi, không ACK dữ liệu chưa commit. FINALIZATION_PENDING vẫn khóa sửa và không
công bố điểm. Receipt cũ hợp lệ trả kết quả cũ, không đi vào bảng từ chối này.
Quy tắc áp dụng giống nhau cho EXAM và PRACTICE.

### 10.5. Retry và reconnect

**C04:** main/C ghi server_instance_id vào context mỗi W. Sau hello mới, nếu
instance khác thì không resume bằng token cũ hoặc tự replay W cũ. Phát
local.connection_changed reason SERVER_CHANGED, chuyển auth REAUTH_REQUIRED
(reason SERVER_CHANGED), yêu cầu login/sync; các W cũ vẫn UNKNOWN/cần đối chiếu,
không báo rollback/mất dữ liệu. Không để pending cũ khóa bài mới vô thời hạn:
UI ghi nhận cần đối chiếu và chỉ mở thao tác sau sync, không tự chuyển W cũ thành
ý định mới. Chưa có API recovery khác-instance; khi chưa xác định dataset phù hợp
thì không replay kể cả cùng operation/resource ID. K07 về DB có ca dở vẫn giữ.



Client C chỉ retry tự động khi vẫn trong thời gian xử lý một request IPC, dùng
cùng op/body và request_id NET mới. Khi đã trả UNKNOWN cho main, C không âm thầm
chạy mutation nền; main giữ pending và chủ trì phục hồi bằng các request IPC mới.
Sau reconnect, có thể tự tra receipt/read state. Retry answer.save chỉ khi bài
còn writable, ý định lưu vẫn còn và dùng đúng op/body chưa rõ; retry submit chỉ
khi ý định nộp vẫn còn và các save đã được giải quyết. Các lệnh create/configure/
join/leave/cancel/start/end/practice.start/admin chưa rõ thì tra receipt, sync, yêu cầu
người dùng xác nhận trước gửi lại nếu chưa tìm được. Không tự bắt đầu/kết thúc
một ca thi trễ vài phút chỉ vì mạng vừa trở lại.


| Tình huống | Cách làm |
| --- | --- |
| Đọc timeout | Có thể gửi request_id mới; response cũ không dùng đè snapshot mới hơn. |
| BUSY/RATE_LIMITED với effect=NONE | Đợi retry_after_ms + jitter, retry có giới hạn; W vẫn cùng op/body cho cùng ý định. |
| W timeout/mất mạng sau gửi | UNKNOWN; không cấp operation_id mới. Reconnect, auth, sync rồi tra operation.get hoặc retry cùng op/body. |
| REVISION/VERSION_CONFLICT | Sync, cho UI đối chiếu; sửa lại là ý định mới với op mới. Không auto loop. |
| Auth thất bại/replaced | Không tự gửi lại password hoặc đấu resume. Yêu cầu người dùng login. |
| Không có TCP | Không tích lũy request vô hạn, không queue tự động start/end/submit tương lai; hiển thị offline. |

Lệnh bổ sung **operation.get** (R, mọi user đã auth): body `{operation_id}`;
reply `{found:false,receipt:null}` hoặc `{found:true,receipt:{type,body}}`.
Chỉ tra operation của chính user và quyền tài nguyên hiện hành, body là receipt
an toàn đã lưu. found=false không chứng minh request cũ không còn trong queue;
retry cùng op mới giải quyết race. Nếu không đủ quyền thì FORBIDDEN, không rò
operation của người khác. Lệnh này không lấy history/result và không có key/điểm.

Reconnect: đóng stream cũ → backoff → TCP mới → hello → resume nếu còn token →
state.get → room.get/attempt.get → fetch item thiếu → đối chiếu pending operations
→ mở thao tác hợp lệ. Token invalid thì login lại; trạng thái bài vẫn theo user.
Không regenerate đề, reset giờ hoặc tự join một phòng RUNNING.

Đọc sync mới nhất thắng theo generation của lần đồng bộ phía client. Khi bắt đầu
sync, dừng phát save mới, xử lý hết/đối chiếu các save chưa rõ trước khi mở lại;
event trong lúc sync chỉ đánh dấu cần refresh thêm. Không so sánh event_seq giữa
hai TCP. Metadata thời gian cũ chỉ dùng hiển thị thận trọng, không gia hạn.

## 11. Mã lỗi

Nếu không ghi khác: effect=NONE, retry_after_ms=null, details={}. UNKNOWN chỉ dùng
khi không thể kết luận hiệu ứng của request; không dùng APPLIED trên error.

| Code | Ý nghĩa | Client xử lý |
| --- | --- | --- |
| UNSUPPORTED_VERSION / HANDSHAKE_REQUIRED | Version/thứ tự handshake không đúng | Dừng kết nối, không đoán protocol. |
| UNKNOWN_TYPE / INVALID_ARGUMENT | Lệnh không hỗ trợ hoặc sai schema/giá trị | Sửa request, không retry mù. details.field? là tên trường sai; thiếu thì details={}, không nội dung bí mật. |
| AUTH_REQUIRED / AUTH_IN_PROGRESS | Chưa có binding hoặc auth đang chạy | Login/chờ auth. |
| INVALID_CREDENTIALS | Sai username/password, account vô hiệu | Thông báo chung. |
| USERNAME_TAKEN | Đăng ký trùng | Chọn tên khác hoặc login nếu lần đăng ký trước chưa rõ. |
| SESSION_INVALID / SESSION_EXPIRED / SESSION_REPLACED | Token/binding không còn dùng được | Dừng resume tự động khi replaced; login theo người dùng. |
| FORBIDDEN / NOT_FOUND | Không có quyền/không thấy tài nguyên | Không suy ra có thể truy cập bằng đổi ID. API bài riêng trả NOT_FOUND cho cả không tồn tại và không sở hữu. |
| ACTIVE_ACTIVITY | Còn reservation phòng/luyện tập | state.get, quay về hoạt động hiện tại; không tự rời/nộp. |
| ROOM_CANCELLED / ROOM_WAIT_EXPIRED | Phòng đã hủy hoặc đã quá hạn chờ nhưng DB chưa commit cancel | Refresh room/state; không cho join/config/start, chỉ giải phóng chỗ sau commit. |
| ROOM_NOT_WAITING / ROOM_NOT_RUNNING / ROOM_FULL / OWNER_CANNOT_LEAVE | Điều kiện phòng không hợp lệ | room.get hoặc chọn phòng khác nếu được phép. |
| INSUFFICIENT_QUESTIONS | Kho thiếu theo cấu hình | details available:{easy,medium,hard}; sửa cấu hình, không sinh đề thiếu. |
| REVISION_CONFLICT / VERSION_CONFLICT | Answer hoặc config/question/topic version đã đổi | details current_revision hoặc current_version; sync/đối chiếu. |
| OPERATION_CONFLICT | Tái dùng op với nội dung khác | Dừng, kiểm tra pending registry; không đổi ID để né kết quả chưa rõ. |
| DEADLINE_EXCEEDED / ATTEMPT_FINALIZED | Không còn quyền sửa/nộp mới | attempt.get, hiển thị trạng thái server. |
| FINALIZATION_PENDING | Đã khóa sửa nhưng chưa lưu xong chốt bài | Đọc lại sau 1 giây, không mở sửa. |
| RESULTS_NOT_RELEASED | Phòng chưa ENDED/chưa công bố | Chờ room.changed/refresh, không lấy đường chart khác. |
| BUSY / RATE_LIMITED | Từ chối trước áp dụng vì giới hạn | retry_after_ms integer 100..60000, retry theo cap. |
| RESOURCE_LIMIT | Hết ngân sách/ledger hoặc version đạt trần | Báo vận hành; không tự xóa dữ liệu. |
| DATABASE_ERROR / INTERNAL_ERROR | Lỗi xử lý, rollback đã xác định | Báo lỗi; retry cùng W op sau sync nếu người dùng cần. |
| OUTCOME_UNKNOWN | Không xác định commit | effect=UNKNOWN; ngừng ghi nếu cần bảo toàn DB, đối chiếu cùng op khi server trở lại. |
| LOCAL_NOT_CONNECTED / LOCAL_AUTH_REQUIRED | C chưa gửi NET | effect=NONE; kết nối/login trước. |
| LOCAL_TIMEOUT / LOCAL_CONNECTION_LOST / LOCAL_BRIDGE_CLOSED | Mất kết quả phía local | NONE nếu chứng minh chưa gửi byte NET, còn lại UNKNOWN. Không báo đã lưu. |
| LOCAL_BRIDGE_PROTOCOL_ERROR | Frame stdout IPC không hợp lệ | Main dừng child, request đã chuyển mà chưa rõ trả UNKNOWN; khởi chạy lại có kiểm soát. |
| LOCAL_QUEUE_FULL | C/main chưa tiếp nhận request | effect=NONE; UI giữ pending có giới hạn. |

Lỗi FRAME/UTF8/envelope không bắt buộc tạo response vì không tin request_id của
frame lỗi. Với envelope hợp lệ và lỗi body, trả đủ tương quan request.

## 12. Timeout, retry và ngân sách baseline

### 12.1. Timeout baseline đề xuất

| Tham số | Giá trị baseline | Hành vi |
| --- | --- | --- |
| Child ready / TCP connect / hello response | 5 giây mỗi bước | Timeout đóng bước kết nối; không báo dữ liệu server đã rollback. |
| Phòng chờ | 1.800 giây từ room.create, không gia hạn | Chủ hủy hoặc server timeout → CANCELLED; không còn áp dụng sau start hợp lệ. |
| Partial frame | 10 giây từ byte đầu | Đóng stream dở. |
| Request nghiệp vụ thường | 5 giây từ lúc C nhận IPC | Timeout local không hủy transaction đã gửi. |
| Login/register hash job | 60 giây từ admission | Node dispatcher bỏ job hết hạn trước áp dụng; auth IPC/NET đợi tối đa 65 giây. |
| Ping interval / peer idle | 10 / 35 giây | Theo mục 6; không thay timeout nghiệp vụ. |
| Request W đang bay | Retry tự động tối đa 2 lần sau lần đầu, chỉ khi còn budget IPC | Chỉ BUSY/RATE_LIMITED với NONE và cùng op/body. Timeout trả UNKNOWN; phục hồi dùng request IPC mới theo mục 10.5, không retry mutation nền. |
| Reconnect | 0,5s → 1 → 2 → 4 → 8 → tối đa 10s, jitter ±20% | Tự thử tối đa 2 phút, sau đó nút kết nối lại; không ảnh hưởng deadline server. |
| Close child có kiểm soát | 2 giây | Flush được thì flush, sau đó dừng; không bảo đảm gửi hết khi bên kia không đọc. |

Không tăng timeout dài để che Node/DB nghẽn. Mỗi lần retry có request_id NET mới;
timeout trên IPC áp cho một lần gọi, C không trả response cũ lần hai khi background
sync tìm thấy commit. UI nhận kết quả phục hồi qua truy vấn mới.

### 12.2. Hard cap đề xuất, đồng bộ tài liệu 4

| Tài nguyên | Baseline |
| --- | --- |
| TCP mở toàn server | 128, trong đó tối đa 64 chưa xác thực; mục tiêu 50 người hoạt động. |
| R/W đang chờ mỗi kết nối | 8 command, tối đa 128 KiB payload command chưa xử lý; auth chỉ 1. |
| RX mỗi kết nối | Một frame dở tối đa 65.540 byte; xử lý phần dư theo chunk, không append cả recv vô hạn. |
| TX mỗi kết nối | 128 KiB tính cả frame header, trong đó dự phòng 8 KiB cho control/error; max 64 frame. |
| Queue command / completion BP | Mỗi đầu/chiều 1024 phần tử/8 MiB gồm 960 slots/7.5 MiB credit thường và 64 slots/512 KiB control cục bộ; tính metadata BP. Tổng buffer hai đầu/RSS theo tài liệu 04 và §18.4. |
| Queue băm Node | 64 job chờ + 1 scrypt async đang chạy, 1 job/kết nối; rate limit và timeout theo tài khoản/IP. |
| IPC main/C | TX mỗi chiều 256 KiB, tối đa 32 frame; main pending tối đa 32 request, NET active tối đa 8. |
| Mỗi lượt poll/kết nối | Tối đa 64 KiB đọc và 64 KiB ghi, tối đa 16 frame chuyển command rồi nhường lượt. |
| Frame JSON emit | Body + envelope tối đa 65.536 byte; trang encode hướng tới ≤60 KiB để chừa biên. |

Đây là cap thiết kế, không phải RAM dự toán bằng tổng payload. Parser allocation,
thread stack, hash memory và kernel socket buffers tính riêng ở tài liệu 4. Đặt
cap actual allocation để payload nhỏ không tạo số node JSON/malloc vô hạn.

C poll xử lý pipe nonblocking, Node transaction kết thúc trước chờ stdout drain. Admission
phải giữ trước slot completion cho request nhận vào; auth response cũng dùng
reservation thường, lifecycle control có vùng riêng. Có thể dùng completion descriptor nhỏ tham chiếu dữ liệu theo credit
thay vì giữ cả bản serialize. Không cho request vừa nhận hết credit xong vẫn đòi
enqueue response không giới hạn. Theo tài liệu 4, mỗi đầu/chiều dành 64 slots/512 KiB control cục bộ;
phần thường tối đa 960 slots/7,5 MiB. Giữ byte credit worst-case response và trả
khi reactor tiêu thụ/dọn; triển khai phải kiểm chứng saturation, không chỉ set cap.

Start chỉ phát event nhỏ; luồng ứng dụng client tự điều phối lấy items từng trang
qua IPC và TCP client C, tối đa một item-page đang chờ/client. C đảm nhiệm truyền
request/response; không thêm luồng tự lấy đề độc lập cạnh tranh với UI. Nhờ vậy 50 đề
không cần serialize vào một completion burst. Nếu client
không đọc, dừng cấp trang mới; khi send không tiến triển 15 giây thì đóng binding.
Đã commit vẫn bền và lấy lại được; không âm thầm drop response save.

Rate limit ban đầu: tối đa 20 command/giây/binding (burst 40), ping tối đa
1/giây; auth theo IP 5 job/giây burst 50 để lớp login cùng đợt trên cùng IP vẫn
có cơ hội admission, theo username 5 lần/phút. Đây là tham số phải thử tải, không
được dùng nó để tuyên bố đã chống DoS. BUSY có backoff/jitter, không vòng lặp bận.

Giới hạn hoạt động/reservation toàn server là 50, gồm cả member WAITING/RUNNING
offline hoặc đã nộp sớm và lượt PRACTICE OPEN; tối đa 50 phòng WAITING/RUNNING.
Đây là baseline vận hành đề xuất ở tài liệu 4, không tạo vô hạn phòng chờ.
Vượt cap trả RESOURCE_LIMIT khi nhận activity mới; không đuổi bài đang làm.
Không nhầm mục tiêu 50 hoạt động với max_connections=128 hoặc quota auth; cùng
một tài khoản reconnect không chiếm thêm reservation.

### 12.3. C08 — admission dung lượng theo loại thao tác

| Loại request/công việc mới, sau nhánh receipt hợp lệ | Khi đã gần đầy |
| --- | --- |
| auth.register; room.create/configure/join/start; practice.start; mọi admin.* mutation | RESOURCE_LIMIT, effect=NONE; không ghi receipt từ chối. Join của thành viên cũ đã cùng phòng là đọc trạng thái no-op được phép; người mới bị chặn. |
| answer.save, attempt.submit của ca đang chạy/đã nhận | Vẫn xử lý theo quyền/state/deadline/revision và DB; ghi answer/result + receipt atomically, không bỏ dedup để tiết kiệm chỗ. |
| room.leave/cancel/end, timer expiry/finalize | Vẫn xử lý; commit rồi mới giải phóng reservation/công bố; giữ no-op và retry hiện hữu. |
| Read/state/sync/replay, login/resume/logout, ping | Vẫn xử lý theo hạn mức/authority hiện có; không phát sinh thêm activity. |

Ngưỡng, disk sampling và điều kiện phục hồi ở tài liệu 04 §5.3 là một policy do
Node dispatcher áp dụng, không phải TCP rwnd/congestion control. Chặn trước
mutation mới; receipt cũ đúng quyền vẫn replay dù request type thuộc nhóm bị chặn.
Không dừng thao tác đã nhận vì ngưỡng vừa thay đổi ở giữa transaction.
RESOURCE_LIMIT không được retry mù; UI giải thích tạm không nhận hoạt động mới.
Lỗi ghi DB thật trả lỗi theo §11/effect của transaction, không giả RESOURCE_LIMIT
để khẳng định chắc chắn rollback nếu commit chưa rõ. Không cam kết ghi khi disk đầy.

## 13. Ví dụ các luồng đầy đủ

### 13.1. Tạo, tham gia và bắt đầu

```text
Mỗi máy: local.ready → local.connect → hello NET → auth.login → state.get
Chủ: catalog.list → room.create(op1) → room.get
Bạn khác: room.list → room.join(op2) → room.get
Thành viên nhận room.changed(MEMBERSHIP), refresh roster
Chủ: room.start(op3, expected_config_version=1)
Server: snapshot riêng tất cả thành viên → RUNNING + commit
Mỗi binding nhận room.changed(STARTED) → room.get → my_attempt_id
Ứng dụng mỗi máy: attempt.get → attempt.items từng trang qua client C → UI làm đúng đề của mình
Người mới join sau commit start: ROOM_NOT_WAITING
Thành viên offline lúc start: resume → state.get → lấy đúng attempt đã được gán
```

### 13.2. Save đã commit nhưng response mất

```text
C → server: answer.save(request r1, operation x, expected_revision=0, B)
Server: commit answer revision=1 + receipt x
TCP đứt trước khi C biết response → UI: chưa xác nhận
Reconnect/hello/resume → attempt.get: B, revision=1
C → server: operation.get(x) hoặc answer.save(request r2, operation x, cùng body)
Server: receipt x, không tăng revision lần hai
UI chỉ đánh dấu đúng lựa chọn B đã xác nhận; nếu local đang chọn C thì gửi save mới
```

### 13.3. Nộp sớm và chờ công bố

```text
UI khóa sửa → đợi save xác nhận → attempt.submit(op_submit)
Server commit FINALIZED/EARLY_SUBMIT → receipt không điểm
result.get trong room RUNNING → RESULTS_NOT_RELEASED
state.get vẫn activity ROOM; practice.start/room khác → ACTIVE_ACTIVITY
Deadline/host end → chốt các bài còn OPEN + room ENDED + xóa reservation, commit
room.changed(ENDED) → result.get/history.list → điểm được công bố
```

### 13.4. Luyện tập

```text
Không reservation → practice.start(op_practice, Config)
Server commit attempt PRACTICE và reservation → trả AttemptMeta
attempt.items → answer.save → submit hoặc timer chốt
Commit FINALIZED + giải phóng reservation → result.get thành công ngay
Không có room giả, không đợi người khác, mất mạng vẫn giữ deadline riêng
```

### 13.5. Vector canonical và framing để hai người đối chiếu

Input body có key đảo thứ tự vẫn cho cùng canonical cho ví dụ answer.save:

```text
{"body":{"attempt_id":"101","expected_revision":0,"position":1,"selected_option":"B"},"type":"answer.save"}
```

Chuỗi này dài **107 byte UTF-8**, không có LF cuối. Fingerprint là SHA-256 của đúng
chuỗi trên, có hex digest `0b109b3d8bd9258290bcdafceef102af9cb4b9067eca1f7ebd5e1f32ad29ea88`;
không hash dấu backtick Markdown. Mục đích vector là kiểm tra encoder,
không đưa password hoặc key đáp án vào fingerprint. Vector frame tối giản để thử
framer dùng hex `000000027b7d`: 4 byte length + `{}`; chưa phải request hợp lệ.

## 14. Đối chiếu dữ liệu và phân công

Hai trường version cần cụ thể hóa thêm so với mô hình logic tài liệu 2:

- rooms.config_version: integer bắt đầu 1, tăng mỗi room.configure; không tăng
  vì presence/join. Start so expected_config_version trong cùng transaction.
- topics.version: integer bắt đầu 1, tăng mỗi admin.topic.update.

Không thêm bảng event log, timer cho mỗi client hoặc connection/session vào DB.
state.get suy ra Activity từ reservation; không suy từ một biến UI. Operations
receipt chứa type/body an toàn và fingerprint; auth không dùng operation ledger.

| Chủ trì | Phần giao thức cần triển khai/bảo vệ |
| --- | --- |
| Minh Quân | Framing nhận/parse, hello/auth/session/heartbeat/reconnect, state/room API, deadline, config_version, presence; Node auth queue. |
| Hoàng Quân | Encode/queue gửi/partial send, catalog/admin bank, practice/attempt/items/answer/submit/results/history, revision/operation receipt, phân trang đề. |
| Tích hợp chung | Codec envelope, mapping IPC–NET, canonical fingerprint, error model, queue credit, vector byte và lỗi; mỗi người làm UI/client/server/data/test phần mình. |

Một cơ chế dùng chung có một implementation tích hợp, không hai định dạng frame
hoặc hai socket readers. Quyền sở hữu chi tiết phần chung và mốc code ở tài liệu 5.

## 15. Kiểm chứng giao thức trước tích hợp UI

| Mã | Tình huống | Kết quả cần chứng minh |
| --- | --- | --- |
| PT-01 | Chia header 1+3, chia payload nhiều đoạn, gộp nhiều frame; có Unicode | Đúng số message/byte, không mất dư, không nhầm ký tự với length. |
| PT-02 | Length 0/1/65537, EOF giữa frame, JSON lỗi/key trùng/trailing/NUL/độ sâu | Từ chối đúng tầng, không cấp phát theo length bậy hoặc chạy command dở. |
| PT-03 | Partial send, EAGAIN/EINTR, peer ngừng đọc | Offset đúng, không nhân đôi frame, cap/timeout có tác dụng; client khác tiếp tục. |
| PT-04 | Hello/version sai, gọi trước auth, auth đang pending | Đúng state và mã lỗi, không vượt bước xác thực. |
| PT-05 | Resume/login mới trong lúc command/hash cũ còn chờ; fd tái dùng | Không cấp lại quyền cũ, không gửi dữ liệu sang fd người khác. |
| PT-06 | Save commit rồi mất response, retry qua phiên mới; op cùng ID khác body | Một lần tăng revision, replay receipt đúng; đổi body bị conflict. |
| PT-07 | Click liên tiếp cùng câu, phản hồi cũ đến sau | Không ghi đè lựa chọn mới, UI phân biệt pending và saved. |
| PT-08 | Submit còn save pending, queue qua deadline, tất cả offline | Đúng D05, timer tự chốt, không nhận save muộn. |
| PT-09 | Nộp sớm đọc result/history, bắt đầu hoạt động mới | Không lộ điểm, còn reservation tới ENDED. |
| PT-10 | 50 người start, lấy nhiều trang riêng; sửa kho sau gán | Snapshot đúng người/cấu hình, không key, burst không tự vượt queue. |
| PT-11 | Roster mất mạng, close event cũ sau resume, join sát start | Presence/binding đúng; thành viên mới bị khóa, thành viên cũ lấy đúng bài. |
| PT-12 | IPC lệnh/token trái phép, log lẫn stdout, renderer reload/C chết | Whitelist/lọc bí mật hoạt động; không spawn trùng hay báo lưu giả. |
| PT-13 | ID >2^53, version có phần lẻ, overflow, option/control không hợp lệ | Validation nhất quán ở main/C/server, không làm tròn ID hoặc bypass quyền. |
| PT-14 | Catalog/admin paging, conflict version, history paging | Không lộ kho/key cho user, không ghi đè bản mới, trang theo ID ổn định. |

PT là tiêu chí chưa chạy, không phải kết quả probe. Tài liệu 4 thiết kế bot 50
thí sinh chạy hành vi theo chính giao thức này, đo cả lưu/nộp, không chỉ echo.

## 16. Bảng chuyển trạng thái và ranh giới hoàn thành

### 16.1. Kết nối và xác thực phía server

Các state transport/auth dưới đây là hai khía cạnh, không lưu cả hai thành một
cột trạng thái phòng/bài. CLOSED dọn transport, không xóa membership/attempt.

| State hiện tại | Trigger và guard | Effect/response | State sau |
| --- | --- | --- | --- |
| TCP_CONNECTED | hello hợp lệ trong 5s | Trả hello, cấp instance/limit | UNAUTHENTICATED |
| TCP_CONNECTED | Sai hello/version hoặc hết hạn | Error nếu có thể, đóng fd | CLOSED |
| UNAUTHENTICATED | login/register hợp lệ và có credit hash | Cấp ticket có deadline, không giữ transaction | AUTH_PENDING |
| AUTH_PENDING | Register hash xong, ticket còn hợp lệ | INSERT USER/commit, trả user; không cấp phiên | UNAUTHENTICATED |
| AUTH_PENDING | Login verify đúng, version/ticket/connection còn hợp lệ | Thay phiên cũ, gắn binding, trả token riêng cho C | AUTHENTICATED |
| AUTH_PENDING | Sai mật khẩu, job lỗi/hết hạn, username trùng | Trả lỗi thích hợp, dọn password/ticket | UNAUTHENTICATED |
| UNAUTHENTICATED | Resume token hợp lệ | Chuyển binding, thu hồi kết nối cũ | AUTHENTICATED |
| UNAUTHENTICATED | Resume token sai/hết hạn | SESSION_INVALID/EXPIRED, không cấp quyền | UNAUTHENTICATED |
| AUTHENTICATED | Logout hợp lệ | Revoke RAM, trả receipt control; không leave/submit | UNAUTHENTICATED |
| AUTHENTICATED | Phiên bị thay/revoke/hết hạn | Chặn lệnh cũ, event nếu có thể, đóng stream | CLOSED |
| Mọi state đang mở | Ping hợp lệ | Echo nonce theo quota; không gia hạn phiên | Giữ nguyên |
| Mọi state đang mở | EOF/lỗi/timeout/vi phạm frame | Dọn queue/buffer, báo close theo generation | CLOSED |

### 16.2. Phòng và reservation

| State | Trigger và guard | Effect trong transaction | State sau |
| --- | --- | --- | --- |
| Chưa có | room.create, không activity, đủ câu | Tạo phòng, chủ là member, reservation | WAITING |
| WAITING | join hợp lệ, còn chỗ, không activity khác | Thêm member/reservation | WAITING |
| WAITING | Thành viên thường leave | Xóa membership/reservation của người đó | WAITING |
| WAITING | Chủ configure, version đúng, đủ câu | Tăng config_version, lưu config | WAITING |
| WAITING | Chủ start, version đúng, snapshot tất cả thành công | Tạo attempts/items, lưu mốc chung | RUNNING |
| WAITING | Start lỗi/thiếu câu | Rollback, kiểm tra lại hạn chờ | WAITING hoặc CANCELLED khi timeout được commit |
| WAITING | Chủ cancel hoặc tới hạn chờ 30 phút | CANCELLED + reason/time + giải phóng room reservations, không tạo bài/điểm | CANCELLED |
| CANCELLED | Chủ cancel/retry lại | Trả terminal state/receipt cũ, không đổi reason/thời điểm | CANCELLED |
| RUNNING | Submit riêng một người | Chốt bài đó, giữ reservation | RUNNING |
| RUNNING | Deadline hoặc chủ end | Chốt các bài còn OPEN, lưu ENDED, giải phóng reservations | ENDED |
| RUNNING | Lỗi DB khi chốt | Chưa công bố; deadline đã tới vẫn khóa sửa. Với host end rollback trước hạn thì phòng còn RUNNING, host retry | RUNNING |
| RUNNING/ENDED/CANCELLED | Join người mới | ROOM_NOT_WAITING hoặc ROOM_CANCELLED, không thêm member/bài | Giữ nguyên |
| Mọi state có phòng | Thành viên cũ disconnect/resume | Chỉ đổi presence/binding, không sinh lại đề | Giữ nguyên |
| ENDED | end lại hoặc đọc kết quả đúng quyền | Trả trạng thái/kết quả đã lưu | ENDED |

### 16.3. Bài và công bố

| State | Trigger và guard | Effect | State sau |
| --- | --- | --- | --- |
| Chưa có | Start phòng hoặc practice.start thành công | Tạo snapshot, đề riêng, deadline; practice giữ reservation | OPEN |
| OPEN | Save mới, trước hạn, đúng revision | Answer + operation commit, ACK revision mới | OPEN |
| OPEN | Save/retry đã commit cùng op/body | Replay, không tăng revision | OPEN hoặc FINALIZED hiện tại |
| OPEN | Submit hợp lệ | Chấm/lưu một kết quả EARLY_SUBMIT | FINALIZED |
| OPEN | Đến hạn/host end hợp lệ | Chấm/lưu TIME_EXPIRED/HOST_END | FINALIZED |
| OPEN | Lỗi chốt DB | Không ACK giả; quyền sửa vẫn theo deadline/trạng thái phòng | OPEN về lưu trữ |
| FINALIZED | Save mới | TIME_EXPIRED: DEADLINE_EXCEEDED; EARLY_SUBMIT/HOST_END: ATTEMPT_FINALIZED; không đổi dữ liệu | FINALIZED |
| FINALIZED | Retry W đã commit đúng quyền | Trả receipt an toàn, không chấm lại | FINALIZED |
| FINALIZED | result.get | Chỉ trả khi practice hoặc room ENDED | FINALIZED |

Practice giải phóng reservation cùng transaction FINALIZED. Exam giữ tới ENDED
ngay cả khi đã nộp. Mất mạng/đăng xuất không phải trigger kết thúc phòng hoặc bài.

### 16.4. Hợp đồng thực thi bổ sung

- Không để SIGPIPE làm chết tiến trình khi socket hoặc pipe đầu kia đã đóng.
  Cài chính sách signal/I/O nhất quán trước vòng chạy, xử lý EPIPE như lỗi kênh;
  pipe BP gãy áp §18, TCP peer gãy chỉ dọn đúng peer. PT-03/PT-26/PT-28 phải
  có ca ghi sau peer/child đóng; không chỉ thử recv=0.

- Client connect không chặn: connect trả EINPROGRESS thì chờ poll writable/error,
  kiểm tra getsockopt(SO_ERROR); writable không tự chứng minh connect thành công.
  Lỗi/timeout dọn socket, lần thử sau socket mới. [Nguồn: Linux connect(2)](https://man7.org/linux/man-pages/man2/connect.2.html).
- recv=0 trên TCP là EOF; read(stdin)=0 là pipe đóng. Không áp quy tắc đó để nói
  mọi syscall trả 0 đều nghĩa peer đóng. send với length còn lại >0 nhưng trả 0
  phải tránh busy loop và áp chính sách lỗi/timeout.
- Tối đa 8 request NET đang hoạt động gồm đọc/ghi; heartbeat có một slot control
  riêng. Client giữ slot trước gửi. request_id trùng một request đang xử lý nhận
  INVALID_ARGUMENT và đóng, không tạo hai response có cùng ID.
- Account/auth_version thay đổi là cơ chế nội bộ/setup; v1 không tự thêm API đổi
  mật khẩu/quản trị user. Schema dự phòng không có nghĩa phải build tính năng đó.
- Khi ledger gần ngưỡng, áp ma trận C08 §12.3 thay vì chặn mọi W. Auto-finalize
  không tạo operation client; write được ưu tiên vẫn cần commit thành công.
  Chạm cảnh báo không phải lý do ngừng timer, disk lỗi thực sự không được ACK giả.
- Các cap queue tính cả auth/control dự phòng trong tổng, không cộng phần dự
  phòng ngoài trần mà không ghi nhận. Credit phải bao gồm worst-case response;
  request đọc trang lớn có thể bị BUSY trước thực thi khi chưa có credit byte.

### 16.5. Kiểm chứng bổ sung sau review

| Mã | Tình huống | Kết quả cần chứng minh |
| --- | --- | --- |
| PT-15 | Chủ cancel, user thường cancel, retry sau timer cancel, cancel/start cùng lúc | Đúng quyền/state, terminal reason không đổi, không attempt/điểm, giải phóng đúng room. |
| PT-16 | Chờ tới hạn, reconnect/config/join không gia hạn, restart WAITING | Quá hạn không start; tự hủy cả khi offline, không cấp lại 30 phút; timer cũ không hủy RUNNING. |
| PT-17 | Mất ACK lưu và đóng app | Sync đúng dữ liệu server, không báo lưu giả hoặc cam kết durable offline draft. |
| PT-18 | Đổi server instance/dataset có ID trùng, main còn pending | Không resume token/replay W cũ; login/sync; UNKNOWN không bị giả thành rollback hoặc request mới. |
| PT-19 | Renderer reload trước/sau commit và response | Đọc registry main + server, không mở sửa khi chưa sync, ACK cũ không xác nhận draft mới. |
| PT-20 | Logout online/offline/timeout rồi login user khác | Không auto-resume cũ, token được dọn/TCP đóng, terminal ACK không bị drop sau revoke, callback/pending cũ không lộ sang user mới. |
| PT-21 | Queue/validation/BEGIN qua hạn; admission trước hạn nhưng commit sau hạn; mốc đúng bằng hạn | Từ chối write nhận muộn, nhận write hợp lệ chỉ sau commit; dùng cùng t_admit, không dùng clock client. |
| PT-22 | Replay sau hạn, từng finalize_reason, revision sai đồng thời hết giờ, chốt DB lỗi | Receipt ưu tiên sau quyền; bảng §10.4 nhất quán save/submit; không báo đã nộp khi còn FINALIZATION_PENDING. |
| PT-23 | Gần đầy khi OPEN/RUNNING và WAITING; replay; lỗi disk/DB thật | Đúng ma trận C08, save/submit/chốt không bị chặn chỉ do cảnh báo; lỗi thật không ACK giả, không purge hoặc bỏ receipt. |
| PT-24 | Thiếu/limit=null/limit sai, khóa lạ/sai hoa thường/trùng, UTF-8/NUL/depth17, số nguyên | Cùng validator main/C/server và quy tắc §2.4/3.1/5.1; default và canonical nhất quán. |
| PT-25 | Catalog nhiều trang và thay đổi bank; local.connect/status/shutdown | Cursor/thứ tự/default đúng; local envelope effect=NONE, không ledger; shutdown ACK không bị coi là server logout. |

### 16.6. Trạng thái tài liệu

Đã có format, thứ tự message, ngữ nghĩa, lỗi, FSM, retry và quyền của từng API.
Các số mới (TTL/frame/timeout/quota) là thiết kế đề xuất, được đối chiếu ngân sách
và phép đo ở [tài liệu 4](04-capacity-and-validation.md); không phải kết quả chạy đạt.
[Kế hoạch triển khai](05-implementation-plan-and-task-allocation.md) chuyển hợp đồng này
thành module và mốc tích hợp. Không triển khai ứng dụng trong bước tài liệu.

## 17. Lịch sử thay đổi

| Phiên bản | Nội dung |
| --- | --- |
| v0.1 | Tạo đặc tả IPC/NET: framing, envelope/schema, handshake/auth, danh mục lệnh/sự kiện, retry/revision/reconnect, lỗi, timeout/cap, phân công và tiêu chí kiểm chứng. Chưa coi thông số đề xuất là kết quả đã đạt. |
| v0.2 | Hoàn thiện FSM auth/phòng/bài theo tài liệu lớp; làm rõ nonblocking connect, slot control, credit và chốt bài khi ledger đầy; liên kết quy mô/kiểm chứng và kế hoạch triển khai. |
| v0.3 | Ngày 02/11/2026 chốt nhóm 1: room.cancel/CANCELLED, timer chờ 1.800 giây, metadata/DTO/event/errors và PT-15..17; làm rõ C03, giữ nhóm 2–3 chưa chốt. |
| v0.4 | Ngày 02/11/2026 duyệt C04–C06 tối thiểu: instance fence, API pending RAM ở preload/main, logout intent và terminal-response routing; thêm PT-18..20. C07–C10 và nhóm 3 vẫn chưa chốt. |
| v0.5 | Ngày 03/11/2026 duyệt C07/C10: thống nhất boundary/precedence/lỗi save-submit, PT-21..22; setup theo config README, chưa thêm protocol admin bootstrap. |
| v0.6 | Duyệt C08/C09: ma trận admission thay chặn mọi W, optional/default/null/local envelope/catalog cursor, helper cJSON và PT-23..25; nhóm 3 chưa chốt. |
| v0.7 | Đồng bộ trạng thái C11/C12 và tham chiếu tài liệu 01/02/04/05; không đổi framing/schema. |
| v0.8 | M01 bổ sung BP §18, 68 KiB/caps/init-ready/routing/authority/credit/shutdown, PT-26..28. NET API và desktop IPC dùng schema hiện hành. |

## 18. BP — pipe server C và Node TypeScript theo M01

### 18.1. Transport và khởi động

C spawn/exec Node executable và compiled entry path từ config bằng argv riêng,
truyền absolute config path. Stdin child nhận BP từ C, stdout child chỉ BP trả
về, stderr child dành cho log có giới hạn. C đặt pipe nonblocking và dùng poll.
BP frame gồm uint32 big-endian length và JSON UTF-8 object, payload 2..69632 byte
(68 KiB). NET/desktop IPC vẫn 2..65536 byte. Buffer RX BP tối đa 69636 byte.
Phần metadata bao NET tối đa 4096 byte, có cap chuỗi và kiểm tra tổng encode.
Độ sâu payload NET tính root payload là 1 và tối đa 16. BP cho tối đa 18 mức
để bọc payload, metadata BP có schema phẳng cố định. Frame output C ra NET phải
được kiểm tra lại encoded size sau khi C thêm event_seq.

C validate config và lấy lock dữ liệu trước spawn. C gửi init, Node validate
cùng config, kiểm tra DB/migrate/K07 rồi ready. Trong foundation, --version chỉ
in stderr. Chế độ serve được triển khai M1/M2 và chỉ dùng khi launcher đã cấp
pipe/lock hợp lệ. C chỉ listen sau ready; timeout startup lấy `business_startup_timeout_ms` đã
validate, mặc định 10000 ms. Graceful shutdown dùng `business_shutdown_timeout_ms`
đã validate, mặc định 10000 ms; bound V03 theo config/README, còn chờ nhóm duyệt.

### 18.2. Envelope và bảng message

Mọi BP object có bridge_v=1 và kind từ bảng. BP là kênh do launcher tạo, C ghi
connection metadata từ accept thay vì nhận metadata do NET body khai. BP request
không chuyển quyền cho client tự đặt connection/user/epoch.

| Kind và chiều | Trường ngoài bridge_v/kind | Ngữ nghĩa |
| --- | --- | --- |
| init C→Node | server_config_path | Absolute path file config không bí mật, Node kiểm tra trùng argv/config đã chọn. |
| ready Node→C | server_instance_id, protocol_version:1, bridge_max_payload_bytes:69632 | Node ready với DB/schema/config, instance random 32 hex. C dùng instance này trong sys.hello. |
| event_credit C→Node | frames, bytes | C cấp thêm credit event, Node theo dõi số dư và trừ khi enqueue event. Số integer không âm, tổng outstanding thuộc pool §18.4. |
| opened C→Node | connection_id, generation, peer_ip | C đăng ký context, Node tạo UNAUTHENTICATED. |
| request C→Node | connection_id, generation, payload | payload là NET request đã validate framing/envelope, auth hoặc business. Node kiểm tra schema/quyền. |
| closed C→Node | connection_id, generation, reason | Node bỏ binding/presence của đúng generation, membership/bài theo nghiệp vụ. |
| binding Node→C | connection_id, generation, user_id nullable, binding_epoch nullable, authenticated:boolean | C cập nhật transport authority mirror và cap unauth. Node vẫn sở hữu session/quyền. |
| response Node→C | connection_id, generation, authority_epoch nullable, terminal_auth:boolean, payload | NET response đầy đủ. C match request_id/type/op và target trước enqueue TCP. |
| event Node→C | connection_id, generation, authority_epoch, type, body | Event domain nhắm binding cụ thể, C cấp event_seq NET theo kết nối. |
| close Node→C | connection_id, generation, reason | C đóng đúng socket và báo closed lại. |
| shutdown C→Node | {} | Sau command đã nhận, ngừng việc mới và drain/đóng DB. |
| stopped Node→C | {} | Node đã đóng DB, chuẩn bị thoát. C chờ child exit rồi nhả lock. |

connection_id là chuỗi thập phân tăng từ 1 trong instance, generation là integer
1..INT32_MAX. C dừng nhận kết nối trước khi counter/generation tràn. peer_ip tối
đa 45 byte, reason enum giới hạn 64 byte. server_config_path tối đa 4096 byte
UTF-8 và total metadata luôn <=4096 sau encode. Việc encode vượt trần init phải
báo config error trước spawn/ready. user_id là ID string, binding_epoch là ID
string tăng trong session theo chuyển binding. authority_epoch dùng cùng giá trị.
Đầu ra invalid schema/version/length hoặc stdout lẫn log là lỗi bridge terminal.

Ví dụ request BP với cùng payload NET

```json
{
  "bridge_v": 1,
  "kind": "request",
  "connection_id": "12",
  "generation": 1,
  "payload": {
    "v": 1,
    "kind": "request",
    "request_id": "11111111111111111111111111111111",
    "type": "answer.save",
    "operation_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "body": {"attempt_id":"101","position":1,"selected_option":"B","expected_revision":0}
  }
}
```

### 18.3. Thứ tự, quyền và route

C giữ FIFO opened → requests → closed của cùng generation. Node xử lý control
và domain qua một dispatcher tuần tự. Một request đã được Node nhận hợp lệ trước
closed có thể commit, receipt được sync khi user quay lại. Request thuộc context
đã đóng/revoked bị từ chối trước mutation. Hash completion xét ticket/context lại.
C xử lý sys.hello/sys.ping bằng C, sys.hello chỉ sau Node ready. Auth và mọi API
mục 7 được chuyển Node. C và Node cùng hạn mức in-flight theo §12.

Login/resume thành công cập nhật Node binding. Node xuất binding control trước
terminal auth response và trước domain output của binding mới. Revoke xuất control
cho kết nối cũ. C lọc response/event theo generation và authority_epoch hiện tại.
terminal_auth=true chỉ cho auth.login/resume/logout có request đang chờ đúng
connection/generation/request_id, cho phép trả ACK sau chuyển/revoke epoch. C chỉ
cho payload đi qua khi type nằm whitelist terminal, một request một response.
Auth failure không cấp quyền, domain response không dùng terminal exception.

Domain event mất do disconnect được bù bằng state.get/attempt.get. Node gửi từng
target theo credit, C gán seq và serialize NET. Node không nhận fd hoặc socket
handle. Socket/POSIX I/O, partial send, heartbeat và timeout giữ ở C.

### 18.4. Backpressure và lỗi giữa hai tiến trình

Bảng counter/ownership đề xuất trong SCRUM-9 ở
[hợp đồng nền §4](planning/shared-interface-contracts.md#4-bp--ticket-counter-và-thời-điểm-chuyển-ownership).
Giữ nguyên wire/caps dưới đây; review và PT-27/28 runtime vẫn cần thực hiện.

Command và completion mỗi chiều có trần hạch toán tại mỗi đầu 1024 frames/8 MiB:
phần thường 960 frames/7.5 MiB dùng logical credit end-to-end; control có counter
cục bộ 64 frames/512 KiB trong tổng ở từng đầu gửi/nhận. Control gồm
opened/closed/binding/init/ready/event_credit/close/shutdown/stopped, không gồm
auth response. Kernel pipe và các bản sao cJSON/V8 được đo thêm trong RSS.
C kiểm tra credit response trước
chuyển request. Credit worst-case BP frame là 69636 byte, chỉ cấp tối đa
floor(7.5 MiB / 69636)=112 ordinary completions cùng lúc. C giữ request ticket tới
khi output được đưa vào TCP TX hoặc response nhận về bị loại đúng generation.
TCP close chỉ đánh target dead, không tự trả credit của request đã ghi sang BP. Mỗi request chuyển sang
Node mang một response reservation 69636 byte ngầm định, Node trả tối đa một
response cuối tương ứng. C cấp tối đa 16 frame event_credit outstanding từ cùng pool, tổng response
reservations + outstanding event credits nằm trong 960 slots/7.5 MiB. Node chỉ
enqueue event khi có đủ frames/bytes, trừ byte encoded thực tế. Sau khi C đưa
output vào TX hoặc loại target cũ, C trả event_credit theo số frame/byte đã tiêu
thụ. Event nhỏ có thể gộp theo target/type để client sync, tránh queue vô hạn.
Control bytes thuộc vùng dự phòng và có hard cap số/byte tương ứng ở mỗi đầu.
Sender charge trước enqueue và giữ tới write hết frame (C) hoặc write callback
xong (Node), kể cả buffer nằm trong Writable; partial/EAGAIN/write(false)/drain
không tự trả charge. Receiver charge frame hoàn chỉnh tới xử lý xong/hết giữ
buffer, không trả ngay khi parse. Cleanup terminal trả các khoản còn giữ đúng
một lần. Hai counter này độc lập, không cần ACK mới và không là credit end-to-end.
TX+RX control có thể cùng chiếm tối đa 128 frames/1 MiB mỗi chiều; hai chiều
tối đa 2 MiB, đã được tách trong dự toán 04 §5.2. Frame dở vẫn tính vào RX staging.
Control hết capacity thì fail-stop, không bỏ cap để bảo đảm enqueue bằng mọi giá.
Auth request chuyển Node cũng giữ response reservation thường 69636 byte như
mọi request; binding/close và lifecycle control dùng vùng dự phòng. Auth response
không giữ thêm một reservation 69636 byte thứ hai trong 512 KiB control. Cụm
“auth completion” ở mô tả headroom không cho phép vượt tổng cap hoặc trả credit
trước khi output được đưa vào TCP TX/loại đúng target. Bảng counter/ownership
trong implementation phải thể hiện các khoản này riêng, kiểm 50 login ở PT-27/28.
Command slot được C giữ tới response cuối để giới hạn cả input chưa xử lý trong
Node. Request chưa ghi byte BP đầu tiên và gỡ được khỏi queue C có thể hủy,
trả command/response reservation ngay. Request đã ghi sang BP giữ ticket và cả
hai khoản tới khi C nhận/loại response tương ứng hoặc cleanup toàn BP. Frame
đã gửi dở phải hoàn tất, không cắt frame vì TCP close; giữ FIFO request→closed.
FIFO và ticket đảm bảo giải phóng đúng một lần, không tái dùng credit trong khi
request/response cũ còn tồn tại chỉ vì socket thí sinh đã đóng.

Pipe write EAGAIN/partial ở C giữ offset và poll POLLOUT. Node stdout.write(false)
dừng dequeue output tới drain, có hard cap riêng trước write. Node chỉ dispatch
request khi response credit đã cấp, transaction kết thúc trước chờ drain.
Khi một client chậm, C giới hạn TX và đóng riêng theo timeout. Khi cả BP ngừng
đọc/tiến triển 15s với bytes pending, C dừng instance để tránh treo mọi ca.

EOF, Node exit, malformed BP hoặc control hết capacity khiến C dừng accept/dispatch,
đóng TCP, giữ các W chưa có response là UNKNOWN ở phía client và dọn child/pipe.
C chờ Node exit và thu hồi lock. Node stdin EOF phải dừng nhận, hoàn thành transaction
đang chạy nếu có thể, đóng DB rồi thoát. Khởi động lại tạo server_instance_id mới,
áp C04/K07. Giới hạn shutdown/startup ở §18.1 và kiến trúc §11, không tự replay W
sang instance mới. C gửi thành công vào pipe chưa chứng minh SQLite commit.

### 18.5. Kiểm chứng BP khi triển khai

| Mã | Tình huống | Điều kiện |
| --- | --- | --- |
| PT-26 | Split/gộp BP, init/ready, frame sát trần, stdout lẫn log | Length/schema/caps đúng, ready trước listen, timeout dọn child. |
| PT-27 | Node/pipe chậm, một client ngừng đọc, credit saturation | C poll tiếp tục, queues có cap, transaction kết thúc trước drain, control có credit. |
| PT-28 | Commit rồi Node chết/mất response, fd tái dùng, login/logout đổi epoch | Receipt/UNKNOWN/instance đúng, output cũ không lộ sang kết nối mới, terminal auth ACK được route đúng. |

BP messages là đặc tả cho M1/M2, scaffold mới có entry --version.
