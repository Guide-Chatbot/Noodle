import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, Upload, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, StoreSettings } from '../types';
import { generatePromptPayPayload, generateQrDataUrl } from '../utils/promptpay';
import { storeSync } from '../services/storeSync';

interface Props {
  order: Order;
  settings: StoreSettings;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<Props> = ({ order, settings, onClose, onPaymentSuccess }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(order.paymentStatus === 'paid');
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(order.slipUrl || null);

  // Generate PromptPay QR
  useEffect(() => {
    async function loadQr() {
      const payload = generatePromptPayPayload(settings.promptPayNumber, order.totalAmount);
      const dataUrl = await generateQrDataUrl(payload);
      setQrDataUrl(dataUrl);
    }
    loadQr();
  }, [settings.promptPayNumber, order.totalAmount]);

  // Timer countdown
  useEffect(() => {
    if (isPaid) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid]);

  // Listen to remote payment updates
  useEffect(() => {
    const unsub = storeSync.subscribe(() => {
      const currentOrders = storeSync.getOrders();
      const updated = currentOrders.find((o) => o.id === order.id);
      if (updated && updated.paymentStatus === 'paid' && !isPaid) {
        setIsPaid(true);
        triggerConfetti();
        if (onPaymentSuccess) onPaymentSuccess();
      }
    });
    return unsub;
  }, [order.id, isPaid, onPaymentSuccess]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d97706', '#10b981', '#ffffff'],
      });
    } catch {
      // ignore
    }
  };

  // Immediate simulation of user scanning QR code and paying via mobile banking
  const handleSimulatePayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsPaid(true);
      storeSync.updatePaymentStatus(order.id, 'paid');
      triggerConfetti();
      if (onPaymentSuccess) onPaymentSuccess();
    }, 1200);
  };

  // Handle mock bank slip upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const slipUrl = event.target?.result as string;
      setUploadedSlip(slipUrl);
      setIsVerifying(true);
      // Auto verify slip after 1.5s
      setTimeout(() => {
        setIsVerifying(false);
        setIsPaid(true);
        storeSync.updatePaymentStatus(order.id, 'paid', slipUrl);
        triggerConfetti();
        if (onPaymentSuccess) onPaymentSuccess();
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md my-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl text-stone-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-amber-100">ชำระเงินออนไลน์ (PromptPay QR)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Order Details Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
            <div>
              <div className="text-xs text-stone-400">เลขออเดอร์ / โต๊ะ</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {order.orderNumber} <span className="text-amber-400">· โต๊ะ {order.tableNumber}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-400">ยอดชำระทั้งหมด</div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-400">
                ฿{order.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {isPaid ? (
            /* Payment Success Screen */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">ชำระเงินสำเร็จแล้ว</h4>
                <p className="text-xs text-stone-400 mt-1">
                  ระบบส่งรายการอาหารไปยังก้นครัวเรียบร้อยแล้ว ก๋วยเตี๋ยวเรือกำลังเตรียมปรุง
                </p>
              </div>

              {uploadedSlip && (
                <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700 text-left">
                  <div className="text-xs text-stone-400 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> สลิปการโอนเงิน (ตรวจสอบผ่านแล้ว)
                  </div>
                  <img
                    src={uploadedSlip}
                    alt="หลักฐานการโอนเงิน"
                    className="max-h-36 rounded-lg mx-auto object-contain border border-stone-700"
                  />
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-colors shadow-lg shadow-amber-950/40"
              >
                เสร็จสิ้น / ติดตามสถานะออเดอร์
              </button>
            </div>
          ) : (
            /* QR Scanning Screen */
            <div className="space-y-4">
              {/* QR Container */}
              <div className="p-4 bg-white rounded-2xl shadow-inner text-center flex flex-col items-center">
                {/* PromptPay Header */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-black tracking-wider text-blue-900 uppercase">PROMPTPAY</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm font-semibold">
                    พร้อมเพย์
                  </span>
                </div>

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="PromptPay QR Code"
                    className="w-56 h-56 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 bg-stone-100 animate-pulse rounded-lg flex items-center justify-center text-stone-400 text-xs">
                    กำลังสร้าง QR Code...
                  </div>
                )}

                <div className="mt-2 text-stone-800 text-xs font-medium">
                  {settings.promptPayAccountName}
                </div>
                <div className="text-stone-500 text-[11px] font-mono tabular-nums">
                  พร้อมเพย์: {settings.promptPayNumber}
                </div>
              </div>

              {/* Timer & Instruction */}
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span className="flex items-center gap-1 text-stone-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> สแกนจ่ายได้ทุกแอปธนาคาร
                </span>
                <span className="font-mono tabular-nums text-amber-400">
                  หมดอายุใน {formattedTime}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSimulatePayment}
                  disabled={isVerifying}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      กำลังตรวจสอบยอดเงิน...
                    </>
                  ) : (
                    <>
                      <span>จำลองสแกนจ่ายผ่านแอปธนาคารสำเร็จ</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Upload Slip Option */}
                <label className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700/80 text-stone-300 font-medium text-xs rounded-xl transition-colors border border-stone-700 flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>แนบรูปสลิปเพื่อตรวจสอบอัตโนมัติ</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
