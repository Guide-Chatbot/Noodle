import React, { useState, useEffect } from 'react';
import { Printer, ExternalLink, QrCode } from 'lucide-react';
import { StoreSettings } from '../types';
import { generateQrDataUrl } from '../utils/promptpay';

interface Props {
  settings: StoreSettings;
  onSelectTableForCustomer: (tableNum: number) => void;
}

export const TableQrPrintModal: React.FC<Props> = ({ settings, onSelectTableForCustomer }) => {
  const [qrMap, setQrMap] = useState<Record<number, string>>({});
  const [selectedTable, setSelectedTable] = useState<number>(1);

  // Generate QR data URLs for tables
  useEffect(() => {
    async function makeQrs() {
      const map: Record<number, string> = {};
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rueathong.app';

      for (let t = 1; t <= settings.tableCount; t++) {
        // Link with table parameter
        const tableUrl = `${baseUrl}?table=${t}`;
        map[t] = await generateQrDataUrl(tableUrl);
      }
      setQrMap(map);
    }
    makeQrs();
  }, [settings.tableCount]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>สร้างและพิมพ์ป้าย QR Code ประจำโต๊ะ (Table QR Generator)</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            ลูกค้าสแกนเพื่อสั่งอาหารตามเบอร์โต๊ะ และชำระเงินออนไลน์แบบเรียลไทม์
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>สั่งพิมพ์ป้ายตั้งโต๊ะทั้งหมด</span>
        </button>
      </div>

      {/* Table Selector Grid for preview */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {Array.from({ length: settings.tableCount }).map((_, idx) => {
          const tNum = idx + 1;
          return (
            <button
              key={tNum}
              onClick={() => setSelectedTable(tNum)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
                selectedTable === tNum
                  ? 'bg-amber-600 text-stone-950'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              โต๊ะ {tNum}
            </button>
          );
        })}
      </div>

      {/* Featured Preview Stand Card */}
      <div className="max-w-md mx-auto bg-stone-950 p-6 rounded-3xl border border-stone-800 shadow-2xl text-stone-900 text-center space-y-4">
        {/* Printable Card Frame */}
        <div className="bg-white rounded-2xl p-6 shadow-inner space-y-4 border border-stone-200">
          <div className="space-y-1">
            <span className="text-[10px] tracking-widest uppercase font-bold text-amber-700">
              ยินดีต้อนรับสู่
            </span>
            <h4 className="text-xl font-extrabold text-stone-900 tracking-tight">
              {settings.storeName}
            </h4>
            <p className="text-xs text-stone-500">{settings.branchName}</p>
          </div>

          {/* Big Table Badge */}
          <div className="inline-block px-5 py-1.5 bg-amber-600 text-white rounded-full font-black text-sm tracking-wide">
            โต๊ะ {selectedTable}
          </div>

          {/* QR Image */}
          <div className="p-2 border-2 border-dashed border-stone-300 rounded-xl inline-block bg-stone-50">
            {qrMap[selectedTable] ? (
              <img
                src={qrMap[selectedTable]}
                alt={`QR โต๊ะ ${selectedTable}`}
                className="w-52 h-52 object-contain mx-auto"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-stone-400">
                กำลังสร้าง QR...
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <div className="font-bold text-stone-800">
              สแกนสั่งก๋วยเตี๋ยวเรือ & ชำระเงินได้ทันที
            </div>
            <p className="text-[11px] text-stone-500">
              ไม่ต้องรอเรียกพนักงาน รับออเดอร์ตรงถึงก้นครัว
            </p>
          </div>

          {/* Wi-Fi Details */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-around text-[10px] text-stone-600 font-mono">
            <div>Wi-Fi: <strong className="text-stone-800">{settings.wifiSsid}</strong></div>
            <div>รหัส: <strong className="text-stone-800">{settings.wifiPass}</strong></div>
          </div>
        </div>

        {/* Action to switch directly into Customer View for this table */}
        <button
          onClick={() => onSelectTableForCustomer(selectedTable)}
          className="w-full py-3 px-4 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>จำลองเปิดหน้าสั่งอาหารโต๊ะ {selectedTable}</span>
        </button>
      </div>
    </div>
  );
};
