# Làm việc với Jira, Git và pull request

Ngày áp dụng: 18/11/2026. Tham khảo `ai-staffing/docs/ai/workflow.md` và PR
template của repo đó, điều chỉnh cho nhóm hai người và stack C/TypeScript.
Jira quản lý phạm vi, assignee, phụ thuộc và tiến độ; GitHub quản lý code và review.
Nguồn nghiệp vụ/kiến trúc vẫn là [năm tài liệu đã chốt](../../README.md#tài-liệu).

## 1. Nhận task và bàn giao

1. Chọn task của mình theo Rank khi đầu vào đủ. Đọc AC, nguồn và Blocks;
   có thể chuẩn bị phần độc lập trên interface/fixture trước khi tích hợp thật.
2. Chuyển **In Progress** khi thực sự bắt đầu. Ghi ngắn mục tiêu, nguồn áp dụng,
   phạm vi và tiêu chí đạt trong trao đổi/task; không cần tạo thêm tài liệu cho
   mỗi sửa nhỏ. Không tự đổi nghiệp vụ hoặc các quyết định còn chờ chốt.
3. Kiểm `git status` trước khi tạo branch. Một branch/PR cho một đầu ra review
   được, thường là một ticket. Xuất phát từ `main` đã cập nhật khi working tree
   sạch; không mang thay đổi task trước sang task mới. Tạo nhánh trên working
   tree đang dirty không tự tách các file đó. Không tự stash/reset hoặc xóa file.
4. Triển khai và tự kiểm đúng phạm vi. Tác giả đọc hiểu code, đặc biệt syscall,
   buffer, state, timeout, retry và transaction thuộc phần mình bảo vệ.
5. Khi sẵn sàng, mở PR vào `main`, dùng template và gắn link Jira. Chọn mức
   review theo mục 1.1: phần cần review chéo thì A review B, B review A; phần
   rủi ro thấp có thể tự review. AI hỗ trợ, không là một human approval độc lập.
6. Chuyển **In Review** nếu board có trạng thái này; nếu không, giữ trạng thái
   đang làm và ghi link PR/chờ review, không tự tạo workflow Jira mới.
7. **Done** khi AC và kiểm tra phù hợp đạt, góp ý chặn đã xử lý, mức review
   áp dụng đã hoàn thành và thay đổi được merge vào `main`. Review có thể ghi
   trên PR nếu repo chưa có cơ chế required approval. Task review/demo dùng bằng chứng tương ứng;
   không bắt tạo PR rỗng cho một cuộc họp, còn evidence có thay đổi file thì qua PR.

Task phụ thuộc chỉ được nghiệm thu tích hợp sau khi nhận đầu ra thật; mock không
thay test tích hợp. Khi bị block, ghi nguyên nhân và đầu vào cần, chọn việc sẵn
sàng tiếp theo. Hai người có thể review/ghép interface sớm để tránh chờ đến cuối.
Nếu phải mở PR phụ thuộc PR khác, ghi rõ base/PR phụ thuộc, tích hợp provider
trước rồi đối chiếu lại consumer; không đánh Done khi chỉ mới ghép trên nhánh riêng.

### 1.1. Chọn mức review theo ảnh hưởng

Không dùng số dependency để quyết định review. T05 không có provider nhưng TX
ảnh hưởng mọi kết nối; nó vẫn cần review chéo. Một task sửa typo không có lý do
chờ người kia approve chỉ vì trường Reviewer đã ghi tên.

| Mức | Khi áp dụng | Cách hoàn thành |
| --- | --- | --- |
| Review chéo | Socket/RX/TX, protocol/interface, IPC/BP/lifecycle, timeout/retry; auth/quyền; transaction/schema/receipt; thời gian thi, lưu/nộp/chấm/công bố điểm; cấu hình bảo mật/dependency/build; UI thay đổi hành vi lưu/nộp/recovery; bot/oracle hoặc kết luận nghiệm thu | Người còn lại kiểm diff và ca/bằng chứng trọng yếu trước merge; tác giả giải thích được phần mình. Không cần hai người chạy lại mọi phép kiểm nếu evidence đủ. |
| Tự review | Typo, trình bày Markdown, link đúng đích đã biết; màu/khoảng cách/căn lề UI không đổi hành vi; sắp xếp evidence có sẵn không sửa số liệu hoặc kết luận | Tác giả kiểm diff, kiểm phù hợp và ghi “Tự review — thay đổi trình bày, không đổi contract/hành vi” cùng kết quả; không cần đợi người kia approve. |
| Không có thay đổi file | Họp review/retro, trao đổi bàn giao | Ghi kết quả/bằng chứng trong task; không tạo PR rỗng. Các file evidence nếu có vẫn áp dụng hai mức trên. |

Phần UI gồm logic làm bài và phần tài liệu chốt contract không mặc nhiên là rủi
ro thấp. PR có cả hai mức áp dụng review chéo; nếu chưa rõ ảnh hưởng thì nhờ người
kia xem trước merge. Có thể review interface hoặc một cụm thay đổi liên quan sớm,
không đợi mọi phần xong mới đọc toàn bộ từ đầu.

Reviewer A/B trong ticket là người liên hệ review khi cần, không tạo dependency
mới và không bắt mọi thao tác nhỏ phải có approval. Quy tắc này làm rõ cách
review; không bỏ AC hoặc yêu cầu hai người chốt một quyết định cụ thể (ví dụ V03).
Nếu GitHub đã có required review/check thì vẫn tuân thủ, không tự bỏ qua hoặc
đổi protection; tài liệu này không xác nhận repo đang có các rule đó.

### 1.2. Agent review PR theo phạm vi

Khi thành viên gửi link PR và nói “review PR này”, agent làm theo mục này và
AGENTS.md. Không cần copy lại prompt dài mỗi lần. Phạm vi mặc định là đánh giá
thay đổi và báo cáo; không tự chỉnh code, commit/push/merge, cập nhật Jira hoặc
đăng comment/review công khai lên GitHub. Nếu được giao thực hiện một trong các
việc đó rõ ràng thì làm đúng phạm vi được giao. Sửa góp ý là bước riêng sau review.

1. Xác định base/head đang review, mô tả PR, key Jira và ticket nguồn tương ứng.
   Đọc AC/ngoài phạm vi và đúng mục của tài liệu hiện hành. Dùng code phụ thuộc
   trực tiếp để kiểm tra ảnh hưởng tích hợp, không chỉ nhìn diff rời rạc.
2. Đánh giá đầu ra của ticket: hành vi, protocol/interface, ownership, transaction,
   thời gian/quyền hoặc ca lỗi liên quan. Không đòi PR nền hoàn thành chức năng
   consumer, UI, recovery hoặc toàn bộ tải 50 người đã giao cho ticket sau.
   Fixture được phép theo kế hoạch nhưng không chứng minh tích hợp đã đạt.
3. Tự kiểm/test khi phù hợp và khả dụng, không sửa source hay chạy lên dữ liệu
   thật để có kết quả. Phân biệt test thực chạy, evidence tác giả cung cấp và
   phần chưa xác minh. Nếu không đọc được Jira, dùng ticket nguồn đã mapping;
   thiếu hoặc lệch AC thì nêu giới hạn cụ thể, không tự phát minh yêu cầu.
4. Với lỗi cần sửa trước merge, nêu file/dòng hoặc bằng chứng cụ thể, điều kiện
   xảy ra, hệ quả, AC/contract liên quan hoặc hành vi sai quan sát được và hướng
   sửa nhỏ nhất. Lỗi runtime rõ ràng vẫn cần nêu dù AC không liệt kê từng bug.
5. Không đề xuất đổi stack, dependency, thiết kế tầng hoặc framework tổng quát
   để xử lý một ca nhỏ khi chưa có lỗi/nhu cầu trong phạm vi. Sở thích style,
   refactor và tối ưu giả định không là blocker. Nếu có gợi ý hữu ích, tách phần
   tùy chọn và nêu rõ không chặn merge; không tạo danh sách góp ý cho đủ mục.

Ví dụ: TX bỏ phần byte chưa gửi sau partial send là lỗi đúng phạm vi; đòi thêm
WebSocket hoặc chuyển framework để “dễ scale” không phải điều kiện nghiệm thu.
Sửa framing cần ca split/gộp và cap theo AC, không mặc nhiên cần chạy toàn bộ
LT-01..15. Lỗi nghiêm trọng có sẵn ngoài phạm vi thay đổi phải nêu riêng với bằng
chứng và mức ảnh hưởng; không giấu lỗi hoặc tự kéo cả phần sửa vào PR hiện tại.

Báo cáo ngắn theo nội dung thực có:

- **Lỗi cần sửa trước merge:** ưu tiên theo ảnh hưởng, không lặp cùng một nguyên
  nhân thành nhiều finding. Không có lỗi có bằng chứng thì ghi rõ không phát hiện.
- **Kiểm chứng/giới hạn:** nguồn, revision và test đã kiểm, điểm còn chưa xác minh;
  nêu thiếu evidence nào ngăn kết luận một AC quan trọng nếu có.
- **Gợi ý tùy chọn:** chỉ giữ khi hữu ích, không là điều kiện merge.

Người review đọc và cân nhắc findings, không chấp nhận mọi đề xuất của agent một
cách máy móc. Không có finding không có nghĩa toàn sản phẩm đã nghiệm thu hoặc
được phép bỏ human review/required checks đang áp dụng.

Quy tắc tự được nạp khi agent làm trong checkout có AGENTS.md và hỗ trợ đọc file
này. Sau khi commit/push, hai thành viên cập nhật checkout trước khi nhận task.
Một chat chỉ có URL PR mà không truy cập repo/hướng dẫn có thể không nạp quy tắc;
khi đó yêu cầu đọc AGENTS.md của repo trước. PR template nhắc quy tắc để dễ tìm.
Đây là hướng dẫn agent, không cài bot review, automation hoặc GitHub rules.

## 2. Tên branch, commit và PR

| Nơi | Quy ước | Ví dụ theo mapping S1 hiện có |
| --- | --- | --- |
| Feature, tài liệu, refactor, test | `feature/<JIRA-KEY>-<short-kebab-case>` | `feature/SCRUM-11-tcp-rx-framing` |
| Bug riêng | `bug/<JIRA-KEY>-<short-kebab-case>` | Dùng key Bug thật khi đã tạo; sửa góp ý trong task hiện tại giữ nguyên branch. |
| Commit | `<type>(<scope>): <imperative subject> [<JIRA-KEY>]` | `feat(transport): decode fragmented TCP frames [SCRUM-11]` |
| PR title | Cùng format commit, mô tả toàn bộ đầu ra cuối | `feat(transport): decode fragmented TCP frames [SCRUM-11]` |

Ví dụ thể hiện format, không khẳng định chức năng đã được triển khai. Mapping
đã đọc từ journal import: EXAM-T01 → SCRUM-9, EXAM-T03 → SCRUM-11,
EXAM-T05 → SCRUM-13. Đối chiếu ticket trên Jira trước khi dùng cho công việc khác.

- Branch slug, commit và PR title viết tiếng Anh. Subject dùng động từ nguyên
  thể, chữ đầu thường, không dấu chấm cuối. Commit body nếu cần cũng tiếng Anh.
- Type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`.
  Scope theo vùng sửa: `transport`, `client`, `server`, `bridge`, `auth`, `room`,
  `exam`, `database`, `desktop`, `load`, `jira`, `workflow`.
- Tiêu đề Jira vẫn theo [chuẩn tiếng Việt/module](../planning/ticket-naming.md).
  Không cần dịch nguyên văn tên Jira sang commit: commit mô tả thay đổi thực tế.
- Dùng key `SCRUM-xx` thật; EXAM-Txx/FR/Wxx là mã nguồn bổ sung, không thay key
  Jira trong branch/commit/PR. Không dùng key DATN hoặc site ai-staffing.
- Một task có thể có nhiều commit hợp lý. Không chia máy móc từng file; không
  gom toàn bộ Epic vào một PR. Nếu nhiều ticket tạo ra cùng một đầu ra, ghi đủ
  key và giải thích phạm vi trong PR. Không gán key không thuộc AC cho đẹp lịch sử.
- Việc chưa có ticket phù hợp có thể bỏ key, ví dụ
  `feature/project-foundation` và `chore(project): add project foundation`.
  Bộ tài liệu/scaffold/công cụ đang chưa commit thuộc bàn giao nền hiện có,
  không tự gắn hết vào SCRUM-9/T01 hoặc chuyển T01 Done vì push scaffold.
- Không đổi tên branch cũ hoặc viết lại lịch sử đã chia sẻ chỉ để đồng bộ format.
  Khi squash, giữ title/message cuối đúng key và phạm vi.

## 3. PR description

Dùng [template](../../.github/pull_request_template.md), viết tiếng Việt để cả
hai đọc và dùng chuẩn bị bảo vệ. Giữ ngắn theo độ lớn thay đổi:

Viết cho người review chưa đọc cuộc trò chuyện: mở đầu bằng vấn đề và kết quả
của PR. Dùng câu rõ nghĩa, chỉ giữ chi tiết giúp đánh giá thay đổi; số liệu/counter
chi tiết dẫn sang tài liệu khi cần. Khi sửa sau review, viết lại phần liên quan
theo trạng thái cuối, không nối thêm nhật ký “cập nhật ngày…”, lịch sử AI làm gì
hoặc lặp lại cùng thông tin ở nhiều mục. Giữ bằng chứng và giới hạn kiểm chứng
cần thiết; bỏ mục tùy chọn không có nội dung hữu ích.

- **What:** hành vi/đầu ra cuối và link Jira thật; thay đổi giải quyết vấn đề gì.
- **Why:** lý do và tác động; không chép lại lịch sử trao đổi hoặc toàn bộ ticket.
- **How:** chỉ giữ nếu lựa chọn kỹ thuật/ranh giới module cần được review.
- **Configuration:** config hoặc biến môi trường thay đổi, required/default và
  tài liệu chạy; không có thì ghi không thay đổi. Không đưa giá trị bí mật.
- **Developer Test:** lệnh/ca đã chạy, kết quả, môi trường; phần chưa kiểm rõ ràng.
  Network/DB cần ca lỗi/biên liên quan và bằng chứng thật, không chỉ build.
- **Limits:** chỉ giữ khi có giới hạn, phụ thuộc PR hoặc bước bàn giao đáng chú ý.

Thêm ảnh khi thay đổi UI đáng cần đối chiếu. Khi scope đổi trong lúc làm, sửa
lại title/description theo kết quả cuối. Evidence không có token/password thật,
đáp án đúng của ngân hàng thật hoặc dữ liệu cá nhân không cần thiết.

## 4. Liên kết Jira–GitHub

Đích: repo `mingquanjp/online-exam-sys`, project **SCRUM**, site
[ltm-project.atlassian.net](https://ltm-project.atlassian.net), board 1.
Ví dụ link task RX thật: [SCRUM-11](https://ltm-project.atlassian.net/browse/SCRUM-11).

Đưa key viết hoa vào branch, commit và PR title; description có link đầy đủ.
Sau khi mở PR, gắn URL PR vào ticket Jira. Không dùng `Closes #11` để chỉ
SCRUM-11: `#11` là số GitHub Issue/PR của repo. Không tạo GitHub Issue trùng task.

Theo [Atlassian](https://support.atlassian.com/jira-cloud-administration/docs/use-the-github-for-jira-app/),
GitHub development data liên kết bằng issue key khi tích hợp đã được cấu hình.
Tích hợp GitHub–Jira của site này **chưa được xác minh trong đợt tài liệu**.
Sau PR đầu, mở Development trong ticket để đối chiếu đúng repo/branch/PR. Nếu
chưa thấy, kiểm repo được kết nối, quyền và key; vẫn dùng link thủ công để review.
Mã key không tự cấp quyền hay bảo đảm tự chuyển trạng thái. Chưa cấu hình hoặc
xác minh automation, nên nhóm cập nhật trạng thái thủ công theo workflow thật.

## 5. Kiểm tra và quyền thực hiện

| Phạm vi sửa | Kiểm tra hiện có và bằng chứng cần bổ sung |
| --- | --- |
| Tài liệu | Đối chiếu nguồn/link và `git diff --check`. Nếu sửa ticket, chạy `python3 tools/jira/prepare_backlog.py`. |
| C | `cmake --preset dev`, `cmake --build --preset dev --parallel`, `ctest --preset dev`; thêm ca chức năng/lỗi theo AC khi triển khai. Hiện CTest chỉ có hai smoke test --version. |
| TypeScript/desktop/business | `npm run check`; business runtime nền có `npm run check:business`. Thay đổi UI cần thử luồng UI thực. |
| Công cụ Jira | `python3 -m unittest discover -s tools/jira -p 'test_*sprint1.py' -v` và các mode offline liên quan. Fake Jira không chứng minh API thật. |
| Network/DB/tải | Dùng ca theo ticket và 03/04; ghi command, run ID, môi trường và kết quả. Test ứng dụng chưa có phải được bổ sung, không lấy probe thành phần làm nghiệm thu 50 người. |

Chạy kiểm theo thay đổi; không bắt PR chỉ sửa câu chữ build toàn bộ app. Trước
commit, kiểm staged scope và `git diff --cached --check`; không force-add `.local/`,
config riêng, DB, dependency hoặc build output. Cảnh báo dependency đã biết xem
[review trước push](pre-push-review.md); không tự `audit fix --force` đổi stack.

Agent chỉ commit/push/mở PR/merge hoặc cập nhật Jira khi đã được người dùng giao;
việc giao sửa code không tự bao gồm xuất bản. Giữ thay đổi có sẵn và không chạy
migration/seed/reset dữ liệu thật từ task tài liệu. Không đọc `.env` để soạn PR.
Không bịa danh tính tác giả/reviewer hoặc attribution.

Flow này chưa cài hook/commitlint, CI, required checks hoặc branch protection;
không coi hướng dẫn là bằng chứng cấu hình GitHub đã bật. Không thêm các công
cụ đó chỉ để bắt đầu hai sprint.
