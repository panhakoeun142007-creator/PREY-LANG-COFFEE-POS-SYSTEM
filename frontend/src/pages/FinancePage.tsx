import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  createExpense,
  deleteExpense,
  fetchDashboardData,
  fetchExpenses,
  updateExpense,
  type DashboardData,
  type ExpenseApiItem,
  type ExpenseCategory,
} from "../services/api";
import { useSettings } from "../context/SettingsContext";
import { useAutoRefresh } from "../hooks";

const EXPENSE_CATEGORIES: ExpenseCategory[] = ["ingredients", "utilities", "salary", "rent", "other"];

const EMPTY_FORM = {
  title: "",
  amount: "",
  category: "other" as ExpenseCategory,
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

function parseCurrencyLabel(value: string): number {
  const numeric = value.replace(/[^\d.-]/g, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FinancePage() {
  const { currency } = useSettings();
  const money = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency }),
    [currency],
  );

  const [expenses, setExpenses] = useState<ExpenseApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | ExpenseCategory>("all");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Add/Edit form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<ExpenseApiItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, expensePage] = await Promise.all([
        fetchDashboardData(true),
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

  useAutoRefresh(loadFinanceData, { intervalMs: 15000 });

  const revenueToday = useMemo(() => {
    const value = dashboardData?.stats.find((s) => s.label === "Total Revenue Today")?.value;
    return value ? parseCurrencyLabel(value) : 0;
  }, [dashboardData]);

  const monthlyProfit = useMemo(() => {
    const value = dashboardData?.stats.find((s) => s.label === "Monthly Profit")?.value;
    return value ? parseCurrencyLabel(value) : 0;
  }, [dashboardData]);

  const listedExpensesTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses],
  );

  function openAddDialog() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(expense: ExpenseApiItem) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date.slice(0, 10),
      note: expense.note ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0 || !form.date) {
      setError("Title, amount, and date are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        note: form.note.trim() || undefined,
      };

      if (editingId !== null) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      setDialogOpen(false);
      await loadFinanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await deleteExpense(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadFinanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Revenue Today</p>
            <p className="mt-1 text-2xl font-semibold text-[#4B2E2B]">{money.format(revenueToday)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Monthly Profit</p>
            <p className="mt-1 text-2xl font-semibold text-[#4B2E2B]">{money.format(monthlyProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Listed Expenses Total</p>
            <p className="mt-1 text-2xl font-semibold text-[#4B2E2B]">{money.format(listedExpensesTotal)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Expense Table */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#4B2E2B]">Expense Transactions</h2>
            <div className="flex items-center gap-2">
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as "all" | ExpenseCategory)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openAddDialog}>
                <Plus className="mr-1 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
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
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell>{expense.date.slice(0, 10)}</TableCell>
                      <TableCell className="capitalize">{expense.category}</TableCell>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell>{expense.note || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {money.format(Number(expense.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => { setDeleteTarget(expense); setDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>
              {editingId !== null ? "Update the expense details." : "Record a new expense transaction."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4B2E2B]">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Coffee beans restock"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Amount</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4B2E2B]">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v as ExpenseCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4B2E2B]">Note (optional)</label>
              <Input
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Any additional details..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.title.trim() || !form.amount || Number(form.amount) <= 0 || !form.date}
            >
              {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Delete "${deleteTarget.title}"? This action cannot be undone.`
                : "Delete this expense? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting !== null}
            >
              {deleting !== null ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
