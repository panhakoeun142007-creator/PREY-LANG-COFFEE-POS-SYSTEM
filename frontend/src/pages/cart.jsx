import "../cart.css";
import { getItemUnitPrice } from "./Customer";

function getItemLineTotal(item) {
  return getItemUnitPrice(item) * (item.quantity || 1);
}
function getCartTotal(items) {
  return items.reduce((sum, item) => sum + getItemLineTotal(item), 0);
}

function Cart({
  cartItems = [],
  onBackToMenu,
  onDecrease,
  onIncrease,
  onRemove,
  onDetail,
  onBuyNow,
}) {
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = getCartTotal(cartItems);

  return (
    <div className="cart-page">
      <div className="cart-topbar">
        <button className="cart-back-icon" onClick={onBackToMenu} aria-label="">
          {"<"}
        </button>
        <h2>Shopping Cart</h2>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-list">
          <div className="empty-cart-message" style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "30px" }}>Your cart is empty</p>
          </div>

          <div className="cart-summary">
            <p>Items: {totalItems}</p>
            <p>Total: ${subtotal.toFixed(2)}</p>
          </div>
          <button className="buy-btn" onClick={onBuyNow} disabled>
            Buy Now
          </button>
        </div>
      ) : (
        <div className="cart-list">
          {cartItems.map((item) => {
            const itemId = `${item.productKey}-${item.selectedSize}`;

            return (
              <div className="cart-item" key={itemId}>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>Size: {item.selectedSize}</p>
                  <div className="cart-item-quantity">
                    <button
                      type="button"
                      onClick={() => onDecrease?.(item.productKey, item.selectedSize)}
                      className="cart-qty-btn"
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1}
                    >
                      –
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onIncrease?.(item.productKey, item.selectedSize)}
                      className="cart-qty-btn"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item-right">
                  <p className="cart-item-price">${getItemLineTotal(item).toFixed(2)}</p>
                  <div className="cart-item-actions">
                    <button
                      className="detail-btn"
                      onClick={() => onDetail?.(item.productKey, item.selectedSize)}
                    >
                      Detail
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => onRemove(item.productKey, item.selectedSize)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="cart-summary">
            <p>Items: {totalItems}</p>
            <p>Total: ${subtotal.toFixed(2)}</p>
          </div>
          <button className="buy-btn" onClick={onBuyNow}>
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;

