import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  ApiIngredient,
  ApiProduct,
  Category,
  createRecipeBoard,
  deleteRecipeBoard,
  fetchCategories,
  fetchIngredients,
  fetchProducts,
  fetchRecipeBoard,
  RecipeBoardRow,
  RecipeSize,
  updateRecipeBoard,
  updateRecipeBoardStatus,
} from "../services/api";
import { CATEGORY_UPDATE_EVENT } from "../context/CategoryContext";

type RecipeStatus = "all" | "active" | "inactive";

type IngredientFormRow = {
  ingredient_id: string;
  amount: string;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function RecipesStockPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<RecipeStatus>("all");
  const [rows, setRows] = useState<RecipeBoardRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [ingredients, setIngredients] = useState<ApiIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RecipeBoardRow | null>(null);
  const [formProductId, setFormProductId] = useState("");
  const [formSize, setFormSize] = useState<RecipeSize>("medium");
  const [formIngredients, setFormIngredients] = useState<IngredientFormRow[]>([
    { ingredient_id: "", amount: "" },
  ]);

  useEffect(() => {
    void loadLookups();
  }, []);

  useEffect(() => {
    const handleCategoryUpdate = () => {
      void loadLookups();
      void loadBoard();
    };

    window.addEventListener(CATEGORY_UPDATE_EVENT, handleCategoryUpdate);
    return () => {
      window.removeEventListener(CATEGORY_UPDATE_EVENT, handleCategoryUpdate);
    };
  }, [loadBoard]);

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchRecipeBoard({
        search: search.trim() || undefined,
        category_id: categoryFilter === "all" ? undefined : Number(categoryFilter),
        status: statusFilter,
      });
      setRows(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  async function loadLookups() {
    try {
      const [categoriesResponse, productsResponse, ingredientsResponse] = await Promise.all([
        fetchCategories(),
        fetchProducts({}),
        fetchIngredients(),
      ]);

      setCategories(categoriesResponse);
      setProducts(productsResponse.data);
      setIngredients(ingredientsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load page data");
    }
  }

  const filteredRows = useMemo(() => {
    return rows;
  }, [rows]);

  function resetForm() {
    setFormProductId("");
    setFormSize("medium");
    setFormIngredients([{ ingredient_id: "", amount: "" }]);
    setEditingRow(null);
  }

  function openAddDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function openEditDialog(row: RecipeBoardRow) {
    setEditingRow(row);
    setFormProductId(String(row.product_id));
    setFormSize(row.size.toLowerCase() as RecipeSize);
    setFormIngredients(
      row.ingredients.length > 0
        ? row.ingredients.map((item) => ({
            ingredient_id: String(item.ingredient_id),
            amount: String(item.amount),
          }))
        : [{ ingredient_id: "", amount: "" }],
    );
    setDialogOpen(true);
  }

  function updateIngredientRow(index: number, key: "ingredient_id" | "amount", value: string) {
    setFormIngredients((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    );
  }

  function addIngredientRow() {
    setFormIngredients((prev) => [...prev, { ingredient_id: "", amount: "" }]);
  }

  function removeIngredientRow(index: number) {
    setFormIngredients((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function submitForm() {
    if (!formProductId) {
      setError("Please select a product");
      return;
    }

    const parsedIngredients = formIngredients
      .map((item) => ({
        ingredient_id: Number(item.ingredient_id),
        amount: Number(item.amount),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.ingredient_id) &&
          item.ingredient_id > 0 &&
          Number.isFinite(item.amount) &&
          item.amount > 0,
      );

    if (parsedIngredients.length === 0) {
      setError("Add at least one ingredient with amount > 0");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingRow) {
        await updateRecipeBoard(Number(formProductId), {
          size: formSize,
          ingredients: parsedIngredients,
        });
      } else {
        await createRecipeBoard({
          product_id: Number(formProductId),
          size: formSize,
          ingredients: parsedIngredients,
        });
      }

      setDialogOpen(false);
      resetForm();
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: RecipeBoardRow, checked: boolean | undefined) {
    try {
      const active = Boolean(checked);
      await updateRecipeBoardStatus(row.product_id, active);
      setRows((prev) =>
        prev.map((item) =>
          item.product_id === row.product_id
            ? { ...item, status: active ? "active" : "inactive" }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function removeRecipe(row: RecipeBoardRow) {
    const confirmed = window.confirm(
      `Delete ${row.product} (${row.size}) recipe? This removes all ingredient rows for this size.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteRecipeBoard(row.product_id, row.size.toLowerCase() as RecipeSize);
      setRows((prev) => prev.filter((item) => item.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe");
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="rounded-2xl border border-[#E5D2BB] bg-white shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E706B]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search recipe or ingredient..."
                className="h-10 border-[#E5D2BB] bg-[#F5F5F5] pl-9 text-[#4B2E2B] placeholder:text-[#7C5D58] focus:border-[#4B2E2B]"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="h-10 w-full border-[#E5D2BB] bg-[#F8F8F8] font-semibold lg:w-[180px]">
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

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | RecipeStatus)}
            >
              <SelectTrigger className="h-10 w-full border-[#E5D2BB] bg-[#F8F8F8] font-semibold lg:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="h-10 bg-[#4B2E2B] px-5 text-white hover:bg-[#5A3A36]"
              onClick={openAddDialog}
            >
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#E5D2BB] bg-white shadow-sm">
        <CardContent className="p-4 md:p-6">
          <h2 className="mb-4 text-[32px] font-semibold text-[#4B2E2B]">
            Product Recipes ({filteredRows.length})
          </h2>
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead className="font-semibold text-[#111827]">Product</TableHead>
                <TableHead className="font-semibold text-[#111827]">Category</TableHead>
                <TableHead className="font-semibold text-[#111827]">Size</TableHead>
                <TableHead className="font-semibold text-[#111827]">Ingredients</TableHead>
                <TableHead className="font-semibold text-[#111827]">Est. Cost</TableHead>
                <TableHead className="font-semibold text-[#111827]">Status</TableHead>
                <TableHead className="text-right font-semibold text-[#111827]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-[#7C5D58]">
                    Loading recipes...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-[#7C5D58]">
                    No recipes found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id} className="border-[#E5E7EB]">
                    <TableCell className="text-lg text-[#111827]">{row.product}</TableCell>
                    <TableCell className="text-lg text-[#111827]">{row.category}</TableCell>
                    <TableCell className="text-lg text-[#111827]">{row.size}</TableCell>
                    <TableCell>
                      <span className="rounded-full border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-1 text-sm font-semibold text-[#111827]">
                        {row.ingredients_count} items
                      </span>
                    </TableCell>
                    <TableCell className="text-lg font-semibold text-[#111827]">
                      {money.format(row.est_cost)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={row.status === "active"}
                          onCheckedChange={(checked) => toggleStatus(row, checked)}
                        />
                        <span
                          className={
                            row.status === "active"
                              ? "text-xl text-green-600"
                              : "text-xl text-[#7C5D58]"
                          }
                        >
                          {row.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl border-[#D1D5DB] text-[#111827]"
                          onClick={() => openEditDialog(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl border-[#FECACA] text-red-500 hover:bg-red-50"
                          onClick={() => void removeRecipe(row)}
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Recipe" : "Add Recipe"}</DialogTitle>
            <DialogDescription>
              Configure product size recipe and ingredient amounts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Product</label>
                <Select value={formProductId} onValueChange={setFormProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Size</label>
                <Select value={formSize} onValueChange={(value) => setFormSize(value as RecipeSize)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#4B2E2B]">Ingredients</p>
                <Button variant="outline" size="sm" onClick={addIngredientRow}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {formIngredients.map((item, index) => (
                <div key={`${index}-${item.ingredient_id}`} className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <Select
                      value={item.ingredient_id}
                      onValueChange={(value) => updateIngredientRow(index, "ingredient_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={String(ingredient.id)}>
                            {ingredient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.amount}
                      onChange={(event) => updateIngredientRow(index, "amount", event.target.value)}
                      placeholder="Amount"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-full"
                      disabled={formIngredients.length === 1}
                      onClick={() => removeIngredientRow(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void submitForm()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingRow ? (
                "Save Changes"
              ) : (
                "Create Recipe"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
