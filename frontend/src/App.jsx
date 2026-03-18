import { useEffect, useState } from "react";
import Customer from "./pages/Customer";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import QRpayment from "./pages/QRpayment";
import Paymantule from "./pages/paymantule";
import Wait from "./pages/wait";
import Ready from "./pages/ready";
import Detail from "./pages/Detail";
import ConfirmDialog from "./components/ConfirmDialog";
import { getCartTotal } from "./utils/pricing";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "");
const PROD_FALLBACK_API_BASE_URL = "http://127.0.0.1:8000";
const getApiBaseUrl = () => {
  if (API_BASE_URL) {
    return API_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return PROD_FALLBACK_API_BASE_URL;
  }
  return PROD_FALLBACK_API_BASE_URL;
};

const APP_STATE_STORAGE_KEY = "prey-lang-pos:app-state:v1";

const readStoredAppState = () => {
  try {
    const rawState = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!rawState) {
      return null;
    }

    const parsed = JSON.parse(rawState);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

function App() {
  const [cartItems, setCartItems] = useState(() => {
    const storedState = readStoredAppState();
    return Array.isArray(storedState?.cartItems) ? storedState.cartItems : [];
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const storedState = readStoredAppState();
    return typeof storedState?.currentPage === "string" ? storedState.currentPage : "menu";
  });
  const [qrOrderNumber, setQrOrderNumber] = useState(() => {
    const storedState = readStoredAppState();
    return typeof storedState?.qrOrderNumber === "string" ? storedState.qrOrderNumber : "#A-000";
  });
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });
  const [detailIndex, setDetailIndex] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setDetailIndex((prev) => {
      if (cartItems.length === 0) {
        return 0;
      }
      return Math.min(prev, cartItems.length - 1);
    });
  }, [cartItems.length]);

  // Reset to menu page when cart becomes empty, but allow cart page to show empty state
  useEffect(() => {
    if (cartItems.length === 0 && currentPage !== "menu" && currentPage !== "cart") {
      setCurrentPage("menu");
    }
  }, [cartItems.length, currentPage]);

  useEffect(() => {
    const safePage = cartItems.length === 0 && currentPage !== "menu" ? "menu" : currentPage;

    localStorage.setItem(
      APP_STATE_STORAGE_KEY,
      JSON.stringify({
        cartItems,
        currentPage: safePage,
        qrOrderNumber,
      })
    );
  }, [cartItems, currentPage, qrOrderNumber]);

  const effectivePage = cartItems.length === 0 && currentPage !== "menu" && currentPage !== "cart" ? "menu" : currentPage;
  const detailItem = cartItems[detailIndex];

  const handleAddToCart = ({ product, selectedSize, productKey }) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.productKey === productKey && item.selectedSize === selectedSize
    );

    if (existingIndex === -1) {
      const confirmed = window.confirm(`${product.name} (Size: ${selectedSize}) - Add to cart?`);
      if (!confirmed) return;
      
      setCartItems((prev) => [
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
      ]);
    } else {
      const confirmed = window.confirm(`${product.name} (Size: ${selectedSize}) - Increase quantity?`);
      if (!confirmed) return;
      
      setCartItems((prev) =>
        prev.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    }
  };

  const updateCartItemQuantity = (productKey, selectedSize, change) => {
    const item = cartItems.find(
      (item) => item.productKey === productKey && item.selectedSize === selectedSize
    );
    if (!item) return;

    const newQuantity = Math.max(item.quantity + change, 0);
    let message = "";
    
    if (newQuantity === 0 && change < 0) {
      message = `${item.name} (Size: ${selectedSize}) - Remove from cart?`;
    } else if (change > 0) {
      message = `${item.name} (Size: ${selectedSize}) - Increase quantity?`;
    } else if (change < 0) {
      message = `${item.name} (Size: ${selectedSize}) - Decrease quantity?`;
    }

    if (message) {
      const confirmed = window.confirm(message);
      if (!confirmed) return;
    }

    setCartItems((prev) =>
      prev
        .map((item) =>
          item.productKey === productKey && item.selectedSize === selectedSize
            ? { ...item, quantity: newQuantity }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (productKey, selectedSize) => {
    const itemToRemove = cartItems.find(
      (item) => item.productKey === productKey && item.selectedSize === selectedSize
    );
    if (!itemToRemove) return;

    const confirmed = window.confirm(`${itemToRemove.name} (Size: ${selectedSize}) - Remove from cart?`);
    if (!confirmed) return;

    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.productKey === productKey && item.selectedSize === selectedSize)
      )
    );
  };

  const openDetailForItem = (index) => {
    if (!cartItems[index]) {
      return;
    }
    setDetailIndex(index);
    setCurrentPage("detail");
  };

  const closeDetail = () => {
    setCurrentPage("cart");
  };

  const handleDetailSave = (updates) => {
    setCartItems((prev) =>
      prev.map((item, idx) => (idx === detailIndex ? { ...item, ...updates } : item))
    );
  };

  const goToPrevDetail = () => {
    setDetailIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNextDetail = () => {
    setDetailIndex((prev) => {
      const maxIndex = Math.max(cartItems.length - 1, 0);
      return Math.min(prev + 1, maxIndex);
    });
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

      const response = await fetch(`${getApiBaseUrl()}/api/orders`, {
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

  return (
    <div className="app-shell">
      {effectivePage === "menu" && (
        <Customer
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onCartClick={() => {
            // Always navigate to cart, showing empty state or items
            setCurrentPage("cart");
          }}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        />
      )}
      {effectivePage === "cart" && (
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
          onViewDetails={openDetailForItem}
          onBuyNow={handleBuyNow}
        />
      )}
      {effectivePage === "detail" && detailItem && (
        <Detail
          item={detailItem}
          detailIndex={detailIndex}
          detailCount={cartItems.length}
          onBack={closeDetail}
          onSave={handleDetailSave}
          onPrevItem={goToPrevDetail}
          onNextItem={goToNextDetail}
          canGoPrev={detailIndex > 0}
          canGoNext={detailIndex < cartItems.length - 1}
        />
      )}
      {effectivePage === "checkout" && (
        <Checkout
          cartItems={cartItems}
          onBack={() => setCurrentPage("cart")}
          onConfirmOrder={confirmCheckout}
        />
      )}
      {effectivePage === "qr-payment" && (
        <QRpayment
          totalDue={getCartTotal(cartItems)}
          orderNumber={qrOrderNumber}
          onBack={() => setCurrentPage("wait")}
        />
      )}
      {effectivePage === "counter-payment" && (
        <Paymantule
          cartItems={cartItems}
          onDone={() => {
            setCurrentPage("wait");
          }}
        />
      )}
      {effectivePage === "wait" && (
        <Wait
          cartItems={cartItems}
          onBack={() => setCurrentPage("counter-payment")}
          onPickUpNow={() => {
            setCurrentPage("ready");
          }}
          onBackToMenu={() => {
            setCartItems([]);
            setCurrentPage("menu");
          }}
        />
      )}
      {effectivePage === "ready" && (
        <Ready
          tableNumber="012"
          onBack={() => setCurrentPage("wait")}
          onEnjoyCoffee={() => {
            setCartItems([]);
            setCurrentPage("menu");
          }}
        />
      )}
    </div>
  );
}

export default App;
