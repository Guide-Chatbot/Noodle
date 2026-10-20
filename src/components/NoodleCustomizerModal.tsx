import React, { useState } from 'react';
import { X, Plus, Minus, Flame, Check } from 'lucide-react';
import { MenuItem, CustomNoodleOptions, NoodleType, SoupType, MeatOption, SpicyLevel, VeggieChoice, ExtraTopping } from '../types';
import { NOODLE_TYPE_LABELS, SOUP_TYPE_LABELS, MEAT_OPTION_LABELS, SPICY_LEVEL_LABELS, VEGGIE_LABELS, DEFAULT_EXTRA_TOPPINGS } from '../data/initialMenu';

interface Props {
  menuItem: MenuItem;
  onClose: () => void;
  onAddToCart: (item: {
    menuItem: MenuItem;
    quantity: number;
    customOptions: CustomNoodleOptions;
    totalPrice: number;
  }) => void;
}

export const NoodleCustomizerModal: React.FC<Props> = ({ menuItem, onClose, onAddToCart }) => {
  const [bowlSize, setBowlSize] = useState<'regular' | 'special'>('regular');
  const [noodleType, setNoodleType] = useState<NoodleType>('thin');
  const [soupType, setSoupType] = useState<SoupType>('namtok');
  const [selectedMeats, setSelectedMeats] = useState<MeatOption[]>(
    menuItem.id.includes('beef')
      ? ['beef_braised', 'beef_ball']
      : ['pork_slice', 'pork_ball']
  );
  const [spicyLevel, setSpicyLevel] = useState<SpicyLevel>(2);
  const [veggie, setVeggie] = useState<VeggieChoice>('all');
  const [selectedToppings, setSelectedToppings] = useState<ExtraTopping[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const basePrice = bowlSize === 'special' ? (menuItem.specialPrice ?? 60) : menuItem.price;
  const toppingsPrice = selectedToppings.reduce((acc, t) => acc + t.price, 0);
  const singleItemPrice = basePrice + toppingsPrice;
  const totalPrice = singleItemPrice * quantity;

  const toggleMeat = (meatKey: MeatOption) => {
    if (selectedMeats.includes(meatKey)) {
      if (selectedMeats.length > 1) {
        setSelectedMeats(selectedMeats.filter((m) => m !== meatKey));
      }
    } else {
      setSelectedMeats([...selectedMeats, meatKey]);
    }
  };

  const toggleTopping = (topping: ExtraTopping) => {
    const exists = selectedToppings.some((t) => t.id === topping.id);
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToCart({
      menuItem,
      quantity,
      customOptions: {
        bowlSize,
        noodleType,
        soupType,
        meats: selectedMeats,
        spicyLevel,
        veggie,
        extraToppings: selectedToppings,
        notes: notes.trim() || undefined,
      },
      totalPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl text-stone-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 sticky top-0 bg-stone-900/95 backdrop-blur-md z-10">
          <div>
            <h3 className="text-lg font-bold text-amber-100">{menuItem.name}</h3>
            <p className="text-xs text-stone-400 mt-0.5">เลือกปรับแต่งรสชาติ ชามก๋วยเตี๋ยวเรือตามต้องการ</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* 1. ขนาดชาม (Bowl Size) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200">1. ขนาดชาม (Portion Size)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBowlSize('regular')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  bowlSize === 'regular'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-stone-800 bg-stone-800/50 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="font-semibold text-sm">ชามเล็กดั้งเดิม (สูตรซ้อนชาม)</div>
                <div className="text-xs text-amber-400 font-mono mt-1">฿{menuItem.price}</div>
              </button>
              <button
                type="button"
                onClick={() => setBowlSize('special')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  bowlSize === 'special'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-stone-800 bg-stone-800/50 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="font-semibold text-sm">ชามพิเศษ (จุใจชามโต)</div>
                <div className="text-xs text-amber-400 font-mono mt-1">฿{menuItem.specialPrice ?? 60}</div>
              </button>
            </div>
          </div>

          {/* 2. เลือกเส้น (Noodle) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200">2. เลือกเส้น (Noodle Type)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(NOODLE_TYPE_LABELS) as NoodleType[]).map((typeKey) => (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setNoodleType(typeKey)}
                  className={`p-2.5 text-xs text-left rounded-lg border transition-all ${
                    noodleType === typeKey
                      ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-medium'
                      : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  {NOODLE_TYPE_LABELS[typeKey]}
                </button>
              ))}
            </div>
          </div>

          {/* 3. เลือกน้ำซุป (Soup Base) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200">3. น้ำซุป (Soup Base)</label>
            <div className="space-y-1.5">
              {(Object.keys(SOUP_TYPE_LABELS) as SoupType[]).map((sKey) => (
                <button
                  key={sKey}
                  type="button"
                  onClick={() => setSoupType(sKey)}
                  className={`w-full p-2.5 text-xs text-left rounded-lg border flex items-center justify-between transition-all ${
                    soupType === sKey
                      ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-medium'
                      : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span>{SOUP_TYPE_LABELS[sKey]}</span>
                  {soupType === sKey && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 4. เนื้อสัตว์ & ลูกชิ้น (Meats) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-stone-200">4. เนื้อสัตว์และลูกชิ้น (เลือกได้หลายอย่าง)</label>
              <span className="text-[11px] text-stone-400">เลือกอย่างน้อย 1 ชนิด</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MEAT_OPTION_LABELS) as MeatOption[]).map((mKey) => {
                const isSelected = selectedMeats.includes(mKey);
                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => toggleMeat(mKey)}
                    className={`p-2.5 text-xs text-left rounded-lg border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-medium'
                        : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span>{MEAT_OPTION_LABELS[mKey]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. ระดับความเผ็ด (Spice Level) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-stone-200">5. ระดับความเผ็ดพริกคั่วโบราณ</label>
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Flame
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < spicyLevel ? 'text-amber-500 fill-amber-500' : 'text-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {SPICY_LEVEL_LABELS.map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setSpicyLevel(item.level as SpicyLevel)}
                  className={`p-2 text-center rounded-lg border transition-all ${
                    spicyLevel === item.level
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold'
                      : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-xs">{item.level}</div>
                  <div className="text-[10px] mt-0.5 truncate">{item.title.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 6. ผัก (Veggies) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200">6. ผักโรยและผักลวก</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(VEGGIE_LABELS) as VeggieChoice[]).map((vKey) => (
                <button
                  key={vKey}
                  type="button"
                  onClick={() => setVeggie(vKey)}
                  className={`p-2.5 text-xs text-left rounded-lg border transition-all ${
                    veggie === vKey
                      ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-medium'
                      : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  {VEGGIE_LABELS[vKey]}
                </button>
              ))}
            </div>
          </div>

          {/* 7. เครื่องเคียงพิเศษ (Extra Toppings) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-200">7. เครื่องเคียงเพิ่มความฟิน (ท็อปปิ้งเสริม)</label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_EXTRA_TOPPINGS.map((topping) => {
                const isSelected = selectedToppings.some((t) => t.id === topping.id);
                return (
                  <button
                    key={topping.id}
                    type="button"
                    onClick={() => toggleTopping(topping)}
                    className={`p-2.5 text-xs text-left rounded-lg border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-white font-medium'
                        : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <span>{topping.name}</span>
                    <span className="text-amber-400 font-mono text-[11px]">+฿{topping.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="space-y-1.5">
            <label className="text-xs text-stone-400">หมายเหตุเพิ่มเติมถึงก้นครัว</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ขอซุปน้ำตกข้นๆ, แยกพริก, ไม่กระเทียมเจียว"
              className="w-full px-3 py-2 text-xs bg-stone-800/80 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </form>

        {/* Footer with quantity and submit */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/95 sticky bottom-0 rounded-b-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 border border-stone-800 rounded-lg p-1 bg-stone-800/60">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-stone-700 text-white hover:bg-stone-600 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold font-mono tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-stone-700 text-white hover:bg-stone-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-colors shadow-lg shadow-amber-950/40 flex items-center justify-between"
          >
            <span>เพิ่มลงชามสั่งอาหาร</span>
            <span className="font-mono tabular-nums text-base">฿{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
