import { useState, useEffect } from "react";
import { getItemUnitPrice } from "../utils/pricing";
import "../detail.css";

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
    <div className="detail-page">
      <div className="detail-top">
        <button className="detail-back" type="button" onClick={onBack}>
          {"<"}
        </button>
        <h2 className="detail-title">Edit Item</h2>
        <span className="detail-count-chip">
          Item {detailIndex + 1} of {detailCount}
        </span>
      </div>

      <div className="detail-image-nav">
        <button
          className="detail-side-nav"
          type="button"
          onClick={onPrevItem}
          disabled={!canGoPrev}
        >
          {"<"}
        </button>
        <div className="detail-image-wrap">
          <img
            className="detail-product-image"
            src={item.image || "/placeholder.jpg"}
            alt={item.name}
          />
        </div>
        <button
          className="detail-side-nav"
          type="button"
          onClick={onNextItem}
          disabled={!canGoNext}
        >
          {">"}
        </button>
      </div>

      <div className="detail-card">
        <div className="detail-headline">
          <h3>{item.name}</h3>
          <p>Unit: ${unitPrice.toFixed(2)} | Total: ${totalPrice.toFixed(2)}</p>
        </div>
        <div className="detail-section-block">
          <label>Size</label>
          <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
            {SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="detail-section-block">
          <label>Sugar Level</label>
          <select value={sugarLevel} onChange={(e) => setSugarLevel(e.target.value)}>
            {SUGAR_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        <div className="detail-section-block">
          <label>Milk</label>
          <select value={milkOption} onChange={(e) => setMilkOption(e.target.value)}>
            {MILK_OPTIONS.map((milk) => (
              <option key={milk} value={milk}>{milk}</option>
            ))}
          </select>
        </div>
        <div className="extra-list">
          <div className="extra-row">
            <label>
              <input
                type="checkbox"
                checked={extras.extraShot}
                onChange={(e) => setExtras({ ...extras, extraShot: e.target.checked })}
              />
              Extra Shot
            </label>
            <small>+$1.25</small>
          </div>
          <div className="extra-row">
            <label>
              <input
                type="checkbox"
                checked={extras.whippedCream}
                onChange={(e) => setExtras({ ...extras, whippedCream: e.target.checked })}
              />
              Whipped Cream
            </label>
            <small>+$0.50</small>
          </div>
          <div className="extra-row">
            <label>
              <input
                type="checkbox"
                checked={extras.cinnamonSprinkles}
                onChange={(e) => setExtras({ ...extras, cinnamonSprinkles: e.target.checked })}
              />
              Cinnamon Sprinkles
            </label>
            <small>+$0.25</small>
          </div>
        </div>
        <button className="detail-save-btn" type="button" onClick={handleSave}>
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
}

export default Detail;
