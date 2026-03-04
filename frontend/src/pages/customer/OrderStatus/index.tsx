import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  CustomerOrderStatus,
  fetchCustomerOrderStatus,
} from "../../../services/api";

function statusMessage(status: CustomerOrderStatus["status"]): string {
  if (status === "pending") return "🟡 Order Received — We got your order!";
  if (status === "preparing")
    return "🔵 Preparing — Your drinks are being made...";
  if (status === "ready")
    return "🟢 Ready — Please collect your order at the counter!";
  if (status === "completed")
    return "✅ Completed — Thank you! Enjoy your drinks 😊";
  return "❌ Cancelled — Please contact staff.";
}

const orderSteps: Array<{
  key: "pending" | "preparing" | "ready" | "completed";
  label: string;
  doneLabel?: string;
}> = [
  { key: "pending", label: "Order Received" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready to Collect!" },
  {
    key: "completed",
    label: "Completed",
    doneLabel: "Thank you! Enjoy your drinks 😊",
  },
];

function stepIndex(status: CustomerOrderStatus["status"]): number {
  if (status === "pending") return 0;
  if (status === "preparing") return 1;
  if (status === "ready") return 2;
  if (status === "completed") return 3;
  return -1;
}

export default function CustomerOrderStatusPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const orderId = Number(params.id);
  const token = searchParams.get("token")?.trim() ?? "";

  const [order, setOrder] = useState<CustomerOrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setError("Invalid order id");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function load(): Promise<void> {
      try {
        const payload = await fetchCustomerOrderStatus(orderId);
        if (!isMounted) return;
        setOrder(payload);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load order status",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    const timer = setInterval(load, 10000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [orderId]);

  const totalItems = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.qty, 0);
  }, [order]);

  const currentStep = order ? stepIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#F3F0EC] px-4 py-6 text-[#1F1A16]">
      <div className="mx-auto w-full max-w-md space-y-4">
        <p className="text-center text-sm font-medium text-[#28B589]">
          ● Tracking live · Auto-updates
        </p>

        {isLoading ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-[#7E756C]">
            Loading...
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {order ? (
          <>
            <div className="rounded-3xl border border-[#D6C4FF] bg-[#EEE8FF] p-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-b from-[#6AF6C2] to-[#2CC890] text-5xl text-white shadow-lg">
                ✓
              </div>
              <p className="mt-3 text-4xl font-black text-[#8B4CFF]">
                {order.status === "completed" ? "Completed" : "In Progress"}
              </p>
              <p className="mt-1 text-sm text-[#5C4A7D]">
                {statusMessage(order.status).replace(/^[^—]+—\s*/, "")}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E4DDD5] bg-white p-4">
              <div className="space-y-4">
                {orderSteps.map((step, index) => {
                  const done = currentStep >= index;
                  const lineDone = currentStep > index;
                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="relative flex w-7 flex-col items-center">
                        <div
                          className={`z-10 flex h-7 w-7 items-center justify-center rounded-full text-white ${
                            done
                              ? step.key === "pending"
                                ? "bg-[#F4A733]"
                                : step.key === "preparing"
                                  ? "bg-[#4C7DF0]"
                                  : step.key === "ready"
                                    ? "bg-[#17B67A]"
                                    : "bg-[#A45AFF]"
                              : "bg-[#D8D1C7]"
                          }`}
                        >
                          ✓
                        </div>
                        {index < orderSteps.length - 1 ? (
                          <div
                            className={`mt-1 h-8 w-[2px] ${lineDone ? "bg-[#36BD8A]" : "bg-[#E4DDD5]"}`}
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{step.label}</p>
                        {done && step.doneLabel ? (
                          <p className="text-sm text-[#8B4CFF]">
                            {step.doneLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E4DDD5] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-3xl font-bold">Order #{order.id}</p>
                <p className="text-sm text-[#9A8E82]">
                  {order.table_name ?? "-"}
                </p>
              </div>
              <div className="space-y-1 text-sm text-[#6E655D]">
                {order.items.map((item, index) => (
                  <p key={`${item.product_name}-${item.size}-${index}`}>
                    {item.qty}× {item.product_name} ({item.size})
                  </p>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#ECE7E1] pt-3 text-2xl font-bold">
                <p>Total</p>
                <p className="text-[#E1771A]">
                  ${Number(order.total_price).toFixed(2)}
                </p>
              </div>
              <p className="mt-1 text-sm text-[#8A7D70]">Items: {totalItems}</p>
            </div>

            {order.status === "completed" ? (
              <Link
                to={`/receipt/${order.id}?token=${encodeURIComponent(token)}`}
                className="block rounded-2xl bg-[#1F1A16] px-5 py-4 text-center text-xl font-bold text-white"
              >
                🧾 View Receipt
              </Link>
            ) : (
              <Link
                to={
                  token ? `/menu?token=${encodeURIComponent(token)}` : "/menu"
                }
                className="block rounded-2xl bg-[#1F1A16] px-5 py-4 text-center text-xl font-bold text-white"
              >
                Back to Menu
              </Link>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
