# SCRUM-11 — Bàn giao RX framer C

Ngày tự kiểm: 26/11/2026. Tác giả: Nguyễn Minh Quân.
Reviewer theo phân công: Đặng Hoàng Quân; tài liệu này không thay human approval.

## Mục tiêu và nguồn

Tách frame nhận và giữ phần dư theo tài liệu 03 §2/3.1/12.2/18.1,
05 §4 và shared-interface-contracts §2 (SCRUM-9).
Nhánh `feature/SCRUM-11-rx-framing` từ main `3670557`.
Chỉ triển khai framer dùng chung và test; không thêm dependency, CRC, JSON parser,
socket loop, timer hoặc nghiệp vụ.

## Đầu ra

- `src/common/include/exam/rx.h`, `src/common/rx.c`: state header/payload,
  kiểm length trước malloc, output có budget, consumed, terminal errors và cleanup.
- `tests/rx_test.c`: 10 nhóm ca, dùng byte vector độc lập và encoder TX hiện có.
- CMake đăng ký `transport.rx`; `src/common/README.md` ghi cách caller dùng,
  chuyển ownership, giữ input dư, xử lý lỗi/EOF và trách nhiệm timer.

Payload 2..65536 byte NET/IPC, 2..69632 byte BP. RX giữ tối đa một payload dở
cùng header 4 byte. Mảng output hữu hạn do caller cấp; các payload đã giao không
còn thuộc state, consumer phải hạch toán và giải phóng/chuyển ownership.

## Kiểm tra thực tế

Môi trường: Darwin arm64, Apple clang 21.0.0, CMake 4.4.5.

| Lệnh | Kết quả |
| --- | --- |
| `npm run configure:native` | PASS; dùng dependency hiện có |
| `npm run build:native` | PASS, bật Wall/Wextra/Wpedantic/Werror |
| `npm run check:native` | PASS 4/4: hai version smoke, transport.tx, transport.rx |
| Lệnh sanitizer bên dưới | PASS, 10 nhóm RX; không có báo lỗi ASan/UBSan |
| `git diff --check` | PASS |

```sh
cc -std=c11 -D_POSIX_C_SOURCE=200809L -Wall -Wextra -Wpedantic -Werror \
  -fsanitize=address,undefined -fno-omit-frame-pointer -g \
  -Isrc/common/include src/common/rx.c src/common/tx.c tests/rx_test.c \
  -o /tmp/exam-rx-sanitized
/tmp/exam-rx-sanitized
```

Các nhóm đã PASS:

1. Header chia 1+3; payload chia nhiều đoạn; feed rỗng không mất state.
2. Hai frame và hai byte header kế tiếp; feed phần còn thiếu đúng thứ tự.
3. Budget 0/1; feed lại phần chưa consume, không mất/lặp output.
4. Length 0/1/65537/UINT32_MAX và BP 69633: lỗi ngay sau 4 byte,
   không có buffer payload; lỗi terminal không consume tiếp.
5. Đúng cap NET/IPC 65536 và BP 69632, kiểm byte payload.
6. EOF tại mọi vị trí của vector tối thiểu; frame thiếu không phát output;
   cleanup lặp không double free, frame đã bàn giao còn nguyên.
7. Frame hợp lệ đứng trước header lỗi: output trước lỗi vẫn thuộc caller,
   frame lỗi không được phát; cleanup không free nhầm output.
8. Unicode qua mọi vị trí cắt của vector: đúng số byte/nội dung.
9. Byte UTF-8/JSON sai vẫn qua framing nếu đúng length: validation thuộc T44.
10. Encoder TX thật sang RX, feed từng byte và đối chiếu payload.

## Giới hạn và bàn giao

- Các ca trên là kiểm thành phần C thật; EOF qua API finish, không phải socket
  ứng dụng thực. Chưa kiểm LAN/50 người, reactor byte budget/timeout, BP credit,
  validator, hoặc chạy trên Linux. Không đánh toàn FR-08/09/13 hay PT-13/24 PASS.
- PT-01 và phần length/EOF của PT-02 được kiểm ở mức framer; nội dung JSON/schema
  trong PT-02 và PT-13/PT-24 chờ validator/ticket tích hợp tương ứng.
- Nhánh malloc thất bại có trả RX_NO_MEMORY và giữ lỗi terminal; chưa tiêm lỗi
  cấp phát để chạy nhánh này. ASan/UBSan không thay kiểm fault injection.
- Consumer T44/T08/T11 nhận API theo rx.h; frame_capacity là budget output.
  Caller giữ bytes chưa consume khi YIELD, quản lý timestamp từ byte đầu,
  đóng kênh khi lỗi terminal và giải phóng cả output đã nhận trước lỗi.
- Cần Hoàng Quân review chéo trước merge; chưa nghiệm thu tích hợp consumer
  hoặc cập nhật trạng thái Jira từ kết quả kiểm thành phần này.

## Checkpoint bảo vệ

`recv` trả một đoạn trong luồng byte, không chứa ranh giới message. RX dùng
4 byte length để biết cần ghép bao nhiêu payload. Length được so với cap ngay
sau header, trước malloc. Khi đủ frame, state bỏ con trỏ để chuyển ownership
cho caller; frame sau được ghép riêng. Budget giúp một luồng nhiều frame không
chiếm trọn lượt reactor, nhưng caller phải giữ phần input chưa consume.
