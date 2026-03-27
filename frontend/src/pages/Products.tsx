import { useCallback, useEffect, useMemo, useState, memo, useRef } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, Upload, X, Image as ImageIcon, Link } from "lucide-react";
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
} from "../services/api";
import { useCategoryContext } from "../context/CategoryContext";
import { CATEGORY_UPDATE_EVENT } from "../context/CategoryContext";
import { useAutoRefresh } from "../hooks";

// Form interface matching API
interface ProductFormData {
  name: string;
  category_id: string;
  price_small: string;
  price_medium: string;
  price_large: string;
  image: string;
  image_url: string;
  imageFile: File | null;
  is_available: boolean;
  is_popular: boolean;
  // Discount fields
  discount_type: string;
  discount_value: string;
  discount_start_date: string;
  discount_end_date: string;
  discount_active: boolean;
}

const initialFormData: ProductFormData = {
  name: "",
  category_id: "",
  price_small: "",
  price_medium: "",
  price_large: "",
  image: "",
  image_url: "",
  imageFile: null,
  is_available: true,
  is_popular: false,
  discount_type: "",
  discount_value: "",
  discount_start_date: "",
  discount_end_date: "",
  discount_active: false,
};

// Get image URL - handles both local uploads and external URLs
const getImageUrl = (image: string | null | undefined, imageUrl?: string | null): string => {
  if (imageUrl) return imageUrl;
  if (!image) return "";
  // If it's already a full URL, return it
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  // If it's a local storage path, serve from backend `/media/<path>`.
  // In production on Vercel, `/media/*` is proxied via `frontend/vercel.json` to the backend API domain.
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim().replace(/\/+$/, "");
  const base = backendUrl || window.location.origin;
  return `${base}/media/${String(image).replace(/^\/+/, "")}`;
};

