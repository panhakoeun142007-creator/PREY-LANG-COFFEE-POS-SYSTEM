import { useCallback, useEffect, useState } from 'react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductPopular,
  ApiProduct,
} from '../services/api';

/**
 * Hook for managing products.
 */
export function useProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchProducts();
      setProducts(result.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const create = useCallback(async (data: Record<string, unknown>) => {
    try {
      setError(null);
      const newProduct = await createProduct(data);
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      setError(message);
      throw err;
    }
  }, []);

  const update = useCallback(async (id: number, data: Record<string, unknown>) => {
    try {
      setError(null);
      const updated = await updateProduct(id, data);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      setError(message);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      setError(null);
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      setError(message);
      throw err;
    }
  }, []);

  const toggleAvailability = useCallback(async (product: ApiProduct) => {
    const newStatus = !(product.is_available ?? product.is_active);
    return update(product.id, { is_available: newStatus });
  }, [update]);

  const togglePopular = useCallback(async (product: ApiProduct) => {
    try {
      setError(null);
      const newStatus = !(product.is_popular ?? false);
      const updated = await toggleProductPopular(product.id, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ...updated } : p))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle popular status';
      setError(message);
      throw err;
    }
  }, []);

  return {
    products,
    loading,
    error,
    refresh: loadProducts,
    create,
    update,
    remove,
    toggleAvailability,
    togglePopular,
  };
}
