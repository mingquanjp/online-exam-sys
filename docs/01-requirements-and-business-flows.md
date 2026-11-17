# 01. Yêu cầu và luồng nghiệp vụ

Nhóm 4 — Nguyễn Minh Quân (20235816), Đặng Hoàng Quân (20235813).

**Trạng thái: v1.8. Nhóm đã duyệt D01–D07 và nhóm 1 (C01–C03) ngày 02/11/2026.**
Nhóm 1 bổ sung hủy/hết hạn phòng chờ và phạm vi khôi phục; C04–C06 đã duyệt
ngày 02/11/2026. C07–C12 đã duyệt ngày 03/11/2026. M01 ngày 15/11/2026
chuyển nghiệp vụ và SQLite sang TypeScript/Node trên máy chủ. TCP client/server
và quản lý kết nối thực hiện bằng C, giao diện cả hai cùng làm.

Tài liệu mô tả hành vi người dùng và các điều kiện hệ thống phải bảo đảm. Đây là
căn cứ cho kiến trúc, dữ liệu, giao thức, kiểm thử và phân công sau này; chưa phải
báo cáo chức năng đã hoàn thành. Các quyết định đã duyệt được tổng hợp ở mục 12.
Khi thay đổi quy tắc, cần cập nhật cả các luồng và tiêu chí nghiệm thu có liên quan.

Review chéo ngày 17/11/2026 và đánh giá các con số ở
[báo cáo 5 tài liệu](research/five-document-consistency-review.md). Không thay
quyết định nghiệp vụ; giới hạn thiết kế khác với kết quả đã chạy đạt.

## 1. Mục tiêu và căn cứ

Review 17/11/2026 bổ sung đối chiếu barem/file góp ý gốc/bảy bài giảng tại
[review trước triển khai](research/pre-implementation-review.md). V01 đã chốt giữ
length + JSON, chưa thêm CRC32 trong bản đầu. Không coi ghi chú phân tích trong
HTML là xác nhận thầy bắt buộc checksum tầng ứng dụng; quyết định do nhóm duyệt.

Xây dựng ứng dụng desktop cho phép người dùng thi trắc nghiệm theo phòng và luyện
tập cá nhân qua LAN. Hệ thống phải thiết kế và kiểm thử cho **tối thiểu 50 thí sinh
hoạt động đồng thời trên một server**, gồm nhận đề, gửi đáp án và nộp bài. Chỉ mở
được 50 kết nối chưa đủ để chứng minh yêu cầu này.

Căn cứ nghiệp vụ:

- Đề tài thi trắc nghiệm và bảng chức năng của môn học do nhóm cung cấp.
- Các quyết định của hai thành viên trong trao đổi chuẩn bị dự án.
- Transcript kickoff do nhóm cung cấp: thầy chốt tối thiểu một lớp 50 người cho
  nhóm hai người, yêu cầu đặc tả giao thức đầy đủ và triển khai chỉn chu.
- Xác nhận mới của nhóm: mỗi thí sinh nhận một đề chọn ngẫu nhiên theo cấu hình
  phòng; admin có thể thêm câu hỏi qua giao diện quản trị.

Reconnect, gửi lại an toàn và kiểm soát client chậm thuộc chất lượng các chức năng
hiện có. Không tính chúng thành ba gói nâng cao riêng hoặc tự suy ra điểm cá nhân.

Đối chiếu cụ thể với góp ý kickoff:

| Cơ chế từng ghi là mở rộng | Vị trí trong phạm vi phải triển khai của nhóm |
| --- | --- |
| Mất mạng → tiếp tục bài thi | FR-01/02/10: quản lý phiên, xác thực lại, quyền và khôi phục dữ liệu server đã lưu; không reset thời gian. |
| Mất phản hồi → gửi lại an toàn | Xử lý truyền dòng/cơ chế vào-ra socket kết hợp FR-08/09: framing, partial I/O, xác nhận nghiệp vụ, đối chiếu và chống thực hiện trùng. |
| Client chậm → hệ thống vẫn phục vụ | Cơ chế vào-ra socket và FR-13: nonblocking, TX offset, queue có giới hạn, backpressure và timeout. |

Đây là cam kết triển khai của nhóm sau góp ý, không phải khẳng định mọi cơ chế đều
là yêu cầu độc lập có điểm riêng trong barem. TCP retransmission/ACK do hệ điều hành
thực hiện khác với retry/ACK lưu bài của ứng dụng; queue ứng dụng không thay thế
TCP receive window hoặc thuật toán congestion control. Bảng đối chiếu đầy đủ và
trạng thái bằng chứng ở [review sau kickoff](research/post-kickoff-review.md).

## 2. Phạm vi phiên bản đầu

### 2.1. Trong phạm vi đã thống nhất

| Mã | Nhóm yêu cầu | Hành vi cần có |
| --- | --- | --- |
| FR-01 | Tài khoản và phiên | Đăng ký, đăng nhập, đăng xuất, nhận diện người dùng và xác thực lại khi khôi phục kết nối. |
| FR-02 | Phân quyền | Server kiểm tra quyền với từng thao tác tài khoản, phòng, ngân hàng, bài làm và kết quả. |
| FR-03 | Ngân hàng | Admin thêm, sửa, ngừng sử dụng câu hỏi; phân loại chủ đề và độ khó. |
| FR-04 | Cấu hình phòng | Lấy chủ đề/số câu khả dụng, chọn số câu từng độ khó và thời lượng; từ chối cấu hình không đủ câu. |
| FR-05 | Danh sách và tham gia | Xem phòng cùng trạng thái, tham gia phòng chưa bắt đầu, vào phòng chờ; thành viên thường được rời trước khi thi. |
| FR-06 | Điều khiển thi | Chủ hủy khi chờ, bắt đầu/kết thúc sớm khi thi; server tự hủy phòng chờ sau 30 phút và quản lý thời hạn thi riêng. |
| FR-07 | Sinh và gán đề | Sinh đề ngẫu nhiên riêng cho từng thí sinh, lưu cố định bản đề và dữ liệu chấm. |
| FR-08 | Làm bài | Nhận đề, chọn/đổi đáp án, phân biệt đang lưu/đã lưu/lưu thất bại. |
| FR-09 | Nộp và chấm | Nộp sớm hoặc server tự chốt; chấm theo dữ liệu server, không tạo kết quả trùng khi gửi lại. |
| FR-10 | Khôi phục | Sau xác thực, lấy lại bài, đáp án đã lưu và thời hạn; không tạo đề mới hay reset giờ. |
| FR-11 | Luyện tập | Bài cá nhân có cấu hình, thời hạn, lưu đáp án, chấm và lịch sử; không cần phòng chờ. |
| FR-12 | Kết quả và lịch sử | Xem kết quả theo quyền, lịch sử cá nhân và biểu đồ điểm. |
| FR-13 | Vận hành | Log truy vết, thông báo lỗi/kết nối rõ ràng, phục vụ các client còn lại khi một client chậm hoặc rớt mạng. |

