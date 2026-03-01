import { useState } from "react";
import "../cart.css";

const SUGAR_OPTIONS = ["0%", "25%", "50%", "75%", "100%"];

function Cart({
  cartItems = [],
  onBackToMenu,
  onIncrease,
  onDecrease,
  onRemove,
  onSugarChange,
  onBuyNow,
}) {
  const [openDetails, setOpenDetails] = useState({});
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const toggleDetails = (key) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="cart-page">
      <div className="cart-topbar">
        <button className="back-btn" onClick={onBackToMenu}>
          Back to Menu
        </button>
        <h2>Shopping Cart</h2>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <button className="back-btn" onClick={onBackToMenu}>
            Keep browsing the menu
          </button>
        </div>
      ) : (
        <div className="cart-list">
          {cartItems.map((item) => {
            const itemId = `${item.productKey}-${item.selectedSize}`;
            const isOpen = Boolean(openDetails[itemId]);

            return (
              <div className="cart-item" key={itemId}>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>Size: {item.selectedSize}</p>
                  <div className="cart-item-controls">
                    <button onClick={() => onDecrease(item.productKey, item.selectedSize)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onIncrease(item.productKey, item.selectedSize)}>
                      +
                    </button>
                  </div>

                  {isOpen && (
                    <div className="item-detail">
                      <label htmlFor={`sugar-${itemId}`}>Sugar:</label>
                      <select
                        id={`sugar-${itemId}`}
                        value={item.sugarLevel ?? "100%"}
                        onChange={(e) =>
                          onSugarChange?.(item.productKey, item.selectedSize, e.target.value)
                        }
                      >
                        {SUGAR_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="cart-item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                  <button className="view-btn" onClick={() => toggleDetails(itemId)}>
                    {isOpen ? "Hide" : "View"}
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => onRemove(item.productKey, item.selectedSize)}
                  >
                    Remove
                  </button>
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
