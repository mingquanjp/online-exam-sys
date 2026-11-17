# Thiết lập môi trường và chạy khung project

Phạm vi hiện tại theo M01 ngày 15/11/2026 gồm native C, desktop shell và
workspace nghiệp vụ TypeScript build được. Không có
socket, đọc config runtime, SQLite migration hoặc nghiệp vụ. `exam-client` và
`exam-server` mới có `--version`; không khởi chạy chúng như server/client mạng.
Electron spawn client C và C spawn Node/BP được triển khai M1 theo tài liệu 05.
Node business entry hiện hỗ trợ --version, dùng stdout cho pipe ở bước tích hợp.

## 1. Công cụ

| Công cụ | Baseline |
| --- | --- |
| Node.js | 24.15.0 theo .nvmrc, npm 11.x. Workspace yêu cầu Node 24, không dùng runtime Node bên trong Electron để chạy npm. |
| C compiler | GCC trên Linux, Apple Clang trên macOS; C11/POSIX. |
| CMake | ≥3.24, Unix Makefiles generator; cần make. |
| libsodium | Development headers/library ≥1.0.18 từ package manager, bản đã vá của OS; ghi version thực khi đo. |
| SQLite | node:sqlite trong Node 24.15.0, runtime hiện tại SQLite 3.51.3. Kiểm tra version trên máy Linux qua business --version. |
| cJSON | Source 1.7.19 pin URL/SHA-256 trong cmake/Dependencies.cmake. |

Root workspace có apps/desktop và apps/business, dùng một package-lock.json.
TypeScript và @types/node ở business pin cùng phiên bản desktop. Chạy npm ci từ
repo root để cài đầy đủ. cJSON dùng ở C, libsodium cho C random, Node nghiệp vụ
sử dụng node:sqlite và node:crypto scrypt async theo tài liệu 02 §10. Module SQLite
trong runtime đã pin có trạng thái release candidate, cần kiểm thử M2/LT đầy đủ.

cJSON được CMake tải vào build/dev/_deps khi configure lần đầu qua HTTPS tới
codeload.github.com, archive được kiểm tra checksum. Npm cần
registry; `npm run setup:desktop` tải binary Electron, có thể mất vài phút.
Phiên bản Electron hiện tại cũng có thể tải runtime khi mở lần đầu nếu chưa có. Không dùng tag latest trong
CMake hoặc tự bỏ checksum khi mạng lỗi. Dependency licenses nằm cùng source đã
tải; bản phân phối sau này phải kèm notices phù hợp, setup chưa đóng gói installer.

## 2. Linux (môi trường kiểm chứng chính)

Ví dụ Ubuntu 22.04, chạy trong terminal của người phát triển:

```sh
sudo apt-get update
sudo apt-get install build-essential cmake libsodium-dev
```

CMake mặc định của Ubuntu 22.04 có thể thấp hơn 3.24. Nếu `cmake --version` chưa
đạt, dùng môi trường Python riêng để cài tool build có phiên bản xác định:

```sh
sudo apt-get install python3-venv
python3 -m venv .local/build-tools
.local/build-tools/bin/python -m pip install cmake==3.31.6
export PATH="$PWD/.local/build-tools/bin:$PATH"
cmake --version
```

Node cài qua công cụ quản lý Node của nhóm, ví dụ nếu đã có nvm:

```sh
nvm install
nvm use
node --version
npm --version
```

Electron cần desktop session và các system library GUI của Linux. Không chạy
bằng root, không thêm `--no-sandbox` để né lỗi. Môi trường server không có màn
hình vẫn build/typecheck desktop được; chạy UI cần phiên desktop thật hoặc môi
trường kiểm thử GUI được cấu hình riêng. Linux/POSIX là baseline phần C, chưa
cam kết native Windows.

## 3. macOS (phát triển)

Cần Xcode Command Line Tools và Homebrew đã cài sẵn. Nếu thiếu công cụ, người
phát triển cài theo quy trình máy mình; không có script cài global trong repo.

```sh
xcode-select --install
brew install cmake libsodium
nvm install
nvm use
```

Nếu CMake không tìm ra prefix Homebrew, truyền prefix rõ lúc configure:

```sh
cmake --preset dev -DCMAKE_PREFIX_PATH="$(brew --prefix libsodium)"
```

Prefix riêng khác cũng dùng CMAKE_PREFIX_PATH. Không đưa đường dẫn tuyệt đối máy
mình vào CMakeLists. Không dùng kết quả macOS để thay báo cáo Linux/LAN.

## 4. Native C

Từ repo root:

```sh
cmake --preset dev
cmake --build --preset dev --parallel
ctest --preset dev
./build/dev/bin/exam-client --version
./build/dev/bin/exam-server --version
```

Kết quả hai binary link được. Server --version thực hiện sodium_init và in
phiên bản libsodium/transport vào stderr, SQLite runtime do business --version báo. Chưa listen cổng,
chưa tạo file DB. Chạy không tham số trả lỗi usage để tránh hiểu là server đã chạy.
CTest chỉ có hai smoke checks này, chưa có PT/LT nghiệp vụ.

