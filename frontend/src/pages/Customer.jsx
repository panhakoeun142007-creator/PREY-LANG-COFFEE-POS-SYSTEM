import { useState, useEffect, useMemo } from "react";
import image from "../img/image.png";
import {
  FaShoppingCart,
  FaCoffee,
  FaLeaf,
  FaGlassWhiskey,
  FaBreadSlice,
  FaMoon,
  FaSun,
  FaUtensils,
} from "react-icons/fa";

const API_BASE = (() => {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  return raw || "http://127.0.0.1:8000";
})();

// Map category name → icon
const CATEGORY_ICONS = {
  coffee: FaCoffee,
  tea: FaLeaf,
  smoothies: FaGlassWhiskey,
  smoothie: FaGlassWhiskey,
  pastries: FaBreadSlice,
  pastry: FaBreadSlice,
};

function getCategoryIcon(name = "") {
  const key = name.trim().toLowerCase();
  return CATEGORY_ICONS[key] ?? FaUtensils;
}

function normalizeImage(url) {
  if (!url || typeof url !== "string" || url.trim() === "") return null;
  const v = url.trim();
  if (/^(https?:\/\/|data:|blob:)/i.test(v)) return v;
  return `${API_BASE}${v.startsWith("/") ? v : `/${v}`}`;
}

export function getPriceForSize(product, size) {
  const s = (size ?? "M").toUpperCase();
  const small = parseFloat(product.price_small ?? product.price ?? 0);
  const medium = parseFloat(product.price_medium ?? product.price ?? 0);
  const large = parseFloat(product.price_large ?? product.price ?? 0);
  if (s === "S") return Number.isFinite(small) ? small : 0;
  if (s === "L") return Number.isFinite(large) ? large : 0;
  return Number.isFinite(medium) ? medium : 0;
}

function Customer({ cartItems = [], onAddToCart, onCartClick, theme = "light", onToggleTheme }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({});

  // Fetch categories from admin API
  useEffect(() => {
    fetch(`${API_BASE}/api/customer/categories`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setCategories(list.filter((c) => c.is_active !== false));
      })
      .catch(() => setCategories([]));
  }, []);

  // Fetch products from admin API
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`${API_BASE}/api/customer/products`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setProducts(
          list
            .filter((p) => p.is_available !== false)
            .map((p) => ({ ...p, image: normalizeImage(p.image) }))
        );
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const getProductKey = (p) => `${p.id}-${p.name}`;

  const handleSizeClick = (product, size) => {
    setSelectedSizes((prev) => ({ ...prev, [getProductKey(product)]: size }));
  };

  const handleAddToCart = (product) => {
    const productKey = getProductKey(product);
    const selectedSize = selectedSizes[productKey] ?? "M";
    onAddToCart?.({ product, selectedSize, productKey });
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const allCategory = { id: "all", name: "All", is_active: true };
  const displayCategories = [allCategory, ...categories];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((p) => {
      const catMatch =
        selectedCategory === "all" ||
        String(p.category_id) === String(selectedCategory) ||
        p.category?.id === selectedCategory;
      if (!catMatch) return false;
      if (!query) return true;
      return (
        (p.name ?? "").toLowerCase().includes(query) ||
        (p.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [products, selectedCategory, search]);

  return (
    <div className="container">
      <div className="sticky-header">
        <div className="navbar">
          <div className="logo-section">
            <img src={image} alt="Prey Lang Coffee Logo" />
            <h3>Prey Lang Coffee</h3>
          </div>
          <div className="navbar-actions">
            <button
              className="theme-icon-btn"
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>
            <div
              className="cart-icon"
              onClick={onCartClick}
              onKeyDown={(e) => e.key === "Enter" && onCartClick?.()}
              role="button"
              tabIndex={0}
            >
              <FaShoppingCart />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </div>
          </div>
        </div>

        <h2>Coffee your Selection</h2>

        <input
          type="text"
          placeholder="Search for your favorite brew..."
          className="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="categories">
          {displayCategories.map((cat) => {
            const Icon = cat.id === "all" ? null : getCategoryIcon(cat.name);
            return (
              <button
                key={cat.id}
                className={`category-type ${selectedCategory === String(cat.id) ? "active" : ""}`}
                onClick={() => setSelectedCategory(String(cat.id))}
                aria-pressed={selectedCategory === String(cat.id)}
              >
                {Icon && <Icon className="category-icon" />}
                <span className="category-label">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          Loading menu...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          No products found.
        </div>
      ) : (
        <div className="menu">
          {filtered.map((item) => {
            const itemKey = getProductKey(item);
            const size = selectedSizes[itemKey] ?? "M";
            const price = getPriceForSize(item, size);
            return (
              <div className="card" key={itemKey}>
                <div className="image-container">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "2rem" }}>
                      ☕
                    </div>
                  )}
                  {item.category?.name && (
                    <span className="badge">{item.category.name.toUpperCase()}</span>
                  )}
                </div>
                <div className="card-body">
                  <h3>{item.name}</h3>
                  <div className="sizes">
                    {["S", "M", "L"].map((s) => (
                      <span
                        key={s}
                        className={size === s ? "size active-size" : "size"}
                        onClick={() => handleSizeClick(item, s)}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="price-row">
                    <span className="price">${price.toFixed(2)}</span>
                    <button
                      className="add-btn"
                      onClick={() => handleAddToCart(item)}
                      aria-label={`Add ${item.name} to cart`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Customer;
