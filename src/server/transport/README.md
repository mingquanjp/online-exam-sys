# Transport C

A chủ trì reactor/RX/connection identity, hello/ping, timeout và lifecycle.
B chủ trì TX/partial send/backpressure và routing kết quả từ BP.
Mỗi socket có một đường I/O, pipe Node cùng tham gia poll nonblocking.