### 2.2. Chưa cam kết trong phiên bản đầu

- Quy mô 500 hoặc 1.000 thí sinh; đây không phải chỉ tiêu thầy chốt cho nhóm.
- Khôi phục nguyên trạng bài đang thi sau server crash/restart.
- Câu hỏi ảnh/audio/video, chạy mã nguồn hoặc AI chấm bài.
- Nhập ngân hàng hàng loạt bằng CSV/Excel. Thêm bằng form nằm trong phạm vi.
- Chống gian lận tuyệt đối trên thiết bị do thí sinh kiểm soát.
- Mọi đề khác nhau hoàn toàn, hoặc không trùng câu giữa các thí sinh.
- Nhiều server, chuyển dự phòng hoặc cân bằng tải.
- Lưu nháp offline bền qua đóng toàn bộ app; gia hạn phòng chờ hoặc chuyển chủ phòng.

Không tự bổ sung các phần này để tìm điểm nâng cao. Mở rộng chỉ sau khi phần đã
cam kết hoạt động đúng và nhóm quyết định thay đổi phạm vi.

## 3. Thuật ngữ và quyền

### 3.1. Thuật ngữ

| Khái niệm | Nghĩa trong dự án |
| --- | --- |
| Ngân hàng câu hỏi | Kho chung trên server, chứa nội dung, lựa chọn, đáp án đúng, chủ đề, độ khó và trạng thái sử dụng. |
| Cấu hình phòng | Điều kiện lấy câu và thời lượng; không phải danh sách câu do chủ phòng chọn thủ công. |
| Bản đề được gán | Bản cố định nội dung câu và lựa chọn của một lượt làm; server giữ dữ liệu đúng để chấm. |
| Bài làm/lượt làm | Đề được gán, người sở hữu, các lựa chọn đã lưu, thời hạn, trạng thái và kết quả. |
| Đáp án của thí sinh | Lựa chọn người thi gửi lên; khác với đáp án đúng dùng để chấm. |
| Đã lưu | Server xác nhận lựa chọn đã được lưu thành công; không chỉ là UI đã đổi hoặc client đã gửi byte. |
| Đã nộp | Server đã chốt bài; không đồng nghĩa kết quả phòng được công bố ngay. |
| Phiên và kết nối | Phiên nhận diện người dùng; kết nối là đường truyền hiện tại. Mất kết nối không tự tạo một bài mới. |

### 3.2. Vai trò

| Vai trò | Quyền |
| --- | --- |
| Chưa đăng nhập | Đăng ký và đăng nhập; không truy cập dữ liệu thi cần xác thực. |
| Người dùng đã đăng nhập | Xem phòng, tạo/tham gia phòng hợp lệ, luyện tập và xem dữ liệu cá nhân theo quyền. |
| Chủ phòng | Quyền điều khiển trên phòng do mình tạo: cấu hình trước thi, bắt đầu và kết thúc sớm. |
| Thí sinh của phòng | Nhận đề của mình, lưu/đổi đáp án khi hợp lệ, nộp và xem kết quả được phép. |
| Admin | Quản lý ngân hàng câu hỏi; tài khoản được thiết lập trước, không tự cấp qua đăng ký thường. |

Chủ phòng và thí sinh là vai trò theo từng phòng. Người dùng thông thường tạo phòng
không vì thế trở thành admin hoặc được đọc đáp án đúng. Admin vốn có quyền quản trị
ngân hàng, nên hệ thống không cam kết giấu nội dung ngân hàng khỏi admin.

Quyền xem kết quả đã thống nhất: người thi xem kết quả của mình; chủ phòng xem bảng
kết quả thành viên trong phòng mình sau khi phòng kết thúc. Admin không mặc nhiên
được cấp chức năng đọc mọi bài làm trong phạm vi phiên bản đầu.

## 4. Các quy tắc bất biến

1. Server quyết định quyền, thời hạn, trạng thái bài và kết quả chấm.
2. Mỗi thí sinh có đề ngẫu nhiên riêng theo cùng cấu hình phòng. Đề khác nhau là
   khả năng của phép chọn ngẫu nhiên, không phải cam kết không bao giờ trùng.
3. Không lặp câu trong cùng một đề. Không giới hạn việc một câu xuất hiện ở đề
   của nhiều thí sinh; không cần nhân số câu trong kho với số thí sinh.
4. Đề đã gán giữ cố định; sửa/ngừng sử dụng câu trong ngân hàng không thay đổi đề
   cũ hoặc cách chấm đề cũ.
5. Payload đề thi đang làm không chứa đáp án đúng hoặc dữ liệu chấm bí mật.
6. Chỉ người sở hữu bài được gửi lựa chọn cho bài đó và phải còn quyền làm bài.
7. Đáp án chỉ được UI đánh dấu đã lưu sau phản hồi thành công từ server.
8. Không sửa bài đã chốt. Retry yêu cầu cũ không ghi đè lựa chọn mới hoặc tạo kết
   quả chấm cuối cùng lần thứ hai.
9. Các thí sinh cùng phòng có chung thời điểm kết thúc. Đến muộn do mạng hoặc
   reconnect không được cộng lại thời gian.
10. Mất kết nối không dừng thời gian. Server vẫn chốt bài đến hạn dù client vắng mặt.
11. Chỉ các đáp án đã được server xác nhận lưu mới được bảo đảm khôi phục. Nếu mất
    phản hồi thì trạng thái ở client còn chưa chắc chắn, cần đối chiếu server.
12. Nộp sớm không kết thúc bài của người khác. Kết quả thi phòng chỉ công bố khi
    phòng kết thúc; lịch sử và biểu đồ không được mở đường vòng xem điểm sớm.
13. Luyện tập công bố kết quả sau khi bài cá nhân được chốt, không đợi phòng.
14. Một người chỉ ở một phòng chưa kết thúc hoặc một lượt luyện tập đang làm.
    Nộp sớm vẫn thuộc phòng và phải đợi phòng kết thúc trước khi tạo/tham gia
    phòng khác hoặc bắt đầu luyện tập. Mất mạng/đăng xuất không bỏ giới hạn này.
15. Phòng WAITING hết hạn đúng 30 phút từ lúc tạo, không reset/gia hạn khi cấu
    hình, join, mất mạng hoặc reconnect. Hủy hợp lệ hoặc hết hạn chuyển CANCELLED,
    giải phóng reservations; không tạo attempt hoặc điểm.

## 5. Luồng tài khoản và ngân hàng

### UC-01. Đăng ký, đăng nhập, đăng xuất

1. Người dùng đăng ký; server kiểm tra dữ liệu và tên đăng nhập trùng.
2. Hệ thống trả thành công hoặc lý do từ chối có thể hiểu được.
3. Người dùng đăng nhập; server xác thực và tạo phiên, UI vào màn chính.
4. Yêu cầu tiếp theo được kiểm tra theo phiên và quyền trên server.
5. Đăng xuất làm phiên mất hiệu lực. Dữ liệu bài đã lưu không bị xóa do đăng xuất.

