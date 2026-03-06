import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory, Category } from '../services/api';

// Category update event for cross-component communication
export const CATEGORY_UPDATE_EVENT = 'category-update';

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  addCategory: (data: { name: string; description?: string; quantity?: number; is_active?: boolean }) => Promise<Category>;
  // eslint-disable-next-line no-unused-vars
  editCategory: (id: number, data: { name?: string; description?: string; quantity?: number; is_active?: boolean }) => Promise<Category>;
  // eslint-disable-next-line no-unused-vars
  removeCategory: (id: number) => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (data: { name: string; description?: string; quantity?: number; is_active?: boolean }) => {
    const newCategory = await createCategory(data);
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent(CATEGORY_UPDATE_EVENT, { detail: { action: 'create', category: newCategory } }));
    await refreshCategories();
    return newCategory;
  }, [refreshCategories]);

  const editCategory = useCallback(async (id: number, data: { name?: string; description?: string; quantity?: number; is_active?: boolean }) => {
    const updated = await updateCategory(id, data);
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent(CATEGORY_UPDATE_EVENT, { detail: { action: 'update', category: updated } }));
    await refreshCategories();
    return updated;
  }, [refreshCategories]);

  const removeCategory = useCallback(async (id: number) => {
    await deleteCategory(id);
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent(CATEGORY_UPDATE_EVENT, { detail: { action: 'delete', categoryId: id } }));
    await refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        refreshCategories,
        addCategory,
        editCategory,
        removeCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCategoryContext() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
}

// Hook for components that need to listen for category updates
// eslint-disable-next-line react-refresh/only-export-components
export function useCategoryListener(onUpdate: () => void) {
  useEffect(() => {
    const handleUpdate = () => {
      onUpdate();
    };
    
    window.addEventListener(CATEGORY_UPDATE_EVENT, handleUpdate);
    
    return () => {
      window.removeEventListener(CATEGORY_UPDATE_EVENT, handleUpdate);
    };
  }, [onUpdate]);
}
