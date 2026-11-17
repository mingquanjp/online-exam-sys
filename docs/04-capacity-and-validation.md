# 04. Quy mô và kiểm chứng

Nhóm 4 — Nguyễn Minh Quân (20235816), Đặng Hoàng Quân (20235813).

**Trạng thái: v0.7 — hoàn thiện kế hoạch tính toán/kiểm chứng, chưa chạy nghiệm thu.**
Căn cứ: [nghiệp vụ](01-requirements-and-business-flows.md), [kiến trúc](02-architecture-and-data.md)
và [giao thức v0.8](03-protocol-specification.md). Các ngưỡng dưới đây là mục tiêu thiết
kế đề xuất, không phải cam kết đã đạt hoặc điểm số thầy bảo đảm. Không sửa ngưỡng
sau khi đo chỉ để biến kết quả trượt thành đạt; nếu cần đổi phải ghi lý do và đo lại.

Review chéo và tính lại ngân sách ngày 17/11/2026:
[báo cáo 5 tài liệu](research/five-document-consistency-review.md). Ngưỡng latency/RSS
là mục tiêu kiểm chứng của nhóm, không phải chỉ tiêu thầy đã ấn định.

## 1. Câu hỏi phải trả lời khi bảo vệ

Review 17/11/2026: V01 đã chốt không thêm CRC32 bản đầu; V03 bound config còn
mở tại [review trước triển khai](research/pre-implementation-review.md). Ngân
sách frame giữ header 4 byte, NET payload tối đa 65536 byte, frame 65540 byte;
không thêm overhead CRC hoặc tự đổi payload cap.

1. Thiết kế phục vụ bao nhiêu người, họ làm gì cùng lúc?
2. Có bao nhiêu TCP, thread, đề được gán, answer và operation? Dữ liệu nào nằm RAM/DB?
3. Đề lớn bao nhiêu byte, mất bao lâu phát cho cả lớp, cần thông lượng nào?
4. Khi client chậm/mất mạng, DB bận hoặc login dồn, các thí sinh khác ra sao?
5. Có bằng chứng dữ liệu đã xác nhận không mất/lẫn/chấm sai không?

50 người là mục tiêu tối thiểu theo kickoff. 500/1.000 là phân tích mở rộng,
không là tải phải đạt của bản này. 2 máy LAN chứng minh tích hợp UI; bot 50 người
chứng minh tải nghiệp vụ, hai phép thử bổ sung cho nhau.

## 2. Môi trường và dữ liệu kiểm thử

### 2.1. Topology

- Server C trên Linux, SQLite local disk; ưu tiên môi trường Ubuntu 22.04/GCC
  ghi đúng phiên bản thực tế khi thử. Theo M01, server có C transport/launcher
  và Node business process, đo cả hai PID và đường BP.
- Máy tạo tải tách khỏi máy server; kết nối LAN thật. Ghi Ethernet/Wi-Fi, tốc độ
  link, thiết bị mạng, RTT nhàn rỗi và có tải, số máy/IP; không lấy tốc độ danh
  nghĩa làm tốc độ payload bảo đảm. Không dùng localhost làm bằng chứng LAN.
- Ít nhất hai client UI trên hai máy. Có thể chạy server cùng một máy UI nhưng
  phải ghi số đo C server, Node child, client C và Electron; ghi sự cạnh tranh tài nguyên.
- Mỗi lần đo ghi commit/build, compiler/flags, OS/kernel, CPU/RAM, loại disk,
  dependency versions/hash parameters, config limits, DB đầu vào và seed bot.
- Tắt sleep server trong ca thử; không thay cấu hình độ bền SQLite để tăng số đo.

Chưa ấn định cấu hình phần cứng tối thiểu như kết luận thực nghiệm. Có thể bắt
đầu trên máy Linux có 4 GiB RAM, local disk và LAN 100 Mbit/s trở lên cho bộ đề
chuẩn; phải đo rồi mới công bố máy đó đáp ứng. Giới hạn latency không mặc nhiên
đúng trên Wi-Fi nhiễu hoặc máy tạo tải quá tải.

### 2.2. Bộ dữ liệu

| Bộ | Cấu hình | Mục đích |
| --- | --- | --- |
| F — chức năng | Ví dụ 12 câu: 4 dễ, 5 trung bình, 3 khó; 15 phút | Demo dễ theo dõi, có đáp án dự kiến kiểm tra độc lập. |
| S — tải chuẩn | 50 người, 30 câu/người: 10/10/10, đề khoảng 30 KiB/người. S1/S4/S5 dùng bài 20 phút, cửa sổ steady 15 phút; LT-05 dùng bài 15 phút riêng. | Tách cửa sổ đo tải khỏi startup/nhận đề và phép kiểm tra deadline. |
| M — biên hợp lệ | 50 người, 100 câu, 7.200 giây, prompt/options sát trần | Kiểm tra page/frame/RAM, không gán ngưỡng phát đề 2 giây của S cho M. |
| E — dữ liệu lỗi | Kho thiếu câu, chủ đề/câu inactive, body sai, ID người khác | Kiểm tra từ chối/rollback/permissions. |

