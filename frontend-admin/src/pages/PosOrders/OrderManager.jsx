import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Printer, 
  Clock, 
  Coffee, 
  Banknote, 
  QrCode, 
  Search, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';
const ITEMS_PER_PAGE = 10; // Giới hạn đúng 10 đơn mỗi trang

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTable, setSearchTable] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Tải danh sách đơn hàng từ Backend
  const fetchOrders = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/orders`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải danh sách đơn:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();

    const socket = io(BACKEND_URL);

    socket.on('newOrder', () => {
      fetchOrders();
    });

    socket.on('orderStatusChanged', ({ orderId, status }) => {
      setOrders(prev =>
        prev.map(o => {
          const currentId = String(o.id ?? o.order_id ?? '').replace(/^#/, '');
          const targetId = String(orderId).replace(/^#/, '');
          return currentId === targetId ? { ...o, status } : o;
        })
      );
    });

    return () => socket.disconnect();
  }, []);

  // Tự động nhảy về trang 1 khi chuyển tab lọc hoặc gõ tìm kiếm bàn
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTable]);

  // 2. Chuyển trạng thái đơn: Dùng đúng method PATCH khớp với server.js
  const handleUpdateStatus = async (order, newStatus) => {
    const rawId = String(order.id ?? order.order_id ?? '');
    const cleanId = rawId.replace(/^#/, '').trim();

    if (!cleanId) {
      alert("Lỗi: Không tìm thấy mã đơn hợp lệ!");
      return;
    }

    // Cập nhật State giao diện ngay lập tức
    setOrders(prevOrders =>
      prevOrders.map(o => {
        const curId = String(o.id ?? o.order_id ?? '').replace(/^#/, '').trim();
        return curId === cleanId ? { ...o, status: newStatus } : o;
      })
    );

    // Gửi request PATCH lên backend
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${encodeURIComponent(cleanId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error(`Server phản hồi lỗi HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        alert("Backend báo lỗi: " + (data.message || "Không thể cập nhật"));
        fetchOrders();
      }
    } catch (err) {
      console.error("Lỗi cập nhật đơn:", err);
      alert(`Lỗi: ${err.message}`);
      fetchOrders();
    }
  };

  // 3. Hàm in hóa đơn chuẩn máy in POS nhiệt K80
  const handlePrint = (order) => {
    let printItems = [];
    try {
      printItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch (e) {
      printItems = [];
    }

    const itemsHtml = printItems
      .map(item => {
        let details = [];
        if (item.sugar) details.push(`Đường: ${item.sugar}`);
        if (item.ice) details.push(`Đá: ${item.ice}`);
        if (item.note) details.push(`[${item.note}]`);
        const detailStr =
          details.length > 0
            ? `<div style="font-size: 11px; color: #555;">${details.join(' • ')}</div>`
            : '';

        return `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px dashed #ccc;">
            <div style="font-weight: bold;">${item.name}</div>
            ${detailStr}
          </td>
          <td style="padding: 6px 0; text-align: center; border-bottom: 1px dashed #ccc; vertical-align: top;">
            ${item.quantity}
          </td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; border-bottom: 1px dashed #ccc; vertical-align: top;">
            ${((item.price || 0) * item.quantity).toLocaleString('vi-VN')}
          </td>
        </tr>
      `;
      })
      .join('');

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>In Hóa Đơn - ${order.tableName}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace, sans-serif;
              width: 74mm;
              margin: 0 auto;
              padding: 12px 6px;
              color: #000;
              font-size: 13px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .double-divider { border-top: 2px solid #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding-bottom: 4px; border-bottom: 1px solid #000; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin: 0; font-size: 18px; font-weight: 900;">TIỆM CAFE GẤU</h2>
            <p style="margin: 3px 0; font-size: 12px;">Đà Nẵng</p>
            <p style="margin: 2px 0; font-size: 12px;">Hotline: 0909.354.454</p>
            <div class="double-divider"></div>
            <h3 style="margin: 6px 0; font-size: 15px;">PHIẾU THANH TOÁN</h3>
          </div>

          <div style="font-size: 12px; margin: 8px 0;">
            <div>Bàn: <strong style="font-size: 14px;">${order.tableName}</strong></div>
            <div>Mã đơn: <strong>#${String(order.id ?? order.order_id ?? '').replace(/^#/, '')}</strong></div>
            <div>Thời gian: ${order.time || new Date().toLocaleTimeString('vi-VN')}</div>
            <div>Hình thức: <strong>${order.paymentMethod}</strong></div>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th>Món</th>
                <th style="text-align: center; width: 30px;">SL</th>
                <th style="text-align: right; width: 65px;">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; margin: 8px 0;">
            <span>TỔNG CỘNG:</span>
            <span>${(order.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
          </div>

          <div class="double-divider"></div>

          <div class="text-center" style="font-size: 11px; margin-top: 10px;">
            <p style="font-weight: bold; margin: 3px 0;">CẢM ƠN QUÝ KHÁCH VÀ HẸN GẶP LẠI!</p>
            <p style="margin: 2px 0;">Wifi: CafeGau • MK: 88888888</p>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=420,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(receiptHtml);
      printWin.document.close();
    } else {
      alert('Vui lòng bật cho phép mở Pop-up trên trình duyệt để in hóa đơn!');
    }
  };

  // 4. Lọc danh sách theo Tab trạng thái và Tìm kiếm theo bàn
  const filteredOrders = orders.filter(order => {
    const st = (order.status || '').toLowerCase();
    const matchStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'pending' && (st === 'pending' || st === 'cho_pha' || st.includes('chờ'))) ||
      (filterStatus === 'brewing' && (st === 'brewing' || st.includes('pha'))) ||
      (filterStatus === 'served' && (st === 'served' || st.includes('ra bàn') || st.includes('phục vụ'))) ||
      (filterStatus === 'paid' && (st === 'paid' || st.includes('toán') || st.includes('hoàn tất')));

    const matchTable = (order.tableName || '').toLowerCase().includes(searchTable.toLowerCase());
    return matchStatus && matchTable;
  });

  // 5. Cắt dữ liệu đúng 10 đơn cho trang hiện tại
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Thanh bộ lọc & Tìm kiếm */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ pha chế' },
            { id: 'brewing', label: 'Đang pha' },
            { id: 'served', label: 'Đã phục vụ' },
            { id: 'paid', label: 'Đã thanh toán' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterStatus === st.id
                  ? 'bg-coffee-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo bàn..."
              value={searchTable}
              onChange={e => setSearchTable(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-coffee-600 outline-none"
            />
          </div>

          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid danh sách thẻ đơn hàng (Tối đa 10 đơn) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-400 text-sm">
          Không có đơn hàng nào trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {currentOrders.map(order => {
            let parsedItems = [];
            try {
              parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            } catch (e) {
              parsedItems = [];
            }

            const currentStatus = (order.status || '').toLowerCase();
            const isPending = currentStatus === 'pending' || currentStatus === 'cho_pha' || currentStatus.includes('chờ');
            const isBrewing = currentStatus === 'brewing' || currentStatus.includes('pha');
            const isServed = currentStatus === 'served' || currentStatus.includes('ra bàn') || currentStatus.includes('phục vụ');
            const isPaid = currentStatus === 'paid' || currentStatus.includes('toán') || currentStatus.includes('hoàn tất');

            const displayId = String(order.id ?? order.order_id ?? '').replace(/^#/, '');

            return (
              <div
                key={displayId}
                className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition ${
                  isPending
                    ? 'border-amber-400 ring-2 ring-amber-100'
                    : 'border-stone-200'
                }`}
              >
                <div>
                  {/* Header thẻ đơn */}
                  <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900 text-base">{order.tableName}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                          #{displayId}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {order.time || 'Vừa xong'}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isBrewing
                          ? 'bg-blue-100 text-blue-800'
                          : isServed
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPending && 'Chờ pha chế'}
                      {isBrewing && 'Đang pha'}
                      {isServed && 'Đã ra bàn'}
                      {isPaid && 'Hoàn tất'}
                    </span>
                  </div>

                  {/* Danh sách món chi tiết */}
                  <div className="py-3 space-y-2 max-h-48 overflow-y-auto">
                    {parsedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start text-xs border-b border-stone-50 pb-1.5"
                      >
                        <div>
                          <span className="font-bold text-stone-800">
                            {item.quantity}x {item.name}
                          </span>
                          {(item.sugar || item.ice || item.note) && (
                            <p className="text-[10px] text-stone-400">
                              {item.sugar && `Đường: ${item.sugar}`}
                              {item.sugar && item.ice && ' • '}
                              {item.ice && `Đá: ${item.ice}`}
                              {(item.sugar || item.ice) && item.note && ' • '}
                              {item.note && `"${item.note}"`}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-stone-700">
                          {((item.price || 0) * item.quantity).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chân thẻ đơn */}
                <div className="border-t border-stone-100 pt-3 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 flex items-center gap-1 font-semibold">
                      {order.paymentMethod === 'VietQR' ? (
                        <>
                          <QrCode className="w-3.5 h-3.5 text-blue-600" /> VietQR (MB)
                        </>
                      ) : (
                        <>
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Tiền mặt
                        </>
                      )}
                    </span>
                    <span className="font-black text-coffee-800 text-base">
                      {(order.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrint(order)}
                      className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="In hóa đơn"
                    >
                      <Printer className="w-4 h-4" /> In Bill
                    </button>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order, 'brewing')}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 shadow-xs cursor-pointer"
                      >
                        Bắt đầu pha
                      </button>
                    )}

                    {isBrewing && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order, 'served')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 shadow-xs cursor-pointer"
                      >
                        Đã ra bàn
                      </button>
                    )}

                    {isServed && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order, 'paid')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 shadow-xs cursor-pointer"
                      >
                        Thanh toán
                      </button>
                    )}

                    {isPaid && (
                      <span className="flex-1 text-center py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl">
                        Đã hoàn tất
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thanh Điều Hướng Phân Trang */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">
            Hiển thị <span className="font-bold text-stone-800">{startIndex + 1}</span> - <span className="font-bold text-stone-800">{Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)}</span> trên tổng số <span className="font-bold text-stone-800">{filteredOrders.length}</span> đơn
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
                      ? 'bg-coffee-800 text-white shadow-xs'
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