// Receipt API functions - uses safeFetch for consistent URL fallback behavior
import { fetchReceipts } from "../services/api";

export interface ReceiptRecord {
  receiptId: string;
  orderId: string;
  table: string;
  total: number;
  paymentMethod: string;
  paidAt: string | null;
}

export async function getReceipts(): Promise<ReceiptRecord[]> {
  const rows = await fetchReceipts();
  return rows;
}
