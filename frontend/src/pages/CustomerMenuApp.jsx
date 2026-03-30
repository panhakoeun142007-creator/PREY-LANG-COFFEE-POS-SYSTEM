import { useCallback, useEffect, useMemo, useState } from "react";
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
const TAX_PER_ITEM = 0.25;

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
  const totalItems = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  const taxAmount = Math.round(totalItems * TAX_PER_ITEM * 100) / 100;
  return Math.round((subtotal + taxAmount) * 100) / 100;
}

export default function CustomerMenuApp() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const tableName = searchParams.get("name") ?? `Table ${tableId}`;

  const [cartItems, setCartItems] = useState(() => {
    const s = readStoredState();
    if (!Array.isArray(s?.cartItems)) return [];
    // Ensure every cart item has a productKey (handles stale localStorage data)
    const now = Date.now();
    return s.cartItems.map((item, idx) => ({
      ...item,
      productKey: item.productKey ?? `${item.id}-${item.name}`,
      // Preserve original ordering across edits/merges.
      addedAt: typeof item.addedAt === "number" ? item.addedAt : now + idx,
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
  const [cancellationMessage, setCancellationMessage] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(() => {
    const s = readStoredState();
    return Boolean(s?.paymentCompleted);
  });
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState(() => {
    const s = readStoredState();
    return typeof s?.pendingPaymentMethod === "string" ? s.pendingPaymentMethod : null;
  });
  const [cartSnapshot, setCartSnapshot] = useState(() => {
    const s = readStoredState();
    const snap = s?.cartSnapshot;
    return snap && typeof snap === "object" ? snap : null;
  });
  const [detailDrafts, setDetailDrafts] = useState(() => {
    const s = readStoredState();
    return s && typeof s?.detailDrafts === "object" && s.detailDrafts ? s.detailDrafts : {};
  });

  const { settings } = useSettings();
  const receiptSettings = settings?.receipt;
  const cartRequiredPages = useMemo(
    () => new Set(["detail", "checkout", "qr-payment", "counter-payment"]),
    [],
  );

  useEffect(() => {
    localStorage.setItem("customer-theme", theme);
  }, [theme]);

  useEffect(() => {
    const safePage =
      cartItems.length === 0 && cartRequiredPages.has(currentPage) ? "menu" : currentPage;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cartItems,
        currentPage: safePage,
        detailTarget,
        qrOrderNumber,
        lastOrderId,
        cartSnapshot,
        paymentCompleted,
        pendingPaymentMethod,
        detailDrafts,
      })
    );
  }, [cartItems, currentPage, cartRequiredPages, detailTarget, qrOrderNumber, lastOrderId, cartSnapshot, paymentCompleted, pendingPaymentMethod, detailDrafts]);

  // Store the full item snapshot in detailTarget so lookup never fails
  const activeDetailItem = detailTarget ?? null;

  const effectivePage = (() => {
    if (cartItems.length === 0 && cartRequiredPages.has(currentPage)) return "menu";
    return currentPage;
  })();

  const detailSequence = useMemo(() => {
    // Show products in the order the customer first added them.
    return [...cartItems].sort((a, b) => {
      const aa = typeof a.addedAt === "number" ? a.addedAt : Number.MAX_SAFE_INTEGER;
      const bb = typeof b.addedAt === "number" ? b.addedAt : Number.MAX_SAFE_INTEGER;
      return aa - bb;
    });
  }, [cartItems]);

  const activeDetailIndex = useMemo(() => {
    if (!detailTarget) return -1;
    return detailSequence.findIndex(
      (i) =>
        i.productKey === detailTarget.productKey &&
        i.selectedSize === detailTarget.selectedSize
    );
  }, [detailSequence, detailTarget]);

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
        addedAt: Date.now(),
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
      // If there is a previous order, keep the cart icon focused on tracking/receipt.
      if (lastOrderId && orderStatus !== "cancelled") {
        setCurrentPage(
          orderStatus === "completed" || orderStatus === "ready" ? "ready" : "order-confirmed"
        );
        return;
      }
      setCurrentPage("cart");
      return;
    }
    const firstItem = detailSequence[0];
    if (!firstItem) return;
    setDetailTarget(firstItem);
    setCurrentPage("detail");
  };

  const handleDetailAddMore = () => {
    setDetailTarget(null);
    setCurrentPage("menu");
  };

  const moveDetailTarget = (direction) => {
    if (!detailTarget || detailSequence.length === 0) return;
    const currentIndex = detailSequence.findIndex(
      (i) => i.productKey === detailTarget.productKey && i.selectedSize === detailTarget.selectedSize
    );
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= detailSequence.length) return;
    setDetailTarget(detailSequence[nextIndex]);
  };

  const applyDetailUpdate = (items, targetKey, targetSize, details) => {
    const index = items.findIndex(
      (i) => i.productKey === targetKey && i.selectedSize === targetSize
    );
    if (index === -1) return items;

    const updated = {
      ...items[index],
      selectedSize: details.selectedSize,
      sugarLevel: details.sugarLevel,
      milkOption: details.milkOption,
      extras: details.extras,
      quantity: details.quantity ?? items[index].quantity ?? 1,
    };

    if ((updated.quantity ?? 0) === 0) {
      return items.filter(
        (i) => !(i.productKey === targetKey && i.selectedSize === targetSize)
      );
    }

    const mergeIndex = items.findIndex(
      (i, idx) =>
        idx !== index &&
        i.productKey === updated.productKey &&
        i.selectedSize === updated.selectedSize
    );
    if (mergeIndex > -1) {
      return items
        .map((item, idx) => {
          if (idx === index) return null;
          if (idx === mergeIndex) {
            const existingQty = item.quantity ?? 1;
            return {
              ...item,
              quantity: existingQty + (updated.quantity ?? 1),
              addedAt: Math.min(
                typeof item.addedAt === "number" ? item.addedAt : Number.MAX_SAFE_INTEGER,
                typeof updated.addedAt === "number" ? updated.addedAt : Number.MAX_SAFE_INTEGER
              ),
              sugarLevel: updated.sugarLevel,
              milkOption: updated.milkOption,
              extras: updated.extras,
            };
          }
          return item;
        })
        .filter(Boolean);
    }

    return items.map((item, idx) => (idx === index ? updated : item));
  };

  const saveDetailChanges = (details) => {
    if (!detailTarget) return;

    // Save all pending draft changes (from prev/next navigation), then go to My Cart.
    setCartItems((prev) => {
      let next = prev;

      const drafts = detailDrafts && typeof detailDrafts === "object" ? detailDrafts : {};
      for (const [key, draft] of Object.entries(drafts)) {
        if (!draft) continue;
        const sep = key.indexOf("::");
        if (sep === -1) continue;
        const k = key.slice(0, sep);
        const s = key.slice(sep + 2);
        next = applyDetailUpdate(next, k, s, draft);
      }

      // Also apply the current detail screen values (covers "Save immediately" before draft effect runs).
      next = applyDetailUpdate(next, detailTarget.productKey, detailTarget.selectedSize, details);
      return next;
    });

    setDetailDrafts({});
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
    const totalItems = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
    const taxAmount = Math.round(totalItems * TAX_PER_ITEM * 100) / 100;
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
    setCartSnapshot({
      items: snapshotItems,
      subtotal,
      taxAmount,
      total: totalAmount,
      paymentType: paymentMethod,
      taxPerItem: TAX_PER_ITEM,
      taxItemCount: totalItems,
    });
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

  const resetCustomerOrderFlow = useCallback(() => {
    setLastOrderId(null);
    setQrOrderNumber("#A-000");
    setOrderStatus(null);
    setCancellationMessage(null);
    setPendingPaymentMethod(null);
    setPaymentCompleted(false);
    setCartSnapshot(null);
  }, []);

  const refreshOrderStatus = useCallback(async (shouldApply = () => true) => {
    if (!lastOrderId) return;
    try {
      const data = await fetchCustomerOrderStatus(lastOrderId);
      if (!shouldApply()) return;
      const nextStatus = typeof data?.status === "string" ? data.status.toLowerCase() : "pending";
      setOrderStatus(nextStatus);

      if (nextStatus === "cancelled") {
        setCancellationMessage(
          data.cancellation_message || "Sorry For Your Order Now We're not available"
        );
      } else {
        setCancellationMessage(null);
      }

      // When staff/admin finishes the order (ready), show the receipt to the customer.
      // Also show it if the order is already completed.
      if (nextStatus === "ready" || nextStatus === "completed") {
        setCurrentPage((prev) => {
          // Don't interrupt in-progress payment screens.
          if (prev === "qr-payment" || prev === "counter-payment") return prev;
          return prev === "ready" ? prev : "ready";
        });
      }
    } catch (error) {
      console.error("Error fetching order status:", error);
    }
  }, [lastOrderId]);

  useEffect(() => {
    if (!lastOrderId) return;
    let active = true;

    const loadOrderStatus = async () => {
      await refreshOrderStatus(() => active);
    };

    void loadOrderStatus();
    const interval = setInterval(() => {
      if (!active) return;
      void loadOrderStatus();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [lastOrderId, refreshOrderStatus]);

  const ORDER_STAGE_MAP = {
    pending: 0,
    preparing: 1,
    ready: 2,
    completed: 3,
  };
  const currentStage =
    orderStatus && Object.prototype.hasOwnProperty.call(ORDER_STAGE_MAP, orderStatus)
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
          key={activeDetailItem ? `${activeDetailItem.productKey}-${activeDetailItem.selectedSize}` : "detail"}
          item={activeDetailItem}
          draft={
            detailTarget
              ? detailDrafts?.[`${detailTarget.productKey}::${detailTarget.selectedSize}`] ?? null
              : null
          }
          onDraftChange={(nextDraft) => {
            if (!detailTarget) return;
            const k = `${detailTarget.productKey}::${detailTarget.selectedSize}`;
            setDetailDrafts((prev) => {
              const base = prev && typeof prev === "object" ? prev : {};
              if (!nextDraft) {
                if (!Object.prototype.hasOwnProperty.call(base, k)) return base;
                const next = { ...base };
                delete next[k];
                return next;
              }
              return { ...base, [k]: nextDraft };
            });
          }}
          hasAnyDrafts={Object.keys(detailDrafts || {}).length > 0}
          onBack={() => setCurrentPage("cart")}
          onSave={saveDetailChanges}
          onAddMore={handleDetailAddMore}
          onPrevItem={() => moveDetailTarget(-1)}
          onNextItem={() => moveDetailTarget(1)}
          canGoPrev={activeDetailIndex > 0}
          canGoNext={activeDetailIndex > -1 && activeDetailIndex < detailSequence.length - 1}
          detailIndex={activeDetailIndex}
          detailCount={detailSequence.length}
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
          onTrackStatus={() => { void refreshOrderStatus(); }}
          onBackToMenu={() => {
            const isCancelled =
              orderStatus === "cancelled" ||
              (typeof cancellationMessage === "string" && cancellationMessage.trim() !== "");

            setCartItems([]);
            setDetailDrafts({});
            setDetailTarget(null);

            if (isCancelled) {
              resetCustomerOrderFlow();
            }

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
