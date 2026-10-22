import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Coffee, Check, X } from 'lucide-react';

export default function ProductManager() {
  const [products, setProducts] = useState([
    { id: 1, name: 'Cà Phê Muối Gấu', category: 'Cà phê', price: 30000, status: 'available', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400' },
    { id: 2, name: 'Bạc Xỉu Sữa Dừa', category: 'Cà phê', price: 32000, status: 'available', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
    { id: 3, name: 'Trà Đào Cam Sả', category: 'Trà Trái Cây', price: 35000, status: 'available', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
    { id: 4, name: 'Trà Sữa Oolong Nướng', category: 'Trà Sữa', price: 38000, status: 'sold_out', image: 'https://images.unsplash.com/photo-1558857563-b37fc9a59b58?w=400' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Cà phê');
  const [newProdImage, setNewProdImage] = useState('');

  const categories = ['All', 'Cà phê', 'Trà Trái Cây', 'Trà Sữa', 'Bánh & Ăn Vặt'];

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    setProducts([
      ...products,
      {
        id: newId,
        name: newProdName,
        category: newProdCategory,
        price: parseInt(newProdPrice),
        status: 'available',
        image: newProdImage || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'
      }
    ]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdImage('');
  };

  const toggleStatus = (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, status: p.status === 'available' ? 'sold_out' : 'available' } : p));
  };

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900">Quản Lý Danh Mục & Sản Phẩm</h2>
        <p className="text-stone-500 text-sm mt-1">Cập nhật giá bán, hình ảnh và trạng thái còn món/hết món trên menu khách.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-coffee-500" /> Thêm Món Mới Vào Menu
        </h3>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tên món (Ví dụ: Cà phê Muối)"
            value={newProdName}
            onChange={(e) => setNewProdName(e.target.value)}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
          />
          <input
            type="number"
            placeholder="Giá bán (VNĐ)"
            value={newProdPrice}
            onChange={(e) => setNewProdPrice(e.target.value)}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
          />
          <select
            value={newProdCategory}
            onChange={(e) => setNewProdCategory(e.target.value)}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none bg-white"
          >
            <option>Cà phê</option>
            <option>Trà Trái Cây</option>
            <option>Trà Sữa</option>
            <option>Bánh & Ăn Vặt</option>
          </select>
          <input
            type="text"
            placeholder="Link ảnh món (URL)"
            value={newProdImage}
            onChange={(e) => setNewProdImage(e.target.value)}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
          />
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="bg-coffee-700 hover:bg-coffee-800 text-white font-medium px-6 py-2.5 rounded-xl transition text-sm flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Lưu Món Mới
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === c ? 'bg-coffee-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {c === 'All' ? 'Tất cả' : c}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div key={p.id} className="border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col">
              <div className="h-40 overflow-hidden relative">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-lg text-xs font-medium">
                  {p.category}
                </span>
                <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                  p.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {p.status === 'available' ? 'Đang bán' : 'Tạm hết'}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-800 text-base">{p.name}</h4>
                  <p className="text-coffee-700 font-extrabold text-base mt-1">{p.price.toLocaleString('vi-VN')} đ</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleStatus(p.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 ${
                      p.status === 'available' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {p.status === 'available' ? 'Báo Tạm Hết' : 'Bật Đang Bán'}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                    title="Xóa món"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
