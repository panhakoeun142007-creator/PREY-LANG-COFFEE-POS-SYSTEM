import React, { useState } from 'react';
import { Printer, Search, Bell, X, Hash } from 'lucide-react';
import coffeeLogo from '../assets/coffee.png'; 

const OrderHistory = ({ orders = [] }) => {
  const [orderToPrint, setOrderToPrint] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter(order =>
    order.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNo.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    /* MAIN CONTAINER: Uses bg-[#0f172a] for Dark Mode to match Dashboard */
    <div className="min-h-screen bg-white dark:bg-[#0f172a] p-4 md:p-8 pb-32 transition-colors duration-500">
      
      {/* --- PRINT & PREVIEW CSS --- */}
      <style>{`
        #print-preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: ${orderToPrint ? 'flex' : 'none'};
          flex-direction: column;
          align-items: center;    
          justify-content: center; 
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(8px);
        }

        .paper-receipt {
          background: white !important;
          width: 320px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 30px 25px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          border-radius: 16px;
          color: #0f172a !important; 
          margin: 0 auto;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
          }
          body * {
            visibility: hidden !important;
          }
          #physical-receipt, #physical-receipt * {
            visibility: visible !important;
          }
          #physical-receipt {
            position: relative !important;
            margin: 0 auto !important;
            width: 72mm !important;
            padding: 4mm !important;
            box-shadow: none !important;
            display: block !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* --- DASHBOARD UI --- */}
      <div className="no-print max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 p-2 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm">
              <img src={coffeeLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight transition-colors">Order History</h1>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Prey Lang POS</p>
            </div>
          </div>
          <button className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-[#BD5E0A] transition-colors">
            <Bell size={20} />
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
          <input 
            type="text"
            placeholder="Search Order ID or Table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BD5E0A]/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>

        {/* Orders List */}
        <div className="grid gap-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10 flex items-center justify-between shadow-sm transition-colors hover:border-[#BD5E0A]/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-600">
                   <Hash size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{order.tableNo}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Order #{order.id}</p>
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
          {filteredOrders.length === 0 && (
            <div className="text-center py-20 bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
              <p className="text-slate-400 dark:text-slate-600 font-bold">No matching records found.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- THE PREVIEW OVERLAY --- */}
      {orderToPrint && (
        <div id="print-preview-overlay">
          <div className="flex flex-col items-center gap-4 w-full max-w-[320px]">
            <button 
              onClick={() => setOrderToPrint(null)}
              className="self-end p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors no-print"
            >
              <X size={24} />
            </button>

            {/* Centered White Receipt */}
            <div id="physical-receipt" className="paper-receipt text-slate-900 font-sans text-center">
              <div className="flex flex-col items-center mb-4">
                <img src={coffeeLogo} className="w-16 h-16 object-contain mb-3" alt="logo" />
                <h2 className="text-lg font-black uppercase tracking-tight leading-none">Prey Lang Coffee</h2>
                <p className="text-[10px] font-medium text-slate-500 mt-1">Street 371, Phnom Penh</p>
              </div>

              <div className="border-t border-slate-200 my-3" />

              <div className="space-y-1 text-[12px] font-bold text-left">
                <div className="flex justify-between">
                  <span className="uppercase text-slate-400 text-[10px]">Receipt No</span>
                  <span>#{orderToPrint.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="uppercase text-slate-400 text-[10px]">Table</span>
                  <span>{orderToPrint.tableNo}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 my-3" />

              <div className="space-y-4 mb-4 text-left">
                {(orderToPrint.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-[12px] uppercase">{item.name}</p>
                      <p className="font-bold text-[12px]">${(item.quantity * (item.price || 0)).toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                       <p className="text-[10px] text-slate-500">{item.quantity}x @ ${(item.price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-slate-900 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase">Total</span>
                  <span className="text-xl font-black text-[#BD5E0A]">${(orderToPrint.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">Thank you for your visit!</p>
                <div className="w-full border-t border-dashed border-slate-200 mt-5" />
              </div>
            </div>

            <button 
              onClick={handlePrint}
              className="no-print w-full py-4 bg-[#BD5E0A] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#964B08] transition-all"
            >
              Confirm & Print Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
