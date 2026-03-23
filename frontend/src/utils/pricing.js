const SIZE_EXTRA_CENTS = {
  S: 0,
  M: 50,
  L: 100,
};

const MILK_EXTRA_CENTS = {
  Whole: 0,
  "Oat Milk": 75,
  Almond: 50,
};

const EXTRA_CENTS = {
  extraShot: 125,
  whippedCream: 50,
  cinnamonSprinkles: 25,
};

const toSafeCents = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100);
};

const hasAnySizedPrice = (item = {}) => {
  return (
    item.price_small != null ||
    item.price_medium != null ||
    item.price_large != null ||
    item.discounted_price_small != null ||
    item.discounted_price_medium != null ||
    item.discounted_price_large != null
  );
};

export const getPriceForSize = (product = {}, size = "M") => {
  const s = String(size ?? "M").toUpperCase();

  const chooseSized = (prefix) => {
    if (s === "S") return toSafeCents(product[`${prefix}_small`]);
    if (s === "L") return toSafeCents(product[`${prefix}_large`]);
    return toSafeCents(product[`${prefix}_medium`]);
  };

  if (product.has_discount) {
    const discountedCents = chooseSized("discounted_price");
    if (discountedCents > 0) return discountedCents / 100;
  }

  if (hasAnySizedPrice(product)) {
    const sizedCents = chooseSized("price");
    if (sizedCents > 0) return sizedCents / 100;
  }

  // Fallback: older items store a single base price and fixed size extras.
  const baseCents = toSafeCents(product.price);
  const sizeExtraCents = SIZE_EXTRA_CENTS[s] ?? SIZE_EXTRA_CENTS.M;
  return (baseCents + sizeExtraCents) / 100;
};

export const getItemUnitPrice = (item = {}) => {
  const baseCents = toSafeCents(getPriceForSize(item, item.selectedSize));
  const milkExtraCents = MILK_EXTRA_CENTS[item.milkOption ?? "Whole"] ?? 0;

  const extras = item.extras ?? {};
  const extrasCents = Object.entries(EXTRA_CENTS).reduce((sum, [key, cents]) => {
    return extras[key] ? sum + cents : sum;
  }, 0);

  return (baseCents + milkExtraCents + extrasCents) / 100;
};

export const getItemLineTotal = (item = {}) => {
  const quantity = Number.isFinite(Number(item.quantity)) ? Math.max(0, Number(item.quantity)) : 0;
  return getItemUnitPrice(item) * quantity;
};

export const getCartTotal = (cartItems = []) =>
  cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);
