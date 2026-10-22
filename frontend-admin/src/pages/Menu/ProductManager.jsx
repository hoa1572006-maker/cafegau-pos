import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Coffee, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = 'https://cafegau-pos.onrender.com';
const CATEGORIES = ['Cà phê', 'Trà Trái Cây', 'Trà Sữa', 'Bánh & Ăn Vặt'];
const ITEMS_PER_PAGE = 10; // Giới hạn đúng 10 món mỗi trang

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State form thêm món mới
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cà phê');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [desc, setDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải danh sách món từ DB
  const fetchProducts = () => {
    fetch(`${BACKEND_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        }
      })
      .catch(err => console.error('Lỗi tải sản phẩm:', err));
  };

  useEffect(() => {
    fetchProducts();

    // Kết nối Socket để nhận thông báo khi có thay đổi món
    const socket = io(BACKEND_URL);
    socket.on('productUpdated', () => {
      fetchProducts();
    });

    return () => socket.disconnect();
  }, []);

  // Tự động nhảy về trang 1 khi tìm kiếm hoặc đổi danh mục
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Thêm món mới
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      category,
      price: parseInt(price, 10),
      image: image.trim() || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80',
      desc: desc.trim() || 'Hương vị thơm ngon, chế biến tươi mới.'
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setPrice('');
        setImage('');
        setDesc('');
        fetchProducts();
      }
    } catch (err) {
      console.error('Lỗi thêm món:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đổi trạng thái Còn món / Hết món
  const handleToggleStatus = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/products/${id}/toggle-status`, {
        method: 'PATCH'
      });
      fetchProducts();
    } catch (err) {
      console.error('Lỗi đổi trạng thái món:', err);
    }
  };

  // Xóa món
  const handleDeleteProduct = async (id, productName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa món "${productName}" khỏi thực đơn?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error('Lỗi xóa món:', err);
    }
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Tính toán phân trang đúng 10 món
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-coffee-900 flex items-center gap-2">
            <Coffee className="w-7 h-7 text-coffee-600" /> Quản Lý Menu & Món Ăn
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Thêm món mới, cập nhật giá và bật/tắt trạng thái Còn món / Hết món trực tiếp.
          </p>
        </div>

        {/* Ô tìm kiếm món */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên món..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
          />
        </div>
      </div>

      {/* Form Thêm Món Mới */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
          <Plus className="w-4 h-4 text-coffee-600" /> Thêm Món Mới Vào Menu
        </h3>
        
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Tên món đồ uống / bánh</label>
            <input
              type="text"
              placeholder="VD: Cà Phê Muối Kem Béo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Giá bán (VNĐ)</label>
            <input
              type="number"
              placeholder="VD: 35000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Link hình ảnh (URL)</label>
            <input
              type="text"
              placeholder="https://... (để trống lấy ảnh mẫu)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-stone-600 mb-1">Mô tả ngắn</label>
            <input
              type="text"
              placeholder="VD: Hương vị đậm đà kết hợp cùng lớp kem mặn béo ngậy đặc trưng."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-coffee-700 hover:bg-coffee-800 disabled:bg-stone-300 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Lưu Món Mới
            </button>
          </div>
        </form>
      </div>

      {/* Tabs Bộ lọc danh mục */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Tất cả', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-coffee-700 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bảng danh sách món */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Sản Phẩm</th>
              <th className="py-3.5 px-4">Danh Mục</th>
              <th className="py-3.5 px-4">Giá Bán</th>
              <th className="py-3.5 px-4">Trạng Thái Bán</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {currentProducts.map((product) => {
              const isAvailable = product.status === 'available';
              return (
                <tr key={product.id} className="hover:bg-stone-50/60 transition">
                  {/* Cột Tên & Ảnh */}
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-100 flex-shrink-0"
                    />
                    <div>
                      <p className="font-bold text-stone-800">{product.name}</p>
                      <p className="text-xs text-stone-400 line-clamp-1">{product.desc}</p>
                    </div>
                  </td>

                  {/* Cột Danh mục */}
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-coffee-50 text-coffee-800 border border-coffee-100">
                      {product.category}
                    </span>
                  </td>

                  {/* Cột Giá */}
                  <td className="py-3.5 px-4 font-extrabold text-coffee-700">
                    {product.price.toLocaleString('vi-VN')} đ
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(product.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Đang bán
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-500" /> Tạm hết món
                        </>
                      )}
                    </button>
                  </td>

                  {/* Cột Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Xóa món"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-stone-400 text-sm">
            Không tìm thấy món ăn nào phù hợp với bộ lọc.
          </div>
        )}

        {/* Thanh Điều Hướng Phân Trang (Chỉ hiện khi có dữ liệu) */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-stone-50/70 border-t border-stone-200">
            <span className="text-xs text-stone-500 font-medium">
              Hiển thị <span className="font-bold text-stone-800">{startIndex + 1}</span> - <span className="font-bold text-stone-800">{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)}</span> trên tổng số <span className="font-bold text-stone-800">{filteredProducts.length}</span> món
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
    </div>
  );
}