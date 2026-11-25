# S1 — Ticket nguồn cho Jira

Ngày cập nhật: 18/11/2026. Nhóm xác nhận đã nhập 44 task S1, kiểm Rank và
đồng bộ tên trên Jira; chưa có runtime nghiệp vụ được nghiệm thu.

Mô tả đã cập nhật tên thành viên và cách review theo ảnh hưởng ngày 18/11/2026.
Dùng update_sprint1.py để đồng bộ mô tả đã nhập; mapping thật giữ ở Jira/journal.

Thành viên: Nguyễn Minh Quân và Đặng Hoàng Quân. Reviewer là người liên hệ theo mức review của task. Ước lượng mỗi Task 2–8 h, bộ hiện tại ưu tiên 2–4 h; không phải cam kết task nào cũng xong trong một ngày. Đọc [backlog/capacity](backlog.md) và [lần chia nhỏ này](backlog-refinement.md). Mã tăng thêm giữ nguyên mã cũ để truy vết; thứ tự số không là lịch nối tiếp.

<a id="exam-t01"></a>

## EXAM-T01 — [Contracts] Chốt interface dùng chung và bảng cấu hình V03

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** NONE
- **FR:** FR-13
- **Acceptance refs:** AC-28, AC-30, PT-24
- **Work packages:** W01

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Có bộ interface/vectors và bảng config đủ rõ để triển khai loader, không viết lại năm tài liệu.

**Đầu vào và điều kiện bắt đầu:**

- Wire/ownership/quy tắc đã chốt trong tài liệu 01–05 và scaffold hiện có; không làm lại project.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5/11; 03 §2/3/12/18; config/README; review F08/F09. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Chốt RX/TX ownership; schema/error; DB transaction/clock/activity/generator/finalizer signatures; BP counter/pool từ 03 §18.4. Soạn bound/default/quan hệ của từng config và trình nhóm chốt, giữ wire/caps đã chọn. Hoàng Quân review DB/credit/canonical. Đầu ra config chỉ được dùng sau nhóm xác nhận; không tự đánh V03 đã duyệt.

**Các bước thực hiện:**

1. Đối chiếu wire/caps/ownership đã chốt; ghi rõ interface RX/TX/BP/DB/clock/activity/generator/finalizer và owner của từng đầu ra.
2. Lập bảng config required/default/bound/quan hệ cùng vectors hợp lệ và bị từ chối; Hoàng Quân review credit/DB, nhóm xác nhận V03 trước khi loader dùng.
3. Bàn giao cùng snapshot nguồn và danh sách quyết định đã chốt/còn thiếu cho T47/T09; không soạn lại năm tài liệu hoặc triển khai loader trong ticket này.

