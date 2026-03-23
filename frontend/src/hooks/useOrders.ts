import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchLiveOrders,
  fetchOrderHistory,
  createOrder,
  updateOrderStatus,
  LiveOrder,
  OrderHistoryParams,
  PaginatedOrderHistoryResponse,
} from '../services/api';

/**
 * Hook for managing live orders with auto-refresh.
 */
export function useLiveOrders(autoRefresh = true, intervalMs = 10000) {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchLiveOrders();
      setOrders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch live orders';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    loadOrders();

    if (autoRefresh) {
      const interval = setInterval(loadOrders, intervalMs);
      return () => clearInterval(interval);
    }
  }, [loadOrders, autoRefresh, intervalMs]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const preparing = orders.filter((o) => o.status === 'preparing').length;
    const ready = orders.filter((o) => o.status === 'ready').length;
    return { pending, preparing, ready, total: orders.length };
  }, [orders]);

  // Update order status
  const handleStatusChange = useCallback(async (orderId: number, newStatus: string) => {
    try {
      setError(null);
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setError(message);
      throw err;
    }
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    stats,
    refresh: loadOrders,
    updateStatus: handleStatusChange,
  };
}

/**
 * Hook for order history with filters.
 */
export function useOrderHistory(initialParams: OrderHistoryParams = {}) {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<OrderHistoryParams>(initialParams);
  const [summary, setSummary] = useState<{
    completed_count: number;
    cancelled_count: number;
    total_revenue: number;
  } | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedOrderHistoryResponse = await fetchOrderHistory(params);
      setOrders(response.data);
      setSummary(response.summary ?? null);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        total: response.total,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch order history';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const updateParams = useCallback((newParams: Partial<OrderHistoryParams>) => {
    setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  return {
    orders,
    loading,
    error,
    summary,
    pagination,
    params,
    updateParams,
    goToPage,
    refresh: loadHistory,
  };
}

/**
 * Hook for creating orders.
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (orderData: Record<string, unknown>) => {
    try {
      setLoading(true);
      setError(null);
      const order = await createOrder(orderData);
      return order;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
