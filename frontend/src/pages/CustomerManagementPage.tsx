import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  createCustomer,
  CustomerApiItem,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from "../services/api";

type StatusFilter = "all" | "active" | "inactive";

type CustomerFormState = {
  name: string;
  email: string;
  password: string;
  salary: string;
  is_active: boolean;
};

const initialForm: CustomerFormState = {
  name: "",
  email: "",
  password: "",
  salary: "0",
  is_active: true,
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<CustomerApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerApiItem | null>(null);
  const [form, setForm] = useState<CustomerFormState>(initialForm);

  useEffect(() => {
    void loadCustomers();
  }, [statusFilter]);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCustomers({
        is_active: statusFilter === "all" ? undefined : statusFilter === "active",
      });
      setCustomers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term),
    );
  }, [customers, search]);

  const totalSalary = filteredCustomers.reduce((sum, c) => sum + Number(c.salary || 0), 0);

  function openAddDialog() {
    setEditingCustomer(null);
    setForm(initialForm);
    setDialogOpen(true);
  }

  function openEditDialog(customer: CustomerApiItem) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      password: "",
      salary: String(customer.salary),
      is_active: customer.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const name = form.name.trim();
    const email = form.email.trim();
    const salary = Number(form.salary);
    const password = form.password.trim();

    if (!name || !email || !Number.isFinite(salary) || salary < 0) {
      return;
    }

    if (!editingCustomer && password.length < 6) {
      setError("Password must be at least 6 characters for new customer.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name,
          email,
          salary,
          is_active: form.is_active,
          password: password ? password : undefined,
        });
      } else {
        await createCustomer({
          name,
          email,
          salary,
          is_active: form.is_active,
          password,
        });
      }

      await loadCustomers();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer: CustomerApiItem) {
    const confirmed = window.confirm(`Delete staff "${customer.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteCustomer(customer.id);
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#4B2E2B]">Staff Management</h2>
          <p className="text-sm text-[#7C5D58]">
            Manage staff email/password, salary, and account status.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C5D58]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[#7C5D58]">
            <p>
              Total Staff:{" "}
              <span className="font-semibold text-[#4B2E2B]">{filteredCustomers.length}</span>
            </p>
            <p>
              Total Salary:{" "}
              <span className="font-semibold text-[#4B2E2B]">{money.format(totalSalary)}</span>
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-[#7C5D58]">
                    Loading staff...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-[#7C5D58]">
                    No staff found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{money.format(Number(customer.salary || 0))}</TableCell>
                    <TableCell>
                      <span
                        className={
                          customer.is_active
                            ? "font-semibold text-green-600"
                            : "font-semibold text-[#7C5D58]"
                        }
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(customer)}
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Staff" : "Add Staff"}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update staff email, password, salary and account status."
                : "Create a staff account with email, password and salary."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Staff name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="staff@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Password {editingCustomer ? "(leave blank to keep current)" : ""}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={editingCustomer ? "Optional new password" : "Minimum 6 characters"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Salary</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.salary}
                onChange={(event) => setForm((prev) => ({ ...prev, salary: event.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <p className="text-sm font-medium">Active Account</p>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: Boolean(checked) }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingCustomer ? "Save Changes" : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
