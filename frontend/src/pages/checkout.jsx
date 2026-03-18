import { useState } from "react";
import { getCartTotal, getItemLineTotal } from "../utils/pricing";
import "../checkout.css";

function Checkout({ cartItems = [], onBack, onConfirmOrder }) {
  const [paymentMethod, setPaymentMethod] = useState("card");

  const total = getCartTotal(cartItems);
  const tax = total * 0.1;
  const finalTotal = total + tax;

  const handleConfirm = () => {
    onConfirmOrder(paymentMethod);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-topbar">
        <button className="checkout-back" type="button" onClick={onBack}>
          {"<"}
        </button>
        <h2>Checkout</h2>
        <div className="checkout-top-spacer" />
      </div>

      <section className="checkout-section">
        <div className="checkout-section-head">
          <h3>Your Order</h3>
          <span>{cartItems.length} items</span>
        </div>
        <div className="checkout-list">
          {cartItems.map((item, index) => (
            <div className="checkout-item" key={`${item.productKey}-${index}`}>
              <img
                className="checkout-item-image"
                src={item.image || "/placeholder.jpg"}
                alt={item.name}
              />
              <div className="checkout-item-main">
                <p className="checkout-item-name">{item.name}</p>
                <p className="checkout-item-meta">
                  {item.selectedSize} • {item.sugarLevel} sugar • {item.milkOption}
                  {item.extras?.extraShot && " • Extra shot"}
                  {item.extras?.whippedCream && " • Whipped cream"}
                  {item.extras?.cinnamonSprinkles && " • Cinnamon"}
                </p>
              </div>
              <p className="checkout-item-price">${getItemLineTotal(item).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="checkout-totals">
          <div>
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div>
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="checkout-total-row">
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <section className="checkout-section">
        <h3>Payment Method</h3>
        <button
          className={`payment-option ${paymentMethod === "card" ? "active" : ""}`}
          type="button"
          onClick={() => setPaymentMethod("card")}
        >
          <div>
            <p>Card / QR Code</p>
            <small>Pay with QR or card</small>
          </div>
          <div className="payment-dot" />
        </button>
        <button
          className={`payment-option ${paymentMethod === "cash" ? "active" : ""}`}
          type="button"
          onClick={() => setPaymentMethod("cash")}
        >
          <div>
            <p>Cash</p>
            <small>Pay at counter</small>
          </div>
          <div className="payment-dot" />
        </button>
      </section>

      <button className="checkout-confirm" type="button" onClick={handleConfirm}>
        CONFIRM ORDER
      </button>
      <p className="checkout-secure">Secure checkout</p>
    </div>
  );
}

export default Checkout;
