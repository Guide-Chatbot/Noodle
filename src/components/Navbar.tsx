import React from 'react';
import { AppViewMode } from '../types';
import { ExternalLink } from 'lucide-react';

interface Props {
  currentView: AppViewMode;
  onViewChange: (view: AppViewMode) => void;
  tableNumber: number;
}

export const Navbar: React.FC<Props> = ({ currentView, onViewChange, tableNumber }) => {
  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single Text Element Wordmark */}
        <button
          onClick={() => onViewChange('customer')}
          className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:text-amber-300 transition-colors"
        >
          <span>เรือทอง อยุธยา</span>
        </button>

        {/* Zone 2: 4-5 Concise Single-Line Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-stone-300 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onViewChange('customer')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'customer'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            สั่งอาหารโต๊ะ {tableNumber}
          </button>

          <button
            onClick={() => onViewChange('kitchen')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'kitchen'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            จอครัว KDS
          </button>

          <button
            onClick={() => onViewChange('pos')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'pos'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            แคชเชียร์ POS
          </button>

          <button
            onClick={() => onViewChange('menu')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'menu'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            จัดการเมนู
          </button>

          <button
            onClick={() => onViewChange('qr_tables')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'qr_tables'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            คิวอาร์โต๊ะ
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={handleOpenNewTab}
            title="เปิดอีกแท็บเพื่อทดสอบระบบจอครัว หรือจำลองลูกค้าสั่งจากคนละหน้าจอแบบ Real-time"
            className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-stone-800/90 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เปิดแท็บคู่ขนาน</span>
          </button>
        </div>
      </div>
    </header>
  );
};
