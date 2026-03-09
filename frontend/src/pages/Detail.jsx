import { useState, useEffect } from "react";
import { getItemUnitPrice } from "../utils/pricing";
import "../cart.css";

const SIZES = ["S", "M", "L"];
const SUGAR_LEVELS = ["0%", "25%", "50%", "75%", "100%"];
const MILK_OPTIONS = ["Whole", "Oat Milk", "Almond"];

function Detail({
  item,
  onBack,
  onSave,
  onPrevItem,
  onNextItem,
  canGoPrev,
  canGoNext,
  detailIndex,
  detailCount,
}) {
  const [selectedSize, setSelectedSize] = useState(item.selectedSize || "M");
  const [sugarLevel, setSugarLevel] = useState(item.sugarLevel || "100%");
  const [milkOption, setMilkOption] = useState(item.milkOption || "Whole");
  const [extras, setExtras] = useState(item.extras || {
    extraShot: false,
    whippedCream: false,
    cinnamonSprinkles: false,
  });

  useEffect(() => {
    setSelectedSize(item.selectedSize || "M");
    setSugarLevel(item.sugarLevel || "100%");
    setMilkOption(item.milkOption || "Whole");
    setExtras(item.extras || {
      extraShot: false,
      whippedCream: false,
      cinnamonSprinkles: false,
    });
  }, [item]);

  const handleSave = () => {
    onSave({
      selectedSize,
      sugarLevel,
      milkOption,
      extras,
      quantity: item.quantity,
    });
  };

  const updatedItem = {
    ...item,
    selectedSize,
    sugarLevel,
    milkOption,
    extras,
  };

  const unitPrice = getItemUnitPrice(updatedItem);
  const totalPrice = unitPrice * item.quantity;

  return (
    <div className="cart-page">
      <div className="cart-topbar">
        <button className="cart-back-icon" type="button" onClick={onBack}>
          {"<"}
        </button>
        <h2>Edit Item</h2>
        <span style={{ width: 30 }} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <small style={{ color: "var(--text-secondary)" }}>
          Item {detailIndex + 1} of {detailCount}
        </small>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        <button
          className="back-btn"
          type="button"
          onClick={onPrevItem}
          disabled={!canGoPrev}
          style={{ opacity: canGoPrev ? 1 : 0.5 }}
        >
          {"<"} Prev
        </button>
        <button
          className="back-btn"
          type="button"
          onClick={onNextItem}
          disabled={!canGoNext}
          style={{ opacity: canGoNext ? 1 : 0.5 }}
        >
          Next {">"}
        </button>
      </div>

      <div className="cart-item">
        <img
          className="cart-item-image"
          src={item.image || "/placeholder.jpg"}
          alt={item.name}
        />
        <div className="cart-item-info">
          <h3>{item.name}</h3>
          <div className="item-detail">
            <label>Size:</label>
            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
              {SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="item-detail">
            <label>Sugar:</label>
            <select value={sugarLevel} onChange={(e) => setSugarLevel(e.target.value)}>
              {SUGAR_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="item-detail">
            <label>Milk:</label>
            <select value={milkOption} onChange={(e) => setMilkOption(e.target.value)}>
              {MILK_OPTIONS.map((milk) => (
                <option key={milk} value={milk}>{milk}</option>
              ))}
            </select>
          </div>
          <div className="item-detail" style={{ marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="checkbox"
                checked={extras.extraShot}
                onChange={(e) => setExtras({ ...extras, extraShot: e.target.checked })}
              />
              Extra Shot (+$1.25)
            </label>
          </div>
          <div className="item-detail">
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="checkbox"
                checked={extras.whippedCream}
                onChange={(e) => setExtras({ ...extras, whippedCream: e.target.checked })}
              />
              Whipped Cream (+$0.50)
            </label>
          </div>
          <div className="item-detail">
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="checkbox"
                checked={extras.cinnamonSprinkles}
                onChange={(e) => setExtras({ ...extras, cinnamonSprinkles: e.target.checked })}
              />
              Cinnamon (+$0.25)
            </label>
          </div>
          <p className="detail-price">
            ${unitPrice.toFixed(2)} x {item.quantity} = ${totalPrice.toFixed(2)}
          </p>
        </div>
      </div>

      <button className="buy-btn" type="button" onClick={handleSave} style={{ marginTop: 16 }}>
        SAVE CHANGES
      </button>
    </div>
  );
}

export default Detail;
