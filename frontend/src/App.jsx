import { useState } from "react";
import Customer from "./pages/Customer";
import Cart from "./pages/cart";

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [currentPage, setCurrentPage] = useState("menu");

  const handleAddToCart = ({ product, selectedSize, productKey }) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productKey === productKey && item.selectedSize === selectedSize
      );

      if (existingIndex === -1) {
        return [
          ...prev,
          { ...product, productKey, selectedSize, sugarLevel: "100%", quantity: 1 },
        ];
      }

      return prev.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  };

  const updateCartItemQuantity = (productKey, selectedSize, change) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.productKey === productKey && item.selectedSize === selectedSize
            ? { ...item, quantity: Math.max(item.quantity + change, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (productKey, selectedSize) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.productKey === productKey && item.selectedSize === selectedSize)
      )
    );
  };

  const updateCartItemSugar = (productKey, selectedSize, sugarLevel) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productKey === productKey && item.selectedSize === selectedSize
          ? { ...item, sugarLevel }
          : item
      )
    );
  };

  const handleBuyNow = () => {
    if (cartItems.length === 0) {
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    window.alert(`Purchase successful. Total paid: $${total.toFixed(2)}`);
    setCartItems([]);
    setCurrentPage("menu");
  };

  return (
    <div>
      {currentPage === "menu" ? (
        <Customer
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onCartClick={() => setCurrentPage("cart")}
        />
      ) : (
        <Cart
          cartItems={cartItems}
          onBackToMenu={() => setCurrentPage("menu")}
          onIncrease={(productKey, selectedSize) =>
            updateCartItemQuantity(productKey, selectedSize, 1)
          }
          onDecrease={(productKey, selectedSize) =>
            updateCartItemQuantity(productKey, selectedSize, -1)
          }
          onRemove={removeCartItem}
          onSugarChange={updateCartItemSugar}
          onBuyNow={handleBuyNow}
        />
      )}
    </div>
  );
}

export default App;
