import { motion } from "motion/react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Coffee,
  Croissant,
  CupSoda,
  IceCreamBowl,
  Package,
  Sparkles,
  Pencil,
  Trash2,
  RotateCcw,
  Plus,
} from "lucide-react";
import { Badge } from "./badge";
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
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../services/api";

type CategoryStatus = "active" | "archived";
type IconKey = "coffee" | "bakery" | "hot" | "iced" | "merch" | "seasonal";

interface Category {
  id: number;
  name: string;
  description: string | null;
  count: number;
  status: CategoryStatus;
  icon: IconKey;
}

interface CategoryFormState {
  name: string;
  description: string;
  count: string;
  status: CategoryStatus;
  icon: IconKey;
}

const ICON_MAP: Record<IconKey, ComponentType<{ className?: string }>> = {
  coffee: Coffee,
  bakery: Croissant,
  hot: CupSoda,
  iced: IceCreamBowl,
  merch: Package,
  seasonal: Sparkles,
};

function isApiConnectionError(message: string): boolean {
  return (
    message.includes("Failed to fetch") ||
    message.includes("Cannot connect to API server") ||
    message.includes("NetworkError")
  );
}

export default function CategoriesUI() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>({
    name: "",
    description: "",
    count: "0",
    status: "active",
    icon: "coffee",
  });
  const isConnectionError = !!error && isApiConnectionError(error);

  useEffect(() => {
    void loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const items = await fetchCategories();
      const mapped: Category[] = items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        count: item.quantity ?? item.products_count ?? 0,
        status: item.is_active ? "active" : "archived",
        icon: "coffee",
      }));
      setCategories(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  const totalCategories = categories.length;
  const activeCount = categories.filter((item) => item.status === "active").length;
  const archivedCount = totalCategories - activeCount;
  const totalProducts = categories.reduce((sum, item) => sum + item.count, 0);

  const pendingDelete = useMemo(
    () => categories.find((item) => item.id === pendingDeleteId) ?? null,
    [categories, pendingDeleteId],
  );

  function openAddDialog() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      count: "0",
      status: "active",
      icon: "coffee",
    });
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
      count: String(category.count),
      status: category.status,
      icon: category.icon,
    });
    setDialogOpen(true);
  }

  async function submitForm() {
    const name = form.name.trim();
    const description = form.description.trim();
    const count = form.count.trim() === "" ? 0 : Number(form.count);

    if (!name || Number.isNaN(count) || count < 0) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingId !== null) {
        await updateCategory(editingId, {
          name,
          description: description || undefined,
          quantity: count,
          is_active: form.status === "active",
        });
      } else {
        await createCategory({
          name,
          description: description || undefined,
          quantity: count,
          is_active: form.status === "active",
        });
      }
      await loadCategories();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  function askDelete(id: number) {
    setPendingDeleteId(id);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await deleteCategory(pendingDeleteId);
      await loadCategories();
      setDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#4B2E2B]">Categories</h2>
          <p className="text-sm text-[#7C5D58]">
            Manage your menu organization and product groups.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-red-600">
          {isConnectionError
            ? "Cannot reach backend API. Start Laravel server: php artisan serve --host=127.0.0.1 --port=8000"
            : error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-[#7C5D58]">Loading categories...</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Total Categories</p>
            <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{totalCategories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Active</p>
            <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Archived</p>
            <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{archivedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#7C5D58]">Products In Categories</p>
            <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{totalProducts}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, idx) => {
          const Icon = ICON_MAP[category.icon];
          const isArchived = category.status === "archived";

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <Card className={isArchived ? "opacity-80" : ""}>
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-lg bg-[#F8EFE4] p-2 text-[#4B2E2B]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={isArchived ? "outline" : "success"}>
                      {isArchived ? "Archived" : "Active"}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-[#4B2E2B]">{category.name}</h3>
                  <p className="mt-1 text-sm text-[#7C5D58]">{category.count} products</p>

                  <div className="mt-4 flex items-center justify-between border-t border-[#F1E3D3] pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => openEditDialog(category)}
                    >
                      {isArchived ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                      {isArchived ? "Restore" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => askDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? "Update category details and save changes."
                : "Create a new category for your menu."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4B2E2B]">Category Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Signature Drinks"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4B2E2B]">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4B2E2B]">Products Count</label>
              <Input
                type="number"
                min={0}
                value={form.count}
                onChange={(e) => setForm((prev) => ({ ...prev, count: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, status: value as CategoryStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4B2E2B]">Icon</label>
                <Select
                  value={form.icon}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, icon: value as IconKey }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coffee">Coffee</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="hot">Hot Drinks</SelectItem>
                    <SelectItem value="iced">Iced Drinks</SelectItem>
                    <SelectItem value="merch">Merchandise</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
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
                (form.count.trim() !== "" && Number.isNaN(Number(form.count))) ||
                Number(form.count || 0) < 0
              }
            >
              {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Delete "${pendingDelete.name}"? This action cannot be undone.`
                : "Delete this category? This action cannot be undone."}
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
