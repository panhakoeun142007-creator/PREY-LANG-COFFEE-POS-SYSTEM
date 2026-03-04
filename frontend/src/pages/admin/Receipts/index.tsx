import { useEffect, useMemo, useState } from 'react';
import { getReceipts, type ReceiptRecord } from '../../../lib/receipts';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateTime = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Receipts() {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);

  useEffect(() => {
    getReceipts().then(setReceipts).catch(console.error);
  }, []);

  const totalAmount = useMemo(() => {
    return receipts.reduce((sum, receipt) => sum + receipt.total, 0);
  }, [receipts]);

  return (
    <div className="space-y-6">
      {/* First row: Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Card 1: Paid Receipts */}
        <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#4B2E2B' }}>
          <p className="text-sm text-gray-600">Paid Receipts</p>
          <p className="text-3xl font-bold text-[#4B2E2B]">{receipts.length}</p>
        </div>

        {/* Card 2: Total Payments */}
        <div className="border-l-4 border-l-green-600 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-3xl font-bold text-green-700">{money.format(totalAmount)}</p>
        </div>
      </div>

      {/* Second block: Receipt Archive */}
      <div className="shadow-md border-none bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Receipt Archive</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Receipt ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Paid At</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Table</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No paid receipts yet. Complete payments from orders and they will appear here.
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.receiptId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#4B2E2B]">{receipt.receiptId}</td>
                    <td className="px-4 py-3 text-gray-700">{receipt.orderId}</td>
                    <td className="px-4 py-3 text-gray-700">{dateTime.format(new Date(receipt.paidAt))}</td>
                    <td className="px-4 py-3 text-gray-700">{receipt.table}</td>
                    <td className="px-4 py-3 text-gray-700">{receipt.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{money.format(receipt.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
