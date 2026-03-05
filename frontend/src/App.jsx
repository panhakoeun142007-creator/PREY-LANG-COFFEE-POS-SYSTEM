import { useEffect, useState } from "react";
import Customer from "./pages/Customer";
import Cart from "./pages/cart";
import Detail from "./pages/Detail";
import Checkout from "./pages/checkout";
import QRpayment from "./pages/QRpayment";
import Paymantule from "./pages/paymantule";
import Wait from "./pages/wait";
import { getCartTotal } from "./utils/pricing";

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [currentPage, setCurrentPage] = useState("menu");
  const [detailTarget, setDetailTarget] = useState(null);
  const [qrOrderNumber, setQrOrderNumber] = useState("#A-000");
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleAddToCart = ({ product, selectedSize, productKey }) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productKey === productKey && item.selectedSize === selectedSize
      );

      if (existingIndex === -1) {
        return [
          ...prev,
          {
            ...product,
            productKey,
            selectedSize,
            sugarLevel: "100%",
            milkOption: "Whole",
            extras: {
              extraShot: false,
              whippedCream: false,
              cinnamonSprinkles: false,
            },
            quantity: 1,
          },
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

  const openDetailPage = (productKey, selectedSize) => {
    setDetailTarget({ productKey, selectedSize });
    setCurrentPage("detail");
  };

  const moveDetailTarget = (direction) => {
    if (!detailTarget || cartItems.length === 0) {
      return;
    }

    const currentIndex = cartItems.findIndex(
      (item) =>
        item.productKey === detailTarget.productKey &&
        item.selectedSize === detailTarget.selectedSize
    );

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= cartItems.length) {
      return;
    }

    const nextItem = cartItems[nextIndex];
    setDetailTarget({
      productKey: nextItem.productKey,
      selectedSize: nextItem.selectedSize,
    });
  };

  const saveDetailChanges = (details) => {
    if (!detailTarget) {
      return;
    }

    const { productKey: targetKey, selectedSize: targetSize } = detailTarget;

    setCartItems((prev) => {
      const index = prev.findIndex(
        (item) => item.productKey === targetKey && item.selectedSize === targetSize
      );

      if (index === -1) {
        return prev;
      }

      const currentItem = prev[index];
      const updatedItem = {
        ...currentItem,
        selectedSize: details.selectedSize,
        sugarLevel: details.sugarLevel,
        milkOption: details.milkOption,
        extras: details.extras,
      };

      const remaining = prev.filter((_, i) => i !== index);
      const mergeIndex = remaining.findIndex(
        (item) =>
          item.productKey === updatedItem.productKey &&
          item.selectedSize === updatedItem.selectedSize
      );

      if (mergeIndex === -1) {
        return [...remaining, updatedItem];
      }

      return remaining.map((item, i) =>
        i === mergeIndex
          ? {
              ...item,
              quantity: item.quantity + updatedItem.quantity,
              sugarLevel: updatedItem.sugarLevel,
              milkOption: updatedItem.milkOption,
              extras: updatedItem.extras,
            }
          : item
      );
    });

    setCurrentPage("checkout");
    setDetailTarget(null);
  };

  const handleBuyNow = () => {
    if (cartItems.length === 0) {
      return;
    }
    setCurrentPage("checkout");
  };

  const submitOrderToBackend = async (paymentMethod) => {
    try {
      const items = cartItems.map(item => ({
        product_id: item.id,
        size: item.selectedSize?.toLowerCase() || 'medium',
        qty: item.quantity,
        price: item.price || 0
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          total_price: getCartTotal(cartItems),
          payment_type: paymentMethod === 'card' ? 'khqr' : 'cash',
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.queue_number;
      } else {
        console.error('Order failed:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      return null;
    }
  };

  const confirmCheckout = async (paymentMethod = "card") => {
    if (cartItems.length === 0) {
      setCurrentPage("menu");
      return;
    }

    // Submit order to backend
    const queueNumber = await submitOrderToBackend(paymentMethod);
    
    if (queueNumber) {
      setQrOrderNumber(`#A-${queueNumber.toString().padStart(3, '0')}`);
    }

    if (paymentMethod === "card") {
      openQrPayment();
      return;
    }

    setCurrentPage("counter-payment");
  };

  const openQrPayment = () => {
    const randomNumber = Math.floor(Math.random() * 900 + 100);
    setQrOrderNumber(`#A-${randomNumber}`);
    setCurrentPage("qr-payment");
  };

  const activeDetailItem = detailTarget
    ? cartItems.find(
        (item) =>
          item.productKey === detailTarget.productKey &&
          item.selectedSize === detailTarget.selectedSize
      )
    : null;

  const activeDetailIndex = detailTarget
    ? cartItems.findIndex(
        (item) =>
          item.productKey === detailTarget.productKey &&
          item.selectedSize === detailTarget.selectedSize
      )
    : -1;

  return (
    <div className="app-shell">
      {currentPage === "menu" && (
        <Customer
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onCartClick={() => setCurrentPage("cart")}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        />
      )}
      {currentPage === "cart" && (
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
          onDetail={openDetailPage}
          onBuyNow={handleBuyNow}
        />
      )}
      {currentPage === "detail" && activeDetailItem && (
        <Detail
          item={activeDetailItem}
          onBack={() => setCurrentPage("cart")}
          onSave={saveDetailChanges}
          onPrevItem={() => moveDetailTarget(-1)}
          onNextItem={() => moveDetailTarget(1)}
          canGoPrev={activeDetailIndex > 0}
          canGoNext={activeDetailIndex > -1 && activeDetailIndex < cartItems.length - 1}
          detailIndex={activeDetailIndex}
          detailCount={cartItems.length}
        />
      )}
      {currentPage === "checkout" && (
        <Checkout
          cartItems={cartItems}
          onBack={() => setCurrentPage("cart")}
          onConfirmOrder={confirmCheckout}
        />
      )}
      {currentPage === "qr-payment" && (
        <QRpayment
          totalDue={getCartTotal(cartItems)}
          orderNumber={qrOrderNumber}
          onBack={() => setCurrentPage("checkout")}
        />
      )}
      {currentPage === "counter-payment" && (
        <Paymantule
          cartItems={cartItems}
          onDone={() => {
            setCurrentPage("wait");
          }}
        />
      )}
      {currentPage === "wait" && (
        <Wait
          cartItems={cartItems}
          onBack={() => setCurrentPage("counter-payment")}
          onBackToMenu={() => {
            setCartItems([]);
            setCurrentPage("menu");
          }}
        />
      )}
    </div>
  );
}

export default App;
