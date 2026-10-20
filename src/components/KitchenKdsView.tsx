import React, { useState, useEffect } from 'react';
import { ChefHat, Flame, Bell, Check, Clock, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { storeSync } from '../services/storeSync';
import { NOODLE_TYPE_LABELS, SOUP_TYPE_LABELS, MEAT_OPTION_LABELS } from '../data/initialMenu';

export const KitchenKdsView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'cooking' | 'ready'>('all');

  useEffect(() => {
    const loadOrders = () => {
      setOrders(storeSync.getOrders());
    };
    loadOrders();
    const unsub = storeSync.subscribe(loadOrders);
    return unsub;
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled');

  const filteredOrders = activeOrders.filter((o) => {
    if (selectedFilter === 'all') return true;
    return o.status === selectedFilter;
  });

  // Calculate Kitchen summary for noodle boiling station
  const noodleCounts: Record<string, number> = {};
  const soupCounts: Record<string, number> = {};
  let totalActiveBowls = 0;

  activeOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.customOptions) {
        totalActiveBowls += item.quantity;
        const nName = NOODLE_TYPE_LABELS[item.customOptions.noodleType].split(' ')[0];
        noodleCounts[nName] = (noodleCounts[nName] || 0) + item.quantity;

        const sName = SOUP_TYPE_LABELS[item.customOptions.soupType].split(' ')[0];
        soupCounts[sName] = (soupCounts[sName] || 0) + item.quantity;
      }
    });
  });

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    storeSync.updateOrderStatus(orderId, nextStatus);
  };

  const getElapsedMinutes = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    return mins;
  };

  return (
    <div className="space-y-6">
      {/* Kitchen Station Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Active Bowls */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-400">ชามก๋วยเตี๋ยวเรือค้างปรุง</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
              {totalActiveBowls} <span className="text-sm font-sans text-stone-300 font-normal">ชาม</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">จากทั้งหมด {activeOrders.length} ออเดอร์</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
        </div>

        {/* Boil Station Aggregate Breakdown */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5 md:col-span-2">
          <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>หม้อลวกเตาเดือด (สรุปเส้นและซุปที่ต้องทำทันที)</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs pt-1">
            {Object.keys(noodleCounts).length === 0 ? (
              <span className="text-stone-500 text-xs">ไม่มีรายการเส้นค้างปรุงในขณะนี้</span>
            ) : (
              Object.entries(noodleCounts).map(([name, count]) => (
                <span
                  key={name}
                  className="px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-stone-200"
                >
                  {name}: <strong className="text-amber-400 font-mono tabular-nums">{count}</strong>
                </span>
              ))
            )}
            {Object.entries(soupCounts).map(([name, count]) => (
              <span
                key={name}
                className="px-2.5 py-1 rounded-md bg-stone-800/60 border border-stone-700 text-stone-300"
              >
                {name}: <strong className="text-sky-400 font-mono tabular-nums">{count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl">
          {[
            { id: 'all', label: `ทั้งหมด (${activeOrders.length})` },
            { id: 'pending', label: `รอดำเนินการ (${activeOrders.filter((o) => o.status === 'pending').length})` },
            { id: 'cooking', label: `กำลังปรุง (${activeOrders.filter((o) => o.status === 'cooking').length})` },
            { id: 'ready', label: `พร้อมเสิร์ฟ (${activeOrders.filter((o) => o.status === 'ready').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as typeof selectedFilter)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === tab.id
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-stone-500" />
          <span>เวลาจะคำนวณและเตือนสีส้มเมื่อเกิน 10 นาที</span>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-800 flex items-center justify-center text-stone-500">
            <Check className="w-6 h-6" />
          </div>
          <div className="text-base font-semibold text-stone-200">เคลียร์ออเดอร์เรียบร้อยหมดแล้ว</div>
          <p className="text-xs text-stone-500">ก้นครัวว่างพร้อมรับออเดอร์ใหม่จากลูกค้า</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isLate = elapsedMins >= 10;

            return (
              <div
                key={order.id}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                  order.status === 'ready'
                    ? 'bg-emerald-950/20 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
                    : order.status === 'cooking'
                    ? 'bg-sky-950/20 border-sky-800/60'
                    : 'bg-stone-900 border-stone-800'
                }`}
              >
                {/* Header card */}
                <div className="p-4 border-b border-stone-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center font-mono">
                      {order.tableNumber}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {order.orderNumber} · โต๊ะ {order.tableNumber}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLate && (
                      <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        ช้ากว่ากำหนด
                      </span>
                    )}
                    <span
                      className={`text-xs font-mono tabular-nums px-2 py-0.5 rounded-md ${
                        isLate ? 'bg-rose-900/40 text-rose-300' : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {elapsedMins} นาทีที่แล้ว
                    </span>
                  </div>
                </div>

                {/* Items list */}
                <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-800/50 border border-stone-700/50 space-y-1"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-stone-100">{item.name}</span>
                        <span className="text-xs font-bold font-mono text-amber-400">x{item.quantity}</span>
                      </div>

                      {item.customOptions && (
                        <div className="text-[11px] text-stone-300 space-y-0.5 leading-relaxed bg-stone-900/60 p-2 rounded-lg mt-1">
                          <div className="text-amber-200 font-semibold">
                            {item.customOptions.bowlSize === 'special' ? '★ ชามพิเศษ' : '• ชามธรรมดา'}
                            {' · '}
                            {NOODLE_TYPE_LABELS[item.customOptions.noodleType]}
                          </div>
                          <div>ซุป: {SOUP_TYPE_LABELS[item.customOptions.soupType]}</div>
                          <div>
                            เนื้อ:{' '}
                            {item.customOptions.meats.map((m) => MEAT_OPTION_LABELS[m].split(' ')[0]).join(', ')}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>เผ็ดระดับ {item.customOptions.spicyLevel}</span>
                            {item.customOptions.spicyLevel > 2 && (
                              <span className="text-rose-400 font-bold">(เผ็ดจัด)</span>
                            )}
                          </div>
                          {item.customOptions.extraToppings.length > 0 && (
                            <div className="text-amber-400">
                              ท็อปปิ้ง: {item.customOptions.extraToppings.map((t) => t.name).join(', ')}
                            </div>
                          )}
                          {item.customOptions.notes && (
                            <div className="text-rose-300 font-medium">หมายเหตุ: "{item.customOptions.notes}"</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 border-t border-stone-800/80 bg-stone-900/60 flex items-center justify-between gap-2">
                  <div className="text-xs text-stone-400">
                    สถานะ: <strong className="text-white">{order.status}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cooking')}
                        className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>เริ่มปรุง</span>
                      </button>
                    )}

                    {order.status === 'cooking' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>พร้อมเสิร์ฟ</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        className="py-1.5 px-3 bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>เสิร์ฟแล้ว (ปิดบิลครัว)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
