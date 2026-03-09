const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function apiRequest(path, options = {}) {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const headers = { 
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {}) 
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    // Handle token expiration
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload;
}

// Additional API functions that are imported by other components
export const fetchCurrentUser = async () => {
  return apiRequest('/user');
};

export const fetchNotifications = async () => {
  return apiRequest('/notifications');
};

export const logoutAdmin = async () => {
  return apiRequest('/logout', { method: 'POST' });
};

export const updateCurrentUser = async (data) => {
  // Use FormData for file uploads
  const formData = new FormData();
  
  // Only append fields that are provided
  if (data.name !== undefined) {
    formData.append('name', data.name);
  }
  if (data.email !== undefined) {
    formData.append('email', data.email);
  }
  if (data.profile_image) {
    formData.append('profile_image', data.profile_image);
  }
  
  console.log('Updating user with data:', { name: data.name, email: data.email, hasImage: !!data.profile_image });
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  console.log('Update response status:', response.status);
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const payload = await response.json().catch(() => null);
    console.error('Update failed:', payload);
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('Update successful:', result);
  return result;
};

export const fetchCategories = async () => {
  return apiRequest('/categories');
};

export const updateCategory = async (id, data) => {
  return apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteCategory = async (id) => {
  return apiRequest(`/categories/${id}`, { method: 'DELETE' });
};

export const createCategory = async (data) => {
  return apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) });
};

export const fetchProducts = async () => {
  return apiRequest('/products');
};

export const createProduct = async (data) => {
  return apiRequest('/products', { method: 'POST', body: JSON.stringify(data) });
};

export const updateProduct = async (id, data) => {
  return apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteProduct = async (id) => {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
};

export const fetchOrders = async () => {
  return apiRequest('/orders');
};

export const createOrder = async (data) => {
  return apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) });
};

export const updateOrder = async (id, data) => {
  return apiRequest(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchTables = async () => {
  return apiRequest('/tables');
};

export const createTable = async (data) => {
  return apiRequest('/tables', { method: 'POST', body: JSON.stringify(data) });
};

export const updateTable = async (id, data) => {
  return apiRequest(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteTable = async (id) => {
  return apiRequest(`/tables/${id}`, { method: 'DELETE' });
};

export const fetchStaff = async () => {
  return apiRequest('/staffs');
};

export const createStaff = async (data) => {
  return apiRequest('/staffs', { method: 'POST', body: JSON.stringify(data) });
};

export const updateStaff = async (id, data) => {
  return apiRequest(`/staffs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteStaff = async (id) => {
  return apiRequest(`/staffs/${id}`, { method: 'DELETE' });
};

export const fetchIngredients = async () => {
  return apiRequest('/ingredients');
};

export const createIngredient = async (data) => {
  return apiRequest('/ingredients', { method: 'POST', body: JSON.stringify(data) });
};

export const updateIngredient = async (id, data) => {
  return apiRequest(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteIngredient = async (id) => {
  return apiRequest(`/ingredients/${id}`, { method: 'DELETE' });
};

export const fetchExpenses = async () => {
  return apiRequest('/expenses');
};

export const createExpense = async (data) => {
  return apiRequest('/expenses', { method: 'POST', body: JSON.stringify(data) });
};

export const fetchRecipes = async () => {
  return apiRequest('/recipes');
};

export const createRecipe = async (data) => {
  return apiRequest('/recipes', { method: 'POST', body: JSON.stringify(data) });
};

export const updateRecipe = async (id, data) => {
  return apiRequest(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchAnalytics = async () => {
  return apiRequest('/analytics');
};

export const fetchSalesAnalytics = async () => {
  return apiRequest('/sales-analytics');
};

export const fetchSalesAnalyticsData = async () => {
  return apiRequest('/sales-analytics');
};

export const createRecipeBoard = async (data) => {
  return apiRequest('/recipes', { method: 'POST', body: JSON.stringify(data) });
};

export const deleteRecipeBoard = async (id) => {
  return apiRequest(`/recipes/${id}`, { method: 'DELETE' });
};

export const fetchRecipeBoards = async () => {
  return apiRequest('/recipes');
};

export const updateRecipeBoard = async (id, data) => {
  return apiRequest(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchRecipeBoard = async (id) => {
  return apiRequest(`/recipes/${id}`);
};

export const updateRecipeBoardStatus = async (id, status) => {
  return apiRequest(`/recipes/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
};

export const deleteExpense = async (id) => {
  return apiRequest(`/expenses/${id}`, { method: 'DELETE' });
};

export const fetchIncomeTransactions = async () => {
  return apiRequest('/expenses/income');
};

export const updateExpense = async (id, data) => {
  return apiRequest(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchSettings = async () => {
  return apiRequest('/settings');
};

export const updateSettings = async (data) => {
  return apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) });
};

export const fetchDashboardData = async () => {
  return apiRequest('/dashboard');
};

export const fetchStaffs = async () => {
  return apiRequest('/staffs');
};

export const fetchLiveOrders = async () => {
  return apiRequest('/orders/live');
};

export const updateOrderStatus = async (id, status) => {
  return apiRequest(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
};

export const fetchOrderHistory = async () => {
  return apiRequest('/orders/history');
};

export const fetchReceipt = async (id) => {
  const payload = await apiRequest('/receipts');
  const rows = payload?.receipts || payload?.data || payload || [];
  if (!id) return rows;
  return rows.find((item) => item.receiptId === id || item.orderId === id) || null;
};

export const fetchReceipts = async () => {
  const payload = await apiRequest('/receipts');
  return payload?.receipts || payload?.data || payload || [];
};

export const fetchPurchases = async () => {
  return apiRequest('/purchases');
};

export const createPurchase = async (data) => {
  return apiRequest('/purchases', { method: 'POST', body: JSON.stringify(data) });
};
