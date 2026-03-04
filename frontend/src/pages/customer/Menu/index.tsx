import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CustomerMenuCategory,
  CustomerMenuProduct,
  CustomerTableInfo,
  fetchCustomerMenuProducts,
  fetchCustomerTableByToken,
} from "../../../services/api";

type ProductSize = "small" | "medium" | "large";

type CustomerCartItem = {
  product_id: number;
  name: string;
  image: string | null;
  size: ProductSize;
  qty: number;
  unit_price: number;
};

type SelectedProductState = {
  product: CustomerMenuProduct;
  size: ProductSize;
  qty: number;
};

function getCartStorageKey(token: string): string {
  return `customer_cart_${token}`;
}

function getUnitPrice(product: CustomerMenuProduct, size: ProductSize): number {
  if (size === "small") return Number(product.price_small);
  if (size === "medium") return Number(product.price_medium);
  return Number(product.price_large);
}

export default function CustomerMenu() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";

  const [tableInfo, setTableInfo] = useState<CustomerTableInfo | null>(null);
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProductState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing table token");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function load(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);

        const [table, groupedProducts] = await Promise.all([
          fetchCustomerTableByToken(token),
          fetchCustomerMenuProducts(),
        ]);

        if (!isMounted) return;

        setTableInfo(table);
        setCategories(groupedProducts);
        setActiveCategoryId(groupedProducts[0]?.id ?? null);

        const stored = sessionStorage.getItem(getCartStorageKey(token));
        if (stored) {
          setCart(JSON.parse(stored) as CustomerCartItem[]);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.unit_price, 0),
    [cart],
  );

  const visibleCategory = useMemo(() => {
    if (!categories.length) return null;
    return (
      categories.find((category) => category.id === activeCategoryId) ??
      categories[0]
    );
  }, [activeCategoryId, categories]);

  const featuredProduct = useMemo(
    () => categories.flatMap((group) => group.products)[0] ?? null,
    [categories],
  );

  function saveCart(nextCart: CustomerCartItem[]): void {
    setCart(nextCart);
    if (token) {
      sessionStorage.setItem(
        getCartStorageKey(token),
        JSON.stringify(nextCart),
      );
    }
  }

  function addToCart(product: CustomerMenuProduct, size: ProductSize): void {
    const unitPrice = getUnitPrice(product, size);

    const next = [...cart];
    const found = next.find(
      (item) => item.product_id === product.id && item.size === size,
    );

    if (found) {
      found.qty += 1;
    } else {
      next.push({
        product_id: product.id,
        name: product.name,
        image: product.image,
        size,
        qty: 1,
        unit_price: unitPrice,
      });
    }

    saveCart(next);
  }

  function openProductSheet(product: CustomerMenuProduct): void {
    setSelectedProduct({
      product,
      size: "medium",
      qty: 1,
    });
  }

  function closeProductSheet(): void {
    setSelectedProduct(null);
  }

  function setSheetSize(size: ProductSize): void {
    setSelectedProduct((prev) => (prev ? { ...prev, size } : prev));
  }

  function changeSheetQty(delta: number): void {
    setSelectedProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        qty: Math.max(1, prev.qty + delta),
      };
    });
  }

  function confirmAddToCart(): void {
    if (!selectedProduct) return;

    for (let count = 0; count < selectedProduct.qty; count += 1) {
      addToCart(selectedProduct.product, selectedProduct.size);
    }

    closeProductSheet();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4 text-[#4B2E2B]">
        Loading menu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F0EC] text-[#1F1A16]">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Prey Lang Coffee</h1>
          <p className="mt-1 text-sm text-[#7E756C]">
            📍 {tableInfo?.name ?? "Table"}
          </p>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const isActive = category.id === (visibleCategory?.id ?? null);
            return (
              <button
                key={category.id}
                type="button"
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  isActive
                    ? "border-[#1F1A16] bg-[#1F1A16] text-white"
                    : "border-[#E4DDD5] bg-white text-[#5F554C]"
                }`}
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {featuredProduct ? (
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#A64B0A] to-[#E88D35] px-4 py-5 text-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              Today's Special
            </p>
            <p className="mt-1 text-2xl font-bold">{featuredProduct.name}</p>
            <p className="text-sm text-white/90">
              Creamy & refreshing — from $
              {Number(featuredProduct.price_small).toFixed(2)}
            </p>
          </div>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-xl font-bold">
            ⭐ {visibleCategory?.name ?? "Popular"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(visibleCategory?.products ?? []).map((product) => (
              <button
                key={product.id}
                type="button"
                className="rounded-2xl border border-[#E7E1DA] bg-white p-3 text-left shadow-sm"
                onClick={() => openProductSheet(product)}
              >
                <div className="mb-2 h-10 w-10 overflow-hidden rounded-full bg-[#F2E9E1]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">
                      ☕
                    </div>
                  )}
                </div>
                <p className="line-clamp-1 text-lg font-bold">{product.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[#8A7D70]">
                  Smooth coffee crafted with premium ingredients.
                </p>
                <p className="mt-2 text-xl font-bold text-[#D56B12]">
                  from ${Number(product.price_small).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E4DDD5] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#7E756C]">{cartCount} items</p>
            <p className="text-xl font-bold">${cartTotal.toFixed(2)}</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-[#1F1A16] px-5 py-3 text-sm font-semibold text-white"
            onClick={() =>
              navigate(`/menu/cart?token=${encodeURIComponent(token)}`)
            }
          >
            View Cart
          </button>
        </div>
      </div>

      {selectedProduct ? (
        <div className="fixed inset-0 z-40 bg-black/40">
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-[#F2E9E1]">
                  {selectedProduct.product.image ? (
                    <img
                      src={selectedProduct.product.image}
                      alt={selectedProduct.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">
                      ☕
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {selectedProduct.product.name}
                  </p>
                  <p className="text-sm text-[#7E756C]">
                    Smooth espresso with steamed milk
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="h-8 w-8 rounded-full bg-[#F3F0EC] text-lg text-[#7E756C]"
                onClick={closeProductSheet}
              >
                ×
              </button>
            </div>

            <p className="mb-2 text-sm font-semibold">Choose Size</p>
            <div className="grid grid-cols-3 gap-2">
              {(["small", "medium", "large"] as ProductSize[]).map((size) => {
                const active = selectedProduct.size === size;
                const price = getUnitPrice(selectedProduct.product, size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSheetSize(size)}
                    className={`rounded-xl border px-2 py-3 text-center ${
                      active
                        ? "border-[#1F1A16] bg-white ring-1 ring-[#1F1A16]"
                        : "border-[#E4DDD5] bg-[#FCFBF9]"
                    }`}
                  >
                    <p className="text-lg font-bold uppercase text-[#6F6459]">
                      {size[0]}
                    </p>
                    <p className="text-xs text-[#8A7D70]">{size}</p>
                    <p className="text-lg font-bold text-[#D56B12]">
                      ${price.toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-[#F3F0EC] px-3 py-2">
                <button
                  type="button"
                  className="h-7 w-7 rounded-md bg-white text-lg"
                  onClick={() => changeSheetQty(-1)}
                >
                  -
                </button>
                <span className="w-6 text-center font-bold">
                  {selectedProduct.qty}
                </span>
                <button
                  type="button"
                  className="h-7 w-7 rounded-md bg-[#1F1A16] text-lg text-white"
                  onClick={() => changeSheetQty(1)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="flex-1 rounded-xl bg-[#1F1A16] px-4 py-3 text-sm font-semibold text-white"
                onClick={confirmAddToCart}
              >
                Add to Cart — $
                {(
                  getUnitPrice(selectedProduct.product, selectedProduct.size) *
                  selectedProduct.qty
                ).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
