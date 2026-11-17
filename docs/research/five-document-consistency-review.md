# Review chéo 5 tài liệu: nghiệp vụ, kiến trúc, giao thức và các con số

Ngày: 17/11/2026. Nhóm 4 — Nguyễn Minh Quân, Đặng Hoàng Quân.
Baseline: 01 v1.8, 02 v2.0, 03 v0.8, 04 v0.7, 05 v0.7, cùng config mẫu,
sổ quyết định và kế hoạch hai sprint. Đây là review thiết kế; không chạy nghiệm
thu ứng dụng hoặc đo khả năng phục vụ 50 người trong lượt này.

## 1. Kết luận và mức sẵn sàng

Hướng triển khai phù hợp phạm vi nhóm đã chốt và trọng tâm C socket của môn.
Không tìm thấy lý do phải đổi SQLite, bỏ Node nghiệp vụ hoặc thay hai pipe riêng.
13 nhóm FR đều có đường nghiệp vụ, API, dữ liệu và owner. Các cơ chế reconnect,
retry và client chậm được đặt vào chất lượng chức năng hiện có, không tự cộng
ba gói nâng cao. Không mở lại quyết định V01 không dùng CRC32.
Inventory là 33 lệnh NET (27 nghiệp vụ + 4 auth + 2 sys) và 3 lệnh local IPC,
tổng 36; không gọi cả 36 là lệnh NET. Event và message BP được thống kê riêng.

Tuy nhiên, **không kết luận toàn bộ chi tiết đã khóa để code độc lập**. V03 còn
thiếu bảng bound config và DB wrapper cần quy tắc chờ lock/lỗi rõ. Hạch toán
control/auth credit BP đã làm rõ, còn cần bảng counter trong code. Các phần này có owner/mốc bên
dưới; không cần thêm dịch vụ, framework hoặc một vòng thiết kế lại sản phẩm.

Các phép tính lưu lượng/số save/credit/hash đúng về số học. Mục tiêu độ trễ/RSS
có cơ sở để đem đi thử nhưng chưa được chứng minh. Không dùng câu “Node chịu
được 50 người” thay cho chạy workload, kiểm dữ liệu và công bố máy thử.

## 2. Căn cứ và phạm vi kiểm tra

- Đọc cả 5 tài liệu hiện hành, đối chiếu D01–D07/C01–C12/M01/V01, config mẫu và
  sprint plan. Review các trạng thái, transaction, timeout, queue và đường lỗi.
- Đối chiếu transcript nguyên bản trong trao đổi: tối thiểu một lớp 50 người,
  thiết kế giao thức đầy đủ, tính tài nguyên và làm chức năng chỉn chu.
- Barem và đối chiếu bảy bài giảng được ghi ở
  [review trước triển khai](pre-implementation-review.md) và
  [đối chiếu môn học](course-material-reference.md). Không đọc lại toàn bộ sách
  hoặc nhận ghi chú trong HTML là yêu cầu mới của thầy.
- Kiểm lại tài liệu chính thức theo runtime đã pin: API SQLite đồng bộ, busy
  timeout, scrypt workspace và cơ chế SQLite WAL; không dựa vào benchmark trên mạng.
- Tính lại bằng script tạm: byte/MiB/bandwidth, mẫu tải, ngân sách RAM, credit,
  canonical vector. Đây là kiểm số học, không là test sản phẩm.

## 3. Các phát hiện và cách xử lý

P2: cần xử lý trước module chịu ảnh hưởng; P3: diễn đạt/dự toán cần rõ. Không có
phát hiện P1 buộc thay kiến trúc trong lượt review này; không có nghĩa đã hết mọi
rủi ro của code chưa viết.

