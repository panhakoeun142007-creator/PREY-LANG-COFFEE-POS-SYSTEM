import React, { useState } from 'react';
import { Printer, Search, Clock, Coffee, Calendar, ShoppingBag } from 'lucide-react';
import coffeeLogo from '../assets/coffee.png'; 

const OrderHistory = ({ orders }) => {
  const [orderToPrint, setOrderToPrint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePrint = () => {
    window.print();
    setOrderToPrint(null);
  };

  const filteredOrders = orders.filter(order => 
    order.id.toString().includes(searchTerm) ||
    order.tableNo.toString().includes(searchTerm)
  );

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status !== 'Paid').length; 

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-8">
      {/* --- CRITICAL PRINT CSS --- */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto; 
            margin: 0;
          }
          /* FIX: This forces the printer to use color */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          body * { 
            visibility: hidden !important; 
          }
          #physical-receipt, #physical-receipt * { 
            visibility: visible !important; 
          }
          #physical-receipt { 
            position: absolute !important; 
            /* BACK TO YOUR ORIGINAL CENTERING STYLE */
            left: 50% !important; 
            top: 50% !important; 
            transform: translate(-50%, -50%) !important;
            width: 80mm !important; 
            background: white !important; 
            color: black !important;
            padding: 10mm !important;
            height: auto !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* --- DASHBOARD (Screen Only) --- */}
      <div className="no-print max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Order History</h1>
              <p className="text-slate-500 mt-1 font-medium">View and manage past orders</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Coffee className="text-white" size={28} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Clock className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Pending Orders</p>
                  <p className="text-2xl font-black text-slate-900">{pendingOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Orders</p>
                  <p className="text-2xl font-black text-slate-900">{totalOrders}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search by order ID or table number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl py-4 pl-14 pr-6 text-slate-900 placeholder-slate-400 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="group bg-white/80 backdrop-blur-sm rounded-[24px] p-6 shadow-sm border border-white/50 hover:shadow-xl hover:shadow-orange-100/50 hover:border-orange-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl font-black text-slate-700">#{order.id}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Paid</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase">Table {order.tableNo}</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium flex items-center gap-1">
                      <Calendar size={14} /> {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total</p>
                    <p className="text-2xl font-black text-orange-600">${((order.total || 0) * 1.1).toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => setOrderToPrint(order)}
                    className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-orange-200 transition-all duration-200"
                  >
                    <Printer size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- THE RECEIPT (Single Page & Centered) --- */}
      <div id="physical-receipt" className="hidden print:flex flex-col items-center w-full font-sans">
        {orderToPrint && (
          <div className="w-full flex flex-col items-center">
            <div className="w-28 h-28 mb-3 flex items-center justify-center">
              <img 
                src={coffeeLogo} 
                alt="Logo" 
                className="max-w-full max-h-full object-contain" 
                /* NO GRAYSCALE FILTER - LOGO WILL BE FULL COLOR */
              />
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase text-center">Prey Lang COFFEE</h2>
            <p className="text-[11px] text-gray-800 text-center leading-tight">Street 371, Phnom Penh</p>
            <div className="w-full grid grid-cols-2 gap-y-2 text-[10px] border-t border-black/20 pt-4 mb-5 mt-4">
              <div className="text-left text-gray-600 uppercase font-bold">Receipt No</div>
              <div className="text-right font-black">#{orderToPrint.id}</div>
              <div className="text-left text-gray-600 uppercase font-bold">Table</div>
              <div className="text-right font-black">Table {orderToPrint.tableNo}</div>
            </div>
            <div className="w-full border-t border-black/10 pt-4 space-y-3 mb-5">
              {orderToPrint.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-[12px]">
                  <div className="text-left">
                    <p className="font-black uppercase leading-none mb-1">{item.name}</p>
                    <p className="text-[10px] text-gray-600">{item.quantity}x ${item.price?.toFixed(2)}</p>
                  </div>
                  <p className="font-black">${(item.quantity * (item.price || 0)).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="w-full border-t border-black/20 pt-4 space-y-2 text-[11px]">
              <div className="flex justify-between text-[18px] font-black pt-3">
                <span>TOTAL</span>
                <span className="text-orange-600 font-black">${((orderToPrint.total || 0) * 1.1).toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-10 text-center w-full">
              <p className="text-xs font-black uppercase tracking-widest">Thank You Hope You Enjoy</p>
              <div className="mt-8 border-b border-dashed border-black/20 w-full" />
            </div>
          </div>
        )}
      </div>

      {/* --- CONFIRMATION DIALOG --- */}
      {orderToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm no-print p-4">
          <div className="bg-white p-8 rounded-[32px] text-center max-w-sm w-full shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Print Receipt?</h3>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setOrderToPrint(null)} className="flex-1 py-4 bg-slate-100 rounded-[20px] font-bold text-slate-600">Cancel</button>
              <button onClick={handlePrint} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-[20px] font-bold">Print Now</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default OrderHistory;