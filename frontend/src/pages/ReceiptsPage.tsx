import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, FileText, QrCode, Search } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { fetchOrderHistory, LiveOrder } from "../services/api";
import { useSettings } from "../context/SettingsContext";

type PaymentMethod = "cash" | "credit_card" | "aba_pay" | "wing_money" | "khqr";

interface ReceiptRow {
  id: string;
  orderId: string;
  dateTime: string;
  customer: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: "paid";
}

export default function ReceiptsPage() {
  const { currency, settings } = useSettings();
  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }),
    [currency],
  );
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentMethod>("all");

  const availablePayments = useMemo<PaymentMethod[]>(() => {
    const payment = settings?.payment;
    const next: PaymentMethod[] = [];
    if (payment?.cash_enabled) next.push("cash");
    if (payment?.credit_card_enabled) next.push("credit_card");
    if (payment?.aba_pay_enabled) next.push("aba_pay");
    if (payment?.wing_money_enabled) next.push("wing_money");
    if (payment?.khqr_enabled) next.push("khqr");
    return next.length > 0 ? next : ["cash", "khqr"];
  }, [settings]);

  const loadReceiptOrders = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await fetchOrderHistory();
      setOrders(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load receipts";
      setError(message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceiptOrders();
  }, [loadReceiptOrders]);

  const receiptRows = useMemo<ReceiptRow[]>(() => {
    return orders
      .filter(
        (order) =>
          order.status === "completed" &&
          order.items.length > 0 &&
          Number(order.total_price) > 0,
      )
      .map((order) => ({
        id: `REC-${order.id}`,
        orderId: `ORD-${order.queue_number}`,
        dateTime: new Date(order.created_at).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        customer: order.table?.name || "Walk-in",
        amount: Number(order.total_price),
        paymentMethod: ((): PaymentMethod => {
          const raw = order.payment_type?.toLowerCase();
          if (raw === "cash") return "cash";
          if (raw === "credit_card") return "credit_card";
          if (raw === "aba_pay") return "aba_pay";
          if (raw === "wing_money") return "wing_money";
          return "khqr";
        })(),
        status: "paid",
      }));
  }, [orders]);

  const filteredReceipts = useMemo(() => {
    return receiptRows.filter((receipt) => {
      const matchesPayment =
        paymentFilter === "all" || receipt.paymentMethod === paymentFilter;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        receipt.id.toLowerCase().includes(query) ||
        receipt.orderId.toLowerCase().includes(query) ||
        receipt.customer.toLowerCase().includes(query);

      return matchesPayment && matchesSearch;
    });
  }, [paymentFilter, receiptRows, searchQuery]);

  const totalCollected = useMemo(() => {
    return filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  }, [filteredReceipts]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-[#7C5D58]">Total Receipts</p>
              <p className="text-2xl font-semibold text-[#4B2E2B]">
                {filteredReceipts.length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-[#7C5D58]" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-[#7C5D58]">Total Collected</p>
              <p className="text-2xl font-semibold text-[#4B2E2B]">
                {money.format(totalCollected)}
              </p>
            </div>
            <Banknote className="h-8 w-8 text-[#7C5D58]" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-[#7C5D58]">Paid Receipts</p>
              <p className="text-2xl font-semibold text-[#4B2E2B]">
                {filteredReceipts.filter((row) => row.status === "paid").length}
              </p>
            </div>
            <QrCode className="h-8 w-8 text-[#7C5D58]" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-[#4B2E2B]">Receipt Archive</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C5D58]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search receipt, order, customer..."
                  className="pl-9"
                />
              </div>
              <Select
                value={paymentFilter}
                onValueChange={(value) =>
                  setPaymentFilter(value as "all" | PaymentMethod)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  {availablePayments.includes("cash") ? <SelectItem value="cash">Cash</SelectItem> : null}
                  {availablePayments.includes("khqr") ? <SelectItem value="khqr">KHQR</SelectItem> : null}
                  {availablePayments.includes("credit_card") ? <SelectItem value="credit_card">Credit Card</SelectItem> : null}
                  {availablePayments.includes("aba_pay") ? <SelectItem value="aba_pay">ABA Pay</SelectItem> : null}
                  {availablePayments.includes("wing_money") ? <SelectItem value="wing_money">Wing Money</SelectItem> : null}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-[#7C5D58]"
                    >
                      Loading receipts...
                    </TableCell>
                  </TableRow>
                ) : filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-[#7C5D58]"
                    >
                      No paid orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-semibold">#{receipt.id}</TableCell>
                      <TableCell>#{receipt.orderId}</TableCell>
                      <TableCell>{receipt.dateTime}</TableCell>
                      <TableCell>{receipt.customer}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#F5E6D3] px-2 py-1 text-xs font-medium text-[#4B2E2B]">
                          {receipt.paymentMethod === "khqr" ? (
                            <QrCode className="h-3.5 w-3.5" />
                          ) : (
                            <Banknote className="h-3.5 w-3.5" />
                          )}
                          {receipt.paymentMethod.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {money.format(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold uppercase text-emerald-700">
                          {receipt.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
