# Client C — Minh Quân / Hoàng Quân

`main.c` hiện chỉ kiểm chứng build bằng `--version`, chưa đọc config, pipe hoặc TCP.
stdout dành cho framed IPC tương lai, chẩn đoán chỉ stderr.

- A: vòng I/O, socket/connect, RX/framing, heartbeat/reconnect/auth binding.
- B: encode/TX queue, partial write, command phần bài và đồng bộ pending.
- Một loop/reader cho mỗi kênh. Contract: `docs/03-protocol-specification.md`.
