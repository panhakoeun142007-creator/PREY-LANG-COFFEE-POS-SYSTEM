import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';

const transactions = [
  {
    date: 'Oct 24, 2023',
    category: 'Ingredients',
    description: 'Arabica Coffee Beans (20kg)',
    amount: '$450.00',
    method: 'Bank Transfer',
    status: 'Completed',
    categoryColor: 'bg-amber-50 text-amber-600',
  },
  {
    date: 'Oct 22, 2023',
    category: 'Utilities',
    description: 'Electricity Bill - Store A',
    amount: '$325.40',
    method: 'Auto-Debit',
    status: 'Pending',
    categoryColor: 'bg-blue-50 text-blue-600',
  },
  {
    date: 'Oct 20, 2023',
    category: 'Labor',
    description: 'Weekly Barista Salaries',
    amount: '$1,200.00',
    method: 'Direct Deposit',
    status: 'Completed',
    categoryColor: 'bg-purple-50 text-purple-600',
  },
  {
    date: 'Oct 18, 2023',
    category: 'Rent',
    description: 'Main Street Facility Rent',
    amount: '$2,100.00',
    method: 'Check',
    status: 'Completed',
    categoryColor: 'bg-slate-100 text-slate-600',
  },
];

export function TransactionTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-slate-800">Expense Transactions</h3>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
            <input
              className="w-full pl-10 pr-4 py-1.5 bg-[#f9f3ef] border-none rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Search by description..."
              type="text"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="size-3.5" />
            Filter
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-background-light text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Payment Method</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 text-sm text-slate-600">{tx.date}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-1 rounded text-[10px] font-bold", tx.categoryColor)}>
                    {tx.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{tx.description}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{tx.amount}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{tx.method}</td>
                <td className="px-6 py-4">
                  <div className={cn(
                    "flex items-center gap-1.5",
                    tx.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                  )}>
                    <span className={cn("size-1.5 rounded-full", tx.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500')}></span>
                    <span className="text-[10px] font-bold uppercase">{tx.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-primary transition-colors">
                    <MoreVertical className="size-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
