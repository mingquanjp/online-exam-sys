# Server C — TCP transport và launcher

A phụ trách poll/RX/connect lifecycle, BP request/control và khởi chạy Node bằng
POSIX spawn/exec với pipe riêng. B phụ trách TX/partial send, BP response/event
routing và credit. Nghiệp vụ và SQLite nằm ở apps/business.

main.c --version hiện in build/dependency vào stderr. Listener và child-process
lifecycle được triển khai ở M1. Server C dùng libsodium cho random an toàn.