// Memoized product row component
const ProductRow = memo(function ProductRow({ 
  product, 
  onEdit, 
  onDelete, 
  onToggle,
  onTogglePopular 
}: { 
  product: ApiProduct; 
  onEdit: (p: ApiProduct) => void; 
  onDelete: (id: number) => void;
  onToggle: (p: ApiProduct) => void;
  onTogglePopular: (p: ApiProduct) => void;
}) {
  const getPrice = () => {
    if (product.price_large) return `${Number(product.price_large).toFixed(2)}`;
    if (product.price_medium) return `${Number(product.price_medium).toFixed(2)}`;
    if (product.price_small) return `${Number(product.price_small).toFixed(2)}`;
    return "$0.00";
  };

  const imageUrl = getImageUrl(product.image, product.image_url);

  return (
    <TableRow className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
      <TableCell className="font-medium text-[#4B2E2B]">
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover"
              loading="lazy"
              onError={(e) => {
                // Hide broken images
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-[#EAD6C0] flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-[#7C5D58]" />
            </div>
          )}
          <div>
            <div className="font-medium">{product.name}</div>
            {product.sku && <div className="text-xs text-[#7C5D58]">SKU: {product.sku}</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-[#6E4F4A]">
        {product.category?.name || product.category_name || "Uncategorized"}
      </TableCell>
      <TableCell className="text-[#6E4F4A]">{getPrice()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={product.is_popular ?? false}
            onCheckedChange={() => onTogglePopular(product)}
            className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-amber-300"
          />
          <span className="text-xs text-[#7C5D58]">
            {product.is_popular ? 'Popular' : 'Add to Popular'}
          </span>
        </div>
      </TableCell>
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories: apiCategories, refreshCategories } = useCategoryContext();

  const previewImage = useMemo(() => {
    if (formData.imageFile) {
      return URL.createObjectURL(formData.imageFile);
    }
    if (formData.image_url) {
      return formData.image_url;
    }
    if (formData.image) {
      return getImageUrl(formData.image);
    }
    return "";
  }, [formData.image, formData.image_url, formData.imageFile]);

  useEffect(() => {
    return () => {
      if (previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const categories = useMemo(() => {
    return apiCategories
      .map((item) => ({ id: item.id, name: item.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apiCategories]);

  // Fetch data with useCallback for performance
  const loadProducts = useCallback(async () => {
    try {
      const productsResult = await fetchProducts(true);
      
      if (productsResult?.data) {
        setProducts(productsResult.data);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please check API connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(loadProducts, { intervalMs: 15000 });

  useEffect(() => {
    const handleCategoryUpdate = () => {
      void loadProducts();
    };

    window.addEventListener(CATEGORY_UPDATE_EVENT, handleCategoryUpdate);
    return () => {
      window.removeEventListener(CATEGORY_UPDATE_EVENT, handleCategoryUpdate);
    };
  }, [loadProducts]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.category?.name?.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setFormData((prev) => ({ ...prev, imageFile: file }));
      } else {
        setError("Please drop an image file (JPEG, PNG, GIF, WebP, SVG)");
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, imageFile: files[0] }));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "", image_url: "", imageFile: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddProduct = async () => {
    // Debug logging
    console.log("Adding product with form data:", formData);
    console.log("Form valid:", !!formData.name, !!formData.category_id);
    
    try {
      const productData: Record<string, unknown> = {
        name: formData.name,
        category_id: Number(formData.category_id),
        price_small: formData.price_small ? Number(formData.price_small) : 0,
        price_medium: formData.price_medium ? Number(formData.price_medium) : 0,
        price_large: formData.price_large ? Number(formData.price_large) : 0,
        is_available: formData.is_available,
        is_popular: formData.is_popular,
        discount_type: formData.discount_type || null,
        discount_value: formData.discount_value ? Number(formData.discount_value) : null,
        discount_start_date: formData.discount_start_date || null,
        discount_end_date: formData.discount_end_date || null,
        discount_active: formData.discount_active,
      };

      // Add image file if uploaded
      if (formData.imageFile) {
        productData.imageFile = formData.imageFile;
      } else if (formData.image_url) {
        productData.image_url = formData.image_url;
      } else if (formData.image) {
        productData.image = formData.image;
      }

      console.log("Sending create request:");
      const newProduct = await createProduct(productData);
      console.log("Create successful:", newProduct);
      setProducts((prev) => [newProduct, ...prev]);
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      setSuccess("Product created successfully!");
      refreshCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to create product:", err);
      setError(err?.message || "Failed to create product. Please check your permissions.");
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    
    // Debug logging
    console.log("Editing product:", editingProduct);
    console.log("Form data:", formData);
    console.log("Form valid:", !!formData.name, !!formData.category_id);
    
    try {
      const productData: Record<string, unknown> = {
        name: formData.name,
        category_id: Number(formData.category_id),
        price_small: formData.price_small ? Number(formData.price_small) : 0,
        price_medium: formData.price_medium ? Number(formData.price_medium) : 0,
        price_large: formData.price_large ? Number(formData.price_large) : 0,
        is_available: formData.is_available,
        is_popular: formData.is_popular,
        discount_type: formData.discount_type || null,
        discount_value: formData.discount_value ? Number(formData.discount_value) : null,
        discount_start_date: formData.discount_start_date || null,
        discount_end_date: formData.discount_end_date || null,
        discount_active: formData.discount_active,
      };

      // Add image file if uploaded
      if (formData.imageFile) {
        productData.imageFile = formData.imageFile;
      } else if (formData.image_url) {
        productData.image_url = formData.image_url;
      } else if (formData.image) {
        productData.image = formData.image;
      }

      console.log("Sending update request for product:", editingProduct.id);
      const updated = await updateProduct(editingProduct.id, productData);
      console.log("Update successful:", updated);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p))
      );
      setEditingProduct(null);
      setFormData(initialFormData);
      setSuccess("Product updated successfully!");
      refreshCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to update product:", err);
      setError(err?.message || "Failed to update product. Please check your permissions.");
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
      setError("Failed to delete product. Please check your permissions.");
    }
  };

  const handleToggleAvailability = async (product: ApiProduct) => {
    try {
      const newStatus = !(product.is_available ?? product.is_active);
      const updated = await updateProduct(product.id, {
        is_available: newStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, ...updated } : p
        )
      );
      setSuccess(`Product ${newStatus ? 'available' : 'unavailable'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      setError("Failed to update product availability");
    }
  };

  const handleTogglePopular = async (product: ApiProduct) => {
    try {
      const newStatus = !(product.is_popular ?? false);
      const updated = await updateProduct(product.id, {
        is_popular: newStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, ...updated } : p
        )
      );
      setSuccess(`Product ${newStatus ? 'marked as popular' : 'removed from popular'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to toggle popular status:", err);
      setError("Failed to update popular status");
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
      image: product.image || "",
      image_url: "",
      imageFile: null,
      is_available: (product.is_available ?? product.is_active) ?? true,
      is_popular: product.is_popular ?? false,
      discount_type: product.discount_type || "",
      discount_value: String(product.discount_value || ""),
      discount_start_date: product.discount_start_date || "",
      discount_end_date: product.discount_end_date || "",
      discount_active: product.discount_active ?? false,
    });
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setImageInputMode('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          placeholder="Search products by name or category..."
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
                  <TableHead className="text-[#4B2E2B] font-semibold">Popular</TableHead>
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
                      onTogglePopular={handleTogglePopular}
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
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Name */}
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

            {/* Category */}
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

            {/* Prices */}
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

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">Product Image</label>
              
              {/* Toggle between upload and URL */}
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={imageInputMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageInputMode('upload')}
                  className={imageInputMode === 'upload' ? 'bg-[#4B2E2B]' : ''}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={imageInputMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageInputMode('url')}
                  className={imageInputMode === 'url' ? 'bg-[#4B2E2B]' : ''}
                >
                  <Link className="h-4 w-4 mr-1" />
                  URL
                </Button>
              </div>

              {imageInputMode === 'upload' ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-[#4B2E2B] bg-[#F1E3D3]' 
                      : 'border-[#EAD6C0] hover:border-[#4B2E2B]'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {previewImage ? (
                    <div className="relative inline-block">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="h-8 w-8 mx-auto text-[#7C5D58] mb-2" />
                      <p className="text-sm text-[#7C5D58]">
                        Drag and drop or click to browse
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                    className="border-[#EAD6C0]"
                  />
                  {previewImage && (
                    <div className="relative inline-block">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_available: !!checked }))}
              />
              <span className="text-sm text-[#4B2E2B]">Active</span>
            </div>

            {/* Discount Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-[#4B2E2B] mb-3">Discount Settings</h4>
              
              {/* Enable Discount */}
              <div className="flex items-center gap-2 mb-3">
                <Switch
                  checked={formData.discount_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, discount_active: !!checked }))}
                />
                <span className="text-sm text-[#4B2E2B]">Enable Discount</span>
              </div>

              {formData.discount_active && (
                <>
                  {/* Discount Type */}
                  <div className="space-y-2 mb-3">
                    <label className="text-sm font-medium text-[#4B2E2B]">Discount Type</label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, discount_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        <SelectItem value="promo">Promo Price ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount Value */}
                  <div className="space-y-2 mb-3">
                    <label className="text-sm font-medium text-[#4B2E2B]">
                      {formData.discount_type === 'percentage' ? 'Discount Percentage' : 
                       formData.discount_type === 'fixed' ? 'Discount Amount ($)' : 'Promo Price ($)'}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                      max={formData.discount_type === 'percentage' ? '100' : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discount_value: e.target.value }))}
                      placeholder={formData.discount_type === 'percentage' ? '10' : '2.50'}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#4B2E2B]">Start Date</label>
                      <Input
                        type="datetime-local"
                        value={formData.discount_start_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discount_start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#4B2E2B]">End Date</label>
                      <Input
                        type="datetime-local"
                        value={formData.discount_end_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discount_end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}
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
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Name */}
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

            {/* Category */}
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

            {/* Prices */}
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

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#4B2E2B]">Product Image</label>
              
              {/* Toggle between upload and URL */}
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={imageInputMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageInputMode('upload')}
                  className={imageInputMode === 'upload' ? 'bg-[#4B2E2B]' : ''}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={imageInputMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageInputMode('url')}
                  className={imageInputMode === 'url' ? 'bg-[#4B2E2B]' : ''}
                >
                  <Link className="h-4 w-4 mr-1" />
                  URL
                </Button>
              </div>

              {imageInputMode === 'upload' ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-[#4B2E2B] bg-[#F1E3D3]' 
                      : 'border-[#EAD6C0] hover:border-[#4B2E2B]'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {previewImage ? (
                    <div className="relative inline-block">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="h-8 w-8 mx-auto text-[#7C5D58] mb-2" />
                      <p className="text-sm text-[#7C5D58]">
                        Drag and drop or click to browse
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                    className="border-[#EAD6C0]"
                  />
                  {previewImage && (
                    <div className="relative inline-block">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_available: !!checked }))}
              />
              <span className="text-sm text-[#4B2E2B]">Active</span>
            </div>

            {/* Discount Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-[#4B2E2B] mb-3">Discount Settings</h4>
              
              {/* Enable Discount */}
              <div className="flex items-center gap-2 mb-3">
                <Switch
                  checked={formData.discount_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, discount_active: !!checked }))}
                />
                <span className="text-sm text-[#4B2E2B]">Enable Discount</span>
              </div>

              {formData.discount_active && (
                <>
                  {/* Discount Type */}
                  <div className="space-y-2 mb-3">
                    <label className="text-sm font-medium text-[#4B2E2B]">Discount Type</label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, discount_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        <SelectItem value="promo">Promo Price ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount Value */}
                  <div className="space-y-2 mb-3">
                    <label className="text-sm font-medium text-[#4B2E2B]">
                      {formData.discount_type === 'percentage' ? 'Discount Percentage' : 
                       formData.discount_type === 'fixed' ? 'Discount Amount ($)' : 'Promo Price ($)'}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                      max={formData.discount_type === 'percentage' ? '100' : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discount_value: e.target.value }))}
                      placeholder={formData.discount_type === 'percentage' ? '10' : '2.50'}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#4B2E2B]">Start Date</label>
                      <Input
                        type="datetime-local"
                        value={formData.discount_start_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discount_start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#4B2E2B]">End Date</label>
                      <Input
                        type="datetime-local"
                        value={formData.discount_end_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discount_end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}
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
