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

export function getOrders(): Promise<Order[]> {
  return request<Order[]>('/orders');
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return request<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
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
