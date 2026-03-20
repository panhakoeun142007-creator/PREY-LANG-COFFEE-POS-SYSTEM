import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Customer, { getPriceForSize, getItemUnitPrice } from "./Customer";
import Cart from "./cart";
import Detail from "./Detail";
import Checkout from "./checkout";
import QRpayment from "./QRpayment";
import Paymantule from "./paymantule";
import Wait from "./wait";
import Ready from "./ready";
import "../style/customer-menu.css";

const API_BASE = (() => {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  return raw || "http://127.0.0.1:8000";
})();

const SIZE_MAP = { S: "small", M: "medium", L: "large" };

const STORAGE_KEY = "prey-lang-pos:customer-app-state:v1";

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

function getCartTotal(cartItems) {
  return cartItems.reduce((sum, item) => {
    return sum + getItemUnitPrice(item) * (item.quantity || 1);
  }, 0);
}

function getCartTotalWithTax(cartItems) {
  const subtotal = getCartTotal(cartItems);
  return Math.round(subtotal * 1.10 * 100) / 100;
}

export default function CustomerMenuApp() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const tableName = searchParams.get("name") ?? `Table ${tableId}`;

  const [cartItems, setCartItems] = useState(() => {
    const s = readStoredState();
    if (!Array.isArray(s?.cartItems)) return [];
    // Ensure every cart item has a productKey (handles stale localStorage data)
    return s.cartItems.map((item) => ({
      ...item,
      productKey: item.productKey ?? `${item.id}-${item.name}`,
    }));
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const s = readStoredState();
    return typeof s?.currentPage === "string" ? s.currentPage : "menu";
  });
  const [detailTarget, setDetailTarget] = useState(() => {
    const s = readStoredState();
    const t = s?.detailTarget;
    if (!t || typeof t !== "object") return null;
    if (typeof t.productKey !== "string" || typeof t.selectedSize !== "string") return null;
    // Validate the stored item still exists in cart
    const cart = Array.isArray(s?.cartItems) ? s.cartItems : [];
    const exists = cart.some(
      (i) => i.productKey === t.productKey && i.selectedSize === t.selectedSize
    );
    return exists ? t : null;
  });
  const [qrOrderNumber, setQrOrderNumber] = useState(() => {
    const s = readStoredState();
    return typeof s?.qrOrderNumber === "string" ? s.qrOrderNumber : "#A-000";
  });
  const [lastOrderId, setLastOrderId] = useState(() => {
    const s = readStoredState();
    const value = Number(s?.lastOrderId);
    return Number.isFinite(value) && value > 0 ? value : null;
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("customer-theme") === "dark" ? "dark" : "light";
  });
  const [orderStatus, setOrderStatus] = useState(null);

  useEffect(() => {
    localStorage.setItem("customer-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (cartItems.length === 0 && currentPage !== "menu" && currentPage !== "cart") {
      setCurrentPage("menu");
    }
  }, [cartItems.length, currentPage]);

  useEffect(() => {
    const safePage =
      cartItems.length === 0 && currentPage !== "menu" ? "menu" : currentPage;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cartItems, currentPage: safePage, detailTarget, qrOrderNumber, lastOrderId })
    );
  }, [cartItems, currentPage, detailTarget, qrOrderNumber, lastOrderId]);

  // Store the full item snapshot in detailTarget so lookup never fails
  const activeDetailItem = detailTarget ?? null;

  const activeDetailIndex = detailTarget
    ? cartItems.findIndex(
        (i) =>
          i.productKey === detailTarget.productKey &&
          i.selectedSize === detailTarget.selectedSize
      )
    : -1;

  const effectivePage = (() => {
    if (cartItems.length === 0 && currentPage !== "menu" && currentPage !== "cart") return "menu";
    return currentPage;
  })();

  const handleAddToCart = ({ product, selectedSize, productKey }) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.productKey === productKey && item.selectedSize === selectedSize
    );
    if (existingIndex === -1) {
      if (!window.confirm(`${product.name} (Size: ${selectedSize}) - Add to cart?`)) return;
      setCartItems((prev) => [
        ...prev,
        {
          ...product,
          productKey,
          selectedSize,
          sugarLevel: "100%",
          milkOption: "Whole",
          extras: { extraShot: false, whippedCream: false, cinnamonSprinkles: false },
          quantity: 1,
        },
      ]);
    } else {
      if (!window.confirm(`${product.name} (Size: ${selectedSize}) - Increase quantity?`)) return;
      setCartItems((prev) =>
        prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    }
  };

  const updateCartItemQuantity = (productKey, selectedSize, change) => {
    const item = cartItems.find(
      (i) => i.productKey === productKey && i.selectedSize === selectedSize
    );
    if (!item) return;
    const newQty = Math.max(item.quantity + change, 0);
    let message = "";
    if (newQty === 0 && change < 0) message = `${item.name} (Size: ${selectedSize}) - Remove from cart?`;
    else if (change > 0) message = `${item.name} (Size: ${selectedSize}) - Increase quantity?`;
    else if (change < 0) message = `${item.name} (Size: ${selectedSize}) - Decrease quantity?`;
    if (message && !window.confirm(message)) return;
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.productKey === productKey && i.selectedSize === selectedSize
            ? { ...i, quantity: newQty }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeCartItem = (productKey, selectedSize) => {
    const item = cartItems.find(
      (i) => i.productKey === productKey && i.selectedSize === selectedSize
    );
    if (!item) return;
    if (!window.confirm(`${item.name} (Size: ${selectedSize}) - Remove from cart?`)) return;
    setCartItems((prev) =>
      prev.filter((i) => !(i.productKey === productKey && i.selectedSize === selectedSize))
    );
  };

  const openDetailPage = (productKey, selectedSize) => {
    const item = cartItems.find(
      (i) => i.productKey === productKey && i.selectedSize === selectedSize
    );
    if (!item) return;
    setDetailTarget(item);
    setCurrentPage("detail");
  };

  const moveDetailTarget = (direction) => {
    if (!detailTarget || cartItems.length === 0) return;
    const currentIndex = cartItems.findIndex(
      (i) => i.productKey === detailTarget.productKey && i.selectedSize === detailTarget.selectedSize
    );
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= cartItems.length) return;
    setDetailTarget(cartItems[nextIndex]);
  };

  const saveDetailChanges = (details) => {
    if (!detailTarget) return;
    const targetKey = detailTarget.productKey;
    const targetSize = detailTarget.selectedSize;
    setCartItems((prev) => {
      const index = prev.findIndex(
        (i) => i.productKey === targetKey && i.selectedSize === targetSize
      );
      if (index === -1) return prev;
      const updated = {
        ...prev[index],
        selectedSize: details.selectedSize,
        sugarLevel: details.sugarLevel,
        milkOption: details.milkOption,
        extras: details.extras,
        quantity: Math.max(1, Number(details.quantity ?? prev[index].quantity ?? 1)),
      };
      const remaining = prev.filter((_, i) => i !== index);
      const mergeIndex = remaining.findIndex(
        (i) => i.productKey === updated.productKey && i.selectedSize === updated.selectedSize
      );
      if (mergeIndex === -1) return [...remaining, updated];
      return remaining.map((i, idx) =>
        idx === mergeIndex
          ? { ...i, quantity: i.quantity + updated.quantity, sugarLevel: updated.sugarLevel, milkOption: updated.milkOption, extras: updated.extras }
          : i
      );
    });
    setCurrentPage("cart");
    setDetailTarget(null);
  };

  const submitOrderToBackend = async (paymentMethod) => {
    try {
      const items = cartItems.map((item) => ({
        product_id: item.id,
        size: SIZE_MAP[item.selectedSize?.toUpperCase()] ?? "medium",
        qty: item.quantity,
        price: getItemUnitPrice(item),
      }));

      const response = await fetch(`${API_BASE}/api/customer/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_id: tableId ? Number(tableId) : 1,
          items,
          total_price: getCartTotalWithTax(cartItems),
          payment_type: paymentMethod === "card" ? "khqr" : "cash",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Order failed:", data);
        return null;
      }
      return {
        orderId: data.id ?? null,
        queueNumber: data.queue_number ?? data.id ?? null,
      };
    } catch (error) {
      console.error("Error submitting order:", error);
      return null;
    }
  };

  const confirmCheckout = async (paymentMethod = "card") => {
    if (cartItems.length === 0) { setCurrentPage("menu"); return; }
    const result = await submitOrderToBackend(paymentMethod);
    if (result?.queueNumber) {
      setQrOrderNumber(`#A-${String(result.queueNumber).padStart(3, "0")}`);
    } else {
      setQrOrderNumber(`#A-${Math.floor(Math.random() * 900 + 100)}`);
    }
    if (result?.orderId) {
      setLastOrderId(Number(result.orderId));
    }
    if (paymentMethod === "card") {
      setCurrentPage("qr-payment");
      return;
    }
    setCurrentPage("counter-payment");
  };

  const markOrderPickedUp = async () => {
    if (!lastOrderId) return;
    try {
      await fetch(`${API_BASE}/api/customer/orders/${lastOrderId}/pickup`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error confirming pickup:", error);
    }
  };

  const handleEnjoyCoffee = async () => {
    await markOrderPickedUp();
    setCartItems([]);
    setCurrentPage("menu");
    setLastOrderId(null);
    setQrOrderNumber("#A-000");
    setOrderStatus(null);
  };

  const fetchCustomerOrderStatus = async () => {
    if (!lastOrderId) return;
    try {
      const response = await fetch(`${API_BASE}/api/customer/orders/${lastOrderId}`);
      if (!response.ok) return;
      const data = await response.json();
      const status = typeof data?.status === "string" ? data.status.toLowerCase() : null;
      if (status) setOrderStatus(status);
    } catch (error) {
      console.error("Error fetching order status:", error);
    }
  };

  useEffect(() => {
    if (!lastOrderId) return;
    if (currentPage !== "wait" && currentPage !== "ready") return;
    void fetchCustomerOrderStatus();
    const interval = setInterval(() => {
      void fetchCustomerOrderStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [lastOrderId, currentPage]);

  const canPickUp = orderStatus === "ready" || orderStatus === "completed";
  const pickupHint = orderStatus === "ready"
    ? "Ready for pickup"
    : orderStatus === "preparing"
      ? "Your order is preparing"
      : orderStatus === "pending"
        ? "Order received. Please wait."
        : "Please wait until staff marks your order as READY.";

  return (
    <div className="customer-menu-shell" data-theme={theme}>
      {effectivePage === "menu" && (
        <Customer
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onCartClick={() => setCurrentPage("cart")}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        />
      )}
      {effectivePage === "cart" && (
        <Cart
          cartItems={cartItems}
          onBackToMenu={() => setCurrentPage("menu")}
          onIncrease={(productKey, selectedSize) => updateCartItemQuantity(productKey, selectedSize, 1)}
          onDecrease={(productKey, selectedSize) => updateCartItemQuantity(productKey, selectedSize, -1)}
          onRemove={removeCartItem}
          onDetail={openDetailPage}
          onBuyNow={() => setCurrentPage("checkout")}
        />
      )}
      {effectivePage === "detail" && (
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
      {effectivePage === "checkout" && (
        <Checkout
          cartItems={cartItems}
          onBack={() => setCurrentPage("cart")}
          onConfirmOrder={confirmCheckout}
        />
      )}
      {effectivePage === "qr-payment" && (
        <QRpayment
          totalDue={getCartTotalWithTax(cartItems)}
          orderNumber={qrOrderNumber}
          onBack={() => setCurrentPage("wait")}
        />
      )}
      {effectivePage === "counter-payment" && (
        <Paymantule
          cartItems={cartItems}
          onDone={() => setCurrentPage("wait")}
        />
      )}
      {effectivePage === "wait" && (
        <Wait
          cartItems={cartItems}
          onBack={() => setCurrentPage("counter-payment")}
          onPickUpNow={() => {
            if (!canPickUp) {
              window.alert("Please wait. Staff has not marked your order as READY yet.");
              return;
            }
            setCurrentPage("ready");
          }}
          onBackToMenu={() => { setCartItems([]); setCurrentPage("menu"); }}
          canPickUp={canPickUp}
          pickupHint={pickupHint}
        />
      )}
      {effectivePage === "ready" && (
        <Ready
          tableNumber={tableName}
          onBack={() => setCurrentPage("wait")}
          onEnjoyCoffee={() => { void handleEnjoyCoffee(); }}
        />
      )}
    </div>
  );
}
