# Migrations

SQL migrations dùng bởi TypeScript migration runner trong apps/business/storage.
A viết users/rooms/members/activity, B viết topics/questions/attempt/items/answers
và tích hợp operations/schema_migrations. DDL được đối chiếu tài liệu 02 §8.
M2 sẽ triển khai runner và SQL đầu tiên trước listen/readiness.
