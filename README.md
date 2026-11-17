# Online Exam System

Ứng dụng desktop thi trắc nghiệm qua LAN của nhóm 4, môn Thực hành lập trình mạng.
Mục tiêu thiết kế và kiểm chứng: tối thiểu 50 thí sinh hoạt động đồng thời trên một server.

## Thành viên

| Thành viên | MSSV |
| --- | --- |
| Nguyễn Minh Quân | 20235816 |
| Đặng Hoàng Quân | 20235813 |

## Tài liệu

1. [Yêu cầu và luồng nghiệp vụ](docs/01-requirements-and-business-flows.md) — v1.8, đã duyệt phạm vi và các quyết định nghiệp vụ D01–D07.
2. [Kiến trúc và dữ liệu](docs/02-architecture-and-data.md) — v2.0, M01 dùng C transport và Node business process, pipe BP, SQLite/phiên/deadline trong Node.
3. [Đặc tả giao thức](docs/03-protocol-specification.md) — v0.8, hoàn thiện IPC/NET, framing, lệnh/sự kiện, FSM, lỗi, retry/reconnect; tham số mới là baseline đề xuất.
4. [Quy mô và kiểm chứng](docs/04-capacity-and-validation.md) — v0.7, workload 50 thí sinh, RAM/disk/bandwidth, bot/oracle, LT-01..LT-15 và cách đo; chưa nghiệm thu.
5. [Kế hoạch triển khai và phân công](docs/05-implementation-plan-and-task-allocation.md) — v0.7, module/interface, chủ trì phần chung, M0–M7 và tiêu chí hoàn thành; chưa gán lịch thiếu căn cứ.

Bộ năm tài liệu đã được soạn làm nền tảng. Các quyết định đã chốt được phân biệt
với thông số đề xuất và kết quả đo. Repo hiện đã có scaffold build C/desktop,
business workspace TypeScript build được, socket và handlers ở các mốc tích hợp tiếp theo.

[Review toàn diện thiết kế](docs/research/comprehensive-design-review.md) ghi rõ
các điểm cần xử lý trước triển khai: phòng chờ bị bỏ, pending mutation qua server
restart, IPC recovery, deadline/admission và phân công phần chung. Nhóm 1 C01–C03 đã chốt ngày 02/11/2026: chủ hủy WAITING, phòng chờ tự hủy
sau 30 phút từ tạo và khôi phục từ server, không durable offline draft.
C04–C06 tối thiểu đã chốt: instance fence, pending RAM qua reload và logout
online/offline. C07/C10 đã chốt ngày 03/11/2026: boundary xét hạn, admin offline
và config startup. C08/C09 đã chốt: ưu tiên ca hiện hữu khi gần đầy, schema/validator
và cursor thống nhất. C11/C12 đã chốt: lịch tải/số mẫu rõ, A driver/report,
B behavior/oracle, giao diện cả hai cùng làm theo chức năng. M01 đã chốt chuyển
nghiệp vụ sang TypeScript ngày 15/11/2026, xem
[sổ quyết định sau review](docs/research/review-decisions.md).

[Review chéo 5 tài liệu và các con số](docs/research/five-document-consistency-review.md)
ghi chỉnh lý ngày 17/11, tính lại người dùng/kết nối/RAM/lưu lượng và các điểm
cần khóa trước loader/DB wrapper; chưa có nghiệm thu ứng dụng 50 người.

## Thiết lập và chạy

Quản lý FR, task và hai sprint theo
[workflow Jira](docs/planning/jira-workflow.md) và
[mẫu description](docs/planning/task-template.md), tham khảo flow ai-staffing.
Sprint 1 đã nhập Jira; nhóm xác nhận đã kiểm import, sắp Rank và đồng bộ tên task.
Xem [quy tắc đặt tên](docs/planning/ticket-naming.md) và workflow để gán assignee A/B.
[Backlog Jira](docs/planning/backlog.md) hiện đã có 65 ticket nguồn/4 Epic,
description hai sprint, coverage/dependencies/ước lượng và công cụ kiểm offline;
44 task S1 đã nhập, 21 task S2 còn ở nguồn tài liệu. Phần S1 vượt capacity tuần
dự kiến được ghi rõ để theo dõi và dự báo tiến độ.
Task đã [chia nhỏ theo mẫu tham khảo](docs/planning/backlog-refinement.md),
estimate hiện tại2–4h và đầy đủ đầu vào/bước thực hiện/tình huống/bàn giao.
[Review FR và hai sprint](docs/planning/fr-sprint-review.md) đối chiếu coverage,
phân công A/B, dependency và capacity 4–5 giờ/người/ngày trước khi soạn ticket.
[Kế hoạch hai sprint](docs/planning/sprint-plan.md) có sprint goal, lịch A/B
theo mốc tương đối; nhóm chọn review Sprint 1 sau 7–8 ngày. Ngày bắt đầu/kết thúc
thực tế được nhập trên Jira; lịch không phải cam kết mọi candidate đều hoàn thành.

