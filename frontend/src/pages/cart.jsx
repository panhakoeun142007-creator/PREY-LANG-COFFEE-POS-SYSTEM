import "../cart.css";
import { getItemUnitPrice } from "../utils/pricing";

const TAX_PER_ITEM = 0.25;

function getItemLineTotal(item) {
  return getItemUnitPrice(item) * (item.quantity || 1);
}
function getCartTotal(items) {
  return items.reduce((sum, item) => sum + getItemLineTotal(item), 0);
}

function Cart({
  cartItems = [],
  onBackToMenu,

  onRemove,
  onBuyNow,
}) {
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = getCartTotal(cartItems);
  const taxAmount = Math.round(totalItems * TAX_PER_ITEM * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return (
    <div className="cart-page">
      <div className="cart-topbar">
        <button className="cart-back-icon" onClick={onBackToMenu} aria-label="Back to menu">
          {"<"}
        </button>
        <h2>My Cart</h2>
        <div className="cart-topbar-spacer" aria-hidden="true" />
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-list">
          <div className="empty-cart-message">
            <p className="empty-cart-title">Your cart is empty</p>
          </div>

          <div className="cart-totals">
            <div className="cart-summary">
              <p>Items: {totalItems}</p>
              <p>Total: ${totalAmount.toFixed(2)}</p>
            </div>
            <div className="cart-costs">
              <div>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span>Tax ($0.25/item)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="cart-total-row">
                <span>Total Amount</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button className="buy-btn" onClick={onBuyNow} disabled>
            Order Now
          </button>
        </div>
      ) : (
        <div className="cart-list">
          {cartItems.map((item) => {
            const itemId = `${item.productKey}-${item.selectedSize}`;
            const qty = item.quantity || 1;
            const unitPrice = getItemUnitPrice(item);
            const lineTotal = unitPrice * qty;

            return (
              <div className="cart-item" key={itemId}>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>Size: {item.selectedSize}</p>
                  {Object.entries(item.extras || {}).map(
                    ([k, v]) =>
                      v && (
                        <p className="cart-item-extra" key={k}>
                          {k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </p>
                      )
                  )}
                </div>
                <div className="cart-item-right">
                  <p className="cart-item-price">${lineTotal.toFixed(2)}</p>
                  <div className="cart-item-actions">
                    <button
                      className="remove-btn"
                      onClick={() => onRemove(item.productKey, item.selectedSize)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="cart-totals">
            <div className="cart-summary">
              <p>Items: {totalItems}</p>
              <p>Total: ${totalAmount.toFixed(2)}</p>
            </div>
            <div className="cart-costs">
              <div>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span>Tax ($0.25/item)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="cart-total-row">
                <span>Total Amount</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button className="buy-btn" onClick={onBuyNow}>
            Order Now
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
