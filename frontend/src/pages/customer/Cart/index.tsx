import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { placeCustomerOrder } from "../../../services/api";

type ProductSize = "small" | "medium" | "large";

type CustomerCartItem = {
  product_id: number;
  name: string;
  image: string | null;
  size: ProductSize;
  qty: number;
  unit_price: number;
};

function getCartStorageKey(token: string): string {
  return `customer_cart_${token}`;
}

export default function CustomerCart() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";

  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [paymentType, setPaymentType] = useState<"cash" | "khqr">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing table token");
      return;
    }

    const stored = sessionStorage.getItem(getCartStorageKey(token));
    if (stored) {
      setCart(JSON.parse(stored) as CustomerCartItem[]);
    }
  }, [token]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.unit_price, 0),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart],
  );

  function persist(next: CustomerCartItem[]): void {
    setCart(next);
    if (token) {
      sessionStorage.setItem(getCartStorageKey(token), JSON.stringify(next));
    }
  }

  function increase(index: number): void {
    const next = [...cart];
    next[index].qty += 1;
    persist(next);
  }

  function decrease(index: number): void {
    const next = [...cart];
    if (next[index].qty <= 1) {
      next.splice(index, 1);
    } else {
      next[index].qty -= 1;
    }
    persist(next);
  }

  async function placeOrder(): Promise<void> {
    if (!token || cart.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const order = await placeCustomerOrder({
        table_token: token,
        payment_type: paymentType,
        items: cart.map((item) => ({
          product_id: item.product_id,
          size: item.size,
          qty: item.qty,
        })),
      });

      sessionStorage.removeItem(getCartStorageKey(token));
      sessionStorage.setItem(
        `customer_order_${order.order_id}`,
        JSON.stringify({
          items: cart,
          total: subtotal,
          payment_type: paymentType,
          created_at: new Date().toISOString(),
        }),
      );

      navigate(
        `/order-confirmation/${order.order_id}?token=${encodeURIComponent(token)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F0EC] pb-28 text-[#1F1A16]">
      <div className="mx-auto max-w-md px-4 py-5">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            className="h-10 w-10 rounded-xl bg-white text-lg"
            onClick={() => navigate(`/menu?token=${encodeURIComponent(token)}`)}
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold">Your Cart</h1>
            <p className="text-sm text-[#7E756C]">
              Table 3 · {totalItems} items
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-[#EAD6C0] bg-white p-4">
            <p className="text-sm text-[#7C5D58]">Your cart is empty.</p>
            <button
              type="button"
              className="mt-3 rounded-lg border border-[#EAD6C0] px-4 py-2 text-sm"
              onClick={() =>
                navigate(`/menu?token=${encodeURIComponent(token)}`)
              }
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, index) => (
              <div
                key={`${item.product_id}-${item.size}-${index}`}
                className="rounded-2xl border border-[#E4DDD5] bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6ECE4] text-xl">
                      🍓
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{item.name}</p>
                      <p className="text-sm text-[#8A7D70]">
                        {item.size[0].toUpperCase() + item.size.slice(1)} · $
                        {item.unit_price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-[#F3F0EC]"
                      onClick={() => decrease(index)}
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-semibold">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-[#1F1A16] text-white"
                      onClick={() => increase(index)}
                    >
                      +
                    </button>
                    <p className="w-16 text-right text-xl font-bold">
                      ${(item.qty * item.unit_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-[#E4DDD5] bg-white p-4">
              <p className="text-2xl font-bold">Payment Method</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`rounded-xl border p-3 text-left ${
                    paymentType === "cash"
                      ? "border-[#1F1A16] ring-1 ring-[#1F1A16]"
                      : "border-[#E4DDD5]"
                  }`}
                  onClick={() => setPaymentType("cash")}
                >
                  <p className="text-lg">💵</p>
                  <p className="mt-2 font-bold">Cash</p>
                  <p className="text-xs text-[#8A7D70]">Pay at counter</p>
                </button>
                <button
                  type="button"
                  className={`rounded-xl border p-3 text-left ${
                    paymentType === "khqr"
                      ? "border-[#1F1A16] ring-1 ring-[#1F1A16]"
                      : "border-[#E4DDD5]"
                  }`}
                  onClick={() => setPaymentType("khqr")}
                >
                  <p className="text-lg">🏧</p>
                  <p className="mt-2 font-bold">KHQR</p>
                  <p className="text-xs text-[#8A7D70]">Scan & pay now</p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E4DDD5] bg-white p-4">
              <div className="flex items-center justify-between border-b border-[#ECE7E1] pb-3 text-lg">
                <p className="text-[#8A7D70]">Subtotal</p>
                <p className="font-semibold">${subtotal.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between pt-3 text-3xl font-bold">
                <p>Total</p>
                <p className="text-[#D56B12]">${subtotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {cart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E4DDD5] bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              className="w-full rounded-2xl bg-[#1F1A16] px-4 py-4 text-xl font-bold text-white disabled:opacity-60"
              onClick={placeOrder}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Placing..."
                : `Place Order · $${subtotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
