import { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Orders from '../components/Orders';
import OrderHistory from '../components/OrderHistory';
import RecipeView from '../components/RecipeView';
import SettingsPage from '../components/ui/setting';
import { Order, RecipeLog } from '../types';
import { deleteRecipeLog, getOrders, getRecipeLogs, updateOrderStatus as updateOrderStatusApi } from '../lib/api';
import { fetchSettings } from '../services/api';
import { buildOrderDisplayIdMap } from '../lib/orderDisplayId';

export default function StaffDashboard() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [recipeLogs, setRecipeLogs] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [recipeError, setRecipeError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shopName, setShopName] = useState('Prey Lang');
  const [prevCancelledIds, setPrevCancelledIds] = useState(new Set());
  const orderDisplayIdMap = buildOrderDisplayIdMap(orders.map((order) => order.id));

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const response = await getOrders();
      
      // Check for new cancelled orders
      const currentCancelled = response.filter(o => o.status === 'cancelled');
      const currentCancelledIds = new Set(currentCancelled.map(o => o.id));
      
      const newCancels = currentCancelled.filter(o => !prevCancelledIds.has(o.id));
      
      if (newCancels.length > 0) {
        const cancelDetails = newCancels.map(o => 
          `#${o.queue_number?.toString().padStart(3, '0') || o.id} (${o.table?.name || 'Unknown Table'})`
        ).join(', ');
        toast.error(`Customer cancelled order(s): ${cancelDetails}`, { duration: 10000 });
      }
      
      setPrevCancelledIds(currentCancelledIds);
      setOrders(response);
    } catch (error) {
      toast.error('Unable to load orders from backend API.');
      console.error(error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [prevCancelledIds]);

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

  const loadShopName = useCallback(async () => {
    try {
      const settings = await fetchSettings();
      if (settings?.general?.shop_name) {
        setShopName(settings.general.shop_name);
      }
    } catch (error) {
      console.error('Failed to load shop name:', error);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

useEffect(() => {
    loadOrders();
    loadRecipeLogs();
    loadShopName();
  }, [loadOrders, loadRecipeLogs, loadShopName]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    if (activeTab === 'recipe') {
      loadRecipeLogs();
    }
  }, [activeTab, loadRecipeLogs]);

  const updateOrderStatus = async (id, status) => {
    try {
      const updated = await updateOrderStatusApi(id, status);
      setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
      const displayId = orderDisplayIdMap[id] ?? id;
      toast.success(`Order ${displayId} updated to ${status}!`);
    } catch (error) {
      toast.error('Failed to update order.');
      console.error(error);
    }
  };

  const handleDeleteRecipeLog = async (logId) => {
    try {
      await deleteRecipeLog(logId);
      setRecipeLogs((prev) => prev.filter((log) => log.id !== logId));
      toast.success('Recipe log deleted.');
    } catch (error) {
      toast.error('Failed to delete recipe log.');
      console.error(error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isLoadingOrders ? <p>Loading orders...</p> : <Dashboard orders={orders} onViewDetails={setSelectedOrder} />;
      case 'orders':
        return isLoadingOrders ? <p>Loading orders...</p> : <Orders orders={orders} updateStatus={updateOrderStatus} />;
      case 'history':
        return <OrderHistory orders={orders} />;
      case 'recipe':
        return (
          <RecipeView
            history={recipeLogs}
            isLoading={isLoadingRecipes}
            error={recipeError}
            onDeleteLog={handleDeleteRecipeLog}
          />
        );
      case 'settings':
        return <SettingsPage onSettingsSaved={loadShopName} />;
      default:
        return <Orders orders={orders} updateStatus={updateOrderStatus} />;
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
        onLogoutClick={() => console.log('Logout')}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        shopName={shopName}
      />
      <div className={`flex-1 ml-72 min-h-screen ${isDark ? 'dark' : ''}`}>
        <main className="w-full p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <section className="panel-shell p-5 md:p-8 min-h-[calc(100vh-3rem)] w-full">
            {renderContent()}
          </section>
        </main>
      </div>
    </div>
  );
}
