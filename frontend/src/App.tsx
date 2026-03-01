import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import OrderHistory from './components/OrderHistory';
import RecipeView from './components/RecipeView';
import { Order } from './types';

const initialOrders: Order[] = [
  {
    id: 'ORD-2841',
    tableNo: 'Table 04',
    status: 'Preparing',
    items: [
      { name: 'Cafe Latte', quantity: 2, customization: 'Oat Milk' },
      { name: 'Butter Croissant', quantity: 1, customization: 'Toasted' }
    ],
    timeElapsed: '04:22 mins',
    timestamp: new Date().toISOString(),
    total: 12.50
  },
  {
    id: 'ORD-2842',
    tableNo: 'Table 12',
    status: 'Pending',
    items: [
      { name: 'Americano', quantity: 1, customization: 'Iced, XL' },
      { name: 'Espresso Shot', quantity: 1, customization: 'Double' }
    ],
    timeElapsed: '01:45 mins',
    timestamp: new Date().toISOString(),
    total: 8.00
  },
  {
    id: 'ORD-2839',
    tableNo: 'Table 01',
    status: 'Ready',
    items: [
      { name: 'Cappuccino', quantity: 3, customization: 'Extra Foam' }
    ],
    timeElapsed: 'Ready',
    timestamp: new Date().toISOString(),
    total: 15.00
  },
  {
    id: 'ORD-2835',
    tableNo: 'Takeaway',
    status: 'Delayed',
    items: [
      { name: 'Mocha Frost', quantity: 1, customization: 'Priority' },
      { name: 'Blueberry Muffin', quantity: 2, customization: 'Heated' }
    ],
    timeElapsed: '14:55 mins',
    timestamp: new Date().toISOString(),
    total: 18.25
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null); // new state

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => {
      if (order.id === id) {
        const updated = { ...order, status };
        if (status === 'Completed') {
          updated.completedAt = new Date().toISOString();
          toast.success(`Order ${id} completed!`);
        } else if (status === 'Cancelled') {
          toast.error(`Order ${id} cancelled`);
        }
        return updated;
      }
      return order;
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} onViewDetails={setSelectedOrder} />;
      case 'orders':
        return <Orders orders={orders} updateStatus={updateOrderStatus} onViewDetails={setSelectedOrder} />;
      case 'history':
        return <OrderHistory orders={orders} setOrderToPrint={setOrderToPrint} />;
      case 'recipe':
        return <RecipeView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
      default:
        return <Dashboard orders={orders} onViewDetails={setSelectedOrder} />;
    }
  };

  const executePrint = () => {
    setTimeout(() => {
      window.print();
      setOrderToPrint(null);
    }, 300); // allow enough time for print
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-bg-main'}`}>
      <Toaster position="top-right" />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogoutClick={() => toast.error("Logout disabled for this version")} 
      />
      
      <main className="flex-1 ml-64 p-10 max-w-7xl mx-auto w-full">
        {renderContent()}
      </main>

      {/* --- Order Details Modal --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedOrder.tableNo}</p>
                <h3 className="text-2xl font-black text-slate-900">Order #{selectedOrder.id}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedOrder.status === 'Preparing' ? 'bg-orange-100 text-orange-600' :
                selectedOrder.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                selectedOrder.status === 'Ready' ? 'bg-emerald-100 text-emerald-600' :
                selectedOrder.status === 'Completed' ? 'bg-blue-100 text-blue-600' :
                'bg-red-100 text-red-600'
              }`}>
                {selectedOrder.status}
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                    <div className="flex gap-3 items-center">
                      <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-brand-primary shadow-sm">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-bold text-slate-700">{item.name}</p>
                        {item.customization && (
                          <p className="text-[10px] text-slate-400 font-medium">{item.customization}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <p className="text-slate-500 font-medium">Total Amount</p>
              <p className="text-2xl font-black text-slate-900">${selectedOrder.total.toFixed(2)}</p>
            </div>

            <button 
              onClick={() => setSelectedOrder(null)}
              className="w-full py-4 rounded-2xl font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* --- Receipt Preview & Print --- */}
      {orderToPrint && (
        <div className="receipt-print-only">
          <div className="receipt-container">
            <div className="text-center mb-4">
              <img src="/logo.png" alt="Prey Lang Coffee" className="mx-auto w-24 h-24 object-contain" />
              <h1 className="text-xl font-black mt-2">PREY LANG COFFEE</h1>
              <p className="text-slate-500 text-xs">Phnom Penh, Cambodia</p>
              <hr className="border-dashed border-slate-300 my-4" />
            </div>
            <p><strong>Order ID:</strong> #{orderToPrint.id}</p>
            <p><strong>Table:</strong> {orderToPrint.tableNo}</p>
            <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
            <ul className="list-disc list-inside text-slate-700 text-sm mt-2">
              {orderToPrint.items.map((item, idx) => (
                <li key={idx}>{item.quantity}x {item.name} {item.customization ? `(${item.customization})` : ''}</li>
              ))}
            </ul>
            <hr className="border-dashed border-slate-300 my-4" />
            <div className="flex justify-between font-black text-base mb-4">
              <span>Total:</span>
              <span>${orderToPrint.total?.toFixed(2)}</span>
            </div>
            <div className="text-center text-sm text-slate-600">
              <p>THANK YOU! PLEASE ENJOY YOUR COFFEE ☕</p>
              <p>COME BACK SOON!</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setOrderToPrint(null)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-bold">Cancel</button>
              <button onClick={executePrint} className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}