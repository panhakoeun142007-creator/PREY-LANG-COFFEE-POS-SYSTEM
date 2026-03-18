import { useEffect, useState } from "react";
import "../detail.css";
import { getPriceForSize, getItemUnitPrice } from "./Customer";
import { GiMilkCarton } from "react-icons/gi";
import { FaLeaf, FaSeedling } from "react-icons/fa";

// Preview price while user is still selecting options (not yet saved)
function getPreviewUnitPrice(item, selectedSize, milkOption, extras) {
  return getItemUnitPrice({ ...item, selectedSize, milkOption, extras });
}

const SIZE_OPTIONS = [
  { id: "L", label: "Large", unit: "16oz", extraPrice: 1.0 },
  { id: "M", label: "Medium", unit: "12oz", extraPrice: 0.5 },
  { id: "S", label: "Small", unit: "8oz", extraPrice: 0 },
];

const MILK_OPTIONS = [
  { id: "Whole",    label: "Whole",    priceText: "Included", icon: GiMilkCarton },
  { id: "Oat Milk", label: "Oat Milk", priceText: "+$0.75",   icon: FaSeedling },
  { id: "Almond",  label: "Almond",   priceText: "+$0.50",   icon: FaLeaf },
];

const EXTRA_OPTIONS = [
  { id: "extraShot", label: "Extra Shot", priceText: "+$1.25" },
  { id: "whippedCream", label: "Whipped Cream", priceText: "+$0.50" },
  { id: "cinnamonSprinkles", label: "Cinnamon Sprinkles", priceText: "+$0.25" },
];

const SUGAR_OPTIONS = ["0%", "25%", "50%", "75%", "100%"];

function Detail({
  item,
  onBack,
  onSave,
  onPrevItem,
  onNextItem,
  canGoPrev = false,
  canGoNext = false,
  detailIndex = -1,
  detailCount = 0,
}) {
  const [selectedSize, setSelectedSize] = useState(item?.selectedSize ?? "M");
  const [sugarLevel, setSugarLevel] = useState(item?.sugarLevel ?? "100%");
  const [milkOption, setMilkOption] = useState(item?.milkOption ?? "Whole");
  const [extras, setExtras] = useState(
    item?.extras ?? {
      extraShot: false,
      whippedCream: false,
      cinnamonSprinkles: false,
    }
  );

  useEffect(() => {
    if (!item) return;
    setSelectedSize(item.selectedSize ?? "M");
    setSugarLevel(item.sugarLevel ?? "100%");
    setMilkOption(item.milkOption ?? "Whole");
    setExtras(
      item.extras ?? {
        extraShot: false,
        whippedCream: false,
        cinnamonSprinkles: false,
      }
    );
  }, [item]);

  if (!item) {
    return null;
  }

  const save = () => {
    onSave?.({
      selectedSize,
      sugarLevel,
      milkOption,
      extras,
    });
  };
  const previewUnitPrice = getPreviewUnitPrice(item, selectedSize, milkOption, extras);

  return (
    <div className="detail-page">
      <div className="detail-top">
        <button className="detail-back" onClick={onBack}>
          {"<"}
        </button>
        <h2 className="detail-title">{item.name}</h2>
        <span className="detail-count-chip">
          {detailIndex >= 0 ? `${detailIndex + 1}/${detailCount}` : "1/1"}
        </span>
      </div>

      <div className="detail-card">
        <div className="detail-image-nav">
          <button
            className="detail-side-nav"
            onClick={onPrevItem}
            disabled={!canGoPrev}
            aria-label="Previous cart item"
          >
            {"<"}
          </button>
          <div className="detail-image-wrap">
            <img src={item.image} alt={item.name} className="detail-product-image" />
          </div>
          <button
            className="detail-side-nav"
            onClick={onNextItem}
            disabled={!canGoNext}
            aria-label="Next cart item"
          >
            {">"}
          </button>
        </div>

        <div className="detail-headline">
          <h3>{item.name}</h3>
          <p>${previewUnitPrice.toFixed(2)}</p>
        </div>

        <p className="detail-description-text">
          Customize this drink with your preferred size, milk, sugar, and extras.
        </p>

        <div className="detail-tags">
          <span>{item.badge ?? "POPULAR"}</span>
          <span>{item.category?.name ?? (typeof item.category === "string" ? item.category : "COFFEE")}</span>
        </div>

        <div className="detail-section-block">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size.id}
              className={selectedSize === size.id ? "size-option active" : "size-option"}
              onClick={() => setSelectedSize(size.id)}
            >
              <div className="size-left">
                <strong>{size.label}</strong>
                <small>{size.unit}</small>
              </div>
              <span className="size-price">
                {size.extraPrice > 0 ? `+$${size.extraPrice.toFixed(2)}` : "Included"}
              </span>
            </button>
          ))}
        </div>

        <div className="detail-section-block">
          <label htmlFor="sugar">Sugar</label>
          <select id="sugar" value={sugarLevel} onChange={(e) => setSugarLevel(e.target.value)}>
            {SUGAR_OPTIONS.map((sugar) => (
              <option key={sugar} value={sugar}>
                {sugar}
              </option>
            ))}
          </select>
        </div>

        <div className="detail-section-block">
          <h4>Milk Options</h4>
          <div className="milk-grid">
            {MILK_OPTIONS.map((milk) => (
              <button
                key={milk.id}
                className={milkOption === milk.id ? "milk-pill active" : "milk-pill"}
                onClick={() => setMilkOption(milk.id)}
              >
                <milk.icon className="milk-icon" />
                <strong>{milk.label}</strong>
                <small>{milk.priceText}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="detail-section-block">
          <h4>Add Extras</h4>
          <div className="extra-list">
            {EXTRA_OPTIONS.map((extra) => (
              <label key={extra.id} className="extra-row">
                <input
                  type="checkbox"
                  checked={Boolean(extras[extra.id])}
                  onChange={(e) =>
                    setExtras((prev) => ({
                      ...prev,
                      [extra.id]: e.target.checked,
                    }))
                  }
                />
                <span>{extra.label}</span>
                <small>{extra.priceText}</small>
              </label>
            ))}
          </div>
        </div>

        <button className="detail-save-btn" onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Detail;
