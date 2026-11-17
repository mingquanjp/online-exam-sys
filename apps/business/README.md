# Business process

Workspace @exam/business dùng TypeScript trên Node 24.15.0, chạy trên máy server.
Node sở hữu phiên/quyền, phòng/thời gian, ngân hàng/đề/bài, kết quả và SQLite.
Server C khởi chạy Node và chuyển lệnh qua pipe theo tài liệu 03 §18.

```sh
npm run typecheck:business
npm run build:business
npm run check:business
```

Entry point hiện có --version, in thông tin vào stderr và giữ stdout cho BP ở
bước tích hợp. Các thư mục domain/bridge/auth/storage/config/admin có phân công.
Socket LAN, pipe runtime, migration, admin và handler sẽ được triển khai ở M1–M5.
node:sqlite trong Node 24.15.0 có trạng thái release candidate. Runtime hiện tại
báo SQLite 3.51.3. Cần ghi phiên bản thực trên Linux khi kiểm chứng.

Nguồn API theo runtime của repo tại
[Node SQLite v24.15.0](https://github.com/nodejs/node/blob/v24.15.0/doc/api/sqlite.md).
