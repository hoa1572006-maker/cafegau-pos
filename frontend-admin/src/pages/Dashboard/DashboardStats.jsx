import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  DollarSign, 
  ShoppingBag, 
  QrCode, 
  Banknote, 
  TrendingUp, 
  Coffee, 
  RefreshCw,
  Award
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    vietqrRevenue: 0,
    cashRevenue: 0,
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    fetch(`${BACKEND_URL}/api/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi lấy dữ liệu thống kê:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();

    // Lắng nghe cập nhật đơn realtime để tự động tính lại doanh thu
    const socket = io(BACKEND_URL);
    socket.on('orderStatusChanged', () => fetchStats());
    socket.on('newOrder', () => fetchStats());

    return () => socket.disconnect();
  }, []);

  const totalRev = stats.totalRevenue || 0;
  const qrPercent = totalRev > 0 ? Math.round((stats.vietqrRevenue / totalRev) * 100) : 0;
  const cashPercent = totalRev > 0 ? 100 - qrPercent : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Tiêu đề & Nút làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-coffee-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-coffee-600" /> Báo Cáo Doanh Thu & Thống Kê
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Số liệu tính toán tự động dựa trên các hóa đơn đã thanh toán thành công trong cơ sở dữ liệu.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới số liệu
        </button>
      </div>

      {/* 4 Thẻ KPI Tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tổng doanh thu */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Tổng Doanh Thu</p>
            <h3 className="text-2xl font-black text-coffee-900 mt-2">
              {totalRev.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-stone-500">đ</span>
            </h3>
            <span className="inline-block mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Đã thu tiền
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Tổng số đơn */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Tổng Số Đơn Hàng</p>
            <h3 className="text-2xl font-black text-coffee-900 mt-2">
              {stats.totalOrders} <span className="text-sm font-semibold text-stone-500">đơn</span>
            </h3>
            <span className="inline-block mt-2 text-[11px] font-bold text-coffee-700 bg-coffee-50 px-2 py-0.5 rounded-md">
              Ghi nhận hệ thống
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-coffee-50 text-coffee-700 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Doanh thu VietQR */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Thanh Toán VietQR</p>
            <h3 className="text-2xl font-black text-blue-900 mt-2">
              {(stats.vietqrRevenue || 0).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-stone-500">đ</span>
            </h3>
            <span className="inline-block mt-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Chuyển khoản ({qrPercent}%)
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        {/* Doanh thu Tiền mặt */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Tiền Mặt Tại Quầy</p>
            <h3 className="text-2xl font-black text-emerald-900 mt-2">
              {(stats.cashRevenue || 0).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-stone-500">đ</span>
            </h3>
            <span className="inline-block mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Tiền mặt ({cashPercent}%)
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Khu vực chi tiết: Tỷ trọng phương thức & Top sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1: Tỷ trọng phương thức thanh toán */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-coffee-600" /> Tỷ Trọng Thanh Toán
          </h3>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Chuyển khoản VietQR
                </span>
                <span className="text-blue-600">{qrPercent}%</span>
              </div>
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${qrPercent}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-stone-400 text-right mt-1">
                {(stats.vietqrRevenue || 0).toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tiền mặt tại quầy
                </span>
                <span className="text-emerald-600">{cashPercent}%</span>
              </div>
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${cashPercent}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-stone-400 text-right mt-1">
                {(stats.cashRevenue || 0).toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-500 space-y-1 mt-6">
            <p className="font-semibold text-stone-700">Mẹo vận hành:</p>
            <p>Khuyến khích khách quét mã VietQR tự động để nhân viên không mất thời gian kiểm đếm tiền lẻ.</p>
          </div>
        </div>

        {/* Cột 2: Bảng Top món bán chạy nhất */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Top 5 Đồ Uống Bán Chạy Nhất
            </h3>
            <span className="text-xs text-stone-400">Xếp theo số lượng ly</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Thứ Hạng</th>
                  <th className="py-3 px-4">Tên Món</th>
                  <th className="py-3 px-4 text-center">Đã Bán</th>
                  <th className="py-3 px-4 text-right">Doanh Thu Mang Về</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {stats.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50 transition">
                      <td className="py-3 px-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center ${
                          idx === 0 
                            ? 'bg-amber-100 text-amber-700' 
                            : idx === 1 
                            ? 'bg-stone-200 text-stone-700' 
                            : idx === 2 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-stone-100 text-stone-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-800 flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-coffee-600 flex-shrink-0" />
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-coffee-50 text-coffee-800">
                          {p.sales} ly
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-coffee-700">
                        {(p.revenue || 0).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-stone-400 text-xs">
                      Chưa có đơn hàng nào được thanh toán để thống kê.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}