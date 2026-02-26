import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2,
  ChevronDown,
  RefreshCcw,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // FIX: matches your installed package
import { Order } from '../types';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');

  // Filtering logic matching your exact requirements
  const historyOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (order.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      order.tableNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Status' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const completedOrders = orders.filter(o => o.status === 'Completed');
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Order History</h2>
        <button 
          onClick={() => window.location.reload()}
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw size={18} />
        </button>
      </header>

      {/* Search and Filter Bar matching your UI style */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer name, or table number..."
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
        </div>
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl px-10 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Main Table following your "rounded-3xl" style */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Date/Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {historyOrders.map((order) => (
                  <motion.tr 
                    key={order.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-brand-primary">{order.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{order.customerName || 'Guest'}</td>
                    <td className="px-6 py-4 text-slate-500">{order.tableNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {order.items.reduce((acc, i) => acc + i.quantity, 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Items</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">${(order.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{order.paymentMethod || 'Cash'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{new Date(order.timestamp).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        <button className="hover:text-brand-primary transition-colors"><Eye size={16} /></button>
                        <button className="hover:text-brand-primary transition-colors"><Printer size={16} /></button>
                        <button className="hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary Cards matching the Revenue design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', value: orders.length, color: 'slate', icon: ShoppingBag },
          { label: 'Completed', value: completedOrders.length, color: 'emerald', icon: CheckCircle2 },
          { label: 'Pending', value: pendingOrders.length, color: 'amber', icon: Clock },
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'brand', icon: DollarSign },
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <div className={`p-2 rounded-lg ${
                card.color === 'brand' ? 'bg-orange-50 text-orange-600' : 
                `bg-${card.color}-50 text-${card.color}-500`
              }`}>
                <card.icon size={16} />
              </div>
            </div>
            <h3 className={`text-3xl font-black ${
              card.color === 'brand' ? 'text-slate-900' : 
              `text-${card.color}-500`
            }`}>{card.value}</h3>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default OrderHistory;