import { useState, useCallback, useEffect, useMemo } from "react";
//logo prey lang//
import image from "../img/image.png"
//coffee//
import tea1 from "../img/image1.png"
import coffee1 from "../img/image2.png"
import coffee2 from "../img/image3.png";
import coffee3 from "../img/mocha-frappe.png";
import tea12 from "../img/image 27.png";
import tea13 from "../img/image 29.png";
import tea14 from "../img/image 30.png";
import tea15 from "../img/image 31.png";
import tea16 from "../img/image 32.png";
import cake17 from "../img/image copy 7.png";
//smoothies//
import photoThree from "../img/image copy.png";
import photoFour from "../img/image 4.png";
import photoFive from "../img/image 5.png";
import photoSix from "../img/image 6.png";
import photoSeven from "../img/image 7.png";
import photoEight from "../img/image 8.png";
import photoNine from "../img/image 9.png";
import photoTen from "../img/image 10.png";
import photoEleven from "../img/image 11.png";
import photoTwelve from "../img/image 12.png";
import photoThirteen from "../img/image 13.png";
import photoFourteen from "../img/image 14.png";
import photoFifteen from "../img/image 15.png";
import tea2 from "../img/image 17.png";
import tea3 from "../img/image 18.png";
import tea4 from "../img/image 19.png";
import tea5 from "../img/image 20.png";
import tea6 from "../img/image 21.png";
import tea7 from "../img/image 22.png";
import tea8 from "../img/image 23.png";
import tea9 from "../img/image 24.png";
import tea10 from "../img/image 25.png";
import tea11 from "../img/image 26.png";
import cake23 from "../img/image copy 13.png";
//cake//
import tea17 from "../img/image cake.png";
import cake from "../img/image cake1.png";
import cake2 from "../img/image cake3.png";
import cake3 from "../img/image cake4.png";
import cake4 from "../img/image cake5.png";
import cake5 from "../img/image cake6.png";
import cake6 from "../img/image cake7.png";
import cake7 from "../img/image cake8.png";
import cake8 from "../img/image cake9.png";
import cake9 from "../img/image cake11.png";
import cake10 from "../img/image cake12.png";
import cake11 from "../img/image cake13.png";
//tea//
import cake12 from "../img/image copy 2.png";
import cake13 from "../img/image copy 3.png";
import cake14 from "../img/image copy 4.png";
import cake15 from "../img/image copy 5.png";
import cake16 from "../img/image copy 6.png";
import cake18 from "../img/image copy 8.png";
import cake19 from "../img/image copy 9.png";
import cake20 from "../img/image copy 10.png";
import cake21 from "../img/image copy 11.png";
import cake22 from "../img/image copy 12.png";
import cake24 from "../img/image copy 14.png";
import cake25 from "../img/image copy 15.png";
import cake26 from "../img/image copy 16.png";
import cake27 from "../img/image copy 17.png";
import cake28 from "../img/image copy 18.png";
import cake29 from "../img/image copy 19.png";
import cake30 from "../img/image copy 20.png";
import cake31 from "../img/image copy 21.png";
// import tea18 from "../img/image28.png";
import {
  FaShoppingCart,
  FaCoffee,
  FaLeaf,
  FaGlassWhiskey,
  FaBreadSlice,
  FaMoon,
  FaSun,
} from "react-icons/fa";