Không ghi mật khẩu/token vào log. Chính sách thời hạn phiên, số kết nối của một tài
khoản và đăng xuất khi đang thi đã chốt ở D03; thời hạn cụ thể ở tài liệu 02/03. Băm mật khẩu, định dạng token và
quản lý khóa thuộc tài liệu kiến trúc/giao thức.

**C06 đã duyệt — logout tối thiểu:** khi người dùng xác nhận, dừng nhận thao tác
thi mới và dừng auto-resume phiên cũ. Nếu còn mạng thì gửi logout, đợi timeout
đã có. Có xác nhận server thì báo đã thu hồi; mất mạng/timeout thì xóa token
local, về màn login và báo chưa xác nhận thu hồi server. Đóng kết nối cũ, lần
login sau mở kết nối mới. Không tự queue logout nền, không nộp/rời phòng và không
hoàn tác các thao tác đã gửi. Callback cũ không cập nhật UI của người đăng nhập mới.

### UC-02. Admin bổ sung và cập nhật ngân hàng

1. Admin mở màn quản lý, chọn thêm câu hỏi.
2. Nhập nội dung, chủ đề, độ khó, các lựa chọn và một đáp án đúng.
3. Server kiểm tra quyền admin và dữ liệu, lưu rồi xác nhận.
4. Câu hợp lệ đang hoạt động có thể được chọn cho đề sinh về sau.
5. Admin có thể sửa hoặc ngừng sử dụng câu. Bản đề đã gán giữ nguyên.

Phiên bản đầu có câu trắc nghiệm văn bản, một lựa chọn đúng. **Đã duyệt D07:** mỗi
câu có bốn phương án; quản lý chủ đề qua danh sách do admin duy trì; chỉ cho chọn
chủ đề đang hoạt động. Độ khó gồm dễ, trung bình, khó.

Sửa một câu không được làm thay đổi số liệu chấm của các lượt đã có. Nếu thao tác
admin khiến kho không còn đủ câu, phòng chưa bắt đầu phải được kiểm tra lại khi
bắt đầu, dù cấu hình trước đó từng hợp lệ.

## 6. Luồng thi theo phòng

### UC-03. Xem danh sách và tạo phòng

1. Sau đăng nhập, người dùng xem tên/mã phòng, chủ phòng, số thành viên, cấu hình
   và trạng thái chưa bắt đầu/đang thi/đã kết thúc.
2. Người tạo phòng lấy danh sách chủ đề và số câu đang khả dụng từng độ khó.
3. Chọn một chủ đề hoặc tất cả chủ đề, số câu từng độ khó và thời lượng.
4. Server kiểm tra cấu hình. Hợp lệ thì tạo phòng chưa bắt đầu và gắn chủ phòng;
   không hợp lệ thì trả lỗi để điều chỉnh, không tạo phòng dở dang.

Ví dụ: chủ đề TCP/UDP, 4 dễ + 5 trung bình + 3 khó, thời lượng 15 phút. Tổng 12 câu.
Kho cần ít nhất 4 câu dễ, 5 trung bình, 3 khó đang dùng được thuộc chủ đề đó.
Chọn tất cả chủ đề không có nghĩa phải chia đều số câu cho từng chủ đề.

**Đã duyệt D01:** chủ phòng tự là một thành viên thi khi tạo phòng; tổng sức chứa
50 thí sinh bao gồm chủ phòng nếu người đó thi. Người dùng không cần thao tác
tham gia lại phòng mình tạo.

### UC-04. Tham gia phòng chờ

1. Người dùng chọn phòng chưa bắt đầu và gửi yêu cầu tham gia.
2. Server kiểm tra phiên, trạng thái phòng, sức chứa và thành viên trùng.
3. Thành công thì UI chuyển sang phòng chờ, hiển thị cấu hình và danh sách thành viên.
4. Tham gia lại không được thêm trùng. Phòng đang thi/đã kết thúc từ chối thành viên mới.
5. Chủ phòng và các thành viên thấy danh sách thành viên phòng mình: tên hiển
   thị, định danh phân biệt và trạng thái kết nối theo server. Tham gia/rời hoặc
   phát hiện mất/kết nối lại thì cập nhật danh sách; mất mạng không xóa thành viên.
   Trạng thái mất kết nối có thể cập nhật sau thời gian phát hiện lỗi/heartbeat,
   không cam kết phát hiện tức thì.
6. Khi phòng RUNNING/ENDED/CANCELLED, danh sách phòng vẫn hiển thị trạng thái nhưng không
   cho người mới tham gia. Server kiểm tra trạng thái khi xử lý, không chỉ khóa nút UI.
7. Thành viên đã được giữ trong phòng trước lúc bắt đầu được kết nối lại để lấy
   bài đã gán, dùng deadline chung. Đây là khôi phục thành viên cũ, không phải
   tham gia mới; không sinh lại đề hoặc cộng thời gian.

**Đã duyệt D02:** trước khi chủ phòng bắt đầu thi, thành viên thường được chủ động
bấm Rời phòng. Server xóa người đó khỏi danh sách thành viên, cập nhật phòng chờ;
người đã rời không được gán bài khi phòng bắt đầu. Có thể tham gia lại nếu phòng
vẫn chưa bắt đầu và còn chỗ.

Sau khi bắt đầu thi, server từ chối yêu cầu rời phòng; UI không còn nút Rời phòng.
Người thi muốn kết thúc bài dùng Nộp bài. Chủ phòng không có nút Rời phòng,
không chuyển quyền; chủ có nút Hủy phòng chỉ khi WAITING, theo C01 mới được duyệt.

Đóng app hoặc mất mạng không phải chủ động rời phòng: thành viên vẫn được giữ lại
và có thể kết nối lại. Chủ phòng mất mạng vẫn giữ quyền sở hữu; phòng chờ không tự
bắt đầu. Nếu yêu cầu rời và bắt đầu đến gần nhau, server xét theo trạng thái lúc
xử lý: rời được chấp nhận trước thì không gán bài; đã bắt đầu thì từ chối rời.

### UC-04b. Hủy và hết hạn phòng chờ — C01/C02 đã duyệt

1. Phòng có hạn chờ cố định: thời điểm tạo + 30 phút (1.800 giây). UI hiển thị
   thời gian chờ còn lại; không có gia hạn hoặc chuyển chủ trong bản đầu.
2. Chủ có thể yêu cầu hủy khi WAITING và còn hạn. Server kiểm tra quyền, chuyển
   CANCELLED, ghi lý do/thời điểm và giải phóng chỗ mọi thành viên trong một
   transaction; giữ thông tin phòng/thành viên để xem trạng thái, không xóa lịch sử.
3. Hết hạn mà chưa bắt đầu: server tự hủy với lý do hết hạn chờ, kể cả chủ đang
   online hoặc toàn bộ client offline. Không đợi một client gửi lệnh.
