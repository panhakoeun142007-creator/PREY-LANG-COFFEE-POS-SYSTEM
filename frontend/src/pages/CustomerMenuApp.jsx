import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createCustomerOrder,
  fetchCustomerOrderStatus,
  markCustomerOrderPickedUp,
} from "../services/api";
import { useSettings } from "../context/SettingsContext";
import Customer from "./Customer";
import { getItemUnitPrice } from "../utils/pricing";
import Cart from "./cart";
import Detail from "./Detail";
import Checkout from "./checkout";
import QRpayment from "./QRpayment";
import Paymantule from "./paymantule";
import Ready from "./ready";
import OrderConfirmed from "./OrderConfirmed";
import "../style/customer-menu.css";

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
  const [lastAdded, setLastAdded] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [cancellationMessage, setCancellationMessage] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState(() => {
    const s = readStoredState();
    return typeof s?.pendingPaymentMethod === "string" ? s.pendingPaymentMethod : null;
  });
  const [cartSnapshot, setCartSnapshot] = useState(null);

  const { settings } = useSettings();
  const receiptSettings = settings?.receipt;

  useEffect(() => {
    localStorage.setItem("customer-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = setTimeout(() => setLastAdded(null), 2000);
    return () => clearTimeout(timer);
  }, [lastAdded]);

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
      JSON.stringify({
        cartItems,
        currentPage: safePage,
        detailTarget,
        qrOrderNumber,
        lastOrderId,
        pendingPaymentMethod,
      })
    );
  }, [cartItems, currentPage, detailTarget, qrOrderNumber, lastOrderId, pendingPaymentMethod]);

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

  const handleAddToCart = ({ product, selectedSize, productKey }, { openDetail = false } = {}) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.productKey === productKey && item.selectedSize === selectedSize
    );
    let detailPayload;
    if (existingIndex === -1) {
      detailPayload = {
        ...product,
        productKey,
        selectedSize,
        sugarLevel: "100%",
        milkOption: "Whole",
        extras: { extraShot: false, whippedCream: false, cinnamonSprinkles: false },
        quantity: 1,
      };
      setCartItems((prev) => [...prev, detailPayload]);
    } else {
      detailPayload = {
        ...cartItems[existingIndex],
        quantity: cartItems[existingIndex].quantity + 1,
      };
      setCartItems((prev) =>
        prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    }
    const productName = detailPayload?.name || product?.name || productKey;
    setLastAdded(productName);
    alert(`${productName} added to cart`);
    if (openDetail) {
      setDetailTarget(detailPayload);
      setCurrentPage("detail");
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

  const handleCartIconClick = () => {
    if (cartItems.length === 0) {
      setCurrentPage("cart");
      return;
    }
    const lastItem = cartItems[cartItems.length - 1];
    openDetailPage(lastItem.productKey, lastItem.selectedSize);
  };

  const handleDetailAddMore = () => {
    setDetailTarget(null);
    setCurrentPage("menu");
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

      const data = await createCustomerOrder({
        table_id: tableId ? Number(tableId) : 1,
        items,
        total_price: getCartTotalWithTax(cartItems),
        payment_type: paymentMethod === "card" ? "khqr" : "cash",
      });
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
    const subtotal = getCartTotal(cartItems);
    const TAX_RATE = 0.10;
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const snapshotItems = cartItems.map((item) => {
      const qty = item.quantity || 1;
      const unitPrice = getItemUnitPrice(item);
      return {
        name: item.name,
        size: item.selectedSize,
        quantity: qty,
        unitPrice,
        lineTotal: unitPrice * qty,
      };
    });
    setCartSnapshot({ items: snapshotItems, subtotal, taxAmount, total: totalAmount, paymentType: paymentMethod });
    const result = await submitOrderToBackend(paymentMethod);
    if (result?.queueNumber) {
      setQrOrderNumber(`#A-${String(result.queueNumber).padStart(3, "0")}`);
    } else {
      setQrOrderNumber(`#A-${Math.floor(Math.random() * 900 + 100)}`);
    }
    if (result?.orderId) {
      setLastOrderId(Number(result.orderId));
    }
    setOrderStatus("pending");
    setPendingPaymentMethod(paymentMethod);
    setPaymentCompleted(false);
    if (paymentMethod === "card" || paymentMethod === "aba") {
      setCurrentPage("qr-payment");
      return;
    }
    setCurrentPage("order-confirmed");
  };

  const markOrderPickedUp = async () => {
    if (!lastOrderId) return;
    try {
      await markCustomerOrderPickedUp(lastOrderId);
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
    setPendingPaymentMethod(null);
    setCartSnapshot(null);
  };

  const handleContinueToPayment = () => {
    if (!pendingPaymentMethod) return;
    if (pendingPaymentMethod === "card") {
      setCurrentPage("qr-payment");
    } else {
      setCurrentPage("counter-payment");
    }
    setPendingPaymentMethod(null);
  };

  const handleQRPaymentComplete = () => {
    setPaymentCompleted(true);
    setPendingPaymentMethod(null);
    setCurrentPage("order-confirmed");
  };

  useEffect(() => {
    if (!lastOrderId) {
      setOrderStatus(null);
      return;
    }
    let active = true;

    const loadOrderStatus = async () => {
      try {
        const data = await fetchCustomerOrderStatus(lastOrderId);
        if (!active) return;
        setOrderStatus(
          typeof data?.status === "string" ? data.status.toLowerCase() : "pending"
        );
        // Get cancellation message if order is cancelled
        if (data?.status?.toLowerCase() === "cancelled") {
          setCancellationMessage(data.cancellation_message || "Sorry For Your Order Now We're not available");
        } else {
          setCancellationMessage(null);
        }
      } catch (error) {
        console.error("Error fetching order status:", error);
      }
    };

    void loadOrderStatus();
    const interval = setInterval(() => {
      void loadOrderStatus();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [lastOrderId]);

  useEffect(() => {
    // Only navigate to ready page if order is completed successfully (not cancelled)
    if (orderStatus === "ready" || orderStatus === "completed") {
      setCurrentPage("ready");
    }
    // Handle cancelled orders - show message but stay on order-confirmed page
    // Do NOT show payment receipt for cancelled orders
    if (orderStatus === "cancelled") {
      setCancellationMessage((prev) => prev || "Sorry For Your Order Now We're not available");
      // Don't navigate away - keep them on order-confirmed page with cancellation message
    }
  }, [orderStatus]);

  const ORDER_STAGE_MAP = {
    pending: 0,
    preparing: 1,
    ready: 2,
    completed: 3,
  };
  const currentStage =
    orderStatus && ORDER_STAGE_MAP.hasOwnProperty(orderStatus)
      ? ORDER_STAGE_MAP[orderStatus]
      : 0;

  return (
    <div className="customer-menu-shell" data-theme={theme}>
      {effectivePage === "menu" && (
        <Customer
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onCartClick={handleCartIconClick}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          lastAdded={lastAdded}
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
          onAddMore={handleDetailAddMore}
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
      {effectivePage === "order-confirmed" && (
        <OrderConfirmed
          orderNumber={qrOrderNumber}
          estimatedMinutes={8}
          onContinuePayment={
            !paymentCompleted && pendingPaymentMethod === "cash"
              ? handleContinueToPayment
              : undefined
          }
          onTrackStatus={() => setCurrentPage("ready")}
          onBackToMenu={() => {
            setCartItems([]);
            setCurrentPage("menu");
          }}
          currentStage={currentStage}
          cancellationMessage={cancellationMessage}
        />
      )}
      {effectivePage === "qr-payment" && (
        <QRpayment
          totalDue={getCartTotalWithTax(cartItems)}
          orderNumber={qrOrderNumber}
          paymentMethod={pendingPaymentMethod ?? "card"}
          onBack={() => setCurrentPage("checkout")}
          onPaymentComplete={handleQRPaymentComplete}
        />
      )}
      {effectivePage === "counter-payment" && (
        <Paymantule
          cartItems={cartItems}
          onDone={() => setCurrentPage("order-confirmed")}
        />
      )}
      {effectivePage === "ready" && (
        <Ready
          tableNumber={tableName}
          onBack={() => setCurrentPage("order-confirmed")}
          onEnjoyCoffee={() => { void handleEnjoyCoffee(); }}
          snapshot={cartSnapshot}
          receiptSettings={receiptSettings}
        />
      )}
    </div>
  );
}