| Mã | Mức | Phát hiện | Xử lý/trạng thái |
| --- | --- | --- | --- |
| F01 | P2 | 04 LT-13 gộp queue đầy/DB lỗi với Node chết, rồi yêu cầu “timer còn đường chốt”. Node là owner timer nên không thể tiếp tục khi đã chết. | Đã tách: instance sống thì kiểm control/timer và DB; Node/BP terminal thì fail-stop, UNKNOWN và K07. Khớp 02 §11, 03 §18.4. |
| F02 | P2 | “20 burst trong steady” chưa phân biệt save với submit. Submit 50 người làm họ không còn được save, trái kỳ vọng 9.000 mẫu. | 04 §8 ghi rõ 20 burst save xen steady; submit thử ca riêng với 50 bài OPEN, không vượt 50 activities. |
| F03 | P3 | Dùng seed S 40 câu/mức/chủ đề để thử M có thể thiếu nguồn cho cấu hình 100 câu cùng độ khó. | 04 §2.2 ghi M seed riêng, ví dụ 900 câu. Không tăng giới hạn đề hoặc bắt đề của mọi người không trùng. |
| F04 | P3 | Ngoại suy 1.000 ca = 5,72 GiB dễ bị hiểu là vận hành được đến đó, dù ledger admission chặn khoảng 100 ca S. | 04 §4.3 ghi rõ ngoại suy, 9.000 saves/ca và ngưỡng 900.000 rows; không hứa retention 1.000 ca trên một DB đang phục vụ. |
| F05 | P3 | Subtotal RAM chưa nêu rõ temporary snapshot/ứng viên, dễ bị dùng làm “RSS tối đa”. | 04 §5.2 thêm ví dụ M 39,0625 MiB raw snapshot, object/copy đo thêm; sửa làm tròn 128,2 thành 128,1 MiB. |
| F06 | P3 | Bảng dữ liệu tạm 02 gộp draft/pending vào UI/client C; bước save có thể được đọc như chỉ xét deadline trước BEGIN. | Đã tách renderer draft/main registry/C mapping và ghi C07 bên trong transaction tại 02 §8.4/9.3. |
| F07 | P3 | 01 nói “gửi đề”, ví dụ 03 ghi “C tự lấy đề”, dễ hiểu có hai bộ điều phối kéo trang. 04 dùng chữ “tiêu thụ completion” chưa nói thời điểm trả credit. | Đã rõ UI/application tự pull qua client C sau event; credit trả khi TCP TX nhận output hoặc loại đúng target, không chỉ đọc BP. |
| F08 | P2 | V03 vẫn thiếu min/max và quan hệ cho một số config. “Mọi integer dương” không bảo vệ ngân sách đã tính. | OPEN: A soạn, B review, nhóm chốt trước loader W01/W05/W08. Không tự đổi profile thành quyết định đã duyệt. |
| F09 | P2 | 03 §18.4 nói mọi request giữ response reservation thường, nhưng cụm “auth completion headroom” dễ bị đọc thành giữ thêm 69.636 B cho mỗi auth trong control pool. | Đã làm rõ auth response dùng reservation thường; binding/lifecycle dùng dự phòng, không giữ hai lần. A/B cụ thể hóa counter trong W05/W06 và kiểm 50 login + control, saturation, disconnect/hash hoàn tất muộn. |
| F10 | P2 | 02 có WAL/FULL/FK nhưng chưa chỉ rõ busy timeout của DB wrapper. Nếu tự đặt chờ lock nhiều giây, DatabaseSync có thể giữ dispatcher quá ngưỡng latency. | OPEN-IMPLEMENTATION trước W07: B ghi timeout hiệu lực và ánh xạ SQLITE_BUSY/rollback/UNKNOWN, A review timer. Không tự bổ sung retry DB dài hoặc nới timeout NET. |

F08 là quyết định cấu hình còn mở từ review trước; F09 đã rõ ở mức thiết kế,
F10 cần cụ thể hóa trong gói DB đã có. Không thêm FR, tiến trình hoặc công nghệ mới.
Các chỉnh lý F01–F07 không phải bằng chứng AC/PT/LT đã PASS.

### 3.1. Đầu ra nhỏ để đóng F09/F10

F09 cần một bảng chung gồm: loại message, pool cấp phát, slot/byte giữ ở mỗi
đầu, mốc chuyển ownership và mốc trả credit. Nêu rõ response reservation thường
và control/auth reserve là các khoản nào, tránh tính một frame vào hai pool.
Không lấy 112 làm số command luôn được nhận: event credits cũng dùng pool thường,
còn per-connection, byte cap và auth limits đều có thể chạm trước.

Ví dụ nếu áp reservation 69.636 B cho từng auth completion vào riêng 512 KiB
control pool, chỉ vừa 7 suất, không phải 50. Đây là ví dụ chỉ ra cách hạch toán
sai có thể làm login bận, không phải chính sách của §18.4 sau chỉnh lý. Auth
response giữ reservation thường, control giữ khoản riêng theo cap. Kiểm bằng PT-27/28,
LT-09/10. Không tăng queue để che lỗi ownership.

