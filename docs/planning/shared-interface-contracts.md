# SCRUM-9 — Hợp đồng interface nền

Ngày soạn: 22/11/2026. EXAM-T01 / SCRUM-9, W01.
Cập nhật 23/11/2026 theo hai hướng nhóm đồng ý: TX class nội bộ và control
counter cục bộ; không thêm wire ACK, không tăng cap từng đầu hoặc đổi FIFO.
Tác giả: Nguyễn Minh Quân. Reviewer dự kiến: Đặng Hoàng Quân — **chưa review**.

Mục tiêu: đủ input/output/error/ownership để hai người triển khai song song.
Nguồn baseline tại commit `ce5755d`: 02 v2.0 §5/7–9/11, 03 v0.8
§2–5/10–12/18, 05 v0.7 §4; review F08/F09 ngày 17/11.
Đây là thiết kế interface, không phải header/API runtime đã triển khai.
Tên dưới đây là tên thống nhất đề xuất; module triển khai có thể đổi tên cục bộ
nhưng không đổi ngữ nghĩa/ownership. Nếu cần đổi contract, hai người review trước.

## 1. Quy ước chung

- C sở hữu socket/poll/framing/transport; Node sở hữu authority/nghiệp vụ/SQLite.
  Không truyền fd sang Node hoặc cho Node gọi TCP. UI tự điều phối pull trang đề.
- ID DB/connection/epoch qua JSON là decimal string theo 03; generation là
  integer 1..INT32_MAX. Không đổi ID int64 sang JavaScript Number.
- `Result<T,E>` là union thành công `{ok:true,value:T}` hoặc lỗi
  `{ok:false,error:E}` ở mức contract. C có thể dùng enum + out-parameter;
  TypeScript dùng discriminated union. Không thêm runtime library.
- `DomainError` dùng code/effect/details/retry_after_ms của 03 §11. Helper chỉ
  trả lỗi nội bộ; dispatcher/serializer dựng envelope tương quan request.
  Không lấy lỗi C/SQLite thô làm message public.
- Borrowed input chỉ dùng trong lời gọi; muốn giữ qua callback/queue phải copy
  hoặc nhận ownership tường minh. Output thành công chuyển cho caller. Cleanup
  phải chạy cả nhánh lỗi/EOF/close, không để hai owner cùng free một buffer.

## 2. Transport C — RX và TX

Ký hiệu thiết kế: `ByteSpan={const uint8_t *data,size_t len}` (borrowed),
`OwnedFrame={uint8_t *data,size_t len}` gồm header + payload (owned).
`RxState` giữ header/payload dở và mốc bắt đầu frame; `TxQueue` giữ buffer + offset.
`TxClass=TX_NORMAL|TX_CONTROL` là metadata nội bộ do caller đã validate cấp;
không nằm trong wire hoặc do client tự khai. TX không parse JSON để suy loại frame.

| Interface đề xuất | Kết quả / lỗi / điều kiện | Ownership / chủ trì |
| --- | --- | --- |
| `rx_feed(RxState*, ByteSpan, frame_budget) -> {consumed, frames, status}` | `consumed<=input.len`; status NEED_MORE/YIELD/OK hoặc LENGTH_ERROR/NO_MEMORY. Đủ 4 byte mới đọc uint32 BE, kiểm cap trước allocate. YIELD buộc caller giữ hoặc cấp lại phần input chưa consume; không bỏ byte dư. `frames` là danh sách có giới hạn, không callback reentrant. | Minh Quân; state sở hữu frame dở, caller nhận ownership payload hoàn chỉnh và giải phóng sau validate/dispatch. |
| `rx_finish(RxState*) -> CLEAN_EOF/TRUNCATED` | Header/payload dở trả TRUNCATED; không dispatch phần thiếu. | Minh Quân; dọn state ở cả hai nhánh, không ảnh hưởng payload đã giao. |
| `encode_frame(ByteSpan json, channel) -> Result<OwnedFrame, EncodeError>` | Kiểm length 2..65536 NET/IPC hoặc 2..69632 BP; không tự thêm LF/NUL/CRC. INVALID_LENGTH/NO_MEMORY; JSON/schema do boundary validator chịu trách nhiệm. | Hoàng Quân; input borrowed, output owned caller; không sửa input. |
| `tx_enqueue(TxQueue*, OwnedFrame*, TxClass) -> ACCEPTED/FULL/INVALID` | Kiểm loại hợp lệ, byte/slot cap và control reserve của queue/kênh. Thành công đặt frame caller về empty. FULL/INVALID không thay queue hoặc frame. | Hoàng Quân; ACCEPTED chuyển ownership vào queue, thất bại caller vẫn giữ. |
| `tx_drain(TxQueue*, fd, byte_budget) -> {sent,status}` | DRAINED/WOULD_BLOCK/YIELD/PEER_ERROR. Partial giữ offset; EINTR thử lại trong budget, EAGAIN đợi POLLOUT. EPIPE/lỗi fatal dọn peer; tránh loop khi send=0. | Hoàng Quân; queue free frame đúng một lần khi gửi hết hoặc bị dọn. |
| `tx_clear(TxQueue*)` | Dọn cả frame gửi dở; không replay byte trên stream cũ. | Hoàng Quân; idempotent đối với queue rỗng. |

