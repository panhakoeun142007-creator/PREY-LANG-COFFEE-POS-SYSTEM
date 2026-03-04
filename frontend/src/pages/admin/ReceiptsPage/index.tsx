import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, FileText, QrCode, Search } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { fetchOrderHistory, LiveOrder } from "../../../services/api";

type PaymentMethod = "cash" | "khqr";

interface ReceiptRow {
  id: string;
  orderId: string;
  dateTime: string;
  customer: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: "paid";
}

const mockHistory: LiveOrder[] = [
  {
    id: 105,
    queue_number: 105,
    status: "completed",
    total_price: 45.5,
    payment_type: "cash",
    created_at: "2026-02-25T18:30:00.000Z",
    updated_at: "2026-02-25T19:00:00.000Z",
    table: { id: 5, name: "Table 5" },
    items: [{ id: 1, product_id: 1, size: "large", qty: 3, price: 5.5 }],
  },
  {
    id: 104,
    queue_number: 104,
    status: "completed",
    total_price: 22.0,
    payment_type: "khqr",
    created_at: "2026-02-25T17:15:00.000Z",
    updated_at: "2026-02-25T17:45:00.000Z",
    table: { id: 2, name: "Table 2" },
    items: [{ id: 2, product_id: 2, size: "small", qty: 2, price: 4.0 }],
  },
  {
    id: 103,
    queue_number: 103,
    status: "cancelled",
    total_price: 15.0,
    payment_type: "cash",
    created_at: "2026-02-25T16:00:00.000Z",
    updated_at: "2026-02-25T16:10:00.000Z",
    table: { id: 8, name: "Table 8" },
    items: [{ id: 3, product_id: 3, size: "medium", qty: 2, price: 7.5 }],
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function ReceiptsPage() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentMethod>("all");

  const loadReceiptOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchOrderHistory();
      setOrders(response.data);
    } catch {
      setOrders(mockHistory);
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
        paymentMethod: order.payment_type?.toLowerCase() === "cash" ? "cash" : "khqr",
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
                {formatCurrency(totalCollected)}
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
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="khqr">KHQR</SelectItem>
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
                        {formatCurrency(receipt.amount)}
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
