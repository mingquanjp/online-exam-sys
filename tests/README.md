# Kiểm chứng

CTest có hai smoke `--version` và `transport.tx` cho SCRUM-13. Ca TX kiểm tra
header và giới hạn frame, FIFO và quyền sở hữu buffer, ghi dở trên socket
nonblocking, chờ `POLLOUT` sau `EAGAIN`, bỏ theo dõi khi queue rỗng và `EPIPE`
khi đầu đọc đóng. Trên Linux và WSL, ca `EINTR` dùng `--wrap=write` của linker
để giả lập ngắt tại đúng descriptor cần kiểm tra, sau đó gửi các byte thật qua pipe.

Trong Linux hoặc WSL, sau khi cấu hình bằng `cmake --preset dev`, chạy:

```sh
make -C build/dev -j2
make -C build/dev test
```

Các ca này kiểm tra module TX độc lập. Kiểm chứng luồng TCP qua reactor, deadline,
quyền và tải 50 người thuộc các mốc tích hợp.

Khi triển khai, bổ sung kiểm chứng có ý nghĩa theo AC/PT/LT ở tài liệu 01/03/04,
nhất là split/coalesced frame, partial I/O, retry và transaction lỗi.

M01 có thêm npm run check:business cho compile và runtime --version của Node.
PT-26..28 cần triển khai ở M1/M2 để kiểm chứng C–Node BP, authority và lỗi child.

[Config fixtures SCRUM-9](fixtures/config/README.md) chuẩn bị input/expected dùng
chung C/TS cho T47; V03 còn chờ nhóm xác nhận và loader runtime NOT_RUN.
