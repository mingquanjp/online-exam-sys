# Mẫu task Jira cho nhóm 4

Mẫu áp dụng theo [workflow](jira-workflow.md). Chỉ giữ phần liên quan, viết đủ để
người nhận bắt đầu và người review nghiệm thu. Không copy mẫu với ô trống lên Jira.

Đã tham khảo lại cấu trúc `backend-organization-accounts-profile-tickets.md`
của ai-staffing theo yêu cầu nhóm: thêm điều kiện bắt đầu, các bước thực hiện,
bảng tình huống/kết quả và provider/consumer. Không kế thừa stack/quyền/commands dự án đó.

**Kích thước:** mỗi Task2–8h, ưu tiên2–4h với lịch4–5h/ngày. Nếu scope dự kiến
vượt8h, tách theo đầu ra kiểm chứng/bàn giao được; không task một hàm/file hoặc
review ticket lặp từng tầng. Lỗi độc lập vượt timebox có Bug liên kết và estimate
còn lại, không bỏ AC hoặc tự đánh Done để giữ giờ.

## Metadata

- Mã nội bộ / Jira key thật nếu đã tạo:
- Summary diễn đạt đầu ra:
- Epic / sprint dự kiến:
- Assignee / reviewer liên hệ / mức review theo ảnh hưởng:
- FR hỗ trợ / UC / AC / PT hoặc LT liên quan:
- Is blocked by / đầu ra cung cấp cho task nào:
- Estimate còn lại / giả định / phần đã có:

## Description

**Mục tiêu**

Sau task, ai dùng được đầu ra nào; đang thiếu hành vi gì.

**Nguồn và đầu vào**

Đường dẫn tài liệu + mục hợp đồng hiện hành; code/module có sẵn, interface đầu
vào và điều kiện môi trường. Dẫn FR/AC, không nhận hoàn tất FR nếu chỉ phủ một phần.

**Điều kiện bắt đầu**

Ghi provider và đầu ra thực cần nhận, trạng thái còn thiếu và consumer nhận sau.
Có thể viết trên contract/fixture trước, nghiệm thu tích hợp phải dùng provider thật.

**Phạm vi thực hiện**

Các bước tạo ra đầu ra, ranh giới module/ownership và phần UI/data/C/TS áp dụng.
Chỗ chưa chốt phải được giải quyết trước phần phụ thuộc, không tự chọn nghiệp vụ.

**Các bước thực hiện và vùng mã**

Liệt kê3–6 bước đủ cụ thể để bắt đầu và chỉ vùng mã liên quan. Tên file/test mới
là đầu ra dự kiến, không nói đã tồn tại. Không sao chép lại cả đặc tả hoặc tạo
framework tổng quát để thực hiện một use case.

**Hành vi và tình huống cần đạt**

| Tình huống | Kết quả mong đợi |
| --- | --- |
| Luồng chính cụ thể | Đầu ra quan sát/kiểm tra được. |
| Lỗi hoặc boundary quan trọng | Trạng thái, response hoặc cleanup đúng. |

**Tiêu chí hoàn thành**

- [ ] Đầu ra chạy thật và interface bàn giao đúng hợp đồng.
- [ ] Các tình huống trọng yếu được kiểm, không chỉ compile hoặc mock.
- [ ] Ghi lệnh/ca kiểm thực chạy, kết quả, môi trường, giới hạn và phần chưa kiểm.
- [ ] Tác giả giải thích được phần mình, mức review áp dụng đã hoàn thành và có bằng chứng tích hợp khi cần.

**Kiểm tra và bằng chứng**

Ghi ca kiểm áp dụng và cách chạy hiện có; tên lệnh/test chưa tồn tại phải ghi là
đầu ra sẽ bổ sung, không giả đã chạy. Đính kèm kết quả đã lọc secret, không raw
password/token/đáp án đúng của ngân hàng thật.

**Checkpoint hiểu code / bảo vệ**

Câu hỏi sát module: luồng gọi, buffer/ownership, syscall trả gì, state thay đổi
khi nào, tại sao thiết kế như vậy; một thí nghiệm có thể chạy để chứng minh.

**Đầu ra bàn giao và ngoài phạm vi**

Consumer nhận module/contract/bằng chứng nào; việc liên quan nằm ở task khác.

## Ví dụ nội dung: RX framing C

Đây là ví dụ cách viết, chưa là ticket đã gán sprint/estimate/Jira key.

**Summary:** Tách đúng thông điệp JSON từ luồng byte trong client/server C.

**Owner:** Minh Quân; Hoàng Quân review và dùng interface cho TX/integration.

**Truy vết:** hỗ trợ FR-08/09/13 và transport dùng chung; không nhận đã hoàn tất
ba FR. Nguồn: [03 §2/3](../03-protocol-specification.md); PT-01/02.

**Mục tiêu/phạm vi:** một bộ RX codec C dùng header uint32 BE length + payload
JSON, không CRC32; hỗ trợ feed nhiều chunk, xuất frame đủ byte và giữ phần dư.
Chốt interface/ownership với TX, kiểm length trước allocate; schema nghiệp vụ
Node nằm ngoài task, kiểm envelope/JSON theo phần contract đã giao trong backlog.

| Tình huống | Kết quả mong đợi |
| --- | --- |
| Header chia 1+3 byte, payload chia nhiều đoạn | Chỉ trả frame khi đủ, không mất byte. |
| Nhiều frame trong một chunk, còn header dở cuối chunk | Xuất đủ frame theo thứ tự, giữ phần dở. |
| UTF-8 nhiều byte | Length tính byte, không dùng số ký tự hoặc strlen trên dữ liệu nhận. |
| Length 0/1/65537 hoặc EOF giữa frame | Không dispatch frame dở, không cấp phát quá cap; caller có lỗi/cleanup rõ. |

**AC:** các tình huống trên có kiểm chứng module và bàn giao interface cho poll
loop; ghi rõ phần PT-02 JSON validation do task nào hoàn tất. Build qua không thay
bằng chứng framing. Không viết lại JSON parser hoặc thêm protocol riêng.

**Checkpoint:** vì sao recv không tương ứng một message; đọc header thiếu xử lý
ra sao; ai sở hữu frame sau callback; vì sao header 65537 phải bị từ chối trước
allocate; thí nghiệm chia/gộp frame chứng minh hành vi.

Ví dụ không tạo dependency/estimate giả và không nói socket/Node/UI đã hoạt động;
backlog đầy đủ phải bổ sung task consumer/integration và mapping các FR khác.