Seed kho S tối thiểu 3 chủ đề × 3 độ khó × 40 câu = 360 câu; cho chọn một chủ đề
hoặc tất cả. Đề chọn 10 câu/mức không lặp nội bộ; hai người có thể trùng câu.
Không cần 50×30 câu khác nhau trong ngân hàng. Tạo sẵn 50 USER, một ADMIN riêng;
tách benchmark register/login khỏi benchmark thi nhưng không bỏ thử login xen tải.

M dùng seed riêng đủ cho cấu hình được thử: ví dụ 3 chủ đề × 3 độ khó × 100 câu
= 900 câu để thử cả cấu hình 100 câu cùng một độ khó trong một chủ đề. Kho S có
40 câu/mức/chủ đề không đủ cho trường hợp đó. Ghi rõ số câu/byte của kho trong
mỗi run; ngưỡng hiệu năng chỉ được đánh giá trên dữ liệu và máy đã công bố, không
suy ra mọi ngân hàng có kích thước bất kỳ đều đạt cùng độ trễ.

Đo byte đề thực từ tổng payload các response attempt.items, ghi thêm envelope,
header, answers/meta và event. Nếu dữ liệu seed khác 30 KiB thì công bố số thực
và tính lại, không đổi nhãn S trong khi giữ công thức sai.

## 3. Mô hình tải

| Profile | Hành vi | Khối lượng dự kiến |
| --- | --- | --- |
| S1 — steady | 50 người, mỗi người một save mỗi 5 giây, có jitter | 10 save/s; 9.000 save mới/15 phút. |
| S2 — burst | Barrier 50 người save hoặc submit trong cùng 100 ms | 50 request/đợt, đo người cuối cùng. |
| S3 — phát đề | Một chủ start cho 50 thành viên đã join | 50 snapshot, mỗi người lấy item theo trang tối đa 5 câu. |
| S4 — hỗn hợp | 30 người phòng A, 10 phòng B, 10 luyện tập | Tổng 50 hoạt động; timer/phân quyền độc lập. |
| S5 — lỗi xen tải | 49 người bình thường + 1 ngừng đọc/gửi dở, hoặc mất mạng rồi nối lại | Đo 49 người khỏe riêng; đối chiếu attempt của người lỗi sau sync. |
| S6 — login | 50 login cùng đợt; sau đó login/reconnect khi đang có bài | Đo hash queue, thời gian từng login, tác động đến save; login mới phải thu hồi binding cũ. |

Ngoài save, RoomView refresh mỗi 5 giây là khoảng 10 query/s, ping mỗi 10 giây
là 5 ping/s (reactor control); response tương ứng tạo lưu lượng chiều ngược lại.
Event gây refresh thêm phải được throttle/gộp theo giao thức. Không mô tả hệ
thống chỉ chịu 10 request/s khi thực tế còn các lệnh đọc/control.

Để đủ 9.000 save, bot phải đổi lại câu đã trả lời chứ không dừng sau 30 câu.
Lựa chọn mới dùng op mới và revision hiện hành; retry dùng cùng op/body.
S6 khi đã có 50 reservation dùng login lại tài khoản hiện có hoặc tài khoản không
tham gia bài để đo auth, không âm thầm tăng thành 100 thí sinh đang thi.

### 3.1. C11 — lịch gửi và số mẫu đã duyệt ngày 03/11/2026

S1/S4/S5 đo steady 900 giây trong bài có thời lượng 1200 giây. Login/join/nhận đề
và warmup hoàn tất trước T0 của cửa sổ đo; tại T0 mọi bot khỏe đã sync, không còn
save warmup pending và mỗi bài còn ít nhất 905 giây. Nếu không đạt điều kiện thì
run không hợp lệ, ghi lý do và làm lại setup; không kéo dài deadline đang chạy.
LT-05 chạy riêng với deadline 15 phút; không lấy việc đổi ca đo steady thành 20
phút để thay quy tắc server authoritative hoặc bỏ phép thử tự chốt.

- Mỗi bot khỏe có phase phi trong [0,5) giây, sinh một lần từ seed được ghi lại.
  Lịch là T0 + 5*k + phi, k=0..179: đúng 180 logical saves/bot trong 900 giây.
  Không cộng random delay sau mỗi ACK; không dùng closed-loop chờ ACK rồi mới
  bắt đầu đếm 5 giây tiếp theo vì sẽ giảm tải khi server chậm.
- Giữ giới hạn pending/revision đã chốt. Nếu trễ lịch/không còn credit thì ghi
  missed slot/scheduling lag, không giấu bằng cách bỏ mẫu hoặc dồn catch-up thành
  burst ngoài profile. Mẫu ACK có thể được thu trong 5 giây drain sau cửa sổ;
  không lên lịch save mới trong drain. Lỗi hay UNKNOWN vẫn phải được báo.
