import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { io } from 'socket.io-client';
import { 
  QrCode, 
  Plus, 
  Download, 
  Coffee, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

const BACKEND_URL = 'https://cafegau-pos.onrender.com';
const ITEMS_PER_PAGE = 10; // Giới hạn 10 bàn mỗi trang

export default function TableManager() {
  // Mặc định dùng domain Vercel của khách hàng, có thể đổi trực tiếp trên giao diện
  const [clientDomain, setClientDomain] = useState('https://cafegau-client.vercel.app');

  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableArea, setNewTableArea] = useState('Tầng 1 - Trong nhà');
  const [currentPage, setCurrentPage] = useState(1);

  // Lấy danh sách bàn từ Backend Turso/Render
  const fetchTables = () => {
    fetch(`${BACKEND_URL}/api/tables`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTables(data.data);
        }
      })
      .catch((err) => console.error('Lỗi tải danh sách bàn:', err));
  };

  useEffect(() => {
    fetchTables();

    // Lắng nghe cập nhật trạng thái bàn realtime qua Socket.io
    const socket = io(BACKEND_URL);
    socket.on('tableUpdated', () => {
      fetchTables();
    });

    return () => socket.disconnect();
  }, []);

  // Thêm bàn mới vào Database
  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName, area: newTableArea }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTableName('');
        fetchTables();
      }
    } catch (err) {
      console.error('Lỗi thêm bàn:', err);
    }
  };

  // Xóa bàn khỏi Database
  const handleDeleteTable = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bàn này?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/tables/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTables();
        if (currentTables.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      }
    } catch (err) {
      console.error('Lỗi xóa bàn:', err);
    }
  };

  // Tải hình ảnh mã QR về máy tính
  const downloadQR = (tableId, tableName) => {
    const canvas = document.getElementById(`qr-code-${tableId}`);
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${tableName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Tính toán phân trang
  const totalPages = Math.ceil(tables.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTables = tables.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Tiêu đề & Cấu hình URL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 flex items-center gap-2">
            <QrCode className="text-coffee-500 w-7 h-7" />
            Quản Lý Bàn & Tạo Mã QR Gọi Món
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Mỗi bàn có một mã QR độc lập. Khách quét mã sẽ tự động mở trang thực đơn gắn đúng số bàn.
          </p>
        </div>

        {/* Input cấu hình URL máy Client */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <span className="text-xs font-semibold text-stone-600 uppercase">Domain Client:</span>
          <input
            type="text"
            value={clientDomain}
            onChange={(e) => setClientDomain(e.target.value)}
            className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-coffee-500 w-64"
            placeholder="https://cafegau-client.vercel.app"
          />
        </div>
      </div>

      {/* Form tạo bàn mới */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-coffee-500" /> Thêm Bàn Mới
        </h2>
        <form onSubmit={handleAddTable} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Tên bàn (ví dụ: Bàn 05)"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm"
          />
          <select
            value={newTableArea}
            onChange={(e) => setNewTableArea(e.target.value)}
            className="px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm text-stone-700 bg-white"
          >
            <option>Tầng 1 - Trong nhà</option>
            <option>Tầng 2 - Ban công</option>
            <option>Sân vườn</option>
            <option>Phòng máy lạnh VIP</option>
          </select>
          <button
            type="submit"
            className="bg-coffee-700 hover:bg-coffee-800 text-white font-medium px-6 py-2.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo Bàn & Mã QR
          </button>
        </form>
      </div>

      {/* Danh sách thẻ bàn kèm QR Code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {currentTables.map((table) => {
          const cleanDomain = clientDomain.replace(/\/+$/, '');
          const qrLink = `${cleanDomain}/?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`;
          const isOccupied = table.status === 'occupied';

          return (
            <div
              key={table.id}
              className={`bg-white rounded-2xl p-4 border transition duration-200 flex flex-col items-center text-center relative group ${
                isOccupied
                  ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                  : 'border-stone-200 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Nút xóa bàn */}
              <button
                onClick={() => handleDeleteTable(table.id)}
                className="absolute top-3 right-3 text-stone-300 hover:text-red-500 transition cursor-pointer"
                title="Xóa bàn"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-coffee-50 text-coffee-700 mb-2">
                <Coffee className="w-3 h-3" />
                {table.area}
              </div>

              <h3 className="text-lg font-bold text-stone-800 mb-0.5">{table.name}</h3>
              <p className="text-[11px] text-stone-400 mb-3 break-all px-1 font-mono line-clamp-1">{qrLink}</p>

              {/* Thẻ QR Code */}
              <div
                className={`p-3 rounded-2xl mb-3 border transition ${
                  isOccupied ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50 border-stone-100 shadow-inner'
                }`}
              >
                <QRCodeCanvas
                  id={`qr-code-${table.id}`}
                  value={qrLink}
                  size={135}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Trạng thái bàn */}
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-3">
                {isOccupied ? (
                  <span className="text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Đang có khách
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Bàn trống
                  </span>
                )}
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-2 w-full mt-auto">
                <button
                  onClick={() => downloadQR(table.id, table.name)}
                  className="flex-1 py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải QR
                </button>
                <button
                  onClick={() => window.open(qrLink, '_blank')}
                  className="py-1.5 px-2.5 bg-coffee-50 hover:bg-coffee-100 text-coffee-700 rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer"
                  title="Mở thử link này"
                >
                  Menu
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-400 text-sm">
          Chưa có bàn nào trong hệ thống. Vui lòng thêm bàn mới ở trên.
        </div>
      )}

      {/* Thanh Điều Hướng Phân Trang */}
      {tables.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">
            Hiển thị <span className="font-bold text-stone-800">{startIndex + 1}</span> - <span className="font-bold text-stone-800">{Math.min(startIndex + ITEMS_PER_PAGE, tables.length)}</span> trên tổng số <span className="font-bold text-stone-800">{tables.length}</span> bàn
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-coffee-700 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}