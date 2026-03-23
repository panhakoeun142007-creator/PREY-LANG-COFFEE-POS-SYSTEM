import { FormEvent, useCallback, useEffect, useMemo, useState, memo, useRef } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  fetchIncomeTransactions,
  updateExpense,
} from "../../services/api";
import { useSettings } from "../../context/SettingsContext";

// Constants
const EXPENSE_CATEGORIES = ["ingredients", "utilities", "salary", "rent", "other"] as const;
const DEBOUNCE_DELAY = 300;

// Type definitions
type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

interface ExpenseApiItem {
  id: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string | null;
}

interface IncomeApiItem {
  id: number;
  order_code: string;
  queue_number: number;
  table: string;
  payment_type?: string;
  amount: number;
  date: string;
}

// Utility functions
const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return value;
};

const dayKey = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString().slice(0, 10);
};

const formatPaymentType = (value?: string): string => {
  if (value === "khqr") return "KHQR";
  if (value === "cash") return "Cash";
  return "-";
};

// Memoized row components
const IncomeRow = memo(({ income, money }: { income: IncomeApiItem; money: Intl.NumberFormat }) => (
  <tr className="border-b border-[#F7EBDD] text-sm">
    <td className="py-3 text-[#6E4F4A]">{formatDate(income.date)}</td>
    <td className="py-3 font-medium text-[#4B2E2B]">{income.order_code}</td>
    <td className="py-3 text-[#6E4F4A]">{income.table}</td>
    <td className="py-3 text-[#6E4F4A]">{formatPaymentType(income.payment_type)}</td>
    <td className="py-3 text-right font-semibold text-emerald-700">
      {money.format(Number(income.amount))}
    </td>
  </tr>
));

const ExpenseRow = memo(({
  expense,
  onEdit,
  onDelete,
  money,
}: {
  expense: ExpenseApiItem;
  onEdit: (expense: ExpenseApiItem) => void;
  onDelete: (id: number) => void;
  money: Intl.NumberFormat;
}) => (
  <tr className="border-b border-[#F7EBDD] text-sm">
    <td className="py-3 text-[#6E4F4A]">{formatDate(expense.date)}</td>
    <td className="py-3 capitalize text-[#6E4F4A]">{expense.category}</td>
    <td className="py-3 font-medium text-[#4B2E2B]">{expense.title}</td>
    <td className="py-3 text-[#6E4F4A]">{expense.note || "-"}</td>
    <td className="py-3 text-right font-semibold text-rose-700">
      {money.format(Number(expense.amount))}
    </td>
    <td className="py-3 text-right">
      <button
        type="button"
        onClick={() => onEdit(expense)}
        className="mr-2 inline-flex items-center justify-center rounded-md p-1.5 text-[#6E4F4A] transition hover:bg-[#F8EFE4]"
        title="Edit expense"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(expense.id)}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 transition hover:bg-red-50"
        title="Delete expense"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </td>
  </tr>
));