Caller cấp byte/frame budget theo 03 §12, không tạo vector frame vô hạn từ một
recv. Timeout frame tính từ byte đầu, không reset sau mỗi chunk. Byte của frame
đã chuyển RX→validator/BP phải được tính ở owner mới, không mất hạch toán.

Caller phân loại sau validate: BP `request/response/event` là TX_NORMAL (kể cả
auth response hoặc response lỗi); các kind lifecycle/control hợp lệ trong
03 §18.2 là TX_CONTROL. NET `sys.hello/sys.ping` và lỗi transport/protocol do C
tạo dùng TX_CONTROL; request/response nghiệp vụ và auth dùng TX_NORMAL, kể cả
domain error. IPC không tự có reserve mới; vẫn dùng tổng cap đã chốt của IPC.
Class sai enum trả INVALID; việc dùng đúng class là trách nhiệm caller/boundary,
không thêm domain logic vào TX dùng chung.

Reserve chỉ chừa dung lượng, không tạo priority queue: mọi frame giữ FIFO,
không chen control vào giữa frame đang gửi dở. NET normal bytes<=122880 và
total bytes<=131072; mọi class cùng chịu tổng 64 frame. Control vẫn có thể FULL
do tổng slot/byte đã đầy; caller áp policy từ chối/đóng kênh đã chốt, không bỏ
cap hoặc âm thầm loại frame cũ. Với BP, local control còn chịu cap ở §4.1.

Ví dụ: input `000000027b` → NEED_MORE; input tiếp `7d000000027b7d` → hai
payload `{}`. Framing thành công nhưng envelope sai nên boundary đóng kênh theo
03 §2.4. TX enqueue FULL giữ nguyên ownership caller; partial send 3 byte chỉ gửi
tiếp từ offset 3, không encode/gửi lại toàn frame.

## 3. Schema, canonical và lỗi boundary

| Interface đề xuất | Kết quả / lỗi | Chủ trì và ràng buộc |
| --- | --- | --- |
| `validate_envelope(channel, raw_utf8) -> Result<ValidatedEnvelope, BoundaryError>` | Strict UTF-8/JSON, duplicate decoded keys, depth<=16, whitelist envelope đúng kênh; trả lỗi cấu trúc hoặc envelope hợp lệ. | Minh Quân C/TS boundary; Hoàng Quân đối chiếu DTO. Tree C thuộc validator/caller theo output ownership, không chia mutable tree. |
| `validate_body(type, body) -> Result<NormalizedBody, DomainError>` | Default chỉ khi thiếu; null khác thiếu; integer theo giá trị; khóa lạ/sai kiểu → INVALID_ARGUMENT. | Chủ chức năng, helpers TS Minh Quân; Node validate lại nghiệp vụ sau BP. |
| `canonical_operation(type, normalized_body) -> {utf8, sha256_hex}` | Input đã qua schema; key ASCII sort, array giữ thứ tự, đúng 03 §10.2/13.5. | Hoàng Quân; output immutable thuộc caller, không token/password/NET ID. |
| `project_*(rows, authority, release_state) -> PublicDto` | Whitelist theo quyền; private attempt không thuộc user → NOT_FOUND; kết quả chưa công bố → RESULTS_NOT_RELEASED. | Chủ chức năng; không serialize row thô/key đề. |

