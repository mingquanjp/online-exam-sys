# Đối chiếu tài liệu học với dự án

Nguồn: `OneDrive_1_11-1-2026.zip` do nhóm cung cấp ngày 01/11/2026.
Mục đích: hiểu nền tảng kiến thức của lớp để thiết kế, giải thích và chuẩn bị bảo
vệ; không tự biến hướng dẫn/bài tập trong tài liệu thành yêu cầu mới của nhóm.
Trang bên dưới tính theo thứ tự trang PDF, có thể khác số in ở chân slide.

## 1. Bộ tài liệu

| File | Số trang | Nội dung chính đã khảo sát |
| --- | --- | --- |
| Lec01.ReviewCProgramming.pdf | 48 | Giới thiệu môn; C, con trỏ, cấp phát động, struct, linked list, I/O thư viện và descriptor. |
| Lec02.ReviewComputerNetwork.pdf | 63 | Quy ước code, tầng ứng dụng/giao vận, kiến trúc client/server, TCP/UDP, byte stream, ACK, flow/congestion control. |
| Lec03.SocketAPIIntroduction.pdf | 46 | Socket TCP/UDP, chu trình API, địa chỉ IP/port, byte order, sockaddr, chuyển đổi địa chỉ và phân giải tên. |
| Lec04.ElementarySocketsProgramming.pdf | 69 | API socket, options, TCP/UDP client/server, partial send/byte stream, thiết kế và xử lý giao thức ứng dụng. |
| Lec05.ConcurentServer.pdf | 39 | Mô hình I/O, server lặp/đa tiến trình/đa luồng, fork, signal, EINTR, pthread và mutex. |
| Lec06.IOMultiplexing.pdf | 26 | select, fd_set, vòng lặp nhiều kết nối; poll, pollfd và event flags. |
| Lec07.AdvancedIO.pdf | 23 | Nonblocking, fcntl/ioctl, signal-driven I/O, timeout, readv/writev và recvmsg/sendmsg. |
| The C Programming Language, 2nd edition | 238 | Sách tham khảo C; đã kiểm tra cấu trúc/text, chưa đọc toàn bộ trong lượt khảo sát này. |
| UNIX Network Programming, Volume 1, 3rd edition | 1.094 | Sách tham khảo socket; đã kiểm tra cấu trúc/text, chưa đọc toàn bộ trong lượt khảo sát này. |

Không đưa nguyên sách/PDF hoặc toàn bộ text trích xuất vào repo. Tài liệu gốc
vẫn nằm trong file ZIP của nhóm; ghi chú này chỉ giữ đối chiếu cần thiết.

## 2. Những chỗ liên quan trực tiếp đến project

| Nội dung lớp | Vị trí tham khảo | Ứng dụng trong thiết kế hiện tại |
| --- | --- | --- |
| Socket bằng C là trọng tâm môn | Lec01 trang 3 | Client C trực tiếp kết nối server C; React/Electron làm giao diện. |
| Quy ước tên, constants, format, kiểm tra giá trị trả về | Lec02 trang 1–3 | Phân biệt listening/connected socket, tránh magic number, kiểm tra từng syscall; đưa vào tài liệu triển khai sau. |
| TCP byte stream, không có message boundaries | Lec02 trang 33; Lec04 trang 44–47 | Header độ dài, RX buffer, ghép/tách frame; không coi một recv là một message. |
| Flow control và congestion control | Lec02 trang 27, 36–42 | Phân biệt kernel TCP rwnd với queue ứng dụng; không gọi cap queue là tự viết lại thuật toán congestion control TCP. |
| Network byte order | Lec03 trang 14–16 | Header length uint32 BE; port dùng htons, length dùng htonl/ntohl hoặc codec byte tương đương. |
| Client/server socket lifecycle | Lec04 trang 25–37 | socket/bind/listen/accept và socket/connect; recv/send/close, phân biệt listen fd và connection fd. |
| Gửi thiếu và SIGPIPE | Lec04 trang 35–36 | TX queue giữ offset, không gửi lại cả frame trên cùng stream; xử lý peer đã đóng. |
| Giao thức phải có cấu trúc, thứ tự, ý nghĩa và xử lý | Lec04 trang 52–64 | Tài liệu 03 cần được đọc như hợp đồng hành vi, không chỉ danh mục JSON. |
| State machine | Lec04 trang 64 | Khi hoàn thiện đặc tả, bổ sung bảng chuyển trạng thái rõ cho auth/kết nối, phòng và bài; ràng buộc trigger/guard/effect. |
| Các cách phục vụ đồng thời | Lec05 trang 4–14, 32–39 | Theo M01: một C poll reactor và một Node business child cho cả server; không tạo thread/process cho mỗi thí sinh. |
| EINTR, dữ liệu dùng chung và mutex | Lec05 trang 30, 37–38 | Xử lý lỗi syscall và quyền sở hữu dữ liệu; M01 dùng pipe giữa C/Node và dispatcher tuần tự, không mặc định cần queue pthread/mutex của kiến trúc cũ. |
| select/poll | Lec06 trang 4–26 | pollfd/events/revents, bật POLLOUT khi còn dữ liệu chờ; không busy loop. |
| Nonblocking và timeout | Lec07 trang 3–8, 18–19 | fcntl O_NONBLOCK, EAGAIN/EWOULDBLOCK, timer connect/frame/request; không để client chậm chặn cả lớp. |

