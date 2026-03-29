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
  FaMapMarkerAlt,
} from "react-icons/fa";
import { fetchCustomerCategories, fetchCustomerProducts, fetchCustomerPopularProducts } from "../services/api";
import { useI18n } from "../context/I18nContext";
import { getPriceForSize } from "../utils/pricing";

const ASSET_BASE = (() => {
  const backend = (import.meta.env.VITE_BACKEND_URL ?? "").trim().replace(/\/+$/, "");
  if (backend) return backend;
  if (typeof window !== "undefined" && window.location?.origin) {
    return String(window.location.origin).replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
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

function normalizeImage(imageUrl, imagePath) {
  const source = typeof imageUrl === "string" && imageUrl.trim() !== ""
    ? imageUrl
    : imagePath;
  if (!source || typeof source !== "string" || source.trim() === "") return null;
  const v = source.trim();
  if (/^(https?:\/\/|data:|blob:)/i.test(v)) return v;
  // Prefer same-origin `/media/*` so Vercel can proxy images without CORS issues.
  if (v.startsWith("/media/")) return v;

  // If the API gives a plain storage path like "profile-images/..", serve it from `/media/<path>`.
  if (!v.startsWith("/")) {
    return `/media/${v.replace(/^\/+/, "")}`;
  }

  // Otherwise use the configured backend/current origin as a base for absolute paths.
  return `${ASSET_BASE}${v}`;
}

function Customer({ cartItems = [], onAddToCart, onCartClick, theme = "light", onToggleTheme }) {
  const { lang, setLang, t } = useI18n();
  // Guard: only allow expected values in DOM select
  const safeLang = lang === "km" ? "km" : "en";
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({});
  const [activePopularIndex, setActivePopularIndex] = useState(0);

  // Fetch categories from admin API
  useEffect(() => {
    fetchCustomerCategories()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setCategories(list.filter((c) => c.is_active !== false));
      })
      .catch(() => setCategories([]));
  }, []);

  // Fetch products from admin API
  useEffect(() => {
    const controller = new AbortController();
    fetchCustomerProducts()
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        if (controller.signal.aborted) return;
        setProducts(
          list
            .filter((p) => p.is_available !== false)
            .map((p) => ({
              ...p,
              image: normalizeImage(p.image_url, p.image),
            }))
        );
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Fetch popular products from API
  useEffect(() => {
    fetchCustomerPopularProducts()
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : [];
        setPopularProducts(
          list
            .filter((p) => p.is_available !== false)
            .map((p) => ({
              ...p,
              image: normalizeImage(p.image_url, p.image),
            }))
        );
      })
      .catch(() => setPopularProducts([]));
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

  const createPopularProductSeed = (popularProduct) => ({
    ...popularProduct,
    category: popularProduct.category || { name: "Popular" },
  });

const handleAddPopularProduct = (popularProduct) => {
  const seedProduct = createPopularProductSeed(popularProduct);
  const productKey = getProductKey(popularProduct);
  const selectedSize = "M";
  onAddToCart({product: seedProduct, selectedSize, productKey});
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
        String(p.category?.id) === String(selectedCategory);
      if (!catMatch) return false;
      if (!query) return true;
      return (
        (p.name ?? "").toLowerCase().includes(query) ||
        (p.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [products, selectedCategory, search]);

  useEffect(() => {
    if (popularProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActivePopularIndex((prev) => prev + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [popularProducts.length]);

  const effectivePopularIndex = popularProducts.length
    ? activePopularIndex % popularProducts.length
    : 0;

  return (
    <div className="container">
      <div className="">
        <div className="sticky-header">
          {/* HEADER SECTION - location at top, icons properly aligned */}
          <div className="header-with-location">
            <div className="location-text">
              <FaMapMarkerAlt className="location-icon" />
              <span>{t("customer.location")}</span>
            </div>
            <div className="header-icons">
              <select
                className="header-language"
                aria-label={t("nav.language")}
                value={safeLang}
                onChange={(e) => setLang(e.target.value === "km" ? "km" : "en")}
              >
                <option value="en">{t("lang.english")}</option>
                <option value="km">{t("lang.khmer")}</option>
              </select>
              <button
                className="header-icon-btn"
                onClick={onToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <FaSun /> : <FaMoon />}
              </button>
              <button
                type="button"
                className="cart-icon-mini cart-icon-mini-btn"
                onClick={onCartClick}
                aria-label="Open cart"
                style={{ position: "relative", cursor: "pointer" }}
              >
                <FaShoppingCart style={{ fontSize: "0.9rem" }} />
                {cartCount > 0 && <span className="cart-count-mini">{cartCount}</span>}

              </button>
            </div>
          </div>

          <div className="navbar">
            <div className="logo-section">
              <img src={image} alt="Prey Lang Coffee Logo" />
              <h3>Prey Lang Coffee</h3>
            </div>
          </div>

          <h2>{t("customer.pick_heading")}</h2>

          <input
            type="text"
            placeholder={t("customer.search_placeholder")}
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

        <section className="popular-products-section" aria-label={t("customer.popular_products")}>
          <h3>{t("customer.popular_products")}</h3>
          <div className="popular-products-grid">
            {(popularProducts.length > 0 ? popularProducts : []).map((product, index) => (
              <article
                key={product.id}
                className={`popular-products-card ${index === effectivePopularIndex ? "active" : ""}`}
              >
                <div className="popular-products-media">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  {product.has_discount && (
                    <span className="popular-products-badge" style={{ background: '#10b981' }}>SALE</span>
                  )}
                  {!product.has_discount && (
                    <span className="popular-products-badge">Popular choice</span>
                  )}
                </div>
                <div className="popular-products-copy">
                  <h4>{product.name}</h4>
                  <p>{product.description || product.category?.name || ''}</p>
                </div>
                <div className="popular-products-footer">
                  {product.has_discount && (
                    <span className="popular-products-price-original">
                      ${Number(product.price_medium || product.price_small || product.price_large || 0).toFixed(2)}
                    </span>
                  )}
                  <span className="popular-products-price">
                    {product.has_discount && product.discounted_price_medium
                      ? `${Number(product.discounted_price_medium).toFixed(2)}`
                      : `${Number(product.price_medium || product.price_small || product.price_large || 0).toFixed(2)}`}
                  </span>
                  <button
                    className="popular-products-btn"
                    type="button"
                    onClick={() => handleAddPopularProduct(product)}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
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
                  {item.has_discount && (
                    <span className="badge" style={{ background: '#10b981' }}>SALE</span>
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
                    {item.has_discount && (
                      <span className="price-original">
                        ${Number(item.price_medium || item.price_small || item.price_large || 0).toFixed(2)}
                      </span>
                    )}
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