Length/UTF-8/JSON/envelope sai: đóng stream, không cần error response từ ID không
tin cậy. Envelope hợp lệ/body sai: lỗi tương quan INVALID_ARGUMENT, effect NONE.
Version sai: UNSUPPORTED_VERSION rồi đóng nếu có thể gửi. Config có schema riêng,
lỗi startup có field/reason + exit khác 0, không dùng NET error envelope.

Vectors canonical/framing đã có tại 03 §13.5 được giữ nguyên; T44/T04/T45 bổ sung
và chạy codec/validator/canonical thật. SCRUM-9 không nhận PT-24 runtime PASS.

## 4. BP — ticket, counter và thời điểm chuyển ownership

`Target={connection_id,generation}`; `RequestTicket` giữ target + NET request_id,
type, operation_id nullable, authority context và trạng thái terminal. C cấp ticket
cho request chuyển Node sau validate/admission. Node không tự tạo ticket response.
`command_submit(ticket, validated_net_request) -> ACCEPTED/BUSY/CLOSED` do Minh
Quân chủ trì: ACCEPTED nhận ownership request vào BP queue và giữ reservation;
thất bại không chuyển request/không giữ dở credit. C vẫn giữ ticket sau khi đã
write BP; response tối đa một lần. `route_output(bp_output) -> ENQUEUED/DROPPED/FATAL`
do Hoàng Quân chủ trì, đối chiếu target/ticket/epoch trước đưa vào TCP TX.

### 4.1. Credit thường và counter control cục bộ

Mỗi đầu của mỗi chiều có trần hạch toán 1024 slots/8388608 byte: phần thường
960 slots/7864320 byte và control cục bộ tối đa 64 slots/524288 byte **nằm trong
tổng**, không cộng reserve ra ngoài. Một frame BP tối đa 69636 byte gồm header.
Chỉ command ticket/response reservation/event credit dưới đây là logical credit
end-to-end; control dùng counter queue/buffer cục bộ, không có credit end-to-end
hoặc counter mirror cần ACK từ tiến trình còn lại.

| Counter / pool | Cấp phát và owner | Giữ tới / giải phóng |
| --- | --- | --- |
| Command thường C→Node | C giữ 1 slot + encoded BP bytes thực tế khi ACCEPTED, sau kiểm quota mỗi connection. | Giữ logical command ticket tới response cuối đã route/drop; write/parse/dispatch xong không tự trả slot. Buffer vật lý được free khi owner hết dùng. |
| Response reservation Node→C | C giữ 1 slot + **69636 byte** trước submit, Node nhận quyền phát tối đa 1 response từ request. Auth cũng dùng khoản này. | C release khi response vào TCP TX thành công hoặc bị loại đúng target/ticket đã đóng. Không release khi vừa parse BP. |
| Event credit Node→C | C cấp grant frames/bytes từ cùng pool thường; tổng outstanding frame credit<=16, grant byte hữu hạn. Node enqueue event chỉ khi đủ cả slot và encoded byte, trừ local balance. | C thu hồi phần event đã tiêu thụ khi enqueue TCP TX hoặc drop target cũ; có thể cấp lại bằng event_credit. Grant chưa dùng vẫn chiếm ngân sách C, không release/cho grant mới vượt cap. |
| Control TX cục bộ, mỗi chiều | Sender tăng 1 slot + encoded bytes thực tế trước ACCEPTED vào queue/write buffer; cap 64/524288 bao gồm frame đang write dở và buffer còn giữ trong Node Writable. | C giảm khi write hết frame hoặc cleanup terminal. Node giảm khi write callback xác nhận buffer đã được Writable xử lý hoặc cleanup terminal; không giảm chỉ vì `write()` trả true/false hay có `drain`. Không chờ receiver ACK; không tăng thêm reservation auth response. |
| Control RX cục bộ, mỗi chiều | Receiver tăng 1 slot + encoded bytes thực tế khi nhận frame hoàn chỉnh vào xử lý/queue; cap 64/524288 bao gồm frame đang xử lý. Frame dở nằm trong một RX staging có bound riêng, không bỏ hạch toán khi chuyển owner. | Giảm sau xử lý control và hết giữ buffer, hoặc cleanup terminal. Chỉ parse xong chưa trả counter nếu còn chờ xử lý. Đầy control capacity thì fail-stop §18.4, không giữ thêm queue vô hạn; không gửi ACK mới để trả counter TX. |

