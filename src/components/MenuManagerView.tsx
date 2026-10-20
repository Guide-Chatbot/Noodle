import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, RefreshCw, Save, Store, DollarSign, Eye, EyeOff } from 'lucide-react';
import { MenuItem, StoreSettings, MenuCategory } from '../types';
import { storeSync } from '../services/storeSync';

interface Props {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
}

export const MenuManagerView: React.FC<Props> = ({ settings, onSaveSettings }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu');
  const [storeForm, setStoreForm] = useState<StoreSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadMenu = () => {
      setMenuItems(storeSync.getMenuItems());
    };
    loadMenu();
    const unsub = storeSync.subscribe(loadMenu);
    return unsub;
  }, []);

  const handleToggleStock = (itemId: string) => {
    storeSync.toggleItemAvailability(itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      storeSync.deleteMenuItem(itemId);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    storeSync.saveMenuItem(editingItem);
    setEditingItem(null);
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storeSync.saveSettings(storeForm);
    onSaveSettings(storeForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetData = () => {
    if (confirm('ต้องการคืนค่าข้อมูลเมนูและออเดอร์เริ่มต้นทั้งหมดใช่หรือไม่?')) {
      storeSync.resetDemoData();
      setStoreForm(storeSync.getSettings());
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'menu'
                ? 'bg-amber-600 text-stone-950'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
            }`}
          >
            จัดการรายการเมนู & สต็อก
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'bg-amber-600 text-stone-950'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
            }`}
          >
            ตั้งค่าร้าน & บัญชีพร้อมเพย์
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'menu' && (
            <button
              onClick={() =>
                setEditingItem({
                  id: `m-${Date.now()}`,
                  name: '',
                  category: 'noodles',
                  price: 25,
                  description: '',
                  imageUrl: '/src/assets/images/hero_boat_noodle_1792512398955.jpg',
                  isAvailable: true,
                  isCustomizable: false,
                })
              }
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มเมนูใหม่</span>
            </button>
          )}

          <button
            onClick={handleResetData}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-medium rounded-xl border border-stone-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Menu Management */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/60 border-b border-stone-800 text-stone-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">รายการอาหาร</th>
                    <th className="py-3 px-4 font-semibold">หมวดหมู่</th>
                    <th className="py-3 px-4 font-semibold text-right">ราคา</th>
                    <th className="py-3 px-4 font-semibold text-center">สถานะของหมด</th>
                    <th className="py-3 px-4 font-semibold text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-stone-800 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-stone-100">{item.name}</div>
                            <div className="text-[11px] text-stone-400 line-clamp-1 max-w-xs">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-300">
                        {item.category === 'noodles' && 'ก๋วยเตี๋ยวเรือ'}
                        {item.category === 'sides' && 'ทานเล่น / เครื่องเคียง'}
                        {item.category === 'desserts' && 'ขนมหวาน'}
                        {item.category === 'drinks' && 'เครื่องดื่ม'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-400">
                        ฿{item.price}
                        {item.specialPrice && (
                          <span className="text-[11px] text-stone-500 block font-normal">
                            พิเศษ ฿{item.specialPrice}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStock(item.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto ${
                            item.isAvailable
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60 hover:bg-rose-900/60'
                          }`}
                        >
                          {item.isAvailable ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>มีพร้อมเสิร์ฟ</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>ของหมดชั่วคราว</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Store & PromptPay Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveStoreSettings} className="p-6 rounded-2xl bg-stone-900 border border-stone-800 max-w-2xl space-y-5">
          <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              <span>ข้อมูลร้านและช่องทางรับชำระเงิน</span>
            </h3>
            {isSaved && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> บันทึกสำเร็จแล้ว
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">ชื่อร้านอาหาร</label>
              <input
                type="text"
                value={storeForm.storeName}
                onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">สาขา</label>
              <input
                type="text"
                value={storeForm.branchName}
                onChange={(e) => setStoreForm({ ...storeForm, branchName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>ตั้งค่าระบบชำระเงิน PromptPay QR (ธนาคารแห่งประเทศไทย)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300">
                  หมายเลขพร้อมเพย์ (เบอร์มือถือ หรือ เลขบัตร/เลขผู้เสียภาษี 13 หลัก)
                </label>
                <input
                  type="text"
                  value={storeForm.promptPayNumber}
                  onChange={(e) => setStoreForm({ ...storeForm, promptPayNumber: e.target.value })}
                  placeholder="เช่น 0891234567"
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-800 border border-stone-700 rounded-xl text-amber-300 focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300">ชื่อบัญชีรับเงิน (แสดงบนหน้าจอ QR)</label>
                <input
                  type="text"
                  value={storeForm.promptPayAccountName}
                  onChange={(e) => setStoreForm({ ...storeForm, promptPayAccountName: e.target.value })}
                  placeholder="เช่น บจก. เรือทอง เรสเตอรองต์"
                  className="w-full px-3 py-2 text-xs bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">จำนวนโต๊ะในร้าน</label>
              <input
                type="number"
                min="1"
                max="30"
                value={storeForm.tableCount}
                onChange={(e) => setStoreForm({ ...storeForm, tableCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">ราคาก๋วยเตี๋ยวชามเล็ก (฿)</label>
              <input
                type="number"
                min="10"
                value={storeForm.regularBowlPrice}
                onChange={(e) => setStoreForm({ ...storeForm, regularBowlPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">ราคาก๋วยเตี๋ยวชามพิเศษ (฿)</label>
              <input
                type="number"
                min="20"
                value={storeForm.specialBowlPrice}
                onChange={(e) => setStoreForm({ ...storeForm, specialBowlPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่าร้าน</span>
          </button>
        </form>
      )}

      {/* Edit / Add Menu Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 text-stone-100">
            <h4 className="text-base font-bold text-amber-200">
              {menuItems.some((i) => i.id === editingItem.id) ? 'แก้ไขรายการอาหาร' : 'เพิ่มเมนูอาหารใหม่'}
            </h4>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-stone-300 font-semibold">ชื่อเมนูอาหาร</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="เช่น ก๋วยเตี๋ยวเรือหมูอยุธยา"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold">หมวดหมู่</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as MenuCategory })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-hidden"
                  >
                    <option value="noodles">ก๋วยเตี๋ยวเรือ</option>
                    <option value="sides">ทานเล่น / เครื่องเคียง</option>
                    <option value="desserts">ขนมหวาน</option>
                    <option value="drinks">เครื่องดื่ม</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-semibold">ราคาธรรมดา (฿)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white font-mono focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-semibold">คำอธิบายเมนู</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-hidden"
                  placeholder="ระบุสูตร หรือจุดเด่นของเมนู..."
                  required
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isCustomizable || false}
                    onChange={(e) => setEditingItem({ ...editingItem, isCustomizable: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>เปิดระบบปรับแต่งเส้น / ซุป / ระดับความเผ็ด</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl transition-colors"
                >
                  บันทึกรายการ
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
