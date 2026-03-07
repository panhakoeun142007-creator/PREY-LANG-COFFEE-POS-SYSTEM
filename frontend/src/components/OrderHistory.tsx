import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Search, Bell, X, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import coffeeLogo from '../assets/coffee.png';
import { Order } from '../types';
import { buildOrderDisplayIdMap } from '../lib/orderDisplayId';
import { createRecipeLog } from '../lib/api';

interface OrderHistoryProps {
  orders: Order[];
}

function ReceiptCard({ order, displayId }: { order: Order; displayId: string }) {
  return (
    <div className="receipt-card">
      <div className="receipt-head">
        <img src={coffeeLogo} className="receipt-logo" alt="logo" />
        <h2 className="receipt-title">PREY LANG COFFEE</h2>
        <p className="receipt-sub">Street 371, Phnom Penh</p>
      </div>

      <div className="receipt-line" />

      <div className="receipt-meta">
        <div className="receipt-meta-row">
          <span className="receipt-label">RECEIPT NO</span>
          <span className="receipt-value">{displayId}</span>
        </div>
        <div className="receipt-meta-row">
          <span className="receipt-label">TABLE</span>
          <span className="receipt-value">{order.tableNo}</span>
        </div>
      </div>

      <div className="receipt-line" />

      <div className="receipt-items">
        {(order.items || []).map((item, i) => (
          <div key={i} className="receipt-item">
            <div className="receipt-item-row">
              <p className="receipt-item-name">{item.name.toUpperCase()}</p>
              <p className="receipt-item-price">
                ${(item.quantity * (item.price || 0)).toFixed(2)}
              </p>
            </div>
            <p className="receipt-item-sub">
              {item.quantity}x @ ${(item.price || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="receipt-total">
        <span className="receipt-total-label">TOTAL</span>
        <span className="receipt-total-value">${(order.total || 0).toFixed(2)}</span>
      </div>

      <p className="receipt-thanks">THANK YOU FOR YOUR VISIT!</p>
      <div className="receipt-cut" />
    </div>
  );
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders = [] }) => {
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingPrintLog, setIsSavingPrintLog] = useState(false);
  const [printedOrderIds, setPrintedOrderIds] = useState<Set<string>>(new Set());
  const orderDisplayIdMap = useMemo(() => buildOrderDisplayIdMap(orders.map((order) => order.id)), [orders]);

  const handlePrint = async () => {
    if (!orderToPrint) return;
    if (isSavingPrintLog) return;

    if (!printedOrderIds.has(orderToPrint.id)) {
      try {
        setIsSavingPrintLog(true);
        await Promise.all(
          orderToPrint.items.map((item) =>
            createRecipeLog({
              order_id: orderToPrint.id,
              table_no: orderToPrint.tableNo,
              name: item.name,
            })
          )
        );
        setPrintedOrderIds((prev) => new Set(prev).add(orderToPrint.id));
      } catch (error) {
        console.error('Failed to save print log', error);
        toast.error('Failed to save receipt history. Please try again.');
        return;
      } finally {
        setIsSavingPrintLog(false);
      }
    }

    window.print();
  };

  const filteredOrders = orders.filter(
    (order) =>
      (orderDisplayIdMap[order.id] ?? order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNo.toString().toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <div id="order-history-page" className="w-full space-y-6 pb-16 transition-colors duration-500">
        <style>{`
          #print-preview-overlay {
            position: fixed;
            inset: 0;
            background:
              radial-gradient(circle at 20% 10%, rgba(217, 119, 6, 0.12), transparent 45%),
              rgba(15, 23, 42, 0.82);
            display: ${orderToPrint ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: clamp(16px, 3vw, 32px);
            backdrop-filter: blur(8px);
          }

          #print-preview-shell {
            width: min(94vw, 460px);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          #print-sheet {
            display: none;
          }

          .receipt-card {
            width: min(92vw, 380px);
            background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
            border: 1px solid #e5e7eb;
            border-radius: 22px;
            padding: 24px 20px;
            color: #0f172a;
            box-shadow:
              0 24px 55px -22px rgba(15, 23, 42, 0.55),
              0 12px 24px -14px rgba(15, 23, 42, 0.35);
            font-family: "Segoe UI", Tahoma, sans-serif;
          }

          .receipt-head {
            text-align: center;
            margin-bottom: 6px;
          }

          .receipt-logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
            display: block;
            margin: 0 auto 8px;
          }

          .receipt-title {
            margin: 0;
            font-size: 22px;
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: 0.4px;
          }

          .receipt-sub {
            margin: 8px 0 0;
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
          }

          .receipt-line {
            border-top: 1px solid #dbe1ea;
            margin: 14px 0;
          }

          .receipt-meta {
            display: grid;
            gap: 8px;
          }

          .receipt-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
          }

          .receipt-label {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.2px;
            max-width: 90px;
          }

          .receipt-value {
            color: #0f172a;
            font-size: 16px;
            line-height: 1.2;
            font-weight: 900;
            text-align: right;
            word-break: break-word;
            max-width: 210px;
          }

          .receipt-items {
            display: grid;
            gap: 10px;
          }

          .receipt-item-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 8px;
          }

          .receipt-item-name,
          .receipt-item-price {
            margin: 0;
            font-size: 18px;
            line-height: 1.1;
            font-weight: 900;
          }

          .receipt-item-sub {
            margin: 5px 0 0;
            color: #64748b;
            font-size: 12px;
            font-weight: 600;
          }

          .receipt-total {
            margin-top: 12px;
            padding-top: 14px;
            border-top: 2px solid #17213a;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 10px;
          }

          .receipt-total-label {
            font-size: 28px;
            line-height: 1.05;
            font-weight: 900;
            color: #0f172a;
          }

          .receipt-total-value {
            font-size: 42px;
            line-height: 0.95;
            font-weight: 900;
            color: #b65d0a;
            white-space: nowrap;
          }

          .receipt-thanks {
            margin: 14px 0 0;
            text-align: center;
            font-size: 14px;
            line-height: 1.15;
            font-weight: 900;
            letter-spacing: 0.8px;
          }

          @media (max-width: 430px) {
            .receipt-card {
              width: min(96vw, 350px);
              padding: 18px 14px;
            }

            .receipt-value {
              font-size: 16px;
              max-width: 190px;
            }

            .receipt-item-name,
            .receipt-item-price {
              font-size: 17px;
            }

            .receipt-total-label {
              font-size: 24px;
            }

            .receipt-total-value {
              font-size: 34px;
            }
          }

          .receipt-cut {
            border-top: 1px dashed #cbd5e1;
            margin-top: 16px;
          }

          #print-preview-actions {
            width: min(94vw, 380px);
            display: flex;
            gap: 10px;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(8px);
            padding: 10px;
          }

          @media (max-width: 560px) {
            #print-preview-actions {
              flex-direction: column;
            }
          }

          @media print {
            @page {
              size: 100mm 155mm;
              margin: 0;
            }

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }

            #order-history-page {
              display: none !important;
            }

            #print-sheet {
              display: flex !important;
              position: fixed !important;
              inset: 0 !important;
              align-items: center !important;
              justify-content: center !important;
              background: #fff !important;
            }

            #print-sheet .receipt-card {
              width: 100mm !important;
              max-width: 100mm !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 8mm 6mm !important;
            }
          }
        `}</style>

        <div className="no-print w-full">
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 p-2 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm">
                <img src={coffeeLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight transition-colors">
                  Order History
                </h1>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Prey Lang POS
                </p>
              </div>
            </div>
            <button className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-[#BD5E0A] transition-colors">
              <Bell size={20} />
            </button>
          </header>

          <div className="relative mb-6">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"
              size={18}
            />
            <input
              type="text"
              placeholder="Search Order ID or Table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BD5E0A]/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10 flex items-center justify-between shadow-sm transition-colors hover:border-[#BD5E0A]/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <Hash size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{order.tableNo}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Order {orderDisplayIdMap[order.id] ?? order.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black text-[#BD5E0A]">${(order.total || 0).toFixed(2)}</p>
                  <button
                    onClick={() => setOrderToPrint(order)}
                    className="p-3 bg-[#BD5E0A] text-white rounded-xl hover:bg-[#964B08] transition-all active:scale-95 shadow-lg shadow-orange-900/20"
                  >
                    <Printer size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {orderToPrint && createPortal(
        <div id="print-preview-overlay">
          <div id="print-preview-shell">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Receipt Preview
            </p>
            <ReceiptCard order={orderToPrint} displayId={orderDisplayIdMap[orderToPrint.id] ?? orderToPrint.id} />

            <div id="print-preview-actions" className="no-print">
              <button
                onClick={() => setOrderToPrint(null)}
                className="px-6 py-3 bg-slate-700/80 text-slate-100 rounded-xl font-bold text-xs uppercase tracking-[0.15em] hover:bg-slate-600 transition-all"
              >
                <X size={16} className="inline mr-2" />
                Back
              </button>
              <button
                onClick={handlePrint}
                disabled={isSavingPrintLog}
                className="px-7 py-3 bg-[#BD5E0A] text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl hover:bg-[#964B08] transition-all"
              >
                {isSavingPrintLog ? 'Saving...' : 'Print / Save PDF'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {orderToPrint && createPortal(
        <div id="print-sheet" aria-hidden="true">
          <ReceiptCard order={orderToPrint} displayId={orderDisplayIdMap[orderToPrint.id] ?? orderToPrint.id} />
        </div>,
        document.body
      )}
    </>
  );
};

export default OrderHistory;
