# Nghiên cứu tính khả thi kiến trúc cho 50 thí sinh

Cập nhật baseline ngày 15/11/2026 theo M01. Tài liệu 02 v2.0 và 03 §18 mô tả
C transport với Node TypeScript nghiệp vụ. Các kết quả có ngày trước M01 bên dưới
là lịch sử theo phiên bản đã ghi. Trạng thái build mới ở setup và sổ quyết định.


Ngày thực hiện: 01/11/2026. Phạm vi: rà soát thiết kế v0.2, đối chiếu nguồn kỹ
thuật chính thức và chạy thử thành phần trong repo. Đây là nghiên cứu trước khi
triển khai ứng dụng, không phải biên bản nghiệm thu 50 thí sinh.

## 1. Kết luận và mức bằng chứng

**Kiến trúc có cơ sở khả thi cho mục tiêu 50 thí sinh. Giữ React/Electron, client C,
TCP, poll và SQLite. Cần chỉnh mô hình xử lý mật khẩu và làm rõ ngân sách/tải trước
khi coi bản thiết kế sẵn sàng triển khai.**

| Phát biểu | Mức bằng chứng hiện tại |
| --- | --- |
| C + nonblocking poll xử lý được 50 kết nối trong phép echo cục bộ | Đã chạy 3 lượt, 50 TCP thật mỗi lượt, dữ liệu echo khớp. |
| SQLite lưu đáp án/receipt và chốt kết quả cho dữ liệu 50 người trong phép thử nhỏ | Đã chạy 3 lượt với WAL/FULL, có kiểm tra dữ liệu sau đóng DB. |
| 50 thí sinh thi được trọn luồng ứng dụng qua LAN | **Chưa chứng minh.** Chưa có toàn bộ server/client/UI và giao thức sản phẩm. |
| Mất mạng, client chậm, deadline và thay phiên đúng dưới tải | Đã phân tích thiết kế; **chưa nghiệm thu bằng ứng dụng chạy thật**. |
| Máy Linux demo có cùng hiệu năng máy hiện tại | Không được suy ra; phải chạy lại trên Linux và LAN mục tiêu. |

Không cộng hai số đo echo và SQLite để tạo ra độ trễ end-to-end tưởng tượng.
Không dùng thông lượng loopback để công bố băng thông Wi-Fi/LAN.

## 2. Định nghĩa tải 50 người

Giả định tính toán cho nghiên cứu, chưa là hạn mức sản phẩm:

- 50 kết nối TCP đã đăng nhập; mỗi thí sinh một kết nối, không tính pipe cục bộ
  thành kết nối TCP thứ hai tới server.
- 30 câu/người, 15 phút, một lựa chọn đúng/câu. Ví dụ 12 câu trong tài liệu nghiệp
  vụ vẫn hợp lệ; 30 câu chỉ là bộ dữ liệu để thử tải.
- Văn bản đề khoảng 30 KiB/người; 500 byte cho một yêu cầu lựa chọn là giả định
  có dư cho metadata, chưa là byte layout đã chốt.
- Tải đều giả định một lần lưu/người/5 giây: 10 thao tác lưu/giây.
- Tải dồn: 50 người cùng nhận đề, cùng đổi đáp án hoặc cùng nộp.
- Tải lỗi: một người không đọc, gửi dở frame, rớt mạng; đăng nhập/reconnect dồn
  trong khi những người khác đang làm bài.

Đếm socket không thay thế được các kịch bản này. Đăng nhập tạo tải CPU/memory-hard;
sinh đề tạo tải DB/serialization; lưu bài tạo transaction; push đề tạo lưu lượng
và send queue. Mỗi loại cần đo riêng rồi đo khi cùng xuất hiện.

## 3. Poll và số kết nối

poll theo dõi readiness của danh sách descriptor. Readiness có thể xuất hiện cho
nhiều kết nối trong một vòng; vẫn phải dùng nonblocking và xử lý gửi/nhận từng
phần. POLLOUT không có nghĩa mọi byte muốn gửi đều ghi được ngay.
[Nguồn: Linux poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html).

Với 50 socket, chưa có dữ liệu nào trong nghiên cứu buộc thay poll bằng epoll
hoặc thread-per-client. Mỗi lần quét 50 descriptor không phải 50 thread. epoll có
thể cân nhắc nếu số kết nối/tải tăng và profile chỉ ra chi phí poll; không cần
thêm abstraction hỗ trợ nhiều backend lúc này.

