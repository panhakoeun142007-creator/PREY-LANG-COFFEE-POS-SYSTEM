import { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import OrderHistory from './components/OrderHistory';
import RecipeView from './components/RecipeView';
import { Order, RecipeLog } from './types';
import { deleteRecipeLog, getOrders, getRecipeLogs, updateOrderStatus as updateOrderStatusApi } from './lib/api';
import { buildOrderDisplayIdMap } from './lib/orderDisplayId';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [recipeLogs, setRecipeLogs] = useState<RecipeLog[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const orderDisplayIdMap = buildOrderDisplayIdMap(orders.map((order) => order.id));

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const response = await getOrders();
      setOrders(response);
    } catch (error) {
      toast.error('Unable to load orders from backend API.');
      console.error(error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const loadRecipeLogs = useCallback(async () => {
    setIsLoadingRecipes(true);
    setRecipeError(null);
    try {
      const response = await getRecipeLogs();
      setRecipeLogs(response);
    } catch (error) {
      setRecipeError('Unable to load recipe history from backend API.');
      console.error(error);
    } finally {
      setIsLoadingRecipes(false);
    }
  }, []);

  useEffect(() => {
    // Apply dark class to document root for Tailwind dark mode
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    loadOrders();
    loadRecipeLogs();
  }, [loadOrders, loadRecipeLogs]);

  useEffect(() => {
    if (activeTab === 'recipe') {
      loadRecipeLogs();
    }
  }, [activeTab, loadRecipeLogs]);

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const updated = await updateOrderStatusApi(id, status);
      setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
      const displayId = orderDisplayIdMap[id] ?? id;

      if (status === 'Completed') {
        toast.success(`Order ${displayId} completed!`);
      } else if (status === 'Cancelled') {
        toast.error(`Order ${displayId} cancelled`);
      }
    } catch (error) {
      const displayId = orderDisplayIdMap[id] ?? id;
      toast.error(`Failed to update order ${displayId}.`);
      console.error(error);
    }
  };

  const handleDeleteRecipeLog = async (logId: string) => {
    try {
      await deleteRecipeLog(logId);
      setRecipeLogs((prev) => prev.filter((log) => log.id !== logId));
      toast.success(`Recipe log ${logId} deleted.`);
    } catch (error) {
      toast.error('Failed to delete recipe log.');
      console.error(error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isLoadingOrders
          ? <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
          : <Dashboard orders={orders} onViewDetails={setSelectedOrder} />;
      case 'orders':
        return isLoadingOrders
          ? <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
          : <Orders orders={orders} updateStatus={updateOrderStatus} />;
      case 'history':
        return isLoadingOrders
          ? <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
          : <OrderHistory orders={orders} />;
      case 'recipe':
        return (
          <RecipeView
            history={recipeLogs}
            isLoading={isLoadingRecipes}
            error={recipeError}
            onDeleteLog={handleDeleteRecipeLog}
          />
        );
      default:
        return isLoadingOrders
          ? <p className="text-slate-500 dark:text-slate-400 font-bold">Loading orders...</p>
          : <Dashboard orders={orders} onViewDetails={setSelectedOrder} />;
    }
  };

  const handleThemeToggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full flex transition-colors duration-300 overflow-x-hidden">
      <Toaster position="top-right" />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoutClick={() => toast.error('Logout disabled for this version')}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
      />

      <div className={`flex-1 ml-72 min-h-screen ${isDark ? 'dark' : ''}`}>
        <main className="w-full p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <section className="panel-shell p-5 md:p-8 min-h-[calc(100vh-3rem)] w-full">
          {renderContent()}
          </section>
        </main>

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1a1c2e] rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{selectedOrder.tableNo}</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Order {orderDisplayIdMap[selectedOrder.id] ?? selectedOrder.id}</h3>
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
                <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                      <div className="flex gap-3 items-center">
                        <span className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-[#BD5E0A] shadow-sm">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{item.name}</p>
                          {item.customization && (
                            <p className="text-[10px] text-slate-400 font-medium">{item.customization}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Total Amount</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">${selectedOrder.total.toFixed(2)}</p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-4 rounded-2xl font-bold text-white bg-[#BD5E0A] hover:bg-[#BD5E0A]/90 transition-all shadow-lg shadow-[#BD5E0A]/20"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
