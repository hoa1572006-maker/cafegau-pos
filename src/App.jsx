import React, { useState } from 'react';
import { BarChart3, Coffee, QrCode, Store, ChevronRight } from 'lucide-react';
import DashboardStats from './pages/Dashboard/DashboardStats';
import ProductManager from './pages/Menu/ProductManager';
import TableManager from './pages/Tables/TableManager';

function App() {
  const [activeTab, setActiveTab] = useState('tables');

  const navItems = [
    { id: 'stats', label: 'Báo Cáo Thống Kê', icon: BarChart3, badge: 'Doanh thu' },
    { id: 'products', label: 'Quản Lý Sản Phẩm', icon: Coffee, badge: 'Menu' },
    { id: 'tables', label: 'Quản Lý Bàn & QR Code', icon: QrCode, badge: 'Gọi món' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex">
      <aside className="w-72 bg-coffee-900 text-stone-200 flex flex-col flex-shrink-0 border-r border-coffee-800 shadow-xl">
        <div className="p-6 border-b border-coffee-800/80 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-coffee-700 flex items-center justify-center text-amber-200 text-2xl shadow-inner font-extrabold">
            ☕
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide uppercase">CAFE GẤU POS</h1>
            <p className="text-xs text-amber-200/70 font-medium">Bán Hàng & Quản Trị QR</p>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3 py-2">Hệ Thống Nghiệp Vụ</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-coffee-700 text-white shadow-md'
                    : 'text-stone-300 hover:bg-coffee-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-amber-300" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 m-4 bg-coffee-950/60 rounded-2xl border border-coffee-800 text-xs text-stone-400 space-y-2">
          <div className="flex items-center justify-between text-white font-medium">
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-400" /> Quán Cafe Gấu
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-[11px] text-stone-400">Đà Nẵng • Ca Sáng</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div>
            <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Hệ thống quản trị / </span>
            <h2 className="text-lg font-bold text-stone-800">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-medium">
              Máy chủ kết nối tốt
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'stats' && <DashboardStats />}
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'tables' && <TableManager />}
        </main>
      </div>
    </div>
  );
}

export default App;
