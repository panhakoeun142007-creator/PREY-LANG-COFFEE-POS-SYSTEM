import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ApiIngredient, fetchIngredients } from "../services/api";

export default function IngredientsStockPage() {
  const [ingredients, setIngredients] = useState<ApiIngredient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadIngredients();
  }, []);

  async function loadIngredients() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchIngredients();
      setIngredients(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ingredients");
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return ingredients;
    }
    return ingredients.filter((item) => item.name.toLowerCase().includes(term));
  }, [ingredients, search]);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="rounded-2xl border border-[#E5D2BB] bg-white shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E706B]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ingredient..."
              className="h-10 border-[#E5D2BB] bg-[#F5F5F5] pl-9 text-[#4B2E2B] placeholder:text-[#7C5D58]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#E5D2BB] bg-white shadow-sm">
        <CardContent className="p-4 md:p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[#4B2E2B]">
            Ingredients / Stock ({filtered.length})
          </h2>
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead className="font-semibold text-[#111827]">Ingredient</TableHead>
                <TableHead className="font-semibold text-[#111827]">Unit</TableHead>
                <TableHead className="font-semibold text-[#111827]">Stock Qty</TableHead>
                <TableHead className="font-semibold text-[#111827]">Min Stock</TableHead>
                <TableHead className="font-semibold text-[#111827]">Unit Cost</TableHead>
                <TableHead className="font-semibold text-[#111827]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[#7C5D58]">
                    Loading ingredients...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[#7C5D58]">
                    No ingredients found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const stockQty = Number(item.stock_qty ?? 0);
                  const minStock = Number(item.min_stock ?? 0);
                  const isLow = stockQty <= minStock;
                  return (
                    <TableRow key={item.id} className="border-[#E5E7EB]">
                      <TableCell className="font-medium text-[#111827]">{item.name}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{stockQty.toFixed(2)}</TableCell>
                      <TableCell>{minStock.toFixed(2)}</TableCell>
                      <TableCell>${Number(item.unit_cost ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            isLow
                              ? "font-semibold text-red-600"
                              : "font-semibold text-green-600"
                          }
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
