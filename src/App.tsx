import { useState, useEffect } from 'react';
import { AppViewMode, StoreSettings } from './types';
import { storeSync } from './services/storeSync';
import { Navbar } from './components/Navbar';
import { CustomerOrderView } from './components/CustomerOrderView';
import { KitchenKdsView } from './components/KitchenKdsView';
import { CashierPosView } from './components/CashierPosView';
import { MenuManagerView } from './components/MenuManagerView';
import { TableQrPrintModal } from './components/TableQrPrintModal';

export default function App() {
  const [currentView, setCurrentView] = useState<AppViewMode>('customer');
  const [tableNumber, setTableNumber] = useState<number>(3);
  const [settings, setSettings] = useState<StoreSettings>(storeSync.getSettings());

  // Check URL query parameters for table e.g. ?table=5
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable) {
        const parsed = parseInt(urlTable, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setTableNumber(parsed);
          setCurrentView('customer');
        }
      }
    }
  }, []);

  // Subscribe to settings updates
  useEffect(() => {
    const unsub = storeSync.subscribe(() => {
      setSettings(storeSync.getSettings());
    });
    return unsub;
  }, []);

  const handleSelectTableForCustomer = (num: number) => {
    setTableNumber(num);
    setCurrentView('customer');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* 3-Zone Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        tableNumber={tableNumber}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentView === 'customer' && (
          <CustomerOrderView
            tableNumber={tableNumber}
            onTableChange={setTableNumber}
            settings={settings}
          />
        )}

        {currentView === 'kitchen' && <KitchenKdsView />}

        {currentView === 'pos' && <CashierPosView settings={settings} />}

        {currentView === 'menu' && (
          <MenuManagerView
            settings={settings}
            onSaveSettings={setSettings}
          />
        )}

        {currentView === 'qr_tables' && (
          <TableQrPrintModal
            settings={settings}
            onSelectTableForCustomer={handleSelectTableForCustomer}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-stone-300">{settings.storeName}</span>
            <span className="mx-2">·</span>
            <span>{settings.branchName}</span>
            <span className="mx-2">·</span>
            <span>พร้อมเพย์: {settings.promptPayNumber}</span>
          </div>
          <div className="text-[11px] text-stone-600">
            ระบบสั่งอาหารผ่าน QR Code และชำระเงินออนไลน์แบบเรียลไทม์
          </div>
        </div>
      </footer>
    </div>
  );
}
