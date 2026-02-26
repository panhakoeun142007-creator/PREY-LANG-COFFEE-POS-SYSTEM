import React, { useState } from 'react';
import { Search, Clock, Bell, ChevronDown, ListFilter } from 'lucide-react';

const Orders = ({ orders = [], updateStatus }) => {
  // 1. Search State
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Filter Logic: Only show orders that match the search (ID or Table)
  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with System Live Badge */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Staff Orders</h1>
          <p className="text-slate-400 text-sm font-medium">Real-time processing for current coffee queue</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">System Live</span>
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-primary transition-colors">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-100">
        <button className="pb-4 text-sm font-bold text-brand-primary border-b-2 border-brand-primary relative">
          Live Orders <span className="ml-1 bg-brand-primary text-white text-[10px] px-2 py-0.5 rounded-full">
            {filteredOrders.length}
          </span>
        </button>
        <button className="pb-4 text-sm font-bold text-slate-400">Completed</button>
        <button className="pb-4 text-sm font-bold text-slate-400">Cancelled</button>
      </div>

      {/* Filter Bar with Functional Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10" 
            placeholder="Search Order ID or Table (e.g. 2841 or Table 04)..." 
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50">
          <ListFilter size={18} /> Table Number <ChevronDown size={16} />
        </button>
      </div>

      {/* The Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className={`bg-white rounded-[28px] p-5 border-2 transition-all ${
            order.status === 'Delayed' ? 'border-red-100 ring-4 ring-red-50/50' : 'border-slate-50'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`text-[10px] font-black uppercase mb-0.5 ${
                  order.status === 'Delayed' ? 'text-red-500' : 'text-orange-500'
                }`}>{order.tableNo}</p>
                <h3 className="text-xl font-black text-slate-900">#{order.id}</h3>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                order.status === 'Preparing' ? 'bg-orange-50 text-orange-600' :
                order.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                order.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {order.status}
              </span>
            </div>

            {/* Items List Section */}
            <div className="space-y-4 py-4 border-y border-slate-50 min-h-[120px]">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs items-start">
                  <span className="text-slate-500 font-medium">{item.quantity}x {item.name}</span>
                  <span className={`font-bold text-right ${item.customization === 'Priority' ? 'text-red-500' : 'text-slate-800'}`}>
                    {item.customization}
                  </span>
                </div>
              ))}
              {order.status === 'Ready' && (
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Wait for Pickup
                </div>
              )}
            </div>

            {/* Time Elapsed */}
            <div className={`flex items-center gap-2 font-bold text-sm mt-4 ${
              order.status === 'Delayed' ? 'text-red-600' : 'text-orange-500'
            }`}>
              <Clock size={16} />
              {order.status === 'Delayed' && <span className="font-black">!</span>} {order.timeElapsed}
            </div>

            {/* Action Buttons: Clickable for Staff */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button className="py-2.5 bg-slate-50 text-slate-500 font-black text-[10px] uppercase rounded-xl hover:bg-slate-100">
                Details
              </button>
              
              <button 
                onClick={() => {
                  // Change status based on current status
                  const nextStatus = order.status === 'Pending' ? 'Preparing' : 'Ready';
                  updateStatus(order.id, nextStatus);
                }}
                className={`py-2.5 text-white font-black text-[10px] uppercase rounded-xl shadow-lg transition-all active:scale-95 ${
                  order.status === 'Ready' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-brand-primary shadow-brand-primary/20'
                }`}
              >
                {order.status === 'Pending' ? 'Prepare' : order.status === 'Ready' ? 'Serve' : 'Ready'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State when no results found */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold">No orders found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default Orders;