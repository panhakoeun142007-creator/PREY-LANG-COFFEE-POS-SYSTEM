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
  FaBars,
} from "react-icons/fa";
import { fetchCustomerCategories, fetchCustomerProducts, fetchCustomerPopularProducts } from "../services/api";

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

function normalizeImage(imageUrl, imagePath) {
  const source = typeof imageUrl === "string" && imageUrl.trim() !== ""
    ? imageUrl
    : imagePath;
  if (!source || typeof source !== "string" || source.trim() === "") return null;
  const v = source.trim();
  if (/^(https?:\/\/|data:|blob:)/i.test(v)) return v;
  return `${API_BASE}${v.startsWith("/") ? v : `/${v}`}`;
}

export function getPriceForSize(product, size) {
  const s = (size ?? "M").toUpperCase();

  // Check if product has discounted prices (from API)
  if (product.has_discount) {
    const discountedSmall = parseFloat(product.discounted_price_small ?? 0);
    const discountedMedium = parseFloat(product.discounted_price_medium ?? 0);
    const discountedLarge = parseFloat(product.discounted_price_large ?? 0);
    if (s === "S") return Number.isFinite(discountedSmall) ? discountedSmall : 0;
    if (s === "L") return Number.isFinite(discountedLarge) ? discountedLarge : 0;
    return Number.isFinite(discountedMedium) ? discountedMedium : 0;
  }
  
  // Fall back to regular prices
  const small = parseFloat(product.price_small ?? product.price ?? 0);
  const medium = parseFloat(product.price_medium ?? product.price ?? 0);
  const large = parseFloat(product.price_large ?? product.price ?? 0);
  if (s === "S") return Number.isFinite(small) ? small : 0;
  if (s === "L") return Number.isFinite(large) ? large : 0;
  return Number.isFinite(medium) ? medium : 0;
}

// Milk add-on prices
const MILK_PRICES = { "Oat Milk": 0.75, "Almond": 0.50 };

// Extras add-on prices
const EXTRA_PRICES = { extraShot: 1.25, whippedCream: 0.50, cinnamonSprinkles: 0.25 };

// Full unit price including size base + milk add-on + extras add-ons
export function getItemUnitPrice(item) {
  const base = getPriceForSize(item, item.selectedSize);
  const milk = MILK_PRICES[item.milkOption] ?? 0;
  const extras = item.extras
    ? Object.entries(item.extras).reduce(
      (sum, [key, on]) => sum + (on ? (EXTRA_PRICES[key] ?? 0) : 0),
      0
    )
    : 0;
  return base + milk + extras;
}

>>>>>>> 6c58a2c2fc13cbf4e07f44b53624e5996ce61a47
=======

=======


=======
>>>>>>> 6c58a2c2fc13cbf4e07f44b53624e5996ce61a47
function Customer({ cartItems = [], onAddToCart, onCartClick, theme = "light", onToggleTheme }) {
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
    id: popularProduct.id,
    name: popularProduct.name,
    image: popularProduct.image,
    price_small: popularProduct.price_small,
    price_medium: popularProduct.price_medium,
    price_large: popularProduct.price_large,
    category: popularProduct.category || { name: "Popular" },
  });

  const handleAddPopularProduct = (popularProduct) => {
    handleAddToCart(createPopularProductSeed(popularProduct));
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePopularIndex((prev) => (prev + 1) % (popularProducts.length || 1));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="">
        <div className="sticky-header">
          {/* HEADER SECTION - location at top, icons properly aligned */}
          <div className="header-with-location">
            <div className="location-text">
              <FaMapMarkerAlt className="location-icon" />
              <span>Prey Lang Coffee - Phnom Penh</span>
            </div>
            <div className="header-icons">
              <button className="header-icon-btn" aria-label="Menu">
                <FaBars />
              </button>
              <button
                className="header-icon-btn"
                onClick={onToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <FaSun /> : <FaMoon />}
              </button>
              <div
                className="cart-icon-mini"
                onClick={onCartClick}
                onKeyDown={(e) => e.key === "Enter" && onCartClick?.()}
                role="button"
                tabIndex={0}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <FaShoppingCart style={{ fontSize: '0.9rem' }} />
                {cartCount > 0 && <span className="cart-count-mini">{cartCount}</span>}
              </div>
            </div>
          </div>
          
          <div className="navbar">
            <div className="logo-section">
              <img src={image} alt="Prey Lang Coffee Logo" />
              <h3>Prey Lang Coffee</h3>
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

        <section className="popular-products-section" aria-label="Popular products">
          <h3>Popular products</h3>
          <div className="popular-products-grid">
            {(popularProducts.length > 0 ? popularProducts : []).map((product, index) => (
              <article
                key={product.id}
                className={`popular-products-card ${index === activePopularIndex ? "active" : ""}`}
              >
                <div className="popular-products-media">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  {product.has_discount && (
                    <span className="popular-products-badge" style={{background: '#10b981'}}>SALE</span>
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
                    <span className="badge" style={{background: '#10b981'}}>SALE</span>
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