F10: mô hình một writer và khóa launcher không cần chờ một server khác nhả DB
trong vài giây. Đề xuất giữ busy timeout mặc định 0 ms của runtime khi triển khai,
trả lỗi có kiểm soát khi lock bất thường, thay vì busy-loop/sleep trong handler.
Nếu cần giá trị khác, phải ghi lý do và đo tác động timer/save. SQLite busy timeout
không là deadline cắt mọi truy vấn hay mọi lần fsync.
[Nguồn Node 24.15.0 DatabaseSync](https://nodejs.org/download/release/v24.15.0/docs/api/sqlite.html#class-databasesync).

## 4. Đối chiếu các luồng đã chốt

| Quy tắc | 01: hành vi | 02/03: thực hiện | 04/05: bằng chứng/owner |
| --- | --- | --- | --- |
| 50 người thực sự thi, không chỉ 50 socket | FR-13, AC-16 | 50 activities; TCP cap 128/unauth 64 | LT-02/06/07; A driver, B behavior/oracle |
| Chủ tự là thí sinh; một hoạt động/người | D01/D03, AC-19 | room_members + user_activity transaction | Test tạo/join/practice/early submit; A helpers, B sử dụng |
| Rời chờ/cancel/expiry khác disconnect | D02, UC-04/04b | CANCELLED; timer 1.800s; release sau commit | AC-20/21, LT-15; A, B kiểm invariant |
| Không người mới vào sau start | UC-04/05 | Dispatcher xét state; roster đã chốt gồm offline | AC-05/PT-11; A room, B generator |
| Đề riêng theo chủ đề/counts, snapshot cố định | D04, FR-07 | Sampling không hoàn lại; transaction tất cả attempts/items | AC-06/07; B, A điều phối start |
| Admin form quản lý kho chung | D07, UC-02 | ADMIN; versions/inactive; không thay snapshot | AC-02/03/27; B, A auth |
| Không gửi key chấm khi thi | Bất biến 5 | DTO whitelist; keys chỉ server | Inspect payload/oracle; B projection, A/B validation |
| Save sau commit mới là đã lưu | UC-06 | Revision + receipt transaction | PT-06/07/17; B, A mapping/transport |
| Nộp đợi saves; đúng mốc xét hạn | D05, UC-07 | t_admit sau BEGIN, receipt trước state/deadline | PT-08/21/22; A clock, B save/finalizer |
| Nộp sớm giữ chỗ và giấu điểm | D03/D06 | EXAM result chỉ khi ENDED; không auto-end vì tất cả nộp | PT-09/LT-12; A activity, B result |
| Reconnect dùng bài/giờ cũ | FR-10 | Resume/binding; sync; main pending và instance fence | AC-11/22..25; A transport, B bài |
| Practice/history/chart và vận hành | FR-11..13 | Reuse engine, publication filter, logs/caps | LT-06/10/13/14; theo module A/B |

Không phát hiện một trong các nhóm này bị bỏ khỏi hai sprint. UI admin nằm S2,
bank API/seed/CLI đã ở S1. Kết quả tối thiểu S1 không có nghĩa history/chart S2
đã xong. Các mốc M0–M7 là mốc nghiệm thu, không là chuỗi khóa toàn bộ công việc.

## 5. Các con số: giá trị, căn cứ và giới hạn của kết luận

### 5.1. Người dùng, kết nối và dữ liệu

| Giá trị hiện hành | Đánh giá |
| --- | --- |
| 50 activities toàn server, phòng tối đa 50 gồm chủ | Bám yêu cầu một lớp. Có thể chia phòng/practice; không phải 50 phòng × 50 người. Người offline/nộp sớm vẫn giữ chỗ theo D03. |
| TCP 128, unauth 64 | Headroom cho kết nối/login/resume; không phải dự toán cần 128 người thi. 50 binding cũ + 50 kết nối thay thế là 100 TCP trong trần, vẫn cần kiểm cap/cleanup. |
| Một TCP/client sản phẩm | Đủ hai chiều cho request/event. Hai pipe local không phải TCP thứ hai tới server. |
| 1..100 câu; 60..7.200s; WAITING 1.800s | Giới hạn nghiệp vụ đã chọn, không có lý do tăng. Demo 120s hợp lệ; không thay ca deadline 15 phút/expiry 30 phút. |
| S: 30 câu/người, khoảng 30 KiB; kho 360 câu | Tốt làm profile công bố, cần đo byte thực. Không lấy “1 MB” ví dụ thầy làm yêu cầu media. |
| M: 100 câu/người; seed riêng đủ counts | Dùng kiểm biên/paging, chưa áp SLA phát đề 2s của S. 50 × 100 = 5.000 snapshot items. |
| Ledger: restricted 900.000 rows hoặc DB+WAL 768 MiB hoặc free disk <1 GiB | Hạn mức vận hành nhóm chọn, không rút ra từ “50 người”. Rất dư cho một ca S, không là quota RAM và không bảo đảm ghi khi disk hỏng/đầy. |
| Sampling disk tối đa mỗi 5s; log 5 × 10 MiB, queue 1 MiB | Hợp lý làm baseline đơn giản, phải đo overhead. Nêu rõ log policy áp theo tiến trình/destination khi viết logger; không nhân số file qua nhiều tầng relay log. |

### 5.2. Frame, queue và bộ nhớ

| Giá trị hiện hành | Kiểm và nhận định |
| --- | --- |
| NET/IPC payload 65.536 B, header 4 B | Frame 65.540 B, uint32 BE. Không CRC theo V01. |
| BP payload 69.632 B, frame 69.636 B | Chừa 4.096 B metadata. Kiểm tổng encode thực, không chỉ chiều dài string path trước escape. |
| Prompt 4.096 B, 4 option ×1.024 B | Một câu tối đa 8.192 B nội dung, chưa metadata/JSON. Một Item riêng vừa frame; 5 Item là limit số lượng, không cam kết trang luôn có 5 câu. |
| 100 câu tối đa 800 KiB raw | Cần nhiều trang; không tăng frame để nhét toàn đề. M có 39,0625 MiB raw snapshot cho 50 người, chủ yếu lưu DB. |
| TCP RX một frame; TX128 KiB gồm control8 KiB | Cap hữu hạn hợp lý; không có nghĩa 8 response lớn đều vừa TX đồng thời. Phải điều tiết BP/TX và timeout peer. |
| BP mỗi chiều 8 MiB/1.024 slots, control512 KiB/64 slots nằm trong tổng | Pool thường 7,5 MiB/960 slots; floor(7,5 MiB/69.636)=112 worst-case response/event reservations. Không cộng thêm reserve ngoài 8 MiB. |
| NET8 request/connection, main32, IPC256 KiB/32frame, event credits≤16 | Hạn số/byte cùng có hiệu lực; một giới hạn chạm trước là đủ. Không nhân 128×8 rồi hứa tất cả nhận cùng lúc dù pool chung nhỏ hơn. |
| Hash1 running +64 waiting | Có thể chứa burst50 về số job; chỉ một workspace lớn chạy. Không hứa 65 job đều xong60s hoặc toàn server chỉ có hai OS threads. |
| scrypt N65536,r8,p1, maxmem96 MiB | 128×N×r =67.108.864 B =64 MiB workspace xấp xỉ, không phải96 MiB cấp ngay và không phải RSS Node toàn bộ. Salt16B/key32B. Benchmark Linux trước chọn kết luận tốc độ. |
| Subtotal113,5 MiB ở50 socket;128,1 MiB ở128 | Tính lại đúng sau làm tròn. Bao raw RX/TX/BP/copies/SQLite cache8 MiB/hash64 MiB, chưa đầy đủ object/snapshot/V8/kernel. Không phải hard cap RSS. |
| RSS mục tiêu256 MiB S;384 MiB M | Có thể dùng làm mục tiêu thử ban đầu; chưa đủ căn cứ bảo đảm đạt. Đo cả C+Node và tách client/Electron/kernel, không kill server chỉ vì vượt target. |

API scrypt là bất đồng bộ và có điều kiện maxmem xấp xỉ 128×N×r; đây là căn cứ
tính workspace, không phải chứng nhận hiệu năng trên máy nhóm.
[Nguồn Node crypto](https://nodejs.org/download/release/v24.15.0/docs/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback).

### 5.3. Thời gian và mục tiêu hiệu năng

| Giá trị hiện hành | Đánh giá và điều kiện |
| --- | --- |
| Child desktop/connect/hello5s mỗi bước; request thường5s | Phân biệt từng bước, không một timeout chung cho toàn startup. Request5s từ C nhận IPC, không cộng thêm5s mỗi retry. |
| Auth job60s; authIPC/NET65s | Cần override default5s cho login/register; queue time nằm trong deadline job. 50 login≤60s đòi trung bình khoảng≤1,2s/job, còn phải trừ overhead. |
| Server startup/shutdown10s | Fail-fast baseline, không hứa migrate/kiểm mọi DB lớn trong10s. Khác desktop child close2s. Loader có khoảng1..60s cho hai trường này, V03 phải làm rõ cách dùng override. |
| Ping10s/idle35s/frame dở10s/TX không tiến triển15s | Các timer giải quyết lỗi khác nhau; ping vẫn hoạt động lúc auth hash chờ. TX15s chỉ khi có bytes chờ mà không tiến triển, không đóng người đang nghĩ bài vì không gửi answer. |
| BP không tiến triển15s khi có bytes pending | Có thể fail-stop toàn instance, không tương đương xử lý riêng client chậm. Cần PT-27 phân biệt hai lỗi. |
| TTL24h và pin bài tới deadline+5phút | Không ngắt bài vì idle nhưng không bảo vệ khỏi logout/revoke. Dữ liệu bài không mất khi TTL hết. |
| Reconnect0,5→1→2→4→8→10s, jitter±20%, tự thử2phút | Hữu hạn, đủ dễ giải thích. Không cộng lại giờ thi và không tự replay W sang instance mới. |
| Một save/người/5s trong900s | 50×180=9.000; 49×180=8.820; nhóm30/10/10 =5.400/1.800/1.800. Đúng. Retry/burst/warmup tính riêng. |
| Steady p95≤250ms,p99≤1s | Mục tiêu độ đáp ứng nhóm đặt, chưa thầy yêu cầu. Đo logical latency gồm retry, không bỏ timeout khỏi pass/fail. 10 save/s chưa gồm đọc/ping/event. |
| Burst50≤2s | Với submit tuần tự, ngân sách trung bình khoảng40ms/bài tính cả overhead; FULL/commit/disk có thể làm trượt. Đây là mục tiêu cần đo, không bảo đảm từ việc dùng Node. |
| Start đến người cuối đủ trang≤2s ởS | Cần50 snapshot và khoảng300 trang nếu mỗi trang5 câu, cộng start/meta/room. Băng thông đủ chưa chứng minh dispatcher/DB đáp ứng. |
| Chốt đủ kết quả≤1s sau deadline | Đúng mô hình chốt cả phòng trong một transaction; event-loop lag/DB/checkpoint có thể làm trượt. Mốc quyền sửa vẫn strict trước deadline, khác độ trễ hoàn tất chốt. |
| Rate20 command/s/binding, burst40; authIP5/s burst50, username5/phút | Dư cho profile lớp, không là bảo vệ DoS đã chứng minh. Chạy login lặp nhiều lượt cùng tài khoản phải ghi thời điểm/cooldown để không tự tạo RATE_LIMITED ngoài kịch bản. |

DatabaseSync thực thi đồng bộ; tách C ra riêng giúp socket/heartbeat tiếp tục,
không khiến DB/transaction tự chạy song song. WAL vẫn có một writer, checkpoint
và độ bền FULL ảnh hưởng độ trễ cần đo.
[Nguồn Node SQLite](https://nodejs.org/download/release/v24.15.0/docs/api/sqlite.html),
[nguồn SQLite WAL](https://www.sqlite.org/wal.html).

### 5.4. Kết quả tính lại đường truyền và lưu trữ

| Phép tính | Kết quả |
| --- | --- |
| 50 ×30 KiB | 1.536.000 B =1,46484375 MiB; payload cần6,144 Mbit/s để phát trong2s. |
| 50 ×1 MB | 50 MB; cần200 Mbit/s trong2s. Link100 Mbit/s mất ít nhất4s lý tưởng, chưa overhead. |
| 500 ×1 MB | 500 MB; cần2.000 Mbit/s trong2s; ngoài cam kết v1. |
| 10 save/s ×(request400B+response400B+haiheader4B) | 8.080 B/s. Room refresh10/s×8 KiB ≈80 KiB/s có thể lớn hơn save. |
| 50×30snapshot×1 KiB | 1,46484375 MiB raw. |
| 9.000receipt×512B | 4,39453125 MiB minh họa; bytes/row thật và index phải đo. |
| 1.000ca×(snapshot trên+ledger trên) | 5,7220459 GiB raw ngoại suy, chưa index/WAL/metadata và không vượt policy admission bằng phép tính này. |

Không phát hiện lỗi đơn vị MB/MiB hoặc nhầm byte/bit trong các công thức này.
30 KiB/đề,400 B/save,512 B/receipt là giả định dataset, không phải giới hạn của
giao thức. Không dùng chúng để tuyên bố database thật chắc chắn chỉ khoảng6 MiB.

## 6. Mức phù hợp môn học và độ phức tạp

Giữ C ở cả hai đầu TCP với socket/connect/accept/poll/nonblocking, frame nhận,
TX offset, EAGAIN/EINTR/SIGPIPE, fairness và timeout. Đây là phần hai bạn phải
tự vẽ, giải thích và tái hiện lỗi. Node vẫn xử lý giao thức nghiệp vụ/phiên/retry
và IPC; không nên nói TypeScript “không liên quan lập trình mạng” tuyệt đối.
Thông tin thầy yêu cầu C cho tầng mạng là căn cứ người dùng cung cấp; không có
xác nhận riêng của thầy về M01 được thêm trong lượt review này.

Pipe stdin/stdout riêng là kênh cha/con, không là nơi lưu đề; vẫn có thể bị người
kiểm soát máy can thiệp. Không quảng bá chống hook, mã hóa LAN hoặc thi thật trên
mạng không tin cậy. Đáp án đúng chỉ ở server là ranh giới quan trọng hơn việc đổi
tên stdin/stdout. Không thêm native addon/localhost HTTP để chữa một tên kênh.

Độ phức tạp đáng chú ý nhất là authority/credit qua BP, strict JSON và pending
reconcile, không phải số50 tự nó quá lớn. Giữ một dispatcher/DB và helpers cụ
thể; không xây message broker, schema generator, snapshot cache chung hoặc cơ
chế recovery sau server crash. C08 chỉ một policy helper và counter/sampling.

## 7. Phân công và tiến độ

A tiếp tục RX/reactor/lifecycle/auth/room/timer; B TX/backpressure/bank/attempt/
practice/results/DB runner. A tự làm DDL/repository phần A, B không nhận toàn bộ
DB/UI/harness. UI cả hai cùng làm theo chức năng; phần chung có người tích hợp,
không tự chia đôi điểm. Ownership trong 01/02/03/04/05 khớp nhau.

S1 có luồng thi thật và nền receipt/permission/caps; S2 hoàn tất admin UI,
recovery/practice/history/chart và kiểm chứng50. Không chờ M3 admin form xong
mới cho generator/start phát triển: theo dependency đầu ra và sprint plan,
không theo số thứ tự mốc. S1/S2 đều có goal, review/demo60phút và retro15phút.

14ngày×4–5giờ =56–70giờ/người; hai ngày dự phòng thành64–80giờ/người. Estimate
gói hiện tại A60–85h/B69–96h chưa là estimate ticket. Vì thế hai tuần vẫn là mục
tiêu có rủi ro, không có chứng cứ cho câu “chắc chắn kịp”. Giữ checkpoint ngày2/4/6/7,
chạy50 lần đầu ngày10 hoặc sớm hơn, tránh dồn đọc hiểu tới ngày13.

## 8. Việc cần khóa và kiểm chứng tiếp theo

1. W01: nhóm chốt V03 bảng config/default/bounds/quan hệ. Không cản code framer
   theo wire hiện hành. Chuẩn hóa FR con để viết ticket, không tạo bộ yêu cầu khác.
2. W05/W06: bảng ownership/credit F09 với test50login/control/saturation; phân
   biệt complete frame, TCP enqueue và actual send, không trả credit hai lần.
3. W07: DB wrapper F10, WAL/FULL/FK readback, rollback/commit error, snapshot
   generation có giới hạn RAM; không sleep/retry lock dài trong dispatcher.
4. Tích hợp M1/M2 trên Linux và LAN thật. Chạy ca nhỏ sớm trước thêm mọi màn UI;
   đo hash/commit/queue rồi chạy profile50 đã định, giữ threshold trước khi đo.
5. Trước bảo vệ chỉ báo PASS khi có evidence; phân biệt “đã chốt thiết kế”,
   “đã implement”, “đã test chức năng” và “đã đạt50 trên máy cụ thể”.

Lượt này chỉ sửa tài liệu và kiểm số học/static. F08/F10 còn mở trước module liên
quan; F09 chờ code/test theo hợp đồng đã rõ. Không tạo ticket Jira, không
stage/commit/push hoặc thay config runtime.
