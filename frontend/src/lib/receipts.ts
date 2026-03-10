// Receipt API functions - uses safeFetch for consistent URL fallback behavior
import { safeFetch } from '../services/api';

export interface ReceiptRecord {
  receiptId: string;
  orderId: string;
  table: string;
  total: number;
  paymentMethod: string;
  paidAt: string;
}

export async function getReceipts(): Promise<ReceiptRecord[]> {
  const response = await safeFetch('/receipts');
  
  if (!response.ok) {
    throw new Error('Failed to fetch receipts');
  }
  
  const data = await response.json();
  
  // Transform API response to ReceiptRecord format
  return data.receipts || data.data || [];
}