// Category type definitions with icons
const CATEGORIES = [
  { id: "all", label: "All", icon: null },
  { id: "coffee", label: "Coffee", icon: FaCoffee },
  { id: "tea", label: "Tea", icon: FaLeaf },
  { id: "smoothies", label: "Smoothies", icon: FaGlassWhiskey },
  { id: "pastries", label: "Pastries", icon: FaBreadSlice },
];
const CATEGORY_IDS = new Set(CATEGORIES.map((cat) => cat.id));
const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "");
const PROD_FALLBACK_API_BASE_URL = "http://127.0.0.1:8000";
const getProductEndpoints = () => {
  if (API_BASE_URL) {
    return [`${API_BASE_URL}/api/products`];
  }

  if (import.meta.env.DEV) {
    return ["/api/products", `${PROD_FALLBACK_API_BASE_URL}/api/products`];
  }

  return [`${PROD_FALLBACK_API_BASE_URL}/api/products`];
};
const normalizeCategoryId = (value = "") => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "coffee") return "coffee";
  if (normalized === "tea") return "tea";
  if (normalized === "smoothies" || normalized === "smoothie") return "smoothies";
  if (normalized === "pastries" || normalized === "pastry") return "pastries";
  return "all";
};
const inferCategoryFromProduct = (product = {}) => {
  const text = `${product.name ?? ""} ${product.description ?? ""}`.toLowerCase();

  const keywords = {
    coffee: ["coffee", "espresso", "americano", "cappuccino", "macchiato", "brew", "latte", "mocha"],
    tea: ["tea", "matcha", "jasmine", "earl grey", "oolong", "chai", "milk tea"],
    smoothies: ["smoothie", "shake", "frappe", "frapp", "milkshake"],
    pastries: ["cake", "pastry", "croissant", "muffin", "roll", "bread", "mochi", "cookie"],
  };

  const scores = Object.entries(keywords).map(([category, list]) => {
    const score = list.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
    return { category, score };
  });

  const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
  if (!bestMatch || bestMatch.score === 0) {
    return null;
  }

  return bestMatch.category;
};
const getStrictProductCategoryId = (product = {}) => {
  const normalized = normalizeCategoryId(product.category_slug ?? product.category ?? "");
  return normalized === "all" ? null : normalized;
};
const getProductCategoryId = (product = {}) => {
  const strictCategory = getStrictProductCategoryId(product);
  if (strictCategory) {
    return strictCategory;
  }

  return inferCategoryFromProduct(product) ?? "pastries";
};
const CATEGORY_IMAGE_POOLS = {
  coffee: [
    tea1, coffee1, coffee2, coffee3, photoThree, photoFour, photoFive, photoSix,
    photoEleven, photoTwelve,
  ],
  tea: [
    photoSeven, photoEight, photoNine, photoTen, tea1, tea2, tea3, tea4, tea5, tea6, tea7, tea8,
    tea9, tea10, tea11, tea12,
  ],
  smoothies: [
    photoThirteen, photoFourteen, photoFifteen, tea13, tea14, tea15, tea16, tea17,
  ],
  pastries: [
    cake, cake2, cake3, cake4, cake5, cake6, cake7, cake8, cake9, cake10, cake11,
    cake12, cake13, cake14, cake15, cake16, cake17, cake18, cake19, cake20, cake21,
    cake22, cake23, cake24, cake25, cake26, cake27, cake28, cake29, cake30, cake31,
  ],
};
const getCategoryImagePool = (categoryId) => CATEGORY_IMAGE_POOLS[categoryId] ?? CATEGORY_IMAGE_POOLS.pastries;
const getCategoryDefaultImage = (categoryId) => getCategoryImagePool(categoryId)[0] ?? cake;
const hashString = (value = "") => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};
const pickImageFromPool = (pool, excludedImages, seed) => {
  if (!Array.isArray(pool) || pool.length === 0) {
    return null;
  }

  const startIndex = hashString(seed) % pool.length;
  for (let offset = 0; offset < pool.length; offset += 1) {
    const index = (startIndex + offset) % pool.length;
    const candidate = pool[index];
    if (!excludedImages.has(candidate)) {
      return candidate;
    }
  }

  return pool[startIndex];
};
const normalizeProductImage = (imageUrl) => {
  if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return null;
  }

  const value = imageUrl.trim();
  const isAbsolute = /^(https?:\/\/|data:|blob:)/i.test(value);
  if (isAbsolute) {
    return value;
  }

  const apiOrigin = API_BASE_URL || PROD_FALLBACK_API_BASE_URL;
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${apiOrigin}${normalizedPath}`;
};
const isValidImageValue = (value) => typeof value === "string" && value.trim() !== "";
const buildProductSearchText = (item = {}) =>
  [
    item.name,
    item.description,
    item.badge,
    item.category,
    item.category_slug,
    getProductCategoryId(item),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
const mergeProductCollections = (apiItems = [], localItems = []) => {
  const merged = new Map();
  const candidates = [...apiItems, ...localItems];

  candidates.forEach((item) => {
    const categoryId = getProductCategoryId(item);
    const nameKey = (item.name ?? "").trim().toLowerCase();
    const key = `${nameKey}|${categoryId}`;

    const normalizedPrice = Number.parseFloat(item?.price);
    const normalizedItem = {
      ...item,
      price: Number.isFinite(normalizedPrice) ? normalizedPrice : 0,
    };

    if (!merged.has(key)) {
      merged.set(key, normalizedItem);
      return;
    }

    const existing = merged.get(key);
    const existingScore = Number(isValidImageValue(existing?.image)) + Number(Boolean(existing?.description));
    const nextScore = Number(isValidImageValue(normalizedItem?.image)) + Number(Boolean(normalizedItem?.description));

    if (nextScore > existingScore) {
      merged.set(key, normalizedItem);
    }
  });

  return Array.from(merged.values());
};
const ensureUniqueDisplayImages = (items = []) => {
  const usedDisplayImagesByCategory = {
    coffee: new Set(),
    tea: new Set(),
    smoothies: new Set(),
    pastries: new Set(),
  };

  return items.map((item) => {
    const categoryId = getProductCategoryId(item);
    const pool = getCategoryImagePool(categoryId);
    const usedDisplayImages = usedDisplayImagesByCategory[categoryId] ?? usedDisplayImagesByCategory.pastries;
    const seed = `${item.id ?? ""}-${item.name ?? ""}-${categoryId}`;
    const currentImage =
      typeof item.image === "string" && item.image.trim() !== ""
        ? item.image.trim()
        : null;

    let displayImage = currentImage;
    if (!displayImage) {
      displayImage =
        pickImageFromPool(pool, usedDisplayImages, seed) ??
        getCategoryDefaultImage(categoryId);
    }

    if (displayImage) {
      usedDisplayImages.add(displayImage);
    }

    const fallbackExcluded = new Set(usedDisplayImages);
    if (displayImage) {
      fallbackExcluded.add(displayImage);
    }

    const fallbackImage =
      pickImageFromPool(pool, fallbackExcluded, `${seed}-fallback`) ??
      displayImage ??
      getCategoryDefaultImage(categoryId);

    return {
      ...item,
      image: displayImage,
      fallbackImage,
    };
  });
};
const mixProductsForAllMenu = (items = []) =>
  [...items].sort((a, b) => {
    const seedA = `${getProductCategoryId(a)}-${a.id ?? ""}-${a.name ?? ""}`;
    const seedB = `${getProductCategoryId(b)}-${b.id ?? ""}-${b.name ?? ""}`;
    const mixedOrder = hashString(seedA) - hashString(seedB);
    if (mixedOrder !== 0) return mixedOrder;

    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

// Callback function triggered when category changes
const onCategoryChange = (category) => {
  console.log(`Category changed to: ${category}`);
  // You can add additional logic here like:
  // - Analytics tracking
  // - API calls
  // - State updates outside component
};

const products = [
  // Coffee Products
  {
    id: 1,
    name: "Mocha Frappe",
    price: 5.5,
    category: "Coffee",
    image: tea1,
    badge: "SEASONAL",
  },
  {
    id: 2,
    name: "Caramel Macchiato",
    price: 4.5,
    category: "Coffee",
    image: coffee1,
    badge: "POPULAR",
  },
  {
    id: 3,
    name: "NitroCold Brew",
    price: 5.25,
    category: "Coffee",
    image: coffee2,
    badge: "ICED",
  },
  {
    id: 4,
    name: "Flat White",
    price: 4.0,
    category: "Coffee",
    image: coffee3,
    badge: "HOT",
  },
  {
    id: 5,
    name: "Milk shake",
    price: 3.0,
    category: "Coffee",
    image: tea12,
    badge: "HOT",
  },
  {
    id: 6,
    name: "Blueberry Muffin",
    price: 3.5,
    category: "coffee",
    image: tea13,
    badge: "HOT",
  },
  {
    id: 7,
    name: "Matcha Latte shake",
    price: 4.25,
    category: "coffee",
    image: tea14,
    badge: "HOT",
  },
  {
    id: 8,
    name: "Milk Tea shake",
    price: 4.0,
    category: "coffee",
    image: tea15,
    badge: "HOT",
  },
  // Tea Products
  {
    id: 9,
    name: "Oreo shake",
    price: 3.0,
    category: "coffee",
    image: tea16,
    badge: "HOT",
  },
  {
    id: 10,
    name: "Strawberry Shake",
    price: 4.5,
    category: "Coffee",
    image: cake17,
    badge: "HOT",
  },
 
  // Smoothies
   {
    id: 11,
    name: "Mango Tango shake",
    price: 5.0,
    category: "Smoothies",
    image: photoThree,
    badge: "POPULAR",
  },
  {
    id: 12,
    name: "Strawberry Shake cream",
    price: 3.5,
    category: "Smoothies",
    image: photoFour,
    badge: "ICED",
  },
  {
    id: 13,
    name: "milo shake",
    price: 5.5,
    category: "Smoothies",
    image: photoFive,
    badge: "FRESH",
  },
  {
    id: 14,
    name: "Banana Tango",
    price: 5.25,
    category: "Smoothies",
    image: photoSix,
    badge: "TROPICAL",
  },
  {
    id: 15,
    name: "Coconut Shake cream",
    price: 4.75,
    category: "Smoothies",
    image: photoSeven,
    badge: "CREAMY",
  },
  // Pastries
  {
    id: 16,
    name: "Whatermolon smoothie",
    price: 3.5,
    category: "Smoothies",
    image: photoEight,
    badge: "FRESH",
  },
  {
    id: 17,
    name: "Phlettum shake",
    price: 3.25,
    category: "Smoothies",
    image: photoNine,
    badge: "BAKED",
  },
  {
    id: 18,
    name: "Cinnamon coffee",
    price: 4.0,
    category: "Smoothies",
    image: photoTen,
    badge: "WARM",
  },
  {
    id: 19,
    name: "Blueberry Muffin smoothie",
    price: 4.0,
    category: "smoothies",
    image: photoEleven,
    badge: "WARM",
  },
  {
    id: 20,
    name: "Raspberry Muffin smoothie",
    price: 4.0,
    category: "smoothies",
    image: photoTwelve,
    badge: "WARM",
  },
  {
    id: 21,
    name: "Blueberry Muffin",
    price: 3.25,
    category: "smoothies",
    image: photoThirteen,
    badge: "BAKED",
  },
  {
    id: 22,
    name: "dragon fruit  shake",
    price: 3.75,
    category: "Smoothies",
    image: photoFourteen,
    badge: "FRESH",
  },
  {
    id: 23,
    name: " Below shake",
    price: 3.75,
    category: "Smoothies",
    image: photoFifteen,
    badge: "FRESH",
  },
  {
    id: 24,
    name: "papaya shake",
    price: 3.75,
    category: "Smoothies",
    image: tea2,
    badge: "FRESH",
  },
  {
    id: 25,
    name: "peach milk shake",
    price: 3.75,
    category: "Smoothies",
    image: tea3,
    badge: "FRESH",
  },
  {
    id: 26,
    name: "orange shake",
    price: 3.75,
    category: "Smoothies",
    image: tea4,
    badge: "FRESH",
  },
  {
    id: 27,
    name: "grape milkshake cream",
    price: 3.75,
    category: "Smoothies",
    image: tea5,
    badge: "FRESH",
  },
  {
    id: 28,
    name: "Almond shake cream",
    price: 3.75,
    category: "Smoothies",
    image: tea6,
    badge: "FRESH",
  },
  {
    id: 29,
    name: "milk cake shake",
    price: 3.75,
    category: "Smoothies",
    image: tea7,
    badge: "FRESH",
  },
  {
    id: 30,
    name: "Chocolate coffe shake",
    price: 3.75,
    category: "Smoothies",
    image: tea8,
    badge: "FRESH",
  },
  {
    id: 31,
    name: "Vanilla milk shake",
    price: 3.75,
    category: "Smoothies",
    image: tea9,
    badge: "FRESH",
  },
  {
    id: 32,
    name: "Raf coffee",
    price: 3.75,
    category: "Smoothies",
    image: tea10,
    badge: "FRESH",
  },
  {
    id: 33,
    name: "Corretto coffee",
    price: 3.75,
    category: "smoothies",
    image: tea11,
    badge: "FRESH",
  },
  {
    id: 34,
    name: "Cappocino freddeo",
    price: 3.75,
    category: "smoothies",
    image: cake23,
    badge: "FRESH",
  },
  {
    id: 58,
    name: "strawberry cupcake ",
    price: 3.75,
    category: "Pastries",
    image: tea17,
    badge: "FRESH",
  },
  {
    id: 59,
    name: "Chocolate Bicerin",
    price: 3.75,
    category: "Pastries",
    image: cake,
    badge: "FRESH",
  },
  {
    id: 60,
    name: "Nutella croissant",
    price: 3.75,
    category: "Pastries",
    image: cake2,
    badge: "FRESH",
  },
  {
    id: 61,
    name: "Caramel croissant",
    price: 3.75,
    category: "Pastries",
    image: cake3,
    badge: "FRESH",
  },
  {
    id: 62,
    name: "strawberry caramel croissant",
    price: 3.75,
    category: "Pastries",
    image: cake4,
    badge: "FRESH",
  },
  {
    id: 63,
    name: "Chocolate cake Cross",
    price: 3.75,
    category: "Pastries",
    image: cake5,
    badge: "FRESH",
  },
  {
    id: 64,
    name: "Chocolate minimal",
    price: 3.75,
    category: "Pastries",
    image: cake6,
    badge: "FRESH",
  },
  {
    id: 65,
    name: "Caramal",
    price: 3.75,
    category: "Pastries",
    image: cake7,
    badge: "FRESH",
  },
  {
    id: 66,
    name: "Chocolate Cake",
    price: 3.75,
    category: "Pastries",
    image: cake8,
    badge: "FRESH",
  },
  {
    id: 39,
    name: "Greentea Caramal",
    price: 3.75,
    category: "Pastries",
    image: cake9,
    badge: "FRESH",
  },
  {
    id: 40,
    name: "Holenut Caramal",
    price: 3.75,
    category: "Pastries",
    image: cake10,
    badge: "FRESH",
  },
  {
    id: 41,
    name: "cake Cross Chocolate",
    price: 3.75,
    category: "Pastries",
    image: cake11,
    badge: "FRESH",
  },
  //tea//
  {
    id: 42,
    name: "Tealive  tea",
    price: 3.75,
    category: "Tea",
    image: cake12,
    badge: "FRESH",
  },
  {
    id: 43,
    name: "Hot tea ",
    price: 3.75,
    category: "Tea",
    image: cake13,
    badge: "FRESH",
  },
  {
    id: 44,
    name: "Bee limon tea",
    price: 3.75,
    category: "Tea",
    image: cake14,
    badge: "FRESH",
  },
  {
    id: 45,
    name: "Milk tea",
    price: 3.75,
    category: "Tea",
    image: cake15,
    badge: "FRESH",
  },
  
  {
    id: 46,
    name: "macha strawberry shake",
    price: 3.75,
    category: "Smoothies",
    image: cake16,
    badge: "FRESH",
  },
  {
    id: 67,
    name: "blueflotea",
    price: 3.75,
    category: "tea",
    image: cake18,
    badge: "FRESH",
  },
  {
    id: 68,
    name: "purple sweet potato shake",
    price: 3.75,
    category: "Smoothies",
    image: cake19,
    badge: "FRESH",
  },
  {
    id: 48,
    name: "butter flower smoothie",
    price: 3.75,
    category: "Smoothies",
    image: cake20,
    badge: "FRESH",
  },
  {
    id: 50,
    name: "Butter flower Tea",
    price: 3.75,
    category: "Tea",
    image: cake21,
    badge: "FRESH",
  },
  {
    id: 49,
    name: "Lichi tea",
    price: 3.75,
    category: "Tea",
    image: cake22,
    badge: "FRESH",
  },
  {
    id: 69,
    name: "Rose tea",
    price: 3.75,
    category: "Tea",
    image: cake24,
    badge: "FRESH",
  },
  {
    id: 70,
    name: "jasmine tea",
    price: 3.75,
    category: "Tea",
    image: cake25,
    badge: "FRESH",
  },
  {
    id: 52,
    name: "milk passion",
    price: 3.75,
    category: "smothies",
    image: cake26,
    badge: "FRESH",
  },
  {
    id: 53,
    name: "FrechMilk shake",
    price: 3.75,
    category: "Smoothies",
    image: cake27,
    badge: "FRESH",
  },
  {
    id: 54,
    name: "Redmike shake",
    price: 3.75,
    category: "Tea",
    image: cake28,
    badge: "FRESH",
  },
  {
    id: 55,
    name: "Greenchino",
    price: 3.75,
    category: "Tea",
    image: cake29,
    badge: "FRESH",
  },
  {
    id: 56,
    name: "purple sweet potato mochi",
    price: 3.75,
    category: "Tea",
    image: cake30,
    badge: "FRESH",
  },
  {
    id: 57,
    name: "Printblue machiato",
    price: 3.75,
    category: "Tea",
    image: cake31,
    badge: "FRESH",
  },
  // {
  //   id: 58,
  //   name: "pinkpain mochi",
  //   price: 3.75,
  //   category: "Pastries",
  //   image: cake29,
  //   badge: "FRESH",
  // },
  // {
  //   id: 58,
  //   name: "mochi strawberry shake",
  //   price: 3.75,
  //   category: "Pastries",
  //   image: cake30,
  //   badge: "FRESH",
  // },
  // {
  //   id: 59,
  //   name: "Concitero mochi shake",
  //   price: 3.75,
  //   category: "Pastries",
  //   image: cake31,
  //   badge: "FRESH",
  // },
  // {
  //   id: 59,
  //   name: "Chocolate Croissant",
  //   price: 3.75,
  //   category: "Pastries",
  //   image: tea18,
  //   badge: "FRESH",
  // },

  
];

function Customer({ cartItems = [], onAddToCart, onCartClick, theme = "light", onToggleTheme }) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({});
  const [apiProducts, setApiProducts] = useState([]);
  const [useApiProducts, setUseApiProducts] = useState(true);

  // Handle category selection - filters products and triggers callback
  const handleCategoryClick = useCallback((cat) => {
    if (!CATEGORY_IDS.has(cat)) return;
    setCategory(cat);
    onCategoryChange(cat);
  }, []);
 
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    const controller = new AbortController();
    const endpoints = getProductEndpoints();

    const fetchProducts = async () => {
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
          }

          const payload = await response.json();
          const mappedProducts = Array.isArray(payload?.data)
            ? payload.data.map((item) => ({
                ...item,
                category: item.category,
                category_slug: item.category_slug,
                category_id: getStrictProductCategoryId(item),
                price: Number.isFinite(Number.parseFloat(item.price))
                  ? Number.parseFloat(item.price)
                  : 0,
                image: normalizeProductImage(item.image),
              }))
            : [];

          setApiProducts(mappedProducts);
          setUseApiProducts(true);
          return;
        } catch (error) {
          if (error.name === "AbortError") {
            return;
          }
        }
      }

      setUseApiProducts(false);
    };

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, []);

  const getProductKey = (product) => `${product.id}-${product.name}-${product.image}`;

  const handleSizeClick = (product, size) => {
    const productKey = getProductKey(product);
    setSelectedSizes((prev) => ({ ...prev, [productKey]: size }));
  };

  const handleAddToCart = (product) => {
    const productKey = getProductKey(product);
    const selectedSize = selectedSizes[productKey] ?? "M";
    // Just add to cart and show count - NO navigation to cart page
    onAddToCart?.({ product, selectedSize, productKey });
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const sourceItems = useApiProducts
      ? mergeProductCollections(apiProducts, products)
      : products;
    const filteredItems = sourceItems.filter((item) => {
      const itemCategory = item.category_id ?? getStrictProductCategoryId(item);
      const searchableText = buildProductSearchText(item);

      const matchesCategory = category === "all" || itemCategory === category;
      if (!matchesCategory) return false;
      if (!query) return true;

      return searchableText.includes(query);
    });

    const arrangedItems =
      category === "all" ? mixProductsForAllMenu(filteredItems) : filteredItems;

    return ensureUniqueDisplayImages(arrangedItems);
  }, [apiProducts, useApiProducts, category, search]);

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
              title={theme === "dark" ? "Light mode" : "Dark mode"}
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
          onChange={handleSearch}
        />

        {/* Categories - Clickable Type Elements */}
        <div className="categories">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                className={`category-type ${category === cat.id ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat.id)}
                data-category={cat.id}
                aria-pressed={category === cat.id}
              >
                {IconComponent && <IconComponent className="category-icon" />}
                <span className="category-label">{cat.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Scrollable Menu */}
      <div className="menu">
        {filtered.map((item) => {
          const itemKey = getProductKey(item);
          return (
          <div className="card" key={itemKey}>
            <div className="image-container">
              <img
                src={item.image ?? item.fallbackImage}
                alt={item.name}
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied === "true") {
                    return;
                  }

                  event.currentTarget.dataset.fallbackApplied = "true";
                  const fallback = item.fallbackImage ?? getCategoryDefaultImage(getProductCategoryId(item));
                  event.currentTarget.src = fallback;
                }}
              />
              <span className="badge">{item.badge}</span>
            </div>

            <div className="card-body">
              <h3>{item.name}</h3>
              <h2>{item.text}</h2>

              <div className="sizes">
                {["S", "M", "L"].map((size) => (
                  <span
                    key={size}
                    className={(selectedSizes[itemKey] ?? "M") === size ? "size active-size" : "size"}
                    onClick={() => handleSizeClick(item, size)}
                  >
                    {size}
                  </span>
                ))}
              </div>

              <div className="price-row">
                <span className="price">${(Number.isFinite(Number.parseFloat(item.price)) ? Number.parseFloat(item.price) : 0).toFixed(2)}</span>
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
        )})}
      </div>
    </div>
  );
}

export default Customer;
