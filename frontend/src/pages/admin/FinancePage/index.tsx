import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  createExpense,
  DashboardData,
  deleteExpense,
  ExpenseApiItem,
  ExpenseCategory,
  fetchDashboardData,
  fetchExpenses,
} from "../../../services/api";

const expenseCategories: ExpenseCategory[] = ["ingredients", "utilities", "salary", "rent", "other"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCurrencyLabel(value: string): number {
  const numeric = value.replace(/[^\d.-]/g, "");
  return toNumber(numeric);
}

export default function FinancePage() {
  const [expenses, setExpenses] = useState<ExpenseApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | ExpenseCategory>("all");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboard, expensePage] = await Promise.all([
        fetchDashboardData(),
        fetchExpenses({ category: categoryFilter === "all" ? undefined : categoryFilter }),
      ]);

      setDashboardData(dashboard);
      setExpenses(expensePage.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const revenueToday = useMemo(() => {
    const value = dashboardData?.stats.find((item) => item.label === "Total Revenue Today")?.value;
    return value ? parseCurrencyLabel(value) : 0;
  }, [dashboardData]);

  const monthlyProfit = useMemo(() => {
    const value = dashboardData?.stats.find((item) => item.label === "Monthly Profit")?.value;
    return value ? parseCurrencyLabel(value) : 0;
  }, [dashboardData]);

  const listedExpensesTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses],
  );

  async function handleCreateExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !amount.trim() || Number(amount) <= 0 || !date) {
      setError("Title, amount, and date are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createExpense({
        title: title.trim(),
        amount: Number(amount),
        category,
        date,
        note: note.trim() || undefined,
      });

      setTitle("");
      setAmount("");
      setCategory("other");
      setDate(new Date().toISOString().slice(0, 10));
      setNote("");
      await loadFinanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(expenseId: number) {
    try {
      await deleteExpense(expenseId);
      await loadFinanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Revenue Today</p>
            <p className="mt-1 text-2xl font-semibold text-[#4B2E2B]">{formatCurrency(revenueToday)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Monthly Profit</p>
            <p className="mt-1 text-2xl font-semibold text-[#4B2E2B]">{formatCurrency(monthlyProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Listed Expenses Total</p>
            <p className="mt-1 text-2xl font-semibold text-[#4B2E2B]">{formatCurrency(listedExpensesTotal)}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-5">
          <form className="grid grid-cols-1 gap-3 md:grid-cols-6" onSubmit={handleCreateExpense}>
            <Input
              placeholder="Expense title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="md:col-span-2"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button type="submit" disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Add Expense"}
            </Button>
            <Input
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="md:col-span-6"
            />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#4B2E2B]">Expense Transactions</h2>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as "all" | ExpenseCategory)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                {expenseCategories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-[#7C5D58]">
                      Loading expenses...
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-[#7C5D58]">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell className="capitalize">{expense.category}</TableCell>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell>{expense.note || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(expense.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