Baseline M01 ngày 15/11/2026 thay kiến trúc ba luồng C cũ bằng C transport/launcher
và Node business process. Node dùng SQLite và scrypt bất đồng bộ qua thư viện;
không coi đây là tổng cộng đúng hai thread của hệ điều hành vì runtime có thread
nội bộ. Không khẳng định bài giảng dạy nguyên mẫu kiến trúc này. SQLite/cJSON,
libsodium random ở C, Electron IPC, pipe BP, operation ledger và revision là các
phần nhóm lựa chọn, cần giải thích bằng tình huống cụ thể của đề tài.

## 3. Những điểm cần lưu ý khi dùng làm căn cứ

- Lec01 trang 6 ghi môi trường kiểm tra bài tập là Ubuntu 22.04/GCC. Đây là căn cứ
  tốt để chọn môi trường build/test C tương thích, chưa đủ để kết luận thầy đã
  chỉ định đúng phiên bản này cho BTL. Probe macOS không thay thế kiểm chứng Linux.
- Cũng ở Lec01 có quy cách nộp và tỷ trọng chấm bài tập. Không áp tỷ trọng đó cho
  BTL hoặc thay barem đề tài/thông tin kickoff mới hơn.
- Ví dụ slide chủ yếu để minh họa, không phải implementation hoàn chỉnh. Chẳng
  hạn Lec06 trang 7 có dòng ready-for-reading ghi send buffer; khi triển khai cần
  đối chiếu đúng receive/read readiness. Ví dụ echo không tự có framing, retry,
  giới hạn queue hoặc toàn bộ xử lý lỗi cần cho ứng dụng thi.
- Bài giảng có UDP, fork, SIGIO và scatter/gather không có nghĩa BTL phải dùng hết.
  Chọn TCP/poll/nonblocking theo nhu cầu rồi giải thích tradeoff; không thêm công
  nghệ chỉ để liệt kê nhiều API.
- Mất phản hồi nghiệp vụ sau commit khác mất segment TCP. TCP đảm bảo truyền tải
  trong phạm vi của nó; server vẫn cần receipt/revision để phục hồi trạng thái
  lưu/nộp khi kết nối đứt và client không biết kết quả.

## 4. Cách dùng cho các bước tài liệu tiếp theo

1. Rà soát đặc tả giao thức theo bốn phần: format, thứ tự, ngữ nghĩa và xử lý;
   thêm bảng trạng thái theo tinh thần Lec04 trang 64 trước khóa protocol v1.0.
2. Quy mô/kiểm chứng phải đo tài nguyên/lưu lượng và hành vi nhiều client trên
   Linux/LAN, liên hệ poll, buffer và nonblocking thay vì chỉ đưa số socket mở.
3. Kế hoạch triển khai ghi quy ước code lớp đã nêu và các câu mỗi người phải tự
   giải thích: syscall, buffer, partial I/O, thread/queue, timer, retry của phần mình.

Ghi chú này đối chiếu kiến thức học với baseline M01; không thay hợp đồng kiến
trúc/giao thức hoặc phân công của tài liệu 02/03/05. Lịch sử ba luồng giữ trong
changelog/nghiên cứu cũ, không dùng làm baseline triển khai.
