import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import db, { initDB } from './db.js';

const app = express();
const server = http.createServer(app);

// Khởi tạo bảng CSDL
initDB();

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// =================== 0. API LẤY IP LAN THẬT TỰ ĐỘNG ===================
app.get('/api/server-ip', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let detectedIp = 'localhost';

    for (const name of Object.keys(interfaces)) {
      const lowerName = name.toLowerCase();

      // Bỏ qua card ảo VirtualBox, VMware, Loopback, WSL, Hyper-V
      if (
        lowerName.includes('virtual') ||
        lowerName.includes('vbox') ||
        lowerName.includes('vmnet') ||
        lowerName.includes('wsl') ||
        lowerName.includes('pseudo') ||
        lowerName.includes('vethernet')
      ) {
        continue;
      }

      for (const iface of interfaces[name]) {
        if (
          iface.family === 'IPv4' &&
          !iface.internal &&
          !iface.address.startsWith('192.168.56.')
        ) {
          detectedIp = iface.address;
          break;
        }
      }
      if (detectedIp !== 'localhost') break;
    }

    res.json({ success: true, ip: detectedIp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== 1. API BÀN ===================
app.get('/api/tables', async (req, res) => {
  try {
    const rs = await db.execute('SELECT * FROM tables ORDER BY id ASC');
    res.json({ success: true, data: rs.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Kiểm tra trạng thái 1 bàn theo tên
app.get('/api/tables/status/:name', async (req, res) => {
  try {
    const tableName = decodeURIComponent(req.params.name);
    const rs = await db.execute({
      sql: 'SELECT * FROM tables WHERE name = ?',
      args: [tableName]
    });
    const table = rs.rows[0];
    if (!table) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
    }
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/tables', async (req, res) => {
  try {
    const { name, area } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên bàn là bắt buộc' });

    const rs = await db.execute({
      sql: 'INSERT INTO tables (name, area, status) VALUES (?, ?, ?)',
      args: [name, area || 'Tầng 1', 'available']
    });

    const newTable = {
      id: Number(rs.lastInsertRowid),
      name,
      area: area || 'Tầng 1',
      status: 'available'
    };

    io.emit('tableUpdated');
    res.status(201).json({ success: true, data: newTable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/tables/:id', async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM tables WHERE id = ?',
      args: [req.params.id]
    });
    io.emit('tableUpdated');
    res.json({ success: true, message: 'Đã xóa bàn thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== 2. API SẢN PHẨM ===================
app.get('/api/products', async (req, res) => {
  try {
    const rs = await db.execute('SELECT * FROM products ORDER BY id ASC');
    res.json({ success: true, data: rs.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, image, desc } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: 'Tên và giá là bắt buộc' });

    const rs = await db.execute({
      sql: 'INSERT INTO products (name, category, price, status, image, desc) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name, category || 'Cà phê', parseInt(price, 10), 'available', image || '', desc || '']
    });

    const newProduct = {
      id: Number(rs.lastInsertRowid),
      name,
      category,
      price: parseInt(price, 10),
      status: 'available',
      image,
      desc
    };

    io.emit('productUpdated');
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/products/:id/toggle-status', async (req, res) => {
  try {
    const rs = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [req.params.id]
    });
    const product = rs.rows[0];
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy món' });

    const newStatus = product.status === 'available' ? 'sold_out' : 'available';
    await db.execute({
      sql: 'UPDATE products SET status = ? WHERE id = ?',
      args: [newStatus, req.params.id]
    });

    io.emit('productUpdated');
    res.json({ success: true, data: { ...product, status: newStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== 3. API ĐƠN HÀNG ===================
app.get('/api/orders', async (req, res) => {
  try {
    const ordersRs = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = ordersRs.rows;

    const fullOrders = await Promise.all(
      orders.map(async (o) => {
        const itemsRs = await db.execute({
          sql: 'SELECT product_name as name, quantity, price, sugar, ice, note FROM order_items WHERE order_id = ?',
          args: [o.id]
        });

        return {
          id: o.id,
          tableName: o.table_name,
          time: o.order_time,
          status: o.status,
          paymentMethod: o.payment_method,
          totalAmount: o.total_amount,
          items: itemsRs.rows
        };
      })
    );

    res.json({ success: true, data: fullOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { tableName, items, totalAmount, paymentMethod } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng không có sản phẩm' });
    }

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Tạo mảng batch thực thi nhiều câu lệnh trong 1 transaction an toàn
    const batchStatements = [
      {
        sql: `INSERT INTO orders (id, table_name, order_time, status, payment_method, total_amount)
              VALUES (?, ?, ?, 'pending', ?, ?)`,
        args: [orderId, tableName || 'Bàn Khách', timeString, paymentMethod || 'VietQR', totalAmount || 0]
      },
      ...items.map((item) => ({
        sql: `INSERT INTO order_items (order_id, product_name, quantity, price, sugar, ice, note)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId,
          item.name,
          item.quantity,
          item.price,
          item.sugar || '',
          item.ice || '',
          item.note || ''
        ]
      })),
      {
        sql: 'UPDATE tables SET status = ? WHERE name = ?',
        args: ['occupied', tableName || '']
      }
    ];

    await db.batch(batchStatements, 'write');

    const newOrder = {
      id: orderId,
      tableName: tableName || 'Bàn Khách',
      time: timeString,
      status: 'pending',
      paymentMethod: paymentMethod || 'VietQR',
      totalAmount: totalAmount || 0,
      items
    };

    io.emit('newOrder', newOrder);
    io.emit('tableUpdated');

    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, id]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (status === 'paid') {
      const orderRs = await db.execute({
        sql: 'SELECT table_name FROM orders WHERE id = ?',
        args: [id]
      });
      const order = orderRs.rows[0];

      if (order) {
        const countRs = await db.execute({
          sql: "SELECT COUNT(*) as count FROM orders WHERE table_name = ? AND status != 'paid'",
          args: [order.table_name]
        });
        const pendingCount = Number(countRs.rows[0]?.count ?? 0);

        if (pendingCount === 0) {
          await db.execute({
            sql: 'UPDATE tables SET status = ? WHERE name = ?',
            args: ['available', order.table_name]
          });
          io.emit('tableUpdated');
        }
      }
    }

    io.emit('orderStatusChanged', { orderId: id, status });
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =================== 4. API THỐNG KÊ ===================
app.get('/api/stats', async (req, res) => {
  try {
    const totalRevRs = await db.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid'");
    const totalOrdersRs = await db.execute("SELECT COUNT(*) as count FROM orders");
    const vietqrRevRs = await db.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid' AND payment_method = 'VietQR'");
    const cashRevRs = await db.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid' AND payment_method = 'Tiền mặt'");

    const topProductsRs = await db.execute(`
      SELECT product_name as name, SUM(quantity) as sales, SUM(quantity * price) as revenue
      FROM order_items
      GROUP BY product_name
      ORDER BY sales DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevRs.rows[0]?.total ?? 0),
        totalOrders: Number(totalOrdersRs.rows[0]?.count ?? 0),
        vietqrRevenue: Number(vietqrRevRs.rows[0]?.total ?? 0),
        cashRevenue: Number(cashRevRs.rows[0]?.total ?? 0),
        topProducts: topProductsRs.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`☕ CAFE GẤU BACKEND ĐANG CHẠY:`);
  console.log(`➜ Cổng: ${PORT}`);
  console.log(`=========================================`);
});