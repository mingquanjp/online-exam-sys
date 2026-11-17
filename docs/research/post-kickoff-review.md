# Review đối chiếu góp ý sau kickoff

Ngày review: 15/11/2026. Nhóm 4 — Nguyễn Minh Quân, Đặng Hoàng Quân.

**Bổ sung 17/11/2026:** đọc lại HTML gốc đã phát hiện V01: nội dung kiểm tra toàn
vẹn đề/đáp án chưa có cơ chế đối chiếu checksum tầng ứng dụng trong giao thức hiện
tại. Kết luận cuối báo cáo này chỉ áp cho transcript/note đã đọc lúc đó, chưa bao
quát hết file HTML. Dùng [review mới](pre-implementation-review.md) làm trạng thái
đối chiếu mới nhất; không coi mọi góp ý đã đóng ở mức thiết kế.
Sau phân tích, nhóm đã chốt V01 ngày 17/11: không thêm CRC32 bản đầu, giữ
length + JSON và giới hạn an toàn hiện hành. Đây là quyết định có cân nhắc,
không phải bỏ quên góp ý hoặc khẳng định TCP bảo vệ tuyệt đối mọi lỗi.

## 1. Căn cứ và phạm vi

Đối chiếu transcript nguyên bản và note tay người dùng đã cung cấp trong trao đổi
với năm tài liệu hiện hành, sổ quyết định, đối chiếu bài giảng và scaffold C/Node.
Không đọc lại file ghi âm hoặc HTML trong lượt này; không coi diễn giải kỹ thuật
của nhóm là nguyên văn yêu cầu bổ sung của thầy. Không sửa slide hoặc sheet cũ.

Baseline: tài liệu 01 v1.8, 02 v2.0, 03 v0.8, 04 v0.7, 05 v0.7, M01 C transport
+ Node TypeScript nghiệp vụ. Các chỉnh lý trong lượt review chỉ làm rõ cách đối
chiếu và sửa mô tả cũ, không đổi nghiệp vụ, ngưỡng tải hoặc ownership A/B.

Kết luận: các góp ý cốt lõi đã được đưa vào thiết kế. Cần phân biệt ba trạng thái:

- Đã ghi trong yêu cầu/hợp đồng: có phạm vi và tiêu chí đối chiếu.
- Đã triển khai: có đường chạy thật; scaffold build được chưa chứng minh điều này.
- Đã kiểm chứng: có kết quả và bằng chứng của từng ca; chưa có nghiệm thu 50 người.

## 2. Ma trận đối chiếu

