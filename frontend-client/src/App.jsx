import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  ShoppingBag, 
  Coffee, 
  Search, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  Loader2,
  Clock,
  Flame,
  Check,
  Receipt,
  AlertTriangle,
  RotateCcw,
  QrCode,
  Banknote,
  Layers
} from 'lucide-react';

const BACKEND_URL = `http://${window.location.hostname}:5000`;
const CATEGORIES = ['Tất cả', 'Cà phê', 'Trà Trái Cây', 'Trà Sữa', 'Bánh & Ăn Vặt'];

// Cấu hình tài khoản MB Bank nhận tiền của quán
const BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '0909354454',
  accountName: 'TRAN MAI HOANG NGAN'
};

export default function App() {
  const [tableInfo, setTableInfo] = useState({ id: 1, name: 'Bàn 01' });
  const [isTableOccupied, setIsTableOccupied] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Khách chọn hình thức: 'VietQR' hoặc 'Tiền mặt'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('VietQR');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customSugar, setCustomSugar] = useState('100%');
  const [customIce, setCustomIce] = useState('100%');
  const [customNote, setCustomNote] = useState('');

  // LƯU DANH SÁCH NHIỀU ĐƠN CỦA BÀN NÀY
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // 1. Kiểm tra trạng thái bàn & khôi phục đơn hàng
  const checkTableStatus = (tableName, currentOrders) => {
    fetch(`${BACKEND_URL}/api/tables/status/${encodeURIComponent(tableName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const hasUnpaid = (currentOrders || []).some(o => o.status !== 'paid');
          if (data.data.status === 'occupied' && !hasUnpaid) {
            setIsTableOccupied(true);
          } else {
            setIsTableOccupied(false);
          }
        }
      })
      .catch(err => console.error('Lỗi kiểm tra trạng thái bàn:', err));
  };

  const fetchProducts = () => {
    fetch(`${BACKEND_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải menu:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get('tableId');
    const tableName = params.get('tableName');
    const currentTable = tableName ? decodeURIComponent(tableName) : 'Bàn 01';
    setTableInfo({ id: tableId || 1, name: currentTable });

    let savedOrders = [];
    const localData = localStorage.getItem(`active_orders_${currentTable}`);
    if (localData) {
      try {
        savedOrders = JSON.parse(localData);
        if (Array.isArray(savedOrders)) {
          setOrdersList(savedOrders);
          if (savedOrders.length > 0) {
            setSelectedOrderId(savedOrders[savedOrders.length - 1].id);
          }
        }
      } catch (e) {
        console.error('Lỗi đọc đơn lưu trữ:', e);
      }
    }

    checkTableStatus(currentTable, savedOrders);
    fetchProducts();

    const socket = io(BACKEND_URL);

    socket.on('tableUpdated', () => {
      checkTableStatus(currentTable, savedOrders);
    });

    socket.on('productUpdated', () => {
      fetchProducts();
    });

    socket.on('orderStatusChanged', ({ orderId, status }) => {
      setOrdersList(prevList => {
        const updatedList = prevList.map(o => o.id === orderId ? { ...o, status } : o);
        localStorage.setItem(`active_orders_${currentTable}`, JSON.stringify(updatedList));

        const stillPending = updatedList.some(o => o.status !== 'paid');
        if (!stillPending) {
          setIsTableOccupied(false);
        }

        return updatedList;
      });
    });

    return () => socket.disconnect();
  }, []);

  const openCustomModal = (product) => {
    if (product.status === 'sold_out') return;
    setSelectedProduct(product);
    setCustomSugar('100%');
    setCustomIce('100%');
    setCustomNote('');
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const isDrink = selectedProduct.category !== 'Bánh & Ăn Vặt';
    const sugarVal = isDrink ? customSugar : '';
    const iceVal = isDrink ? customIce : '';

    const cartItemId = `${selectedProduct.id}-${sugarVal}-${iceVal}-${customNote}`;
    const existingIndex = cart.findIndex((item) => item.cartItemId === cartItemId);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          cartItemId,
          product: selectedProduct,
          quantity: 1,
          sugar: sugarVal,
          ice: iceVal,
          note: customNote,
        },
      ]);
    }
    setSelectedProduct(null);
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      tableName: tableInfo.name,
      paymentMethod: selectedPaymentMethod,
      totalAmount: totalAmount,
      items: cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        sugar: item.sugar,
        ice: item.ice,
        note: item.note,
        price: item.product.price
      }))
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const newOrder = data.data;
        const nextList = [...ordersList, newOrder];

        setOrdersList(nextList);
        setSelectedOrderId(newOrder.id);
        localStorage.setItem(`active_orders_${tableInfo.name}`, JSON.stringify(nextList));

        setIsCartOpen(false);
        setCart([]);
        setIsOrderModalOpen(true);
      }
    } catch (err) {
      alert('Không thể kết nối với quầy pha chế. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'pending': return 1;
      case 'brewing': return 2;
      case 'served': return 3;
      case 'paid': return 4;
      default: return 1;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đã nhận đơn - Chờ pha chế';
      case 'brewing': return 'Barista đang pha chế...';
      case 'served': return 'Đồ uống đang được mang ra bàn!';
      case 'paid': return 'Đơn hàng đã hoàn tất';
      default: return 'Đang xử lý';
    }
  };

  const activeUnpaidOrders = ordersList.filter(o => o.status !== 'paid');
  const currentViewOrder = ordersList.find(o => o.id === selectedOrderId) || activeUnpaidOrders[0] || ordersList[ordersList.length - 1];

  const handleRemoveFinishedOrder = (orderId) => {
    const nextList = ordersList.filter(o => o.id !== orderId);
    setOrdersList(nextList);
    localStorage.setItem(`active_orders_${tableInfo.name}`, JSON.stringify(nextList));
    if (nextList.length > 0) {
      setSelectedOrderId(nextList[nextList.length - 1].id);
    } else {
      setSelectedOrderId(null);
      setIsOrderModalOpen(false);
    }
  };

  if (isTableOccupied) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-6 max-w-md mx-auto shadow-2xl border-x border-stone-200">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full space-y-5 shadow-xl border border-stone-100">
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto animate-bounce">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
              {tableInfo.name}
            </span>
            <h2 className="font-extrabold text-stone-900 text-xl mt-3">Bàn Đang Có Khách</h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Bàn này hiện đã có người ngồi và đang có đơn phục vụ. Vui lòng chọn một bàn trống khác hoặc liên hệ nhân viên để được hỗ trợ nhé!
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-coffee-800 hover:bg-coffee-900 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <RotateCcw className="w-4 h-4" /> Kiểm tra lại bàn này
          </button>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((item) => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-28 max-w-md mx-auto shadow-2xl relative border-x border-stone-200">
      {/* Header */}
      <header className="bg-coffee-900 text-white p-5 rounded-b-3xl shadow-lg sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <h1 className="font-extrabold text-lg tracking-wide uppercase">CAFE GẤU</h1>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">Đặt món trực tuyến tại bàn</p>
          </div>
          <div className="bg-coffee-800/80 border border-coffee-700 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-amber-200">{tableInfo.name}</span>
          </div>
        </div>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm món đồ uống bạn thích..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-coffee-950/60 border border-coffee-800 rounded-xl text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>
      </header>

      {/* DANH MỤC */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-coffee-700 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* DANH SÁCH MÓN */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="py-20 text-center text-stone-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-coffee-700 mb-2" />
            <p className="text-xs">Đang tải thực đơn...</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isSoldOut = product.status === 'sold_out';
            return (
              <div
                key={product.id}
                onClick={() => openCustomModal(product)}
                className={`bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex gap-3 transition ${
                  isSoldOut
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-md active:scale-[0.99]'
                }`}
              >
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                  {isSoldOut && (
                    <span className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold rounded-xl flex items-center justify-center">
                      Hết món
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-coffee-500 bg-coffee-50 px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-stone-800 text-sm mt-1 leading-snug">{product.name}</h3>
                    <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{product.desc}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-coffee-700 text-sm">
                      {product.price.toLocaleString('vi-VN')} đ
                    </span>
                    <button 
                      disabled={isSoldOut}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isSoldOut 
                          ? 'bg-stone-200 text-stone-400' 
                          : 'bg-coffee-100 text-coffee-800'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* THANH ĐIỀU HƯỚNG NỔI */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40 space-y-2">
        {activeUnpaidOrders.length > 0 && (
          <button
            onClick={() => {
              if (!selectedOrderId && activeUnpaidOrders.length > 0) {
                setSelectedOrderId(activeUnpaidOrders[0].id);
              }
              setIsOrderModalOpen(true);
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-2xl shadow-lg flex items-center justify-between transition animate-pulse"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-white animate-bounce" />
              <span className="text-xs font-bold tracking-wide">
                {activeUnpaidOrders.length === 1 ? (
                  `Đơn #${activeUnpaidOrders[0].id}: ${getStatusText(activeUnpaidOrders[0].status)}`
                ) : (
                  `Bạn có ${activeUnpaidOrders.length} đơn đang phục vụ`
                )}
              </span>
            </div>
            <span className="text-[11px] underline font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Xem tiến trình
            </span>
          </button>
        )}

        {totalItems > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-coffee-800 hover:bg-coffee-900 text-white py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between transition transform active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-coffee-950 flex items-center justify-center font-extrabold text-xs">
                {totalItems}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Xem Đơn Hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-amber-200">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </div>
          </button>
        )}
      </div>

      {/* MODAL TIẾN TRÌNH ĐƠN HÀNG */}
      {isOrderModalOpen && currentViewOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-coffee-600" />
                <h3 className="font-bold text-stone-800 text-base">
                  Tiến Trình Đơn Hàng
                </h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-full bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB CHỌN XEM ĐƠN NÀO KHI CÓ TỪ 2 ĐƠN TRỞ LÊN */}
            {ordersList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-2.5 border-b border-stone-100 no-scrollbar">
                {ordersList.map((order, idx) => {
                  const isCurrent = order.id === currentViewOrder.id;
                  const isPaid = order.status === 'paid';
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-coffee-700 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <span>Đơn {idx + 1} (#{order.id})</span>
                      {isPaid ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              <div className="flex items-center justify-between bg-stone-50 px-3.5 py-2 rounded-xl text-xs">
                <span className="font-bold text-coffee-900">Mã: #{currentViewOrder.id}</span>
                <span className="text-stone-500">Giờ đặt: {currentViewOrder.time}</span>
              </div>

              {/* Thanh tiến trình */}
              <div className="relative px-2">
                <div className="absolute top-4 left-6 right-6 h-1 bg-stone-200 -z-0">
                  <div 
                    className="h-full bg-coffee-600 transition-all duration-500"
                    style={{ width: `${((getStatusStep(currentViewOrder.status) - 1) / 3) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  {[
                    { step: 1, label: 'Đã nhận', icon: Clock },
                    { step: 2, label: 'Pha chế', icon: Flame },
                    { step: 3, label: 'Ra bàn', icon: Coffee },
                    { step: 4, label: 'Hoàn tất', icon: Check },
                  ].map((s) => {
                    const currentStep = getStatusStep(currentViewOrder.status);
                    const isDone = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;
                    const Icon = s.icon;

                    return (
                      <div key={s.step} className="flex flex-col items-center z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isDone
                              ? 'bg-coffee-700 text-white shadow-md'
                              : 'bg-white border-2 border-stone-300 text-stone-400'
                          } ${isCurrent ? 'ring-4 ring-coffee-200 animate-pulse' : ''}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-bold mt-1.5 ${isDone ? 'text-coffee-800' : 'text-stone-400'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-center bg-coffee-50 p-2.5 rounded-2xl border border-coffee-100">
                  <p className="text-xs font-bold text-coffee-800">
                    {getStatusText(currentViewOrder.status)}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {tableInfo.name} • {currentViewOrder.paymentMethod}
                  </p>
                </div>
              </div>

              {/* KHỐI THANH TOÁN (VIETQR HOẶC TIỀN MẶT CỦA RIÊNG ĐƠN NÀY) */}
              {currentViewOrder.status !== 'paid' && (
                <div>
                  {currentViewOrder.paymentMethod === 'VietQR' ? (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-900">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span>Mã VietQR MB Bank Chuyển Khoản Đơn Này</span>
                      </div>

                      <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-stone-200">
                        <img
                          src={`https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${currentViewOrder.totalAmount}&addInfo=${encodeURIComponent(`GAU ${tableInfo.name}${currentViewOrder.id}`)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`}
                          alt="VietQR MB Bank"
                          className="w-48 h-auto mx-auto rounded-lg"
                        />
                      </div>

                      <div className="text-[11px] text-stone-600 font-mono bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                        Nội dung: <strong>GAU {tableInfo.name} {currentViewOrder.id}</strong>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        Số tiền chuyển khoản: <strong>{currentViewOrder.totalAmount?.toLocaleString('vi-VN')} đ</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>Hình Thức: Tiền Mặt Tại Quầy</span>
                      </div>
                      <p className="text-xs text-stone-600">
                        Vui lòng gửi <strong>{currentViewOrder.totalAmount?.toLocaleString('vi-VN')} đ</strong> cho nhân viên phục vụ khi nhận đồ uống.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Danh sách món của đơn đang chọn */}
              <div className="space-y-2 border-t border-stone-100 pt-3">
                <p className="text-xs font-bold text-stone-500 uppercase">Món đã đặt trong đơn này</p>
                {currentViewOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-stone-50 pb-2">
                    <div>
                      <span className="font-bold text-stone-800">{item.quantity}x {item.name}</span>
                      <p className="text-[10px] text-stone-400">
                        {item.sugar && `Đường: ${item.sugar}`}
                        {item.sugar && item.ice && ' • '}
                        {item.ice && `Đá: ${item.ice}`}
                        {(item.sugar || item.ice) && item.note && ' • '}
                        {item.note && `"${item.note}"`}
                      </p>
                    </div>
                    <span className="font-semibold text-stone-700">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chân modal */}
            <div className="border-t border-stone-200 pt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500 font-medium">Tổng tiền đơn này:</span>
                <span className="font-extrabold text-coffee-700 text-base">
                  {currentViewOrder.totalAmount?.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {currentViewOrder.status === 'paid' && (
                <button
                  onClick={() => handleRemoveFinishedOrder(currentViewOrder.id)}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition"
                >
                  Đơn này đã hoàn tất • Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TÙY CHỈNH MÓN (TỰ ĐỘNG ẨN ĐƯỜNG/ĐÁ NẾU LÀ BÁNH & ĂN VẶT) */}
      {selectedProduct && (() => {
        const isDrink = selectedProduct.category !== 'Bánh & Ăn Vặt';

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-5 animate-in slide-in-from-bottom">
              <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-bold text-stone-800 text-base">{selectedProduct.name}</h3>
                  <p className="text-coffee-700 font-extrabold text-sm mt-0.5">
                    {selectedProduct.price.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CHỈ HIỂN THỊ ĐƯỜNG & ĐÁ KHI LÀ ĐỒ UỐNG */}
              {isDrink && (
                <>
                  <div>
                    <p className="text-xs font-bold text-stone-600 mb-2 uppercase">Lượng đường</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['100%', '50%', 'Không đường'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCustomSugar(s)}
                          className={`py-2 rounded-xl text-xs font-semibold border ${
                            customSugar === s
                              ? 'border-coffee-700 bg-coffee-50 text-coffee-800 font-bold'
                              : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-stone-600 mb-2 uppercase">Lượng đá</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['100%', '50%', 'Không đá'].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCustomIce(i)}
                          className={`py-2 rounded-xl text-xs font-semibold border ${
                            customIce === i
                              ? 'border-coffee-700 bg-coffee-50 text-coffee-800 font-bold'
                              : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Ô GHI CHÚ */}
              <div>
                <p className="text-xs font-bold text-stone-600 mb-2 uppercase">
                  {isDrink ? 'Ghi chú cho Barista' : 'Ghi chú cho bếp / phục vụ'}
                </p>
                <input
                  type="text"
                  placeholder={isDrink ? "Ví dụ: Nhiều đá, để riêng topping..." : "Ví dụ: Làm nóng giòn, không lấy ớt..."}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-coffee-500 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={addToCart}
                className="w-full bg-coffee-700 hover:bg-coffee-800 text-white py-3 rounded-xl font-bold text-sm shadow-md transition"
              >
                Thêm Vào Giỏ • {selectedProduct.price.toLocaleString('vi-VN')} đ
              </button>
            </div>
          </div>
        );
      })()}

      {/* MODAL GIỎ HÀNG */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-800 text-base">Đơn Hàng ({tableInfo.name})</h3>
                <p className="text-xs text-stone-400">Kiểm tra lại món & chọn hình thức thanh toán</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex items-center justify-between border-b border-stone-100 pb-3"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-stone-800">{item.product.name}</h4>
                    <p className="text-[11px] text-stone-400">
                      {item.sugar && `Đường: ${item.sugar}`}
                      {item.sugar && item.ice && ' • '}
                      {item.ice && `Đá: ${item.ice}`}
                      {(item.sugar || item.ice) && item.note && ' • '}
                      {item.note && `"${item.note}"`}
                    </p>
                    <span className="font-extrabold text-xs text-coffee-700 mt-1 block">
                      {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-xs"
                    >
                      <Minus className="w-3.5 h-3.5 text-stone-600" />
                    </button>
                    <span className="text-xs font-bold text-stone-800 w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 rounded-lg bg-coffee-100 flex items-center justify-center font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-coffee-800" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 pb-2 space-y-2">
              <p className="text-xs font-bold text-stone-600 uppercase">Phương thức thanh toán</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('VietQR')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    selectedPaymentMethod === 'VietQR'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> Chuyển Khoản (MB)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('Tiền mặt')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    selectedPaymentMethod === 'Tiền mặt'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Tiền Mặt
                </button>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Tổng thanh toán:</span>
                <span className="font-extrabold text-base text-coffee-700">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <button
                onClick={handleSendOrder}
                disabled={isSubmitting}
                className="w-full bg-coffee-700 hover:bg-coffee-800 disabled:bg-stone-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang chuyển đơn xuống quầy...
                  </>
                ) : (
                  'Gửi Đơn Cho Quầy Pha Chế'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}