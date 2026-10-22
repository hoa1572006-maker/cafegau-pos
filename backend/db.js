import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

// Tự động kết nối Turso qua URL/Token trong .env, nếu không có sẽ dùng file database.sqlite cục bộ
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:database.sqlite',
  authToken: process.env.TURSO_AUTH_TOKEN || ''
});

// 1. Tạo các bảng CSDL & Chèn dữ liệu mẫu
export async function initDB() {
  try {
    // Kích hoạt Foreign Key
    await db.execute('PRAGMA foreign_keys = ON;');

    // Tạo bảng tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        area TEXT DEFAULT 'Tầng 1',
        status TEXT DEFAULT 'available'
      );
    `);

    // Tạo bảng products
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        status TEXT DEFAULT 'available',
        image TEXT,
        desc TEXT
      );
    `);

    // Tạo bảng orders
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        order_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'VietQR',
        total_amount INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tạo bảng order_items
    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        sugar TEXT,
        ice TEXT,
        note TEXT,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    // 2. Chèn dữ liệu mẫu nếu chưa có
    const tableRes = await db.execute('SELECT COUNT(*) as count FROM tables');
    const tableCount = tableRes.rows[0]?.count ?? 0;

    if (Number(tableCount) === 0) {
      const defaultTables = [
        ['Bàn 01', 'Tầng 1 - Trong nhà', 'available'],
        ['Bàn 02', 'Tầng 1 - Trong nhà', 'available'],
        ['Bàn 03', 'Sân vườn', 'available'],
        ['Bàn 04', 'Tầng 2 - Ban công', 'available']
      ];

      for (const t of defaultTables) {
        await db.execute({
          sql: 'INSERT INTO tables (name, area, status) VALUES (?, ?, ?)',
          args: t
        });
      }
    }

    const prodRes = await db.execute('SELECT COUNT(*) as count FROM products');
    const prodCount = prodRes.rows[0]?.count ?? 0;

    if (Number(prodCount) === 0) {
      const defaultProds = [
        ['Cà Phê Muối Gấu Special', 'Cà phê', 30000, 'available', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', 'Hương vị Robusta đậm đà kết hợp cùng lớp kem muối béo ngậy.'],
        ['Bạc Xỉu Sữa Dừa Nướng', 'Cà phê', 32000, 'available', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', 'Ngọt thơm vị cốt dừa nướng quyện với cà phê sữa truyền thống.'],
        ['Trà Đào Cam Sả Tươi', 'Trà Trái Cây', 35000, 'available', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', 'Thanh mát, sảng khoái với đào miếng giòn và nước cam sả tươi.'],
        ['Trà Vải Hoa Hồng', 'Trà Trái Cây', 35000, 'available', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', 'Thơm dịu hương hoa hồng cùng vị ngọt thanh của trái vải tươi.'],
        ['Trà Sữa Oolong Nướng', 'Trà Sữa', 38000, 'available', 'https://images.unsplash.com/photo-1558857563-b37fc9a59b58?w=400', 'Đậm vị trà nướng kết hợp cùng sữa béo ngậy thơm lừng.'],
        ['Bánh Mì Phô Mai Bơ Tỏi', 'Bánh & Ăn Vặt', 28000, 'available', 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400', 'Vỏ bánh giòn rụm đẫm bơ tỏi và phô mai kéo sợi thơm phức.']
      ];

      for (const p of defaultProds) {
        await db.execute({
          sql: 'INSERT INTO products (name, category, price, status, image, desc) VALUES (?, ?, ?, ?, ?, ?)',
          args: p
        });
      }
    }

    console.log('✅ Cơ sở dữ liệu SQLite Cloud (Turso) đã khởi tạo & sẵn sàng!');
  } catch (error) {
    console.error('❌ Lỗi kết nối CSDL:', error);
  }
}

export default db;