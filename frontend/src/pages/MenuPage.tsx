import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts, fetchCategories, ApiProduct, CategoryApiItem } from "../services/api";

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const tableName = searchParams.get("name");
  
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ]);
        setProducts(productsData.data || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Failed to load menu", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="bg-[#4B2E2B] text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Prey Lang Coffee</h1>
          {tableName && <p className="text-sm mt-1 opacity-90">{decodeURIComponent(tableName)}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-12 text-[#7C5D58]">Loading menu...</div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCategory === null
                    ? "bg-[#4B2E2B] text-white"
                    : "bg-white text-[#4B2E2B] border border-[#EAD6C0]"
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? "bg-[#4B2E2B] text-white"
                      : "bg-white text-[#4B2E2B] border border-[#EAD6C0]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl border border-[#EAD6C0] p-4 shadow-sm">
                  <h3 className="font-bold text-[#4B2E2B] text-lg">{product.name}</h3>
                  <div className="mt-2 space-y-1">
                    {product.price_small > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7C5D58]">Small</span>
                        <span className="font-semibold text-[#4B2E2B]">${product.price_small.toFixed(2)}</span>
                      </div>
                    )}
                    {product.price_medium > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7C5D58]">Medium</span>
                        <span className="font-semibold text-[#4B2E2B]">${product.price_medium.toFixed(2)}</span>
                      </div>
                    )}
                    {product.price_large > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7C5D58]">Large</span>
                        <span className="font-semibold text-[#4B2E2B]">${product.price_large.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
