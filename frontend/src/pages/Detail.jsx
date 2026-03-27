import { useEffect, useMemo, useState } from "react";
import "../detail.css";
import { getItemUnitPrice } from "../utils/pricing";

// Preview price while user is still selecting options (not yet saved)
function getPreviewUnitPrice(item, selectedSize, milkOption, extras) {
  return getItemUnitPrice({ ...item, selectedSize, milkOption, extras });
}

const SIZE_OPTIONS = [
  { id: "L", label: "Large", unit: "16oz", extraPrice: 1.0 },
  { id: "M", label: "Medium", unit: "12oz", extraPrice: 0.5 },
  { id: "S", label: "Small", unit: "8oz", extraPrice: 0 },
];

const EXTRA_OPTIONS = [
  { id: "extraShot", label: "Extra Shot", priceText: "+$1.25" },
  { id: "whippedCream", label: "Whipped Cream", priceText: "+$0.50" },
  { id: "cinnamonSprinkles", label: "Cinnamon Sprinkles", priceText: "+$0.25" },
  { id: "milk", label: "Milk", priceText: "+$1.00" },
];

const SUGAR_OPTIONS = ["0%", "25%", "50%", "75%", "100%"];

function Detail({
  item,
  onBack,
  onSave,
  onAddMore,
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
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [extras, setExtras] = useState(
    item?.extras ?? {
      extraShot: false,
      whippedCream: false,
      cinnamonSprinkles: false,
      milk: false,
    }
  );

  useEffect(() => {
    if (!item) return;

    let canceled = false;
    Promise.resolve().then(() => {
      if (canceled) return;
      setSelectedSize(item.selectedSize ?? "M");
      setSugarLevel(item.sugarLevel ?? "100%");
      setMilkOption(item.milkOption ?? "Whole");
      setQuantity(item.quantity ?? 1);
      setExtras(
        item.extras ?? {
          extraShot: false,
          whippedCream: false,
          cinnamonSprinkles: false,
          milk: false,
        }
      );
    });

    return () => {
      canceled = true;
    };
  }, [item]);

  if (!item) {
    return null;
  }

  const changeQuantity = (delta) => {
    setQuantity((prev) => Math.max(prev + delta, 1));
  };

  const save = () => {
    onSave?.({
      selectedSize,
      sugarLevel,
      milkOption,
      extras,
      quantity,
    });
  };
  const previewUnitPrice = getPreviewUnitPrice(item, selectedSize, milkOption, extras);
  const previewTotalPrice = previewUnitPrice * quantity;

  const hasChanges = useMemo(() => {
    if (!item) return true;
    const defaultExtras = {
      extraShot: false,
      whippedCream: false,
      cinnamonSprinkles: false,
      milk: false,
      ...item.extras,
    };
    const extrasChanged = Object.keys(defaultExtras).some(
      (key) => extras[key] !== defaultExtras[key]
    );
    return (
      selectedSize !== (item.selectedSize ?? "M") ||
      sugarLevel !== (item.sugarLevel ?? "100%") ||
      milkOption !== (item.milkOption ?? "Whole") ||
      quantity !== (item.quantity ?? 1) ||
      extrasChanged
    );
  }, [extras, item, milkOption, quantity, sugarLevel, selectedSize]);

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
          <div className="detail-headline-left">
            <h3>{item.name}</h3>
            <div className="detail-quantity-control">
              <button
                type="button"
                onClick={() => changeQuantity(-1)}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-label">{quantity}</span>
              <button type="button" onClick={() => changeQuantity(1)}>
                +
              </button>
            </div>
          </div>
          <p>${previewTotalPrice.toFixed(2)}</p>
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

        <div className="detail-action-row">
          <button className="detail-add-more-btn" onClick={() => onAddMore?.()}>
            Add More
          </button>
          <button
            className={`detail-save-btn ${!hasChanges ? "detail-save-btn--inactive" : ""}`}
            onClick={save}
            disabled={!hasChanges}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default Detail;
