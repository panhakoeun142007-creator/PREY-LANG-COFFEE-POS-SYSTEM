const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ReceiptRecord {
  receiptId: string;
  orderId: string;
  table: string;
  total: number;
  paymentMethod: string;
  paidAt: string;
}

export async function getReceipts(): Promise<ReceiptRecord[]> {
  const response = await fetch(`${API_URL}/receipts`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch receipts');
  }
  
  const data = await response.json();
  
  // Transform API response to ReceiptRecord format
  return data.receipts || data.data || [];
}
