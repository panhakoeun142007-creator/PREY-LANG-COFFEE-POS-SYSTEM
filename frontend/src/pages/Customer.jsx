import { useState, useCallback } from "react";
import image from "../img/image.png"
import mochaFrappeImage from "../img/image1.png"
import coffeeImage from "../img/image2.png"
import photoOne from "../img/image3.png";
import photoTwo from "../img/mocha-frappe.png";
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
import tea1 from "../img/image 16.png";
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
import tea12 from "../img/image 27.png";
import tea13 from "../img/image 29.png";
import tea14 from "../img/image 30.png";
import tea15 from "../img/image 31.png";
import tea16 from "../img/image 32.png";
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
import cake12 from "../img/image copy 2.png";
import cake13 from "../img/image copy 3.png";
import cake14 from "../img/image copy 4.png";
import cake15 from "../img/image copy 5.png";
import cake16 from "../img/image copy 6.png";
import cake17 from "../img/image copy 7.png";
import cake18 from "../img/image copy 8.png";
import cake19 from "../img/image copy 9.png";
import cake20 from "../img/image copy 10.png";
import cake21 from "../img/image copy 11.png";
import cake22 from "../img/image copy 12.png";
import cake23 from "../img/image copy 13.png";
import cake24 from "../img/image copy 14.png";
import cake25 from "../img/image copy 15.png";
import cake26 from "../img/image copy 16.png";
import cake27 from "../img/image copy 17.png";
import cake28 from "../img/image copy 18.png";
import cake29 from "../img/image copy 19.png";
import cake30 from "../img/image copy 20.png";
import cake31 from "../img/image copy 21.png";
// import tea18 from "../img/image28.png";
import { FaShoppingCart, FaCoffee, FaLeaf, FaGlassWhiskey, FaBreadSlice } from "react-icons/fa";