- Retry giữ op/body, chỉ tăng network attempts; không tăng logical saves.
  Save warmup, burst, submit, read và ping gắn nhãn riêng, không cộng vào steady.
- Kỳ vọng steady = N_healthy * 180: LT-02 50 người là 9000; LT-07 49 người là
  8820. LT-06 có nhóm 30/10/10 là 5400/1800/1800, tổng 9000. Bot bị tiêm lỗi
  và khoảng reconnect đo riêng, không âm thầm đổi denominator sau khi thấy lỗi.
- Burst dùng lịch barrier riêng và cùng ràng buộc pending/revision: không cố gửi
  hai save cùng câu đang pending. Save burst thêm vào tổng run nhưng không thay
  một slot steady rồi vẫn báo đủ 9000. Submit chỉ khi save của bot đã được đối
  chiếu/ACK; muốn lặp burst submit phải tạo các ca mới hợp lệ.

## 4. Dự toán dữ liệu và đường truyền

Quy ước: B=byte, KiB=1.024 B, MiB=1.048.576 B; MB=1.000.000 B;
Mbit/s dùng 1.000.000 bit/s. Mọi số dưới đây là dự toán, không phải packet capture.

### 4.1. Phát đề

Với N người, D byte payload đề/người, mục tiêu T giây:

```text
Tổng byte = N × D
Payload bit/s cần = 8 × N × D / T
Thời gian lý tưởng = 8 × N × D / thông lượng payload thực
```

| Trường hợp | Tổng byte | Payload cần nếu T=2s |
| --- | --- | --- |
| 50 người × 30 KiB | 1.536.000 B ≈ 1,465 MiB | 6,144 Mbit/s |
| 50 người × 1 MB (ví dụ thầy) | 50.000.000 B = 50 MB | 200 Mbit/s |
| 500 người × 1 MB (mở rộng) | 500 MB | 2.000 Mbit/s |

Tính payload chưa gồm headers TCP/IP, Ethernet/Wi-Fi, ACK, JSON metadata và gửi
lại. Đường 100 Mbit/s không thể phát 50 MB trong 2s; giới hạn lý tưởng đã là 4s,
thực tế lâu hơn. Đây là hạn đường truyền, không sửa bằng thêm thread.

Đề v1 chỉ văn bản, tối đa mỗi câu 4.096 + 4×1.024 = 8.192 B nội dung thô. Đề
100 câu tối đa khoảng 800 KiB **trước JSON/metadata/escape**; không nhét cả vào
frame 64 KiB. Paging tính theo byte encoded, có thể trả dưới 5 câu. Kích thước
1 MB chỉ là ví dụ phân tích, không tự đưa ảnh/file 1 MB vào phạm vi app.

### 4.2. Lưu đáp án, refresh và heartbeat

Ví dụ sau encode: save request 400 B, response 400 B. S1 tạo khoảng 10×800=8.000
B/s hai chiều, cộng header frame 80 B/s. Nếu RoomView 8 KiB, 10 refresh/s tạo
khoảng 80 KiB/s response, có thể lớn hơn lưu đáp án. 5 ping/s với tổng request+
response 400 B tạo thêm khoảng 2.000 B/s. Đo size thực rồi thay các giả định này.

Đếm riêng ingress/egress server, app bytes và NIC bytes; không cộng TCP retransmit
vào app throughput như công việc hữu ích. Heartbeat không là ACK dữ liệu bài.

### 4.3. Dữ liệu bền cho cửa sổ steady S 15 phút

| Loại | Số lượng | Ước lượng minh họa |
| --- | --- | --- |
| Attempts | 50 | Một bài/người, không một bản mới mỗi reconnect. |
| Snapshot item | 50×30=1.500 | Nếu 1 KiB nội dung/item: 1,465 MiB raw. |
| Answer hiện hành | Tối đa 1.500 | Ví dụ 100 B/row logic: khoảng 146 KiB; revision tăng khi đổi. |
| Operation save | 9.000 | Ví dụ row+receipt+index trung bình 512 B: 4,395 MiB. |
| Operations khác | Create/join/start/submit/admin | Thêm theo thực tế; không chứa key/password/toàn bộ đề. |

9000 saves là riêng cửa sổ steady 15 phút, không phải mọi thao tác của ca 20
phút. Warmup/burst/drain/submit và hoạt động ngoài cửa sổ phải báo, tính thêm theo
số thực. Khoảng 6 MiB cho các mục raw minh họa không là kích thước SQLite bảo đảm. Còn
metadata, index, page fill, WAL, migration, catalog/user và filesystem. Giả định
512 B/operation phải đo bằng DB thật; không nhân số đã thấy ở probe thành cam kết.
Giữ 1.000 ca cùng tải: riêng raw snapshot + ledger trên xấp xỉ 5,72 GiB; lịch sử
tăng theo số ca và số thao tác, không chỉ số answer hiện hành.