Hai đầu có thể cùng giữ control khác nhau: mỗi chiều cộng TX sender + RX receiver
tối đa **128 slots/1048576 byte**, không được gọi đó là tổng end-to-end 64/524288.
Hai chiều có bốn vùng control, tổng tối đa 2097152 byte. Cộng phần thường
7.5 MiB/chiều là 17 MiB cho các khoản này, chưa gồm bản sao thường, RX staging,
object/parser hoặc kernel pipe. Dự toán RAM ở 04 §5.2 tách khoản control này;
8 MiB/đầu không phải trần RSS của cả bridge. Counter thường không được dùng vùng
control; counter control của đầu này không sửa counter đầu kia.

Invariant completion tại C:

```text
reserved_response_slots + outstanding_event_slots <= 960
reserved_response_bytes + outstanding_event_bytes <= 7864320
reserved_response_bytes = reserved_response_slots * 69636
outstanding_event_slots <= 16
```

Nếu chưa cấp event credit, byte cap cho nhiều nhất 112 response reservations;
**không phải luôn nhận được 112 request**, còn command bytes/slot, event grants,
per-connection/auth quota và các cap khác. 50 auth giữ 3481800 byte response
reservation trong pool thường; binding control tính byte thực trong pool control.
Không giữ thêm 50 × 69636 byte ở control pool 512 KiB.

### 4.2. Diễn tiến và ca biên cần hai người cùng hiểu

1. Request ACCEPTED: giữ command + response reservation nguyên tử; thiếu một
   khoản thì trả BUSY trước forward, không rò khoản còn lại.
2. Node xử lý/commit, output vẫn thuộc completion budget khi chờ pipe/drain;
   Node kết thúc transaction trước write/drain. stdout.write(false) không có
   nghĩa bỏ output hoặc write lại cùng buffer; chờ drain trước dequeue tiếp.
3. C parse output: ownership buffer đổi nhưng logical reservation vẫn giữ.
   TCP TX nhận thành công thì ticket kết thúc, release command/response đúng
   một lần. TX tiếp tục sở hữu NET frame tới gửi hết/dọn; BP credit hết giữ.
4. TX đầy: chưa release chỉ vì parse; giữ output có bound hoặc đóng peer theo
   policy để drop và cleanup. Không âm thầm bỏ response save đã commit.
5. Peer close: đóng ticket/thu hồi reservation đúng một lần và đánh target dead;
   output đến muộn bị drop, không release lần hai hoặc route sang fd tái dùng.
   Node vẫn có thể commit request hợp lệ đã xử lý trước closed; client sync receipt.
6. Terminal auth response: chỉ whitelist login/resume/logout và match ticket
   đang chờ; binding control đi trước output quyền mới. Không bỏ ACK logout chỉ
   vì epoch vừa revoke; không cho domain response dùng ngoại lệ terminal.
7. BP terminal/Node chết: dừng accept/dispatch, đóng TCP, dọn toàn bộ counter và
   child có giới hạn; W chưa rõ kết quả là UNKNOWN, không ACK rollback giả.

Ví dụ control: C enqueue `opened` → tăng TX local; partial write còn giữ toàn
khoản charge tới khi gửi hết frame. Node nhận đủ → tăng RX local; xử lý opened
xong và bỏ buffer → giảm RX local. C không đợi bước xử lý này để trả TX local.
Nếu cả hai đầu cùng giữ control thì cả hai khoản xuất hiện trong dự toán RAM.
`binding` vẫn đứng trước auth response trên FIFO; trả buffer write không chứng
minh receiver đã xử lý binding, cũng không trả response reservation thường.

Ca đối chiếu contract (chưa phải test runtime):