4. Sau commit, thông báo cho các thành viên online. Thành viên offline lấy trạng
   thái mới khi quay lại; được tạo/tham gia phòng khác hoặc bắt đầu luyện tập.
5. Phòng CANCELLED không mở lại, không có đề/bài/điểm và không đưa vào lịch sử
   bài làm/biểu đồ điểm. Muốn tổ chức lại thì tạo phòng mới.

Ví dụ: tạo 09:00 thì hết hạn chờ 09:30. Bắt đầu thành công trước hạn, ví dụ
09:25, thì timer chờ không còn áp dụng; thời lượng thi chạy theo cấu hình riêng.
Mất mạng hoặc đóng app không tự hủy phòng trước 09:30. Nếu server đã tắt rồi
khởi động lại, không cấp lại 30 phút: kiểm tra mốc hết hạn đã lưu trước phục vụ.

Server xử lý start/cancel/join theo thứ tự nghiệp vụ và kiểm tra hạn chờ. Từ
mốc hết hạn không nhận start/join/config mới; không vì callback timer đến muộn
mà cho bắt đầu phòng quá hạn. Start đã được chấp nhận hợp lệ và commit RUNNING
thì không bị timer chờ cũ hủy. Nếu start rollback, phòng vẫn chờ hoặc bị hủy
theo hạn hiện hành. Chi tiết boundary kỹ thuật không thay quyết định xét hạn
thi theo C07, đã chốt trong đặc tả giao thức.

### UC-05. Bắt đầu, sinh đề và phát đề

1. Chủ phòng yêu cầu bắt đầu. Server kiểm tra quyền, trạng thái và cấu hình/kho hiện tại.
2. Server xác định tập thí sinh của lượt thi và chọn đề riêng cho từng người.
3. Với mỗi người, chọn ngẫu nhiên đủ từng độ khó trong phạm vi chủ đề, không lặp
   câu trong đề; lưu bản đề, dữ liệu chấm và bài làm riêng.
4. Chỉ khi chuẩn bị thành công cho tập thí sinh, server chốt thời điểm bắt đầu,
   thời điểm kết thúc chung và chuyển phòng sang đang thi.
5. Sau commit, server thông báo phòng bắt đầu; ứng dụng tự lấy trạng thái, ID bài
   của chính người dùng và các trang đề qua client C. Server trả đề riêng cùng
   thông tin thời hạn; UI chuyển sang màn làm bài, không yêu cầu người dùng tự refresh.

Không gửi một đề chung cho cả phòng như bản sheet trước kickoff. Không gửi đáp án
đúng xuống client khi phát đề. Chọn ngẫu nhiên không yêu cầu đảo phương án; nếu
bổ sung đảo phương án thì phải đặc tả ánh xạ chấm trong tài liệu dữ liệu/giao thức.

**Đã duyệt D04:** phòng cần ít nhất một thành viên thi; thành viên còn trong phòng
chờ nhưng đang mất mạng vẫn được gán bài và chung deadline. Chuẩn bị đề thất bại
thì phòng còn chưa bắt đầu, không để một phần thí sinh đã thi còn phần khác chưa có bài.
Sau khi đã bắt đầu, lỗi phát tới một client được xử lý bằng khôi phục, không quay
lùi trạng thái cả phòng hoặc gia hạn riêng.

### UC-06. Chọn, sửa và lưu đáp án

1. Người thi chọn phương án; UI hiển thị đang lưu và gửi lựa chọn cho bài/câu tương ứng.
2. Server kiểm tra phiên, sở hữu bài, câu thuộc đề, phương án hợp lệ, bài chưa chốt
   và còn hạn.
3. Lưu thành công thì server phản hồi; UI đánh dấu đã lưu đúng lựa chọn được xác nhận.
4. Đổi phương án thực hiện cùng luồng. Lựa chọn cũ hoặc phản hồi đến muộn không
   được làm UI/server quay về một lựa chọn lỗi thời.
5. Lỗi hoặc mất phản hồi thì UI hiển thị chưa xác nhận; không báo đã lưu giả.

Tiến trình hiển thị số câu đã có lựa chọn được server lưu, không tự hiểu mọi thao tác
click đều đã lưu. Chi tiết revision, request ID và retry thuộc đặc tả giao thức.

### UC-07. Nộp sớm, hết giờ, kết thúc sớm

Nộp sớm:

1. Người thi bấm nộp và xác nhận ý định nộp.
2. Client bảo đảm quy tắc đáp án đang chờ lưu ở D05, rồi yêu cầu server chốt.
3. Server kiểm tra, khóa thay đổi, chấm bằng bản đề và lựa chọn đã lưu, lưu kết quả.
4. UI nhận xác nhận đã nộp; không được làm tiếp. Nếu phòng chưa kết thúc thì chưa
   công bố điểm, đáp án đúng hoặc biểu đồ chứa điểm bài này.

Hết giờ hoặc chủ phòng kết thúc sớm:

1. Server nhận biết đã đến hạn hoặc nhận lệnh kết thúc sớm đúng quyền.
2. Ngừng chấp nhận thay đổi và chốt các bài còn mở; không chờ client gửi lệnh nộp.
3. Các bài đã nộp trước giữ nguyên kết quả. Chấm/lưu các bài còn lại và kết thúc phòng.
4. Công bố kết quả theo quyền; client mất mạng xem lại sau khi xác thực.

**Đã duyệt D06:** nếu mọi người nộp sớm, phòng vẫn đang thi cho đến deadline hoặc
chủ phòng kết thúc sớm. Không tự động thêm một quy tắc kết thúc phòng khác.

Điểm hiển thị theo số câu đúng/tổng câu. **Đã duyệt D07:** mỗi câu cùng trọng số,
điểm thang 10 = 10 × số đúng / tổng câu, hiển thị hai chữ số thập phân; chưa trả lời
tính sai, không trừ điểm câu sai. Lưu số đúng/tổng câu để không phụ thuộc điểm đã làm tròn.

## 7. Khôi phục và các tình huống kết nối

### UC-08. Mất mạng rồi tiếp tục bài

1. UI phát hiện vấn đề kết nối và báo không bảo đảm lưu các lựa chọn chưa xác nhận.
2. Client kết nối lại; server xác thực trước khi cho truy cập phiên/bài.
3. Server trả đúng đề đã gán, các lựa chọn đã lưu, trạng thái và deadline hiện hành.
4. Nếu còn hạn và chưa chốt, UI tiếp tục bài. Nếu đã chốt, UI khóa sửa; kết quả
   chỉ hiển thị khi điều kiện công bố được đáp ứng.
5. Thay thế kết nối không được để kết nối cũ tiếp tục có quyền thao tác trái chính sách.

Không sinh đề mới, tạo bài trùng hoặc cộng thời gian. Đồng hồ đếm ngược trên UI chỉ
để hiển thị. Lựa chọn chưa xác nhận cần đối chiếu trạng thái server, không tự gửi đè
toàn bộ bản cục bộ lên bài đã khôi phục.

