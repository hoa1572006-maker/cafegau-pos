import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';

export default function DashboardStats() {
  const stats = [
    { label: "Doanh thu hôm nay", value: "3.450.000 đ", change: "+14.5%", icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Tổng số đơn đã phục vụ", value: "86 đơn", change: "+8.2%", icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Thanh toán VietQR", value: "2.760.000 đ", change: "80%", icon: CreditCard, color: "bg-amber-50 text-amber-600" },
    { label: "Tiền mặt tại quầy", value: "690.000 đ", change: "20%", icon: TrendingUp, color: "bg-stone-100 text-stone-600" },
  ];

  const topProducts = [
    { name: "Cà phê Muối Gấu Special", sales: 42, revenue: "1.260.000 đ", category: "Cà phê" },
    { name: "Trà Đào Cam Sả Tươi", sales: 28, revenue: "840.000 đ", category: "Trà Trái Cây" },
    { name: "Bạc Xỉu Sữa Tươi Nướng", sales: 25, revenue: "750.000 đ", category: "Cà phê" },
    { name: "Trà Sữa Oolong Nướng", sales: 19, revenue: "665.000 đ", category: "Trà Sữa" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900">Báo Cáo & Thống Kê Doanh Thu</h2>
        <p className="text-stone-500 text-sm mt-1">Tổng hợp dữ liệu bán hàng và hiệu suất kinh doanh trong ngày.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase">{item.label}</p>
                <h3 className="text-2xl font-bold text-stone-800 mt-1">{item.value}</h3>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600 mt-2">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> {item.change}
                </span>
              </div>
              <div className={`p-3 rounded-2xl ${item.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center justify-between">
          <span>Top Món Bán Chạy Nhất Hôm Nay</span>
          <span className="text-xs font-semibold text-coffee-700 bg-coffee-50 px-3 py-1 rounded-full">Thời gian thực</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-xs uppercase text-stone-400 border-b border-stone-100">
              <tr>
                <th className="py-3 px-4">Tên đồ uống</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4 text-center">Số ly bán ra</th>
                <th className="py-3 px-4 text-right">Doanh thu tạm tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {topProducts.map((p, index) => (
                <tr key={index} className="hover:bg-stone-50/50 transition">
                  <td className="py-3 px-4 font-semibold text-stone-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-coffee-100 text-coffee-800 text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    {p.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs rounded-full font-medium">{p.category}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-stone-800">{p.sales} ly</td>
                  <td className="py-3 px-4 text-right font-bold text-coffee-700">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