| Đầu vào / trạng thái | Kết quả cần giữ |
| --- | --- |
| NET queue có 122880 byte normal, 1 slot trống, enqueue normal 128 byte | FULL; caller còn ownership. Cùng trạng thái enqueue control 128 byte thì ACCEPTED nếu tổng slot/byte còn đủ. |
| NET queue đã có 64 frame, enqueue control nhỏ | FULL dù còn byte reserve; không chen hoặc bỏ frame khác. |
| Control TX write dở hoặc Node write trả false | Còn charge toàn frame; Node chỉ trả khoản write khi callback hoàn tất hoặc terminal cleanup. |
| Receiver parse control nhưng còn chờ dispatch | RX local còn charge; sender có thể đã trả TX local, không có ACK giữa hai counter. |
| Hai đầu cùng đầy control, cả hai chiều | 4×524288=2097152 byte control, tách khỏi 15 MiB credit thường và các bản sao/staging/RSS. |

50-login/control, saturation, TX chậm, close/hash completion muộn và EOF là ca
runtime PT-27/28 của provider sau; bảng này chưa phải bằng chứng đã chạy.

## 5. Hợp đồng Node DB / clock / activity / generator / finalizer

Kiểu thiết kế TypeScript: `DbId=string`, `UtcMs=number` (safe integer),
`MonoMs=bigint` (nội bộ không serialize), `Tx` là context kết nối đang transaction,
`Authority` do auth resolve từ Target/epoch hiện hành, không do NET body khai.
`ActivityRef={kind:'ROOM'|'PRACTICE',id:DbId}`. Resource state/DTO theo 02/03;
không thêm bảng/state mới chỉ để khớp tên helper.

| Signature đề xuất | Input/output/error và transaction | Chủ trì |
| --- | --- | --- |
| `with_transaction<T>(work:(tx:Tx)=>Result<T,DomainError>): Result<T,DomainError>` | Callback đồng bộ, không Promise/await/hash/socket. BEGIN, callback thành công → COMMIT; callback lỗi/throw → ROLLBACK. Không lồng BEGIN. Không trả success trước commit. Busy/error mapping và commit ambiguity cụ thể là gate F10/T06; rollback đã biết → DATABASE_ERROR, không rõ commit → OUTCOME_UNKNOWN/effect UNKNOWN và dừng ghi theo 02 §11.2. | Hoàng Quân; Minh Quân review timer. |
| `resolve_authority(target,epoch): Result<Authority,DomainError>` | Tra binding/session/user hiện hành trong dispatcher, kiểm lại sau hash callback. AUTH_REQUIRED/SESSION_* theo 03; quyền resource do handler/helper xét tiếp. Không đọc user_id tự khai. | Minh Quân |
| `clock_now(): {utc_ms:UtcMs,mono_ms:MonoMs}` | Cặp mốc cùng lời gọi, dùng monotonic cho xét hạn trong instance. UTC dùng persistence/DTO. Không chuyển mono qua wire. | Minh Quân |
| `deadline_register(ref,deadline_mono:MonoMs): void`; `deadline_cancel(ref): void` | RAM registry theo resource; gọi sau commit, trước command kế tiếp. Callback chạy qua dispatcher, kiểm state lại; cancel không lỗi nếu đã xóa. Không tự extend deadline hoặc coi timer callback là commit. | Minh Quân |
| `reserve_activity(tx,user_id,ref): Result<void,DomainError>` | Caller giữ transaction; đã giữ đúng ref → no-op không tăng counter (handler vẫn kiểm state/quyền). Giữ ref khác → ACTIVE_ACTIVITY; chưa giữ thì kiểm global<50, vượt → RESOURCE_LIMIT. Tất cả membership/attempt + reservation cùng commit. Không chặn rejoin cùng phòng chỉ vì global đã đủ 50. | Minh Quân |
| `release_activity(tx,user_id,ref): Result<void,DomainError>` | Chỉ xóa bản ghi đúng user+kind+id; không xóa activity mới khác resource. Không có đúng bản ghi → no-op; bất nhất thuộc invariant transaction phải rollback, không xóa theo user đơn lẻ. Nộp sớm phòng không gọi release. | Minh Quân |
| `bank_availability(tx,config): Result<{easy:number,medium:number,hard:number},DomainError>` | Config đã validate; chỉ active topic/questions; thiếu nguồn → INSUFFICIENT_QUESTIONS với counts. Caller dùng trong create/config/start/practice, không snapshot/giữ câu từ lúc chờ. | Hoàng Quân |
| `prepare_room_attempts(tx,room_id,roster:DbId[],config): Result<PreparedAttempt[],DomainError>` | Roster membership đã khóa bởi dispatcher/transaction, gồm chủ/offline. Tạo snapshot riêng cho từng người; mọi người đủ số từng độ khó hoặc lỗi rollback toàn bộ. Không socket/commit/key public. `PreparedAttempt={attempt_id,user_id}` chỉ nội bộ; start caller đặt thời gian chung sau chuẩn bị. | Hoàng Quân |
| `finalize_attempt(tx,attempt_id,cause,now): Result<InternalOutcome,DomainError>` | cause SUBMIT/DEADLINE/HOST_END nội bộ; OPEN→chốt một lần từ snapshot key; bài đã chốt trả outcome hiện có cho internal caller, không chấm lại. Handler vẫn áp bảng lỗi/replay 03 §10.4 trước gọi. Practice release đúng activity; phòng nộp sớm không release/công bố. | Hoàng Quân |
| `finalize_room(tx,room_id,cause,now): Result<InternalOutcome[],DomainError>` | Caller timer/end sở hữu transaction. Chốt bài OPEN, giữ kết quả bài đã nộp; room ENDED + release mọi reservation đúng room cùng commit. Không tự commit từng bài. | Hoàng Quân |
| `operation_lookup(db:DbReadContext,user_id,operation_id,fingerprint): Result<Receipt|null,DomainError>`; `operation_record(tx:Tx,user_id,operation_id,fingerprint,receipt): Result<void,DomainError>` | Lookup dùng kết nối dispatcher, không bắt caller mở transaction chỉ để replay; sau auth/quyền, trước state/deadline/revision. Cùng op khác fingerprint → OPERATION_CONFLICT. Mutation+record cùng transaction; receipt không key/điểm bị giữ. | Hoàng Quân |