**C03 đã duyệt:** bảo đảm khôi phục dữ liệu server đã lưu, không phải mọi lựa
chọn tạm trên máy. Khi mất phản hồi, có thể server đã commit nên phải đối chiếu,
không kết luận chắc chắn mất dữ liệu. Main/client còn sống có thể giữ pending
RAM để xử lý theo giao thức; đóng toàn bộ app có thể mất draft/pending local.
Mở lại phải đăng nhập/lấy trạng thái server, không làm thêm durable offline queue.
C05 đã duyệt: chỉ reload renderer thì main giữ các yêu cầu đã nhận còn PENDING/UNKNOWN
trong RAM, giao diện mới đọc lại qua preload và đồng bộ trước sửa tiếp. Không
cam kết giữ mọi click/draft chưa gửi. C04: khi instance server đổi thì dừng tự
replay W cũ, yêu cầu login/sync; không coi đó là mất dữ liệu hoặc mở rộng recovery crash.

Chủ phòng mất mạng trong lúc phòng đang thi không làm phòng dừng; server vẫn quản
lý deadline và chốt bài. Sau đăng nhập lại, chủ phòng lấy lại trạng thái phòng theo quyền.

### Các tình huống khác cần xử lý

| Tình huống | Kết quả mong đợi |
| --- | --- |
| Mất phản hồi sau lưu/nộp | Client có thể đối chiếu hoặc gửi lại theo giao thức; dữ liệu không bị áp dụng sai hai lần. |
| Một client không đọc hoặc gửi dở | Hệ thống giới hạn tài nguyên/timeout theo thiết kế; các client hợp lệ còn lại tiếp tục được phục vụ. |
| Sửa giờ trên client | Không kéo dài thời hạn hoặc làm thay đổi kết quả server. |
| Server không truy cập được | UI báo chưa có xác nhận, không suy diễn đã lưu/đã nộp thành công. |
| Client C thoát/cầu nối UI đóng | UI báo lỗi kết nối, không tiếp tục báo thành công giả; phục hồi theo cơ chế được đặc tả sau. |
| Server crash/restart | Không cam kết tiếp tục bài đang thi ở phiên bản đầu; phải thông báo sự cố, không quảng bá như đã hỗ trợ. |

## 8. Luyện tập, kết quả và lịch sử

### UC-09. Luyện tập cá nhân

1. Người dùng đăng nhập, chọn chủ đề, số câu từng độ khó và thời lượng; chỉ được
   bắt đầu nếu không ở phòng WAITING/RUNNING và không có lượt luyện tập OPEN.
2. Server kiểm tra, sinh/lưu đề và đặt thời hạn riêng cho lượt luyện tập.
3. Người dùng làm bài, đổi đáp án và theo dõi trạng thái lưu như luồng thi.
4. Nộp sớm hoặc hết giờ thì server chốt/chấm. Kết quả được hiển thị ngay sau chốt.
5. Lưu lượt trong lịch sử, có thể khôi phục khi mất mạng theo cùng quy tắc.

Không có phòng chờ, chủ phòng hoặc deadline chung nhiều người. Hoàng Quân sở hữu
toàn bộ luồng này, tích hợp cơ chế hẹn giờ dùng chung do Minh Quân xây dựng.

### UC-10. Xem kết quả và lịch sử

- Người thi mở kết quả cá nhân của phòng đã kết thúc.
- Chủ phòng mở bảng kết quả các thành viên trong phòng mình đã kết thúc.
- Người dùng xem lịch sử thi/luyện tập và biểu đồ điểm các lượt được công bố.
- Hiển thị số đúng/tổng câu, điểm, trạng thái kết thúc và thời điểm liên quan.
- Phòng còn đang thi chỉ cho biết bài đã nộp; không dùng lịch sử/biểu đồ để lộ điểm sớm.
- Người dùng không đọc được bài của người khác bằng cách sửa ID trên client.

**Đã duyệt D07:** chi tiết sau công bố gồm câu hỏi, lựa chọn của người dùng và trạng
thái đúng/sai, chưa cung cấp đáp án mẫu cho câu sai. Quyền xem đáp án mẫu là quyết
định riêng nếu nhóm muốn bổ sung; không mặc nhiên gửi khi truy vấn chi tiết.

## 9. Trạng thái phòng và bài làm

### 9.1. Phòng

| Trạng thái | Cho phép | Điều kiện chuyển |
| --- | --- | --- |
| Chưa bắt đầu (WAITING) | Tham gia/cấu hình/bắt đầu khi còn hạn chờ; thành viên thường được rời; chủ được hủy | Bắt đầu hợp lệ → RUNNING; chủ hủy hoặc hết 30 phút từ tạo → CANCELLED. |
| Đang thi | Làm bài hợp lệ, nộp, reconnect; chủ phòng kết thúc sớm | Deadline hoặc kết thúc sớm hợp lệ, chốt các bài → đã kết thúc. |
| Đã kết thúc | Xem kết quả theo quyền | Không mở lại cùng lượt thi; muốn thi lại tạo phòng mới. |
| Đã hủy (CANCELLED) | Xem trạng thái phòng theo quyền; mọi reservation đã giải phóng | Không mở lại, không có bài/điểm; tạo phòng mới nếu cần. |

Mất kết nối là thuộc tính kết nối, không phải trạng thái phòng. D02 đã sửa theo
C01/C02 để có CANCELLED; vẫn không chuyển chủ phòng hoặc gia hạn phòng chờ.

### 9.2. Bài thi và luyện tập

| Trạng thái nghiệp vụ | Ý nghĩa |
| --- | --- |
| Chưa có bài | Chưa được gán đề; phòng chờ không phải một lượt thi đang làm. |
| Đang làm | Đã gán đề và bắt đầu tính giờ; chỉ nhận thay đổi khi còn hạn. |
| Đã chốt | Không sửa tiếp; có kết quả cuối cùng sau chấm/lưu thành công. |

Lý do chốt được lưu riêng: nộp sớm, hết giờ hoặc chủ phòng kết thúc sớm. Việc đã
chốt và việc được công bố kết quả là hai điều kiện khác nhau. Nếu chấm/lưu lỗi,
không trả thành công giả; trạng thái kỹ thuật để phục hồi sẽ nằm ở tài liệu dữ liệu.

## 10. Tiêu chí nghiệm thu

Các mã dưới đây dùng để liên kết với test và task sau này. Đây là tiêu chí dự kiến,
không đánh dấu là đã đạt. Các quyết định D01–D07 đã có quy tắc được nhóm xác nhận.

