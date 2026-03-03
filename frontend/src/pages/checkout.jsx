import { useMemo, useState } from "react";
import "../checkout.css";
import { getCartTotal, getItemLineTotal, getItemUnitPrice } from "../utils/pricing";

function Checkout({ cartItems = [], onBack, onConfirmOrder }) {
  const [paymentMethod, setPaymentMethod] = useState("card");

  const subtotal = useMemo(
    () => getCartTotal(cartItems),
    [cartItems]
  );
  const totalAmount = subtotal;
  const itemCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  return (
    <div className="checkout-page">
      <div className="checkout-topbar">
        <button className="checkout-back" onClick={onBack} aria-label="Back to cart">
          {"<"}
        </button>
        <h2>Checkout</h2>
        <div className="checkout-top-spacer" />
      </div>

      <section className="checkout-section">
        <div className="checkout-section-head">
          <h3>Order Summary</h3>
          <span>{itemCount} Items</span>
        </div>

        <div className="checkout-list">
          {cartItems.map((item) => {
            const key = `${item.productKey}-${item.selectedSize}`;
            return (
              <div className="checkout-item" key={key}>
                <img src={item.image} alt={item.name} className="checkout-item-image" />
                <div className="checkout-item-main">
                  <p className="checkout-item-name">{item.name}</p>
                  <p className="checkout-item-meta">
                    {item.quantity > 1
                      ? `Quantity: ${item.quantity} x $${getItemUnitPrice(item).toFixed(2)}`
                      : `${item.selectedSize}, Hot`}
                  </p>
                </div>
                <p className="checkout-item-price">${getItemLineTotal(item).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <div className="checkout-totals">
          <div>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="checkout-total-row">
            <span>Total Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <section className="checkout-section">
        <h3>Payment Method</h3>
        <button
          className={paymentMethod === "card" ? "payment-option active" : "payment-option"}
          onClick={() => setPaymentMethod("card")}
        >
          <div>
            <p>Credit/Debit Card</p>
            <small>Ending in **** 4242</small>
          </div>
          <span className="payment-dot" />
        </button>

        <button
          className={paymentMethod === "counter" ? "payment-option active" : "payment-option"}
          onClick={() => setPaymentMethod("counter")}
        >
          <div>
            <p>Pay at Counter</p>
            <small>Pay in-store with Cash or Mobile</small>
          </div>
          <span className="payment-dot" />
        </button>
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
