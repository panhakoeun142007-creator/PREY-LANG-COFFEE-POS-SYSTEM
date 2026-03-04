import { QRCodeCanvas } from "qrcode.react";
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

export default function CustomerOrderConfirmationPage() {
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
        setError(err instanceof Error ? err.message : "Failed to load order");
      });
  }, [invalidOrderId, orderId]);

  const createdText = snapshot?.created_at
    ? new Date(snapshot.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const items = snapshot?.items ?? [];
  const total = snapshot?.total ?? Number(order?.total_price ?? 0);
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

        <div className="rounded-2xl bg-white p-5 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#14D8A0] text-5xl shadow-lg shadow-[#14D8A0]/30">
            ✓
          </div>
          <p className="text-4xl font-bold">Order Placed!</p>
          <p className="mt-1 text-base text-[#7E756C]">
            We received your order
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4DDD5] bg-white p-4">
          <div className="grid grid-cols-3 border-b border-[#ECE7E1] pb-3 text-center">
            <div>
              <p className="text-5xl font-black text-[#E1771A]">
                #{order?.queue_number ?? "--"}
              </p>
              <p className="text-xs text-[#9A8E82]">Queue Number</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{order?.table_name ?? "-"}</p>
              <p className="text-xs text-[#9A8E82]">Your Table</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{createdText}</p>
              <p className="text-xs text-[#9A8E82]">Order Time</p>
            </div>
          </div>

          <div className="space-y-2 py-3">
            {items.map((item) => (
              <div
                key={`${item.product_id}-${item.size}`}
                className="flex items-center justify-between text-sm"
              >
                <p>
                  {item.qty}× {item.name}{" "}
                  <span className="text-[#9A8E82]">({item.size})</span>
                </p>
                <p className="font-semibold">
                  ${(item.qty * item.unit_price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[#ECE7E1] pt-3 text-3xl font-bold">
            <p>Total</p>
            <p className="text-[#E1771A]">${Number(total).toFixed(2)}</p>
          </div>
        </div>

        {paymentType === "cash" ? (
          <div className="rounded-2xl bg-[#FFF5CC] p-4">
            <p className="text-xl font-bold">💵 Cash Payment</p>
            <p className="mt-1 text-sm text-[#6E655D]">
              Please prepare ${Number(total).toFixed(2)} and pay at the counter
              when your order is ready.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E4DDD5] bg-white p-4 text-center">
            <p className="text-2xl font-bold">🏧 Scan to Pay via KHQR</p>
            <p className="mt-1 text-sm text-[#7E756C]">
              Open your banking app and scan below
            </p>
            <div className="mt-3 inline-flex rounded-xl border border-[#2B241F] bg-white p-3">
              <QRCodeCanvas
                value={`PREYLANG|ORDER:${orderId}|AMOUNT:${Number(total).toFixed(2)}`}
                size={140}
              />
            </div>
            <p className="mt-2 text-4xl font-black text-[#1F1A16]">
              ${Number(total).toFixed(2)}
            </p>
            <p className="text-sm text-[#9A8E82]">Prey Lang Coffee</p>
          </div>
        )}

        <button
          type="button"
          className="w-full rounded-2xl bg-[#1F1A16] px-5 py-4 text-xl font-bold text-white"
          onClick={() =>
            navigate(
              `/order-status/${orderId}?token=${encodeURIComponent(token)}`,
            )
          }
        >
          Track My Order →
        </button>
      </div>
    </div>
  );
}
