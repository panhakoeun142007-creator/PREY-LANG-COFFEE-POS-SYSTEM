import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const API_BASE = (() => {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  return raw || "http://127.0.0.1:8000";
})();

export default function OrderStatus({
  qrOrderNumber = '#A-000',
  tableName = 'Table 1',
  onBack,
  onPickupReady,
  onBackToMenu,
  onCancelOrder,
  isCancelingOrder = false,
}) {
  const [orderStatus, setOrderStatus] = useState('ordered'); // ordered, preparing, ready
  const [orderData, setOrderData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelled, setIsCancelled] = useState(false);

  const queueNumber = qrOrderNumber.replace('#A-', '');

  const fetchOrderStatus = useCallback(async () => {
    if (!queueNumber) return;
    
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/orders/${queueNumber}/status`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Not ready yet, keep polling
          return;
        }
        throw new Error(`Status check failed: ${response.status}`);
      }
      
      const data = await response.json();
      setOrderStatus(data.status || 'ordered');
      setOrderData(data.order || null);
      setLastUpdate(new Date().toLocaleTimeString());
      
      if (data.status === 'ready' || data.status === 'cancelled') {
        setIsPolling(false);
      }
    } catch (err) {
      console.error('Order status check failed:', err);
      setError(err.message);
    }
  }, [queueNumber]);

  const handleCancelOrder = async () => {
    if (onCancelOrder) {
      await onCancelOrder();
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE}/api/customer/orders/${queueNumber}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      setOrderStatus('cancelled');
      setIsCancelled(true);
      setIsPolling(false);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('Failed to cancel order. Please try again.');
    }
  };

  useEffect(() => {
    fetchOrderStatus(); // Initial load
    
    const interval = setInterval(() => {
      if (isPolling) {
        fetchOrderStatus();
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [fetchOrderStatus, isPolling]);

  const handleRefresh = () => {
    fetchOrderStatus();
  };

  const isSuccess = orderStatus === 'ready';
  const isReady = orderStatus === 'ready';
  const isPreparing = orderStatus === 'preparing';

  const statusConfig = {
    ordered: { label: 'ORDERED', color: 'bg-yellow-100 text-yellow-800', time: '~5 mins' },
    preparing: { label: 'PREPARING', color: 'bg-orange-100 text-orange-800', time: '~2 mins' },
    ready: { label: 'SUCCESS', color: 'bg-emerald-100 text-emerald-800', time: 'Completed!' },
    cancelled: { label: 'CANCELLED', color: 'bg-red-100 text-red-800', time: 'Cancelled by customer' },
  };

  const currentStatus = statusConfig[orderStatus] || statusConfig.ordered;

  return (
    <div className="order-status-page min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition" 
            onClick={onBack}
          >
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Status</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{qrOrderNumber}</span>
              <span>•</span>
              <span>{tableName}</span>
              {lastUpdate && (
                <>
                  <span>•</span>
                  <span>Last update: {lastUpdate}</span>
                </>
              )}
            </div>
          </div>
          <button 
            className={`p-2 rounded-full ${isPolling ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'} shadow-sm hover:shadow-md transition`}
            onClick={handleRefresh}
            disabled={!isPolling}
          >
            <RefreshCw className={`w-5 h-5 ${isPolling ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Badge */}
        <div className={`text-center py-6 rounded-2xl shadow-lg mb-8 ${currentStatus.color}`}>
          <div className="text-4xl font-bold mb-2">{currentStatus.label}</div>
          <div className="text-xl opacity-75">{currentStatus.time}</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          {orderStatus === 'cancelled' || isCancelled ? (
            <button
              className="w-full bg-gray-500 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-xl transition-all"
              onClick={onBackToMenu}
            >
              ❌ Order Cancelled - Back to Menu
            </button>
          ) : isSuccess ? (
            <button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={onPickupReady || (() => onBackToMenu?.())}
            >
              ✅ Thank you for visiting! 
            </button>
          ) : (
            <>
              <button
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl text-sm opacity-75 cursor-not-allowed"
                disabled
              >
                Order {currentStatus.label.toLowerCase()}...
              </button>
              {(orderStatus === 'ordered' || orderStatus === 'preparing') && (
                <button
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleCancelOrder}
                  disabled={isCancelingOrder}
                >
                  {isCancelingOrder ? "Cancelling..." : "?? Cancel Order"}
                </button>
              )}
            </>
          )}
          
          {error && !isCancelled && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              ⚠️ {error}. Still checking...
            </div>
          )}
          {isCancelled && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              ✅ Order successfully cancelled.
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Progress 
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStatus.color.replace('text-', 'bg- opacity-20 ')}`}>
              {orderStatus.toUpperCase()}
            </span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Placed</span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '30%'}} />
              </div>
              <span>100%</span>
            </div>
            <div className={`flex justify-between text-sm ${isPreparing ? 'opacity-100' : (isSuccess ? 'opacity-100' : 'opacity-50')}`}>
              <span>Preparing</span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${isPreparing ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} 
                     style={{width: isPreparing ? '70%' : '0%'}} />
              </div>
              <span>{isPreparing ? '70%' : '0%'}</span>
            </div>
            <div className={`flex justify-between text-sm ${isSuccess ? 'opacity-100' : 'opacity-50'}`}>
              <span>Success</span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-gray-300'}`} 
                     style={{width: isSuccess ? '100%' : '0%'}} />
              </div>
              <span>{isSuccess ? '100%' : '0%'}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>🔄 Auto-refreshing every 5 seconds</p>
          <p>📱 Pull down to refresh manually</p>
        </div>
      </div>
    </div>
  );
}
