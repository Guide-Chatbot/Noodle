import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, CheckCircle2, Clock, ChefHat, Sparkles, QrCode } from 'lucide-react';
import { MenuItem, CartItem, Order, StoreSettings, CustomNoodleOptions } from '../types';
import { NoodleCustomizerModal } from './NoodleCustomizerModal';
import { PaymentModal } from './PaymentModal';
import { storeSync } from '../services/storeSync';
import { NOODLE_TYPE_LABELS, SOUP_TYPE_LABELS, MEAT_OPTION_LABELS } from '../data/initialMenu';

interface Props {
  tableNumber: number;
  onTableChange: (tableNum: number) => void;
  settings: StoreSettings;
}

export const CustomerOrderView: React.FC<Props> = ({ tableNumber, onTableChange, settings }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Load menu items & orders
  useEffect(() => {
    const updateData = () => {
      setMenuItems(storeSync.getMenuItems());
      const allOrders = storeSync.getOrders();
      setMyOrders(allOrders.filter((o) => o.tableNumber === tableNumber));
    };

    updateData();
    const unsub = storeSync.subscribe(updateData);
    return unsub;
  }, [tableNumber]);

  // Total cart calculation
  const totalCartBowls = cart.reduce((acc, item) => {
    return item.customOptions ? acc + item.quantity : acc;
  }, 0);
  const totalCartAmount = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  // Lifetime bowls ordered for this table today
  const lifetimeBowls = myOrders.reduce((acc, ord) => acc + ord.totalBowls, 0) + totalCartBowls;

  // Add customized noodle to cart
  const handleAddCustomizedNoodle = (data: {
    menuItem: MenuItem;
    quantity: number;
    customOptions: CustomNoodleOptions;
    totalPrice: number;
  }) => {
    const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCartItem: CartItem = {
      cartItemId,
      menuItemId: data.menuItem.id,
      name: data.menuItem.name,
      unitPrice: data.totalPrice / data.quantity,
      quantity: data.quantity,
      totalPrice: data.totalPrice,
      customOptions: data.customOptions,
    };
    setCart((prev) => [...prev, newCartItem]);
    setIsCartOpen(true);
  };

  // Quick add for sides/drinks/desserts
  const handleQuickAdd = (item: MenuItem) => {
    const existingIndex = cart.findIndex((c) => c.menuItemId === item.id && !c.customOptions);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].unitPrice * updated[existingIndex].quantity;
      setCart(updated);
    } else {
      const newCartItem: CartItem = {
        cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: 1,
        totalPrice: item.price,
      };
      setCart((prev) => [...prev, newCartItem]);
    }
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Place Order
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const newOrder = storeSync.createOrder({
      tableNumber,
      items: cart,
      totalAmount: totalCartAmount,
      totalBowls: totalCartBowls,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'promptpay',
    });

    setCart([]);
    setIsCartOpen(false);
    // Offer to pay right away
    setActivePaymentOrder(newOrder);
  };

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Table Selector & Welcome Strip */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
            {tableNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">คุณกำลังสั่งอาหารที่: โต๊ะ {tableNumber}</span>
              <span className="text-xs text-emerald-400 font-medium">· กำลังเชื่อมต่อระบบ</span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              สั่งก๋วยเตี๋ยวเรือ ชามต่อชาม ปรุงสดใหม่ เสิร์ฟร้อนถึงโต๊ะ
            </p>
          </div>
        </div>

        {/* Quick Table Switcher for testing */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">สลับโต๊ะ:</span>
          <select
            value={tableNumber}
            onChange={(e) => onTableChange(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-stone-800 border border-stone-700 text-amber-300 rounded-lg focus:outline-hidden font-mono"
          >
            {Array.from({ length: settings.tableCount }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                โต๊ะ {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Banner with Authentic Visual Anchor */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 aspect-21/9 sm:aspect-24/9 min-h-[190px] flex items-center">
        <img
          src="/src/assets/images/hero_boat_noodle_1792512398955.jpg"
          alt="ก๋วยเตี๋ยวเรืออยุธยา"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8 max-w-xl space-y-2">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>สูตรลับอยุธยาแท้ดั้งเดิม</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            น้ำตกข้นคลั่ก แซ่บถึงใจ กากหมูเจียวสด
          </h2>
          <p className="text-xs sm:text-sm text-stone-300">
            ชามเล็กดั้งเดิมเริ่มต้นเพียง ฿{settings.regularBowlPrice} พร้อมสแกนจ่ายผ่านคิวอาร์โค้ดแบบเรียลไทม์
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs text-stone-400">
            <span>ชามซ้อนสะสมโต๊ะนี้: <strong className="text-amber-400 font-mono text-sm">{lifetimeBowls}</strong> ชาม</span>
            <span>·</span>
            <span>ปรุงสดใหม่ชามต่อชาม</span>
          </div>
        </div>
      </div>

      {/* Active Orders Status for this Table (if any) */}
      {myOrders.length > 0 && (
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">สถานะออเดอร์โต๊ะ {tableNumber} (อัปเดตสด)</h3>
            </div>
            <span className="text-xs text-stone-400 font-mono tabular-nums">{myOrders.length} รายการ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myOrders.slice(0, 4).map((ord) => (
              <div
                key={ord.id}
                className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{ord.orderNumber}</span>
                    <span className="text-stone-400 text-[11px]">({ord.items.length} รายการ)</span>
                  </div>
                  {/* Status indicator */}
                  <div className="text-xs font-semibold">
                    {ord.status === 'pending' && <span className="text-amber-400">🕒 รอก้นครัวรับออเดอร์</span>}
                    {ord.status === 'cooking' && <span className="text-sky-400">🍲 กำลังลวกและปรุงรส</span>}
                    {ord.status === 'ready' && <span className="text-emerald-400">🔔 พร้อมเสิร์ฟแล้ว!</span>}
                    {ord.status === 'served' && <span className="text-stone-400">✓ เสิร์ฟครบแล้ว</span>}
                  </div>
                </div>

                <div className="text-xs text-stone-400 truncate">
                  {ord.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-700/40">
                  <span className="text-xs text-stone-300">
                    ยอดรวม: <strong className="font-mono text-amber-400">฿{ord.totalAmount}</strong>
                  </span>

                  {ord.paymentStatus === 'paid' ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ชำระเงินเรียบร้อย
                    </span>
                  ) : (
                    <button
                      onClick={() => setActivePaymentOrder(ord)}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>สแกนจ่าย PromptPay</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs (Interactive Filter Buttons) */}
      <div className="flex items-center gap-1 p-1.5 bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'noodles', label: '🍜 ก๋วยเตี๋ยวเรือ' },
          { id: 'sides', label: '🥢 ทานเล่น & กากหมู' },
          { id: 'desserts', label: '🥥 ขนมถ้วย & ขนมหวาน' },
          { id: 'drinks', label: '🧋 เครื่องดื่มโบราณ' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === tab.id
                ? 'bg-amber-600 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`group rounded-2xl bg-stone-900 border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
              item.isAvailable
                ? 'border-stone-800 hover:border-stone-700 hover:-translate-y-0.5'
                : 'border-stone-800/50 opacity-60'
            }`}
          >
            {/* Image container */}
            <div className="relative aspect-4/3 w-full bg-stone-950 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {!item.isAvailable && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="px-3 py-1 bg-rose-900/80 border border-rose-700 text-rose-200 text-xs font-semibold rounded-md">
                    ขออภัย วัตถุดิบหมดชั่วคราว
                  </span>
                </div>
              )}
              {item.isBestSeller && item.isAvailable && (
                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  สูตรเด็ดขายดี
                </div>
              )}
            </div>

            {/* Content info */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-bold text-stone-100 group-hover:text-amber-200 transition-colors">
                    {item.name}
                  </h4>
                  <span className="text-sm font-bold font-mono tabular-nums text-amber-400 shrink-0">
                    ฿{item.price}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">
                  {item.isCustomizable ? 'ปรับแต่งเส้น/น้ำซุปได้' : 'พร้อมเสิร์ฟทันที'}
                </span>

                {item.isCustomizable ? (
                  <button
                    disabled={!item.isAvailable}
                    onClick={() => setCustomizingItem(item)}
                    className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>สั่งชามนี้</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    disabled={!item.isAvailable}
                    onClick={() => handleQuickAdd(item)}
                    className="py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white disabled:opacity-40 font-medium text-xs rounded-lg transition-colors flex items-center gap-1 border border-stone-700"
                  >
                    <span>เพิ่ม</span>
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button (Desktop & Mobile) */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:w-96 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-2xl shadow-xl shadow-amber-950/60 flex items-center justify-between transition-transform active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-2 bg-stone-950 text-amber-400 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold">
                  {cart.length}
                </span>
              </div>
              <span>ตะกร้าสั่งอาหาร (โต๊ะ {tableNumber})</span>
            </div>
            <div className="font-mono tabular-nums text-base">
              ฿{totalCartAmount}
            </div>
          </button>
        </div>
      )}

      {/* Cart Slide-Over Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-stone-900 border-l border-stone-800 flex flex-col shadow-2xl text-stone-100">
            {/* Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-200">รายการในชามสั่งอาหาร</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  โต๊ะ {tableNumber} · {cart.length} รายการ (ก๋วยเตี๋ยวเรือ {totalCartBowls} ชาม)
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 rounded-xl bg-stone-800/50 border border-stone-700/60 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      {item.customOptions && (
                        <div className="text-[11px] text-stone-400 space-y-0.5 mt-1 leading-relaxed">
                          <div>
                            {item.customOptions.bowlSize === 'special' ? '• ชามพิเศษ' : '• ชามเล็กดั้งเดิม'}
                            {' · '}
                            {NOODLE_TYPE_LABELS[item.customOptions.noodleType]}
                          </div>
                          <div>• {SOUP_TYPE_LABELS[item.customOptions.soupType]}</div>
                          <div>
                            • เนื้อ:{' '}
                            {item.customOptions.meats.map((m) => MEAT_OPTION_LABELS[m].split(' ')[0]).join(', ')}
                          </div>
                          <div>• เผ็ดระดับ {item.customOptions.spicyLevel}</div>
                          {item.customOptions.extraToppings.length > 0 && (
                            <div className="text-amber-400">
                              + {item.customOptions.extraToppings.map((t) => t.name).join(', ')}
                            </div>
                          )}
                          {item.customOptions.notes && (
                            <div className="text-stone-300 italic">"{item.customOptions.notes}"</div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-stone-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-700/40">
                    <div className="flex items-center gap-1.5 border border-stone-700 rounded-md p-0.5 bg-stone-800">
                      <button
                        onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-300 hover:bg-stone-700 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-300 hover:bg-stone-700 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-xs font-mono tabular-nums font-bold text-amber-400">
                      ฿{item.totalPrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Checkout CTA */}
            <div className="p-4 border-t border-stone-800 bg-stone-900 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>จำนวนก๋วยเตี๋ยวเรือ</span>
                  <span className="font-mono tabular-nums text-white">{totalCartBowls} ชาม</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-stone-800">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="font-mono tabular-nums text-amber-400 text-base">฿{totalCartAmount}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                <span>ยืนยันส่งออเดอร์เข้าครัว</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customizer Modal */}
      {customizingItem && (
        <NoodleCustomizerModal
          menuItem={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={handleAddCustomizedNoodle}
        />
      )}

      {/* Payment Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          settings={settings}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={() => {
            // Updated in sync
          }}
        />
      )}
    </div>
  );
};