**Vùng mã dự kiến:** docs/planning, config/README.md và hợp đồng interface trong tài liệu 02/03/05; chưa viết loader. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Cấu hình đầy đủ/default được ghi rõ | Mọi trường config mẫu có kiểu, default hoặc required, bound và quan hệ; cùng accepted/rejected vectors cho C/TS. |
| Cap hoạt động/kết nối và BP credit | Phân biệt 50 activity/128 TCP/64 unauth; auth response giữ reservation thường, control không giữ trùng; mô tả mốc trả credit. |
| Interface và config sai có expected result | Nêu input/output/error/ownership và transaction owner của helper; config sai/khóa lạ/quan hệ sai có expected rejection. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Khóa interface nền và bảng cấu hình V03 để hai người code cùng hợp đồng.
- [ ] Nguồn/interface/vectors được review, V03 có trạng thái xác nhận rõ và consumer nhận đúng hợp đồng; chưa có loader chạy thật thì không ghi runtime PASS.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Review nguồn/interface/config table/vectors bằng tài liệu hiện hành; chạy kiểm offline backlog sau thay đổi ticket. Đây là kiểm tài liệu, không thay runtime loader/socket/DB. Ghi trạng thái nhóm chốt V03 và bàn giao cho T47; không nhận một lệnh build là bằng chứng config loader đã chạy.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: NONE
- Blocks: [EXAM-T47](sprint-1-tickets.md#exam-t47)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Minh Quân/Hoàng Quân nhận contract để bắt đầu song song. Không triển khai loader/codec/DB trong ticket này; không mở lại CRC.

**Checkpoint bảo vệ:** Vì sao byte cap và slot cap cùng cần có? Trả credit sau parse BP khác sau TCP enqueue thế nào?

**Truy vết nhập Jira:** `EXAM-T01`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t02"></a>

## EXAM-T02 — [Database] Tạo migration và repository tài khoản, phòng, thành viên, activity

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** NONE
- **FR:** FR-01, FR-02, FR-05, FR-06
- **Acceptance refs:** AC-01, AC-19, AC-20
- **Work packages:** W07, W09, W11

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Hoàng Quân có DDL phần Minh Quân để tích hợp DB ready; Minh Quân không đẩy toàn bộ schema cho Hoàng Quân.

**Đầu vào và điều kiện bắt đầu:**

- Wire/ownership/quy tắc đã chốt trong tài liệu 01–05 và scaffold hiện có; không làm lại project.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §8.2–8.3/9.1; 05 §2.1/4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Viết phần DDL Minh Quân theo 02 §8, users/auth_version, rooms/config_version/expiry, membership và user_activity. Prepared queries cơ bản, FK/unique/check/index và transaction helper signatures. Thống nhất số migration với Hoàng Quân khi ghép, không tự tạo runner thứ hai.

**Các bước thực hiện:**

1. Viết migration phần users/rooms/members/user_activity với NOT NULL/CHECK/FK/UNIQUE/index theo 02 §8; thống nhất version migration với Hoàng Quân.
2. Viết prepared repository queries nền cho user/phòng/activity, ID int64 qua BigInt/string; giữ transaction do caller sở hữu.
3. Dùng SQLite fixture kiểm DDL/constraints rồi giao cho runner T06; không tạo runner thứ hai hoặc chờ T06 Done mới bàn giao DDL.

**Vùng mã dự kiến:** db/migrations và apps/business/src/storage: phần users/rooms/members/activity do Minh Quân sở hữu. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| DDL mới trong fixture SQLite | DDL mới được kiểm bằng SQLite fixture, duplicate username/activity và FK sai bị chặn; T06 nhận DDL để ghép runner, không đợi runner xong mới bàn giao DDL. |
| Duplicate/FK/activity sai | Host có member từ create; release kiểm đúng resource/user, không xóa lịch sử khi disconnect. |
| Repository nhận ID và input không tin cậy | Repository dùng ID BigInt/string đúng boundary; không có SQL ghép dữ liệu người dùng. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Bàn giao migration và repository users/rooms/members/activity của Minh Quân.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: NONE
- Blocks: [EXAM-T06](sprint-1-tickets.md#exam-t06)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** DDL/repository cho T06/T12/T14/T18. Handler/UI và generator của Hoàng Quân ngoài phạm vi.

**Checkpoint bảo vệ:** CHECK một hàng có bảo đảm membership/capacity giữa nhiều bảng không? Vì sao cần transaction?

**Truy vết nhập Jira:** `EXAM-T02`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t03"></a>

## EXAM-T03 — [C Transport] Tách frame nhận và giữ phần dữ liệu dư

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** NONE
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** PT-01, PT-02, PT-13, PT-24
- **Work packages:** W02

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Bàn giao RX framer C đúng byte/thứ tự và ownership để validator/transport dùng lại.

**Đầu vào và điều kiện bắt đầu:**

- Wire/ownership/quy tắc đã chốt trong tài liệu 01–05 và scaffold hiện có; không làm lại project.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 03 §2/3.1/18.1; 05 §4 frame_feed. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Triển khai state header/payload và feed API dùng chung; uint32 BE, NET/IPC 65536 byte, BP 69632 byte. Kiểm length trước cấp phát; trả frame đầy đủ theo thứ tự, giữ phần dư. Bàn giao buffer ownership và cleanup; validation JSON thuộc T44.

**Các bước thực hiện:**

1. Triển khai state header/payload và feed API dùng chung.
2. uint32 BE, NET/IPC 65536 byte, BP 69632 byte.
3. Kiểm length trước cấp phát.
4. trả frame đầy đủ theo thứ tự, giữ phần dư.
5. Bàn giao buffer ownership và cleanup.
6. validation JSON thuộc T44.

**Vùng mã dự kiến:** src/common: RX framer/header/feed và tests C tương ứng. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Header chia 1+3 byte và payload nhiều chunk | chỉ xuất frame khi đủ byte. |
| Hai frame và nửa header trong một chunk | xuất hai frame, giữ đúng phần dư. |
| Length 0/1/vượt cap hoặc EOF giữa frame | không dispatch, không cấp phát theo length sai. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: RX framing C: tách frame từ luồng byte và giữ phần dư.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: NONE
- Blocks: [EXAM-T44](sprint-1-tickets.md#exam-t44)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** C RX feed API/vectors cho T44/T08/T11. Không parse schema nghiệp vụ hoặc viết lại JSON parser.

**Checkpoint bảo vệ:** Vì sao recv không phải một message? Khi header khai length quá lớn, từ chối ở đâu trước malloc?

**Truy vết nhập Jira:** `EXAM-T03`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t04"></a>

## EXAM-T04 — [Validation] Kiểm tra DTO trong TypeScript và Electron main

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** NONE
- **FR:** FR-02, FR-13
- **Acceptance refs:** AC-30, PT-24, PT-25
- **Work packages:** W02

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Main và Node từ chối cùng tập input sai, không tin type annotation hoặc JSON.parse tự phát hiện key trùng.

**Đầu vào và điều kiện bắt đầu:**

- Wire/ownership/quy tắc đã chốt trong tài liệu 01–05 và scaffold hiện có; không làm lại project.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 03 §2.4/3/5.1/9; 02 §4.3/10. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Helper schema hiện dùng: exact keys, required/optional/null/default, bounded integers/ID strings, UTF-8/depth/escape/duplicate-key trước parse mất thông tin. Whitelist preload/main và DTO error base; schema domain do owner handler thêm. Giữ validators gọn theo 03, không codegen/framework mới.

**Các bước thực hiện:**

1. Dựng strict decode/pre-parse guards và schema accessors cho optional/default/null, bounded integers, ID strings và exact allowed keys.
2. Áp helper ở boundary main/Node theo phần được giao; owner handler bổ sung schema domain, không dùng type annotation thay validation runtime.
3. Chạy cùng bộ vector C/TS cho duplicate decoded key/UTF-8/depth/unknown field và canonical default; ghi tầng từ chối để consumer map lỗi đúng.

**Vùng mã dự kiến:** apps/business/src/bridge, apps/business/src/domain và apps/desktop/src/shared: helper validation chung, schema domain do owner bổ sung. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Vectors C/TS tương đương | C/TS dùng cùng vectors cho thiếu/null/khóa lạ/duplicate decoded key/số 1.0/ID >2^53; default áp trước canonical. |
| JSON sai trước khi parse mất thông tin | Body lỗi trả INVALID_ARGUMENT và field an toàn khi envelope còn tin được; không log payload bí mật. |
| BP envelope và source IPC | BP depth 18 và payload NET depth 16 được xét đúng root; source IPC lạ không có quyền gọi API tùy ý. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Dựng validation TS/main và DTO boundary thống nhất với C.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: NONE
- Blocks: [EXAM-T45](sprint-1-tickets.md#exam-t45), [EXAM-T47](sprint-1-tickets.md#exam-t47), [EXAM-T51](sprint-1-tickets.md#exam-t51)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Helpers cho T10/T11/T12 và schema Minh Quân/Hoàng Quân; không viết mọi handler trong ticket này.

**Checkpoint bảo vệ:** Tại sao JSON.parse xong mới kiểm duplicate key là quá muộn? null khác thiếu thế nào?

**Truy vết nhập Jira:** `EXAM-T04`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t05"></a>

## EXAM-T05 — [C Transport] Mã hóa frame và quản lý hàng đợi gửi có giới hạn

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** NONE
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** PT-01, PT-03, PT-06
- **Work packages:** W03

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Bàn giao TX encoder/queue C gửi đủ byte và xử lý partial I/O có giới hạn.

**Đầu vào và điều kiện bắt đầu:**

- Wire/ownership/quy tắc đã chốt trong tài liệu 01–05 và scaffold hiện có; không làm lại project.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 03 §2/10.2/12.2/13.5/16.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Encode frame bất biến, enqueue với chuyển ownership tường minh, giữ offset khi send/write thiếu. Xử lý EINTR/EAGAIN/EPIPE, byte/slot/control reserve và POLLOUT. Chỉ một writer cho một descriptor; canonical fingerprint chuyển T45.

**Các bước thực hiện:**

1. Encode frame bất biến, enqueue với chuyển ownership tường minh, giữ offset khi send/write thiếu.
2. Xử lý EINTR/EAGAIN/EPIPE, byte/slot/control reserve và POLLOUT.
3. Chỉ một writer cho một descriptor.
4. canonical fingerprint chuyển T45.

**Vùng mã dự kiến:** src/common: TX encoder/queue/drain dùng lại ở src/client và src/server. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Partial send nhiều lượt | byte cuối khớp frame gốc, không lặp header/payload. |
| Ca 2 — Biên/lỗi hoặc cạnh tranh | EAGAIN thì chờ readiness; queue rỗng thì tắt writable interest, không busy loop. |
| Queue đầy/peer đóng | từ chối hoặc dọn đúng ownership, không SIGPIPE làm chết tiến trình. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: TX C: encoder, offset và queue gửi có giới hạn.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: NONE
- Blocks: [EXAM-T08](sprint-1-tickets.md#exam-t08)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** C TX queue/encoder cho reactor/client/BP; hash canonical nằm T45, không phải transport checksum.

**Checkpoint bảo vệ:** Tại sao send thành công chưa chứng minh DB đã lưu? Vì sao không gửi lại nguyên frame sau partial send?

**Truy vết nhập Jira:** `EXAM-T05`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t06"></a>

## EXAM-T06 — [Database] Tích hợp migration và bộ quản lý transaction SQLite

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T02
- **FR:** FR-01, FR-03, FR-07, FR-09, FR-13
- **Acceptance refs:** AC-27, AC-28, PT-23
- **Work packages:** W07

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Node chỉ ready khi DB/schema hợp lệ và wrapper có kết quả commit/rollback rõ.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T02](sprint-1-tickets.md#exam-t02): Bàn giao migration và repository users/rooms/members/activity của Minh Quân.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §8/11; 03 §10.4; review F10. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** DDL Hoàng Quân topics/questions/attempts/items/answers/operations/migrations theo 02; ghép DDL Minh Quân. node:sqlite một connection, prepared statements/BigInt, WAL/FULL/FK readback, schema version và K07. Cụ thể F10: đề xuất timeout 0 ms mặc định, ghi quyết định hiệu lực, không sleep/retry lock dài; phân biệt rollback xác định và outcome unknown.

**Các bước thực hiện:**

1. Ghép DDL Minh Quân/Hoàng Quân và migration runner tiến phiên bản; kiểm schema cũ/mới hơn và K07 trước ready, không tự reset/downgrade.
2. Mở một DatabaseSync connection với WAL/FULL/FK và readback, prepared statements/int64; cung cấp wrapper transaction không commit lồng.
3. Chốt timeout DB hiệu lực theo F10, inject SQLITE_BUSY/rollback/commit ambiguity và kiểm không ACK giả; dừng ghi nếu không xác định outcome.

**Vùng mã dự kiến:** apps/business/src/storage, db/migrations và tests SQLite. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| DB mới hoặc DB không đủ điều kiện startup | DB trống migrate đúng; schema mới hơn/migrate lỗi/DB cũ RUNNING hoặc OPEN không ready và không reset dữ liệu. |
| Constraints và transaction lồng | FK/CHECK/unique snapshot/answer/revision đúng; helper transaction không commit lồng. |
| SQLITE_BUSY/rollback/commit lỗi | không ACK giả; DB outcome unknown dừng ghi và có đường chẩn đoán. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T02](sprint-1-tickets.md#exam-t02)
- Blocks: [EXAM-T09](sprint-1-tickets.md#exam-t09), [EXAM-T14](sprint-1-tickets.md#exam-t14)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** DB runner/withTransaction/readiness và migrations dùng bởi mọi domain; lock launcher do T09, chưa thêm API admin mạng/reset.

**Checkpoint bảo vệ:** WAL có nhiều writer song song không? Vì sao DatabaseSync chờ lock lâu có thể làm timer trễ?

**Truy vết nhập Jira:** `EXAM-T06`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t07"></a>

## EXAM-T07 — [Operations] Lưu receipt, tra cứu thao tác và kiểm soát admission

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T12, EXAM-T45
- **FR:** FR-02, FR-08, FR-09, FR-13
- **Acceptance refs:** AC-08, AC-09, AC-29, PT-06, PT-23
- **Work packages:** W07, W09

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Mọi W ghi thay đổi+receipt atomically, có thể đối chiếu sau mất ACK và giữ phục vụ ca hiện hữu khi gần đầy.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- [EXAM-T05](sprint-1-tickets.md#exam-t05): TX C: encoder, offset và queue gửi có giới hạn.
- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T45](sprint-1-tickets.md#exam-t45): Canonical DTO và SHA-256 fingerprint với vector chuẩn.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 03 §7.1/10.2/10.5/12.3; 04 §5.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Lookup/record theo user+op và canonical SHA-256, no-op receipt, resource permission hook Minh Quân; operation.get DTO an toàn. Một C08 helper lấy mẫu DB/WAL/disk và counter operations sau commit; ma trận reject-new vs existing writes. Handler Minh Quân/Hoàng Quân dùng helper, không tạo ledger riêng.

**Các bước thực hiện:**

1. Tạo lookup/record/canonical fingerprint và receipt projection theo user+operation_id; W thay đổi và receipt cùng transaction, no-op thành công cũng có receipt.
2. Nối operation.get theo quyền hiện hành cùng Minh Quân; replay được tra trước state/deadline, found=false không suy lệnh cũ chắc chắn hết pending.
3. Hiện thực một policy C08 và counter/sampling DB-WAL/free disk; test reject-new/allow-existing theo ma trận, không purge và không bỏ receipt để tiết kiệm.

**Vùng mã dự kiến:** apps/business/src/storage và apps/business/src/domain: operations/admission helper, không tạo DB/ledger thứ hai. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Cùng op/body đã commit | Cùng op/body trả receipt không tăng revision; khác body OPERATION_CONFLICT; lỗi không commit không tạo receipt. |
| Replay sau hạn và quyền hiện hành | Replay sau quyền nhưng trước state/deadline vẫn được khi hết hạn; found=false không chứng minh lệnh cũ đã biến mất. |
| Ngưỡng admission và sampling lỗi | Fixture ngưỡng 768 MiB/900 k/free<1 GiB và sampling lỗi chặn nhận mới; save/submit/end/expiry còn xử lý nếu DB ghi được, không tự purge. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T45](sprint-1-tickets.md#exam-t45)
- Blocks: [EXAM-T15](sprint-1-tickets.md#exam-t15)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Ledger/policy và operation.get cho T15/T18/T19/T20/T21; Minh Quân cung cấp resolver quyền/session trong T12. Full disk fault ở T34.

**Checkpoint bảo vệ:** request_id khác operation_id thế nào? Receipt có thể thay thế snapshot hiện tại không?

**Truy vết nhập Jira:** `EXAM-T07`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t08"></a>

## EXAM-T08 — [C Server] Xử lý nhiều socket, hello, ping và timeout bằng reactor

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 4h
- **Depends on:** EXAM-T05, EXAM-T44
- **FR:** FR-13
- **Acceptance refs:** AC-17, AC-18, PT-03, PT-04
- **Work packages:** W04

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Nhiều TCP client được phục vụ công bằng, một peer chậm không chặn socket khác.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T03](sprint-1-tickets.md#exam-t03): RX framing C: tách frame từ luồng byte và giữ phần dư.
- [EXAM-T05](sprint-1-tickets.md#exam-t05): TX C: encoder, offset và queue gửi có giới hạn.
- [EXAM-T44](sprint-1-tickets.md#exam-t44): Validation C: UTF-8/JSON nghiêm ngặt và envelope theo kênh.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5; 03 §6/12/16.4; 04 §5.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Triển khai socket/bind/listen/accept/poll với nonblocking và generation. Áp caps 128/64, inflight 8, fair work budgets và rate transport. C xử lý hello/ping, hạn hello 5 s từ accept, partial frame 10 s, idle 35 s và slow TX 15 s. Launcher chỉ gọi listen sau Node ready; log sink riêng ở T46.

**Các bước thực hiện:**

1. Triển khai socket/bind/listen/accept/poll với nonblocking và generation.
2. Áp caps 128/64, inflight 8, fair work budgets và rate transport.
3. C xử lý hello/ping, hạn hello 5 s từ accept, partial frame 10 s, idle 35 s và slow TX 15 s.
4. Launcher chỉ gọi listen sau Node ready.
5. log sink riêng ở T46.

**Vùng mã dự kiến:** src/server/transport và tests C/socket harness. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Nhiều peer gửi frame chia/gộp | mỗi peer được phục vụ, không bỏ byte hoặc quay bận. |
| Hello sai/quá 5 s và frame gửi dở quá 10 s | đóng đúng peer, peer khỏe vẫn chạy. |
| Peer ngừng đọc | TX cap/timeout hiệu lực; ping không được hiểu là ACK lưu bài. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Server C reactor: nhiều socket, hello/ping và timer transport.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T05](sprint-1-tickets.md#exam-t05), [EXAM-T44](sprint-1-tickets.md#exam-t44)
- Blocks: [EXAM-T11](sprint-1-tickets.md#exam-t11), [EXAM-T46](sprint-1-tickets.md#exam-t46)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Reactor/transport hooks cho T09/T49/T11; không bao gồm logger hoặc handlers nghiệp vụ.

**Checkpoint bảo vệ:** poll writable có nghĩa gửi được cả frame không? Bật POLLOUT khi queue rỗng có hậu quả gì?

**Truy vết nhập Jira:** `EXAM-T08`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t09"></a>

## EXAM-T09 — [C Server] Khởi chạy Node, kế thừa khóa DB và dừng tiến trình

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T06, EXAM-T46, EXAM-T47
- **FR:** FR-13
- **Acceptance refs:** AC-28, PT-26, PT-28
- **Work packages:** W05

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Bàn giao launcher/lock/lifecycle C; Node dispatcher và routing là đầu ra các task khác.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T01](sprint-1-tickets.md#exam-t01): Khóa interface nền và bảng cấu hình V03 để hai người code cùng hợp đồng.
- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T08](sprint-1-tickets.md#exam-t08): Server C reactor: nhiều socket, hello/ping và timer transport.
- [EXAM-T47](sprint-1-tickets.md#exam-t47): Config loader C/TS: default, bound và đường dẫn nhất quán.
- [EXAM-T46](sprint-1-tickets.md#exam-t46): Log có giới hạn và drain stderr không chặn vòng I/O.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5/11; 03 §18.1–18.3; config/README. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Dùng effective config T47, flock cạnh DB và fd 3 sống qua exec. Spawn Node bằng argv không shell; nối pipe nonblocking, ready trước listen, startup/shutdown 10 s. Xử lý EOF/signals/kill/reap và giữ lock tới child đóng DB. Node input/dispatcher thuộc T48.

**Các bước thực hiện:**

1. Dùng effective config T47, flock cạnh DB và fd 3 sống qua exec.
2. Spawn Node bằng argv không shell.
3. nối pipe nonblocking, ready trước listen, startup/shutdown 10 s.
4. Xử lý EOF/signals/kill/reap và giữ lock tới child đóng DB.
5. Node input/dispatcher thuộc T48.

**Vùng mã dự kiến:** src/server/bridge và src/server/main.c: launcher/lifecycle/lock. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Config/exec/readiness lỗi | không listen, dọn pipe/child, exit khác 0. |
| Parent chết khi child còn DB | launcher thứ hai vẫn bị khóa; không unlink/LOCK_UN sớm. |
| Shutdown/EOF/SIGPIPE | cleanup hữu hạn, không zombie hoặc báo dừng sạch khi child chưa thoát. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: C launcher: spawn Node, khóa DB kế thừa và shutdown.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T06](sprint-1-tickets.md#exam-t06), [EXAM-T46](sprint-1-tickets.md#exam-t46), [EXAM-T47](sprint-1-tickets.md#exam-t47)
- Blocks: [EXAM-T48](sprint-1-tickets.md#exam-t48)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Launcher và BP lifecycle C với fixture/DB-ready child cho T48/T49/T16. Không chờ T49 Done mới bàn giao input contract.

**Checkpoint bảo vệ:** Tại sao chỉ thấy file .lock tồn tại chưa chứng minh khóa? Vì sao fd 3 phải sống qua exec?

**Truy vết nhập Jira:** `EXAM-T09`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t10"></a>

## EXAM-T10 — [Business Bridge] Gửi response, event và kiểm soát backpressure stdout

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T48
- **FR:** FR-02, FR-13
- **Acceptance refs:** PT-05, PT-26, PT-27, PT-28
- **Work packages:** W06

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Bàn giao output encoder/queue Node không chặn transaction khi stdout chậm.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- [EXAM-T05](sprint-1-tickets.md#exam-t05): TX C: encoder, offset và queue gửi có giới hạn.
- [EXAM-T48](sprint-1-tickets.md#exam-t48): Node BP input và dispatcher tuần tự với readiness thật.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5.2–5.4; 03 §18; review F09. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Encode BP output đúng schema/byte cap; queue hữu hạn, stdout.write(false) dừng dequeue tới drain. Response chỉ sau transaction commit; binding trước terminal auth/domain output. C routing và counter toàn đường thuộc T49.

**Các bước thực hiện:**

1. Encode BP output đúng schema/byte cap.
2. queue hữu hạn, stdout.write(false) dừng dequeue tới drain.
3. Response chỉ sau transaction commit.
4. binding trước terminal auth/domain output.
5. C routing và counter toàn đường thuộc T49.

**Vùng mã dự kiến:** apps/business/src/bridge: BP encoder/output queue; C receiver thuộc T49. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Stdout chậm/false | queue không vượt cap, không giữ transaction chờ drain. |
| Response sát cap và metadata | không phát frame quá 69632 byte payload hoặc lẫn log. |
| Binding đổi/revoke | output giữ đúng target/generation/epoch và thứ tự control trước terminal ACK. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Node BP output: serialize response/event và backpressure stdout.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T48](sprint-1-tickets.md#exam-t48)
- Blocks: [EXAM-T49](sprint-1-tickets.md#exam-t49)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Node encoder/output queue cho T49; chưa nhận BP end-to-end Done chỉ vì encode unit test đạt.

**Checkpoint bảo vệ:** Pipe ghi xong chứng minh gì? Vì sao cấp sẵn response credit trước dispatch?

**Truy vết nhập Jira:** `EXAM-T10`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t11"></a>

## EXAM-T11 — [C Client] Kết nối TCP, gửi heartbeat và ánh xạ IPC–NET

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T08, EXAM-T47
- **FR:** FR-10, FR-13
- **Acceptance refs:** AC-24, AC-25, PT-12, PT-25
- **Work packages:** W08

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Client C kết nối, đóng khung và chuyển IPC–NET đúng; Electron UI được ghép ở T50.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T01](sprint-1-tickets.md#exam-t01): Khóa interface nền và bảng cấu hình V03 để hai người code cùng hợp đồng.
- [EXAM-T03](sprint-1-tickets.md#exam-t03): RX framing C: tách frame từ luồng byte và giữ phần dư.
- [EXAM-T05](sprint-1-tickets.md#exam-t05): TX C: encoder, offset và queue gửi có giới hạn.
- [EXAM-T08](sprint-1-tickets.md#exam-t08): Server C reactor: nhiều socket, hello/ping và timer transport.
- [EXAM-T44](sprint-1-tickets.md#exam-t44): Validation C: UTF-8/JSON nghiêm ngặt và envelope theo kênh.
- [EXAM-T47](sprint-1-tickets.md#exam-t47): Config loader C/TS: default, bound và đường dẫn nhất quán.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §4/6; 03 §9/12/16.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Vòng I/O client xử lý stdin/stdout/TCP/timer, connect EINPROGRESS/SO_ERROR, hello/ping và local.ready/connect/status/shutdown. IPC/NET request mapping, NET active 8, timeout thường 5 s/auth 65 s, effect NONE/UNKNOWN và bounded retry. Electron main/preload chuyển T50.

**Các bước thực hiện:**

1. Vòng I/O client xử lý stdin/stdout/TCP/timer, connect EINPROGRESS/SO_ERROR, hello/ping và local.ready/connect/status/shutdown.
2. IPC/NET request mapping, NET active 8, timeout thường 5 s/auth 65 s, effect NONE/UNKNOWN và bounded retry.
3. Electron main/preload chuyển T50.

**Vùng mã dự kiến:** src/client và src/common: vòng I/O client C, mapping và timer. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Writable sau connect nhưng SO_ERROR khác 0 | báo lỗi và dọn socket, không báo connected giả. |
| NET timeout sau gửi W | UNKNOWN, không mutation nền; BUSY/RATE_LIMITED+NONE chỉ retry cùng op/body trong budget, tối đa 2 lần. |
| Pipe EOF/child shutdown/partial stream | dọn đúng queue/socket, không tự leave/nộp/logout. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Client C: connect/TCP heartbeat và mapping IPC–NET.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T08](sprint-1-tickets.md#exam-t08), [EXAM-T47](sprint-1-tickets.md#exam-t47)
- Blocks: [EXAM-T27](sprint-2-tickets.md#exam-t27), [EXAM-T50](sprint-1-tickets.md#exam-t50)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Client C/local protocol cho T50/T27; token resume chỉ C RAM, renderer không giữ token.

**Checkpoint bảo vệ:** Vì sao writable sau connect phải đọc SO_ERROR? Timeout local có hủy transaction server không?

**Truy vết nhập Jira:** `EXAM-T11`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t12"></a>

## EXAM-T12 — [Auth] Triển khai đăng ký, đăng nhập, đăng xuất và quản lý phiên

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T49, EXAM-T51
- **FR:** FR-01, FR-02, FR-10
- **Acceptance refs:** AC-01, AC-02, AC-25, PT-04, PT-05, PT-20
- **Work packages:** W09

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Auth API/session/authority hoạt động qua hash helper chung, không gom UI hoặc crypto primitive vào cùng task.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T02](sprint-1-tickets.md#exam-t02): Bàn giao migration và repository users/rooms/members/activity của Minh Quân.
- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T49](sprint-1-tickets.md#exam-t49): C BP routing/credit: chuyển output đúng TCP và giải phóng một lần.
- [EXAM-T51](sprint-1-tickets.md#exam-t51): Password scrypt async: queue hữu hạn và benchmark một job.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §7/9.8/10; 03 §6/16.1/18.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Dùng hash queue T51; register USER không tự login, login thay phiên/binding, logout revoke trước ACK. Callback quay dispatcher kiểm ticket/generation/auth_version/active. Token hash RAM, TTL 24 h/pin deadline+5 phút, rate auth IP/username và authority/state.get cho domain.

**Các bước thực hiện:**

1. Dùng hash queue T51.
2. register USER không tự login, login thay phiên/binding, logout revoke trước ACK.
3. Callback quay dispatcher kiểm ticket/generation/auth_version/active.
4. Token hash RAM, TTL 24 h/pin deadline+5 phút, rate auth IP/username và authority/state.get cho domain.

**Vùng mã dự kiến:** apps/business/src/auth, apps/business/src/domain và apps/business/src/storage: session/auth handlers/authority. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Register trùng hoặc USER tự xin ADMIN | từ chối đúng, không tự login hoặc nâng quyền. |
| Hash xong muộn/ticket hết hạn/binding đã đổi | không cấp phiên hoặc tạo user muộn. |
| Ca 3 — Tính toàn vẹn và bàn giao | Login mới revoke binding cũ; logout terminal ACK đúng route; ping không gia hạn phiên revoke. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Auth API/session: register/login/logout, authority và state.get.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T49](sprint-1-tickets.md#exam-t49), [EXAM-T51](sprint-1-tickets.md#exam-t51)
- Blocks: [EXAM-T07](sprint-1-tickets.md#exam-t07), [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T16](sprint-1-tickets.md#exam-t16), [EXAM-T23](sprint-1-tickets.md#exam-t23), [EXAM-T27](sprint-2-tickets.md#exam-t27)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Auth/state/permission helpers cho domain và UI T13; hash primitive T51, full transport recovery T27.

**Checkpoint bảo vệ:** Một hash async có đồng nghĩa không tốn RAM/CPU không? Session khác TCP và bài làm thế nào?

**Truy vết nhập Jira:** `EXAM-T12`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t13"></a>

## EXAM-T13 — [Auth UI] Tích hợp đăng ký, đăng nhập và đăng xuất qua bridge

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T12, EXAM-T50
- **FR:** FR-01, FR-02, FR-13
- **Acceptance refs:** AC-01, AC-25
- **Work packages:** W08, W09

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Hai tài khoản vào app bằng UI, thấy lỗi và trạng thái xác thực rõ.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T11](sprint-1-tickets.md#exam-t11): Client C: connect/TCP heartbeat và mapping IPC–NET.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T50](sprint-1-tickets.md#exam-t50): Electron main/preload: spawn client C, API whitelist và pending registry.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-01; 02 §4.3/6.1; 03 §9.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Auth forms/main API nối T11/T12, validate nhẹ UI/authoritative server, pending/loading và errors. Token lọc ở C, không renderer/localStorage. Logout intent ngừng thao tác mới/auto-resume, dọn context; luồng online thật S1, fault modes transport nghiệm thu T27, main/logout context ở T62.

**Các bước thực hiện:**

1. Nối form register/login với typed preload API và server thật; validate UI để hỗ trợ nhập, server vẫn quyết định credential/quyền.
2. Hiển thị pending/errors và phân biệt register với login; lọc token tại C, không localStorage hoặc đưa token lên renderer.
3. Nối logout intent/context cleanup, kiểm user khác không thấy dữ liệu cũ; chạy login trên máy LAN thứ hai thay vì chỉ localhost.

**Vùng mã dự kiến:** apps/desktop/src/renderer/src và API chức năng ở apps/desktop/src/shared; bridge nền T50. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Đăng ký/đăng nhập đúng hoặc sai | Register→login riêng; sai credential/trùng user hiển thị đúng, không treo UI khi hash chạy. |
| Logout rồi chuyển sang user khác | Logout ACK mới báo revoke server; user khác login không thấy draft/pending/callback user cũ. |
| Đăng nhập từ máy LAN thứ hai | Máy LAN thứ hai login được với config thực, không dùng mock để đánh Done. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Màn đăng ký/đăng nhập/đăng xuất qua bridge thật.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T50](sprint-1-tickets.md#exam-t50)
- Blocks: [EXAM-T29](sprint-2-tickets.md#exam-t29), [EXAM-T52](sprint-1-tickets.md#exam-t52)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Auth UI và shared input/error/status primitives phần Minh Quân. Không password reset/CRUD users.

**Checkpoint bảo vệ:** Renderer có thấy resume token không? Khi logout timeout nên thông báo gì?

**Truy vết nhập Jira:** `EXAM-T13`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t14"></a>

## EXAM-T14 — [Room] Tạo helper thời gian, deadline và activity dùng chung

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T06
- **FR:** FR-05, FR-06, FR-09, FR-11
- **Acceptance refs:** AC-19, AC-21, AC-26, PT-21, PT-22
- **Work packages:** W11, W15

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Hoàng Quân có t_admit và reserve/release contract thực để viết save/finalizer/practice mà không đợi start/end xong.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T02](sprint-1-tickets.md#exam-t02): Bàn giao migration và repository users/rooms/members/activity của Minh Quân.
- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 D03/D05; 02 §7.2/9; 03 §10.4/16.2. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Monotonic/UTC adapter, deadline and WAITING expiry scheduling, due timers trước command/yield; activity reserve/release trong transaction caller, global 50. Helper strict deadline sau BEGIN, timer register sau commit/cancel rollback. Một timer/resource, không thread/client.

**Các bước thực hiện:**

1. Tách UTC hiển thị/lưu DB với monotonic elapsed/deadline; định nghĩa t_admit sau BEGIN và strict nhỏ hơn deadline.
2. Cung cấp timer register/cancel/due với một timer/resource, đăng ký sau commit và kiểm lại state khi callback đến muộn.
3. Cung cấp reserve/release activity theo user/resource trong transaction caller; kiểm global 50 và early-submit EXAM còn giữ chỗ, bàn giao cho save/finalizer sớm.

**Vùng mã dự kiến:** apps/business/src/domain và apps/business/src/storage: clock/timer/activity helpers. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Mốc trước/bằng/sau deadline | Clock test trước/bằng/sau hạn và BEGIN chậm đúng C07; clock client không quyết định quyền. |
| Activity thứ hai hoặc release sai resource | Reserve thứ 51/hoạt động thứ hai bị chặn, release sai resource không giải phóng bài khác; early submit EXAM vẫn giữ chỗ. |
| Timer tới hạn/rollback/start race | Due timer khi client offline được gọi; callback chờ cũ kiểm state trước hủy RUNNING; timer chưa commit không tồn tại. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Clock/timer/activity helpers dùng chung trước handler thi.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T06](sprint-1-tickets.md#exam-t06)
- Blocks: [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T19](sprint-1-tickets.md#exam-t19)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Clock/activity/timer cho T18/T19/T20/T21/T30. Full room orchestration thuộc T21.

**Checkpoint bảo vệ:** UTC khác monotonic ra sao? Vì sao t_admit không lấy từ lúc reactor recv hoặc UI click?

**Truy vết nhập Jira:** `EXAM-T14`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t15"></a>

## EXAM-T15 — [Question Bank] Cung cấp danh sách chủ đề và số câu hỏi khả dụng

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T07
- **FR:** FR-02, FR-03, FR-04
- **Acceptance refs:** AC-02, AC-03, AC-04, PT-14, PT-24
- **Work packages:** W10

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Có topic/catalog/counts APIs đủ cho room config và bank consumer, không gom question handlers/seed vào cùng task.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-02/03; 02 §9.7; 03 §7.2/5.1. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** admin.topic.list/create/update và catalog.list; normalize name_key/version/inactive/cursor theo schema. Query counts chỉ khi topic+question đều active; all_available toàn kho. Public user chỉ nhận tên/counts, key/nội dung không xuất catalog; question mutation T54 và seed T55.

**Các bước thực hiện:**

1. admin.topic.list/create/update và catalog.list.
2. normalize name_key/version/inactive/cursor theo schema.
3. Query counts chỉ khi topic+question đều active.
4. all_available toàn kho.
5. Public user chỉ nhận tên/counts, key/nội dung không xuất catalog.
6. question mutation T54 và seed T55.

**Vùng mã dự kiến:** apps/business/src/domain và apps/business/src/storage: topic/catalog/availability. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Catalog nhiều trang | all_available không phải tổng trang hiện tại; cursor đúng hàng thực trả. |
| USER gọi mutation topic hoặc version cũ | FORBIDDEN/VERSION_CONFLICT, không ghi một phần. |
| Kho thiếu/sửa topic inactive | availability đổi cho lần sinh sau, snapshot đã gán không đổi. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Topic/catalog APIs và availability theo chủ đề/độ khó.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T07](sprint-1-tickets.md#exam-t07)
- Blocks: [EXAM-T17](sprint-1-tickets.md#exam-t17), [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T54](sprint-1-tickets.md#exam-t54)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Topic/catalog/availability cho T18/T17/T30; không form admin hoặc seed trong task này.

**Checkpoint bảo vệ:** Catalog đủ câu tại create có bảo đảm start vẫn đủ không? all_available có phải tổng trang hiện tại không?

**Truy vết nhập Jira:** `EXAM-T15`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t16"></a>

## EXAM-T16 — [Admin CLI] Tạo công cụ quản trị offline dùng chung khóa DB và hash

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T12
- **FR:** FR-01, FR-02, FR-03
- **Acceptance refs:** AC-27, AC-28
- **Work packages:** W10

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** DB mới có admin do nhóm thiết lập, không cần mật khẩu mặc định hoặc tự cấp quyền qua mạng.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T09](sprint-1-tickets.md#exam-t09): C launcher: spawn Node, khóa DB kế thừa và shutdown.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T51](sprint-1-tickets.md#exam-t51): Password scrypt async: queue hữu hạn và benchmark một job.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 C10/AC-27; 02 §11; config/README. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Node admin entry qua C launcher offline cùng flock/schema/hash/config; prompt username/password ẩn và khôi phục terminal; transaction INSERT ADMIN. Thêm tên lệnh/tham số thật và hướng dẫn chạy sau implement.

**Các bước thực hiện:**

1. Dùng launcher offline/khóa/config/schema chung, xác nhận server không sử dụng DB trước khi tạo admin.
2. Nhập username/password tương tác, ẩn echo và gọi hash helper chung; INSERT ADMIN trong transaction, từ chối username trùng thay vì nâng quyền.
3. Kiểm cleanup terminal/DB/lock cả khi interrupt hoặc rollback; bổ sung lệnh CLI thực và hướng dẫn bootstrap đã chạy.

**Vùng mã dự kiến:** apps/business/src/admin và storage/hash helpers; launcher offline gọi lại T09. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Tạo admin khi DB offline | Server đang dùng DB thì CLI bị khóa; CLI tạo thành công chỉ sau commit và account login được. |
| Trùng username và credential input | Trùng tên từ chối, không UPDATE role/password; không nhận password argv/env/log. |
| Interrupt/lỗi hoặc đổi cwd | Lỗi/interrupt khôi phục terminal, đóng DB và descriptor; chạy từ cwd khác vẫn đúng config path. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: CLI admin offline dùng khóa và hash chung.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T12](sprint-1-tickets.md#exam-t12)
- Blocks: [EXAM-T29](sprint-2-tickets.md#exam-t29)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Bootstrap cho T25/T29/runbook; API reset/user admin/network bootstrap ngoài phạm vi.

**Checkpoint bảo vệ:** Tại sao tạo admin offline vẫn cần khóa dữ liệu? Khi insert rollback có được báo tạo thành công không?

**Truy vết nhập Jira:** `EXAM-T16`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t17"></a>

## EXAM-T17 — [Exam] Sinh và lưu đề riêng cho từng thí sinh trong transaction

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T15
- **FR:** FR-04, FR-07, FR-10
- **Acceptance refs:** AC-04, AC-06, AC-07, PT-10
- **Work packages:** W12

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Tạo snapshot đề riêng đúng cấu hình và nguyên tử trong transaction của caller.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §8.3/9.2; 03 §7.3/12.2; 04 §2.2/5.2. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Random không hoàn lại theo counts/topic từ kho active, snapshot nội dung/nhãn/key để chấm. Chuẩn bị toàn roster hoặc rollback, không socket/drain/commit lồng; giải phóng dữ liệu tạm có giới hạn. API đọc/meta/items chuyển T56.

**Các bước thực hiện:**

1. Random không hoàn lại theo counts/topic từ kho active, snapshot nội dung/nhãn/key để chấm.
2. Chuẩn bị toàn roster hoặc rollback, không socket/drain/commit lồng.
3. giải phóng dữ liệu tạm có giới hạn.
4. API đọc/meta/items chuyển T56.

**Vùng mã dự kiến:** apps/business/src/domain và apps/business/src/storage: generator/snapshot. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| 4 dễ+5 trung bình+3 khó | đủ 12 câu, không lặp nội bộ; hai thí sinh có thể trùng câu. |
| Kho thiếu hoặc lỗi ở một người | caller rollback tất cả, không room/bài dở. |
| Sửa/ngừng câu nguồn sau sinh | snapshot/key chấm không đổi, không cần kho đủ 50 đề không trùng. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Generator: tạo snapshot đề riêng trong transaction caller.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T15](sprint-1-tickets.md#exam-t15)
- Blocks: [EXAM-T56](sprint-1-tickets.md#exam-t56)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Generator/transaction helper cho T21/T30; không endpoint trả toàn đề một frame.

**Checkpoint bảo vệ:** Kho có phải đủ 50×số câu không? Vì sao phải snapshot đáp án đúng thay vì chấm theo question hiện tại?

**Truy vết nhập Jira:** `EXAM-T17`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t18"></a>

## EXAM-T18 — [Room] Triển khai cấu hình, danh sách, tham gia, rời phòng và roster

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 4h
- **Depends on:** EXAM-T14, EXAM-T15
- **FR:** FR-04, FR-05, FR-06
- **Acceptance refs:** AC-04, AC-05, AC-19, AC-20, AC-21, PT-11, PT-15, PT-16
- **Work packages:** W11

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Có room core APIs/roster đúng reservation/quyền; UI và expiry được nghiệm thu riêng.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T14](sprint-1-tickets.md#exam-t14): Clock/timer/activity helpers dùng chung trước handler thi.
- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-03/04/04 b; 02 §9.1/9.1 b; 03 §7.1/8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Handlers room cơ bản với owner/member permission, config_version/availability, global 50 activity và một activity/user. Host tự member, join/leave đúng WAITING, roster membership bền+presence binding; event/throttle hooks. Cancel/expiry ở T53, UI ở T52.

**Các bước thực hiện:**

1. Handlers room cơ bản với owner/member permission, config_version/availability, global 50 activity và một activity/user.
2. Host tự member, join/leave đúng WAITING, roster membership bền+presence binding.
3. event/throttle hooks.
4. Cancel/expiry ở T53, UI ở T52.

**Vùng mã dự kiến:** apps/business/src/domain và apps/business/src/storage: room handlers/roster. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Create/join hợp lệ | reservation commit, host tự member; join lặp không nhân thành viên. |
| Đang có activity/nộp sớm hoặc người mới join RUNNING | không tạo hoạt động thứ hai. |
| Version cũ/người ngoài configure/close fd cũ | không ghi sai hoặc đánh offline binding mới. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Room backend: list/create/configure/get/join/leave và roster.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T14](sprint-1-tickets.md#exam-t14), [EXAM-T15](sprint-1-tickets.md#exam-t15)
- Blocks: [EXAM-T53](sprint-1-tickets.md#exam-t53)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Room APIs/roster cho T21/T52/T53; không gom cả UI/cancel/expiry vào cùng task.

**Checkpoint bảo vệ:** Mất mạng khác bấm Rời phòng thế nào? Tại sao tổng cap 50 phải kiểm trong transaction?

**Truy vết nhập Jira:** `EXAM-T18`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t19"></a>

## EXAM-T19 — [Exam] Lưu đáp án theo revision và xác nhận sau commit

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T14, EXAM-T56
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** AC-08, AC-10, AC-22, PT-06, PT-07, PT-21
- **Work packages:** W13

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Server lưu một lựa chọn theo revision và xác nhận chỉ sau commit answer+receipt.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T14](sprint-1-tickets.md#exam-t14): Clock/timer/activity helpers dùng chung trước handler thi.
- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T56](sprint-1-tickets.md#exam-t56): attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-06/D05; 02 §9.3; 03 §7.3/10.3–10.5. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Own-user/câu thuộc đề/OPEN/deadline theo t_admit sau BEGIN; CAS expected_revision, answer+receipt cùng transaction. Lỗi/conflict/NONE/UNKNOWN đúng contract; UI lựa chọn/ACK ở T57, không chấp nhận point/key do client khai.

**Các bước thực hiện:**

1. Own-user/câu thuộc đề/OPEN/deadline theo t_admit sau BEGIN.
2. CAS expected_revision, answer+receipt cùng transaction.
3. Lỗi/conflict/NONE/UNKNOWN đúng contract.
4. UI lựa chọn/ACK ở T57, không chấp nhận point/key do client khai.

**Vùng mã dự kiến:** apps/business/src/domain và apps/business/src/storage: answer.save/revision. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Cùng op/body retry | replay không tăng revision lần 2; cùng op khác body trả OPERATION_CONFLICT. |
| Revision cũ hoặc người khác/sau đóng/sau hạn | không ghi đè, trả đúng mã theo C07. |
| Ca 3 — Tính toàn vẹn và bàn giao | Commit thành công mất response còn receipt; rollback không ACK, không tự xóa ledger để tiết kiệm. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: answer.save backend: CAS revision và receipt sau commit.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T14](sprint-1-tickets.md#exam-t14), [EXAM-T56](sprint-1-tickets.md#exam-t56)
- Blocks: [EXAM-T20](sprint-1-tickets.md#exam-t20)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Save handler cho T57/T20/recovery; chưa đánh UI lưu bài Done từ test NET.

**Checkpoint bảo vệ:** Vì sao mỗi câu cần revision và operation_id cùng lúc? Làm sao ACK cũ không xác nhận lựa chọn vừa đổi?

**Truy vết nhập Jira:** `EXAM-T19`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t20"></a>

## EXAM-T20 — [Exam] Nộp bài và chấm điểm với một kết quả cuối cùng

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T19
- **FR:** FR-09, FR-11, FR-12
- **Acceptance refs:** AC-09, AC-10, AC-26, PT-08, PT-21, PT-22
- **Work packages:** W14

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Server chốt/chấm một lần và trả receipt đúng; luồng UI nộp được nghiệm thu riêng.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T14](sprint-1-tickets.md#exam-t14): Clock/timer/activity helpers dùng chung trước handler thi.
- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-07/D05–07; 02 §9.4/9.6; 03 §10.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Finalize_attempt/room dùng transaction caller, scoring snapshot/blank wrong/halfup 2 digits và reason. Submit receipt/no-op EARLY_SUBMIT, state/deadline/FINALIZATION_PENDING; EXAM giữ activity tới ENDED, PRACTICE release khi FINALIZED commit. UI nộp ở T58.

**Các bước thực hiện:**

1. Finalize_attempt/room dùng transaction caller, scoring snapshot/blank wrong/halfup 2 digits và reason.
2. Submit receipt/no-op EARLY_SUBMIT, state/deadline/FINALIZATION_PENDING.
3. EXAM giữ activity tới ENDED, PRACTICE release khi FINALIZED commit.
4. UI nộp ở T58.

**Vùng mã dự kiến:** apps/business/src/domain và apps/business/src/storage: submit/finalizer/scoring. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Early submit/hết giờ/host end và retry | một kết quả, giữ reason đã chốt, không chấm lại. |
| Deadline/DB chốt lỗi | khóa sửa, không công bố điểm một phần/ACK giả; receipt cũ vẫn replay. |
| Ca 3 — Tính toàn vẹn và bàn giao | 1/16 đúng→0.63; câu đã sửa kho không đổi key snapshot; PRACTICE và EXAM release đúng khác biệt. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Finalizer và attempt.submit backend: một kết quả chấm.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T19](sprint-1-tickets.md#exam-t19)
- Blocks: [EXAM-T21](sprint-1-tickets.md#exam-t21)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Submit/finalizer engine cho T21/T59/T22/T30; không chứa UI submit hoặc nested commit.

**Checkpoint bảo vệ:** Exactly-once effect có đồng nghĩa nhận response đúng một lần không? Vì sao không tính lại điểm từ kho đã sửa?

**Truy vết nhập Jira:** `EXAM-T20`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t21"></a>

## EXAM-T21 — [Room] Bắt đầu thi với roster cố định và tạo đề nguyên tử

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T20, EXAM-T53
- **FR:** FR-06, FR-07, FR-09
- **Acceptance refs:** AC-05, AC-09, AC-12, AC-26, PT-08, PT-11, PT-21, PT-22
- **Work packages:** W15

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Bắt đầu phòng và gán đề nguyên tử cho roster, bàn giao deadline để T59 quản lý kết thúc.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T14](sprint-1-tickets.md#exam-t14): Clock/timer/activity helpers dùng chung trước handler thi.
- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T18](sprint-1-tickets.md#exam-t18): Room backend: list/create/configure/get/join/leave và roster.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T53](sprint-1-tickets.md#exam-t53): WAITING cancel/expiry 30 phút và startup expiry.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-05/07; 02 §9.2/9.4; 03 §7.1/8/16.2. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Owner/WAITING/config_version/availability được kiểm lại, gọi Hoàng Quân generator cùng transaction để gán mọi member kể cả offline. Sau chuẩn bị đặt UTC/mono chung, commit RUNNING rồi register deadline/event. Kết thúc phòng/TIME_EXPIRED chuyển T59.

**Các bước thực hiện:**

1. Owner/WAITING/config_version/availability được kiểm lại, gọi Hoàng Quân generator cùng transaction để gán mọi member kể cả offline.
2. Sau chuẩn bị đặt UTC/mono chung, commit RUNNING rồi register deadline/event.
3. Kết thúc phòng/TIME_EXPIRED chuyển T59.

**Vùng mã dự kiến:** apps/business/src/domain: room.start orchestrator và timer registration. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Start đủ kho | mọi member một attempt/config đúng, chung deadline; không gửi key. |
| Thiếu câu/version cũ/lỗi giữa chừng | rollback không bài dở và không phát STARTED giả. |
| Join/start/cancel race | roster theo thứ tự commit, late join từ chối; timer WAITING cũ không hủy RUNNING. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: room.start backend: roster cố định và snapshot nguyên tử.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T20](sprint-1-tickets.md#exam-t20), [EXAM-T53](sprint-1-tickets.md#exam-t53)
- Blocks: [EXAM-T24](sprint-1-tickets.md#exam-t24), [EXAM-T34](sprint-2-tickets.md#exam-t34), [EXAM-T57](sprint-1-tickets.md#exam-t57), [EXAM-T59](sprint-1-tickets.md#exam-t59)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Start API/events cho T52/T57; clock/helper T14 đã có sớm, không tạo Block ngược từ save tới start UI.

**Checkpoint bảo vệ:** Nếu start commit xong nhưng một client chưa nhận đề, có rollback phòng không? Ai quyết định hết giờ?

**Truy vết nhập Jira:** `EXAM-T21`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t22"></a>

## EXAM-T22 — [Results] Cung cấp kết quả cá nhân và bảng điểm chủ phòng theo quyền

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T59
- **FR:** FR-09, FR-12
- **Acceptance refs:** AC-09, AC-14, PT-09
- **Work packages:** W16

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** API kết quả chỉ xuất dữ liệu được công bố theo owner/host; chưa bao gồm UI/history/chart.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T59](sprint-1-tickets.md#exam-t59): room.end/deadline: tự chốt phòng và công bố sau commit.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-10; 02 §8.5/9.4; 03 §7.4/8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** result.get và room.results dùng DTO PublishedResult, đúng owner/host và room ENDED. Làm tròn halfup, không key/chi tiết đáp án người khác; practice FINALIZED có thể công bố riêng. Result UI chuyển T60.

**Các bước thực hiện:**

1. result.get và room.results dùng DTO PublishedResult, đúng owner/host và room ENDED.
2. Làm tròn halfup, không key/chi tiết đáp án người khác.
3. practice FINALIZED có thể công bố riêng.
4. Result UI chuyển T60.

**Vùng mã dự kiến:** apps/business/src/domain và storage: result projections/permission. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| EXAM early submit/RUNNING | RESULTS_NOT_RELEASED, không lộ score hoặc correct_count. |
| ENDED | owner xem bài mình, host xem≤50 kết quả trong phòng; user khác đổi ID không đọc được. |
| Ca 3 — Tính toàn vẹn và bàn giao | Score tính từ correct/total đã lưu,1/16→0.63; không serialize row DB thô chứa key. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Result APIs: kết quả cá nhân và bảng chủ phòng đúng quyền.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T59](sprint-1-tickets.md#exam-t59)
- Blocks: [EXAM-T37](sprint-2-tickets.md#exam-t37), [EXAM-T60](sprint-1-tickets.md#exam-t60)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Result projection/APIs cho T60/T31; history/chart chưa được nhận Done trong ticket này.

**Checkpoint bảo vệ:** Vì sao attempt FINALIZED chưa đồng nghĩa result_available? Host được đọc những gì khác thí sinh?

**Truy vết nhập Jira:** `EXAM-T22`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t23"></a>

## EXAM-T23 — [Load Test] Tạo driver tải nhỏ và khung báo cáo Sprint 1

- **Epic:** EXAM-E04
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T12
- **FR:** FR-13
- **Acceptance refs:** AC-15, AC-16, AC-18
- **Work packages:** W23

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Có một runner dùng TCP thật cho behavior Hoàng Quân, thu timing/request IDs và status đúng.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T08](sprint-1-tickets.md#exam-t08): Server C reactor: nhiều socket, hello/ping và timer transport.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §3/6/8/9; 05 §2.1. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** tools/load driver interface/account config/timeline/correlation/summary; chuẩn seed/barrier hook cho S2; login 5 bot, timeout của transport và thống kê số gửi/ACK/errors. Không hard code secret/read.env dự án khác. Report NOT_RUN cho ca chưa chạy.

**Các bước thực hiện:**

1. Định nghĩa driver/behavior interface với Hoàng Quân: seed/ac counts/timeline/request/op/ACK trace và outcome/error classification.
2. Hiện thực runner TCP nhỏ/timeout/correlation/summary, có hook schedule/barrier cho S2; không đọc credential dự án khác hoặc ghi DB bypass.
3. Chạy driver với 5 kết nối/auth thật và behavior fixture tối thiểu, ghi lệnh/config/report mẫu. Bàn giao API runner/trace cho T24; luồng thi đầy đủ và oracle thuộc T24/T61, không là điều kiện Done quay ngược của driver.

**Vùng mã dự kiến:** tools/load: driver/network schedule skeleton và report mẫu. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Driver với 5 kết nối/auth qua TCP | Behavior fixture tối thiểu kiểm runner/timeout/trace trên NET thật, không ghi DB bypass; logical operations và network attempts được đếm riêng. Luồng thi đầy đủ nghiệm thu ở T24/T61. |
| Connection/auth/timeout thất bại | Fail connection/auth/timeout có summary không gọi là PASS vì process exit 0. |
| Command và trace bàn giao | Lệnh chạy/đầu vào/bằng chứng được bổ sung thật, raw trace không password/token/key. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Driver tải nhỏ và report skeleton để tích hợp từ S1.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T12](sprint-1-tickets.md#exam-t12)
- Blocks: [EXAM-T24](sprint-1-tickets.md#exam-t24), [EXAM-T32](sprint-2-tickets.md#exam-t32)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Runner/contract cho T24/T32; chỉ tải nhỏ, không claim 50 hoặc 9000 samples.

**Checkpoint bảo vệ:** Tại sao 50 socket rỗng không chứng minh 50 người thi? RTT khác logical latency thế nào?

**Truy vết nhập Jira:** `EXAM-T23`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t24"></a>

## EXAM-T24 — [Load Test] Mô phỏng đăng nhập, vào phòng, làm và nộp bài qua TCP

- **Epic:** EXAM-E04
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T21, EXAM-T23, EXAM-T55
- **FR:** FR-07, FR-08, FR-09, FR-13
- **Acceptance refs:** AC-06, AC-08, AC-09, AC-16
- **Work packages:** W24

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Bot tạo hành vi thi hợp lệ qua TCP và lưu ACK trace để verifier riêng đối soát.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T55](sprint-1-tickets.md#exam-t55): Seed test F/S/E tái lập qua công cụ offline dùng chung.
- [EXAM-T56](sprint-1-tickets.md#exam-t56): attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §2.2/6/8; 05 §2.1. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Theo driver contract T23,5 USER thực hiện flow NET và ghi request/op/latest ACK/revision. Có retry cùng op và lấy page; không bot đọc key admin hoặc ghi DB bypass. DB oracle chuyển T61.

**Các bước thực hiện:**

1. Theo driver contract T23,5 USER thực hiện flow NET và ghi request/op/latest ACK/revision.
2. Có retry cùng op và lấy page.
3. không bot đọc key admin hoặc ghi DB bypass.
4. DB oracle chuyển T61.

**Vùng mã dự kiến:** tools/load: hành vi bot qua NET, không ghi bypass DB. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| 5 bot join/start/lấy đề/save/submit | timeline đúng state, không nhầm attempt giữa users. |
| Save mất ACK hoặc retry | logical save không đếm hai và giữ same op/body. |
| Login/NET lỗi | báo riêng expected/actual/UNKNOWN, không success vì process exit 0. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Behavior bot nhỏ: login/join/nhận đề/lưu/nộp qua TCP thật.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T21](sprint-1-tickets.md#exam-t21), [EXAM-T23](sprint-1-tickets.md#exam-t23), [EXAM-T55](sprint-1-tickets.md#exam-t55)
- Blocks: [EXAM-T61](sprint-1-tickets.md#exam-t61)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Bot behavior/log ACK cho T23/T61/T33; chưa là load 50 hoặc kiểm dữ liệu bằng oracle.

**Checkpoint bảo vệ:** Tại sao không so final answer với mọi ACK cũ? Oracle đọc key ở đâu mà client thi không đọc được?

**Truy vết nhập Jira:** `EXAM-T24`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t25"></a>

## EXAM-T25 — [Sprint Review] Demo LAN, báo cáo bằng chứng và dự báo phần Minh Quân — Sprint 1

- **Epic:** EXAM-E04
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** NONE
- **FR:** FR-01, FR-05, FR-06, FR-13
- **Acceptance refs:** AC-15, AC-17, AC-18, AC-21
- **Work packages:** W26

**Cách review:** Buổi review/demo chung của Nguyễn Minh Quân và Đặng Hoàng Quân. Người phụ trách chuẩn bị phần bằng chứng được giao; cả hai đối chiếu goal, kết quả và phần còn lại trong cùng buổi. Không cần approval riêng hoặc PR rỗng cho cuộc họp; file evidence mới/sửa kết luận vẫn cần người còn lại kiểm tra trước merge.

**Mục tiêu:** Cuối sprint ghi trung thực goal đạt/chưa đạt và dữ liệu để quyết định S2.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T13](sprint-1-tickets.md#exam-t13): Màn đăng ký/đăng nhập/đăng xuất qua bridge thật.
- [EXAM-T18](sprint-1-tickets.md#exam-t18): Room backend: list/create/configure/get/join/leave và roster.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T22](sprint-1-tickets.md#exam-t22): Result APIs: kết quả cá nhân và bảng chủ phòng đúng quyền.
- [EXAM-T23](sprint-1-tickets.md#exam-t23): Driver tải nhỏ và report skeleton để tích hợp từ S1.
- [EXAM-T24](sprint-1-tickets.md#exam-t24): Behavior bot nhỏ: login/join/nhận đề/lưu/nộp qua TCP thật.
- [EXAM-T16](sprint-1-tickets.md#exam-t16): CLI admin offline dùng khóa và hash chung.
- [EXAM-T46](sprint-1-tickets.md#exam-t46): Log có giới hạn và drain stderr không chặn vòng I/O.
- [EXAM-T52](sprint-1-tickets.md#exam-t52): UI phòng chờ/host: catalog, cấu hình, roster và điều khiển thi.
- [EXAM-T53](sprint-1-tickets.md#exam-t53): WAITING cancel/expiry 30 phút và startup expiry.
- [EXAM-T57](sprint-1-tickets.md#exam-t57): UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu.
- [EXAM-T58](sprint-1-tickets.md#exam-t58): UI nộp bài: xác nhận ý định, đợi save và xử lý kết quả chưa rõ.
- [EXAM-T59](sprint-1-tickets.md#exam-t59): room.end/deadline: tự chốt phòng và công bố sau commit.
- [EXAM-T60](sprint-1-tickets.md#exam-t60): UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố.
- [EXAM-T61](sprint-1-tickets.md#exam-t61): Oracle S1: kiểm snapshot/ACK/revision/score độc lập.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** sprint-plan §2.3/2.6/4.1; 05 §8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Chuẩn bị và bàn giao demo checklist, evidence index và phần forecast/biên bản thuộc owner. Estimate 2 h =45 phút chuẩn bị gói +75 phút review/demo/retro chung; không làm thêm một vòng test toàn hệ thống hoặc tính buổi họp hai lần. Biên bản chỉ hoàn thành sau buổi thật.

**Các bước thực hiện:**

1. Gom lệnh build/start/seed đã dùng trên Linux, commit, config và evidence hai máy LAN. Đưa vào checklist demo và forecast trong 45 phút chuẩn bị.
2. Tham gia cùng buổi review/demo 60 phút và retro 15 phút với người còn lại; mỗi người tính 75 phút, không hai buổi riêng.
3. Demo đúng phần đã chạy, ghi goal/AC/PT/LT đạt hoặc thiếu; không lấy mock, build pass hoặc test một nhánh làm nghiệm thu toàn bộ.
4. Sau buổi thật, hoàn thành phần biên bản/bug owner/giờ còn lại và tối đa hai hành động retro; không tạo biên bản PASS trước khi họp.

**Vùng mã dự kiến:** docs/planning/reviews và gói demo/evidence index; biên bản chỉ tạo sau review thật. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Buổi review và demo LAN thực tế | Biên bản nêu goal/commit/config/seed, demo 2 UI và ca Minh Quân đã chạy; PASS/FAIL/NOT_RUN rõ, không nhận thầy đã nghiệm thu. |
| Evidence kỹ thuật còn thiếu/đã đạt | Deadline/slow peer/split gộp và expiry có bằng chứng hoặc ghi thiếu; compile pass không thay AC. |
| Carry-over và hành động retro | Forecast carry over theo giờ owner, tối đa 2 retro action; không chuyển Done issue chưa đạt hoặc auto-start/close Jira Sprint. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Chuẩn bị bằng chứng và sprint 1 review: demo LAN, technical evidence và forecast phần Minh Quân.
- [ ] Biên bản ghi riêng kết quả buổi review và kết luận sprint goal. Task review hoàn thành khi đã họp và ghi nhận đúng bằng chứng, kể cả khi goal chưa đạt.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Kiểm các liên kết evidence/commit/config/seed thực tế, chạy demo checklist trong buổi thật và ghi kết quả/giờ còn lại sau buổi; không sinh trước biên bản PASS. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Buổi review diễn ra theo lịch. Các ticket được dẫn ở phần đầu vào là nguồn evidence. Nếu còn thiếu, ghi trạng thái, giờ còn lại và ảnh hưởng đến sprint goal trong biên bản.

- Is blocked by: NONE
- Blocks: NONE
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Biên bản mới docs/planning/reviews/ chỉ tạo sau buổi thật; không prewrite PASS hoặc buổi đã diễn ra. Gói bàn giao gồm demo checklist, evidence index và phần biên bản/forecast; biên bản chỉ ghi sau buổi thật.

**Checkpoint bảo vệ:** Tự vẽ một request phần Minh Quân qua mọi tầng và chứng minh một error path bằng ca đã chạy.

**Truy vết nhập Jira:** `EXAM-T25`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t26"></a>

## EXAM-T26 — [Sprint Review] Demo bài thi, đối soát kết quả và dự báo phần Hoàng Quân — Sprint 1

- **Epic:** EXAM-E04
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** NONE
- **FR:** FR-07, FR-08, FR-09, FR-12
- **Acceptance refs:** AC-06, AC-08, AC-09, AC-14, AC-15
- **Work packages:** W24, W26

**Cách review:** Buổi review/demo chung của Nguyễn Minh Quân và Đặng Hoàng Quân. Người phụ trách chuẩn bị phần bằng chứng được giao; cả hai đối chiếu goal, kết quả và phần còn lại trong cùng buổi. Không cần approval riêng hoặc PR rỗng cho cuộc họp; file evidence mới/sửa kết luận vẫn cần người còn lại kiểm tra trước merge.

**Mục tiêu:** Hoàng Quân chứng minh đề/lưu/nộp/điểm đúng bằng UI và oracle, không chỉ kể API đã viết.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T22](sprint-1-tickets.md#exam-t22): Result APIs: kết quả cá nhân và bảng chủ phòng đúng quyền.
- [EXAM-T23](sprint-1-tickets.md#exam-t23): Driver tải nhỏ và report skeleton để tích hợp từ S1.
- [EXAM-T24](sprint-1-tickets.md#exam-t24): Behavior bot nhỏ: login/join/nhận đề/lưu/nộp qua TCP thật.
- [EXAM-T54](sprint-1-tickets.md#exam-t54): Question APIs: list/thêm/sửa/ngừng dùng và version conflict.
- [EXAM-T55](sprint-1-tickets.md#exam-t55): Seed test F/S/E tái lập qua công cụ offline dùng chung.
- [EXAM-T57](sprint-1-tickets.md#exam-t57): UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu.
- [EXAM-T58](sprint-1-tickets.md#exam-t58): UI nộp bài: xác nhận ý định, đợi save và xử lý kết quả chưa rõ.
- [EXAM-T60](sprint-1-tickets.md#exam-t60): UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố.
- [EXAM-T61](sprint-1-tickets.md#exam-t61): Oracle S1: kiểm snapshot/ACK/revision/score độc lập.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** sprint-plan §2.3/2.7; 04 §6; 05 §8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

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
| Demo bài thi/điểm theo quyền | Demo đề riêng/save ACK/nộp sớm chưa điểm/host end kết quả đúng; oracle có summary khớp hoặc ghi FAIL rõ. |
| Giải thích TX/receipt và phần PT đã chạy | Giải thích partial send/receipt/CAS/rollback; phân biệt ca PT đã chạy một phần với toàn PT PASS. |
| Forecast phần Hoàng Quân | Đưa giờ còn lại/bug owner và retro action vào biên bản chung; không gán điểm cá nhân hoặc sửa scope để báo xong. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Chuẩn bị bằng chứng và sprint 1 review: demo bài thi/oracle và forecast phần Hoàng Quân.
- [ ] Biên bản ghi riêng kết quả buổi review và kết luận sprint goal. Task review hoàn thành khi đã họp và ghi nhận đúng bằng chứng, kể cả khi goal chưa đạt.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Kiểm các liên kết evidence/commit/config/seed thực tế, chạy demo checklist trong buổi thật và ghi kết quả/giờ còn lại sau buổi; không sinh trước biên bản PASS. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Buổi review diễn ra theo lịch. Các ticket được dẫn ở phần đầu vào là nguồn evidence. Nếu còn thiếu, ghi trạng thái, giờ còn lại và ảnh hưởng đến sprint goal trong biên bản.

- Is blocked by: NONE
- Blocks: NONE
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Hoàng Quân evidence/forecast vào biên bản chung T25, S2 nhận carry over thật. Gói bàn giao gồm demo checklist, evidence index và phần biên bản/forecast; biên bản chỉ ghi sau buổi thật.

**Checkpoint bảo vệ:** Mất response sau commit xử lý thế nào? Chứng minh nộp lại không tạo kết quả thứ hai.

**Truy vết nhập Jira:** `EXAM-T26`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t44"></a>

## EXAM-T44 — [Validation] Kiểm tra UTF-8, JSON và envelope theo kênh trong C

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T03
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** PT-01, PT-02, PT-13, PT-24
- **Work packages:** W02

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Validation C: UTF-8/JSON nghiêm ngặt và envelope theo kênh để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T03](sprint-1-tickets.md#exam-t03): RX framing C: tách frame từ luồng byte và giữ phần dư.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 03 §2/3.1/18.1; 05 §4 frame_feed. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Kiểm UTF-8/token/escape/depth trước parse mất thông tin; dùng cJSON, kiểm root/end pointer/decoded duplicate keys/envelope. Áp depth 16 cho NET/IPC và 18 cho BP; phân biệt frame/envelope lỗi với body nghiệp vụ lỗi.

**Các bước thực hiện:**

1. Kiểm UTF-8/token/escape/depth trước parse mất thông tin.
2. dùng cJSON, kiểm root/end pointer/decoded duplicate keys/envelope.
3. Áp depth 16 cho NET/IPC và 18 cho BP.
4. phân biệt frame/envelope lỗi với body nghiệp vụ lỗi.

**Vùng mã dự kiến:** src/common và tests C: strict JSON/UTF-8/envelope. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| `"type"` và `"\u0074ype"` cùng xuất hiện | Coi là duplicate key sau decode, đóng kênh theo đặc tả. |
| NUL, surrogate lẻ, UTF-8 lỗi, trailing JSON hoặc depth vượt giới hạn | không chạy command. |
| JSON/envelope đúng nhưng body sai | caller nhận lỗi đủ phân loại để trả INVALID_ARGUMENT ở tầng handler. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Validation C: UTF-8/JSON nghiêm ngặt và envelope theo kênh.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T03](sprint-1-tickets.md#exam-t03)
- Blocks: [EXAM-T08](sprint-1-tickets.md#exam-t08), [EXAM-T47](sprint-1-tickets.md#exam-t47)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Validator C và vector lỗi cho T08/T10/T11/T49; schema nghiệp vụ TS vẫn do owner handler thực hiện.

**Checkpoint bảo vệ:** Vì sao phải so key sau decode và kiểm UTF-8/NUL trước parse? Một lần recv đủ byte có chứng minh JSON hợp lệ không?

**Truy vết nhập Jira:** `EXAM-T44`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t45"></a>

## EXAM-T45 — [Operations] Chuẩn hóa DTO và tạo SHA-256 fingerprint theo vector chuẩn

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T04
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** PT-01, PT-03, PT-06
- **Work packages:** W03

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Canonical DTO và SHA-256 fingerprint với vector chuẩn để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 03 §2/10.2/12.2/13.5/16.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Hiện thực canonical của type+body hợp lệ trong Node; default/normalize trước canonical, sort key ASCII, giữ thứ tự array/Unicode. Đưa vector byte/digest vào bộ kiểm chung để ledger dùng đúng một implementation.

**Các bước thực hiện:**

1. Hiện thực canonical của type+body hợp lệ trong Node.
2. default/normalize trước canonical, sort key ASCII, giữ thứ tự array/Unicode.
3. Đưa vector byte/digest vào bộ kiểm chung để ledger dùng đúng một implementation.

**Vùng mã dự kiến:** apps/business/src/domain hoặc storage helper hiện hành: canonical/fingerprint và vectors. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Key đảo thứ tự hoặc integer 1.0 tương đương 1 sau validate | cùng canonical/fingerprint. |
| Vector answer.save của 03 §13.5 | đúng 107 byte và digest đã công bố, không LF cuối. |
| Body khác nhưng op giữ nguyên | fingerprint khác; password/token không đưa vào ledger. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Canonical DTO và SHA-256 fingerprint với vector chuẩn.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Chạy npm run typecheck:business và npm run check:business, bổ sung vector tests canonical/digest thật cho schema đang dùng. Kiểm same-value integer/default/key order và byte count; không chạy C/desktop suite chỉ để thay bằng chứng Node canonical.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T04](sprint-1-tickets.md#exam-t04)
- Blocks: [EXAM-T07](sprint-1-tickets.md#exam-t07)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Canonical helper/vectors cho T07; không thêm CRC/MAC hoặc chuẩn canonical tổng quát ngoài schema v1.

**Checkpoint bảo vệ:** Vì sao hash raw JSON có thể khác dù cùng ý định? Fingerprint này có mã hóa hoặc bảo vệ chống giả mạo không?

**Truy vết nhập Jira:** `EXAM-T45`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t46"></a>

## EXAM-T46 — [Logging] Giới hạn log và đọc stderr không chặn vòng I/O

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T08
- **FR:** FR-13
- **Acceptance refs:** AC-17, AC-18, PT-03, PT-04
- **Work packages:** W04

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Log có giới hạn và drain stderr không chặn vòng I/O để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T08](sprint-1-tickets.md#exam-t08): Server C reactor: nhiều socket, hello/ping và timer transport.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5; 03 §6/12/16.4; 04 §5.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Định dạng timestamp/severity/correlation IDs, line 1 KiB, queue 1 MiB, dropped counter và rotation 5×10 MiB theo destination đã chọn. C đọc stderr child qua poll; Node/module phát log theo cùng quy tắc lọc. Không xây logging framework.

**Các bước thực hiện:**

1. Định dạng timestamp/severity/correlation IDs, line 1 KiB, queue 1 MiB, dropped counter và rotation 5×10 MiB theo destination đã chọn.
2. C đọc stderr child qua poll.
3. Node/module phát log theo cùng quy tắc lọc.
4. Không xây logging framework.

**Vùng mã dự kiến:** src/server/transport, src/server/bridge và helper log tại apps/business/src/bridge. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Child ghi stderr dồn | C vẫn phục vụ socket, queue/drop counter giữ giới hạn. |
| Ca 2 — Biên/lỗi hoặc cạnh tranh | Log chứa request/op/generation để truy vết nhưng không password/token/đề/key/lựa chọn thí sinh. |
| Sink lỗi/queue đầy | có chẩn đoán hữu hạn, stdout IPC/BP vẫn chỉ là frame. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Log có giới hạn và drain stderr không chặn vòng I/O.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T08](sprint-1-tickets.md#exam-t08)
- Blocks: [EXAM-T09](sprint-1-tickets.md#exam-t09)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Log helper/sink và stderr drain hook cho T09/T40; không coi log là bằng chứng DB commit.

**Checkpoint bảo vệ:** Nếu child ghi stderr mà parent không đọc thì có thể ảnh hưởng socket thế nào? Vì sao stdout không được lẫn log?

**Truy vết nhập Jira:** `EXAM-T46`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t47"></a>

## EXAM-T47 — [Config] Nạp và kiểm tra cấu hình, giá trị mặc định và đường dẫn trong C/TS

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T01, EXAM-T04, EXAM-T44
- **FR:** FR-13
- **Acceptance refs:** AC-28, PT-26, PT-28
- **Work packages:** W05

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Config loader C/TS: default, bound và đường dẫn nhất quán để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T01](sprint-1-tickets.md#exam-t01): Khóa interface nền và bảng cấu hình V03 để hai người code cùng hợp đồng.
- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5/11; 03 §18.1–18.3; config/README. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Sau nhóm chốt V03, hiện thực loader một file JSON cho server/client và business config. Resolve path từ configdir, default chỉ khi thiếu, từ chối unknown/duplicate/null/sai kiểu/quan hệ. Không tự mở mọi cap thành tùy chọn.

**Các bước thực hiện:**

1. Sau nhóm chốt V03, hiện thực loader một file JSON cho server/client và business config.
2. Resolve path từ configdir, default chỉ khi thiếu, từ chối unknown/duplicate/null/sai kiểu/quan hệ.
3. Không tự mở mọi cap thành tùy chọn.

**Vùng mã dự kiến:** config, src/server/bridge, src/client và apps/business/src/config. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Đổi cwd nhưng cùng config | trỏ cùng DB/log/entry; IPv4 server target không dùng 0.0.0.0. |
| Thiếu required, khóa lạ hoặc cap sai quan hệ | báo đúng field, dừng trước listen. |
| Omit optional có default | C/TS ra cùng effective config theo vectors đã duyệt. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Config loader C/TS: default, bound và đường dẫn nhất quán.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T01](sprint-1-tickets.md#exam-t01), [EXAM-T04](sprint-1-tickets.md#exam-t04), [EXAM-T44](sprint-1-tickets.md#exam-t44)
- Blocks: [EXAM-T09](sprint-1-tickets.md#exam-t09), [EXAM-T11](sprint-1-tickets.md#exam-t11)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Effective config/loaders cho T09/T11/T48; T01 soạn quyết định, T47 không tự coi V03 đã duyệt.

**Checkpoint bảo vệ:** Đổi cwd có được làm đổi DB không? Trường bị thiếu khác trường null/sai kiểu thế nào?

**Truy vết nhập Jira:** `EXAM-T47`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t48"></a>

## EXAM-T48 — [Business Bridge] Nhận BP, điều phối tuần tự và phát tín hiệu sẵn sàng

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T09
- **FR:** FR-13
- **Acceptance refs:** AC-28, PT-26, PT-28
- **Work packages:** W05

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Node BP input và dispatcher tuần tự với readiness thật để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T09](sprint-1-tickets.md#exam-t09): C launcher: spawn Node, khóa DB kế thừa và shutdown.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5/11; 03 §18.1–18.3; config/README. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Decode BP input có cap, nhận init/opened/request/closed/shutdown FIFO. Mở DB/migrate/K07 qua wrapper chung trước ready. Dispatcher một handler tới hết transaction rồi nhường event loop; có hook timer/hash completion, không await socket/drain trong transaction.

**Các bước thực hiện:**

1. Decode BP input có cap, nhận init/opened/request/closed/shutdown FIFO.
2. Mở DB/migrate/K07 qua wrapper chung trước ready.
3. Dispatcher một handler tới hết transaction rồi nhường event loop.
4. có hook timer/hash completion, không await socket/drain trong transaction.

**Vùng mã dự kiến:** apps/business/src/bridge, apps/business/src/main.ts và dispatcher hooks. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| opened→request→closed cùng generation | Node quan sát đúng thứ tự, không nhận metadata user do NET khai. |
| DB/schema/K07 hoặc init sai | không phát ready thành công. |
| Command dồn | queue hữu hạn, nhường event loop giữa handler; output được bàn giao T10/T49 qua contract. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Node BP input và dispatcher tuần tự với readiness thật.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T09](sprint-1-tickets.md#exam-t09)
- Blocks: [EXAM-T10](sprint-1-tickets.md#exam-t10)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Input/dispatcher/readiness Node cho auth/domain/T10. Dùng fixture output để nghiệm thu input, T49 ghép toàn đường về TCP.

**Checkpoint bảo vệ:** Vì sao Node nhường event loop giữa command? DatabaseSync có thể làm timer trễ dù C vẫn ping thành công không?

**Truy vết nhập Jira:** `EXAM-T48`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t49"></a>

## EXAM-T49 — [C Server] Định tuyến BP đến đúng TCP và hoàn trả credit một lần

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T10
- **FR:** FR-02, FR-13
- **Acceptance refs:** PT-05, PT-26, PT-27, PT-28
- **Work packages:** W06

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** C BP routing/credit: chuyển output đúng TCP và giải phóng một lần để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T03](sprint-1-tickets.md#exam-t03): RX framing C: tách frame từ luồng byte và giữ phần dư.
- [EXAM-T05](sprint-1-tickets.md#exam-t05): TX C: encoder, offset và queue gửi có giới hạn.
- [EXAM-T08](sprint-1-tickets.md#exam-t08): Server C reactor: nhiều socket, hello/ping và timer transport.
- [EXAM-T10](sprint-1-tickets.md#exam-t10): Node BP output: serialize response/event và backpressure stdout.
- [EXAM-T44](sprint-1-tickets.md#exam-t44): Validation C: UTF-8/JSON nghiêm ngặt và envelope theo kênh.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §5.2–5.4; 03 §18; review F09. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Decode completion/control trong C; mirror binding, đối chiếu ticket/request/type/op/generation/epoch. Bảng counter ordinary/control/event credits theo 03 §18.4: auth response không tính hai reservation, credit trả sau TCP enqueue/drop đúng target.

**Các bước thực hiện:**

1. Decode completion/control trong C.
2. mirror binding, đối chiếu ticket/request/type/op/generation/epoch.
3. Bảng counter ordinary/control/event credits theo 03 §18.4: auth response không tính hai reservation, credit trả sau TCP enqueue/drop đúng target.

**Vùng mã dự kiến:** src/server/bridge, src/server/transport và tests: routing/credit C. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| fd tái sử dụng/revoke hoặc completion cũ | không đưa dữ liệu sang binding mới. |
| Logout revoke rồi ACK | terminal exception chỉ đúng whitelist/ticket, không mất ACK hoặc cho domain response đi nhầm. |
| Saturation/EOF/close | cap/control reserve còn đúng, credit trả một lần; 50 auth responses dùng pool thường, không dồn riêng 512 KiB. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: C BP routing/credit: chuyển output đúng TCP và giải phóng một lần.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T10](sprint-1-tickets.md#exam-t10)
- Blocks: [EXAM-T12](sprint-1-tickets.md#exam-t12)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** BP roundtrip Node→C→TCP thật cùng T09/T48/T10; hash/domain handler dùng routing này, không bypass C.

**Checkpoint bảo vệ:** Credit được trả lúc parse BP hay lúc TCP TX nhận output? Vì sao auth logout cần terminal-response exception?

**Truy vết nhập Jira:** `EXAM-T49`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t50"></a>

## EXAM-T50 — [Electron Bridge] Khởi chạy client C, giới hạn API và quản lý pending

- **Epic:** EXAM-E01
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T11
- **FR:** FR-10, FR-13
- **Acceptance refs:** AC-24, AC-25, PT-12, PT-25
- **Work packages:** W08

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Electron main/preload: spawn client C, API whitelist và pending registry để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- [EXAM-T11](sprint-1-tickets.md#exam-t11): Client C: connect/TCP heartbeat và mapping IPC–NET.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §4/6; 03 §9/12/16.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Spawn client C bằng pipe không shell, limited preload API/sender validation. Giữ pending 32 trong main theo user/instance, đọc snapshot/subscription; stream hard cap 256 KiB/32 frames. Một child/TCP qua renderer reload; phối hợp theme/component nền Minh Quân với Hoàng Quân.

**Các bước thực hiện:**

1. Spawn client C bằng pipe không shell, limited preload API/sender validation.
2. Giữ pending 32 trong main theo user/instance, đọc snapshot/subscription.
3. stream hard cap 256 KiB/32 frames.
4. Một child/TCP qua renderer reload.
5. phối hợp theme/component nền Minh Quân với Hoàng Quân.

**Vùng mã dự kiến:** apps/desktop/src/main, apps/desktop/src/preload và apps/desktop/src/shared. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Renderer xin type tùy ý/token hoặc nguồn IPC khác | bị từ chối; không xuất ipcRenderer thô. |
| Renderer reload khi pending | main giữ request đã nhận, UI đọc lại registry; không spawn C thứ hai. |
| Child chết/protocol lỗi/logout context đổi | NONE/UNKNOWN đúng mức, callback user cũ không vào user mới. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Electron main/preload: spawn client C, API whitelist và pending registry.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** C: npm run configure:native, npm run build:native, npm run check:native khi chạm C. TS/main: npm run check khi chạm desktop/business. Các version smoke test có sẵn không thay ca frame/partial I/O/pipe/authority mới; task phải bổ sung và ghi lệnh chạy đúng các ca ở bảng. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T11](sprint-1-tickets.md#exam-t11)
- Blocks: [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T57](sprint-1-tickets.md#exam-t57), [EXAM-T62](sprint-2-tickets.md#exam-t62)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Desktop bridge cho T13/T52/T57/T60; recovery fault đầy đủ T62, không durable offline draft.

**Checkpoint bảo vệ:** Renderer reload có được spawn client C thứ hai không? Vì sao không xuất ipcRenderer hoặc resume token cho UI?

**Truy vết nhập Jira:** `EXAM-T50`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t51"></a>

## EXAM-T51 — [Auth] Băm mật khẩu scrypt bất đồng bộ và giới hạn hàng đợi

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T04
- **FR:** FR-01, FR-02, FR-10
- **Acceptance refs:** AC-01, AC-02, AC-25, PT-04, PT-05, PT-20
- **Work packages:** W09

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Password scrypt async: queue hữu hạn và benchmark một job để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T04](sprint-1-tickets.md#exam-t04): Dựng validation TS/main và DTO boundary thống nhất với C.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §7/9.8/10; 03 §6/16.1/18.3. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** node:crypto.scrypt async với N 65536,r 8,p 1,salt 16 byte,key 32 byte,maxmem 96 MiB. Một running+64 waiting, job 60 s, không giữ transaction trong hash. Lưu algorithm/version/params; verify timingSafeEqual, cleanup secret khi có thể; callback không tự cấp authority.

**Các bước thực hiện:**

1. node:crypto.scrypt async với N 65536,r 8,p 1,salt 16 byte,key 32 byte,maxmem 96 MiB.
2. Một running+64 waiting, job 60 s, không giữ transaction trong hash.
3. Lưu algorithm/version/params.
4. verify timingSafeEqual, cleanup secret khi có thể.
5. callback không tự cấp authority.

**Vùng mã dự kiến:** apps/business/src/auth và kiểm thử hash/ticket queue. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Password đúng/sai và Unicode hợp lệ | verify đúng; không trim/normalize hoặc log plain text. |
| Queue đầy/job hết hạn/hủy | Không cấp user/session từ kết quả đã hủy/hết hạn; khi BP còn sống, request đã nhận có một response lỗi để C kết thúc ticket. Callback muộn không response lần hai; hash slot đang chạy giữ tới callback thật. |
| Ca 3 — Tính toàn vẹn và bàn giao | Linux benchmark ghi elapsed/peak RSS và runtime; không suy 50 login≤60 s chỉ từ số slot. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Password scrypt async: queue hữu hạn và benchmark một job.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T04](sprint-1-tickets.md#exam-t04)
- Blocks: [EXAM-T12](sprint-1-tickets.md#exam-t12)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Hash helper cho T12/T16/T55; không tự giảm chất lượng hash để đạt tải, không bcrypt/SHA thuần.

**Checkpoint bảo vệ:** Tại sao một hash workspace khoảng 64 MiB nhưng 64 job chờ không được cùng chạy? Vì sao queue chứa được 50 job không chứng minh login xong 60 s?

**Truy vết nhập Jira:** `EXAM-T51`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t52"></a>

## EXAM-T52 — [Room UI] Hiển thị cấu hình, phòng chờ, roster và điều khiển thi

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T13, EXAM-T59
- **FR:** FR-04, FR-05, FR-06
- **Acceptance refs:** AC-04, AC-05, AC-19, AC-20, AC-21, PT-11, PT-15, PT-16
- **Work packages:** W11

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** UI phòng chờ/host: catalog, cấu hình, roster và điều khiển thi để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T13](sprint-1-tickets.md#exam-t13): Màn đăng ký/đăng nhập/đăng xuất qua bridge thật.
- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- [EXAM-T18](sprint-1-tickets.md#exam-t18): Room backend: list/create/configure/get/join/leave và roster.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T50](sprint-1-tickets.md#exam-t50): Electron main/preload: spawn client C, API whitelist và pending registry.
- [EXAM-T53](sprint-1-tickets.md#exam-t53): WAITING cancel/expiry 30 phút và startup expiry.
- [EXAM-T59](sprint-1-tickets.md#exam-t59): room.end/deadline: tự chốt phòng và công bố sau commit.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-03/04/04 b; 02 §9.1/9.1 b; 03 §7.1/8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Nối room list/config/create/join/leave/cancel và host start/end bằng bridge thật; counts/topic từ catalog. Hiển thị roster/presence, hạn chờ/countdown theo server, disabled controls đúng state; room.changed tự refresh có throttle/jitter. Có thể làm view trước trên contract, nghiệm thu sau APIs.

**Các bước thực hiện:**

1. Nối room list/config/create/join/leave/cancel và host start/end bằng bridge thật.
2. counts/topic từ catalog.
3. Hiển thị roster/presence, hạn chờ/countdown theo server, disabled controls đúng state.
4. room.changed tự refresh có throttle/jitter.
5. Có thể làm view trước trên contract, nghiệm thu sau APIs.

**Vùng mã dự kiến:** apps/desktop/src/renderer/src và typed API chức năng phòng. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Hai UI LAN tạo/join | thấy đúng roster/config, host tự thi và người mới không join sau start. |
| Leave thường/cancel chủ/mất mạng | UI phân biệt hành vi và không xóa member vì offline. |
| API lỗi/thiếu kho/version conflict | hiển thị lý do, không báo phòng đã tạo/start/cancel khi chưa ACK. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: UI phòng chờ/host: catalog, cấu hình, roster và điều khiển thi.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T59](sprint-1-tickets.md#exam-t59)
- Blocks: [EXAM-T40](sprint-2-tickets.md#exam-t40), [EXAM-T60](sprint-1-tickets.md#exam-t60)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Room/host UI cho demo và exam screen T57; không quyết định quyền/thời hạn thay server.

**Checkpoint bảo vệ:** Ẩn nút join/start có thay kiểm quyền/state trên server không? Mất mạng khác bấm Rời phòng ra sao?

**Truy vết nhập Jira:** `EXAM-T52`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t53"></a>

## EXAM-T53 — [Room] Hủy và giải phóng phòng chờ hết hạn sau 30 phút

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T18
- **FR:** FR-04, FR-05, FR-06
- **Acceptance refs:** AC-04, AC-05, AC-19, AC-20, AC-21, PT-11, PT-15, PT-16
- **Work packages:** W11

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** WAITING cancel/expiry 30 phút và startup expiry để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T14](sprint-1-tickets.md#exam-t14): Clock/timer/activity helpers dùng chung trước handler thi.
- [EXAM-T18](sprint-1-tickets.md#exam-t18): Room backend: list/create/configure/get/join/leave và roster.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-03/04/04 b; 02 §9.1/9.1 b; 03 §7.1/8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** room.cancel và timer WAITING_EXPIRY dùng chung cancel helper. Thời hạn cố định tạo+1800 s, CANCELLED giữ roster, release activity đúng room atomically; startup dựa UTC cũ, không cấp lại 30 phút. Không host transfer/gia hạn.

**Các bước thực hiện:**

1. room.cancel và timer WAITING_EXPIRY dùng chung cancel helper.
2. Thời hạn cố định tạo+1800 s, CANCELLED giữ roster, release activity đúng room atomically.
3. startup dựa UTC cũ, không cấp lại 30 phút.
4. Không host transfer/gia hạn.

**Vùng mã dự kiến:** apps/business/src/domain và storage: cancel/WAITING expiry/startup maintenance. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Chủ hủy trước hạn | commit rồi release/event, không attempt/điểm; USER khác không hủy. |
| Đến hạn khi mọi người offline | tự cancel; config/join/reconnect không gia hạn; DB cancel lỗi không báo release giả. |
| Start/cancel race hoặc callback chờ cũ | không hủy room đã RUNNING, terminal reason/thời điểm không đổi khi retry. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: WAITING cancel/expiry 30 phút và startup expiry.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T18](sprint-1-tickets.md#exam-t18)
- Blocks: [EXAM-T21](sprint-1-tickets.md#exam-t21)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Cancel/expiry API/timer cho T52/T65; unit clock có thể nhanh, LT 30 phút thật vẫn cần chạy.

**Checkpoint bảo vệ:** Mất mạng có hủy phòng ngay không? Timer WAITING cũ làm sao không hủy một phòng đã bắt đầu?

**Truy vết nhập Jira:** `EXAM-T53`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t54"></a>

## EXAM-T54 — [Question Bank] Triển khai danh sách, thêm, sửa và ngừng dùng câu hỏi theo version

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T15
- **FR:** FR-02, FR-03, FR-04
- **Acceptance refs:** AC-02, AC-03, AC-04, PT-14, PT-24
- **Work packages:** W10

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Question APIs: list/thêm/sửa/ngừng dùng và version conflict để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T07](sprint-1-tickets.md#exam-t07): Ledger/operation.get và policy admission dùng chung từ W đầu tiên.
- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-02/03; 02 §9.7; 03 §7.2/5.1. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** admin.question.list/create/update với topic/difficulty/prompt/4 options/1 correct/active/version. DTO key chỉ ADMIN, filters/cursor/byte budget; update toàn bộ bản câu có version CAS. Không xóa cứng hoặc sửa snapshots cũ.

**Các bước thực hiện:**

1. admin.question.list/create/update với topic/difficulty/prompt/4 options/1 correct/active/version.
2. DTO key chỉ ADMIN, filters/cursor/byte budget.
3. update toàn bộ bản câu có version CAS.
4. Không xóa cứng hoặc sửa snapshots cũ.

**Vùng mã dự kiến:** apps/business/src/domain và storage: admin.question handlers. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| USER gọi list/create/update trực tiếp | không đọc key hoặc ghi được dù bỏ qua UI. |
| Admin tạo/sửa câu hợp lệ | commit question+receipt rồi phản hồi; conflict không ghi đè nội dung mới. |
| Max prompt/options, trang nhiều câu hoặc inactive topic | validation/paging đúng, không cắt JSON/đổi snapshot cũ. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Question APIs: list/thêm/sửa/ngừng dùng và version conflict.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T15](sprint-1-tickets.md#exam-t15)
- Blocks: [EXAM-T29](sprint-2-tickets.md#exam-t29), [EXAM-T55](sprint-1-tickets.md#exam-t55)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Bank handlers cho T29, dữ liệu/validation dùng seed T55; không CSV hoặc CRUD tài khoản.

**Checkpoint bảo vệ:** Version CAS bảo vệ điều gì? Sửa câu trong kho có được thay key chấm của bài đã gán không?

**Truy vết nhập Jira:** `EXAM-T54`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t55"></a>

## EXAM-T55 — [Test Data] Tạo seed F/S/E có thể tái lập bằng công cụ offline

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T54
- **FR:** FR-02, FR-03, FR-04
- **Acceptance refs:** AC-02, AC-03, AC-04, PT-14, PT-24
- **Work packages:** W10

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Seed test F/S/E tái lập qua công cụ offline dùng chung để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T15](sprint-1-tickets.md#exam-t15): Topic/catalog APIs và availability theo chủ đề/độ khó.
- [EXAM-T51](sprint-1-tickets.md#exam-t51): Password scrypt async: queue hữu hạn và benchmark một job.
- [EXAM-T54](sprint-1-tickets.md#exam-t54): Question APIs: list/thêm/sửa/ngừng dùng và version conflict.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-02/03; 02 §9.7; 03 §7.2/5.1. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Tạo fixture kho/tài khoản test có seed/config rõ; F12 câu và S 360 câu tối thiểu, E thiếu/inactive/sai quyền. Dùng hash helpers, SQLite runner và lock offline, không chèn password cứng hoặc reset DB đang chạy. M maxtext bổ sung trong T33.

**Các bước thực hiện:**

1. Tạo fixture kho/tài khoản test có seed/config rõ.
2. F12 câu và S 360 câu tối thiểu, E thiếu/inactive/sai quyền.
3. Dùng hash helpers, SQLite runner và lock offline, không chèn password cứng hoặc reset DB đang chạy.
4. M maxtext bổ sung trong T33.

**Vùng mã dự kiến:** db/seeds, tools và offline seed entry dùng runner/hash/lock chung. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Lặp seed theo hướng dẫn | không nhân bản dữ liệu âm thầm; version/ID input công bố. |
| Server đang giữ DB | công cụ seed không mở ghi đồng thời hoặc tự xóa dữ liệu. |
| Ca 3 — Tính toàn vẹn và bàn giao | Seed S chọn một hoặc all topic đều có đủ 10 câu/mức; file/log/Git không chứa credential thật. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Seed test F/S/E tái lập qua công cụ offline dùng chung.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T54](sprint-1-tickets.md#exam-t54)
- Blocks: [EXAM-T24](sprint-1-tickets.md#exam-t24)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Seed và lệnh chạy thật cho T24/T33/demo; seed không thay CLI tạo admin T16.

**Checkpoint bảo vệ:** Tại sao seed được ghi DB offline nhưng bot thí sinh không được bypass server? Làm sao tránh mật khẩu cứng?

**Truy vết nhập Jira:** `EXAM-T55`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t56"></a>

## EXAM-T56 — [Exam] Cung cấp trạng thái bài, đáp án đã lưu và phân trang đề riêng

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T17
- **FR:** FR-04, FR-07, FR-10
- **Acceptance refs:** AC-04, AC-06, AC-07, PT-10
- **Work packages:** W12

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T12](sprint-1-tickets.md#exam-t12): Auth API/session: register/login/logout, authority và state.get.
- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 02 §8.3/9.2; 03 §7.3/12.2; 04 §2.2/5.2. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Own-user projection AttemptMeta+answers cùng lượt dispatcher, item snapshot theo position. Item page≤5 và encoded frame cap, next_after_position là vị trí cuối thực trả. Không key/correctness/score khi chưa công bố.

**Các bước thực hiện:**

1. Own-user projection AttemptMeta+answers cùng lượt dispatcher, item snapshot theo position.
2. Item page≤5 và encoded frame cap, next_after_position là vị trí cuối thực trả.
3. Không key/correctness/score khi chưa công bố.

**Vùng mã dự kiến:** apps/business/src/domain và storage: attempt meta/answers/item projections. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| User đổi attempt_id sang bài người khác | NOT_FOUND theo contract, không đọc snapshot. |
| Item maxtext và trang cuối/rỗng | vừa frame, cursor/has_more đúng, không cắt chuỗi JSON. |
| Reconnect/sửa bank | các trang vẫn cùng snapshot, metadata/answers không lẫn người hoặc revision. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T17](sprint-1-tickets.md#exam-t17)
- Blocks: [EXAM-T19](sprint-1-tickets.md#exam-t19)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Read APIs cho UI T57/recovery T28/results T31; không generator mới lúc đọc bài.

**Checkpoint bảo vệ:** Vì sao limit 5 không có nghĩa mọi trang luôn 5 câu? Cursor theo position khác offset byte thế nào?

**Truy vết nhập Jira:** `EXAM-T56`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t57"></a>

## EXAM-T57 — [Exam UI] Hiển thị câu hỏi, thay đổi đáp án và trạng thái lưu

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 3h
- **Depends on:** EXAM-T21, EXAM-T50
- **FR:** FR-08, FR-09, FR-13
- **Acceptance refs:** AC-08, AC-10, AC-22, PT-06, PT-07, PT-21
- **Work packages:** W13

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T50](sprint-1-tickets.md#exam-t50): Electron main/preload: spawn client C, API whitelist và pending registry.
- [EXAM-T56](sprint-1-tickets.md#exam-t56): attempt.get/items: đồng bộ metadata/answers và phân trang đề riêng.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-06/D05; 02 §9.3; 03 §7.3/10.3–10.5. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Nối attempt.get/items và answer.save qua IPC/C; điều hướng câu, countdown server và số câu đã lưu. Tách current_selection/server_saved, mỗi câu một save chưa rõ, click nhanh đợi ACK/reconcile trước op mới; pending bounded.

**Các bước thực hiện:**

1. Nối attempt.get/items và answer.save qua IPC/C.
2. điều hướng câu, countdown server và số câu đã lưu.
3. Tách current_selection/server_saved, mỗi câu một save chưa rõ, click nhanh đợi ACK/reconcile trước op mới.
4. pending bounded.

**Vùng mã dự kiến:** apps/desktop/src/renderer/src và typed API bài làm: navigation/auto save. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Chọn phương án B rồi C khi ACK của B chậm | không đánh C đã lưu nhờ ACK của B; op cũ giữ nguyên body. |
| Save ACK đúng revision | chỉ lựa chọn tương ứng hiện Đã lưu; timeout/offline hiển thị chưa xác nhận. |
| Đề nhiều trang/UI reload cơ bản | không lấy key hoặc tự spawn C; full recovery T28, không hứa offline draft bền. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T21](sprint-1-tickets.md#exam-t21), [EXAM-T50](sprint-1-tickets.md#exam-t50)
- Blocks: [EXAM-T58](sprint-1-tickets.md#exam-t58)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Exam view/auto save primitives Hoàng Quân cho T58/T28/T30; không tự mở sửa dựa đồng hồ client.

**Checkpoint bảo vệ:** ACK lựa chọn B về chậm khi UI đang chọn C thì hiển thị thế nào? Vì sao mỗi câu chỉ một save chưa rõ kết quả?

**Truy vết nhập Jira:** `EXAM-T57`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t58"></a>

## EXAM-T58 — [Exam UI] Xác nhận nộp bài, đợi lưu và xử lý kết quả chưa rõ

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T57
- **FR:** FR-09, FR-11, FR-12
- **Acceptance refs:** AC-09, AC-10, AC-26, PT-08, PT-21, PT-22
- **Work packages:** W14

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** UI nộp bài: xác nhận ý định, đợi save và xử lý kết quả chưa rõ để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- [EXAM-T57](sprint-1-tickets.md#exam-t57): UI làm bài: lấy trang đề, đổi lựa chọn và trạng thái lưu.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-07/D05–07; 02 §9.4/9.6; 03 §10.4. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Nút nộp/xác nhận khóa sửa mới, gửi nốt choices hiện tại và đợi ACK mọi save trước submit. Khi save/submit UNKNOWN, hiển thị chưa rõ và đi sync theo intent/op cũ, không tự nộp đủ hoặc cấp op mới để né.

**Các bước thực hiện:**

1. Nút nộp/xác nhận khóa sửa mới, gửi nốt choices hiện tại và đợi ACK mọi save trước submit.
2. Khi save/submit UNKNOWN, hiển thị chưa rõ và đi sync theo intent/op cũ, không tự nộp đủ hoặc cấp op mới để né.

**Vùng mã dự kiến:** apps/desktop/src/renderer/src: confirm/flush/submit states. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Không save pending | submit ACK mới hiển thị đã nộp, chưa hiện điểm khi room RUNNING. |
| Save cuối đang pending/UNKNOWN | không vượt qua rồi báo nộp đủ; deadline đến chỉ server data đã commit được tính. |
| Submit mất ACK/nộp lặp | không chấm lại hoặc mở sửa; full reconnect reconcile hoàn thiện T28. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: UI nộp bài: xác nhận ý định, đợi save và xử lý kết quả chưa rõ.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T57](sprint-1-tickets.md#exam-t57)
- Blocks: [EXAM-T28](sprint-2-tickets.md#exam-t28), [EXAM-T36](sprint-2-tickets.md#exam-t36)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Submit UI cho demo/practice/recovery, không tự quyết định điểm hoặc room end.

**Checkpoint bảo vệ:** Tại sao nộp phải đợi save? Nếu deadline tới trong lúc save UNKNOWN thì có thể ép lựa chọn local vào bài không?

**Truy vết nhập Jira:** `EXAM-T58`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t59"></a>

## EXAM-T59 — [Room] Kết thúc thi theo lệnh hoặc deadline và công bố sau commit

- **Epic:** EXAM-E02
- **Sprint:** S1
- **Assignee:** Nguyễn Minh Quân
- **Reviewer:** Đặng Hoàng Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T21
- **FR:** FR-06, FR-07, FR-09
- **Acceptance refs:** AC-05, AC-09, AC-12, AC-26, PT-08, PT-11, PT-21, PT-22
- **Work packages:** W15

**Cách review:** Review chéo bởi Đặng Hoàng Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** room.end/deadline: tự chốt phòng và công bố sau commit để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T14](sprint-1-tickets.md#exam-t14): Clock/timer/activity helpers dùng chung trước handler thi.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T21](sprint-1-tickets.md#exam-t21): room.start backend: roster cố định và snapshot nguyên tử.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-05/07; 02 §9.2/9.4; 03 §7.1/8/16.2. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Host end và timer thi gọi cùng Hoàng Quân finalizer để chốt OPEN, giữ bài nộp sớm, room ENDED/release activities sau commit. Timer không đợi client online; error/rollback bảo toàn state và publication filter.

**Các bước thực hiện:**

1. Host end và timer thi gọi cùng Hoàng Quân finalizer để chốt OPEN, giữ bài nộp sớm, room ENDED/release activities sau commit.
2. Timer không đợi client online.
3. error/rollback bảo toàn state và publication filter.

**Vùng mã dự kiến:** apps/business/src/domain: end/deadline orchestration dùng Hoàng Quân finalizer. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Mọi client offline/đồng hồ client đổi | server deadline vẫn khóa sửa và chốt. |
| Tất cả nộp sớm | không auto end; host end/hết giờ mới ENDED/công bố. |
| Finalizer lỗi | không điểm một phần hoặc release giả; HOST_END rollback trước hạn vẫn RUNNING. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: room.end/deadline: tự chốt phòng và công bố sau commit.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Dùng fixture SQLite/clock/auth để kiểm các nhánh của task và một đường tích hợp thật khi ghép; không nhận mock là bằng chứng quyền/transaction trên server. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T21](sprint-1-tickets.md#exam-t21)
- Blocks: [EXAM-T22](sprint-1-tickets.md#exam-t22), [EXAM-T52](sprint-1-tickets.md#exam-t52), [EXAM-T64](sprint-2-tickets.md#exam-t64)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** End/timer/events cho T22/T52/T64; không phục hồi ca đang thi sau Node crash.

**Checkpoint bảo vệ:** Nếu mọi thí sinh offline hoặc nộp sớm thì khi nào phòng kết thúc? Timer có thể công bố điểm khi commit lỗi không?

**Truy vết nhập Jira:** `EXAM-T59`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t60"></a>

## EXAM-T60 — [Results UI] Hiển thị kết quả cá nhân và bảng điểm chủ phòng sau công bố

- **Epic:** EXAM-E03
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T22, EXAM-T52
- **FR:** FR-09, FR-12
- **Acceptance refs:** AC-09, AC-14, PT-09
- **Work packages:** W16

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T22](sprint-1-tickets.md#exam-t22): Result APIs: kết quả cá nhân và bảng chủ phòng đúng quyền.
- [EXAM-T50](sprint-1-tickets.md#exam-t50): Electron main/preload: spawn client C, API whitelist và pending registry.
- [EXAM-T52](sprint-1-tickets.md#exam-t52): UI phòng chờ/host: catalog, cấu hình, roster và điều khiển thi.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 01 UC-10; 02 §8.5/9.4; 03 §7.4/8. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Nối result.get/room.results; Event `room.changed`/`attempt.changed` gợi ý refresh; chỉ tải điểm khi `AttemptMeta.result_available=true` hoặc phòng ENDED. `result_available` là trường dữ liệu, không là event riêng; giữ polling dự phòng theo 03 §8. Bảng chủ phòng/số đúng/điểm/reason hiển thị rõ, trạng thái chờ công bố hoặc DB pending không thành điểm 0 giả.

**Các bước thực hiện:**

1. Nối result.get/room.results.
2. Event `room.changed`/`attempt.changed` gợi ý refresh; chỉ tải điểm khi `AttemptMeta.result_available=true` hoặc phòng ENDED. `result_available` là trường dữ liệu, không là event riêng; giữ polling dự phòng theo 03 §8.
3. Bảng chủ phòng/số đúng/điểm/reason hiển thị rõ, trạng thái chờ công bố hoặc DB pending không thành điểm 0 giả.

**Vùng mã dự kiến:** apps/desktop/src/renderer/src: result view/bảng chủ phòng. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| Nộp sớm | hiển thị đã nộp/chờ phòng kết thúc, không đọc đường vòng để lộ điểm. |
| Host end/deadline commit | UI tự refresh ra điểm đúng, không bắt người dùng gọi API thủ công. |
| Permission/timeout/lỗi chốt | UI không cache điểm người khác hoặc giả thành công. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: UI kết quả cá nhân/bảng chủ phòng và refresh sau công bố.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Business: npm run typecheck:business và npm run check:business; nếu chạm UI chạy npm run check. Bổ sung test SQLite/NET hoặc UI theo bảng, đối chiếu DB sau commit và rollback. Tên command/test chưa tồn tại phải được thêm khi code, không bịa kết quả đã chạy. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T22](sprint-1-tickets.md#exam-t22), [EXAM-T52](sprint-1-tickets.md#exam-t52)
- Blocks: [EXAM-T31](sprint-2-tickets.md#exam-t31), [EXAM-T36](sprint-2-tickets.md#exam-t36)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Result UI cơ bản cho T31/demo, không bao trùm history/chart/detailS 2.

**Checkpoint bảo vệ:** Vì sao bài FINALIZED chưa chắc được xem điểm? UI có được suy ra 0 điểm từ timeout không?

**Truy vết nhập Jira:** `EXAM-T60`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.


<a id="exam-t61"></a>

## EXAM-T61 — [Data Verification] Đối soát độc lập snapshot, ACK, revision và điểm Sprint 1

- **Epic:** EXAM-E04
- **Sprint:** S1
- **Assignee:** Đặng Hoàng Quân
- **Reviewer:** Nguyễn Minh Quân
- **Estimate:** 2h
- **Depends on:** EXAM-T24
- **FR:** FR-07, FR-08, FR-09, FR-13
- **Acceptance refs:** AC-06, AC-08, AC-09, AC-16
- **Work packages:** W24

**Cách review:** Review chéo bởi Nguyễn Minh Quân trước merge đối với đầu ra kỹ thuật, contract, hành vi hoặc bằng chứng nghiệm thu của task. Tác giả tự kiểm trước; reviewer xem diff và các ca/bằng chứng trọng yếu, không bắt chạy lại toàn bộ test. Sửa thuần typo/căn lề/màu sắc không đổi hành vi có thể tự review và ghi rõ lý do; không dùng ngoại lệ đó để bỏ nghiệm thu đầu ra chính hoặc quyết định cần cả nhóm chốt. Không suy mức review từ số dependency.

**Mục tiêu:** Oracle S1: kiểm snapshot/ACK/revision/score độc lập để consumer có đầu ra thật, kiểm chứng được.

**Đầu vào và điều kiện bắt đầu:**

- [EXAM-T06](sprint-1-tickets.md#exam-t06): Mở SQLite, ghép migration Minh Quân/Hoàng Quân và transaction wrapper.
- [EXAM-T17](sprint-1-tickets.md#exam-t17): Generator: tạo snapshot đề riêng trong transaction caller.
- [EXAM-T19](sprint-1-tickets.md#exam-t19): answer.save backend: CAS revision và receipt sau commit.
- [EXAM-T20](sprint-1-tickets.md#exam-t20): Finalizer và attempt.submit backend: một kết quả chấm.
- [EXAM-T24](sprint-1-tickets.md#exam-t24): Behavior bot nhỏ: login/join/nhận đề/lưu/nộp qua TCP thật.
- Có thể chuẩn bị trên contract/fixture trước khi provider Done; nghiệm thu phần tích hợp phải dùng đầu ra thật. Quyết định chưa chốt như V03 phải được nhóm xác nhận trước phần code phụ thuộc.

**Nguồn:** 04 §2.2/6/8; 05 §2.1. Các [nguồn gốc](backlog.md#nguồn-và-quy-tắc-chung) có ưu tiên hơn diễn giải rút gọn trong ticket.

**Phạm vi:** Offline verifier đọc DB test sau ca, đối chiếu latest ACK/revision và tự tính score từ snapshot+answers, counts/duplicate/FK/activity. Không import scorer production, không đưa key vào bot/report public.

**Các bước thực hiện:**

1. Offline verifier đọc DB test sau ca, đối chiếu latest ACK/revision và tự tính score từ snapshot+answers, counts/duplicate/FK/activity.
2. Không import scorer production, không đưa key vào bot/report public.

**Vùng mã dự kiến:** tools/load: verifier SQLite offline/scorer độc lập. Đây là vùng trách nhiệm dự kiến; không khẳng định file/handler mới đã tồn tại.

**Hành vi và tình huống cần đạt:**

| Tình huống cần chạy | Kết quả mong đợi |
| --- | --- |
| DB đúng từ run 5 bot | verifier xác nhận mỗi user/bài/snapshot/answer/result. |
| Fixture cố ý chấm sai/lẫn bài/reservation kẹt | verifier FAIL với diff đã lọc bí mật. |
| Câu đã đổi nhiều lần | latest ACK hoặc revision mới hơn commit được chấp nhận, không so với mọi ACK cũ. |

**Tiêu chí nghiệm thu:**

- [ ] Bàn giao đúng đầu ra: Oracle S1: kiểm snapshot/ACK/revision/score độc lập.
- [ ] Đầu ra thuộc phạm vi ticket chạy được, consumer nhận đúng interface/error/ownership; không nhận Done từ compile hoặc mock khi yêu cầu tích hợp thật.
- [ ] Các tình huống cụ thể trong bảng được kiểm, gồm đường lỗi/biên; ghi PASS/FAIL/NOT_RUN đúng phần, không đánh cả FR/PT/LT đạt từ một nhánh nhỏ.
- [ ] Có lệnh thực, kết quả, môi trường và giới hạn; reviewer xử lý góp ý chặn, tác giả giải thích được checkpoint. Không đưa secret/key thật vào Git/Jira/evidence.

**Kiểm tra và bằng chứng:** Dùng harness/runbook đã hiện thực; ghi command, build/config/seed, topology và raw summary/oracle diff. Chưa có CLI thì ticket phải bàn giao CLI và hướng dẫn chạy; không lấy probe loopback/version smoke hoặc đồ thị đơn thuần thay LT thật. Ghi cách tái hiện lỗi và regression liên quan; bug vượt timebox tạo Bug liên kết/estimate còn lại, không âm thầm bỏ AC.

**Phụ thuộc và cách bàn giao:**

- Is blocked by: [EXAM-T24](sprint-1-tickets.md#exam-t24)
- Blocks: [EXAM-T33](sprint-2-tickets.md#exam-t33)
- Một liên kết provider blocks consumer trên Jira, không thêm cạnh ngược. Estimate gồm triển khai/tự kiểm/đọc hiểu phần mình; peer review/sync theo capacity chung. Nếu phát hiện vượt 8 h, tách tiếp theo đầu ra trước nhận việc, không sửa giờ giả.

**Bàn giao/ngoài phạm vi:** Oracle/evidence mẫu cho T26/T33/T37/T39; không chứng minh tải 50 từ fixture nhỏ.

**Checkpoint bảo vệ:** Tại sao không gọi scorer production để tự kiểm chính nó? Làm sao so latest ACK khi một câu đã đổi nhiều lần?

**Truy vết nhập Jira:** `EXAM-T61`; nguồn `docs/planning/sprint-1-tickets.md`; key SCRUM thật xem Jira/journal import; trạng thái nghiệm thu theo bằng chứng của task, không suy từ việc đã nhập Jira.