| Mã | Kiểm chứng | Kết quả bắt buộc |
| --- | --- | --- |
| AC-01 | Đăng ký hợp lệ/trùng, đăng nhập sai/đúng, đăng xuất | Phản hồi đúng; phiên đã đăng xuất không tiếp tục được dùng. |
| AC-02 | Người thường gửi yêu cầu quản trị; đọc/sửa bài người khác | Server từ chối, không chỉ ẩn nút UI. |
| AC-03 | Admin thêm/sửa/ngừng dùng câu rồi sinh đề | Câu được quản lý đúng quyền; đề cũ không đổi sau sửa kho. |
| AC-04 | Kho thiếu số câu từng độ khó; cấu hình sai | Từ chối rõ lý do; kiểm tra cả lúc tạo và lúc bắt đầu. |
| AC-05 | Tham gia phòng chờ, tham gia trùng, rời và tham gia lại; rời sát lúc bắt đầu; đóng app/mất mạng | Thành viên thường rời trước thi được xóa và không gán bài; vào lại chỉ khi còn chờ/còn chỗ. Đã bắt đầu thì từ chối rời/tham gia mới. Chủ phòng không có nút rời. Mất kết nối không xóa thành viên; chủ phòng thấy roster và trạng thái kết nối được cập nhật theo phát hiện server. Thành viên cũ reconnect khi RUNNING lấy đúng bài và thời gian còn lại; người mới bị từ chối dù gửi lệnh trực tiếp. |
| AC-06 | Phát đề cho nhiều thí sinh với 4 dễ, 5 trung bình, 3 khó | Mỗi người đủ 12 câu đúng cấu hình, không lặp nội bộ, lưu riêng; không yêu cầu các đề khác nhau tuyệt đối. |
| AC-07 | Admin sửa kho sau phát đề; thí sinh reconnect | Bản đề và dữ liệu chấm đã gán không đổi; payload thi không có đáp án đúng. |
| AC-08 | Hai người cùng trả lời/đổi đáp án; phản hồi chậm | Không lẫn bài, không ghi đè phiên bản mới bằng phiên bản cũ; trạng thái đã lưu đúng. |
| AC-09 | Nộp sớm, nộp lặp, hết giờ, kết thúc sớm | Chốt đúng các bài; mỗi bài có một kết quả cuối, không sửa được sau chốt. |
| AC-10 | Nộp khi lựa chọn cuối đang chờ lưu; yêu cầu sát deadline | Hành vi đúng D05, không làm rơi đáp án mà vẫn báo đã lưu/đã nộp đủ. |
| AC-11 | Ngắt mạng một thí sinh rồi nối lại trước/sau hạn | Lấy lại đúng bài/đáp án đã lưu, không reset giờ; thí sinh khác vẫn làm bài. |
| AC-12 | Chủ phòng mất mạng; chỉnh đồng hồ client | Phòng tiếp tục, server chốt đúng hạn; đồng hồ client không quyết định hạn. |
| AC-13 | Luyện tập nộp sớm/hết giờ, mất kết nối | Luồng độc lập, chấm/lưu đúng, dùng được cơ chế khôi phục. |
| AC-14 | Xem kết quả, lịch sử, biểu đồ trước/sau công bố | Đúng quyền, không lộ điểm sớm, dữ liệu khớp số đúng/tổng câu đã lưu. |
| AC-15 | Ít nhất hai người trên hai máy LAN | Thao tác được từ giao diện qua client/server C; trả lời và nộp độc lập. |
| AC-16 | 50 thí sinh hoạt động đồng thời | Hoàn tất nhận đề, lưu/đổi đáp án, nộp và nhận kết quả đúng; không mất/lẫn dữ liệu đã xác nhận. |
| AC-17 | Một client chậm/ngừng đọc/gửi thiếu trong khi các client khác thi | Giới hạn tài nguyên và xử lý lỗi có hiệu lực, các client khác tiếp tục hoạt động. |
| AC-18 | Truy vết một yêu cầu bị lỗi hoặc gửi lại | Log đủ liên kết sự kiện và kết quả xử lý, không chứa mật khẩu/token. |
| AC-19 | Tạo/tham gia phòng hoặc bắt đầu luyện tập khi đã có hoạt động; thử lại sau nộp sớm, rời phòng chờ, kết thúc phòng/chốt luyện tập | Server từ chối hoạt động thứ hai cả sau mất mạng/đăng nhập lại; nộp sớm vẫn chờ phòng ENDED. Thành viên thường rời WAITING, phòng ENDED/CANCELLED hoặc luyện tập FINALIZED thì được bắt đầu lượt mới. Không gán hai bài từ hai phòng chờ. |
| AC-20 | Chủ hủy phòng chờ, hủy lặp, người thường hủy; cancel/start đua nhau | Chỉ chủ được hủy WAITING; CANCELLED giải phóng đúng room reservations, không có attempt/điểm. RUNNING không bị cancel. |
| AC-21 | Chờ 30 phút, sửa cấu hình/reconnect sát hạn, client offline, startup lại | Không gia hạn; quá hạn không join/start/config, tự CANCELLED sau commit, không cấp lại 30 phút khi startup. Timer chờ cũ không hủy phòng đã RUNNING. |
| AC-22 | Mất ACK lưu rồi sync; đóng toàn app trước/sau lưu | Dữ liệu đã commit lấy lại đúng từ server, không reset giờ; không hứa phục hồi draft chưa lưu và không báo thành công giả. |
| AC-23 | Server instance đổi khi W cũ chưa rõ; dataset mới có ID trùng | Không tự replay W từ instance cũ; login/sync, không giả định reset/mất dữ liệu, K07 vẫn áp dụng. |
| AC-24 | Renderer reload lúc save đang chờ hoặc mất ACK | Main giữ pending đã tiếp nhận, UI đọc lại/đồng bộ trước sửa; không báo lưu giả hoặc spawn C/TCP trùng. |
| AC-25 | Logout có/mất ACK, offline, sau đó user khác login | Dừng auto-resume phiên cũ, xóa token/đóng connection sau kết thúc logout; thông báo mức xác nhận đúng, không tự nộp/rời hoặc lộ pending/callback user cũ. |
| AC-26 | Save/submit sát hạn, queue/validation/BEGIN chậm, commit qua hạn, retry sau hạn | Một mốc xét hạn theo C07; chỉ write được nhận trước hạn và commit thành công được công nhận; replay receipt không bị từ chối vì hết giờ. |
| AC-27 | DB mới, tạo admin offline, trùng tên, đăng ký USER và mở bank UI | Không mật khẩu cứng/log/argv, không tự nâng quyền; admin tạo và đăng nhập được để quản lý ngân hàng. |
| AC-28 | Config thiếu/sai/khóa lạ, chạy từ thư mục khác | Lỗi dừng trước listen, mặc định nhất quán, DB/log resolve theo thư mục config; không tự reset DB. |
| AC-29 | Ngưỡng gần đầy và lỗi ghi DB thực sự khi có ca đang thi | Chặn đúng thao tác nhận mới; giữ lưu/nộp/chốt/rời-hủy khi DB còn ghi được; không purge/ACK giả hoặc đổi deadline. |
| AC-30 | Cùng request đi qua main/C/server: thiếu/null/sai kiểu/khóa lạ, danh sách nhiều trang | Cùng tập input hợp lệ theo C09, mặc định tường minh, cursor đúng và không lộ dữ liệu ngoài quyền. |

