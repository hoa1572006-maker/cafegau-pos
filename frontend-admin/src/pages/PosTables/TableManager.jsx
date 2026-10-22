import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Plus, 
  Trash2, 
  Download, 
  ExternalLink, 
  QrCode, 
  RefreshCw,
  Layers,
  CheckCircle2
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

const AREAS = [
  'Tầng 1 - Trong nhà',
  'Tầng 2 - Ban công',
  'Sân vườn',
  'Mang về'
];

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableArea, setNewTableArea] = useState('Tầng 1 - Trong nhà');
  const [domainClient, setDomainClient] = useState('http://localhost:5174');
  const [loading, setLoading] = useState(false);

  // 1. Tự động lấy IP LAN thực tế từ backend để khách quét mã chuẩn mạng nội bộ
  const fetchServerIp = () => {
    fetch(`${BACKEND_URL}/api/server-ip`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.ip && data.ip !== 'localhost') {
          setDomainClient(`http://${data.ip}:5174`);
        }
      })
      .catch(err => console.error('Lỗi lấy IP Server:', err));
  };

  // 2. Tải danh sách bàn trực tiếp từ SQLite Database
  const fetchTables = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/tables`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setTables(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải danh sách bàn:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchServerIp();
    fetchTables();

    // Lắng nghe realtime khi bàn được thêm/xóa/đổi trạng thái
    const socket = io(BACKEND_URL);
    socket.on('tableUpdated', () => {
      fetchTables();
    });

    return () => socket.disconnect();
  }, []);

  // 3. Thêm bàn mới vào SQLite Database (POST /api/tables)
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      alert('Vui lòng nhập tên bàn!');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTableName.trim(),
          area: newTableArea
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewTableName('');
        fetchTables();
      } else {
        alert('Lỗi tạo bàn: ' + (data.message || 'Không thể tạo bàn'));
      }
    } catch (err) {
      console.error('Lỗi tạo bàn:', err);
      alert('Không kết nối được Backend!');
    }
  };

  // 4. Xóa bàn khỏi SQLite Database (DELETE /api/tables/:id)
  const handleDeleteTable = async (tableId, tableName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${tableName}" khỏi hệ thống không?`)) {
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/tables/${tableId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        fetchTables();
      } else {
        alert('Lỗi xóa bàn: ' + (data.message || 'Không thể xóa'));
      }
    } catch (err) {
      console.error('Lỗi xóa bàn:', err);
      alert('Không kết nối được Backend!');
    }
  };

  // 5. Tải ảnh QR Code về máy
  const handleDownloadQr = (qrUrl, tableName) => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_${tableName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header giới thiệu & Tùy chỉnh Domain */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-coffee-700" />
            <h2 className="text-base font-extrabold text-stone-900">Quản Lý Bàn & Tạo Mã QR Gọi Món</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Mỗi bàn có một mã QR độc lập. Khách quét mã sẽ tự động mở trang thực đơn gắn đúng số bàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-500 uppercase">DOMAIN CLIENT:</label>
          <input
            type="text"
            value={domainClient}
            onChange={(e) => setDomainClient(e.target.value)}
            className="px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-mono text-stone-700 focus:ring-2 focus:ring-coffee-600 outline-none w-56"
          />
          <button
            onClick={fetchTables}
            className="p-2 border border-stone-200 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 transition"
            title="Làm mới danh sách bàn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Form thêm bàn mới */}
      <form onSubmit={handleCreateTable} className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
        <p className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-coffee-700" /> Thêm Bàn Mới
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Tên bàn (ví dụ: Bàn 05)"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-coffee-600 outline-none"
          />

          <select
            value={newTableArea}
            onChange={(e) => setNewTableArea(e.target.value)}
            className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-coffee-600 outline-none"
          >
            {AREAS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-coffee-800 hover:bg-coffee-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tạo Bàn & Mã QR
          </button>
        </div>
      </form>

      {/* Grid danh sách các bàn */}
      {tables.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-400 text-sm">
          Chưa có bàn nào trong cơ sở dữ liệu. Vui lòng thêm bàn mới ở trên!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {tables.map((table) => {
            const clientUrl = `${domainClient}/?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(clientUrl)}`;
            const isOccupied = table.status === 'occupied';

            return (
              <div 
                key={table.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div>
                  {/* Khu vực & Nút xóa */}
                  <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-100 pb-2">
                    <span className="font-semibold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-stone-400" /> {table.area || 'Tầng 1 - Trong nhà'}
                    </span>
                    <button
                      onClick={() => handleDeleteTable(table.id, table.name)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Xóa bàn này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tên bàn & URL */}
                  <div className="text-center mt-3">
                    <h3 className="font-black text-stone-900 text-lg">{table.name}</h3>
                    <p className="text-[10px] text-stone-400 font-mono line-clamp-1 mt-0.5" title={clientUrl}>
                      {clientUrl}
                    </p>
                  </div>

                  {/* Khối hiển thị ảnh QR Code */}
                  <div className="mt-3 p-3 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center">
                    <img 
                      src={qrImageUrl} 
                      alt={`QR ${table.name}`}
                      className="w-36 h-36 rounded-lg object-contain mix-blend-multiply" 
                    />
                  </div>

                  {/* Trạng thái bàn */}
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span className={`text-xs font-bold ${isOccupied ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isOccupied ? 'Bàn đang có khách' : 'Bàn trống'}
                    </span>
                  </div>
                </div>

                {/* Các nút bấm thao tác */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => handleDownloadQr(qrImageUrl, table.name)}
                    className="py-2 px-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải QR
                  </button>

                  <a
                    href={clientUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Xem Menu
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}