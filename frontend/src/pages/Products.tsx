import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  ApiProduct,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
} from "../services/api";
import { useCategoryContext } from "../context/CategoryContext";

// Form interface matching API
interface ProductFormData {
  name: string;
  category_id: string;
  price_small: string;
  price_medium: string;
  price_large: string;
  sku: string;
  image: string;
  is_active: boolean;
}

const initialFormData: ProductFormData = {
  name: "",
  category_id: "",
  price_small: "",
  price_medium: "",
  price_large: "",
  sku: "",
  image: "",
  is_active: true,
};

// Memoized product row component
const ProductRow = memo(function ProductRow({ 
  product, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  product: ApiProduct; 
  onEdit: (p: ApiProduct) => void; 
  onDelete: (id: number) => void;
  onToggle: (p: ApiProduct) => void;
}) {
  const getPrice = () => {
    if (product.price_large) return `$${Number(product.price_large).toFixed(2)}`;
    if (product.price_medium) return `$${Number(product.price_medium).toFixed(2)}`;
    if (product.price_small) return `$${Number(product.price_small).toFixed(2)}`;
    return "$0.00";
  };

  return (
    <TableRow className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
      <TableCell className="font-medium text-[#4B2E2B]">
        <div className="flex items-center gap-3">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover"
              loading="lazy"
            />
          )}
          <div>
            <div className="font-medium">{product.name}</div>
            {product.sku && <div className="text-xs text-[#7C5D58]">SKU: {product.sku}</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-[#6E4F4A]">
        {product.category_name || "Uncategorized"}
      </TableCell>
      <TableCell className="text-[#6E4F4A]">{getPrice()}</TableCell>
      <TableCell>
        <Switch
          checked={product.is_available ?? product.is_active}
          onCheckedChange={() => onToggle(product)}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(product)}
            className="h-8 w-8 text-[#4B2E2B] hover:bg-[#F1E3D3]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product.id)}
            className="h-8 w-8 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export default function Products() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { refreshCategories } = useCategoryContext();

  // Fetch data with useCallback for performance
  const loadData = useCallback(async () => {
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);
      
      if (productsResult?.data) {
        setProducts(productsResult.data);
      }
      if (categoriesResult?.data) {
        setCategories(categoriesResult.data);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please check API connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleAddProduct = async () => {
    try {
      const newProduct = await createProduct({
        name: formData.name,
        category_id: Number(formData.category_id),
        price_small: formData.price_small ? Number(formData.price_small) : null,
        price_medium: formData.price_medium ? Number(formData.price_medium) : null,
        price_large: formData.price_large ? Number(formData.price_large) : null,
        sku: formData.sku || null,
        image: formData.image || null,
        is_active: formData.is_active,
      });
      setProducts((prev) => [newProduct, ...prev]);
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      setSuccess("Product created successfully!");
      refreshCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to create product:", err);
      setError("Failed to create product");
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    try {
      const updated = await updateProduct(editingProduct.id, {
        name: formData.name,
        category_id: Number(formData.category_id),
        price_small: formData.price_small ? Number(formData.price_small) : null,
        price_medium: formData.price_medium ? Number(formData.price_medium) : null,
        price_large: formData.price_large ? Number(formData.price_large) : null,
        sku: formData.sku || null,
        image: formData.image || null,
        is_active: formData.is_active,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p))
      );
      setEditingProduct(null);
      setFormData(initialFormData);
      setSuccess("Product updated successfully!");
      refreshCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update product:", err);
      setError("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSuccess("Product deleted successfully!");
      refreshCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError("Failed to delete product");
    }
  };

  const handleToggleAvailability = async (product: ApiProduct) => {
    try {
      const newStatus = !(product.is_available ?? product.is_active);
      const updated = await updateProduct(product.id, {
        is_active: newStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: newStatus, is_active: newStatus } : p
        )
      );
      setSuccess(`Product ${newStatus ? 'available' : 'unavailable'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      setError("Failed to update product availability");
    }
  };

  const openEditDialog = (product: ApiProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: String(product.category_id),
      price_small: String(product.price_small || ""),
      price_medium: String(product.price_medium || ""),
      price_large: String(product.price_large || ""),
      sku: product.sku || "",
      image: product.image || "",
      is_active: product.is_active,
    });
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B2E2B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#4B2E2B]">Products</h1>
          <p className="text-[#7C5D58] mt-1">Manage your coffee shop menu</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-[#4B2E2B] hover:bg-[#3D2624] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="underline">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C5D58]" />
        <Input
          placeholder="Search products by name, category, or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-[#EAD6C0] focus:border-[#4B2E2B] focus:ring-[#4B2E2B]"
        />
      </div>

      {/* Products Table */}
      <Card className="border-[#E5E7EB] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#4B2E2B] text-lg">
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <TableHead className="text-[#4B2E2B] font-semibold">Product</TableHead>
                  <TableHead className="text-[#4B2E2B] font-semibold">Category</TableHead>
                  <TableHead className="text-[#4B2E2B] font-semibold">Price</TableHead>
                  <TableHead className="text-[#4B2E2B] font-semibold">Status</TableHead>
                  <TableHead className="text-right text-[#4B2E2B] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[#7C5D58]">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteProduct}
                      onToggle={handleToggleAvailability}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product for your menu
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="border-[#EAD6C0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="border-[#EAD6C0]">
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
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Small</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_small}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_small: e.target.value }))}
                  className="border-[#EAD6C0]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Medium</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_medium}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_medium: e.target.value }))}
                  className="border-[#EAD6C0]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Large</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_large}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_large: e.target.value }))}
                  className="border-[#EAD6C0]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">SKU</label>
              <Input
                placeholder="Product SKU"
                value={formData.sku}
                onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                className="border-[#EAD6C0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">Image URL</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                className="border-[#EAD6C0]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: !!checked }))}
              />
              <span className="text-sm text-[#4B2E2B]">Active</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              className="bg-[#4B2E2B] hover:bg-[#3D2624] text-white"
              disabled={!formData.name || !formData.category_id}
            >
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="border-[#EAD6C0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="border-[#EAD6C0]">
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
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Small</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_small}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_small: e.target.value }))}
                  className="border-[#EAD6C0]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Medium</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_medium}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_medium: e.target.value }))}
                  className="border-[#EAD6C0]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Large</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_large}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_large: e.target.value }))}
                  className="border-[#EAD6C0]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">SKU</label>
              <Input
                placeholder="Product SKU"
                value={formData.sku}
                onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                className="border-[#EAD6C0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">Image URL</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                className="border-[#EAD6C0]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: !!checked }))}
              />
              <span className="text-sm text-[#4B2E2B]">Active</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleEditProduct}
              className="bg-[#4B2E2B] hover:bg-[#3D2624] text-white"
              disabled={!formData.name || !formData.category_id}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
