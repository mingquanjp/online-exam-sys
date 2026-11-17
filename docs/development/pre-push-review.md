# Review trước khi push tài liệu và scaffold


## Review hiện hành — 18/11/2026

Phạm vi: 89 file candidate của Git (tracked và untracked không bị ignore),
khoảng 1,1 MB tại lúc quét. Không có stage/commit/push hoặc ghi Jira trong lượt
review này. Các báo cáo ngày 01/11 và 15/11 bên dưới là lịch sử.

### Kết quả

| Kiểm tra | Kết quả ngày 18/11 |
| --- | --- |
| `npm run check` | PASS: typecheck, build production desktop và business. |
| `npm run check:business` | PASS: Node 24.15.0, SQLite 3.51.3. |
| CMake configure/build + CTest dev | PASS: cJSON 1.7.19, libsodium 1.0.22; 2/2 smoke checks. |
| Regression Jira | PASS 11 test: Rank, tên, xung đột và chạy lại sau mất phản hồi; dùng Jira giả. |
| Backlog/offline import | PASS: 65 task, 4 Epic, 101 cạnh không vòng; S1 44 task/54 cạnh; tên và Rank offline đạt. |
| File hygiene | Không thấy build/dependency/DB/log/journal Jira trong candidate; không file trên 5 MiB. |
| Secret scan | Không thấy private key, token GitHub/npm/Atlassian, AWS access key, URL chứa credential hoặc npm auth setting theo các mẫu đã quét. Không bảo đảm phát hiện mọi bí mật. |
| JSON/Python/Markdown | JSON parse, Python syntax, local link và cặp fence đạt; diff không lỗi whitespace. |
| `npm audit --omit=dev` | 0 advisory trong dependency production tại thời điểm chạy. |
| `npm audit` đầy đủ | 5 cảnh báo high: picomatch và 4 package chịu ảnh hưởng qua cây dependency build. Chi tiết bên dưới. |

### Điểm đã sửa

- README, đầu trang backlog, Sprint 1 tickets, sprint plan và Jira workflow đã
  nhận trạng thái nhập/Rank/đổi tên do nhóm xác nhận. Goal S1 dùng câu đã chốt;
  mốc review 7–8 ngày phân biệt với bảng lịch tương đối ban đầu.
- Bỏ đường dẫn máy cá nhân khỏi tham chiếu repo ai-staffing.
- Thêm ignore SQLite rollback journal (`*.db-journal`, `*.sqlite-journal`,
  `*.sqlite3-journal`) ngoài WAL/SHM đã có.
- Giữ phần thân description S1 nguyên snapshot nhập để không làm importer
  báo drift chỉ vì chỉnh câu trạng thái lịch sử. Footer “chưa có key SCRUM”
  được giải thích tại đầu file. Không đổi AC/estimate/owner/dependency.

### Bổ sung workflow sau review cùng ngày

Đã thêm AGENTS.md, docs/development/git-workflow.md và PR template, đồng thời
nối từ README/Jira workflow theo flow tham khảo ai-staffing. Sau bổ sung có
92 candidate file; kiểm link/fence, JSON/Python syntax, secret patterns, ignore
và `git diff --check` đều đạt. Đợt bổ sung chỉ sửa tài liệu/template, không đổi
code/dependency; không chạy lại runtime chỉ cho thay đổi này. Chưa cấu hình hoặc
xác minh kết nối GitHub–Jira, CI, hook hay branch protection; chưa commit/push.

### Cập nhật description và review cùng ngày

Đã đổi tên hiển thị của hai thành viên trong 65 Task, thêm cách review và công
cụ update cho 44 Task S1 đã nhập. Giữ alias nội bộ A/B và label để bảo toàn
mapping; không đổi accountId hay assignee. Nội dung đã khác snapshot ban đầu,
nên cần chạy update theo workflow Jira §11 trước khi importer check nguồn mới.
Đã kiểm 17 regression test Jira (fake), backlog/capacity/dependencies và mode
offline; chưa gọi Jira thật trong lượt cập nhật. Thông tin giữ nguyên description
ở mục review ban đầu bên trên mô tả giai đoạn trước lần cập nhật này.

### Advisory còn theo dõi

`npm audit` báo GHSA-fc5q-39xc-vjpf ở `picomatch@4.0.7`: ReDoS khi nhận glob
được tạo đặc biệt. Năm mục high là picomatch, fdir, tinyglobby, vite và
@vitejs/plugin-react; không phải năm lỗi gốc độc lập.
[GitHub advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) tại lúc
kiểm ghi **chưa có bản vá**. Npm registry chưa có picomatch 4.0.8. Không chạy
`audit fix --force` hoặc tự hạ major Vite/plugin-react theo gợi ý audit.

Các package này thuộc devDependency của desktop. Trong scaffold hiện tại,
renderer và business không có API nhận glob từ thí sinh; Vite dev server đã
bind 127.0.0.1. Đây là nhận định theo code hiện có, không phải bảo đảm mọi
đường khai thác đã được loại trừ. Giữ dev server cục bộ, không đưa glob không
tin cậy vào cấu hình build; kiểm lại advisory trước khi cập nhật dependency
hoặc đóng gói. Chưa thể ghi toàn bộ dependency là sạch advisory.