`cause`, `Tx`, `PreparedAttempt`, `InternalOutcome` là kiểu nội bộ; không thêm
field/mã enum vào wire. Domain owner kiểm state/quyền trước helper và chỉ tạo
response/event DTO sau commit. Internal error do vi phạm tiền điều kiện không
được đưa stack/SQL/đề key xuống client.

Ví dụ rollback: start 3 người nhưng generator lỗi ở người thứ ba → caller rollback
cả 3 bài/snapshot, phòng vẫn WAITING, không event bắt đầu, không timer thi mới.
Ví dụ deadline: với W mới, auth/schema/receipt → BEGIN → state + đọc mono ngay
trước mutation → chỉ nhận `now<deadline` → revision → ghi + receipt → commit.
Đúng deadline thì từ chối theo 03 §10.4; replay đã commit trước đó vẫn tra được.

## 6. Bàn giao và trạng thái

- [Bảng V03](../../config/README.md#v03--bảng-cấu-hình-đề-xuất-scrum-9):
  **DRAFT / chờ nhóm xác nhận**, không được tự coi đã duyệt.
- [Fixtures config](../../tests/fixtures/config/README.md): input nguyên văn,
  expected effective config/rejection cho T47; chưa có loader chạy.
- T03/T05/T44/T04/T45 nhận RX/TX/schema/canonical; T09 nhận startup/path/lock;
  T47 nhận config; T06/T07/T14/T17/T20 nhận DB/clock/generator/finalizer.
  Không thêm dependency Jira ngoài ticket đã chốt chỉ vì có bảng bàn giao.
- F09: đã cụ thể hóa contract counter/ownership; review chéo và runtime
  PT-27/28 vẫn chưa thực hiện. F10: giữ ở T06, không tự đóng trong SCRUM-9.
- [Bằng chứng tự kiểm](scrum-9-contract-evidence.md). Không đánh trọn FR-13,
  AC-28/30 hoặc PT-24 PASS từ kiểm tài liệu/fixtures.