// Category type definitions with icons
const CATEGORIES = [
  { id: "All", label: "All", icon: null },
  { id: "Coffee", label: "Coffee", icon: FaCoffee },
  { id: "Tea", label: "Tea", icon: FaLeaf },
  { id: "Smoothies", label: "Smoothies", icon: FaGlassWhiskey },
  { id: "Pastries", label: "Pastries", icon: FaBreadSlice },
];

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
    image: mochaFrappeImage,
    badge: "SEASONAL",
  },
  {
    id: 2,
    name: "Caramel Macchiato",
    price: 4.5,
    category: "Coffee",
    image: coffeeImage,
    badge: "POPULAR",
  },
  {
    id: 3,
    name: "NitroCold Brew",
    price: 5.25,
    category: "Coffee",
    image: photoOne,
    badge: "ICED",
  },
  {
    id: 4,
    name: "Flat White",
    price: 4.0,
    category: "Coffee",
    image: photoTwo,
    badge: "HOT",
  },
  {
    id: 5,
    name: "Espresso",
    price: 3.0,
    category: "Coffee",
    image: photoThree,
    badge: "HOT",
  },
  {
    id: 6,
    name: "Americano",
    price: 3.5,
    category: "Coffee",
    image: photoFour,
    badge: "HOT",
  },
  {
    id: 7,
    name: "Latte",
    price: 4.25,
    category: "Coffee",
    image: photoFive,
    badge: "HOT",
  },
  {
    id: 8,
    name: "Cappuccino",
    price: 4.0,
    category: "Coffee",
    image: photoSix,
    badge: "HOT",
  },
  // Tea Products
  {
    id: 9,
    name: "Green Tea",
    price: 3.0,
    category: "Tea",
    image: photoSeven,
    badge: "HOT",
  },
  {
    id: 10,
    name: "Chai Latte",
    price: 4.5,
    category: "Tea",
    image: photoEight,
    badge: "HOT",
  },
  {
    id: 11,
    name: "Matcha Latte",
    price: 5.0,
    category: "Tea",
    image: photoNine,
    badge: "POPULAR",
  },
  {
    id: 12,
    name: "Iced Tea",
    price: 3.5,
    category: "Tea",
    image: photoTen,
    badge: "ICED",
  },
  // Smoothies
  {
    id: 13,
    name: "Berry Blast",
    price: 5.5,
    category: "Smoothies",
    image: photoEleven,
    badge: "FRESH",
  },
  {
    id: 14,
    name: "Mango Tango",
    price: 5.25,
    category: "Smoothies",
    image: photoTwelve,
    badge: "TROPICAL",
  },
  {
    id: 15,
    name: "Banana Shake",
    price: 4.75,
    category: "Smoothies",
    image: photoThirteen,
    badge: "CREAMY",
  },
  // Pastries
  {
    id: 16,
    name: "Croissant",
    price: 3.5,
    category: "Pastries",
    image: photoFourteen,
    badge: "FRESH",
  },
  {
    id: 17,
    name: "Blueberry Muffin",
    price: 3.25,
    category: "Pastries",
    image: photoFifteen,
    badge: "BAKED",
  },
  {
    id: 18,
    name: "Cinnamon Roll",
    price: 4.0,
    category: "Pastries",
    image: photoOne,
    badge: "WARM",
  },
  {
    id: 19,
    name: "Cinnamon Roll",
    price: 4.0,
    category: "Pastries",
    image: tea1,
    badge: "WARM",
  },
  {
    id: 19,
    name: "Cinnamon Roll",
    price: 4.0,
    category: "Pastries",
    image: tea2,
    badge: "WARM",
  },
  {
    id: 20,
    name: "Blueberry Muffin",
    price: 3.25,
    category: "Pastries",
    image: tea3,
    badge: "BAKED",
  },
  {
    id: 21,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea4,
    badge: "FRESH",
  },
  {
    id: 22,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea5,
    badge: "FRESH",
  },
  {
    id: 23,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea6,
    badge: "FRESH",
  },
  {
    id: 24,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea7,
    badge: "FRESH",
  },
  {
    id: 25,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea8,
    badge: "FRESH",
  },
  {
    id: 26,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea9,
    badge: "FRESH",
  },
  {
    id: 27,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea10,
    badge: "FRESH",
  },
  {
    id: 28,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea11,
    badge: "FRESH",
  },
  {
    id: 29,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea12,
    badge: "FRESH",
  },
  {
    id: 30,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea13,
    badge: "FRESH",
  },
  {
    id: 31,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea14,
    badge: "FRESH",
  },
  {
    id: 32,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea15,
    badge: "FRESH",
  },
  {
    id: 33,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea16,
    badge: "FRESH",
  },
  {
    id: 34,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: tea17,
    badge: "FRESH",
  },
  {
    id: 34,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake,
    badge: "FRESH",
  },
  {
    id: 35,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake2,
    badge: "FRESH",
  },
  {
    id: 35,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake3,
    badge: "FRESH",
  },
  {
    id: 36,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake4,
    badge: "FRESH",
  },
  {
    id: 36,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake5,
    badge: "FRESH",
  },
  {
    id: 37,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake5,
    badge: "FRESH",
  },
  {
    id: 37,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake6,
    badge: "FRESH",
  },
  {
    id: 38,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake7,
    badge: "FRESH",
  },
  {
    id: 38,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake8,
    badge: "FRESH",
  },
  {
    id: 39,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake9,
    badge: "FRESH",
  },
  {
    id: 40,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake10,
    badge: "FRESH",
  },
  {
    id: 41,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake11,
    badge: "FRESH",
  },
  {
    id: 42,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake12,
    badge: "FRESH",
  },
  {
    id: 43,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake13,
    badge: "FRESH",
  },
  {
    id: 44,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake14,
    badge: "FRESH",
  },
  
  {
    id: 45,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake15,
    badge: "FRESH",
  },
  {
    id: 45,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake16,
    badge: "FRESH",
  },
  {
    id: 46,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake17,
    badge: "FRESH",
  },
  {
    id: 47,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake18,
    badge: "FRESH",
  },
  {
    id: 48,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake19,
    badge: "FRESH",
  },
  {
    id: 49,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake20,
    badge: "FRESH",
  },
  {
    id: 50,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake21,
    badge: "FRESH",
  },
  {
    id: 51,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake22,
    badge: "FRESH",
  },
  {
    id: 52,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake23,
    badge: "FRESH",
  },
  {
    id: 52,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake24,
    badge: "FRESH",
  },
  {
    id: 53,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake25,
    badge: "FRESH",
  },
  {
    id: 54,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake26,
    badge: "FRESH",
  },
  {
    id: 55,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake27,
    badge: "FRESH",
  },
  {
    id: 56,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake28,
    badge: "FRESH",
  },
  {
    id: 57,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake29,
    badge: "FRESH",
  },
  {
    id: 58,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake30,
    badge: "FRESH",
  },
  {
    id: 59,
    name: "Chocolate Croissant",
    price: 3.75,
    category: "Pastries",
    image: cake31,
    badge: "FRESH",
  },
  // {
  //   id: 59,
  //   name: "Chocolate Croissant",
  //   price: 3.75,
  //   category: "Pastries",
  //   image: tea18,
  //   badge: "FRESH",
  // },

  
];

function customer({ cartItems = [], onAddToCart, onCartClick }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({});

  // Handle category selection - filters products and triggers callback
  const handleCategoryClick = useCallback((cat) => {
    setCategory(cat);
    onCategoryChange(cat);
  }, []);
 
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const getProductKey = (product) => `${product.id}-${product.name}-${product.image}`;

  const handleSizeClick = (product, size) => {
    const productKey = getProductKey(product);
    setSelectedSizes((prev) => ({ ...prev, [productKey]: size }));
  };

  const handleAddToCart = (product) => {
    const productKey = getProductKey(product);
    const selectedSize = selectedSizes[productKey] ?? "M";
    onAddToCart?.({ product, selectedSize, productKey });
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const filtered = products.filter((item) => {
    return (
      (category === "All" || item.category === category) &&
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="container">
      <div className="sticky-header">
        <div className="navbar">
          <div className="logo-section">
            <img src={image} alt="Prey Lang Coffee Logo" />
            <h3>Prey Lang Coffee</h3>
          </div>

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

        <h2>Coffee your Selection</h2>

        <input
          type="text"
          placeholder="Search for your favorite brew..."
          className="search"
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
              <img src={item.image} alt={item.name} />
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
                <span className="price">${item.price.toFixed(2)}</span>
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

export default customer;