### Bàn giao

Bộ tài liệu/scaffold có thể đưa lên GitHub để hai thành viên bắt đầu làm việc,
kèm cảnh báo dev dependency nêu trên. Không có nghiệm thu Linux, clean clone
trên máy Hoàng Quân, UI runtime mới hoặc tải ứng dụng 50 người trong lượt này.
Kết quả UI runtime cũ giữ ở foundation-verification.md. Runtime nghiệp vụ và
socket vẫn chưa triển khai; không gọi scaffold là sản phẩm thi hoàn chỉnh.

Chưa commit các file hiện tại. Kiểm danh sách staged khi tự commit; không
force-add thư mục ignore, đặc biệt `.local/` chứa journal import/Rank Jira.

---

## Báo cáo lịch sử

Cập nhật baseline ngày 15/11/2026 theo M01. Tài liệu 02 v2.0 và 03 §18 mô tả
C transport với Node TypeScript nghiệp vụ. Các kết quả có ngày trước M01 bên dưới
là lịch sử theo phiên bản đã ghi. Trạng thái build mới ở setup và sổ quyết định.


Ngày: 01/11/2026. Phạm vi: các file source/config/tài liệu không bị Git ignore;
không review nội dung vendor/generated như code do nhóm tự viết.

## Kết luận

Chưa phát hiện vấn đề cần chặn việc đưa **bộ tài liệu và scaffold nền tảng** lên
GitHub trong phạm vi kiểm tra này. Không coi đây là nghiệm thu ứng dụng thi hoặc
khả năng phục vụ 50 người. Chưa stage, commit hay push trong lượt review.

Review sâu tiếp theo về nghiệp vụ/giao thức đã có tại
[comprehensive design review](../research/comprehensive-design-review.md): ghi
nhận 2 điểm P1 và các khoảng trống cần làm rõ trước triển khai module liên quan.
Kết luận scaffold/build ở đây không đồng nghĩa toàn bộ thiết kế đã hết mâu thuẫn
hoặc đủ rõ để code độc lập; đọc hai báo cáo theo đúng phạm vi.

## Tên tài liệu

Đổi tên 5 file, giữ nội dung tiếng Việt và cập nhật tham chiếu trong README,
tài liệu và module README:

- `01-requirements-and-business-flows.md`
- `02-architecture-and-data.md`
- `03-protocol-specification.md`
- `04-capacity-and-validation.md`
- `05-implementation-plan-and-task-allocation.md`

Không còn tham chiếu tới 5 tên cũ trong các file Git có thể nhận vào.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| npm run check | PASS: typecheck và production build desktop. |
| cmake --preset dev, build, ctest | PASS trên macOS/Apple Clang; CMake 4.4.5, libsodium 1.0.22; 2/2 smoke checks. |
| npm audit | 0 advisory trong lockfile tại thời điểm kiểm tra; không chạy audit fix. Không phải audit dependency C hoặc bảo đảm không có lỗ hổng chưa được công bố. |
| JSON/Markdown | JSON parse hợp lệ, local links tồn tại, fences khép kín; git diff --check đạt. |
| Tệp có thể đưa vào Git | Không có node_modules, build tree, desktop out, DB/log hoặc binary lớn trong danh sách candidate. |
| Credential patterns | Không thấy private key, GitHub token, AWS access key, URL chứa credential hoặc npm auth token theo các mẫu đã quét. Không phải công cụ bảo đảm phát hiện mọi dạng bí mật. |
| Tính di động | Không thấy đường dẫn /Users/... hoặc /var/folders/... trong candidate; lockfile tải từ registry.npmjs.org. |
| Electron boundary | Main/preload/renderer tách riêng; sandbox/contextIsolation bật, nodeIntegration tắt; bridge hiện chỉ xuất constant, chưa có generic IPC/shell API. |
| C dependency/build | SQLite/cJSON pin version+SHA-256; libsodium lấy từ môi trường, không link DB vào client C; không dùng dependency prefix tạm khi build hiện tại. |

## Giới hạn còn lại

- Chưa chạy Linux/GCC hoặc clean clone trên máy thành viên còn lại.
- Chưa có protocol/network/business handlers, migration, bot 50 thí sinh hoặc
  packaging. Các config JSON là mẫu chuẩn bị, chưa có runtime parser.
- Version dependency/giới hạn giao thức trong tài liệu cần kiểm chứng khi triển
  khai, không chuyển trạng thái thành đã chạy đạt chỉ vì scaffold build qua.
- Báo cáo runtime Electron chi tiết ở [foundation verification](foundation-verification.md).
  Lượt review này không thay đổi code Electron sau phép kiểm tra runtime đó.

Khi tự commit, xem diff/danh sách staged để bảo đảm chỉ có file dự định chia sẻ;
không dùng force-add các thư mục đang được ignore. Báo cáo này là ảnh chụp trạng
thái hiện tại, không tự áp dụng cho những thay đổi sau đó.
