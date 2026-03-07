import React, { useMemo, useState } from 'react';
import { Search, Clock, Coffee, CheckCircle2, X, ClipboardList } from 'lucide-react';
import logo from '../assets/coffee.png'; 
import { Order, OrderStatus } from '../types';
import { buildOrderDisplayIdMap } from '../lib/orderDisplayId';

interface OrdersProps {
  orders: Order[];
  updateStatus: (id: string, newStatus: OrderStatus) => void;
}

const Orders: React.FC<OrdersProps> = ({ orders = [], updateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tables'>('list');
  const [activeTab, setActiveTab] = useState<'Live' | 'Completed' | 'Cancelled'>('Live');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const orderDisplayIdMap = useMemo(() => buildOrderDisplayIdMap(orders.map((order) => order.id)), [orders]);

  const allTables = ['Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05', 'Table 06', 'Table 07', 'Table 08', 'Table 09', 'Table 10', 'Table 11', 'Table 12'];

  const normalizeToFixedTableKey = (tableLabel: string) => {
    const text = tableLabel.trim().toUpperCase();
    const match = text.match(/(\d{1,2})$/);
    if (!match) return null;

    const num = Number(match[1]);
    if (!Number.isInteger(num) || num < 1 || num > 12) return null;
    return `TABLE${String(num).padStart(2, '0')}`;
  };

  const fixedTableKey = (tableLabel: string) => `TABLE${tableLabel.replace(/^Table\s*/i, '')}`;

  const occupiedTableKeys = useMemo(
    () =>
      new Set(
        orders
          .filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
          .map((o) => normalizeToFixedTableKey(o.tableNo))
          .filter((key): key is string => Boolean(key))
      ),
    [orders]
  );

  const occupiedTableSources = useMemo(() => {
    const sources: Record<string, string[]> = {};
    orders
      .filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
      .forEach((o) => {
        const key = normalizeToFixedTableKey(o.tableNo);
        if (!key) return;
        if (!sources[key]) sources[key] = [];
        const label = o.tableNo.trim();
        if (label && !sources[key].includes(label)) {
          sources[key].push(label);
        }
      });
    return sources;
  }, [orders]);

  const filteredOrders = orders.filter(order => {
    const matchesTab = 
      activeTab === 'Live' 
        ? (order.status !== 'Completed' && order.status !== 'Cancelled')
        : order.status === activeTab;

    const matchesSearch = 
      (orderDisplayIdMap[order.id] ?? order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const getTabCount = (tab: string) => {
    if (tab === 'Live') return orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
    return orders.filter(o => o.status === tab).length;
  };

  return (
    <div className="w-full space-y-6 relative transition-colors duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 p-2 flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
            <img src={logo} alt="Prey Lang Coffee" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Staff Orders</h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Prey Lang POS System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'tables' : 'list')}
            className="px-5 py-2.5 bg-[#B75D17] text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-200/60 dark:shadow-none hover:scale-105 transition-all flex items-center gap-2"
          >
            {viewMode === 'list' ? 'Floor Plan' : 'Order List'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-orange-200/60 bg-orange-50 dark:bg-orange-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-400 font-bold">Live Queue</p>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-400">{getTabCount('Live')}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">Completed</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{getTabCount('Completed')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 dark:bg-white/5 dark:border-white/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Cancelled</p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{getTabCount('Cancelled')}</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      {viewMode === 'list' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-4">
          <div className="flex items-center gap-6">
            {(['Live', 'Completed', 'Cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-black transition-all relative ${
                  activeTab === tab 
                    ? 'text-[#BD5E0A] border-b-2 border-[#BD5E0A]' 
                    : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
                }`}
              >
                {tab}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === tab ? 'bg-[#BD5E0A] text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                }`}>
                  {getTabCount(tab)}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BD5E0A]/10" 
              placeholder="Search by ID or Table..." 
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'tables' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allTables.map((tableNum) => {
            const tableKey = fixedTableKey(tableNum);
            const isOccupied = occupiedTableKeys.has(tableKey);
            const sources = occupiedTableSources[tableKey] ?? [];
            return (
              <div 
                key={tableNum}
                className={`p-6 rounded-[24px] border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                  isOccupied 
                    ? 'border-[#BD5E0A] bg-white dark:bg-white/5 shadow-md' 
                    : 'border-slate-100 dark:border-white/5 bg-white dark:bg-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isOccupied ? 'bg-[#BD5E0A]/10 text-[#BD5E0A]' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                }`}>
                  {isOccupied ? <Coffee size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <span className="font-black text-sm text-slate-900 dark:text-white">{tableNum}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${
                  isOccupied ? 'text-[#BD5E0A]' : 'text-emerald-500'
                }`}>
                  {isOccupied ? 'Occupied' : 'Free'}
                </span>
                {isOccupied && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                    {sources.join(', ')}
                  </span>
                )}
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 px-6 py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 mx-auto flex items-center justify-center mb-4">
                <ClipboardList size={24} />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-black">No active tables right now</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Switch back to list mode after new orders arrive.</p>
            </div>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`bg-white dark:bg-white/5 rounded-[28px] p-5 border-2 transition-all ${
              order.status === 'Delayed' 
                ? 'border-red-100 dark:border-red-500/20 ring-4 ring-red-50 dark:ring-red-500/5' 
                : 'border-slate-50 dark:border-white/5 shadow-sm'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className={`text-[9px] font-black uppercase mb-0.5 ${
                    order.status === 'Delayed' ? 'text-red-500' : 'text-[#BD5E0A]'
                  }`}>{order.tableNo}</p>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{orderDisplayIdMap[order.id] ?? order.id}</h3>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                  order.status === 'Ready' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-orange-50 dark:bg-orange-500/10 text-[#BD5E0A]'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-4 py-4 border-y border-slate-50 dark:border-white/5 min-h-[120px]">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] items-start">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">{item.quantity}x {item.name}</span>
                    <span className="font-black text-slate-900 dark:text-slate-200 text-right truncate ml-2 max-w-[80px]">{item.customization}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold italic">+ {order.items.length - 3} more items...</p>
                )}
              </div>

              <div className={`flex items-center gap-2 font-black text-xs mt-4 ${
                order.status === 'Delayed' ? 'text-red-500' : 'text-[#BD5E0A]'
              }`}>
                <Clock size={14} /> {order.timeElapsed}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="py-2 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Details
                </button>
                {activeTab === 'Live' && (
                  <button 
                    onClick={() => {
                      let nextStatus: OrderStatus = 'Preparing';
                      if (order.status === 'Preparing') nextStatus = 'Ready';
                      if (order.status === 'Ready') nextStatus = 'Completed';
                      updateStatus(order.id, nextStatus);
                    }}
                    className={`py-2 text-white font-black text-[9px] uppercase rounded-lg shadow-md transition-all active:scale-95 ${
                      order.status === 'Ready' ? 'bg-emerald-500' : 'bg-[#BD5E0A]'
                    }`}
                  >
                    {order.status === 'Pending' ? 'Prepare' : order.status === 'Ready' ? 'Serve' : 'Ready'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="md:col-span-2 xl:col-span-4 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-[#B75D17] dark:text-orange-400 mx-auto flex items-center justify-center mb-4">
                <ClipboardList size={28} />
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-200">No {activeTab.toLowerCase()} orders</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">New orders from the API will appear here automatically.</p>
            </div>
          )}
        </div>
      )}

      {/* --- DETAILS POPUP (MODAL) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A110B] w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-[#BD5E0A] font-black text-[10px] uppercase tracking-widest mb-1">{selectedOrder.tableNo}</p>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Order Details</h2>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-400 dark:text-slate-600" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                    <div className="flex justify-between mb-2">
                      <span className="font-black text-slate-900 dark:text-slate-200 text-sm">{item.quantity}x {item.name}</span>
                    </div>
                    <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                      <p className="text-[10px] font-black text-[#BD5E0A] uppercase tracking-wider mb-1">Customization</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bold italic leading-relaxed">
                        {item.customization || 'No special requests'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Order ID</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{orderDisplayIdMap[selectedOrder.id] ?? selectedOrder.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-4 bg-slate-900 dark:bg-white/10 text-white font-black rounded-[20px] hover:bg-[#BD5E0A] dark:hover:bg-[#BD5E0A] transition-all uppercase text-xs tracking-widest shadow-lg active:scale-95"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