Release build dùng `cmake --preset release` rồi `cmake --build --preset release`.
Các thư viện tải source nằm trong từng build tree. Reconfigure/build cùng preset
không cần tải lại nếu cache đầy đủ; xóa build tree thì lần configure cần mạng.
Warning -Wall/-Wextra/-Wpedantic/-Werror áp cho code nhóm, không áp lên vendor.

Các npm alias `configure:native`, `build:native`, `check:native` tương đương các
lệnh CMake/CTest trên; cần cmake/ctest trong PATH. Không tự gọi apt/brew từ npm.

## 5. Frontend và Electron

```sh
npm ci
npm run setup:desktop
npm run typecheck
npm run build:desktop
npm run start:desktop
```

`start:desktop` mở build đã tạo. Màn hình hiện “Khung ứng dụng”, chưa kết nối máy
chủ. Để phát triển có HMR:

```sh
npm run dev
```

electron-vite quản lý main/preload/renderer và dev server tại 127.0.0.1:5173,
không bind Vite ra LAN. Nếu cổng đang dùng, dừng tiến trình cũ hoặc điều chỉnh
cùng lúc Vite/main/CSP; không auto đổi origin một cách âm thầm. `Ctrl+C` dừng dev.
Trên macOS sau khi đóng hết cửa sổ, Quit/Command+Q thoát app hoàn toàn.

Build output ở apps/desktop/out/{main,preload,renderer}; main/preload dùng .cjs,
renderer là React bundle. Build không tạo DMG/EXE/AppImage; packaging là mốc sau.
Preload chỉ xuất constant stage, chưa có IPC command hoặc API Node tùy ý.
Sandbox/contextIsolation bật, nodeIntegration tắt; chặn navigation/window mới và
permissions. CSP dev cho script/style inline phục vụ HMR; production hạn chế hơn,
không cho renderer tự mở TCP/HTTP. Khi bổ sung IPC sẽ dùng whitelist/sender/schema.

## 6. Business TypeScript trên máy chủ

```sh
npm ci
npm run typecheck:business
npm run build:business
npm run check:business
```

check:business build rồi chạy node apps/business/dist/main.js --version. Kết quả
Node 24.15.0 / SQLite 3.51.3 trên máy phát triển hiện tại được in vào stderr.
Chạy entry không tham số báo usage khác 0. M1 sẽ thêm mode phục vụ BP, M2 thêm
migrations/auth/admin. npm run check kiểm tra desktop và business cùng lúc.
Server C runtime sẽ spawn Node executable và compiled business entry bằng argv
trực tiếp, giữ khóa DB và pipe theo config/README. Build business trước serve.

## 7. Thư mục và cấu hình

| Vị trí | Trách nhiệm |
| --- | --- |
| apps/desktop/src/main, preload, renderer, shared | Tách ba process boundary và type API desktop. |
| src/common, client, server | Code C chung và entry points; README từng module ghi ownership A/B. |
| src/server/transport, bridge | C TCP reactor/TX và Node child/pipe/routing. |
| apps/business/src/bridge, domain, auth, storage, config, admin | TypeScript nghiệp vụ, DB và công cụ offline. |
| db/migrations, db/seeds | Chuẩn bị migration/seed test, chưa tạo schema/admin. |
| config/*.example.json | Mẫu không có bí mật; parser runtime chưa có. |
| tests, tools/load | Nơi kiểm chứng chức năng/bot tương lai; tools/probe cũ giữ nguyên. |
| build/, node_modules/, apps/desktop/out/, apps/business/dist/, var/, .local/ | Dữ liệu generated/local đã ignore. |

Không copy DB, token, password hoặc đường dẫn máy mình vào Git. Khi bắt đầu dùng
config parser, tạo config/*.local.json từ mẫu; hiện không có --config. Endpoint
client trên LAN phải là IP server; bind 0.0.0.0 không phải địa chỉ để client nối.

## 8. Khi gặp lỗi

- Thiếu libsodium: cài development package hoặc truyền prefix; không làm dependency
  optional để build giả qua rồi lỗi lúc auth.
- Tải CMake archive lỗi: kiểm tra mạng/proxy/chứng chỉ, giữ checksum/TLS validation.
  Có thể dùng cache source chính thức qua FetchContent source override khi offline.
- Electron binary chưa tải: chạy `npm run setup:desktop` khi có mạng; không coi typecheck pass
  là Electron GUI đã được kiểm chứng.
- `npm ci` yêu cầu manifest/lock khớp. Sau thay dependency có chủ đích, chạy npm
  install tại root và review package-lock, không bỏ lockfile hoặc dùng force.
- `--version` hiện in foundation only là đúng phạm vi, không phải đã phục vụ TCP.

Nguồn build/security: [electron-vite](https://electron-vite.org/guide/),
[Electron security](https://www.electronjs.org/docs/latest/tutorial/security/),
[SQLite source](https://www.sqlite.org/download.html).