| Góp ý của thầy hoặc note nhóm | Tài liệu hiện hành | Trách nhiệm và bằng chứng cần có | Kết quả review |
| --- | --- | --- | --- |
| Không nhận ba mục mở rộng là ba chức năng nâng cao độc lập; làm chỉn chu phần hiện có | [01 §1–2](../01-requirements-and-business-flows.md), [05 §8](../05-implementation-plan-and-task-allocation.md) | A transport/auth/reconnect; B đồng bộ bài/receipt/TX; cùng tích hợp | Đã cập nhật; bổ sung bảng ánh xạ cụ thể trong 01 §1 ở lượt này. Không cộng điểm riêng hoặc suy ra điểm cá nhân. |
| Mất mạng/tiếp tục bài gắn với quản lý phiên và quyền | 01 FR-01/02/10; [02 §7](../02-architecture-and-data.md); [03 §6 và luồng reconnect](../03-protocol-specification.md) | A nối lại/xác thực/thu hồi binding cũ; B lấy lại đúng đề/đáp án/revision; AC-11/12, LT-08/10 | Có hợp đồng; chỉ khôi phục dữ liệu đã commit, không hứa giữ nháp offline qua đóng app hoặc resume ca sau server crash. |
| Mất phản hồi/gửi lại an toàn thuộc xử lý truyền dòng và cơ chế vào-ra socket | 01 §1; 03 framing, request_id/operation_id, receipt/retry và PT; 02 transaction save/submit | A RX/framing/connection context; B partial send/receipt/revision/submit; PT-03 và ca mất phản hồi sau commit, LT-13 | Có hợp đồng. Phần C và TypeScript phối hợp, không đẩy toàn bộ trách nhiệm cho TCP. |
| Client chậm/flow control phải được xử lý trong cơ chế vào-ra | 03 §12/18; [04 §5/7](../04-capacity-and-validation.md); 05 TX ownership | B TX offset/caps/backpressure, A poll/fair scheduling/timeout; PT-03, PT-27, LT-07 | Có cap và ca 49 người khỏe + 1 client lỗi; chưa có số đo. Không gọi queue cap là tự cài đặt TCP congestion control. |
| Đặc tả giao thức đầy đủ như bài truyền file | 03 §1–18: IPC/NET/BP, frame/envelope/schema/API/error/FSM/timeouts/retry | A parser/validator/lifecycle, B encoder/canonical/credit; PT-01..28 và golden vectors | Có đặc tả để triển khai; chưa phải protocol đã được test. M01 đã thêm hợp đồng C–Node. |
| Xác định người dùng thực tế, tối thiểu một lớp 50; 2 người chỉ là demo tích hợp | 01 §1, AC-16; 04 §2–3/7 | 2 UI máy thật + bot hành vi qua NET C; LT-01/02/06 | Đã cập nhật. 50 là toàn server, gồm chủ nếu thi; không hứa 50 phòng × 50 người. 128 TCP cap khác 50 activity cap. |
| Đề bao nhiêu byte; 50 khác 500; tốc độ truyền cần bao nhiêu | 04 §4.1–4.2, bộ S/M | Đo encoded bytes, NIC/app throughput, thời gian người cuối nhận đủ trang; LT-04/11 | Có công thức và ví dụ 50 × 30 KiB, 50/500 × 1 MB. 1 MB là ví dụ, không tự thêm file/ảnh vào app; 500/1.000 ngoài cam kết. |
| Bao nhiêu đề, đáp án, database và RAM | 02 schema/snapshot; 04 §4.3/5 | Ghi attempts/items/answers/operations, .db/.wal/.shm, tổng RSS C + Node, hash peak, queue peaks | Đã dự toán theo M01; các số là giả định có công thức, cần thay bằng số đo thật. Một đề được gán cố định/người/lượt, không tạo lại sau reconnect. |
| Dùng AI đúng cách, ví dụ bot mô phỏng thí sinh/đánh giá kết quả | 04 §3/6–8; 05 C11/C12; tools/load/README.md | A lịch gửi/barrier/metrics/report, B behavior/seed/DB oracle; cùng review | Có kế hoạch bot thực hiện login/join/nhận đề/save/submit và đối chiếu DB; AI hỗ trợ tạo/review, PASS/FAIL dựa tiêu chí tái lập, không chỉ lời nhận xét của AI. |
| Xem lại stdin/stdout, hiểu kiến trúc và rủi ro lộ đề/đáp án | 02 §4/5/12; 03 IPC/BP/lifecycle; 05 M01 | Parent tạo pipe riêng, không shell, lọc secret, stderr log có giới hạn, server phân quyền, không gửi key; PT-12/26/28 | Có ranh giới và giới hạn rõ. Thầy nói không bắt buộc bỏ; giữ pipe theo quyết định nhóm, không hứa chống hook. |
| Không cần nghĩ thêm nâng cao khi phạm vi/điểm đã đủ | 01 §2.2; 05 §1/9 | Hoàn thiện phạm vi đã nhận và bằng chứng; chưa thêm AI chấm, multi-server hoặc 1.000 người | Đã cập nhật định hướng. Nhận xét điểm trong kickoff không là bảo đảm điểm cuối hoặc phép chia điểm hai người. |
| Mỗi người hiểu sâu phần mình, phân công rõ | 05 §2/4/8 | Mỗi người có UI, C network, TS domain, dữ liệu và kiểm thử phần mình; cùng hiểu luồng tổng | Giữ A RX/auth/room/timer, B TX/bank/attempt/practice/results; UI cả hai cùng làm. |

## 3. Ba điểm kỹ thuật cần diễn đạt chính xác khi bảo vệ

### 3.1. TCP ACK khác xác nhận lưu bài

TCP xử lý byte stream và retransmission trong kernel. Không tự gửi lại cả frame
trên cùng stream khi send mới gửi được một phần: giữ offset và gửi phần còn lại.
Nếu kết nối đứt sau khi server commit nhưng trước khi client nhận kết quả, client
không biết thao tác đã thành công hay chưa. Operation ID/receipt và sync giải
quyết sự không chắc chắn này; không phải nhóm viết lại TCP retransmission.
Phân loại theo góp ý thầy vẫn nằm trong phạm vi xử lý truyền dòng/luồng thao tác.

