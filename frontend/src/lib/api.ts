import { Order, OrderStatus, RecipeLog } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorBody || response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toUiStatus(apiStatus: string): OrderStatus {
  const status = (apiStatus || '').toLowerCase();
  if (status === 'pending') return 'Pending';
  if (status === 'preparing') return 'Preparing';
  if (status === 'brewing') return 'Brewing';
  if (status === 'ready') return 'Ready';
  if (status === 'delayed') return 'Delayed';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return titleCase(apiStatus) as OrderStatus;
}

function toApiStatus(uiStatus: OrderStatus): string {
  const status = (uiStatus || '').toLowerCase();
  if (status === 'cancelled') return 'cancelled';
  return status;
}

function formatElapsed(createdAt: string | undefined): string {
  if (!createdAt) return '';
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return '';

  const diffMs = Date.now() - created.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  return `${hours}h ${minutes}m`;
}

type ApiOrderLike = {
  id: number | string;
  status?: string;
  total_price?: number | string | null;
  payment_type?: string | null;
  created_at?: string;
  updated_at?: string;
  table?: { name?: string | null } | null;
  table_id?: number | null;
  items?: Array<{
    qty?: number;
    price?: number | string | null;
    size?: string | null;
    product_id?: number | null;
    product?: { name?: string | null } | null;
  }>;
};

function mapApiOrderToUiOrder(order: ApiOrderLike): Order {
  const id = String(order.id);
  const tableName =
    order.table?.name ||
    (order.table_id ? `Table ${String(order.table_id).padStart(2, '0')}` : 'Takeaway');

  const items = (order.items || []).map((item) => ({
    name: item.product?.name || (item.product_id ? `Product #${item.product_id}` : 'Product'),
    quantity: Number(item.qty || 0),
    customization: item.size ? `Size: ${item.size}` : undefined,
    price: item.price !== undefined && item.price !== null ? Number(item.price) : undefined,
  }));

  const total = order.total_price !== undefined && order.total_price !== null ? Number(order.total_price) : 0;

  const paymentMethod = (() => {
    const raw = (order.payment_type || '').toLowerCase();
    if (raw === 'cash') return 'Cash' as const;
    if (raw === 'card' || raw === 'credit_card') return 'Card' as const;
    if (raw === 'khqr') return 'KHQR' as const;
    return undefined;
  })();

  return {
    id,
    tableNo: tableName,
    status: toUiStatus(order.status || ''),
    items,
    timeElapsed: formatElapsed(order.created_at),
    timestamp: order.created_at || '',
    total,
    paymentMethod,
    completedAt: order.updated_at,
  };
}

function extractOrderArray(payload: unknown): ApiOrderLike[] {
  if (Array.isArray(payload)) return payload as ApiOrderLike[];
  if (payload && typeof payload === 'object') {
    const anyPayload = payload as any;
    if (Array.isArray(anyPayload.data)) return anyPayload.data as ApiOrderLike[];
  }
  return [];
}

export async function getOrders(): Promise<Order[]> {
  // Backend returns paginated payload for /orders: { data: [...] }
  const payload = await request<unknown>('/orders');
  return extractOrderArray(payload).map(mapApiOrderToUiOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const payload = await request<unknown>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: toApiStatus(status) }),
  });
  return mapApiOrderToUiOrder(payload as ApiOrderLike);
}

export function getRecipeLogs(): Promise<RecipeLog[]> {
  return request<RecipeLog[]>('/recipe-logs');
}

export function createRecipeLog(payload: { order_id: string; table_no: string; name: string }): Promise<RecipeLog> {
  return request<RecipeLog>('/recipe-logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteRecipeLog(id: string): Promise<void> {
  return request<void>(`/recipe-logs/${id}`, { method: 'DELETE' });
}
