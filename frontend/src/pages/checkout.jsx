import { useMemo, useState } from "react";
import "../checkout.css";
import { getItemUnitPrice } from "../utils/pricing";

const PAYMENT_METHODS = [
  { key: "cash", title: "Cash", subtitle: "Pay at counter", icon: "💵" },
  { key: "aba", title: "ABA Pay", subtitle: "Use ABA mobile banking", icon: "💰" },
  { key: "card", title: "Credit/Debit Card", subtitle: "Ending in **** 4242", icon: "💳" },
];

function getItemLineTotal(item) {
  return getItemUnitPrice(item) * (item.quantity || 1);
}

function getCartTotal(items) {
  return items.reduce((sum, item) => sum + getItemLineTotal(item), 0);
}

function Checkout({ cartItems = [], onBack, onConfirmOrder }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const subtotal = useMemo(() => getCartTotal(cartItems), [cartItems]);
  const TAX_RATE = 0.10;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return (
    <div className="checkout-page">
      <div className="checkout-topbar">
        <button className="checkout-back" onClick={onBack} aria-label="Back to cart">
          {"<"}
        </button>
        <h2>Payment</h2>
        <div className="checkout-top-spacer" />
      </div>

      <section className="checkout-section">
        <div className="checkout-totals">
          <div>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Tax (10%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="checkout-total-row">
            <span>Total Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <h3>Payment Method</h3>
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.key}
            className={paymentMethod === method.key ? "payment-option active" : "payment-option"}
            onClick={() => setPaymentMethod(method.key)}
          >
            <span className="payment-option-icon" aria-hidden="true">
              {method.icon}
            </span>
            <div>
              <p>{method.title}</p>
              <small>{method.subtitle}</small>
            </div>
            <span className="payment-dot" />
          </button>
        ))}
      </section>

      <button
        className="checkout-confirm"
        onClick={() => {
          onConfirmOrder?.(paymentMethod);
        }}
      >
        Confirm Order
      </button>
      <p className="checkout-secure">Secure Checkout</p>
    </div>
  );
}

export default Checkout;
