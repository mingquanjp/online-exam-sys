# Kiểm chứng

Hiện CTest chỉ có smoke `--version` để kiểm tra binary và dependency link/runtime.
Không kiểm chứng socket, deadline, quyền hoặc khả năng 50 người.

Khi triển khai, bổ sung kiểm chứng có ý nghĩa theo AC/PT/LT ở tài liệu 01/03/04,
nhất là split/coalesced frame, partial I/O, retry và transaction lỗi.

M01 có thêm npm run check:business cho compile và runtime --version của Node.
PT-26..28 cần triển khai ở M1/M2 để kiểm chứng C–Node BP, authority và lỗi child.

[Config fixtures SCRUM-9](fixtures/config/README.md) chuẩn bị input/expected dùng
chung C/TS cho T47; V03 còn chờ nhóm xác nhận và loader runtime NOT_RUN.