Đây là ngoại suy dung lượng, **không phải khả năng lưu 1.000 ca liên tiếp trong
một DB với policy hiện tại**. Riêng 9.000 save/ca đã chạm 900.000 operation sau
khoảng 100 ca; các operation khác làm mốc này đến sớm hơn. Khi đó admission có
thể chặn ca mới, cần vận hành offline theo §5.3, không tự purge receipt.

WAL có file phụ/checkpoint; phải đo .db/.wal/.shm ở lúc peak và sau clean close,
không chỉ .db cuối ca. [Nguồn: SQLite WAL](https://www.sqlite.org/wal.html).

## 5. Ngân sách RAM và giới hạn vận hành

### 5.1. Các giới hạn đồng bộ với giao thức

| Tài nguyên | Giá trị thiết kế |
| --- | --- |
| Active reservation toàn server | 50; gồm người WAITING/RUNNING kể cả offline/đã nộp sớm, và PRACTICE OPEN. |
| Phòng WAITING/RUNNING | Tối đa 50, nằm trong 50 reservations; phòng trống không tồn tại vì chủ là member. ENDED/CANCELLED chỉ lưu DB/truy vấn phân trang, không giữ reservation. |
| Kết nối mở | 128, tối đa 64 chưa xác thực; auth users online không nhất thiết đang chiếm reservation. |
| RX/TX | Một frame RX ≤65.540 B và TX ≤128 KiB/kết nối, lazy allocation. |
| Command/completion | Mỗi queue 1.024 phần tử/8 MiB, giới hạn đầu tiên chạm có hiệu lực. |
| Auth | 64 job chờ + 1 scrypt async đang chạy trong Node. Không một thread/hash buffer cho mỗi user. |
| Main IPC | Pending 32 request, NET 8 + 1 ping control; TX 256 KiB/chiều. |

Active cap=50 là quyết định vận hành đề xuất để có ngân sách xác định, không đổi
khả năng mỗi phòng tối đa 50. Vượt cap tạo/join/practice.start trả RESOURCE_LIMIT,
không đuổi bài đang làm. Resume/login không thêm reservation. Chỉ các thao tác
transaction tạo/giải phóng activity thay counter, không tin biến đếm UI.

### 5.2. Ước lượng bộ nhớ theo M01

| Thành phần | 50 socket | Cap 128 socket |
| --- | --- | --- |
| C RX TCP tối đa | Khoảng 3.125 MiB | Khoảng 8.001 MiB |
| C TX TCP tối đa | 6.25 MiB | 16 MiB |
| BP command/completion credit logic | 16 MiB tổng hai chiều | 16 MiB |
| Bản sao C/Node trên hai đầu pipe | Dự toán thêm tới 16 MiB, đo thực khi bridge đầy | 16 MiB |
| BP RX staging hai chiều | Khoảng 0.133 MiB | Khoảng 0.133 MiB |
| SQLite cache mục tiêu trong Node | 8 MiB | 8 MiB |
| scrypt workspace một job | Khoảng 64 MiB tại N=65536,r=8,p=1, maxmem=96 MiB | Cùng tham số |
| Subtotal các mục trên | Khoảng 113.5 MiB | Khoảng 128.1 MiB |

V8 heap/runtime, cJSON/object metadata, native crypto/libuv threads, Node/C code,
statement cache và log được đo thêm. Kernel socket/pipe buffers và filesystem
cache cần ghi riêng ở máy chủ. Mọi cap raw byte khác với chi phí object JS.
Cần cap số command/object cùng byte và nhường event loop giữa các handler.
Subtotal này chưa cộng các object ứng viên/snapshot trong lúc sinh đề. Với M,
50 × 100 × 8.192 B đã là 39,0625 MiB nội dung thô nếu giữ cả bộ trong RAM; JSON,
object và các bản sao có thể lớn hơn. Generator phải ghi/giải phóng có giới hạn,
không cache toàn bộ lịch sử hoặc coi ngân sách 128,1 MiB là RSS tối đa của server.
Ngưỡng RSS ở §7 tính **tổng C + Node child** và ghi riêng từng process, hash/DB
nằm trong RSS Node. Electron chạy trên máy thí sinh có số đo riêng.

Scrypt là lựa chọn dependency M01 thay libsodium Argon2id ở nghiệp vụ. Queue một
job chạy và 64 chờ, callback async quay về dispatcher để xét ticket/authority.
Đo hash thời gian/peak RSS trên Linux trước LT-09. API/params theo
[Node crypto v24.15.0](https://github.com/nodejs/node/blob/v24.15.0/doc/api/crypto.md).

### 5.3. Dung lượng và chỗ dự phòng

**C08 đã duyệt ngày 03/11/2026.** Trạng thái admission NORMAL/RESTRICTED
được tính từ mẫu gần nhất: RESTRICTED nếu .db+.wal >= 768 MiB **hoặc** operations
>= 900.000 rows **hoặc** disk free < 1 GiB. Mốc 1 GiB DB+WAL/1.000.000 rows là
cảnh báo vận hành nghiêm trọng, không phải quota tuyệt đối bắt buộc chặn ghi của
ca đang chạy. Tiếp tục phục vụ các write ưu tiên khi DB còn ghi được, có thể vượt
mốc cảnh báo; không được vừa hứa nhận mọi đáp án vừa hứa tuyệt đối không vượt cap.

- NORMAL: cho hoạt động mới nếu dự toán snapshot/seed của thao tác không làm vượt
  ngưỡng admission. Không dự toán theo kích thước đề tùy tiện do client khai.
- RESTRICTED: chặn register, room.create/configure/join mới/start, practice.start
  và sửa ngân hàng. Cho đọc/login/resume/logout/replay, lưu/nộp của ca hiện hữu,
  host end, timer và rời/hủy phòng chờ theo ma trận protocol §12.3. Lỗi từ chối
  RESOURCE_LIMIT/effect=NONE; không tạo receipt cho lỗi admission.
- Node dispatcher giữ snapshot policy, lấy mẫu file/free space trước phục vụ rồi tối đa
  mỗi 5s trong vòng vận hành hiện có; không stat mỗi frame hoặc thêm thread mới.
  operations count đọc khi startup và cập nhật sau commit, không COUNT(*) mỗi save.
  Nếu không đo được dung lượng thì chặn nhận mới, ghi chẩn đoán và tiếp tục thử
  công việc hiện hữu theo DB; không suy ra disk đã đầy hoặc báo lưu thành công.
- Quay lại NORMAL khi lần lấy mẫu mới thành công, tất cả chỉ số dưới ngưỡng và
  dự toán của thao tác mới còn phù hợp. Không tự xóa lịch sử/receipts để đạt điều
  kiện này. Ngưỡng là bảo vệ hoạt động mục tiêu, không phải đặt trước đủ bytes
  cho mọi chuỗi click hợp lệ; tải thay đổi nhiều vẫn phải đo, cảnh báo và vận hành.
- Nếu disk/DB ghi lỗi thật: rollback khi có thể; phản hồi theo kết quả commit,
  không ACK giả, không bỏ ghi receipt hoặc đổi deadline để chữa lỗi. Replay/đọc
  vẫn phụ thuộc DB hoạt động và quyền. Không bảo đảm ghi được khi thiết bị đầy.

Chưa tự purge receipts/history. Sao lưu, archive hoặc chọn DB demo mới do operator
thực hiện khi server dừng sạch và không có ca mở, giữ dữ liệu cũ để kiểm tra;
không có HTTP reset API. Không dùng xóa DB trong lúc chạy để làm benchmark đẹp.

Logs: 5 file × 10 MiB, line tối đa 1 KiB, queue log tối đa 1 MiB. Quá tải có
counter dropped_log; reactor không chờ ghi disk. Đây không là event store hoặc
bằng chứng commit; kiểm tra đúng dữ liệu vẫn từ SQLite/receipt. Không log frame
thô, lựa chọn/đáp án đúng, mật khẩu hoặc token; load-test trace chỉ IDs/timing.

### 5.4. Credit để queue không deadlock

Trong tổng mỗi queue 1.024 slots/8 MiB, dành 64 slots/512 KiB cho control/auth
completion; phần thường tối đa 960 slots/7,5 MiB. TX mỗi socket dành 8 KiB control
trong cap 128 KiB. Reactor từ chối nhận thêm lệnh nếu không giữ được slot và byte
credit completion theo worst-case response hợp lệ (tối đa một frame/command).
Credit giữ từ admission tới khi reactor đưa output vào TCP TX hoặc loại đúng
target/generation theo protocol §18.4. Chỉ đọc/parse frame BP chưa đủ để trả credit.
Worst-case BP frame 69636 byte, ordinary byte pool 7.5 MiB cho tối đa 112
completion reservations gồm response và event credits theo protocol §18.4.
Auth response cũng dùng response reservation thường; binding/lifecycle control
dùng reserve, không giữ thêm 69636 byte/auth vào riêng control pool. Chi tiết
và mốc trả credit theo protocol §18.4, không dựa vào tên queue để tính hai lần.

Slot dùng cho auth pending phải còn được bảo lưu tới lúc hash hoàn tất/hủy, không
trả sớm rồi đòi thêm slot không còn chỗ. Khi chuyển completion sang TX thất bại
vì peer chậm, đóng peer, dọn buffer và trả credit; commit bền không bị hoàn tác.
Timer/internal job có đường điều khiển dự phòng, không enqueue sau vô hạn lệnh user.
Đây là hợp đồng thiết kế queue, phải có test saturation, không chỉ kiểm tra ping.

### 5.5. Phòng chờ và khôi phục theo nhóm 1 đã duyệt

C01/C02 thêm timer WAITING_EXPIRY dùng chung cơ chế timer A, tối đa một timer/phòng
chờ, không thêm thread. Mặc định sản phẩm cố định 1.800s từ tạo. Không giữ
reservation cho CANCELLED; phân biệt roster lịch sử trong DB với activity đang
chiếm chỗ. Callback và startup expiry được kiểm chứng riêng, không coi restart
phòng chờ là hỗ trợ resume ca đang thi.

LT-15 chạy một lượt thật với 30 phút. Có thể thêm test clock injection trong
harness test để chạy nhanh các nhánh sát hạn, nhưng không đổi config bản demo
thành vài giây rồi tuyên bố đã kiểm chứng thời hạn sản phẩm 30 phút. C03 không
thêm file offline draft; phép kiểm tra đóng app chỉ yêu cầu server state đúng.
C04–C06 đã chốt ở mức tối thiểu: kiểm chứng thêm instance đổi, pending renderer
reload và logout online/offline theo AC-23..25/PT-18..20 trong các kịch bản lỗi.
C07/C10 đã duyệt ngày 03/11/2026: thêm AC-26..28/PT-21..22 cho sát hạn và
setup; đây là kiểm tra chức năng, không phải kết quả đạt tải. Giữ nguyên workload,
ngân sách và ngưỡng latency. C08/C09 đã duyệt: kiểm tra ngưỡng/matrix và JSON/cursor theo AC-29/30,
PT-23..25. Không coi thêm ca kiểm tra là đã chạy đạt. C11/C12 đã chốt ngày
03/11/2026 theo §3.1/§8/§9: chuẩn hóa lịch đo, số mẫu và phân công phần chung;
không thay threshold tốc độ hoặc coi đã nghiệm thu 50 người.

## 6. Bot mô phỏng và oracle dữ liệu

Bot dùng một TCP thật/tài khoản, thực hiện đúng handshake/auth và các message NET
v1; không bypass server để ghi DB. Load harness có thể Python/asyncio cho tiện
đánh giá, không thay client C sản phẩm. Có kịch bản tương đương đi qua client C
pipe để kiểm tra cầu nối, và UI hai máy riêng để chứng minh app tích hợp.

Harness giữ seed, config, timeline dự kiến, operation_id, request_id, answer đã
ACK/revision và lỗi của từng bot; giữ riêng pending UNKNOWN. Oracle/offline
verifier có quyền đọc DB test sau ca để so key snapshot với answer cuối cùng,
không cho bot thí sinh gọi admin API lấy key trong khi thi.

Tối thiểu kiểm tra: mỗi người đúng một attempt/phòng; đúng counts/chủ đề; không
lặp trong một đề; snapshot không đổi sau sửa kho; answer/revision/receipt không
lẫn user; bài FINALIZED một kết quả; score khớp bộ chấm độc lập; FK/integrity
đạt; không có reservation kẹt sau kết thúc. Chỉ nghiệm thu “ACK không mất” khi
ACK mới nhất của mỗi câu khớp trạng thái cuối hoặc được thay bằng save mới đã
commit theo revision; không so answer cuối với tất cả đáp án cũ đã được thay.

Bot cố ý chia frame, gộp frame và dùng slow reader trong kịch bản lỗi; không
gửi các hành vi vi phạm đó vào kết quả throughput tải hợp lệ rồi che lỗi server.
Tất cả dữ liệu/tài khoản là test; lỗi network injection tác động riêng peer/port
test, không làm gián đoạn mạng lớp/người khác.

## 7. Ma trận nghiệm thu và ngưỡng đề xuất

| Mã | Kịch bản | Tiêu chí |
| --- | --- | --- |
| LT-01 | UI hai máy LAN, trọn create/join/start/save/submit/result | AC-01..AC-15 liên quan đạt, cả hai đường client/server C, không lẫn bài. |
| LT-02 | S1 50 người, steady 15 phút trong ca 20 phút | 9.000 logical saves theo §3.1; độ trễ steady p95≤250ms, p99≤1s; 0 mất/lẫn ACK, 0 missed slot hoặc timeout/busy bất ngờ. |
| LT-03 | S2 50 save hoặc 50 submit | Cả đợt xác nhận ≤2s, đúng revision/một kết quả; 0 lỗi cap nội bộ do tải hợp lệ. |
| LT-04 | S3 start 50 người, bộ S ≈30 KiB | Người cuối lấy đủ mọi trang đề ≤2s từ lúc chủ gửi start; 50 snapshot đúng, không key. |
| LT-05 | Ca 15 phút riêng hết giờ, không bot gửi submit | Khóa sửa từ deadline; commit ENDED/kết quả đủ ≤1s sau hạn trên server clock dưới tải S. |
| LT-06 | S4 nhiều phòng/luyện tập, tổng 50 | 5400/1800/1800 saves của nhóm 30/10/10; tổng 9000. Từng nhóm steady đạt ngưỡng latency LT-02, không lẫn dữ liệu/deadline. |
| LT-07 | S5 một slow reader/gửi dở | Cap/timeout thực thi; 49 người khỏe có 8820 steady saves, đạt ngưỡng latency/dữ liệu LT-02; peer lỗi báo riêng, queue không vô hạn. |
| LT-08 | 5 người mất mạng, nối lại trước/sau hạn | Đúng bài/answers đã ACK/deadline; hết hạn không được sửa, không thêm attempt. |
| LT-09 | 50 login burst riêng | 50 hoàn tất ≤60s, không mở 50 hash threads; báo p50/p95/max, auth queue peak. |
| LT-10 | Login/reconnect xen với thi | Save người khỏe vẫn đạt LT-02, không authority cũ, auth không giữ dispatcher/DB hoặc làm trễ save ngoài ngưỡng. |
| LT-11 | M hợp lệ và malformed frames | Không frame quá cap/RAM vô hạn, không cắt JSON; publish thời gian thực, chưa áp SLA 2s của S. |
| LT-12 | Nộp sớm, query mọi đường result/history, activity mới | Không điểm sớm, ACTIVE_ACTIVITY tới ENDED; room mới không nhận user đang giữ chỗ. |
| LT-13 | Disk/transaction error, BP phản hồi rơi sau commit, Node chết/pipe lỗi, queue full | Không ACK giả; receipt/sync phân biệt NONE/UNKNOWN. Queue đầy nhưng instance còn sống: control/timer còn đường xử lý, chốt phụ thuộc DB ghi được. Node chết/BP terminal: fail-stop, không hứa timer tiếp tục; startup sau đó áp K07 và giữ DB kiểm tra. |
| LT-14 | Clean restart/migration/backup và DB có OPEN từ crash | Khởi động đúng policy, không resume/điểm 0 giả; dữ liệu cũ giữ để kiểm tra. |
| LT-15 | Chủ hủy hoặc phòng chờ hết 30 phút, tất cả client offline, cancel/start race | Giải phóng đúng reservations sau commit, không đề/bài/điểm giả; timer chờ không gia hạn hoặc hủy RUNNING. |

Login ≤60s là ngưỡng thử lớp, không đảm bảo hash queue 64 job luôn xử lý kịp
60s. Đo hash thực trước: ví dụ h ms/job, backlog cuối khoảng 50×h + overhead;
nếu không đạt phải điều tra tham số/máy/admission, không hạ chất lượng hash tùy
tiện hoặc dùng SHA thuần. Không timeout job rồi vẫn áp dụng account/session muộn.

RAM mục tiêu tổng server C + Node RSS peak ≤256 MiB ở S, ≤384 MiB ở M/cap socket test; không
OOM/swap tăng kéo dài, queue actual bytes không vượt cap. So sánh RSS sau warmup
và sau drain ổn định, không dùng việc allocator giữ cache sau free làm kết luận
leak ngay; tăng lặp không chặn qua 3 ca phải điều tra. Đây là target kiểm tra,
không giới hạn cứng tự kill làm mất ca. CPU cần báo C, Node, event-loop lag và crypto job đang chạy,
tránh quy đổi 100% một core thành toàn bộ máy; không có busy loop lúc nhàn.

## 8. Cách đo, lưu bằng chứng và kết luận

Ghi các mốc monotonic cùng clock: client request bắt đầu/chốt response; server
frame hoàn chỉnh, BP enqueue/send, Node dispatch, commit kết thúc, BP response và TCP enqueue. Latency
end-to-end dùng client clock. Mỗi tiến trình đo khoảng thời gian nội bộ bằng clock
của chính mình, nối các record bằng request_id/connection_id. C và Node cần
calibrate riêng nếu muốn trừ mốc chéo tiến trình, mặc dù cùng máy. Timer latency
dùng deadline_mono và finalize_commit_mono trong Node.

Start-to-last-page dùng điều phối cùng clock load generator; UI hai máy đo thêm
render/IPC riêng, không gọi số bot NET là UI latency. Lệnh burst đo barrier skew
thực, không chỉ tuyên bố 50 coroutine được tạo nghĩa là gửi cùng lúc.

- Warmup riêng, reset DB test có kiểm soát trước run; mỗi LT chính chạy 3 lượt.
- LT-02 mỗi lượt đủ 15 phút. LT-03 gồm ít nhất 20 burst **save** xen steady, gắn
  nhãn riêng và không thay các slot steady. Burst **submit** dùng ca 50 bài mở
  riêng, sau khi save đã ACK; không trộn vào cửa sổ còn yêu cầu đủ 9.000 saves.
  Không submit lại cùng FINALIZED rồi gọi là 50 bài mới; các ca riêng vẫn phải
  tuân thủ global cap 50, chỉ bắt đầu sau giải phóng hoạt động của ca trước.
- Báo riêng mỗi profile/nhóm bot/loại thao tác: scheduled logical operations,
  sent logical operations, network attempts/retries, ACK thành công, lỗi theo code,
  UNKNOWN, expected rejection, missed slots và scheduling lag. Sau drain, mỗi
  logical operation đã gửi phải thuộc một kết quả cuối; không đếm một retry nhiều
  lần hoặc dùng response lỗi như ACK lưu thành công. Lịch dự kiến trước run.
- Tách thời gian logical (từ lần gửi đầu đến ACK cuối, gồm retry) và RTT từng
  network attempt; ngưỡng steady dùng logical save latency. Báo cả n thành công
  và tổng scheduled/sent, mọi lỗi/timeout. Percentile nearest rank trên logical
  ACK thành công: sort n giá trị, lấy ceil(p*n). Timeout không giả thành latency
  bằng 0 hoặc bỏ khỏi pass/fail; dưới tải hợp lệ, lỗi bất ngờ đã làm run FAIL dù
  percentile của phần thành công đẹp. UNKNOWN sau drain không tính là thành công.
- Steady p95/p99 chỉ lấy mẫu steady; burst báo từng đợt/save-submit và thời gian
  từ lệnh đầu được gửi tới ACK cuối thành công, kèm barrier skew <=100ms. Mẫu burst
  không đem so ngưỡng steady 250ms; đợt có lỗi/UNKNOWN không được coi hoàn tất <=2s.
  Mixed test báo từng nhóm 30/10/10 và tổng; peer lỗi/reconnect/expected rejection
  ghi riêng từ profile trước run. Không đổi nhóm sau khi thấy kết quả chậm.
- Lưu CPU/RSS/queue/disk/network theo chu kỳ 1s, queue peak counter ở mọi thay đổi
  để không bỏ peak giữa hai mẫu. Trace giới hạn dùng môi trường test, không key.
- Không chỉ đưa đồ thị: lưu report + config + commit + raw summary + oracle diff và version Node/SQLite thực tế.
  Tên dự kiến `docs/verification/<run-id>/`; hiện chưa có báo cáo nghiệm thu.

Mỗi report có status PASS/FAIL/BLOCKED/NOT_RUN cho từng LT, lý do, lỗi còn lại,
config, ngày/máy và đường dẫn bằng chứng. Chỉ kết luận 50 thí sinh sau dữ liệu,
latency, resource và lỗi quan trọng đều đạt trên môi trường công bố.

## 9. Phân công và bằng chứng đang có

C12: Minh Quân chủ trì harness driver/scheduler/barrier, seed lịch/thu số đo và
mẫu báo cáo; metrics reactor/auth/room/timer, Linux/LAN, kịch bản LT-04/05/08/09/10/15.
Hoàng Quân chủ trì hành vi nhận đề/lưu/nộp/luyện tập trong bot, seed câu hỏi và
oracle DB/scorer độc lập, kịch bản LT-02/03/06/07/11/12. Đây là hai phần một harness,
không hai chương trình tạo tải cạnh tranh; B không nhận thêm toàn bộ runner/report.
Cả hai chạy/review LT-01/13/14 và các run 50 người; A kiểm tra số mẫu/lịch/latency,
B kiểm tra snapshot/revision/receipt/score; người kia tái lập được run. Chủ trì
kịch bản không có nghĩa làm một mình. Giao diện cùng làm theo chức năng và cùng
thống nhất component/theme, không chuyển toàn bộ UI nền sang A. Chi tiết ở tài liệu 5.

[Research/probe hiện có](research/architecture-feasibility.md) chỉ thử echo C và
SQLite độc lập trên macOS. Chúng không đạt thay bất kỳ LT tích hợp nào bên trên,
không cộng hai độ trễ thành end-to-end và không suy loopback thành LAN throughput.
Kết quả cũ giữ nguyên như lịch sử nghiên cứu, baseline hiện tại ở tài liệu 1–5.

## 10. Lịch sử thay đổi

| Phiên bản | Nội dung |
| --- | --- |
| v0.1 | Hoàn thiện workload/dataset, công thức RAM/disk/bandwidth, admission/headroom/credit, oracle, LT-01..LT-14, ngưỡng và cách lưu bằng chứng. Toàn bộ LT chưa chạy với ứng dụng. |
| v0.2 | Ngày 02/11/2026 đồng bộ C01–C03: phòng CANCELLED không giữ activity, timer chờ 1.800s và LT-15; không thêm offline draft hoặc mặc định duyệt nhóm 2–3. |
| v0.3 | Đồng bộ C04–C06 đã duyệt ngày 02/11/2026: các nhánh lỗi instance/reload/logout có AC/PT; không đổi workload/latency/budget hoặc mặc định duyệt C07–C12. |
| v0.4 | Đồng bộ C07/C10 ngày 03/11/2026: kiểm chứng sát hạn/setup, không đổi workload hoặc ngưỡng tải; C08/C09/C11/C12 còn mở. |
| v0.5 | C08/C09: NORMAL/RESTRICTED, headroom và disk lỗi, ma trận write ưu tiên và kiểm tra schema; giữ workload/latency, C11/C12 còn mở. |
| v0.6 | C11/C12 duyệt: slot 180 saves/bot, 9000/8820/nhóm 30-10-10; ca steady 20 phút đo 15 phút, deadline riêng, latency/error tách nhóm; A driver/report, B behavior/oracle. |
| v0.7 | M01 đo tổng C+Node RSS, BP credit/copies, event-loop lag và scrypt; LT-13 thêm Node/pipe failure, cần đo lại trên luồng mới. |
