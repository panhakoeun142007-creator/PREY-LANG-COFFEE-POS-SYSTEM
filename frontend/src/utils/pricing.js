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

export const getItemUnitPrice = (item = {}) => {
  const baseCents = toSafeCents(item.price);
  const sizeExtraCents = SIZE_EXTRA_CENTS[item.selectedSize ?? "M"] ?? SIZE_EXTRA_CENTS.M;
  const milkExtraCents = MILK_EXTRA_CENTS[item.milkOption ?? "Whole"] ?? 0;

  const extras = item.extras ?? {};
  const extrasCents = Object.entries(EXTRA_CENTS).reduce((sum, [key, cents]) => {
    return extras[key] ? sum + cents : sum;
  }, 0);

  return (baseCents + sizeExtraCents + milkExtraCents + extrasCents) / 100;
};

export const getItemLineTotal = (item = {}) => {
  const quantity = Number.isFinite(Number(item.quantity)) ? Math.max(0, Number(item.quantity)) : 0;
  return getItemUnitPrice(item) * quantity;
};

export const getCartTotal = (cartItems = []) =>
  cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);
