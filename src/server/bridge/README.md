# C–Node bridge

A sở hữu spawn/exec, pipe nonblocking, startup/init/ready, request/control,
connection identity và shutdown. B sở hữu response/event/control decoding, TX
routing, byte credit và slow-reader integration. Hợp đồng BP ở tài liệu 03 §18.

Pipe tham gia cùng poll loop TCP. apps/business sở hữu trạng thái nghiệp vụ.
M1 sẽ triển khai kênh này và kiểm chứng split/coalesced/EOF/backpressure.