Các yêu cầu triển khai bắt buộc vẫn gồm xử lý EINTR/EAGAIN, partial write, fd
reuse, SIGPIPE/EPIPE, fairness mỗi lượt, xử lý frame thiếu và hangup. Probe echo
chỉ thử phần con, chưa xác minh toàn bộ các nhánh lỗi.

## 4. Điểm cần sửa: password hashing trên worker nghiệp vụ

Thiết kế v0.2 đưa băm mật khẩu và lưu bài vào cùng một worker tuần tự. Khi worker
đang tính một hash tốn h milliseconds thì mọi lệnh nghiệp vụ phía sau phải chờ.
Ví dụ **giả định**, 50 hash × 100 ms = 5 giây công việc tuần tự. Đây không phải
số đo Argon2 của máy hiện tại.

Libsodium mô tả baseline interactive cần 64 MiB cho một job và yêu cầu chọn tham
số theo bộ nhớ/độ trễ thực đo. Không được mở 50 worker băm chỉ vì có 50 người.
[Nguồn: libsodium password hashing](https://doc.libsodium.org/password_hashing/default_phf).

**Đề xuất sửa K01:** một tiến trình C gồm:

1. Reactor poll: chỉ transport, buffer, queue, heartbeat.
2. Worker nghiệp vụ: một chủ sở hữu trạng thái và kết nối SQLite.
3. Một worker băm mật khẩu có queue giới hạn; không truy cập DB hoặc socket.

Worker nghiệp vụ đọc hash/phiên bản tài khoản rồi giao job. Kết quả băm quay lại
để worker kiểm tra tài khoản, connection generation, ticket và trạng thái mới
nhất trước khi cấp phiên. Chưa hoàn tất đăng nhập thì không chạy lệnh cần xác thực.
Tất cả queue có admission control, hạn chờ và chỗ dự phòng cho completion.

Đề xuất không thay quyền sở hữu module: auth vẫn Minh Quân phụ trách; B không
cần tự quản mutex cho từng bài. Một worker nghiệp vụ tiếp tục tránh nhiều writer
SQLite cạnh tranh. Thêm worker băm không đồng nghĩa đã chứng minh login 50 người
đủ nhanh; cần đo thư viện và tham số thật trước khi chốt timeout.

## 5. SQLite: phù hợp có điều kiện

SQLite WAL vẫn chỉ có một writer, có thể có reader song song. Worker nghiệp vụ
đề xuất tuần tự nên không đòi 50 kết nối DB hay nhiều writer. WAL không tự tăng
tốc worker và checkpoint có thể tạo đuôi độ trễ; phải đo commit/chờ queue.
[Nguồn: SQLite WAL](https://www.sqlite.org/wal.html).

Baseline giữ WAL + synchronous FULL + foreign keys, dùng prepared statements và
transaction ngắn. Không giảm độ bền rồi so sánh như cùng cấu hình. Trên macOS,
fullfsync là một lựa chọn bổ sung khác với synchronous FULL; nghiên cứu chạy cả
OFF và ON. Kết quả không phải thử cắt điện hoặc xác minh độ bền phần cứng.
[Nguồn: SQLite PRAGMA](https://www.sqlite.org/pragma.html).

Khi bắt đầu phòng, tạo các snapshot trong một transaction rồi commit trước khi
phát. Khi lưu lựa chọn, ghi answer và dấu operation trong cùng transaction. Khi
chốt, ghi trạng thái và kết quả nhất quán. Query kết quả phải lọc điều kiện công
bố; không serialize trực tiếp toàn bộ row chứa đáp án đúng/điểm.

Thư viện SQLite trên Python hệ thống hiện tại là 3.51.0. Tài liệu SQLite hiện nêu
WAL-reset bug đã sửa ở 3.51.3 và các bản backport, liên quan nhiều connection ghi/
checkpoint đồng thời. Các probe ở đây chỉ mở một connection tại một thời điểm,
không thử điều kiện đó. Với ứng dụng, pin một bản đã có bản sửa, không lấy phiên
bản cài sẵn của máy thử làm khuyến nghị triển khai. [Chi tiết và bản sửa](https://www.sqlite.org/wal.html#walreset).

Đổi PostgreSQL chưa giải quyết được hash hoặc sinh đề chặn worker tuần tự. Chỉ
cân nhắc đổi DB khi profile chỉ ra DB là nút thắt hoặc phạm vi cần nhiều writer/
server; không cần đổi vì riêng con số 50 người.

## 6. Pipe/Electron và giới hạn tài nguyên

Giữ pipe riêng stdin/stdout là lựa chọn IPC được Node hỗ trợ. Cần đọc stdout/
stderr liên tục, xử lý EOF/EPIPE, queue và vòng đời C. stdout không phải log hay
kho đáp án. [Nguồn: Node child_process](https://nodejs.org/api/child_process.html#optionsstdio).

Một điểm thiếu trong v0.2: `highWaterMark` chỉ là ngưỡng backpressure, không phải
hard memory cap. Electron vẫn phải có bộ đếm byte, giới hạn frame/queue và chính
sách khi quá hạn; không gọi write liên tục sau khi nhận false.
[Nguồn: Node streams](https://nodejs.org/api/stream.html#buffering).

Mỗi máy chạy một Electron và một C; server không chạy 50 Electron. Bộ nhớ UI của
50 máy không được cộng vào RSS của server. Bot test giao thức không cần mở 50 UI,
nhưng phải có kiểm thử giao diện tích hợp riêng trên hai máy.

Cần schema validation, contextBridge giới hạn, kiểm tra nguồn IPC, sandbox và
context isolation. Không gửi đáp án đúng cho client khi thi; đổi pipe thành Unix
socket không tự biến máy người dùng thành môi trường chống can thiệp.
[Nguồn: Electron Security](https://www.electronjs.org/docs/latest/tutorial/security).

## 7. Ước lượng tài nguyên, không phải kết quả đo

### 7.1. Dữ liệu và băng thông

| Giả định | Phép tính | Ý nghĩa |
| --- | --- | --- |
| 30 KiB đề/người, 50 người | 1.465 MiB payload | Tổng dữ liệu phát đề, chưa gồm TCP/JSON phụ trội |
| Muốn phát hết trong 2 giây | 0.732 MiB/s ≈ 6.144 Mbit/s | Mức payload trung bình cần đạt; không phải đảm bảo deadline phát |
| Ví dụ thầy: 1 MB/người, 50 người | 50 MB, tức 400 Mbit | Phát trong 2 giây cần 200 Mbit/s payload, không hợp với đường thực chỉ 100 Mbit/s |
| Cũng 1 MB/người, nhưng 500 người | 500 MB | Minh họa vì sao quy mô làm thay đổi thiết kế |
| 50 người, một lưu/5 giây | 10 lưu/giây | Tải đều giả định; đợt 50 cùng lưu cần tính riêng |
| 15 phút ở tải 10 lưu/giây | 9.000 thao tác lưu | Ledger có thể tăng dù answers chỉ giữ lựa chọn mới nhất |

MB trong hai ví dụ thầy dùng được quy ước decimal; KiB/MiB dùng lũy thừa 1024.
Không nhầm dung lượng truyền với RAM cùng lúc hoặc kích thước SQLite.

50 đề × 30 câu × 1 KiB nội dung khoảng 1.465 MiB dữ liệu snapshot thô. SQLite còn
có row/index/page/operation metadata, nên file sẽ lớn hơn. Nếu giữ 1.000 buổi cùng
dữ liệu, riêng phần snapshot thô khoảng 1.43 GiB; retention phải tính theo số buổi,
không chỉ một lần thi.

### 7.2. Ngân sách RAM đề xuất để tính tiếp

| Hạng mục giả định | Quy mô | Ngân sách ví dụ |
| --- | --- | --- |
| Buffer nhận tối đa | 50 × 64 KiB | 3.125 MiB |
| Queue gửi tối đa | 50 × 128 KiB | 6.25 MiB |
| Queue command toàn server | Hard cap tổng byte | 8 MiB |
| Queue completion toàn server | Hard cap tổng byte | 8 MiB |
| Cache SQLite mục tiêu | Cấu hình có đo | Khoảng 8 MiB, không phải trần toàn bộ SQLite |
| Một job hash interactive | Theo libsodium | Khoảng 64 MiB theo cấu hình tham chiếu |

Tổng các mục ví dụ khoảng 97.4 MiB; **không phải RSS server đã đo hoặc trần RAM
được bảo đảm**. Còn stack thread, allocator, JSON object, page cache hệ điều hành,
socket buffer kernel, temporary data và log. Cần đo RSS thật và peak khi sinh đề/
hash/commit cùng lúc. Không tự coi SQLite cache setting là hard cap toàn tiến trình.

Các cap trên chưa được duyệt. Khi đặt max frame 64 KiB thì đề lớn hơn cần chia
phần/phân trang theo giao thức, không cứ tăng queue vô hạn. Nếu completion tạo
50 bản đề một lúc vượt global cap, cần cơ chế phát có credit/chia phần hoặc chỉ
push thông báo để client tự lấy đề; không đóng 50 client hợp lệ vì thiết kế tự
tạo đợt dữ liệu lớn. Mỗi byte phải được tính ở nơi sở hữu, kể cả các bản sao JSON.

## 8. Rà soát tính đúng đắn

| Rủi ro | Mức ưu tiên | Yêu cầu sửa/đặc tả |
| --- | --- | --- |
| Hash chặn worker, gây đáp án chờ quá giờ | Cao | Worker hash riêng có giới hạn và kiểm thử login khi đang thi |
| Queue hai chiều đầy gây deadlock | Cao | Không giữ mutex/transaction khi chờ queue khác; admission + chỗ completion dự phòng |
| Thiếu đề/chốt dở nhưng báo thành công | Cao | Transaction và chỉ phát sau commit; lỗi thì khóa quyền sửa theo deadline, không ACK giả |
| Phản hồi về fd đã tái sử dụng | Cao | ID/generation, authority kiểm tra lại khi xử lý và định tuyến completion |
| Thay phiên nhưng lệnh/kết quả hash cũ vẫn cấp quyền | Cao | Auth ticket/version, epoch, thứ tự tuyến tính tại worker |
| Client gửi frame quá lớn trước xác thực | Cao | Kiểm tra header trước cấp phát, connection cap/rate/timeout cho cả chưa login |
| Rwnd bị hiểu là giới hạn RAM ứng dụng | Cao | Cần cap riêng cho queue user-space; TCP không quản mọi bản sao/queue nghiệp vụ |
| Sửa kho làm thay đề đã gán | Cao | Snapshot bất biến; chấm theo snapshot, không join đáp án đúng hiện tại của kho |
| Retry cũ sau reconnect ghi đè mới | Cao | Operation fingerprint + revision + transaction; sync trước quyết định retry |
| Lộ điểm nộp sớm qua history/chart/receipt | Cao | Một policy công bố dùng cho tất cả projection; không để receipt chứa điểm |
| Dồn 50 đề vào queue nhỏ | Cao | Credit/chia phần, kiểm thử đúng các cap đã chọn |
| Không thống nhất thời điểm xét hạn | Cao | Worker xét trước thay đổi; queue qua hạn bị từ chối đúng D05 |
| Lưu ledger không giới hạn | Vừa | Tính byte/buổi, retention và hành vi retry quá thời gian lưu trước khi cleanup |
| K05 giữ một phòng cả sau nộp sớm | Quyết định nghiệp vụ | Chưa duyệt; không viết như đã được D03 mặc nhiên chấp thuận |
| Restart có bài OPEN, server không resume | Giới hạn phạm vi | K07 vẫn cần duyệt; log và vận hành demo rõ, không biến restart thành tự chấm 0 |

Timer dùng monotonic thì timed wait phải chọn clock tương ứng. Không truyền
deadline monotonic vào condition variable mặc định dùng realtime. Trên Linux
đặc tả rõ việc cấu hình clock; cần tính riêng hành vi khi máy server suspend
vì CLOCK_MONOTONIC không tính thời gian suspend. Baseline demo không sleep server
khi thi, không hứa bù giờ sau sleep/restart.
[Nguồn: clock_gettime](https://man7.org/linux/man-pages/man2/clock_gettime.2.html),
[POSIX condition clock](https://man7.org/linux/man-pages/man3/pthread_condattr_getclock.3p.html).

CRC, nếu chọn, chỉ phục vụ phát hiện lỗi theo byte đã quy định; không thay xác
thực/token/TLS. Phần retry là xác nhận nghiệp vụ sau commit, không viết lại TCP
retransmission hoặc coi ACK TCP là đã lưu DB. [Nguồn: RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html).

## 9. Thử thành phần đã thực hiện

### 9.1. Môi trường và tính tái lập

- macOS 26.7.1, arm64, Python 3.9.6, SQLite 3.51.0, Apple clang 21.0.0.
- Hệ thống báo 10 logical CPU qua Python; chưa xác minh tổng RAM/model CPU vì
  truy vấn sysctl bị môi trường hạn chế. Không suy đoán cấu hình còn thiếu.
- DB thử nằm trên filesystem local, file tạm được xóa sau chạy; chưa đo ổ Linux.
- Ba lượt cho mỗi probe. Đây là các lượt rất ngắn, chưa warmup/soak dài hoặc
  kiểm soát toàn bộ tác vụ nền. Số nhỏ chỉ là bằng chứng sơ bộ.
- C probe build `-O2 -std=c11 -Wall -Wextra -Werror`; 50 socket loopback thật.
- Python script dùng SQLite/queue chuẩn; không dùng C server/JSON sản phẩm hoặc
  giả vờ rằng 50 ID trong DB là 50 TCP connection của phép thử này.

Tái chạy từ repo:

```sh
python3 tools/architecture_probe.py --output docs/research/results/sqlite-probe-new.json
python3 tools/run_transport_probe.py --output docs/research/results/transport-probe-new.json
```

Transport probe chỉ bind 127.0.0.1 cổng động; môi trường hạn chế có thể cần quyền
cho local socket. Không mở cổng LAN hoặc truy cập dịch vụ ngoài.

### 9.2. TCP/poll bằng C

[Mã C](../../tools/transport_probe.c) và
[trình tạo tải](../../tools/run_transport_probe.py) duy trì 50 kết nối cùng lúc.
Mỗi client gửi/nhận 30 frame; một client cố ý chia nhỏ header. So byte payload và
đếm byte server. Mỗi lượt có 1.500 trao đổi/loại payload, tất cả khớp.

| Payload | p95 round-trip qua 3 lượt | p99 qua 3 lượt | Peak connections |
| --- | --- | --- | --- |
| 512 byte | 0.970–0.982 ms | 1.284–1.317 ms | 50 |
| 32 KiB | 1.310–1.797 ms | 1.859–2.178 ms | 50 |

Kết quả thô: [lượt 1](results/transport-probe-01.json),
[lượt 2](results/transport-probe-02.json), [lượt 3](results/transport-probe-03.json).

Đây là echo frame không parse JSON, không SQLite, auth, UI, heartbeat hoặc timer
nghiệp vụ. Không có client ác ý/ngừng đọc trong phép chạy này. Probe chỉ củng cố
khả năng xử lý 50 socket/framing ở máy thử, không chứng minh toàn kiến trúc.

### 9.3. SQLite và queue

[Mã probe](../../tools/architecture_probe.py): một worker SQLite, 50 ID thí sinh,
30 câu/đề, mỗi prompt 1.024 byte, tổng 1.500 snapshot. Chạy 30 đợt, mỗi đợt enqueue
50 lần lưu cùng lúc và đợi cả đợt hoàn tất; tổng 1.500 thao tác lưu mới. Sau đó
retry đợt cuối, nộp 50 bài và retry nộp; tổng 1.650 job được đo/lượt cấu hình.

Một transaction lưu gồm lựa chọn và receipt. Chốt tính điểm từ items/answers.
Sau clean close/reopen: integrity_check, foreign_key_check, tổng revision, số
operation, trạng thái và điểm đều qua kiểm tra. File sau close là 2.109 MiB.

| Chỉ số qua 3 lượt | WAL/FULL, fullfsync OFF | WAL/FULL, fullfsync ON trên macOS |
| --- | --- | --- |
| Tạo snapshot + commit | 2.782–3.245 ms | 3.388–6.172 ms |
| p95 enqueue đến commit/receipt của hỗn hợp 1.650 job | 6.356–12.499 ms | 23.949–31.689 ms |
| Đợt lưu 50 người chậm nhất mỗi lượt | 10.936–17.640 ms | 42.005–50.046 ms |
| Nộp/chấm đợt 50 bài | 6.001–9.426 ms | 14.414–15.317 ms |

Kết quả thô: [lượt 1](results/sqlite-probe-01.json),
[lượt 2](results/sqlite-probe-02.json), [lượt 3](results/sqlite-probe-03.json).

Giới hạn: prompt cố định, không random từ ngân hàng, chưa có toàn bộ 11 bảng,
không hash/JSON/network, không thử conflict revision trái thứ tự hoặc crash/power
loss. Python SQLite không phải C repository sản phẩm; không suy ra C chắc chắn
nhanh hơn. Thử rất ngắn, chưa chứng minh sustained throughput trong 15 phút.

### 9.4. Minh họa head-of-line blocking

Probe còn cho 10 job giả lập chiếm worker 100 ms/job đứng trước các answer.
Answer đầu chờ khoảng 1.039–1.045 giây. Đây là `sleep` có chủ ý, **không phải đo
Argon2**. Chưa có libsodium trong môi trường thử để đo hash thật. Phép này chỉ
minh họa hệ quả xếp công việc đắt và lưu bài trong cùng queue tuần tự.

## 10. Các ngưỡng đề xuất cho lần nghiệm thu sau

Đây là tiêu chí nhóm nên duyệt trước khi build/đo đầy đủ, không phải yêu cầu thầy
đã chỉ định hoặc kết quả đã đạt:

| Kịch bản | Ngưỡng ban đầu đề xuất |
| --- | --- |
| 50 người làm bài trong 15 phút, giả định một lưu/5 giây | Không mất/lẫn dữ liệu đã ACK; p95 lưu ≤250 ms, p99 ≤1 giây |
| 50 người cùng lưu | Cả đợt nhận xác nhận trong ≤2 giây, không lỗi do vượt cap nội bộ dưới tải hợp lệ |
| Bắt đầu phòng, đề khoảng 30 KiB/người | Người cuối nhận đầy đủ đề trong ≤2 giây kể từ server nhận lệnh hợp lệ |
| 50 người nộp gần đồng thời | Cả đợt nhận xác nhận trong ≤2 giây; một kết quả cuối/bài |
| Đến deadline, không client nào gửi nộp | Khóa sửa từ deadline; chốt/công bố đủ trong ≤1 giây sau hạn dưới tải mục tiêu |
| Đăng nhập dồn trong khi người khác đang thi | Không làm lưu bài vượt ngưỡng trên; đo thời gian login riêng theo hash thực tế |
| Một client chậm/rớt mạng/reconnect | Các client khác còn đạt ngưỡng; bài khôi phục đúng, giờ không reset |
| Queue/resource | Byte cap có hiệu lực, số allocation/queue không tăng vô hạn; báo cả RSS và kernel/network khi đo được |

Phải ghi riêng thời điểm client gửi, reactor nhận, worker nhận/xét hạn, commit,
enqueue phản hồi và client nhận. Chỉ dùng timestamp cùng clock để tính một đoạn
độ trễ; không trừ hai đồng hồ hai máy chưa đồng bộ. Với D05, phản hồi chậm không
có nghĩa thao tác được server xét sau hạn; test phải phân biệt các mốc.

Kịch bản phải có nhiều phòng/luyện tập cùng tồn tại nhưng tổng tải hoạt động mục
tiêu là 50, không quảng bá 50 × 50. Tạo tài khoản trước để đo phần thi, rồi chạy
riêng kịch bản login dồn; không loại bỏ login khỏi mọi bài đo để che nút thắt.

## 11. Quyết định sau nghiên cứu

- Giữ SQLite, poll, một TCP/client và IPC pipe; chưa cần PostgreSQL, epoll hoặc
  dịch vụ backend mới.
- Sửa đề xuất K01 thành reactor + worker nghiệp vụ/SQLite + worker băm giới hạn.
  Đặc tả ownership/queue/ticket trước khi code, không đặt một mutex lớn quanh mọi thứ.
- Bổ sung hard cap cho cả Electron và C, chiến lược phát đề khi queue bị giới hạn,
  retention ledger, clock timed wait và pin SQLite có bản sửa WAL.
- K05/K07 và các Kxx khác vẫn cần duyệt. Không đổi nghiệp vụ v1.0 chỉ vì nghiên cứu.
- Trước khi chuyển sang giao thức, nhóm duyệt bản kiến trúc sửa đổi; khi có C server
  đầy đủ phải chạy nghiệm thu tích hợp Linux/LAN, không dùng các probe thay thế.

**Câu trả lời cho “đã xử lý được 50 người thi cùng lúc chưa?”:** chưa có ứng dụng
để xác nhận điều đó. Đã có bằng chứng thành phần cho 50 TCP và ghi dữ liệu quy mô
50 bài; cùng phân tích tải cho thấy mục tiêu hợp lý, với các điều chỉnh nêu trên.
