import { useMemo } from "react";
import "../paymantule.css";
import { getItemUnitPrice } from "../utils/pricing";

function getItemLineTotal(item) {
  return getItemUnitPrice(item) * (item.quantity || 1);
}
function getCartTotal(items) {
  return items.reduce((sum, item) => sum + getItemLineTotal(item), 0);
}

function Paymantule({ cartItems = [], onDone }) {
  const subtotal = useMemo(
    () => getCartTotal(cartItems),
    [cartItems]
  );
  const taxAmount = Math.round(subtotal * 0.10 * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return (
    <div className="paymantule-page">
      <div className="paymantule-card">
        <h2>Your Payment</h2>

        <div className="paymantule-brand">
          <div className="paymantule-logo" aria-hidden="true">
            <span>C</span>
          </div>
          <strong>MAKARA COFFEE</strong>
          <p>Street 123, Phnom Penh</p>
          <p>Tel : 012 345 678</p>
        </div>

        <div className="paymantule-items">
          {cartItems.map((item) => {
            const key = `${item.productKey}-${item.selectedSize}`;
            return (
              <div className="paymantule-item" key={key}>
                <div className="paymantule-item-icon" aria-hidden="true">
                  <span>{item.name[0]}</span>
                </div>
                <div className="paymantule-item-main">
                  <p>{item.name}</p>
                  <small>
                    {item.quantity} x ${getItemUnitPrice(item).toFixed(2)}
                  </small>
                </div>
                <strong>${getItemLineTotal(item).toFixed(2)}</strong>
              </div>
            );
          })}
        </div>

        <div className="paymantule-totals">
          <div>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Tax (10%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="paymantule-total-row">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="paymantule-thanks">
          <p>Thank You &lt;3</p>
          <small>SEE YOU AGAIN SOON</small>
        </div>
      </div>

      <button className="paymantule-done" onClick={onDone}>
       Wait to your coffee
      </button>
    </div>
  );
}

export default Paymantule;
