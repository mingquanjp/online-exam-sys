# S2 — Ticket nguồn cho Jira

Ngày cập nhật:17/11/2026. READY-TO-REVIEW; chưa nhập Jira, chưa triển khai runtime.

Thành viên: Nguyễn Minh Quân và Đặng Hoàng Quân. Reviewer là người liên hệ theo mức review của task. Ước lượng mỗi Task 2–8 h, bộ hiện tại ưu tiên 2–4 h; không phải cam kết task nào cũng xong trong một ngày. Đọc [backlog/capacity](backlog.md) và [lần chia nhỏ này](backlog-refinement.md). Mã tăng thêm giữ nguyên mã cũ để truy vết; thứ tự số không là lịch nối tiếp.

<a id="exam-t27"></a>

## EXAM-T27 — [C Client] Kết nối lại, khôi phục phiên và thay binding

- **Epic:** EXAM-E02
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T11, EXAM-T12
- **FR:** FR-01, FR-02, FR-10, FR-13
- **Acceptance refs:** AC-11, AC-23, AC-24, AC-25, PT-05, PT-18, PT-19, PT-20
- **Work packages:** W17

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** C nối lại/resume đúng authority và instance; main pending/logout context thuộc T62.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T11](sprint-1-tickets.md#exam-t11): Client C: connect/TCP heartbeat và mapping IPC–NET.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T49](sprint-1-tickets.md#exam-t49): C BP routing/credit: chuyển output đúng TCP và giải phóng một lần.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §6.1/7; 03 §9.2/9.4/10.5/18.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Backoff 0,5→10 s±20%, tối đa 2 phút, stream mới/hello/resume và snapshot auth theo instance. Server helper auth session có từ T12; giữ generation/epoch, dừng resume khi SESSION_REPLACED, không đấu giành phiên. Main reload/logout context chuyển T62.

**Các bước thực hiện:**

1. Backoff 0,5→10 s±20%, tối đa 2 phút, stream mới/hello/resume và snapshot auth theo instance.
2. Server helper auth session có từ T12.
3. giữ generation/epoch, dừng resume khi SESSION_REPLACED, không đấu giành phiên.
4. Main reload/logout context chuyển T62.

**Vùng mã dự kiến:** src/client và auth/session helper hiện có tại apps/business/src/auth. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Mất TCP trước deadline | nối/resume đúng user, không sinh activity/attempt mới hoặc reset giờ. |
| Login máy khác/close fd cũ/callback cũ | binding mới không bị thu hồi nhầm, output cũ không lộ user khác. |
| Server instance đổi hoặc token invalid | dừng resume/replay cũ và yêu cầu login/sync, UNKNOWN không bị báo rollback. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: C reconnect/resume: thay binding và giữ token/instance đúng.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T11](sprint-1-tickets.md#exam-t11), [EXAM-T12](sprint-1-tickets.md#exam-t12)
- Blocks: [EXAM-T36](sprint-2-tickets.md#exam-t36), [EXAM-T62](sprint-2-tickets.md#exam-t62)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Transport/auth recovery cho T62/T28; không durable draft hoặc server crash resume.

**Checkpoint bảo vệ:** Vì sao fd tái sử dụng cần generation? Resume mất response có thể dùng lại token ổn định thế nào?

**Truy vết nhập Jira:** `EXAM-T27`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t28"></a>

## EXAM-T28 — [Exam Recovery] Đồng bộ bài và xử lý thao tác chưa rõ kết quả sau reconnect

- **Epic:** EXAM-E03
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 4h
- **Depends on:** EXAM-T58, EXAM-T62
- **FR:** FR-08, FR-09, FR-10
- **Acceptance refs:** AC-10, AC-11, AC-22, AC-24, PT-06, PT-17, PT-19
- **Work packages:** W18

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** UI hiển thị đúng dữ liệu server đã lưu, xử lý save/submit UNKNOWN không ghi đè hoặc chấm lại mù.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T27](sprint-2-tickets.md#exam-t27): C reconnect/resume: thay binding và giữ token/instance đúng.
- [EXAM-T56](sprint-1-tickets.md#exam-t56): attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- [EXAM-T57](sprint-1-tickets.md#exam-t57): UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu.
- [EXAM-T58](sprint-1-tickets.md#exam-t58): UI nộp bài: xác nhận ý định, đợi save và xử lý kết quả chưa rõ.
- [EXAM-T62](sprint-2-tickets.md#exam-t62): Main pending/reload/logout: phục hồi context và chặn callback cũ.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-08; 03 §9.2/10.3–10.5; 04 LT-08. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Sync generation/attemptmeta/answers/items và pending main; operation.get/cùng op body, can retry rules và writable/intent. One page pending, receipts không snapshot mới. Không auto replay start/end/admin unknown, giữ xác nhận người dùng theo 03.

**Các bước thực hiện:**

1. Sync generation/attemptmeta/answers/items và pending main.
2. operation.get/cùng op body, can retry rules và writable/intent.
3. One page pending, receipts không snapshot mới.
4. Không auto replay start/end/admin unknown, giữ xác nhận người dùng theo 03.

**Vùng mã dự kiến:** apps/desktop/src/renderer/src và helper bài/pending theo interface main T62. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Commit mất ACK rồi reconnect | revision/đề/deadline cũ được khôi phục, local draft không tự đè server. |
| Late ACK/sync cũ khi state mới đã có | Late ACK/old sync/events while-sync không làm snapshot mới lùi; hết giờ hoặc finalized không mở sửa. |
| Submit/save UNKNOWN | Submit UNKNOWN và save UNKNOWN được reconcile đúng, op giữ nguyên, không sinh op mới để né kết quả cũ; đóng app không hứa giữ draft. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Reconcile bài thi/pending và UI tiếp tục sau mất phản hồi.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T58](sprint-1-tickets.md#exam-t58), [EXAM-T62](sprint-2-tickets.md#exam-t62)
- Blocks: [EXAM-T30](sprint-2-tickets.md#exam-t30), [EXAM-T65](sprint-2-tickets.md#exam-t65)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Recovery UI cho exam/practice và T38/T39; không ledger thứ hai hoặc durable offline queue.

**Checkpoint bảo vệ:** found=false có nghĩa save chưa được xử lý chắc chắn không? Vì sao sync mới cần generation riêng?

**Truy vết nhập Jira:** `EXAM-T28`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t29"></a>

## EXAM-T29 — [Admin UI] Quản lý chủ đề, câu hỏi và cập nhật ngân hàng

- **Epic:** EXAM-E03
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T13, EXAM-T16, EXAM-T54
- **FR:** FR-02, FR-03, FR-04
- **Acceptance refs:** AC-02, AC-03, AC-04, AC-27, PT-14
- **Work packages:** W19

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Admin có thể thêm/sửa/ngừng dùng câu từ app, không phải sửa SQLite tay.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T13](sprint-1-tickets.md#exam-t13): Màn đăng ký/đăng nhập/đăng xuất qua bridge thật.
- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- [EXAM-T16](sprint-1-tickets.md#exam-t16): CLI admin offline dùng khóa và hash chung.
- [EXAM-T50](sprint-1-tickets.md#exam-t50): Electron main/preload: spawn client C, API whitelist và pending registry.
- [EXAM-T54](sprint-1-tickets.md#exam-t54): Question APIs: list/thêm/sửa/ngừng dùng và version conflict.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-02/D07; 03 §7.2; 05 W19. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Form 4 options/1 correct/topic/difficulty/active, lists filter/cursor/byte budget, version conflict refresh/confirm new intent. Reuse primitives Hoàng Quân/Minh Quân, topic counts cho room config. UI không tự quyết định quyền, response bank key chỉ ADMIN.

**Các bước thực hiện:**

1. Form 4 options/1 correct/topic/difficulty/active, lists filter/cursor/byte budget, version conflict refresh/confirm new intent.
2. Reuse primitives Hoàng Quân/Minh Quân, topic counts cho room config.
3. UI không tự quyết định quyền, response bank key chỉ ADMIN.

**Vùng mã dự kiến:** apps/desktop/src/renderer/src: màn admin/ngân hàng; dùng API T15/T54. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Admin tạo/sửa/inactive từ UI | Tạo/sửa/inactive từ UI qua C/Node/DB và catalog phản ánh đúng; nonadmin gửi API trực tiếp bị từ chối. |
| Version cũ/validation/permission | Concurrent version conflict không tự ghi đè; thiếu/sai/null/max length hiển thị lỗi rõ. |
| Bank đổi khi có snapshot đã gán | Sửa kho đang có bài thi không đổi snapshot/chấm; 4 lựa chọn và key được lưu khớp. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Admin UI quản lý chủ đề/câu hỏi và cập nhật kho.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T16](sprint-1-tickets.md#exam-t16), [EXAM-T54](sprint-1-tickets.md#exam-t54)
- Blocks: [EXAM-T41](sprint-2-tickets.md#exam-t41)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Admin form/hướng dẫn cho T41 demo; không CSV/CRUD users/AI chấm bài.

**Checkpoint bảo vệ:** Ngừng topic có cần xóa câu/snapshot không? Vì sao UI ẩn nút chưa đủ phân quyền?

**Truy vết nhập Jira:** `EXAM-T29`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t30"></a>

## EXAM-T30 — [Practice] Triển khai luyện tập dùng chung luồng tạo đề, lưu và nộp bài

- **Epic:** EXAM-E03
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T28
- **FR:** FR-04, FR-08, FR-09, FR-11, FR-12
- **Acceptance refs:** AC-13, AC-14, AC-19, PT-09, PT-22
- **Work packages:** W20

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Người dùng không có activity bắt đầu một lượt practice có deadline riêng và xem điểm ngay khi chốt.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T14](sprint-1-tickets.md#exam-t14): Clock/timer/activity helpers dùng chung trước handler thi.
- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T28](sprint-2-tickets.md#exam-t28): Reconcile bài thi/pending và UI tiếp tục sau mất phản hồi.
- [EXAM-T56](sprint-1-tickets.md#exam-t56): attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- [EXAM-T57](sprint-1-tickets.md#exam-t57): UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu.
- [EXAM-T58](sprint-1-tickets.md#exam-t58): UI nộp bài: xác nhận ý định, đợi save và xử lý kết quả chưa rõ.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-09; 02 §9.6; 03 §7.3/13.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** practice.start/op/config/availability/snapshot, activity reserve và timer Minh Quân, practice UI reuse exam; result publication sau FINALIZED/release. Có thể làm happy-path trước T28, nghiệm thu recovery ghép sau T28.

**Các bước thực hiện:**

1. practice.start/op/config/availability/snapshot, activity reserve và timer Minh Quân, practice UI reuse exam.
2. result publication sau FINALIZED/release.
3. Có thể làm happy-path trước T28, nghiệm thu recovery ghép sau T28.

**Vùng mã dự kiến:** apps/business/src/domain, storage và apps/desktop/src/renderer/src: reuse engine luyện tập. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Người dùng còn activity | Không room giả/chủ phòng; đang ROOM kể cả nộp sớm không start practice; PRACTICE OPEN không join room khác. |
| Practice nộp/hết giờ hoặc retry start | Nộp sớm/hết giờ/retry start dùng đúng một attempt/deadline/key; commit finalize mới release/công bố. |
| Mất mạng và lấy lại bài | Mất mạng rồi lấy lại đúng bài/giờ qua T28; payload không key, errors/state dùng same engine. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Luyện tập cá nhân dùng chung engine đề/lưu/nộp.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T28](sprint-2-tickets.md#exam-t28)
- Blocks: [EXAM-T31](sprint-2-tickets.md#exam-t31), [EXAM-T38](sprint-2-tickets.md#exam-t38)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Practice UI/handler cho history và mixed load; không thêm loại câu hỏi/mode AI.

**Checkpoint bảo vệ:** Practice khác EXAM ở thời điểm công bố và giải phóng reservation thế nào?

**Truy vết nhập Jira:** `EXAM-T30`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t31"></a>

## EXAM-T31 — [Results UI] Hiển thị chi tiết kết quả, lịch sử và biểu đồ

- **Epic:** EXAM-E03
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T30, EXAM-T60
- **FR:** FR-02, FR-12
- **Acceptance refs:** AC-14, PT-09, PT-14
- **Work packages:** W21

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Người dùng xem các lượt thi/luyện tập của mình và xu hướng điểm, không lộ điểm sớm.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T22](sprint-1-tickets.md#exam-t22): Result APIs: kết quả cá nhân và bảng chủ phòng đúng quyền.
- [EXAM-T30](sprint-2-tickets.md#exam-t30): Luyện tập cá nhân dùng chung engine đề/lưu/nộp.
- [EXAM-T56](sprint-1-tickets.md#exam-t56): attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- [EXAM-T60](sprint-1-tickets.md#exam-t60): UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-10/D07; 02 §8.5; 03 §5/7.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** result.items/selected/is_correct và history.list keyset paging/PublishedResult; UI history/chart dùng cùng projection, nêu rõ chart phạm vi dữ liệu đã tải/phân trang. Tích hợp thêm lượt practice T30 khi có, không Block toàn history bởi practice.

**Các bước thực hiện:**

1. result.items/selected/is_correct và history.list keyset paging/PublishedResult.
2. UI history/chart dùng cùng projection, nêu rõ chart phạm vi dữ liệu đã tải/phân trang.
3. Tích hợp thêm lượt practice T30 khi có, không Block toàn history bởi practice.

**Vùng mã dự kiến:** apps/business/src/domain và apps/desktop/src/renderer/src: history/details/chart. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| EXAM nộp sớm chưa công bố | Bài EXAM nộp sớm khi phòng RUNNING không xuất hiện điểm ở mọi đường truy vấn; owner khác/ID đổi bị từ chối. |
| Chi tiết kết quả đúng quyền | Details hiển câu/lựa chọn/đúng sai, không correct_option cho câu sai; host chỉ bảng tổng room. |
| Lịch sử phân trang và chart | Cursor/trang cuối rỗng và điểm số khớp DB/halfup; chart không giả định trang đầu là toàn bộ lịch sử. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Chi tiết kết quả/lịch sử và biểu đồ từ dữ liệu đã công bố.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T30](sprint-2-tickets.md#exam-t30), [EXAM-T60](sprint-1-tickets.md#exam-t60)
- Blocks: [EXAM-T39](sprint-2-tickets.md#exam-t39)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** History/detail/chart UI cho T41; không endpoint chart mở quyền khác hoặc analytics dashboard.

**Checkpoint bảo vệ:** Tại sao history cần cùng publication filter với result.get? Keyset paging khác offset thế nào?

**Truy vết nhập Jira:** `EXAM-T31`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t32"></a>

## EXAM-T32 — [Load Test] Bổ sung lịch tải, barrier, metrics và báo cáo theo profile

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T23
- **FR:** FR-13
- **Acceptance refs:** AC-16, AC-18, LT-02, LT-03, LT-09
- **Work packages:** W23

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Đo tải có số mẫu đúng và không che độ chậm/lỗi bằng closed-loop hoặc percentile đẹp.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T23](sprint-1-tickets.md#exam-t23): Driver tải nhỏ và report skeleton để tích hợp từ S1.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §3.1/7/8; sprint-plan §3.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Schedule 180 slots/bot/900 s với phase seed, barrier≤100 ms, logical vs attempt latency/nearest-rank; clocks/correlation C/BP/Node/commit; sample CPU/RSS/disk/NIC 1 s+queue peak. Bổ sung load commands/options/run report từ configs S/M và groups 49/50/30-10-10, không thay script thành sản phẩm Node TCP.

**Các bước thực hiện:**

1. Schedule 180 slots/bot/900 s với phase seed, barrier≤100 ms, logical vs attempt latency/nearest-rank.
2. clocks/correlation C/BP/Node/commit.
3. sample CPU/RSS/disk/NIC 1 s+queue peak.
4. Bổ sung load commands/options/run report từ configs S/M và groups 49/50/30-10-10, không thay script thành sản phẩm Node TCP.

**Vùng mã dự kiến:** tools/load, metrics hooks tại src/server/transport và apps/business/src/bridge theo ownership Minh Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Lịch logical slots theo profile | Expected 9000/8820/5400-1800-1800, missed slot/scheduling lag/timeout/BUSY/UNKNOWN được đếm, không catch-up ngầm. |
| Retry/burst/submit/drain | Logical first send→ACK bao retry; burst tách steady, submit ca riêng; warmup/drain không tăng count steady. |
| Report và percentile fixtures | Fixture latency/error counter xác minh summary/PASS gates; report ghi build/config/seed/máy thật, không prewrite PASS. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Driver đầy đủ: lịch slot/barrier/metrics và report các profile.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T23](sprint-1-tickets.md#exam-t23)
- Blocks: [EXAM-T36](sprint-2-tickets.md#exam-t36), [EXAM-T38](sprint-2-tickets.md#exam-t38), [EXAM-T64](sprint-2-tickets.md#exam-t64), [EXAM-T65](sprint-2-tickets.md#exam-t65)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Harness/report cho T36/T38; behavior/oracle full T33, không đòi chart/admin xong mới chạy load.

**Checkpoint bảo vệ:** Closed-loop có che tải khi server chậm không? Một timeout có được bỏ khỏi pass/fail vì không có latency thành công không?

**Truy vết nhập Jira:** `EXAM-T32`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t33"></a>

## EXAM-T33 — [Load Test] Hoàn thiện bot, seed F/S/M/E và bộ đối soát cho 50 người

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T61
- **FR:** FR-07, FR-08, FR-09, FR-11, FR-12
- **Acceptance refs:** AC-06, AC-08, AC-09, AC-16, LT-06, LT-11
- **Work packages:** W24

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Harness biết thi/luyện tập/slow reader/retry và verifier phát hiện sai đề/answer/điểm/reservation.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T24](sprint-1-tickets.md#exam-t24): Behavior bot nhỏ: login/join/nhận đề/lưu/nộp qua TCP thật.
- [EXAM-T55](sprint-1-tickets.md#exam-t55): Seed test F/S/E tái lập qua công cụ offline dùng chung.
- [EXAM-T61](sprint-1-tickets.md#exam-t61): Oracle S1: kiểm snapshot/ACK/revision/score độc lập.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §2.2/3.1/6; 02 §8.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** NET behavior one TCP/account đúng state, split/gộp/slow read fault riêng; S 360 câu/M seed riêng đủ 100/mức/chủ đề. Oracle độc lập scoring/counts/topic/duplicate/version/revision/receipt/FK/activity, fixture kiểm thử cố ý sai. Practice behavior ghép T30 sau, driver interface T32.

**Các bước thực hiện:**

1. NET behavior one TCP/account đúng state, split/gộp/slow read fault riêng.
2. S 360 câu/M seed riêng đủ 100/mức/chủ đề.
3. Oracle độc lập scoring/counts/topic/duplicate/version/revision/receipt/FK/activity, fixture kiểm thử cố ý sai.
4. Practice behavior ghép T30 sau, driver interface T32.

**Vùng mã dự kiến:** tools/load và db/seeds: behavior/seed/verifier mở rộng của Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Seed S/M/E và quyền bot | Seed/maxtext/hợp lệ và malformed profile phân biệt; bot thi không có key hoặc đọc admin khi thi. |
| ACK mới nhất và retry | Latest ACK phải khớp hoặc được thay bởi revision mới commit; retry không đếm thêm logical save. |
| Oracle phát hiện dữ liệu sai | Verifier phát hiện fixture chấm sai/lẫn bài/reservation kẹt; receipt/hash đúng và no correct key trên payload. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Behavior/seed F-S-M-E và oracle đầy đủ dùng cho 50 người.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T61](sprint-1-tickets.md#exam-t61)
- Blocks: [EXAM-T36](sprint-2-tickets.md#exam-t36), [EXAM-T38](sprint-2-tickets.md#exam-t38), [EXAM-T64](sprint-2-tickets.md#exam-t64), [EXAM-T65](sprint-2-tickets.md#exam-t65)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Behavior/oracle cho T37/T39; không dùng score engine production làm oracle hoặc reset DB đang chạy.

**Checkpoint bảo vệ:** Làm sao chứng minh ACK không mất nếu người dùng đã đổi câu đó nhiều lần? Seed S có đủ cho M không?

**Truy vết nhập Jira:** `EXAM-T33`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t34"></a>

## EXAM-T34 — [Database Test] Kiểm thử ledger, admission, rollback và lỗi commit/crash

- **Epic:** EXAM-E03
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T21
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** AC-09, AC-26, AC-29, PT-06, PT-22, PT-23, LT-13, LT-14
- **Work packages:** W22

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Có evidence DB/receipt/admission qua lỗi và crash, không gộp cold backup vào cùng task.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §11/11.1/11.2; 03 §12.3; 04 §5.3/LT-13/14. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Fault fixtures cho C08/SQLITE_BUSY/disk full/commit ambiguity, mất response sau commit và K07 DB OPEN. Phối hợp Minh Quân bridge nhưng không Block vòng; giữ DB lỗi để kiểm. Cold backup/restore được kiểm riêng T63.

**Các bước thực hiện:**

1. Fault fixtures cho C08/SQLITE_BUSY/disk full/commit ambiguity, mất response sau commit và K07 DB OPEN.
2. Phối hợp Minh Quân bridge nhưng không Block vòng.
3. giữ DB lỗi để kiểm.
4. Cold backup/restore được kiểm riêng T63.

**Vùng mã dự kiến:** tests và tools/load: fixture fault DB/ledger, adapter storage hiện hành nếu cần sửa lỗi. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Admission restricted và actual disk error | Restricted chặn nhận mới, existing writes vẫn thử khi DB ghi được; actual disk error không ACK giả. |
| Commit mất response/rollback/unknown | Commit rồi mất response giữ receipt/answer; rollback không success receipt; UNKNOWN dừng ghi đúng policy. |
| DB có OPEN sau crash | DB OPEN/RUNNING từ crash không ready/điểm 0 giả hoặc xóa dữ liệu để khởi chạy. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Kiểm DB/ledger/admission: rollback/commit lỗi và crash outcome.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T21](sprint-1-tickets.md#exam-t21)
- Blocks: [EXAM-T39](sprint-2-tickets.md#exam-t39), [EXAM-T63](sprint-2-tickets.md#exam-t63)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** DB fault/evidence cho T39/T41; không gộp thêm backup/restore trong timebox này.

**Checkpoint bảo vệ:** RESOURCE_LIMIT khác SQLITE_FULL thế nào? Tại sao không xóa WAL/receipts để hết lỗi khi server chạy?

**Truy vết nhập Jira:** `EXAM-T34`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t35"></a>

## EXAM-T35 — [Bridge Test] Kiểm thử BP quá tải, authority, lỗi tiến trình và khóa DB trên Linux

- **Epic:** EXAM-E01
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T62
- **FR:** FR-02, FR-10, FR-13
- **Acceptance refs:** AC-17, AC-23, AC-25, PT-05, PT-26, PT-27, PT-28, LT-13, LT-14
- **Work packages:** W22, W25

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Bridge fail-stop và cleanup đúng; một TCP peer chậm không trở thành sự cố toàn server.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T09](sprint-1-tickets.md#exam-t09): C launcher: spawn Node, khóa DB kế thừa và shutdown.
- [EXAM-T10](sprint-1-tickets.md#exam-t10): Node BP output: serialize response/event và backpressure stdout.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T27](sprint-2-tickets.md#exam-t27): C reconnect/resume: thay binding và giữ token/instance đúng.
- [EXAM-T46](sprint-1-tickets.md#exam-t46): Log có giới hạn và drain stderr không chặn vòng I/O.
- [EXAM-T48](sprint-1-tickets.md#exam-t48): Node BP input và dispatcher tuần tự với readiness thật.
- [EXAM-T49](sprint-1-tickets.md#exam-t49): C BP routing/credit: chuyển output đúng TCP và giải phóng một lần.
- [EXAM-T62](sprint-2-tickets.md#exam-t62): Main pending/reload/logout: phục hồi context và chặn callback cũ.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5/11; 03 §18.4; 04 LT-13/14. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Pipe blocked/partial/EOF/stdout log/error, control credit saturation, old fd/hash late/auth terminal; kill parent giữ child còn DB và launcher thứ hai; signal/shutdown/kill reap. Metrics/bằng chứng ở 2 PID; phạm vi lỗi Node chết không hứa timer continues.

**Các bước thực hiện:**

1. Pipe blocked/partial/EOF/stdout log/error, control credit saturation, old fd/hash late/auth terminal.
2. kill parent giữ child còn DB và launcher thứ hai.
3. signal/shutdown/kill reap.
4. Metrics/bằng chứng ở 2 PID.
5. phạm vi lỗi Node chết không hứa timer continues.

**Vùng mã dự kiến:** tests, src/server/bridge và tools/load: bridge/authority/lifecycle fault checks. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Peer/BP dừng đọc hoặc Node chết | Slow TCP đóng đúng peer/cap 15 s, healthy loop còn chạy; BP terminal dừng accept/TCP và pending UNKNOWN không ACK giả. |
| Credit sau close/revoke/EOF | Control/response ticket trả đúng 1 lần qua EOF/close/revoke; instance change không replay W cũ. |
| Parent chết khi child còn giữ DB | Parent chết child còn khóa, second launcher bị từ chối; child đóng DB và thoát thì khóa được thả, không zombie/lockfile unlink. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Kiểm BP saturation/authority, lỗi tiến trình con và lock cleanup trên Linux.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T62](sprint-2-tickets.md#exam-t62)
- Blocks: [EXAM-T38](sprint-2-tickets.md#exam-t38), [EXAM-T40](sprint-2-tickets.md#exam-t40), [EXAM-T65](sprint-2-tickets.md#exam-t65)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Evidence Minh Quân cho T38/T40/T42; Oracle DB/crash result T34, không duplicate cùng fault một biên bản.

**Checkpoint bảo vệ:** Tại sao Node chết phải dừng instance? Có thể vừa đóng fd cũ vừa gửi completion cũ sang fd mới không?

**Truy vết nhập Jira:** `EXAM-T35`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t36"></a>

## EXAM-T36 — [Load Test] Đo tải ổn định, đăng nhập và tài nguyên với 50 người trên LAN

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T27, EXAM-T32, EXAM-T33, EXAM-T58, EXAM-T60
- **FR:** FR-13
- **Acceptance refs:** AC-15, AC-16, AC-18, LT-01, LT-02, LT-03, LT-04, LT-05, LT-09, LT-10
- **Work packages:** W25

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Có report steady/auth 50 đúng workload và môi trường; burst/start/deadline có report riêng.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T13](sprint-1-tickets.md#exam-t13): Màn đăng ký/đăng nhập/đăng xuất qua bridge thật.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T23](sprint-1-tickets.md#exam-t23): Driver tải nhỏ và report skeleton để tích hợp từ S1.
- [EXAM-T24](sprint-1-tickets.md#exam-t24): Behavior bot nhỏ: login/join/nhận đề/lưu/nộp qua TCP thật.
- [EXAM-T27](sprint-2-tickets.md#exam-t27): C reconnect/resume: thay binding và giữ token/instance đúng.
- [EXAM-T32](sprint-2-tickets.md#exam-t32): Driver đầy đủ: lịch slot/barrier/metrics và report các profile.
- [EXAM-T33](sprint-2-tickets.md#exam-t33): Behavior/seed F-S-M-E và oracle đầy đủ dùng cho 50 người.
- [EXAM-T52](sprint-1-tickets.md#exam-t52): UI phòng chờ/host: catalog, cấu hình, roster và điều khiển thi.
- [EXAM-T57](sprint-1-tickets.md#exam-t57): UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu.
- [EXAM-T58](sprint-1-tickets.md#exam-t58): UI nộp bài: xác nhận ý định, đợi save và xử lý kết quả chưa rõ.
- [EXAM-T59](sprint-1-tickets.md#exam-t59): room.end/deadline: tự chốt phòng và công bố sau commit.
- [EXAM-T60](sprint-1-tickets.md#exam-t60): UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §2–4/7/8; sprint-plan §3.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Run 5→20→50, LT-01/02/09/10 theo 04, load host tách server và 2 UI LAN. Steady 9000 saves/15 phút trong ca 20 phút, login burst/cooldown công bố; sample C+Node CPU/RSS/queue/DB/NIC. Phối hợp T64 chạy burst save trong cửa sổ steady của cùng run ID. T36 tổng hợp steady, T64 báo riêng burst. T64 dùng ca riêng cho burst submit và deadline. T37 ghép oracle với run ID tương ứng.

**Các bước thực hiện:**

1. Run 5→20→50, LT-01/02/09/10 theo 04, load host tách server và 2 UI LAN.
2. Steady 9000 saves/15 phút trong ca 20 phút, login burst/cooldown công bố.
3. sample C+Node CPU/RSS/queue/DB/NIC.
4. Burst/start/deadline transaction chạy riêng T64.
5. oracle report T37.

**Vùng mã dự kiến:** tools/load và docs/verification/<run-id>: command/config/report/raw summary/oracle theo phần Minh Quân/Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Chạy thật đúng máy/build/config | Report đúng build/config/seed/máy/byte,số scheduled/sent/ACK/errors và latency logical/RTT. |
| 9000 logical samples và lỗi | Steady 9000 mẫu mỗi run, missed/BUSY/timeout không bị bỏ; p 95/p 99 theo định nghĩa. |
| 50 login và raw evidence | 50 login≤60 sđượcđo, không hứa vì cap; raw report chưa được gán PASS nghiệm thu tổng khi chưa oracle T37. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Chạy steady 50/login và đo tài nguyên trên Linux/LAN.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T27](sprint-2-tickets.md#exam-t27), [EXAM-T32](sprint-2-tickets.md#exam-t32), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T58](sprint-1-tickets.md#exam-t58), [EXAM-T60](sprint-1-tickets.md#exam-t60)
- Blocks: [EXAM-T37](sprint-2-tickets.md#exam-t37)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Steady/auth measurements cho T37/T42; không đếm thêm burst vào steady hoặc claim 50 từ socket rỗng.

**Checkpoint bảo vệ:** Băng thông 6,144 Mbit/s đủ có chứng minh phát đề 2 s không? p 95 được tính từ tập mẫu nào?

**Truy vết nhập Jira:** `EXAM-T36`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t37"></a>

## EXAM-T37 — [Data Verification] Đối soát các run 50 người và sửa lỗi nghiệp vụ

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T22, EXAM-T36, EXAM-T64
- **FR:** FR-07, FR-08, FR-09, FR-12
- **Acceptance refs:** AC-06, AC-08, AC-09, AC-16, LT-02, LT-03, LT-04, LT-05
- **Work packages:** W24, W25

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Mỗi report latency có oracle độc lập xác nhận đề/answer/score, không chỉ tốc độ đẹp.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T22](sprint-1-tickets.md#exam-t22): Result APIs: kết quả cá nhân và bảng chủ phòng đúng quyền.
- [EXAM-T24](sprint-1-tickets.md#exam-t24): Behavior bot nhỏ: login/join/nhận đề/lưu/nộp qua TCP thật.
- [EXAM-T33](sprint-2-tickets.md#exam-t33): Behavior/seed F-S-M-E và oracle đầy đủ dùng cho 50 người.
- [EXAM-T56](sprint-1-tickets.md#exam-t56): attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- [EXAM-T61](sprint-1-tickets.md#exam-t61): Oracle S1: kiểm snapshot/ACK/revision/score độc lập.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §6/8/9; 05 §6. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Đối soát artefact T36 và T64 theo run ID, chuẩn bị verifier song song; kiểm counts/snapshot/ACK latest/revision/receipt/score/FK/activity và payload. Ghi oracle diff đã lọc key; fixes nhỏ và retest trong timebox, bug lớn tạo estimate còn lại không ẩn.

**Các bước thực hiện:**

1. Đối soát artefact T36 và T64 theo run ID, chuẩn bị verifier song song.
2. kiểm counts/snapshot/ACK latest/revision/receipt/score/FK/activity và payload.
3. Ghi oracle diff đã lọc key.
4. fixes nhỏ và retest trong timebox, bug lớn tạo estimate còn lại không ẩn.

**Vùng mã dự kiến:** tools/load và docs/verification/<run-id>: command/config/report/raw summary/oracle theo phần Minh Quân/Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Snapshot/answer/result của 50 người | Mỗi 50 người có đúng attempt/cấu hình/đề không key, không lẫn bài hoặc ACK mất; nộp lặp không nhân kết quả. |
| Số mẫu và verifier độc lập | Expected 9000 và burst/retry tách biệt; dùng DB sau ca/ngừng sạch để verifier, không bot đọc key trong lúc thi. |
| Latency đẹp nhưng oracle sai | Report Hoàng Quân ký nhận phạm vi thật/FAIL/NOT_RUN; percentile đạt nhưng oracle sai thì run FAIL. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Đối soát dữ liệu các run 50 chuẩn và sửa lỗi domain được phát hiện.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T22](sprint-1-tickets.md#exam-t22), [EXAM-T36](sprint-2-tickets.md#exam-t36), [EXAM-T64](sprint-2-tickets.md#exam-t64)
- Blocks: [EXAM-T41](sprint-2-tickets.md#exam-t41)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Đính kèm bằng chứng oracle vào report T36 và T64 theo run ID; dependency đầu vào không Block T36 harness phát triển, nghiệm thu cùng run.

**Checkpoint bảo vệ:** Chứng minh một ACK đã lưu bằng dữ liệu cuối thế nào? Tại sao score đúng chưa đủ nếu đề lẫn bài?

**Truy vết nhập Jira:** `EXAM-T37`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t38"></a>

## EXAM-T38 — [Load Test] Chạy tải hỗn hợp 30/10/10 và kịch bản một client chậm

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T30, EXAM-T32, EXAM-T33, EXAM-T35
- **FR:** FR-10, FR-11, FR-13
- **Acceptance refs:** AC-11, AC-12, AC-16, AC-17, LT-06, LT-07, LT-08, LT-10, LT-11, LT-13, LT-15
- **Work packages:** W25

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Có report mixed/slow peer tách healthy group, không gom thêm maxtext/expiry vào cùng timebox.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T27](sprint-2-tickets.md#exam-t27): C reconnect/resume: thay binding và giữ token/instance đúng.
- [EXAM-T28](sprint-2-tickets.md#exam-t28): Reconcile bài thi/pending và UI tiếp tục sau mất phản hồi.
- [EXAM-T30](sprint-2-tickets.md#exam-t30): Luyện tập cá nhân dùng chung engine đề/lưu/nộp.
- [EXAM-T32](sprint-2-tickets.md#exam-t32): Driver đầy đủ: lịch slot/barrier/metrics và report các profile.
- [EXAM-T33](sprint-2-tickets.md#exam-t33): Behavior/seed F-S-M-E và oracle đầy đủ dùng cho 50 người.
- [EXAM-T35](sprint-2-tickets.md#exam-t35): Kiểm BP saturation/authority, lỗi tiến trình con và lock cleanup trên Linux.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §3.1/5/7/8; 03 §12/18. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** LT-06/07:30 phòng Minh Quân+10 phòng Hoàng Quân+10 practice tổng 50 activity; run 49 healthy+1 slow reader/gửi dở. Sử dụng lịch slot/jitter và profile đã chốt, tách peer fault với người khỏe; M/expiry/reconnect riêng T65.

**Các bước thực hiện:**

1. LT-06/07:30 phòng Minh Quân+10 phòng Hoàng Quân+10 practice tổng 50 activity.
2. run 49 healthy+1 slow reader/gửi dở.
3. Sử dụng lịch slot/jitter và profile đã chốt, tách peer fault với người khỏe.
4. M/expiry/reconnect riêng T65.

**Vùng mã dự kiến:** tools/load và docs/verification/<run-id>: command/config/report/raw summary/oracle theo phần Minh Quân/Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Mixed 30/10/10 | Mixed đúng 5400/1800/1800 saves và deadline/quyền riêng, không lẫn dữ liệu nhóm. |
| 49 healthy+1 fault peer | 49 healthy có 8820 steady, latency/errors riêng đạt LT-02; fault peer báo expected riêng. |
| Queue/fairness của người khỏe | Queue/control/timeout slow peer hữu hạn, không để mọi TCP đứng hoặc đổi denominator sau khi thấy lỗi. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Run mixed 30/10/10 và 49 người khỏe+1 slow peer.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T30](sprint-2-tickets.md#exam-t30), [EXAM-T32](sprint-2-tickets.md#exam-t32), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T35](sprint-2-tickets.md#exam-t35)
- Blocks: [EXAM-T39](sprint-2-tickets.md#exam-t39)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Mixed/slow-peer measurements cho T39/T42; không gộp thêm ca 30 phút/M trong estimate 3 h.

**Checkpoint bảo vệ:** Flow control kernel rwnd khác queue ứng dụng ra sao? Vì sao healthy 49 có 8820 mẫu thay vì 9000?

**Truy vết nhập Jira:** `EXAM-T38`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t39"></a>

## EXAM-T39 — [Data Verification] Đối soát tải hỗn hợp, lỗi, công bố kết quả và phân quyền

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T31, EXAM-T34, EXAM-T38, EXAM-T65
- **FR:** FR-08, FR-09, FR-10, FR-11, FR-12
- **Acceptance refs:** AC-11, AC-13, AC-14, AC-16, AC-29, LT-06, LT-07, LT-08, LT-11, LT-12, LT-13
- **Work packages:** W24, W25

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Các run lỗi/mixed có chứng minh dữ liệu/phân quyền đúng, không nghiệm thu chỉ dựa trên socket còn sống.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T28](sprint-2-tickets.md#exam-t28): Reconcile bài thi/pending và UI tiếp tục sau mất phản hồi.
- [EXAM-T30](sprint-2-tickets.md#exam-t30): Luyện tập cá nhân dùng chung engine đề/lưu/nộp.
- [EXAM-T31](sprint-2-tickets.md#exam-t31): Chi tiết kết quả/lịch sử và biểu đồ từ dữ liệu đã công bố.
- [EXAM-T33](sprint-2-tickets.md#exam-t33): Behavior/seed F-S-M-E và oracle đầy đủ dùng cho 50 người.
- [EXAM-T34](sprint-2-tickets.md#exam-t34): Kiểm DB/ledger/admission: rollback/commit lỗi và crash outcome.
- [EXAM-T61](sprint-1-tickets.md#exam-t61): Oracle S1: kiểm snapshot/ACK/revision/score độc lập.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 invariants/D03/D06; 03 §7.4/10; 04 §6–8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Nhận artefact T38 và T65 theo run ID, kiểm practice/exam deadline riêng/activity/receipt/reconcile/early publish/nộp trùng. M text lớn/cursor và late ACK; audit result/items/history/chart/room results theo owner/host/ADMIN. Evidence DB fault T34 dùng chung không chạy lại vô ích.

**Các bước thực hiện:**

1. Nhận artefact T38 và T65 theo run ID, kiểm practice/exam deadline riêng/activity/receipt/reconcile/early publish/nộp trùng.
2. M text lớn/cursor và late ACK.
3. audit result/items/history/chart/room results theo owner/host/ADMIN.
4. Evidence DB fault T34 dùng chung không chạy lại vô ích.

**Vùng mã dự kiến:** tools/load và docs/verification/<run-id>: command/config/report/raw summary/oracle theo phần Minh Quân/Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Công bố/permission qua mọi đường | Không lộ điểm early submit qua result/history/chart hoặc key qua NET; admin không tự đọc mọi bài. |
| Mất mạng/late callback/nộp lặp | Mất mạng/cũ callback/nộp lặp không đè answer/sinh attempt mới; latest ACK/revision/score/FK khớp. |
| Finalized activities và báo cáo theo nhóm | Run 49/mixed ghi oracle riêng theo nhóm, mọi reservation terminal được release đúng; error của peer fault không lẫn 0 error healthy. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Oracle mixed/fault và publication/permission xuyên mọi đường.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T31](sprint-2-tickets.md#exam-t31), [EXAM-T34](sprint-2-tickets.md#exam-t34), [EXAM-T38](sprint-2-tickets.md#exam-t38), [EXAM-T65](sprint-2-tickets.md#exam-t65)
- Blocks: [EXAM-T41](sprint-2-tickets.md#exam-t41)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Oracle Hoàng Quân cho T38/T41/T43; lỗi Minh Quân/Hoàng Quân giao đúng module, không Hoàng Quân chịu trách nhiệm fix mọi thứ.

**Checkpoint bảo vệ:** Một phòng CANCELLED có được thêm vào chart điểm không? Vì sao nộp sớm chưa được practice?

**Truy vết nhập Jira:** `EXAM-T39`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t40"></a>

## EXAM-T40 — [Documentation] Viết hướng dẫn Linux/LAN, cài mới và bảo vệ phần Minh Quân

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T35, EXAM-T52, EXAM-T63
- **FR:** FR-13
- **Acceptance refs:** AC-15, AC-18, AC-27, AC-28, LT-01, LT-14
- **Work packages:** W26

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Người còn lại tự dựng/start/shutdown được từ hướng dẫn thật, Minh Quân giải thích được code mạng của mình.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T09](sprint-1-tickets.md#exam-t09): C launcher: spawn Node, khóa DB kế thừa và shutdown.
- [EXAM-T13](sprint-1-tickets.md#exam-t13): Màn đăng ký/đăng nhập/đăng xuất qua bridge thật.
- [EXAM-T18](sprint-1-tickets.md#exam-t18): Room backend: list/create/configure/get/join/leave và roster.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T27](sprint-2-tickets.md#exam-t27): C reconnect/resume: thay binding và giữ token/instance đúng.
- [EXAM-T35](sprint-2-tickets.md#exam-t35): Kiểm BP saturation/authority, lỗi tiến trình con và lock cleanup trên Linux.
- [EXAM-T46](sprint-1-tickets.md#exam-t46): Log có giới hạn và drain stderr không chặn vòng I/O.
- [EXAM-T47](sprint-1-tickets.md#exam-t47): Config loader C/TS: default, bound và đường dẫn nhất quán.
- [EXAM-T50](sprint-1-tickets.md#exam-t50): Electron main/preload: spawn client C, API whitelist và pending registry.
- [EXAM-T52](sprint-1-tickets.md#exam-t52): UI phòng chờ/host: catalog, cấu hình, roster và điều khiển thi.
- [EXAM-T59](sprint-1-tickets.md#exam-t59): room.end/deadline: tự chốt phòng và công bố sau commit.
- [EXAM-T62](sprint-2-tickets.md#exam-t62): Main pending/reload/logout: phục hồi context và chặn callback cũ.
- [EXAM-T63](sprint-2-tickets.md#exam-t63): Cold backup/restore và integrity check trên DB test.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §11; 05 §8; sprint-plan §3.1/3.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Cập nhật setup lệnh serve/config/admin/seed thật sau implement, Node/C versions, endpoint/port/log/DB/lock/cold backup/K07. Dựng từ bản checkout tạm, giữ workspace hiện tại của người dùng; UI process shutdown/reconnect/các bước demo phòng thi và trace Minh Quân. Thêm link evidence T36/T38 khi có, không Block khung runbook đợi mọi LT.

**Các bước thực hiện:**

1. Cập nhật setup lệnh serve/config/admin/seed thật sau implement, Node/C versions, endpoint/port/log/DB/lock/cold backup/K07.
2. Dựng từ bản checkout tạm, giữ workspace hiện tại của người dùng.
3. UI process shutdown/reconnect/các bước demo phòng thi và trace Minh Quân.
4. Thêm link evidence T36/T38 khi có, không Block khung runbook đợi mọi LT.

**Vùng mã dự kiến:** docs/development, runbook và ghi chú phần Minh Quân; không dựng môi trường remote mới. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Máy khác chạy theo runbook | Hoàng Quân tái lập build/start 2 UI LAN theo runbook, khác cwd/path sample vẫn đúng; không hard code secret hoặc phụ thuộc sửa DB tay. |
| Shutdown/backup/K07 policy | Graceful/abnormal shutdown và DB OPEN chặn startup được nêu đúng; backup không copy riêng DB đang WAL active. |
| Bảo vệ phần RX/lifecycle | Minh Quân vẽ request RX/authority/clock và giải thích EINTR/EAGAIN/EOF/timeout/generation với ca đã chạy; biết giới hạn chưa đạt. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Runbook Linux/LAN, clean setup và ghi chú bảo vệ phần Minh Quân.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T35](sprint-2-tickets.md#exam-t35), [EXAM-T52](sprint-1-tickets.md#exam-t52), [EXAM-T63](sprint-2-tickets.md#exam-t63)
- Blocks: NONE
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Runbook và ghi chú Minh Quân cho buổi review T42; không xuất bản/release đa OS ngoài phạm vi.

**Checkpoint bảo vệ:** Từ clean máy khác thiếu dependency nào? Khi server crash còn OPEN operator phải làm gì và không được hứa gì?

**Truy vết nhập Jira:** `EXAM-T40`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t41"></a>

## EXAM-T41 — [Documentation] Chuẩn bị seed demo, hướng dẫn đối soát và bảo vệ phần Hoàng Quân

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T29, EXAM-T37, EXAM-T39, EXAM-T63
- **FR:** FR-03, FR-07, FR-08, FR-09, FR-11, FR-12
- **Acceptance refs:** AC-03, AC-09, AC-13, AC-14, LT-12, LT-14
- **Work packages:** W26

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Hai bạn tự demo ngân hàng/thi/practice/history và tái lập oracle bằng dữ liệu test rõ ràng.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T16](sprint-1-tickets.md#exam-t16): CLI admin offline dùng khóa và hash chung.
- [EXAM-T29](sprint-2-tickets.md#exam-t29): Admin UI quản lý chủ đề/câu hỏi và cập nhật kho.
- [EXAM-T30](sprint-2-tickets.md#exam-t30): Luyện tập cá nhân dùng chung engine đề/lưu/nộp.
- [EXAM-T31](sprint-2-tickets.md#exam-t31): Chi tiết kết quả/lịch sử và biểu đồ từ dữ liệu đã công bố.
- [EXAM-T34](sprint-2-tickets.md#exam-t34): Kiểm DB/ledger/admission: rollback/commit lỗi và crash outcome.
- [EXAM-T37](sprint-2-tickets.md#exam-t37): Đối soát dữ liệu các run 50 chuẩn và sửa lỗi domain được phát hiện.
- [EXAM-T39](sprint-2-tickets.md#exam-t39): Oracle mixed/fault và publication/permission xuyên mọi đường.
- [EXAM-T54](sprint-1-tickets.md#exam-t54): Question APIs: list/thêm/sửa/ngừng dùng và version conflict.
- [EXAM-T55](sprint-1-tickets.md#exam-t55): Seed test F/S/E tái lập qua công cụ offline dùng chung.
- [EXAM-T60](sprint-1-tickets.md#exam-t60): UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố.
- [EXAM-T63](sprint-2-tickets.md#exam-t63): Cold backup/restore và integrity check trên DB test.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §6/8/9; 05 §8; sprint-plan §3.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Chuẩn bị demo config F/seed/chấm dự kiến; bank admin/thay câu/early submit/history/chart; verifier/read-only after close/run report và độ bền dữ liệu. Chỉnh UI phần Hoàng Quân giữ đúng trạng thái lưu/kết nối, không animation ngoài phạm vi. Cùng review runbook Minh Quân qua bàn giao.

**Các bước thực hiện:**

1. Chuẩn bị demo config F/seed/chấm dự kiến.
2. bank admin/thay câu/early submit/history/chart.
3. verifier/read-only after close/run report và độ bền dữ liệu.
4. Chỉnh UI phần Hoàng Quân giữ đúng trạng thái lưu/kết nối, không animation ngoài phạm vi.
5. Cùng review runbook Minh Quân qua bàn giao.

**Vùng mã dự kiến:** db/seeds, tools/load và docs/development: demo/seed/verifier phần Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Seed/demo/verifier tái lập | Minh Quân tái lập seed/demo/verifier theo hướng dẫn, không dùng mật khẩu cứng hoặc đưa đáp án đúng thô vào báo cáo công khai. |
| Bảo vệ TX/receipt/scoring | Hoàng Quân tự giải thích TX offset/backpressure/snapshot/random/CAS/receipt/finalizer và chạy một case mất ACK/slow reader. |
| Coverage và dữ liệu trên đồ thị | Coverage FR/AC/PT/LT có status/giới hạn thực tế, không gộp mọi NOT_RUN thành PASS; đồ thị và demo khớp DB. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Bộ seed/demo, hướng dẫn verifier và ghi chú bảo vệ phần Hoàng Quân.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T29](sprint-2-tickets.md#exam-t29), [EXAM-T37](sprint-2-tickets.md#exam-t37), [EXAM-T39](sprint-2-tickets.md#exam-t39), [EXAM-T63](sprint-2-tickets.md#exam-t63)
- Blocks: NONE
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Seed/runsteps/ghi chú Hoàng Quân cho T43; không xóa DB lỗi/viết kết quả đạt trước chạy hoặc tạo tính năng mới ngày 13.

**Checkpoint bảo vệ:** Vì sao một đề ngẫu nhiên khác nhau không đồng nghĩa mọi người không trùng câu? Làm sao chấm độc lập khi không gửi key xuống client?

**Truy vết nhập Jira:** `EXAM-T41`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t42"></a>

## EXAM-T42 — [Sprint Review] Demo tích hợp, báo cáo tải và đánh giá bàn giao phần Minh Quân — Sprint 2

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** NONE
- **FR:** FR-13
- **Acceptance refs:** AC-15, AC-16, AC-18
- **Work packages:** W26

**Cách review:** Buổi review/demo chung của Nguyễn Minh Quân và Đặng Hoàng Quân. Người phụ trách chuẩn bị phần bằng chứng được giao; cả hai đối chiếu goal, kết quả và phần còn lại trong cùng buổi. Không cần approval riêng hoặc PR rỗng cho cuộc họp; file evidence mới/sửa kết luận vẫn cần người còn lại kiểm tra trước merge.

**Mục tiêu:** Đánh giá goal 50/khôi phục/khả năng tái lập bằng evidence, quyết định bug cần buffer.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T36](sprint-2-tickets.md#exam-t36): Chạy steady 50/login và đo tài nguyên trên Linux/LAN.
- [EXAM-T38](sprint-2-tickets.md#exam-t38): Run mixed 30/10/10 và 49 người khỏe+1 slow peer.
- [EXAM-T40](sprint-2-tickets.md#exam-t40): Runbook Linux/LAN, clean setup và ghi chú bảo vệ phần Minh Quân.
- [EXAM-T64](sprint-2-tickets.md#exam-t64): Run burst 50/start-to-last-page/deadline bằng workload đã chốt.
- [EXAM-T65](sprint-2-tickets.md#exam-t65): Run reconnect/M maxtext/WAITING expiry 30 phút và biên.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** sprint-plan §3.3/4.1; 04 §8; 05 §8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Chuẩn bị và bàn giao demo checklist, evidence index và phần forecast/biên bản thuộc owner. Estimate 2 h =45 phút chuẩn bị gói +75 phút review/demo/retro chung; không làm thêm một vòng test toàn hệ thống hoặc tính buổi họp hai lần. Biên bản chỉ hoàn thành sau buổi thật.

**Các bước thực hiện:**

1. Gom build/config/seed và evidence links phần mình, soạn demo checklist cùng forecast; phần chuẩn bị gói bàn giao dự kiến 45 phút.
2. Tham gia cùng buổi review/demo 60 phút và retro 15 phút với người còn lại; mỗi người tính 75 phút, không hai buổi riêng.
3. Đối chiếu report Minh Quân với oracle T37/T39 theo cùng run ID. Demo phần đã chạy, ghi trạng thái từng nhóm ca và kết luận goal theo sprint-plan §3.1.
4. Sau buổi thật, hoàn thành phần biên bản/bug owner/giờ còn lại và tối đa hai hành động retro; không tạo biên bản PASS trước khi họp.

**Vùng mã dự kiến:** docs/planning/reviews và gói demo/evidence index; biên bản chỉ tạo sau review thật. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Goal và bằng chứng thật | Record goal/build/config/seed và AC/PT/LT status, lỗi/giới hạn/owner/giờ còn lại; không đạt tải thì ghi chưa đạt. |
| Phân biệt số đo/giả định | Giải thích C/socket/pipe/byte order/timeout/poll và resource tính cho 50; không tự nhận thầy đã duyệt Node/điểm cá nhân. |
| Bug buffer và retro | Retro≤2 action, quyết định bàn giao hoặc bug buffer 15–16 rõ; không thêm FR hoặc auto-close Jira Sprint. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Chuẩn bị bằng chứng và sprint 2 review: demo tích hợp, báo cáo tải và quyết định bàn giao phần Minh Quân.
- [ ] Biên bản ghi riêng kết quả buổi review và kết luận sprint goal. Task review hoàn thành khi đã họp và ghi nhận đúng bằng chứng, kể cả khi goal chưa đạt.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Kiểm các liên kết evidence/commit/config/seed thực tế, chạy demo checklist trong buổi thật và ghi kết quả/giờ còn lại sau buổi; không sinh trước biên bản PASS. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Buổi review diễn ra theo lịch. Các ticket được dẫn ở phần đầu vào là nguồn evidence. Nếu còn thiếu, ghi trạng thái, giờ còn lại và ảnh hưởng đến sprint goal trong biên bản.

- Is blocked by: NONE
- Blocks: NONE
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Biên bản thật sau họp với đóng góp của Hoàng Quân từ T43; chưa được ghi PASS trước khi họp. Gói bàn giao gồm demo checklist, evidence index và phần biên bản/forecast; biên bản chỉ ghi sau buổi thật.

**Checkpoint bảo vệ:** Điều gì đã được đo trên máy thật và điều gì mới là dự toán? Nếu p 95 đạt nhưng dữ liệu sai thì kết luận thế nào?

**Truy vết nhập Jira:** `EXAM-T42`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t43"></a>

## EXAM-T43 — [Sprint Review] Demo nghiệp vụ, đối soát và chuẩn bị bảo vệ phần Hoàng Quân — Sprint 2

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** NONE
- **FR:** FR-03, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12
- **Acceptance refs:** AC-03, AC-09, AC-11, AC-13, AC-14, AC-16
- **Work packages:** W26

**Cách review:** Buổi review/demo chung của Nguyễn Minh Quân và Đặng Hoàng Quân. Người phụ trách chuẩn bị phần bằng chứng được giao; cả hai đối chiếu goal, kết quả và phần còn lại trong cùng buổi. Không cần approval riêng hoặc PR rỗng cho cuộc họp; file evidence mới/sửa kết luận vẫn cần người còn lại kiểm tra trước merge.

**Mục tiêu:** Chứng minh toàn phần Hoàng Quân hoạt động và hiểu được cơ chế mạng mình viết.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T29](sprint-2-tickets.md#exam-t29): Admin UI quản lý chủ đề/câu hỏi và cập nhật kho.
- [EXAM-T30](sprint-2-tickets.md#exam-t30): Luyện tập cá nhân dùng chung engine đề/lưu/nộp.
- [EXAM-T31](sprint-2-tickets.md#exam-t31): Chi tiết kết quả/lịch sử và biểu đồ từ dữ liệu đã công bố.
- [EXAM-T37](sprint-2-tickets.md#exam-t37): Đối soát dữ liệu các run 50 chuẩn và sửa lỗi domain được phát hiện.
- [EXAM-T39](sprint-2-tickets.md#exam-t39): Oracle mixed/fault và publication/permission xuyên mọi đường.
- [EXAM-T41](sprint-2-tickets.md#exam-t41): Bộ seed/demo, hướng dẫn verifier và ghi chú bảo vệ phần Hoàng Quân.
- [EXAM-T60](sprint-1-tickets.md#exam-t60): UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** sprint-plan §3.3; 04 §6–8; 05 §8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Chuẩn bị và bàn giao demo checklist, evidence index và phần forecast/biên bản thuộc owner. Estimate 2 h =45 phút chuẩn bị gói +75 phút review/demo/retro chung; không làm thêm một vòng test toàn hệ thống hoặc tính buổi họp hai lần. Biên bản chỉ hoàn thành sau buổi thật.

**Các bước thực hiện:**

1. Gom build/config/seed và evidence links phần mình, soạn demo checklist cùng forecast; phần chuẩn bị gói bàn giao dự kiến 45 phút.
2. Tham gia cùng buổi review/demo 60 phút và retro 15 phút với người còn lại; mỗi người tính 75 phút, không hai buổi riêng.
3. Demo đúng phần đã chạy, ghi goal/AC/PT/LT đạt hoặc thiếu; không lấy mock, build pass hoặc test một nhánh làm nghiệm thu toàn bộ.
4. Sau buổi thật, hoàn thành phần biên bản/bug owner/giờ còn lại và tối đa hai hành động retro; không tạo biên bản PASS trước khi họp.

**Vùng mã dự kiến:** docs/planning/reviews và gói demo/evidence index; biên bản chỉ tạo sau review thật. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Demo phần Hoàng Quân bằng UI thật | Demo các FR phần Hoàng Quân với UI thật và oracle, không thay API/DB tay; trả lời vẽ request TX→Node→DB→UI và đường lỗi. |
| Oracle/ACK/counts | Nêu rõ 50/49/mixed và latest ACK checks, chấm đúng từ snapshot, không điểm sớm hoặc nộp trùng. |
| Kết luận goal và bàn giao | Biên bản chung có dự báo phần Hoàng Quân/bug limits/retro action; sprint goal chỉ đạt khi đúng cả dữ liệu/latency/resource/lỗi đã cam kết. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Chuẩn bị bằng chứng và sprint 2 review: demo nghiệp vụ/oracle và bảo vệ phần Hoàng Quân.
- [ ] Biên bản ghi riêng kết quả buổi review và kết luận sprint goal. Task review hoàn thành khi đã họp và ghi nhận đúng bằng chứng, kể cả khi goal chưa đạt.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Kiểm các liên kết evidence/commit/config/seed thực tế, chạy demo checklist trong buổi thật và ghi kết quả/giờ còn lại sau buổi; không sinh trước biên bản PASS. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Buổi review diễn ra theo lịch. Các ticket được dẫn ở phần đầu vào là nguồn evidence. Nếu còn thiếu, ghi trạng thái, giờ còn lại và ảnh hưởng đến sprint goal trong biên bản.

- Is blocked by: NONE
- Blocks: NONE
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Record chung T42, bàn giao đầy đủ hướng dẫn/seed/evidence theo phạm vi thực đã đạt. Gói bàn giao gồm demo checklist, evidence index và phần biên bản/forecast; biên bản chỉ ghi sau buổi thật.

**Checkpoint bảo vệ:** Thầy yêu cầu giải thích vì sao một client ngừng đọc không làm cả lớp đứng: vẽ các queue và xử lý send/EAGAIN.

**Truy vết nhập Jira:** `EXAM-T43`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t62"></a>

## EXAM-T62 — [Electron Bridge] Khôi phục pending khi reload, xử lý logout và chặn callback cũ

- **Epic:** EXAM-E02
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T27, EXAM-T50
- **FR:** FR-01, FR-02, FR-10, FR-13
- **Acceptance refs:** AC-11, AC-23, AC-24, AC-25, PT-05, PT-18, PT-19, PT-20
- **Work packages:** W17

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Main pending/reload/logout: phục hồi context và chặn callback cũ để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T27](sprint-2-tickets.md#exam-t27): C reconnect/resume: thay binding và giữ token/instance đúng.
- [EXAM-T50](sprint-1-tickets.md#exam-t50): Electron main/preload: spawn client C, API whitelist và pending registry.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §6.1/7; 03 §9.2/9.4/10.5/18.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Main registry/subscription qua reload, session/user/instance fence. Logout intent dừng thao tác mới/auto-resume, online đợi ACK hoặc offline/timeout xóa token đóng TCP và thông báo chưa xác nhận revoke. UI đọc registry+server state trước mở sửa.

**Các bước thực hiện:**

1. Main registry/subscription qua reload, session/user/instance fence.
2. Logout intent dừng thao tác mới/auto-resume, online đợi ACK hoặc offline/timeout xóa token đóng TCP và thông báo chưa xác nhận revoke.
3. UI đọc registry+server state trước mở sửa.

**Vùng mã dự kiến:** apps/desktop/src/main, src/preload và src/renderer/src: pending/auth context theo API giới hạn. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Reload lúc save pending | không spawn C/TCP thứ hai, registry không mất khi main còn sống. |
| Logout mất ACK/offline rồi user mới login | không thấy callback/pending cũ và không tự resume phiên cũ. |
| Instance khác/dataset trùng ID | không tự replay W cũ, dọn tách UNKNOWN khỏi bài mới sau đối chiếu. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Main pending/reload/logout: phục hồi context và chặn callback cũ.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T27](sprint-2-tickets.md#exam-t27), [EXAM-T50](sprint-1-tickets.md#exam-t50)
- Blocks: [EXAM-T28](sprint-2-tickets.md#exam-t28), [EXAM-T35](sprint-2-tickets.md#exam-t35)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Main context/pending recovery cho T28, không bền hóa nháp qua đóng toàn app.

**Checkpoint bảo vệ:** Vì sao resource ID giống nhau ở server instance mới chưa chứng minh cùng dataset? Logout mất ACK phải thông báo gì?

**Truy vết nhập Jira:** `EXAM-T62`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t63"></a>

## EXAM-T63 — [Database] Sao lưu nguội, khôi phục và kiểm tra toàn vẹn DB thử nghiệm

- **Epic:** EXAM-E03
- **Sprint:** S2
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T34
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** AC-09, AC-26, AC-29, PT-06, PT-22, PT-23, LT-13, LT-14
- **Work packages:** W22

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Cold backup/restore và integrity check trên DB test để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T09](sprint-1-tickets.md#exam-t09): C launcher: spawn Node, khóa DB kế thừa và shutdown.
- [EXAM-T34](sprint-2-tickets.md#exam-t34): Kiểm DB/ledger/admission: rollback/commit lỗi và crash outcome.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §11/11.1/11.2; 03 §12.3; 04 §5.3/LT-13/14. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Sau dừng server sạch và không ca mở, sao lưu bộ dữ liệu đúng policy WAL, mở bản sao test để integrity_check/foreign_key_check. Document restore và hash/đầu vào để tái lập; không copy riêng DB đang active hoặc xóa WAL bằng tay.

**Các bước thực hiện:**

1. Sau dừng server sạch và không ca mở, sao lưu bộ dữ liệu đúng policy WAL, mở bản sao test để integrity_check/foreign_key_check.
2. Document restore và hash/đầu vào để tái lập.
3. không copy riêng DB đang active hoặc xóa WAL bằng tay.

**Vùng mã dự kiến:** tools, tests và docs/development: quy trình backup/restore DB test. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| DB đóng sạch | bản sao mở được, integrity/FK đạt và dữ liệu điểm/receipt khớp. |
| Server còn giữ khóa hoặc DB còn ca mở | tool/runbook từ chối cách backup không đúng policy. |
| Bản sao có OPEN từ crash | restore không đồng nghĩa hỗ trợ tiếp tục thi, startup vẫn K07. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Cold backup/restore và integrity check trên DB test.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T34](sprint-2-tickets.md#exam-t34)
- Blocks: [EXAM-T40](sprint-2-tickets.md#exam-t40), [EXAM-T41](sprint-2-tickets.md#exam-t41)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Evidence backup/restore và runbook cho T40/T41; không online backup service.

**Checkpoint bảo vệ:** Vì sao copy riêng file .db khi WAL đang hoạt động có thể không đủ? Restore có đồng nghĩa resume bài đang thi không?

**Truy vết nhập Jira:** `EXAM-T63`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t64"></a>

## EXAM-T64 — [Load Test] Đo burst 50 người, thời gian nhận đủ đề và xử lý deadline

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T32, EXAM-T33, EXAM-T59
- **FR:** FR-13
- **Acceptance refs:** AC-15, AC-16, AC-18, LT-01, LT-02, LT-03, LT-04, LT-05, LT-09, LT-10
- **Work packages:** W25

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Run burst 50/start-to-last-page/deadline bằng workload đã chốt để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T32](sprint-2-tickets.md#exam-t32): Driver đầy đủ: lịch slot/barrier/metrics và report các profile.
- [EXAM-T33](sprint-2-tickets.md#exam-t33): Behavior/seed F-S-M-E và oracle đầy đủ dùng cho 50 người.
- [EXAM-T59](sprint-1-tickets.md#exam-t59): room.end/deadline: tự chốt phòng và công bố sau commit.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §2–4/7/8; sprint-plan §3.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** LT-03/04/05:20 burst save xen steady gắn nhãn riêng; burst submit dùng ca OPEN riêng khi save đã ACK. Start 50 đề S và người cuối nhận mọi trang; ca 15 phút tự chốt không submit. Lặp đủ lượt 04, không hạ duration/threshold để đạt.

**Các bước thực hiện:**

1. Cùng T36 lên lịch ít nhất 20 burst save xen steady theo 04 §8. Ghi chung run ID, tách nhóm mẫu, giữ đủ slot steady theo đặc tả.
2. burst submit dùng ca OPEN riêng khi save đã ACK.
3. Start 50 đề S và người cuối nhận mọi trang.
4. ca 15 phút tự chốt không submit.
5. Lặp đủ lượt 04, không hạ duration/threshold để đạt.

**Vùng mã dự kiến:** tools/load và docs/verification/<run-id>: command/config/report/raw summary/oracle theo phần Minh Quân/Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Ca 1 — Luồng chính và dữ liệu hợp lệ | Barrier≤100 ms,50 save/submit đợt đo tới ACK cuối và đối chiếu revision, không lấy resubmit FINALIZED làm 50 bài mới. |
| S≈30 KiB/người | đo chủ gửi start→người cuối đủ pages≤2 s, không chỉ bandwidth lý thuyết. |
| Deadline 15 phút | khóa sửa đúng hạn và đo finalize commit≤1 s sau hạn, DB error không báo PASS giả. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Run burst 50/start-to-last-page/deadline bằng workload đã chốt.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T32](sprint-2-tickets.md#exam-t32), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T59](sprint-1-tickets.md#exam-t59)
- Blocks: [EXAM-T37](sprint-2-tickets.md#exam-t37)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Raw burst/start/timer report cho T37/T42; failed run ghi đúng FAIL, không tăng cap/đổi FULL/hash.

**Checkpoint bảo vệ:** Băng thông lý thuyết đủ có chứng minh phát đề 2 s không? Tại sao burst submit phải dùng bài OPEN và tách khỏi steady?

**Truy vết nhập Jira:** `EXAM-T64`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t65"></a>

## EXAM-T65 — [Load Test] Kiểm thử reconnect, đề M tối đa và phòng chờ hết hạn 30 phút

- **Epic:** EXAM-E04
- **Sprint:** S2
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T28, EXAM-T32, EXAM-T33, EXAM-T35
- **FR:** FR-10, FR-11, FR-13
- **Acceptance refs:** AC-11, AC-12, AC-16, AC-17, LT-06, LT-07, LT-08, LT-10, LT-11, LT-13, LT-15
- **Work packages:** W25

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Run reconnect/M maxtext/WAITING expiry 30 phút và biên để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T27](sprint-2-tickets.md#exam-t27): C reconnect/resume: thay binding và giữ token/instance đúng.
- [EXAM-T28](sprint-2-tickets.md#exam-t28): Reconcile bài thi/pending và UI tiếp tục sau mất phản hồi.
- [EXAM-T32](sprint-2-tickets.md#exam-t32): Driver đầy đủ: lịch slot/barrier/metrics và report các profile.
- [EXAM-T33](sprint-2-tickets.md#exam-t33): Behavior/seed F-S-M-E và oracle đầy đủ dùng cho 50 người.
- [EXAM-T35](sprint-2-tickets.md#exam-t35): Kiểm BP saturation/authority, lỗi tiến trình con và lock cleanup trên Linux.
- [EXAM-T53](sprint-1-tickets.md#exam-t53): WAITING cancel/expiry 30 phút và startup expiry.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §3.1/5/7/8; 03 §12/18. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** LT-08/11/15:5 người rớt mạng/trở lại trước/sau hạn; M 100 câu với seed riêng đủ counts/text biên; WAITING 30 phút thật mọi client offline và cancel/start race. Script hóa chuẩn bị/thu evidence, không giả vài giây thành 30 phút.

**Các bước thực hiện:**

1. LT-08/11/15:5 người rớt mạng/trở lại trước/sau hạn.
2. M 100 câu với seed riêng đủ counts/text biên.
3. WAITING 30 phút thật mọi client offline và cancel/start race.
4. Script hóa chuẩn bị/thu evidence, không giả vài giây thành 30 phút.

**Vùng mã dự kiến:** tools/load và docs/verification/<run-id>: command/config/report/raw summary/oracle theo phần Minh Quân/Hoàng Quân. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Ca 1 — Luồng chính và dữ liệu hợp lệ | Reconnect dùng đúng bài/answer đã ACK/thời gian, quá hạn không save hoặc gán attempt mới. |
| M maxtext/frame/paging/RSS hợp lệ | không áp S last page 2 s cho M hoặc cắt JSON. |
| Ca 3 — Tính toàn vẹn và bàn giao | 30 phút hết chờ giải phóng sau commit, không gia hạn hoặc hủy RUNNING; key/state/policy không bị đổi để benchmark đẹp. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Run reconnect/M maxtext/WAITING expiry 30 phút và biên.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T28](sprint-2-tickets.md#exam-t28), [EXAM-T32](sprint-2-tickets.md#exam-t32), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T35](sprint-2-tickets.md#exam-t35)
- Blocks: [EXAM-T39](sprint-2-tickets.md#exam-t39)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Raw boundary/reconnect/expiry report cho T39/T42; ghi thời gian chạy đủ lượt và độ trễ/lỗi thật.

**Checkpoint bảo vệ:** Vì sao M không dùng SLA 2 s của S? Clock injection unit test có thay bằng chứng expiry 30 phút thật không?

**Truy vết nhập Jira:** `EXAM-T65`; nguồn `docs/planning/sprint-2-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.
