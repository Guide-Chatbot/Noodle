import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, CheckCircle2, Printer, AlertTriangle, Users } from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { storeSync } from '../services/storeSync';
import { PaymentModal } from './PaymentModal';

interface Props {
  settings: StoreSettings;
}

export const CashierPosView: React.FC<Props> = ({ settings }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [receiptModalTable, setReceiptModalTable] = useState<number | null>(null);

  useEffect(() => {
    const loadData = () => {
      setOrders(storeSync.getOrders());
    };
    loadData();
    const unsub = storeSync.subscribe(loadData);
    return unsub;
  }, []);

  // Compute table statuses
  const tableData = Array.from({ length: settings.tableCount }).map((_, idx) => {
    const tableNum = idx + 1;
    const tableOrders = orders.filter((o) => o.tableNumber === tableNum && o.status !== 'cancelled');

    const totalUnpaid = tableOrders
      .filter((o) => o.paymentStatus !== 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalAmount = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalBowls = tableOrders.reduce((sum, o) => sum + o.totalBowls, 0);

    let status: 'empty' | 'eating' | 'awaiting_payment' | 'paid_eating' = 'empty';
    if (tableOrders.length > 0) {
      if (totalUnpaid > 0) {
        status = 'awaiting_payment';
      } else {
        status = 'paid_eating';
      }
    }

    return {
      tableNum,
      status,
      orders: tableOrders,
      totalAmount,
      totalUnpaid,
      totalBowls,
    };
  });

  // Daily statistics
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalBowlsSold = paidOrders.reduce((sum, o) => sum + o.totalBowls, 0);

  // Selected table orders
  const currentTableData = selectedTable ? tableData.find((t) => t.tableNum === selectedTable) : null;

  // Confirm payment manually (e.g. customer paid cash or verified slip at counter)
  const handleMarkTablePaid = (tableNum: number) => {
    const tableOrders = orders.filter((o) => o.tableNumber === tableNum && o.paymentStatus !== 'paid');
    tableOrders.forEach((o) => {
      storeSync.updatePaymentStatus(o.id, 'paid');
    });
  };

  // Close and clean table
  const handleClearTable = (tableNum: number) => {
    storeSync.checkoutTable(tableNum);
    setSelectedTable(null);
  };

  return (
    <div className="space-y-6">
      {/* Daily Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400">ยอดขายรวมวันนี้ (ชำระแล้ว)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            ฿{todayRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">{paidOrders.length} บิลที่ชำระแล้ว</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400">จำนวนชามก๋วยเตี๋ยวเรือที่ขายได้</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {totalBowlsSold} <span className="text-sm font-sans text-stone-300 font-normal">ชาม</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">สูตรซ้อนชามอยุธยา</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400">โต๊ะที่กำลังให้บริการ</div>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
            {tableData.filter((t) => t.status !== 'empty').length}{' '}
            <span className="text-sm font-sans text-stone-400 font-normal">/ {settings.tableCount} โต๊ะ</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {tableData.filter((t) => t.status === 'awaiting_payment').length} โต๊ะรอชำระเงิน
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-400">ระบบพร้อมเพย์</div>
            <div className="text-sm font-bold text-amber-300 mt-1 font-mono">{settings.promptPayNumber}</div>
            <div className="text-[11px] text-stone-500 mt-0.5 truncate max-w-[140px]">
              {settings.promptPayAccountName}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Floor Plan & Active Table Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Map (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>ผังโต๊ะอาหาร (Table Floor Plan)</span>
            </h3>

            {/* Status Legend */}
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-700" /> โต๊ะว่าง
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> รอชำระ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ชำระแล้ว
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tableData.map((t) => {
              const isSelected = selectedTable === t.tableNum;
              return (
                <button
                  key={t.tableNum}
                  onClick={() => setSelectedTable(t.tableNum)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between min-h-[120px] ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/40'
                      : t.status === 'awaiting_payment'
                      ? 'border-amber-600/60 bg-amber-950/20 hover:border-amber-500'
                      : t.status === 'paid_eating'
                      ? 'border-emerald-700/60 bg-emerald-950/15 hover:border-emerald-600'
                      : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white font-mono">โต๊ะ {t.tableNum}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        t.status === 'awaiting_payment'
                          ? 'bg-amber-400 animate-pulse'
                          : t.status === 'paid_eating'
                          ? 'bg-emerald-400'
                          : 'bg-stone-700'
                      }`}
                    />
                  </div>

                  <div className="mt-2 space-y-1">
                    {t.status === 'empty' ? (
                      <span className="text-xs text-stone-500">โต๊ะว่าง</span>
                    ) : (
                      <>
                        <div className="text-xs text-stone-300">
                          {t.totalBowls} ชาม · {t.orders.length} ออเดอร์
                        </div>
                        <div className="text-sm font-bold font-mono tabular-nums text-amber-300">
                          {t.totalUnpaid > 0 ? `ค้างชำระ ฿${t.totalUnpaid}` : `รวม ฿${t.totalAmount}`}
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Bill Detail (Right 1 col) */}
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5 flex flex-col justify-between min-h-[500px]">
          {currentTableData ? (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              {/* Header */}
              <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-amber-200">
                    รายละเอียดบิล: โต๊ะ {currentTableData.tableNum}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {currentTableData.orders.length} รายการออเดอร์ · รวม {currentTableData.totalBowls} ชาม
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded bg-stone-800"
                >
                  ปิด
                </button>
              </div>

              {/* Order breakdown */}
              {currentTableData.orders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-stone-300 font-semibold">โต๊ะนี้ยังไม่มีออเดอร์</div>
                  <p className="text-xs">ลูกค้าสามารถสแกน QR โต๊ะ {currentTableData.tableNum} เพื่อเริ่มสั่งได้ทันที</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 max-h-80 pr-1">
                  {currentTableData.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono">{ord.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : 'bg-amber-900/60 text-amber-300'
                          }`}
                        >
                          {ord.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
                        </span>
                      </div>

                      <div className="space-y-1 text-stone-300">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="truncate pr-2">
                              {item.name} x{item.quantity}
                            </span>
                            <span className="font-mono tabular-nums text-stone-400 shrink-0">฿{item.totalPrice}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-stone-700 flex justify-between font-bold text-stone-100">
                        <span>ยอดออเดอร์นี้</span>
                        <span className="text-amber-400 font-mono tabular-nums">฿{ord.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total and Actions */}
              {currentTableData.orders.length > 0 && (
                <div className="pt-4 border-t border-stone-800 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>ยอดค้างชำระทั้งหมด</span>
                      <span className="font-mono tabular-nums text-amber-400 font-bold text-lg">
                        ฿{currentTableData.totalUnpaid}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>ยอดรวมทั้งโต๊ะ</span>
                      <span className="font-mono tabular-nums text-white">฿{currentTableData.totalAmount}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentTableData.totalUnpaid > 0 ? (
                      <>
                        <button
                          onClick={() => {
                            const unpaidOrd = currentTableData.orders.find((o) => o.paymentStatus !== 'paid');
                            if (unpaidOrd) setActivePaymentOrder(unpaidOrd);
                          }}
                          className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>แสดง QR พร้อมเพย์ให้ลูกค้า</span>
                        </button>

                        <button
                          onClick={() => handleMarkTablePaid(currentTableData.tableNum)}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>รับชำระด้วยเงินสด / ตรวจสลิปผ่าน</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>ชำระเงินครบถ้วนทุกรายการแล้ว</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setReceiptModalTable(currentTableData.tableNum)}
                        className="flex-1 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl transition-colors border border-stone-700 flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>พิมพ์ใบเสร็จ</span>
                      </button>

                      <button
                        onClick={() => handleClearTable(currentTableData.tableNum)}
                        className="flex-1 py-2 px-3 bg-stone-800 hover:bg-rose-900/40 hover:text-rose-300 text-stone-400 text-xs font-semibold rounded-xl transition-colors border border-stone-700"
                      >
                        เคลียร์โต๊ะนี้
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-sm text-stone-300 font-semibold">เลือกโต๊ะทางซ้ายเพื่อดูบิล</div>
              <p className="text-xs">คลิกที่หมายเลขโต๊ะเพื่อจัดการการชำระเงิน หรือพิมพ์ใบเสร็จ</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment QR Modal if opened by cashier */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          settings={settings}
          onClose={() => setActivePaymentOrder(null)}
        />
      )}

      {/* Receipt Modal */}
      {receiptModalTable !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white text-stone-900 rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="text-center space-y-1 border-b border-stone-300 pb-3">
              <h4 className="text-sm font-bold tracking-tight">{settings.storeName}</h4>
              <p className="text-[11px] text-stone-600">{settings.branchName}</p>
              <p className="text-[10px] text-stone-500">ใบเสร็จรับเงินอย่างย่อ / Tax Invoice (ABB)</p>
              <div className="text-[10px] text-stone-600 pt-1">
                โต๊ะ {receiptModalTable} · วันที่ {new Date().toLocaleDateString('th-TH')}{' '}
                {new Date().toLocaleTimeString('th-TH')}
              </div>
            </div>

            {/* Receipt Items */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto border-b border-stone-300 pb-3">
              {tableData
                .find((t) => t.tableNum === receiptModalTable)
                ?.orders.flatMap((o) => o.items)
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline">
                    <span className="truncate pr-2 font-sans">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="tabular-nums">฿{item.totalPrice}</span>
                  </div>
                ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between">
                <span>ยอดรวมสุทธิ</span>
                <span className="font-bold text-sm tabular-nums">
                  ฿{tableData.find((t) => t.tableNum === receiptModalTable)?.totalAmount}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-600">
                <span>ช่องทางชำระ</span>
                <span>PromptPay / โอนเงิน</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-stone-500 border-t border-stone-300 pt-3">
              ขอบพระคุณที่อุดหนุน ก๋วยเตี๋ยวเรืออยุธยาแท้
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800"
              >
                พิมพ์
              </button>
              <button
                onClick={() => setReceiptModalTable(null)}
                className="flex-1 py-2 bg-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-300"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