AC-16 cần bot mô phỏng hành vi thí sinh, không chỉ giữ socket rỗng. Ngoài tình huống
50 người cùng phòng, cần kiểm tra nhiều phòng/luyện tập cùng tồn tại. Ghi cấu hình
máy, dữ liệu đề, kiểu tải, độ trễ theo thao tác, tỷ lệ lỗi, CPU/RAM và lưu lượng.
Giới hạn số câu/kích thước message, ngưỡng độ trễ và thời gian chạy thử sẽ được đề
xuất ở tài liệu 4, duyệt trước khi đo để tránh chọn tiêu chí theo kết quả đã chạy.

## 11. Ranh giới trách nhiệm đã giữ nguyên

| Phần | Nguyễn Minh Quân | Đặng Hoàng Quân |
| --- | --- | --- |
| Nghiệp vụ | Tài khoản, phiên/quyền, tạo/liệt kê/tham gia phòng, điều phối bắt đầu/kết thúc, deadline | Ngân hàng/admin câu hỏi, sinh/lưu/phát đề riêng, lưu/đổi đáp án, nộp/chốt/chấm, luyện tập, kết quả/lịch sử/biểu đồ |
| Tầng C | Kết nối, poll(), luồng nhận và framing | Luồng gửi, queue, partial send và sự kiện |
| Khôi phục | Phát hiện mất kết nối, xác thực lại, gắn phiên và vô hiệu kết nối cũ | Đồng bộ bài/đề/lựa chọn, xử lý retry và tránh ghi đè/chốt trùng |

Mỗi người làm UI, client C, server C transport, nghiệp vụ TypeScript, dữ liệu,
log và test thuộc chức năng được giao.
C12: màu/layout/component dùng chung cùng thống nhất và chia task; A chủ trì
driver/scheduler/report kiểm thử tải, B behavior/seed/oracle. Không giao toàn bộ
giao diện nền cho một người; core A/B giữ nguyên.
Một vòng lặp I/O chung tích hợp hai phần; không tạo hai module tranh đọc/ghi cùng socket.

Các điểm giao nhau:

- Minh Quân xử lý cấu hình phòng; Hoàng Quân cung cấp thống kê kho và kiểm tra nguồn câu.
- Minh Quân điều phối bắt đầu; Hoàng Quân chuẩn bị đề/bài và phát tới từng thí sinh.
- Minh Quân cung cấp cơ chế hẹn giờ và tín hiệu kết thúc; Hoàng Quân chốt/chấm/lưu.
- Minh Quân khôi phục phiên; Hoàng Quân khôi phục bài thuộc phiên đã xác thực.
- Cả hai thống nhất giao thức, tích hợp cầu nối, tính tài nguyên và đo tải. Người
  chủ trì từng đầu việc chung được ghi cụ thể ở tài liệu 5, không mặc định chia đôi điểm.

### Làm rõ C07 và C10 — đã duyệt ngày 03/11/2026

- C07 áp dụng chung thi và luyện tập: queue/validation/BEGIN đi qua hạn thì không
  nhận save/submit mới. Write được xét hợp lệ trước hạn chỉ được báo thành công
  sau commit; commit lỗi không được báo đã lưu. Receipt cũ được tra sau kiểm tra
  quyền, trước điều kiện deadline/state, nên mất ACK không làm mất write đã lưu.
- Hết giờ đã chốt trả DEADLINE_EXCEEDED; chủ kết thúc sớm trả ATTEMPT_FINALIZED.
  Nộp sớm rồi không sửa được nữa; nộp lại trả trạng thái cũ, không chấm lại.
  Hết giờ nhưng DB chốt chưa thành công trả FINALIZATION_PENDING, khóa sửa và
  chưa công bố kết quả. Chi tiết thứ tự kiểm tra ở tài liệu 03 §10.4.
- C10: admin đầu tiên tạo bằng tiện ích offline khi server dừng, mật khẩu nhập
  tương tác không hiển thị và lưu hash. Trùng tên thì từ chối, không tự nâng quyền.
  Đăng ký công khai chỉ tạo USER. Không thêm UI quản trị tài khoản trong bước này.
- Cấu hình JSON được kiểm tra trước listen, sai thì dừng và chỉ rõ trường; đường
  dẫn tương đối tính từ thư mục file config. Trường bắt buộc và mặc định được ghi
  tại [hợp đồng cấu hình](../config/README.md), không thêm parser ở bước tài liệu.

### C08/C09 — chất lượng chức năng hiện có, duyệt ngày 03/11/2026

- Khi gần đầy DB/ledger hoặc thiếu dung lượng dự phòng, tạm chặn đăng ký, sửa
  ngân hàng, tạo/cấu hình/tham gia/bắt đầu phòng và bắt đầu luyện tập. Người đang
  thi vẫn được lưu/nộp; host end, timer chốt và rời/hủy phòng chờ vẫn được xử lý
  khi DB còn ghi được. Đọc, login/resume/logout, heartbeat và replay vẫn có thể
  dùng trong các hạn mức thường lệ; không có cam kết bỏ qua lỗi DB/quyền/timeout.
- UI hiển thị RESOURCE_LIMIT khi bị chặn nhận hoạt động mới; không tự xóa lịch sử
  hay receipt. Nếu ghi DB thực sự lỗi thì báo lỗi/chưa rõ theo kết quả commit,
  không hiển thị đã lưu hoặc tự mở lại quyền sửa sau deadline.
- C09 thống nhất trường bắt buộc, optional/default/null, kiểu/giới hạn và cursor
  trong đặc tả. Dùng helper validation chung trước handler, không thêm thư viện
  JSON tự viết hoặc framework sinh mã. Quyền thực tế vẫn do server kiểm tra.

## 12. Quyết định nghiệp vụ và trạng thái duyệt

Nhóm đã duyệt toàn bộ D01–D07. Nội dung đã duyệt là căn cứ nghiệp vụ;
các tham số kỹ thuật được đặc tả ở tài liệu sau.