### 3.2. Receive window, congestion control và queue ứng dụng

Receive window (rwnd) thuộc flow control, liên quan khả năng nhận của peer.
Congestion control sử dụng congestion window (cwnd) và thuật toán của TCP để
phản ứng với điều kiện mạng; không đồng nhất hai khái niệm. Ứng dụng dùng socket
TCP do OS thực hiện các cơ chế này; nhiệm vụ nhóm là xử lý nonblocking I/O,
partial send, writable readiness, queue có giới hạn và client chậm. Không tự
thêm bài toán triển khai rwnd/cwnd ở tầng ứng dụng.
[Nguồn: TCP RFC 9293, §3.8.2 và §3.8.6](https://www.rfc-editor.org/rfc/rfc9293.html).

### 3.3. Pipe riêng vẫn dùng stdin/stdout

Đổi cách gọi không đổi cơ chế: parent gắn các pipe riêng vào fd 0/1 của child,
không mở terminal giao thức cho người dùng. Đây là kênh IPC, không phải nơi lưu
đề/database. API stdio pipe là cơ chế có hỗ trợ chính thức, có dung lượng hữu hạn
và phải xử lý backpressure; việc dùng nó không chứng minh kiến trúc do AI làm.
[Nguồn: Node child_process](https://nodejs.org/api/child_process.html#optionsstdio).

Điều đó cũng không bảo đảm an toàn trước người có quyền can thiệp máy thí sinh.
Đề và lựa chọn đã hiển thị phải tới client; đổi sang socket IPC khác cũng không
tự giấu được chúng. Server không gửi đáp án đúng để chấm trong lúc thi, kiểm tra
quyền từng yêu cầu; TCP thuần chưa mã hóa LAN. Không tuyên bố kiến trúc đã chống
gian lận hoặc đủ an toàn cho môi trường thi thật không tin cậy.

## 4. Sai lệch tìm được và đã chỉnh trong lượt này

1. Tài liệu 01 chỉ nói chung ba cơ chế thuộc chất lượng hiện có: đã thêm bảng
   ánh xạ từng cơ chế vào yêu cầu/chức năng phải triển khai sau kickoff.
2. Tài liệu đối chiếu bài giảng còn mô tả ba luồng C/queue pthread theo baseline
   trước M01: đã đổi sang C reactor + Node child, giữ lịch sử ở nghiên cứu cũ.
3. Một số câu hiện hành ở 02/05 còn gọi Worker hoặc đường UI→C→server→DB thiếu
   Node/BP: đã làm rõ dispatcher, queue và đường đi qua Node. Không sửa các
   changelog ghi lịch sử ba luồng thành kiến trúc mới.
4. README đã liên kết báo cáo này để tránh nhầm scaffold/build với hoàn thành
   góp ý của thầy trong chương trình chạy thực.

## 5. Phần còn phải làm trước khi tuyên bố hoàn thành góp ý

- M1/M2: đường UI/C/TCP/C/BP/Node thật, codec/config/lifecycle và auth/SQLite.
- M3–M5: nghiệp vụ phòng/đề/bài/result/admin/practice, quyền và deadline đúng.
- M6: chạy PT/AC/LT liên quan, gồm đủ 50 thí sinh hành vi và lỗi mạng/pipe/client.
- Lưu report có cấu hình, phiên bản, số mẫu, lỗi, byte/RAM/disk/latency và oracle;
  kết quả probe cũ không thay thế report ứng dụng kiến trúc M01.
- Cả hai giải thích được code/buffer/state/đường lỗi phần mình; bằng chứng AI
  sinh code hoặc bot mở đủ socket không thay thế hiểu biết và tính đúng.

Không phát hiện góp ý cốt lõi nào trong transcript/note được cung cấp còn thiếu
khỏi phạm vi thiết kế sau các chỉnh lý này. Đây là review đối chiếu tài liệu,
không kết luận hết lỗi thiết kế hoặc đảm bảo runtime đã ổn định. Không thay đổi
phạm vi và không cần thêm một gói chức năng nâng cao mới để đáp ứng buổi kickoff.
