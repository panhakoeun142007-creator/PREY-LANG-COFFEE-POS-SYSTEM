import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../components/ui/drawer";
import { Switch } from "../components/ui/switch";
import { ApiProduct, Category, fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct, PaginatedResponse } from "../services/api";

// Helper functions
function isValidImageSource(src: string): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/")
  );
}

function parsePrice(value: string | number): number {
  if (typeof value === "number") return isNaN(value) || value < 0 ? 0 : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function formatPrice(price: number | string | null | undefined): string {
  const value = typeof price === "number" ? price : parseFloat(String(price ?? ""));
  return Number.isFinite(value) && value > 0 ? `$${value.toFixed(2)}` : "-";
}

interface ProductFormData {
  name: string;
  category_id: string;
  sku: string;
  image: string;
  priceSmall: string;
  priceMedium: string;
  priceLarge: string;
}

const initialFormData: ProductFormData = {
  name: "",
  category_id: "",
  sku: "",
  image: "",
  priceSmall: "",
  priceMedium: "",
  priceLarge: "",
};

export default function Products() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; category_id?: string }>({});
  
  // Add Product Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit Drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [editFormData, setEditFormData] = useState<ProductFormData>(initialFormData);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [togglingProductIds, setTogglingProductIds] = useState<Set<number>>(new Set());

  // Fetch products and categories on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch products - with proper typing
        let productsData: PaginatedResponse<ApiProduct> = { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
        let categoriesData: PaginatedResponse<Category> = { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
        
        try {
          const productsResult = await fetchProducts({});
          if (isMounted && productsResult) {
            productsData = productsResult;
          }
        } catch (productErr) {
          console.warn('Failed to fetch products:', productErr);
        }
        
        try {
          const categoriesResult = await fetchCategories();
          if (isMounted && categoriesResult) {
            categoriesData = categoriesResult;
          }
        } catch (categoryErr) {
          console.warn('Failed to fetch categories:', categoryErr);
        }
        
        if (!isMounted) return;
        
        // Set products with safe access
        const products = productsData?.data || [];
        setProducts(products);
        
        // Safely filter categories - handle both boolean and integer (0/1) values from API
        const fetchedCategories = categoriesData?.data || [];
        const filteredCategories = fetchedCategories.filter((c: Category) => {
          if (!c) return false;
          const isActive = c.is_active as boolean | number | string;
          return isActive === true || isActive === 1 || isActive === '1' || isActive === 'true';
        });
        
        // If no categories after filter, use all categories
        setCategories(filteredCategories.length > 0 ? filteredCategories : fetchedCategories);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Failed to load data from backend. Please check API and database connection.');
        setCategories([]);
        setProducts([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products - with defensive checks for null/undefined values
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((product) => {
      if (!product || typeof product.name !== 'string') return false;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category_id?.toString() === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle edit file upload
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset file input
  const resetFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      ref.current.value = "";
    }
  };

  // Create product
  const handleCreateProduct = async () => {
    // Clear previous states
    setError(null);
    setSuccess(null);
    setFormErrors({});

    // Validate form
    const errors: { name?: string; category_id?: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }
    if (categories.length === 0) {
      setError('No categories available from database. Create categories first, then add products.');
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const newProduct = await createProduct({
        category_id: parseInt(formData.category_id),
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        price_small: parsePrice(formData.priceSmall),
        price_medium: parsePrice(formData.priceMedium),
        price_large: parsePrice(formData.priceLarge),
        image: formData.image,
        is_available: true,
      });

      setProducts((prev) => [newProduct, ...prev]);
      setFormData(initialFormData);
      resetFileInput(fileInputRef);
      setIsAddDialogOpen(false);
      setSuccess('Product created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      console.error('Error creating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit drawer
  const handleEditClick = (product: ApiProduct) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      category_id: product.category_id.toString(),
      sku: product.sku || "",
      image: product.image || "",
      priceSmall: parsePrice(product.price_small).toString(),
      priceMedium: parsePrice(product.price_medium).toString(),
      priceLarge: parsePrice(product.price_large).toString(),
    });
    setIsEditDrawerOpen(true);
  };

  // Save edited product
  const handleSaveEdit = async () => {
    if (!editingProduct || !editFormData.name.trim()) return;

    try {
      setIsEditSubmitting(true);
      const updated = await updateProduct(editingProduct.id, {
        category_id: parseInt(editFormData.category_id),
        name: editFormData.name.trim(),
        sku: editFormData.sku.trim() || undefined,
        price_small: parsePrice(editFormData.priceSmall),
        price_medium: parsePrice(editFormData.priceMedium),
        price_large: parsePrice(editFormData.priceLarge),
        image: editFormData.image,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updated : p))
      );
      setIsEditDrawerOpen(false);
      setEditingProduct(null);
      setSuccess('Product updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      console.error('Error updating product:', err);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      setTogglingProductIds((prev) => new Set(prev).add(productId));
      const updated = await updateProduct(productId, {
        is_available: !product.is_available,
      });
      
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available: updated.is_available } : p))
      );
      setSuccess(`Product ${updated.is_available ? 'available' : 'unavailable'} successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability');
      console.error('Error toggling availability:', err);
    } finally {
      setTogglingProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  // Delete product
  const handleDelete = async (productId: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSuccess('Product deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      console.error('Error deleting product:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#4B2E2B]" />
          <p className="text-[#7C5D58]">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-4 md:p-6 animate-fade-in">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4B2E2B]">Products</h1>
        <p className="text-[#7C5D58] mt-1">Manage your coffee shop menu</p>
      </div>

      {/* Top Actions Card */}
      <Card className="mb-6 border-[#EAD6C0] shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C5D58]" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#EAD6C0] focus:ring-[#4B2E2B] focus:border-[#4B2E2B]"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px] border-[#EAD6C0]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Product Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#4B2E2B] hover:bg-[#5B3E3B] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-[#4B2E2B]">Add New Product</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new product to your menu.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4B2E2B]">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, name: e.target.value }));
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`border-[#EAD6C0] ${formErrors.name ? 'border-red-500' : ''}`}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4B2E2B]">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, category_id: value }));
                        if (formErrors.category_id) setFormErrors((prev) => ({ ...prev, category_id: undefined }));
                      }}
                    >
                      <SelectTrigger className={`border-[#EAD6C0] ${formErrors.category_id ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category_id && (
                      <p className="text-sm text-red-500">{formErrors.category_id}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4B2E2B]">
                      SKU <span className="text-gray-400">(optional - auto-generated if empty)</span>
                    </label>
                    <Input
                      placeholder="e.g., CAP-001"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sku: e.target.value }))
                      }
                      className="border-[#EAD6C0]"
                    />
                  </div>

                  {/* Image Upload and URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4B2E2B]">Image</label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-[#EAD6C0]"
                      >
                        Upload
                      </Button>
                      <Input
                        placeholder="Or enter image URL"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, image: e.target.value }))
                        }
                        className="border-[#EAD6C0] flex-1"
                      />
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#4B2E2B]">Preview</label>
                    <div className="h-32 w-full border-2 border-dashed border-[#EAD6C0] rounded-lg flex items-center justify-center bg-[#FDF8F3]">
                      {isValidImageSource(formData.image) ? (
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center text-[#7C5D58]">
                          <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                          <span className="text-sm">Enter URL or upload image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#4B2E2B]">Small</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.priceSmall}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, priceSmall: e.target.value }))
                        }
                        className="border-[#EAD6C0]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#4B2E2B]">Medium</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.priceMedium}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, priceMedium: e.target.value }))
                        }
                        className="border-[#EAD6C0]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#4B2E2B]">Large</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.priceLarge}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, priceLarge: e.target.value }))
                        }
                        className="border-[#EAD6C0]"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-[#EAD6C0]"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProduct}
                    disabled={isSubmitting}
                    className="bg-[#4B2E2B] hover:bg-[#5B3E3B]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Product'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Products Table Card */}
      <Card className="border-[#E5E7EB] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#4B2E2B] text-lg">
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  <TableHead className="text-[#111827] font-semibold">Image</TableHead>
                  <TableHead className="text-[#111827] font-semibold">Name</TableHead>
                  <TableHead className="text-[#111827] font-semibold">Category</TableHead>
                  <TableHead className="text-[#111827] font-semibold">Small</TableHead>
                  <TableHead className="text-[#111827] font-semibold">Medium</TableHead>
                  <TableHead className="text-[#111827] font-semibold">Large</TableHead>
                  <TableHead className="text-[#111827] font-semibold">Available</TableHead>
                  <TableHead className="text-[#111827] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <TableCell className="py-3">
                      {isValidImageSource(product.image || "") ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-[#9CA3AF]" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-[#111827]">{product.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5E6D3] text-[#8A5A2D]">
                        {product.category?.name || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#111827]">{formatPrice(product.price_small)}</TableCell>
                    <TableCell className="text-[#111827]">{formatPrice(product.price_medium)}</TableCell>
                    <TableCell className="text-[#111827]">{formatPrice(product.price_large)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_available ?? true}
                        onCheckedChange={() => handleToggleAvailability(product.id)}
                        disabled={togglingProductIds.has(product.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(product)}
                          className="h-9 w-9 border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="h-9 w-9 border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg border border-[#EAD6C0] p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {isValidImageSource(product.image || "") ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-[#F5E6D3] flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-[#7C5D58]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[#4B2E2B]">{product.name}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5E6D3] text-[#4B2E2B] mt-1">
                          {product.category?.name || 'N/A'}
                        </span>
                      </div>
                      <Switch
                        checked={product.is_available ?? true}
                        onCheckedChange={() => handleToggleAvailability(product.id)}
                        disabled={togglingProductIds.has(product.id)}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-[#7C5D58]">Small:</span>
                        <span className="ml-1 text-[#4B2E2B]">{formatPrice(product.price_small)}</span>
                      </div>
                      <div>
                        <span className="text-[#7C5D58]">Medium:</span>
                        <span className="ml-1 text-[#4B2E2B]">{formatPrice(product.price_medium)}</span>
                      </div>
                      <div>
                        <span className="text-[#7C5D58]">Large:</span>
                        <span className="ml-1 text-[#4B2E2B]">{formatPrice(product.price_large)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(product)}
                        className="flex-1 border-[#EAD6C0] text-[#4B2E2B]"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="text-[#4B2E2B]">Edit Product</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Product Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">
                Product Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter product name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="border-[#EAD6C0]"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={editFormData.category_id}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, category_id: value }))
                }
              >
                <SelectTrigger className="border-[#EAD6C0]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">
                SKU <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                placeholder="e.g., CAP-001"
                value={editFormData.sku}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                className="border-[#EAD6C0]"
              />
            </div>

            {/* Image Upload and URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">Image</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileChange}
                  ref={editFileInputRef}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-[#EAD6C0]"
                >
                  Upload
                </Button>
                <Input
                  placeholder="Or enter image URL"
                  value={editFormData.image}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, image: e.target.value }))
                  }
                  className="border-[#EAD6C0] flex-1"
                />
              </div>
            </div>

            {/* Image Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">Preview</label>
              <div className="h-32 w-full border-2 border-dashed border-[#EAD6C0] rounded-lg flex items-center justify-center bg-[#FDF8F3]">
                {isValidImageSource(editFormData.image) ? (
                  <img
                    src={editFormData.image}
                    alt="Preview"
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-[#7C5D58]">
                    <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    <span className="text-sm">Enter URL or upload image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Small</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editFormData.priceSmall}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, priceSmall: e.target.value }))
                  }
                  className="border-[#EAD6C0]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Medium</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editFormData.priceMedium}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, priceMedium: e.target.value }))
                  }
                  className="border-[#EAD6C0]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4B2E2B]">Large</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editFormData.priceLarge}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, priceLarge: e.target.value }))
                  }
                  className="border-[#EAD6C0]"
                />
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDrawerOpen(false)}
              className="border-[#EAD6C0]"
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isEditSubmitting}
              className="bg-[#4B2E2B] hover:bg-[#5B3E3B]"
            >
              {isEditSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
