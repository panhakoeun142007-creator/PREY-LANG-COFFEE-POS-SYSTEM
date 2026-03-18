import "../cart.css";
import { getCartTotal, getItemLineTotal } from "../utils/pricing";

function Cart({
  cartItems = [],
  onBackToMenu,

  onRemove,
  onBuyNow,
  onViewDetails = () => {},
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
          {cartItems.map((item, index) => {
            const itemId = `${item.productKey}-${item.selectedSize}-${index}`;

            return (
              <div className="cart-item" key={itemId}>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>Size: {item.selectedSize}</p>
                </div>
                <div className="cart-item-right">
                  <p className="cart-item-price">${getItemLineTotal(item).toFixed(2)}</p>
                  <div className="cart-item-actions">
                    <button
                      type="button"
                      className="detail-btn"
                      onClick={() => onViewDetails(index)}
                    >
                      Detail
                    </button>
                    <button
                      type="button"
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

