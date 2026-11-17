# Kiểm chứng scaffold nền tảng

Cập nhật baseline ngày 15/11/2026 theo M01. Tài liệu 02 v2.0 và 03 §18 mô tả
C transport với Node TypeScript nghiệp vụ. Các kết quả có ngày trước M01 bên dưới
là lịch sử theo phiên bản đã ghi. Trạng thái build mới ở setup và sổ quyết định.


Ngày: 01/11/2026. Môi trường: macOS arm64, Apple Clang 21, Node 24.15.0/npm
11.12.1. Không phải nghiệm thu Linux/LAN hoặc ứng dụng thi.

| Kiểm tra | Kết quả |
| --- | --- |
| npm dependency manifests/lock | Phiên bản trực tiếp chính xác, lockfile root khớp workspace. |
| TypeScript main/preload/renderer | PASS. |
| electron-vite production build | PASS; main/preload .cjs và renderer assets. |
| CMake configure/build Debug | PASS với CMake 3.31.6, source SQLite/cJSON tải theo URL/checksum trong repo. |
| Native smoke | 2/2 CTest PASS; exam-client --version và exam-server --version thoát thành công. |
| Dependency runtime C | cJSON 1.7.19; SQLite 3.54.1; libsodium 1.0.20 khởi tạo thành công. |
| Electron production runtime | PASS: cửa sổ load React, h1 Online Exam, preload stage=foundation. |
| Renderer boundary | Runtime xác nhận sandbox=true, contextIsolation=true, nodeIntegration=false; window.require không tồn tại. |
| Production CSP | Meta CSP được load, connect-src none; không phụ thuộc riêng HTTP headers khi load file. |
| Development command | npm run dev build main/preload, mở Electron và dev renderer ở 127.0.0.1:5173; sau kiểm tra đã chủ động dừng phiên. |
| File hygiene | Build/node_modules/out/local config/DB được ignore; JSON và local Markdown links hợp lệ, git diff --check đạt. |

CMake và libsodium trên máy kiểm tra chưa được cài qua package manager. Để kiểm
chứng, CMake 3.31.6 được tải vào thư mục tạm; libsodium 1.0.20 từ official GitHub
release được build static/install vào prefix tạm, truyền CMAKE_PREFIX_PATH cho
CMake. Không thay đổi cài đặt global của máy. Archive SQLite còn được đối chiếu
SHA3-256 trên trang phát hành, ngoài SHA-256 mà CMake kiểm tra.

Downloader Node của runtime Electron không hoàn tất kết nối trong môi trường
này; archive chính thức được tải bằng curl, so SHA-256 với checksums.json của
gói Electron 45.2.1 rồi giải nén để kiểm tra. Không sửa package source/lock để né
checksum. Trên máy phát triển thông thường dùng npm run setup:desktop; nếu mạng
lỗi thì xử lý proxy/kết nối, không tắt TLS/checksum hoặc renderer sandbox.

Phép kiểm tra Electron ban đầu trong sandbox công cụ bị SIGABRT; chạy lại với
quyền mở app đã thực hiện thành công. Không tắt sandbox Electron để kiểm tra.
Smoke runner tạm mở build production thật, đọc DOM/preload và webPreferences,
rồi tự thoát; không thêm IPC hoặc nghiệp vụ chỉ để làm test qua.

Chưa kiểm chứng: Linux/GCC, hello/ping, IPC framed Electron–C, TCP server, migration,
auth nghiệp vụ, luyện tập/thi hoặc tải 50 người. Các entry point/config mẫu hiện
không tự mở listener/DB hoặc tạo admin. Cần cài CMake/libsodium trên máy phát
triển theo [setup](setup.md); không phụ thuộc prefix tạm của lần kiểm tra này.

## Cập nhật sau khi cài Homebrew dependencies

Nhóm đã cài CMake 4.4.5 và libsodium 1.0.22 qua Homebrew. Đã xóa các cache entry
CMAKE_PREFIX_PATH/SODIUM_INCLUDE_DIR/SODIUM_LIBRARY trỏ prefix tạm, configure và
build lại bằng `/opt/homebrew/bin/cmake`. CMake tìm được libsodium Homebrew,
CTest 2/2 PASS và `exam-server --version` báo libsodium 1.0.22. Phần build C hiện
không còn phụ thuộc CMake/libsodium trong thư mục tạm. Các mục phía trên giữ lại
để mô tả đúng lần kiểm tra ban đầu; phạm vi nghiệp vụ chưa triển khai không đổi.

## Kiểm chứng nền tảng M01 ngày 15/11/2026

Trên máy macOS arm64 hiện tại, Node 24.15.0/npm 11.12.1, CMake 4.4.5 và Clang,
đã chạy npm run check thành công cho desktop và business. npm run check:business
build rồi --version báo Node 24.15.0, SQLite 3.51.3. --version ghi stderr, stdout
được giữ rỗng cho BP ở bước tích hợp. Root lockfile đã nhận workspace @exam/business.

CMake dev configure/build thành công, CTest foundation.client-version và
foundation.server-version đạt 2/2. Binary server link cJSON/libsodium, SQLite
chuyển sang Node nghiệp vụ. Chưa có kết quả kiểm chứng BP/TCP hoặc 50 thí sinh
trên kiến trúc mới. Các dòng đo trước M01 bên trên giữ baseline lịch sử.
