import { bindId, prepareWrite, requireTransaction, type DbId, type DbReadContext } from './storage-types.js';

/** Hàng nội bộ cho auth; không serialize password_hash/auth_version thành User DTO. */
export interface UserRow {
  id: DbId;
  username_key: string;
  display_name: string;
  password_hash: string;
  auth_version: number;
  role: 'USER' | 'ADMIN';
  active: number;
  created_at: number;
}

export type NewUser = Pick<UserRow, 'username_key' | 'display_name' | 'password_hash' | 'role' | 'created_at'>;

export class UsersRepository {
  private readonly insert;
  private readonly byId;
  private readonly byUsername;

  /**
   * @brief Prepare query trên kết nối đã migrate; không mở/đóng DB hoặc giữ token.
   * @param db Kết nối mượn từ dispatcher, sống lâu hơn repository.
   */
  constructor(private readonly db: DbReadContext) {
    this.insert = prepareWrite(db, `INSERT INTO users
      (username_key, display_name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)`);
    // CAST ID ngay trong SQL: node:sqlite không chuyển ID lớn qua Number.
    const columns = `CAST(id AS TEXT) AS id, username_key, display_name, password_hash,
      auth_version, role, active, created_at`;
    this.byId = db.prepare(`SELECT ${columns} FROM users WHERE id = ?`);
    this.byUsername = db.prepare(`SELECT ${columns} FROM users WHERE username_key = ?`);
  }

  /**
   * @brief Tạo tài khoản bằng hash có sẵn; caller normalize/validate/hash trước transaction.
   * @param user Dữ liệu tài khoản nội bộ, không nhận password rõ.
   * @returns ID chuỗi; lỗi constraint/DB được ném về caller để rollback/ánh xạ.
   */
  create(user: NewUser): DbId {
    requireTransaction(this.db);
    const result = this.insert.run(user.username_key, user.display_name, user.password_hash, user.role, user.created_at);
    return result.lastInsertRowid.toString();
  }

  /**
   * @brief Đọc dữ liệu auth nội bộ, không dùng trực tiếp làm DTO gửi client.
   * @param id ID tài khoản chuẩn thập phân.
   * @returns Hàng nội bộ hoặc null nếu không tồn tại.
   */
  findById(id: DbId): UserRow | null {
    return (this.byId.get(bindId(id)) as unknown as UserRow | undefined) ?? null;
  }

  /**
   * @brief Tra username_key đã chuẩn hóa; SQL bind giữ dữ liệu người dùng là dữ liệu.
   * @param usernameKey Username ASCII đã chuyển chữ thường.
   * @returns Hàng nội bộ hoặc null nếu không tồn tại.
   */
  findByUsername(usernameKey: string): UserRow | null {
    return (this.byUsername.get(usernameKey) as unknown as UserRow | undefined) ?? null;
  }
}
