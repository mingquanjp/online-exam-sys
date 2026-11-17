# Load harness

Chưa có bot giao thức sản phẩm. Các probe ở tools/ là nghiên cứu thành phần,
giữ nguyên. Harness tương lai phải theo tài liệu 04, dùng TCP thật/50 tài khoản,
kiểm tra dữ liệu bằng oracle và không coi echo loopback là nghiệm thu LAN.

C11/C12 đã chốt: Minh Quân chủ trì driver/scheduler/barrier, thu số đo và mẫu
report; Hoàng Quân behavior đề/save/submit/practice, seed bank và oracle DB/scorer.
Một harness dùng chung, cùng review/chạy; chưa có bot sản phẩm được triển khai.
Lịch/đếm mẫu, warmup/drain và latency theo [tài liệu 04](../../docs/04-capacity-and-validation.md)
§3.1/§8; retry không tính như logical save mới.
