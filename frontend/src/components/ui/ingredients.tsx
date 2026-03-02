import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  createIngredient,
  deleteIngredient,
  fetchCategories,
  fetchIngredients,
  updateIngredient,
  type CategoryApiItem,
  type IngredientApiItem,
} from "../../services/api";

interface IngredientFormState {
  name: string;
  category_id: string;
  unit: string;
  stock_qty: string;
  min_stock: string;
}

interface StockFormState {
  stock_qty: string;
}

function toNumber(value: string): number | null {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export default function IngredientsUI() {
  const [ingredients, setIngredients] = useState<IngredientApiItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<CategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stockEditingId, setStockEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<IngredientFormState>({
    name: "",
    category_id: "",
    unit: "kg",
    stock_qty: "0",
    min_stock: "0",
  });
  const [stockForm, setStockForm] = useState<StockFormState>({
    stock_qty: "0",
  });

  useEffect(() => {
    void loadIngredients();
  }, []);

  async function loadIngredients() {
    try {
      setLoading(true);
      setError(null);
      const [ingredientsData, categoriesData] = await Promise.all([
        fetchIngredients(),
        fetchCategories().catch(() => [] as CategoryApiItem[]),
      ]);
      setIngredients(ingredientsData);
      setMenuCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ingredients");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    return [...menuCategories].sort((a, b) => a.name.localeCompare(b.name));
  }, [menuCategories]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((item) => {
      const categoryLabel = item.category || (item.category_id ? categoryMap.get(item.category_id) : null) || "";
      const isLow = Number(item.stock_qty) < Number(item.min_stock);
      const status = isLow ? "low_stock" : "in_stock";

      const matchSearch =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        categoryLabel.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "all" || String(item.category_id ?? "") === categoryFilter;
      const matchStatus = statusFilter === "all" || status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [ingredients, categoryMap, search, categoryFilter, statusFilter]);

  const pendingDelete = useMemo(
    () => ingredients.find((item) => item.id === pendingDeleteId) ?? null,
    [ingredients, pendingDeleteId],
  );

  const stockTarget = useMemo(
    () => ingredients.find((item) => item.id === stockEditingId) ?? null,
    [ingredients, stockEditingId],
  );

  function openAddDialog() {
    setEditingId(null);
    setForm({
      name: "",
      category_id: categories[0] ? String(categories[0].id) : "",
      unit: "kg",
      stock_qty: "0",
      min_stock: "0",
    });
    setDialogOpen(true);
  }

  function openEditDialog(item: IngredientApiItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category_id: item.category_id ? String(item.category_id) : "",
      unit: item.unit,
      stock_qty: String(item.stock_qty),
      min_stock: String(item.min_stock),
    });
    setDialogOpen(true);
  }

  function openStockDialog(item: IngredientApiItem) {
    setStockEditingId(item.id);
    setStockForm({
      stock_qty: String(item.stock_qty),
    });
    setStockDialogOpen(true);
  }

  async function submitForm() {
    const name = form.name.trim();
    const categoryId = Number(form.category_id);
    const stockQty = toNumber(form.stock_qty.trim() || "0");
    const minStock = toNumber(form.min_stock.trim() || "0");
    const unit = form.unit.trim();

    if (!name || !Number.isInteger(categoryId) || categoryId <= 0 || !unit || stockQty === null || minStock === null) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingId !== null) {
        await updateIngredient(editingId, {
          name,
          category_id: categoryId,
          unit,
          stock_qty: stockQty,
          min_stock: minStock,
        });
      } else {
        await createIngredient({
          name,
          category_id: categoryId,
          unit,
          stock_qty: stockQty,
          min_stock: minStock,
        });
      }
      await loadIngredients();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ingredient");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await deleteIngredient(pendingDeleteId);
      await loadIngredients();
      setDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ingredient");
    } finally {
      setDeleting(false);
    }
  }

  async function submitStockUpdate() {
    if (stockEditingId === null) {
      return;
    }
    const qty = toNumber(stockForm.stock_qty.trim() || "0");
    if (qty === null) {
      return;
    }

    try {
      setStockSaving(true);
      setError(null);
      await updateIngredient(stockEditingId, { stock_qty: qty });
      await loadIngredients();
      setStockDialogOpen(false);
      setStockEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setStockSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-[#7C5D58]">Loading ingredients...</p> : null}
      {!loading && categories.length === 0 ? (
        <p className="text-sm text-[#7C5D58]">Create at least one category on the Categories page before adding ingredients.</p>
      ) : null}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C5D58]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ingredient or category..."
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openAddDialog} disabled={categories.length === 0}>
              <Plus className="h-4 w-4" />
              Add Ingredient
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-xl font-semibold text-[#4B2E2B]">
            Ingredient Stock ({filtered.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#EAD6C0] text-xs uppercase tracking-wider text-[#7C5D58]">
                  <th className="px-3 py-3">Ingredient</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Current Stock</th>
                  <th className="px-3 py-3">Min. Required</th>
                  <th className="px-3 py-3">Unit</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const category =
                    item.category ||
                    (item.category_id ? categoryMap.get(item.category_id) : null) ||
                    "Uncategorized";
                  const isLow = Number(item.stock_qty) < Number(item.min_stock);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[#F1E3D3] text-sm"
                    >
                      <td className="px-3 py-3 font-medium text-[#4B2E2B]">{item.name}</td>
                      <td className="px-3 py-3 text-[#4B2E2B]">{category}</td>
                      <td className="px-3 py-3">
                        <span className={isLow ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
                          {Number(item.stock_qty).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#4B2E2B]">{Number(item.min_stock).toFixed(2)}</td>
                      <td className="px-3 py-3 text-[#4B2E2B]">{item.unit}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isLow ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStockDialog(item)}
                          >
                            Update Stock
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setPendingDeleteId(item.id);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-[#7C5D58]">
                      No ingredients found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Ingredient" : "Add Ingredient"}</DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? "Update ingredient details and save changes."
                : "Create a new ingredient for inventory tracking."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4B2E2B]">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Espresso Beans"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Category</label>
                <Select
                  value={form.category_id}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Unit</label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                  placeholder="kg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Stock Qty</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.stock_qty}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock_qty: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Min Stock</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.min_stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, min_stock: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitForm}
              disabled={
                saving ||
                !form.name.trim() ||
                !form.category_id.trim() ||
                !form.unit.trim() ||
                toNumber(form.stock_qty) === null ||
                toNumber(form.min_stock) === null
              }
            >
              {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Ingredient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={stockDialogOpen}
        onOpenChange={(open) => {
          setStockDialogOpen(open);
          if (!open) {
            setStockEditingId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              {stockTarget ? `Set current stock for "${stockTarget.name}".` : "Set current stock quantity."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#4B2E2B]">Current Stock</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={stockForm.stock_qty}
              onChange={(e) => setStockForm({ stock_qty: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitStockUpdate}
              disabled={stockSaving || toNumber(stockForm.stock_qty) === null}
            >
              {stockSaving ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ingredient</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Delete "${pendingDelete.name}"? This action cannot be undone.`
                : "Delete this ingredient? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
