import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, TrendingUp, Wallet, Percent, CreditCard, Search, Trash2, Pencil } from 'lucide-react';
import { KPICard } from '../KPICard';
import { Charts } from '../Charts';
import {
  createExpense,
  deleteExpense,
  ExpenseApiItem,
  ExpenseCategory,
  fetchDashboardData,
  fetchExpenses,
  updateExpense,
} from '../../services/api';

const expenseCategories: ExpenseCategory[] = ['ingredients', 'utilities', 'salary', 'rent', 'other'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCurrencyLabel(value: string): number {
  const numeric = value.replace(/[^\d.-]/g, '');
  return toNumber(numeric);
}

function formatExpenseDate(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return value;
}

export default function App() {
  const [expenses, setExpenses] = useState<ExpenseApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [revenueToday, setRevenueToday] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, expensePage] = await Promise.all([fetchDashboardData(), fetchExpenses()]);
      setExpenses(expensePage.data);
      const revenueValue = dashboard.stats.find((item) => item.label === 'Total Revenue Today')?.value;
      const profitValue = dashboard.stats.find((item) => item.label === 'Monthly Profit')?.value;
      setRevenueToday(revenueValue ? parseCurrencyLabel(revenueValue) : 0);
      setMonthlyProfit(profitValue ? parseCurrencyLabel(profitValue) : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const listedExpensesTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses],
  );

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return expenses;
    return expenses.filter((expense) => {
      return (
        expense.title.toLowerCase().includes(term) ||
        expense.category.toLowerCase().includes(term) ||
        (expense.note || '').toLowerCase().includes(term) ||
        expense.date.toLowerCase().includes(term)
      );
    });
  }, [expenses, searchTerm]);

  function resetForm(): void {
    setTitle('');
    setAmount('');
    setCategory('other');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setEditingExpenseId(null);
  }

  async function handleSaveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !amount.trim() || Number(amount) <= 0 || !date) {
      setError('Title, amount, and date are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        amount: Number(amount),
        category,
        date,
        note: note.trim() || undefined,
      };

      if (editingExpenseId !== null) {
        await updateExpense(editingExpenseId, payload);
      } else {
        await createExpense(payload);
      }

      resetForm();
      setShowForm(false);
      await loadFinanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingExpenseId !== null ? 'Failed to update expense' : 'Failed to create expense');
    } finally {
      setSaving(false);
    }
  }

  function handleEditExpense(expense: ExpenseApiItem): void {
    setEditingExpenseId(expense.id);
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(expense.date.slice(0, 10));
    setNote(expense.note || '');
    setShowForm(true);
    setError(null);
  }

  async function handleDeleteExpense(expenseId: number) {
    try {
      await deleteExpense(expenseId);
      await loadFinanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h3 className="text-lg font-semibold">Financial Overview</h3>
          <p className="text-sm text-slate-500">Summary of your revenue and spending for the current period.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm((prev) => !prev);
          }}
          className="flex items-center gap-2 bg-[#5A2D2D] text-white px-6 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Close Form' : editingExpenseId !== null ? 'Edit Expense' : 'Add Expense'}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <KPICard
          title="Total Revenue"
          value={formatCurrency(revenueToday)}
          change="0.0%"
          trend="up"
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <KPICard
          title="Total Expenses"
          value={formatCurrency(listedExpensesTotal)}
          change="0.0%"
          trend="up"
          icon={CreditCard}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(monthlyProfit)}
          change="0.0%"
          trend="up"
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          title="Profit Margin"
          value="34.8%"
          change="2.4%"
          trend="up"
          icon={Percent}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          progress={34.8}
        />
      </motion.div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveExpense}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
        >
          <input
            className="md:col-span-2 h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Expense title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm capitalize outline-none focus:ring-2 focus:ring-primary/20"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          >
            {expenseCategories.map((item) => (
              <option key={item} value={item} className="capitalize">
                {item}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-lg bg-[#5A2D2D] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving...' : editingExpenseId !== null ? 'Update Expense' : 'Save Expense'}
          </button>
          <input
            className="md:col-span-6 h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </motion.form>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Charts />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-slate-800">Expense Transactions</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-[#f9f3ef] rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search by title, category, note..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background-light text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{formatExpenseDate(expense.date)}</td>
                      <td className="px-6 py-4 text-sm capitalize text-slate-700">{expense.category}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{expense.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{expense.note || '-'}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-slate-800">
                        {formatCurrency(Number(expense.amount))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditExpense(expense)}
                          className="mr-2 inline-flex items-center justify-center rounded-md p-1.5 text-slate-700 hover:bg-slate-100"
                          title="Edit expense"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 hover:bg-red-50"
                          title="Delete expense"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
