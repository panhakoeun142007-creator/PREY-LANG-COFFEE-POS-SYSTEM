import { getCartTotal } from "../utils/pricing";
import "../paymantule.css";

function Paymantule({ cartItems = [], onDone }) {
  const total = getCartTotal(cartItems);
  const finalTotal = total;

  return (
    <div className="paymantule-page">
      <div className="paymantule-card">
        <h1>Pay at Counter</h1>
        
        <div className="paymantule-brand">
          <div className="paymantule-logo">
            <span>C</span>
          </div>
          <strong>Prey Lang Coffee</strong>
          <p>Table 012 - Guest</p>
        </div>

        <div className="paymantule-items">
          {cartItems.map((item, index) => (
            <div className="paymantule-item" key={`${item.productKey}-${index}`}>
              <div className="paymantule-item-icon">{item.quantity}</div>
              <div className="paymantule-item-main">
                <p>{item.name}</p>
                <small>{item.selectedSize} • {item.sugarLevel} sugar • {item.milkOption}</small>
              </div>
              <strong>${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
        </div>

        <div className="paymantule-totals">
          <div className="paymantule-total-row">
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="paymantule-thanks">
          <p>Thank You!</p>
          <small>PLEASE PAY AT THE COUNTER</small>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="paymantule-done" type="button" onClick={onDone}>
            DONE
          </button>
        </div>

      </div>
    </div>
  );
}

export default Paymantule;
