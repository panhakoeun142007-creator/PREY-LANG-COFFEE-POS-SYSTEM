import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'motion/react';
import { Order, InventoryItem } from '../types';

interface DashboardProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onViewDetails }) => {
  // This state allows you to CLICK and switch between views
  const [activeTab, setActiveTab] = useState<'Live' | 'Completed' | 'Cancelled'>('Live');

  // Dashboard Stats Logic
  const activeOrdersCount = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
  const readyOrdersCount = orders.filter(o => o.status === 'Ready').length;

  // This logic changes the table data based on what you CLICKED
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Live') return order.status !== 'Completed' && order.status !== 'Cancelled';
    if (activeTab === 'Completed') return order.status === 'Completed';
    if (activeTab === 'Cancelled') return order.status === 'Cancelled';
    return true;
  });

  const mockInventory: InventoryItem[] = [
    { id: '1', name: 'Whole Milk (1L)', quantity: 2, unit: 'units', threshold: 5 },
    { id: '2', name: 'Espresso Beans (500g)', quantity: 1, unit: 'bag', threshold: 3 },
    { id: '3', name: 'Caramel Syrup', quantity: 3, unit: 'bottles', threshold: 5 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header with Auto-Date and Profile */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Good morning, Barista!</h2>
          <div className="flex items-center gap-2 text-slate-500 mt-1">
            <Clock size={16} />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })} | {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-100 shadow-sm">
          <img 
            src="https://picsum.photos/seed/user1/100/100" 
            alt="User" 
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-sm font-bold leading-none">Chanthy CHET</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Barista</p>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+20%</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Orders</p>
          <h3 className="text-4xl font-black mt-1">{activeOrdersCount}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+5%</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ready for Pickup</p>
          <h3 className="text-4xl font-black mt-1">{readyOrdersCount}</h3>
        </div>
      </div>

      {/* Order Status Section with CLICKABLE Tabs */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Order Status</h3>
            <button className="text-brand-primary text-sm font-bold hover:underline">View All Orders</button>
          </div>
          
          {/* TAB NAVIGATION: Clicking these updates the 'activeTab' state */}
          <div className="flex gap-8 border-b border-slate-100">
            {(['Live', 'Completed', 'Cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)} // <-- THIS MAKES IT CLICKABLE
                className={`pb-4 text-sm font-bold transition-all relative ${
                  activeTab === tab ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'Live' ? `Live Orders` : tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="px-6 py-4">Table No.</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time Elapsed</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{order.tableNo}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Brewing' ? 'bg-orange-100 text-orange-600' :
                      order.status === 'Pending' ? 'bg-slate-100 text-slate-600' :
                      order.status === 'Ready' ? 'bg-emerald-100 text-emerald-600' :
                      order.status === 'Completed' ? 'bg-blue-100 text-blue-600' :
                      order.status === 'Preparing' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        order.status === 'Brewing' ? 'bg-orange-600' :
                        order.status === 'Ready' ? 'bg-emerald-600' :
                        order.status === 'Completed' ? 'bg-blue-600' :
                        'bg-slate-600'
                      }`} />
                      {order.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-mono text-sm ${order.status === 'Delayed' ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    {order.timeElapsed}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onViewDetails(order)}
                      className="text-brand-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {/* Empty state if no orders exist for the clicked tab */}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No {activeTab.toLowerCase()} orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inventory Watchlist */}
      <section>
        <h3 className="font-bold text-lg mb-4">Inventory Watchlist</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockInventory.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border-l-4 border-l-red-500 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[10px] text-red-500 font-bold uppercase">{item.quantity} {item.unit} left</p>
                </div>
              </div>
              <button className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Dashboard;