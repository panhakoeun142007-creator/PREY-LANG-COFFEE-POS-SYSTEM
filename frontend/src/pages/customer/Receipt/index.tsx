import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CustomerOrderStatus,
  fetchCustomerOrderStatus,
} from "../../../services/api";

type OrderSnapshotItem = {
  product_id: number;
  name: string;
  size: "small" | "medium" | "large";
  qty: number;
  unit_price: number;
};

type OrderSnapshot = {
  items: OrderSnapshotItem[];
  total: number;
  payment_type: "cash" | "khqr";
  created_at: string;
};

export default function CustomerReceiptPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const orderId = Number(id);
  const invalidOrderId = !Number.isFinite(orderId) || orderId <= 0;

  const [order, setOrder] = useState<CustomerOrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const snapshot = useMemo(() => {
    if (invalidOrderId) return null;
    const raw = sessionStorage.getItem(`customer_order_${orderId}`);
    return raw ? (JSON.parse(raw) as OrderSnapshot) : null;
  }, [invalidOrderId, orderId]);

  useEffect(() => {
    if (invalidOrderId) {
      return;
    }

    fetchCustomerOrderStatus(orderId)
      .then(setOrder)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load receipt");
      });
  }, [invalidOrderId, orderId]);

  const createdAt = snapshot?.created_at
    ? new Date(snapshot.created_at)
    : new Date();

  const items = snapshot?.items ?? [];
  const subtotal = snapshot?.total ?? Number(order?.total_price ?? 0);
  const paymentType = snapshot?.payment_type ?? order?.payment_type ?? "cash";

  return (
    <div className="min-h-screen bg-[#F3F0EC] px-4 py-6 text-[#1F1A16]">
      <div className="mx-auto w-full max-w-md space-y-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {invalidOrderId ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Invalid order id
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
          <p className="text-3xl font-bold">🧾 Receipt</p>
          <span className="rounded-full bg-[#F3F0EC] px-3 py-1 text-xs font-semibold uppercase">
            {paymentType}
          </span>
        </div>

        <div className="rounded-2xl border border-[#E4DDD5] bg-white p-4">
          <div className="mb-4 text-center">
            <p className="text-xl">☕</p>
            <p className="text-3xl font-black">PREY LANG COFFEE</p>
            <p className="text-sm text-[#9A8E82]">Your cozy local café</p>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <p className="text-[#9A8E82]">Receipt No.</p>
            <p className="text-right font-semibold">PLC-{orderId}-2026</p>
            <p className="text-[#9A8E82]">Date</p>
            <p className="text-right font-semibold">
              {createdAt.toLocaleDateString()}
            </p>
            <p className="text-[#9A8E82]">Time</p>
            <p className="text-right font-semibold">
              {createdAt.toLocaleTimeString()}
            </p>
            <p className="text-[#9A8E82]">Table</p>
            <p className="text-right font-semibold">
              {order?.table_name ?? "-"}
            </p>
            <p className="text-[#9A8E82]">Queue</p>
            <p className="text-right font-semibold">
              #{order?.queue_number ?? "-"}
            </p>
          </div>

          <div className="my-4 border-t border-dashed border-[#D7CEC4]" />

          <div className="space-y-3 text-sm">
            {items.map((item) => (
              <div
                key={`${item.product_id}-${item.size}`}
                className="grid grid-cols-[1fr_auto_auto] gap-2"
              >
                <p className="font-semibold">{item.name}</p>
                <p className="text-[#9A8E82]">×{item.qty}</p>
                <p className="font-semibold">
                  ${(item.qty * item.unit_price).toFixed(2)}
                </p>
                <p className="col-span-3 -mt-1 text-xs text-[#9A8E82]">
                  {item.size}
                </p>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-[#ECE7E1]" />

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-[#9A8E82]">Subtotal</p>
              <p className="font-semibold">${Number(subtotal).toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[#9A8E82]">Tax (0%)</p>
              <p className="font-semibold">$0.00</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#ECE7E1] pt-3">
            <p className="text-3xl font-black">TOTAL</p>
            <p className="text-3xl font-black text-[#E1771A]">
              ${Number(subtotal).toFixed(2)}
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 text-sm">
            <p className="text-[#9A8E82]">Payment</p>
            <p className="text-right font-semibold uppercase">{paymentType}</p>
            <p className="text-[#9A8E82]">Status</p>
            <p className="text-right font-semibold text-[#14A56A]">✓ Paid</p>
          </div>

          <div className="mt-4 text-center text-xs text-[#9A8E82]">
            Enjoy your drinks! ☕
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-2xl bg-[#1F1A16] px-5 py-4 text-xl font-bold text-white"
          onClick={() => navigate(`/menu?token=${encodeURIComponent(token)}`)}
        >
          ☕ Order Again
        </button>
      </div>
    </div>
  );
}
