import "../cart.css";
import { getCartTotal, getItemLineTotal } from "../utils/pricing";

function Cart({
  cartItems = [],
  onBackToMenu,
  onIncrease,
  onDecrease,
  onRemove,
  onDetail,
  onBuyNow,
}) {
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = getCartTotal(cartItems);

  return (
    <div className="cart-page">
      <div className="cart-topbar">
        <button className="cart-back-icon" onClick={onBackToMenu} aria-label="Back">
          {"<"}
        </button>
        <h2>Shopping Cart</h2>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-list">
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button className="back-btn" onClick={onBackToMenu}>Continue Shopping</button>
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
            const lineTotal = getItemLineTotal(item).toFixed(2);

            return (
              <div className="cart-item" key={itemId}>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-content">
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <p>Size: {item.selectedSize}</p>
                  </div>
                  <div className="cart-item-controls-row">
                    <div className="cart-item-controls">
                      <button onClick={() => onDecrease(item.productKey, item.selectedSize)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onIncrease(item.productKey, item.selectedSize)}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price-row">
                    <p className="cart-item-price">${lineTotal}</p>
                    <div className="cart-item-actions">
                      <button className="detail-btn" onClick={() => onDetail(item.productKey, item.selectedSize)}>
                        Detail
                      </button>
                      <button className="remove-btn" onClick={() => onRemove(item.productKey, item.selectedSize)}>
                        Cancel
                      </button>
                    </div>
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