// Loading skeleton
const LoadingSkeleton = memo(({ rows = 3 }: { rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        <td colSpan={5} className="py-4">
          <div className="h-4 animate-pulse rounded bg-[#E5D2BB]/50" />
        </td>
      </tr>
    ))}
  </>
));

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function IncomePage() {
  const { currency } = useSettings();
  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }),
    [currency],
  );
  // State
  const [incomes, setIncomes] = useState<IncomeApiItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseApiItem[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  // Ref for cleanup
  const isMountedRef = useRef(true);

  // Debounced search for performance
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Data fetching
  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incomePage, expensePage] = await Promise.all([
        fetchIncomeTransactions(),
        fetchExpenses(),
      ]);
      
      if (isMountedRef.current) {
        setIncomes(incomePage.data || []);
        setTotalIncome(Number(incomePage.summary?.total_income ?? 0));
        setExpenses(expensePage.data || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load finance data");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    isMountedRef.current = true;
    loadFinanceData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadFinanceData]);

  // Memoized calculations
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses],
  );

  const netProfit = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const profitMargin = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return (netProfit / totalIncome) * 100;
  }, [netProfit, totalIncome]);

  // Memoized filtered data
  const filteredIncome = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return incomes;
    return incomes.filter((income) => {
      const searchFields = [
        income.order_code,
        income.table,
        String(income.queue_number),
        income.payment_type || "",
      ].map((s) => s.toLowerCase());
      return searchFields.some((field) => field.includes(term));
    });
  }, [incomes, debouncedSearchTerm]);

  const filteredExpenses = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return expenses;
    return expenses.filter((expense) => {
      const searchFields = [
        expense.title,
        expense.category,
        expense.note || "",
        expense.date,
      ].map((s) => s.toLowerCase());
      return searchFields.some((field) => field.includes(term));
    });
  }, [expenses, debouncedSearchTerm]);

  // Memoized chart data
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        key: d.toISOString().slice(0, 10),
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
      };
    });

    const incomeByDay = new Map<string, number>();
    const expenseByDay = new Map<string, number>();

    incomes.forEach((income) => {
      const key = dayKey(income.date);
      const current = incomeByDay.get(key) || 0;
      incomeByDay.set(key, current + Number(income.amount));
    });

    expenses.forEach((expense) => {
      const key = dayKey(expense.date);
      const current = expenseByDay.get(key) || 0;
      expenseByDay.set(key, current + Number(expense.amount));
    });

    return days.map((day) => ({
      name: day.name,
      income: incomeByDay.get(day.key) ?? 0,
      expenses: expenseByDay.get(day.key) ?? 0,
    }));
  }, [incomes, expenses]);

  const expenseByCategory = useMemo(() => {
    const sums = new Map<ExpenseCategory, number>();
    EXPENSE_CATEGORIES.forEach((cat) => sums.set(cat, 0));
    expenses.forEach((expense) => {
      const current = sums.get(expense.category) || 0;
      sums.set(expense.category, current + Number(expense.amount));
    });

    return EXPENSE_CATEGORIES.map((cat) => ({
      category: cat[0].toUpperCase() + cat.slice(1),
      amount: Number((sums.get(cat) || 0).toFixed(2)),
    }));
  }, [expenses]);

  // Event handlers
  const resetForm = useCallback(() => {
    setTitle("");
    setAmount("");
    setCategory("other");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setEditingExpenseId(null);
  }, []);

  const handleSaveExpense = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!title.trim() || !amount.trim() || Number(amount) <= 0 || !date) {
        setError("Title, amount, and date are required.");
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
        setError(
          err instanceof Error
            ? err.message
            : editingExpenseId !== null
              ? "Failed to update expense"
              : "Failed to create expense",
        );
      } finally {
        setSaving(false);
      }
    },
    [title, amount, category, date, note, editingExpenseId, resetForm, loadFinanceData],
  );

  const handleEditExpense = useCallback((expense: ExpenseApiItem) => {
    setEditingExpenseId(expense.id);
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(expense.date.slice(0, 10));
    setNote(expense.note || "");
    setShowForm(true);
    setError(null);
  }, []);

  const handleDeleteExpense = useCallback(
    async (expenseId: number) => {
      try {
        await deleteExpense(expenseId);
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete expense");
      }
    },
    [loadFinanceData],
  );

  const toggleForm = useCallback(() => {
    if (showForm) resetForm();
    setShowForm((prev) => !prev);
  }, [showForm, resetForm]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-2xl bg-gradient-to-r from-[#4B2E2B] to-[#6B4E4B] px-6 py-7 text-white shadow-md">
        <div>
          <h2 className="text-2xl font-semibold">Income and Expenses</h2>
          <p className="mt-2 text-sm text-white/85">
            Track completed-order income and operational spending.
          </p>
        </div>
      </section>

      {/* Add Expense Button */}
      <section className="flex justify-end">
        <button
          type="button"
          onClick={toggleForm}
          className="inline-flex items-center rounded-xl bg-[#4B2E2B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6B4E4B]"
        >
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Close Form" : editingExpenseId !== null ? "Edit Expense" : "Add Expense"}
        </button>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7C5D58]">Total Income</p>
          <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{money.format(totalIncome)}</p>
          <p className="mt-2 text-sm font-medium text-emerald-600">Completed orders</p>
        </div>
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7C5D58]">Total Expenses</p>
          <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{money.format(totalExpenses)}</p>
          <p className="mt-2 text-sm font-medium text-rose-600">Recorded expenses</p>
        </div>
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7C5D58]">Net Profit</p>
          <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{money.format(netProfit)}</p>
          <p
            className={`mt-2 text-sm font-medium ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {netProfit >= 0 ? "Profit" : "Loss"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7C5D58]">Profit Margin</p>
          <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{profitMargin.toFixed(1)}%</p>
          <p
            className={`mt-2 text-sm font-medium ${profitMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {profitMargin >= 0 ? "Healthy" : "Negative"}
          </p>
        </div>
      </section>

      {/* Expense Form */}
      {showForm && (
        <section className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#4B2E2B]">Expense Form</h3>
          <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6" onSubmit={handleSaveExpense}>
            <input
              className="h-10 rounded-lg border border-[#E5D2BB] px-3 text-sm outline-none focus:ring-2 focus:ring-[#4B2E2B]/20 md:col-span-2"
              placeholder="Expense title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className="h-10 rounded-lg border border-[#E5D2BB] px-3 text-sm outline-none focus:ring-2 focus:ring-[#4B2E2B]/20"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className="h-10 rounded-lg border border-[#E5D2BB] px-3 text-sm capitalize outline-none focus:ring-2 focus:ring-[#4B2E2B]/20"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((item) => (
                <option key={item} value={item} className="capitalize">
                  {item}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="h-10 rounded-lg border border-[#E5D2BB] px-3 text-sm outline-none focus:ring-2 focus:ring-[#4B2E2B]/20"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-[#4B2E2B] px-4 text-sm font-semibold text-white hover:bg-[#6B4E4B] disabled:opacity-60"
            >
              {saving ? "Saving..." : editingExpenseId !== null ? "Update Expense" : "Save Expense"}
            </button>
            <input
              className="h-10 rounded-lg border border-[#E5D2BB] px-3 text-sm outline-none focus:ring-2 focus:ring-[#4B2E2B]/20 md:col-span-6"
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </form>
        </section>
      )}

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#4B2E2B]">
            Income vs Expense (Last 7 Days)
          </h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E3D3" />
                <XAxis dataKey="name" stroke="#8E706B" />
                <YAxis stroke="#8E706B" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#2E7D32"
                  strokeWidth={3}
                  dot={{ fill: "#2E7D32" }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#B91C1C"
                  strokeWidth={3}
                  dot={{ fill: "#B91C1C" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#4B2E2B]">Expenses by Category</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E3D3" />
                <XAxis dataKey="category" stroke="#8E706B" />
                <YAxis stroke="#8E706B" />
                <Tooltip />
                <Bar dataKey="amount" fill="#8B5E57" radius={[8, 8, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Transactions */}
      <section className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-semibold text-[#4B2E2B]">Transactions</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E706B]" />
            <input
              type="text"
              placeholder="Search by order, table, title, category..."
              className="w-full rounded-lg border border-[#E5D2BB] bg-[#F9F3EF] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#4B2E2B]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Income Table */}
        <div className="mt-4 overflow-x-auto">
          <h4 className="mb-2 text-sm font-semibold text-[#4B2E2B]">Income Transactions</h4>
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[#F1E3D3] text-xs uppercase tracking-wide text-[#8E706B]">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Order</th>
                <th className="pb-3 font-semibold">Table</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingSkeleton rows={3} />
              ) : filteredIncome.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-sm text-[#7C5D58]">
                    No income transactions found
                  </td>
                </tr>
              ) : (
                filteredIncome.map((income) => (
                  <IncomeRow key={income.id} income={income} money={money} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Expenses Table */}
        <div className="mt-8 overflow-x-auto">
          <h4 className="mb-2 text-sm font-semibold text-[#4B2E2B]">Expense Transactions</h4>
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[#F1E3D3] text-xs uppercase tracking-wide text-[#8E706B]">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Title</th>
                <th className="pb-3 font-semibold">Note</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
                <th className="pb-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingSkeleton rows={3} />
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-sm text-[#7C5D58]">
                    No expense transactions found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                    money={money}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