Mô tả task đã chuyển sang tên thành viên và nêu cách review; chạy
[update Sprint 1](docs/planning/jira-workflow.md#11-cập-nhật-mô-tả-tên-thành-viên-và-cách-review)
để đồng bộ nội dung trên Jira sau lượt đổi tên trước.

Khi nhận task và làm PR, theo [workflow Jira–GitHub](docs/development/git-workflow.md):
branch/commit/PR có key SCRUM thật, người còn lại review và kiểm đúng phạm vi.

Đọc [hướng dẫn môi trường/build](docs/development/setup.md) trước. Từ repo root,
sau khi có Node 24.15.0/npm 11, CMake ≥3.24, C compiler/make và libsodium-dev:

```sh
npm ci
npm run setup:desktop
npm run check
npm run dev
```

Native C:

```sh
cmake --preset dev
cmake --build --preset dev --parallel
ctest --preset dev
./build/dev/bin/exam-client --version
./build/dev/bin/exam-server --version
```

CMake tải cJSON pin checksum, libsodium từ package manager. SQLite dùng module
node:sqlite của Node 24.15.0 trong apps/business.
Hai binary mới kiểm chứng build/dependency, chưa mở socket/DB hoặc đọc config.
Electron hiện mở desktop shell, chưa spawn client C. Config mẫu ở `config/` là
chuẩn bị cho mốc sau; không có `--config` ở binary hiện tại.

Stack M01 ngày 15/11/2026 gồm React/TypeScript/Electron, client C và server C TCP,
Node TypeScript nghiệp vụ/SQLite. Electron–client C và server C–Node đều dùng pipe
riêng. Node dùng node:sqlite và node:crypto, C dùng cJSON/libsodium cho transport.
Khởi động Node và giao thức BP sẽ được triển khai M1/M2.

```sh
npm run typecheck:business
npm run check:business
```

Business --version in Node/SQLite vào stderr. Đầu vào foundation là --version,
M1/M2 sẽ thêm pipe server và migration. Sơ đồ/ownership theo tài liệu 02/05.


## Nghiên cứu tính khả thi

[Review trước triển khai ngày 17/11](docs/research/pre-implementation-review.md)
đối chiếu barem gốc, góp ý và bài giảng. V01 đã chốt giữ length + JSON, không thêm CRC32 bản đầu; còn V03 giới hạn
config trước loader. Các kết quả runtime vẫn chờ triển khai và kiểm chứng.

[Đối chiếu góp ý sau kickoff](docs/research/post-kickoff-review.md) tổng hợp từng
góp ý của thầy, vị trí đã cập nhật, người phụ trách và bằng chứng còn phải chạy.
Ba cơ chế reliability thuộc phạm vi triển khai hiện tại, không tính là ba gói
nâng cao riêng; mục tiêu 50 người vẫn chờ nghiệm thu trên ứng dụng thực.

[Báo cáo kiến trúc cho 50 thí sinh](docs/research/architecture-feasibility.md) có
nguồn kỹ thuật, phân tích điểm nghẽn và kết quả thử thành phần lặp ba lượt.
Các công cụ trong `tools/` là probe độc lập, không phải code ứng dụng hoặc bằng
chứng nghiệm thu 50 thí sinh trên LAN. Các probe giữ nguyên và không thay thế kiểm chứng ứng dụng.

[Tài liệu lớp và đối chiếu project](docs/research/course-material-reference.md) giúp liên hệ socket/C, poll, nonblocking, pthread và thiết kế giao thức với nội dung đã học.