| Mã | Câu hỏi và trạng thái | Quy tắc | Ảnh hưởng |
| --- | --- | --- | --- |
| D01 | **Đã duyệt.** Chủ phòng có thi, giới hạn bao nhiêu người? | Tự tham gia và thi; sức chứa mỗi phòng 50 thí sinh. Mục tiêu hệ thống là 50 người hoạt động đồng thời, không phải cam kết 50 phòng × 50 người. | Thành viên, phân quyền, số bài cần sinh. |
| D02 | **Đã duyệt.** Rời phòng chờ khác mất kết nối thế nào? | Thành viên thường được bấm Rời phòng trước thi: xóa thành viên, không gán bài; được tham gia lại nếu còn chờ/còn chỗ. Sau bắt đầu không được rời, muốn kết thúc bài dùng Nộp bài. Chủ không có nút rời/chuyển chủ nhưng được hủy phòng WAITING; phòng chờ tự hủy sau 30 phút từ tạo, không gia hạn. CANCELLED giải phóng mọi reservation, không tạo bài/điểm. Mất mạng/đóng app không tự hủy trước hạn; hết hạn áp dụng dù chủ online. Sau RUNNING dùng kết thúc sớm, không cancel. | Vòng đời phòng, danh sách thành viên. |
| D03 | **Đã duyệt.** Một tài khoản có bao nhiêu phiên/bài đang làm? | Một kết nối có quyền thao tác tại một thời điểm. Resume thay thế kết nối cũ. Đăng nhập mới làm mất hiệu lực phiên cũ. Mỗi tài khoản chỉ ở một phòng WAITING/RUNNING hoặc một lượt luyện tập OPEN; không tạo/tham gia phòng khác hoặc bắt đầu luyện tập khi còn hoạt động đó. Nộp sớm vẫn chờ phòng ENDED mới bắt đầu lượt khác. Thành viên thường rời WAITING hoặc phòng CANCELLED thì được giải phóng; luyện tập chốt xong thì được bắt đầu lượt mới. Đăng xuất không tự nộp, đồng hồ tiếp tục; đăng nhập lại có thể khôi phục. TTL và thời hạn resume theo tài liệu 02/03, không làm gián đoạn bài còn hạn. | Tài khoản, reconnect, UI, luyện tập. |
| D04 | **Đã duyệt.** Ai được gán bài khi bắt đầu? | Tất cả thành viên còn trong phòng chờ, kể cả đang mất mạng; ít nhất một thành viên thi. Chuẩn bị thành công toàn bộ trước chuyển trạng thái. | Sinh đề và xử lý lỗi bắt đầu. |
| D05 | **Đã duyệt.** Bấm nộp khi còn đáp án chờ lưu, và xét hạn theo mốc nào? | UI ngừng nhận sửa mới khi xác nhận nộp, đợi các lựa chọn hiện tại được xác nhận lưu rồi yêu cầu chốt. Nếu chưa xác nhận thì báo đang xử lý/chưa rõ kết quả, đối chiếu server; không tự báo nộp đủ. Server lấy mốc monotonic xét hạn sau kiểm tra yêu cầu/tra receipt và ngay trước mutation mới trong transaction; chỉ nhận khi mốc này nhỏ hơn deadline. Commit hợp lệ có thể hoàn tất sau hạn; từ hạn trở đi không nhận thay đổi mới. Retry thao tác đã commit trả receipt cũ. Không bảo đảm click trước hạn nhưng đến server muộn vẫn được tính. | Mất phản hồi, thứ tự lưu/nộp, test sát giờ. |
| D06 | **Đã duyệt.** Mọi người nộp sớm có tự kết thúc phòng? | Không; chờ chủ phòng kết thúc hoặc deadline. | Thời điểm công bố kết quả. |
| D07 | **Đã duyệt.** Dữ liệu câu hỏi, điểm và chi tiết sau thi? | Bốn phương án, một đáp án đúng, ba độ khó; admin duy trì chủ đề; trọng số câu bằng nhau, thang 10, hai chữ số thập phân. Sau công bố hiện lựa chọn và đúng/sai, chưa mở đáp án mẫu câu sai. | Form admin, dữ liệu, chấm, kết quả. |

Tài liệu v1.8 chốt phạm vi và quy tắc nghiệp vụ. Thiết kế kỹ thuật cụ thể theo
tài liệu 02/03/04 và sổ quyết định: V01 đã chốt không thêm CRC32 bản đầu;
timeout, frame, phiên và schema SQLite đã có đặc tả/baseline. Không coi các lựa
chọn đó là thầy đã chỉ định chỉ từ ví dụ góp ý; trạng thái kiểm chứng theo từng tài liệu.

## 13. Lịch sử thay đổi

| Phiên bản | Nội dung |
| --- | --- |
| v0.1 | Tạo bản dự thảo từ quyết định nhóm và góp ý kickoff: mục tiêu 50 thí sinh, đề ngẫu nhiên riêng, admin quản lý ngân hàng, ba cơ chế mạng thuộc chất lượng triển khai. Đánh dấu D01–D07 chưa duyệt. |
| v0.2 | Nhóm duyệt D01 và D03–D07; giữ D02 chờ giải thích, chưa chốt hành vi rời phòng. Xác nhận mất mạng có thể tiếp tục khi bài còn hạn/chưa chốt, khôi phục đáp án server đã lưu. |
| v1.0 | Nhóm duyệt D02: thành viên thường được rời trước thi; sau bắt đầu dùng nộp bài; chủ phòng không có nút rời/chuyển chủ/hủy. Phân biệt chủ động rời với mất kết nối. Đồng bộ FR-05, UC-04, trạng thái phòng và AC-05. |
| v1.1 | Nhóm duyệt K05 trong kiến trúc: làm rõ D03 giới hạn một phòng chưa kết thúc hoặc một lượt luyện tập OPEN, nộp sớm vẫn chờ phòng kết thúc. Bổ sung bất biến 14, điều kiện luyện tập và AC-19. |
| v1.2 | Nhóm xác nhận khóa thành viên mới sau bắt đầu, thành viên cũ reconnect dùng đề/deadline cũ; làm rõ danh sách thành viên và trạng thái kết nối trong phòng chờ, bổ sung AC-05. |
| v1.3 | Ngày 02/11/2026 nhóm chốt C01–C03: chủ hủy WAITING, tự hủy sau 30 phút cố định, CANCELLED giải phóng mọi reservation/không bài/điểm; khôi phục từ server, không durable offline draft. Cập nhật D02/D03, UC/state/AC-20..22; làm rõ câu điều kiện luyện tập theo D03. |
| v1.4 | Ngày 02/11/2026 duyệt C04–C06 tối thiểu: fence instance cho pending, pending RAM qua renderer reload và logout online/offline; thêm AC-23..25. C07–C10/nhóm 3 chưa chốt. |
| v1.5 | Ngày 03/11/2026 duyệt C07/C10: mốc xét hạn và lỗi thống nhất, admin offline/config startup, AC-26..28; C08/C09 và nhóm 3 chưa chốt. |
| v1.6 | Ngày 03/11/2026 duyệt C08/C09: ưu tiên ca hiện hữu khi gần đầy, hợp đồng input/cursor dùng chung, AC-29/30; nhóm 3 chưa chốt. |
| v1.7 | C11/C12 duyệt ngày 03/11/2026: chuẩn hóa kiểm thử tải và phần chung, UI cùng làm theo chức năng; không đổi nghiệp vụ/core. |
| v1.8 | M01 ngày 15/11/2026 chuyển backend nghiệp vụ/SQLite sang TypeScript, TCP C và luồng người dùng theo các quyết định đã chốt. |
