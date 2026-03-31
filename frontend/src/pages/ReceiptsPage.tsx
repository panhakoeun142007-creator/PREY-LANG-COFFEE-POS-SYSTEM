import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, Download, Eye, FileText, Printer, QrCode, RefreshCw, Search, Trash2, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
import { deleteReceipt, fetchReceipts, fetchReceiptDetail, ReceiptDetailResponse } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import { auth } from "../utils/auth";
import { useI18n } from "../context/I18nContext";
import { useAutoRefresh } from "../hooks";

type PaymentMethod = "cash" | "credit_card" | "aba_pay" | "wing_money" | "khqr";

interface ReceiptRow {
  id: string;
  orderNumericId: number;
  orderId: string;
  dateTime: string;
  customer: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: "paid";
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function ReceiptsPage() {
  const { t, lang } = useI18n();
  const { currency, settings } = useSettings();
  const role = auth.getUser()?.role;
  const isAdmin = role === "admin";
  const money = useMemo(
    () =>
      new Intl.NumberFormat(lang === "km" ? "km-KH" : "en-US", {
        style: "currency",
        currency,
      }),
    [currency, lang],
  );
  const [receiptRows, setReceiptRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentMethod>("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReceiptDetailResponse["receipt"] | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const paymentLabel = useCallback(
    (method: PaymentMethod) => {
      if (method === "cash") return t("payment.cash");
      if (method === "credit_card") return t("payment.credit_card");
      if (method === "aba_pay") return t("payment.aba_pay");
      if (method === "wing_money") return t("payment.wing_money");
      return t("payment.khqr");
    },
    [t],
  );

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

  const normalizePaymentMethod = useCallback((raw: unknown): PaymentMethod => {
    const value = String(raw ?? "").toLowerCase().trim();
    if (value === "cash") return "cash";
    if (value === "credit_card" || value === "credit card") return "credit_card";
    if (value === "aba_pay" || value === "aba pay") return "aba_pay";
    if (value === "wing_money" || value === "wing money") return "wing_money";
    return "khqr";
  }, []);

  const formatReceiptDateTime = useCallback(
    (raw: string | null | undefined): string => {
      if (!raw) return "-";
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleString(lang === "km" ? "km-KH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [lang],
  );

  const parseNumericId = useCallback((value: unknown): number => {
    const digits = String(value ?? "").replace(/\D+/g, "");
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, []);

  const buildReceiptPrintHtml = useCallback(
    (receipt: ReceiptDetailResponse["receipt"], opts: { logoUrl: string }) => {
      const items = Array.isArray(receipt.items) ? receipt.items : [];
      const totals = receipt.totals ?? {
        subtotal: 0,
        tax_rate: 0,
        tax_amount: 0,
        computed_total: 0,
        total: 0,
      };
      const order = receipt.order ?? {
        id: 0,
        queue_number: null,
        status: "paid" as const,
        payment_type: null,
        table: null,
        paid_at: null,
        created_at: null,
        updated_at: null,
      };

      const paymentMethod = normalizePaymentMethod(order.payment_type);
      const paidAt = order.paid_at ?? order.created_at ?? null;
      const receiptSettings = receipt.receipt_settings ?? null;

      const safeReceiptId = String(receipt.receipt_id ?? "RECEIPT").replace(/[^\w-]+/g, "-");
      const title = `Receipt-${safeReceiptId}`;
      const shopName = receiptSettings?.shop_name ?? "Receipt";
      const address = receiptSettings?.address ?? "";
      const phone = receiptSettings?.phone ?? "";
      const taxId = receiptSettings?.tax_id ?? "";
      const footer = receiptSettings?.footer_message ?? "";

      const showLogo = Boolean(receiptSettings?.show_logo);
      const showOrderNumber = receiptSettings?.show_order_number ?? true;
      const showCustomerName = receiptSettings?.show_customer_name ?? true;
      const showQrPayment = Boolean(receiptSettings?.show_qr_payment);

      const itemsHtml = items
        .map((item) => {
          const name = item.name || `#${item.product_id}`;
          const size = item.size ? ` (${item.size})` : "";
          return `
            <div class="row">
              <div class="left">${escapeHtml(`${item.qty}x ${name}${size}`)}</div>
              <div class="right">${escapeHtml(money.format(item.line_total))}</div>
            </div>
          `;
        })
        .join("");

      return `<!doctype html>
<html lang="${escapeHtml(lang === "km" ? "km" : "en")}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { --ink: #2f1c18; --muted: #6b4b46; --line: #e6d7c6; }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans Khmer", "Noto Sans", sans-serif;
        color: var(--ink);
        background: #f5efe6;
        display: flex;
        justify-content: center;
        padding: 16px;
      }
      .paper {
        width: 80mm;
        max-width: 360px;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 10px;
        overflow: hidden;
      }
      .header {
        background: #4B2E2B;
        color: #fff;
        padding: 10px 12px;
        text-align: center;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: .3px;
      }
      .content { padding: 12px; font-size: 11px; }
      .center { text-align: center; }
      .muted { color: var(--muted); }
      .logo { display: flex; justify-content: center; margin-bottom: 8px; }
      .logo img { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; }
      .divider { border-top: 1px dashed var(--line); margin: 10px 0; }
      .row { display: flex; justify-content: space-between; gap: 10px; }
      .left { flex: 1; min-width: 0; word-break: break-word; }
      .right { white-space: nowrap; text-align: right; }
      .totals .row { margin-top: 4px; }
      .totals .total { font-weight: 800; font-size: 12px; margin-top: 6px; }
      .badge { display: inline-block; font-size: 10px; padding: 2px 6px; border: 1px solid var(--line); border-radius: 999px; }
      .qr { margin-top: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .qr-box { width: 72px; height: 72px; border-radius: 8px; background: #f5efe6; display: flex; align-items: center; justify-content: center; }
      .qr-label { font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--muted); }
      .footer { margin-top: 10px; font-size: 10px; font-style: italic; color: var(--muted); line-height: 1.35; }

      @media print {
        body { background: #fff; padding: 0; }
        .paper { border: none; border-radius: 0; width: 80mm; }
        @page { margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="header">${escapeHtml(t("receipts.customer_receipt_title"))}</div>
      <div class="content">
        ${showLogo ? `<div class="logo"><img src="${escapeHtml(opts.logoUrl)}" alt="Logo" /></div>` : ""}

        <div class="center">
          <div style="font-weight: 800; font-size: 12px;">${escapeHtml(shopName)}</div>
          ${address ? `<div class="muted">${escapeHtml(address)}</div>` : ""}
          ${phone ? `<div class="muted">${escapeHtml(phone)}</div>` : ""}
          ${taxId ? `<div class="muted">${escapeHtml(`${t("receipts.tax_id_label")}: ${taxId}`)}</div>` : ""}
        </div>

        <div class="divider"></div>

        <div class="row" style="margin-bottom: 6px;">
          <div class="left muted">${escapeHtml(t("receipts.label_receipt"))}</div>
          <div class="right">${escapeHtml(receipt.receipt_id)}</div>
        </div>

        <div class="row" style="font-weight: 700;">
          <div class="left">
            ${showOrderNumber ? escapeHtml(`${t("receipts.order_number_label")} #${receipt.order_id}`) : ""}
          </div>
          <div class="right">${escapeHtml(formatReceiptDateTime(paidAt))}</div>
        </div>

        ${showCustomerName ? `
          <div class="row" style="margin-top: 6px;">
            <div class="left">${escapeHtml(`${t("receipts.customer_label")} : ${receipt.customer_label}`)}</div>
          </div>
        ` : ""}

        <div class="divider"></div>

        <div>${itemsHtml}</div>

        <div class="divider"></div>

        <div class="totals">
          <div class="row muted">
            <div class="left">${escapeHtml(t("receipts.subtotal"))}</div>
            <div class="right">${escapeHtml(money.format(totals.subtotal))}</div>
          </div>
          <div class="row muted">
            <div class="left">${escapeHtml(t("receipts.tax", { rate: totals.tax_rate }))}</div>
            <div class="right">${escapeHtml(money.format(totals.tax_amount))}</div>
          </div>
          <div class="row total">
            <div class="left">${escapeHtml(t("receipts.total"))}</div>
            <div class="right">${escapeHtml(money.format(totals.total))}</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="row">
          <div class="left muted">${escapeHtml(t("receipts.payment"))}</div>
          <div class="right"><span class="badge">${escapeHtml(paymentLabel(paymentMethod))}</span></div>
        </div>

        ${showQrPayment ? `
          <div class="qr">
            <div class="qr-box">${escapeHtml("QR")}</div>
            <div class="qr-label">${escapeHtml(t("receipts.scan_to_pay"))}</div>
          </div>
        ` : ""}

        ${footer ? `<div class="footer center">${escapeHtml(footer)}</div>` : ""}
      </div>
    </div>
  </body>
</html>`;
    },
    [formatReceiptDateTime, lang, money, normalizePaymentMethod, paymentLabel, t],
  );

  const openReceiptPrintWindow = useCallback(
    (action: "print" | "pdf") => {
      if (!detail) return;
      try {
        const baseUrl = import.meta.env.BASE_URL || "/";
        const logoUrl = new URL("img/logo-coffee.png", `${window.location.origin}${baseUrl}`).toString();
        const html = buildReceiptPrintHtml(detail, { logoUrl });
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const win = window.open(url, "_blank", "noopener,width=520,height=800");
        if (!win) {
          URL.revokeObjectURL(url);
          toast.error(t("receipts.print_failed"));
          return;
        }

        if (action === "pdf") {
          toast(t("receipts.save_pdf_hint"));
        }

        const safeRevoke = () => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        };

        const doPrint = () => {
          try {
            win.focus();
            win.print();
          } catch {
            // ignore
          }
        };

        try {
          win.addEventListener("beforeunload", safeRevoke);
          win.addEventListener("load", () => {
            // Let layout settle before printing (avoids blank print in some browsers).
            requestAnimationFrame(() => requestAnimationFrame(doPrint));
          });
          // Fallback if load doesn't fire (some browsers + object URLs).
          setTimeout(doPrint, 700);
        } catch {
          setTimeout(doPrint, 700);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("receipts.print_failed"));
      }
    },
    [buildReceiptPrintHtml, detail, t],
  );

  const loadReceiptOrders = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (background) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      if (!background) setError(null);
      const response = await fetchReceipts({ per_page: 200 });
      const rows: ReceiptRow[] = (response.receipts ?? []).map((item) => {
        const id = item.receipt_id ?? item.receiptId ?? "REC-UNKNOWN";
        const orderNumericId =
          (Number(item.order_numeric_id ?? 0) || 0) ||
          parseNumericId(item.receipt_id ?? item.receiptId) ||
          parseNumericId(item.order_id ?? item.orderId);
        const orderId = item.order_id ?? item.orderId ?? `ORD-${orderNumericId}`;
        const paidAt = item.paid_at ?? item.paidAt ?? null;

        return {
          id,
          orderNumericId,
          orderId,
          dateTime: formatReceiptDateTime(paidAt),
          customer: item.customer_label ?? item.table ?? t("receipts.walk_in"),
          amount: Number(item.total ?? 0) || 0,
          paymentMethod: normalizePaymentMethod(item.payment_type ?? item.paymentMethod),
          status: "paid",
        };
      });
      setReceiptRows(rows);
    } catch (err) {
      if (!background) {
        const message = err instanceof Error ? err.message : t("receipts.load_failed");
        setError(message);
        setReceiptRows([]);
      }
    } finally {
      if (background) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [formatReceiptDateTime, normalizePaymentMethod, parseNumericId, t]);

  useEffect(() => {
    void loadReceiptOrders();
  }, [loadReceiptOrders]);

  useAutoRefresh(() => loadReceiptOrders({ background: true }), { intervalMs: 10000, immediate: false });

  const handleViewDetail = useCallback(async (orderId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const payload = await fetchReceiptDetail(orderId);
      setDetail(payload.receipt);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("receipts.details_failed");
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  const handleDelete = useCallback(async () => {
    if (!deleteOrderId || deleteOrderId <= 0) {
      toast.error(t("receipts.delete_failed"));
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteReceipt(deleteOrderId);
      toast.success(t("receipts.deleted"));
      setDeleteOrderId(null);
      if (detail?.order?.id === deleteOrderId) {
        setDetailOpen(false);
        setDetail(null);
      }
      await loadReceiptOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("receipts.delete_failed"));
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteOrderId, detail?.order?.id, loadReceiptOrders, t]);

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
              <p className="text-sm text-[#7C5D58]">{t("receipts.total_receipts")}</p>
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
              <p className="text-sm text-[#7C5D58]">{t("receipts.total_collected")}</p>
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#4B2E2B]">{t("receipts.archive_title")}</h2>
              {isRefreshing && !loading && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 text-xs text-[#7C5D58] border border-[#EAD6C0]">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Refreshing
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C5D58]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("receipts.search_placeholder")}
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
                  <SelectValue placeholder={t("receipts.payment_method")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("receipts.payment_all")}</SelectItem>
                  {availablePayments.includes("cash") ? <SelectItem value="cash">{t("payment.cash")}</SelectItem> : null}
                  {availablePayments.includes("khqr") ? <SelectItem value="khqr">{t("payment.khqr")}</SelectItem> : null}
                  {availablePayments.includes("credit_card") ? <SelectItem value="credit_card">{t("payment.credit_card")}</SelectItem> : null}
                  {availablePayments.includes("aba_pay") ? <SelectItem value="aba_pay">{t("payment.aba_pay")}</SelectItem> : null}
                  {availablePayments.includes("wing_money") ? <SelectItem value="wing_money">{t("payment.wing_money")}</SelectItem> : null}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("receipts.receipt_id")}</TableHead>
                  <TableHead>{t("receipts.order_id")}</TableHead>
                  <TableHead>{t("receipts.date_time")}</TableHead>
                  <TableHead>{t("receipts.customer")}</TableHead>
                  <TableHead>{t("receipts.payment")}</TableHead>
                  <TableHead className="text-right">{t("receipts.amount")}</TableHead>
                  <TableHead>{t("receipts.status")}</TableHead>
                  <TableHead className="text-right">{t("receipts.actions")}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-sm text-[#7C5D58]"
                    >
                      {t("receipts.loading")}
                    </TableCell>
                  </TableRow>
                ) : filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-sm text-[#7C5D58]"
                    >
                      {t("receipts.empty_paid")}
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
                          {paymentLabel(receipt.paymentMethod)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {money.format(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold uppercase text-emerald-700">
                          {t("status.paid")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(receipt.orderNumericId)}
                          >
                            <Eye className="h-4 w-4" />
                            {t("common.view")}
                          </Button>
                          {isAdmin ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const resolved = receipt.orderNumericId || parseNumericId(receipt.id) || parseNumericId(receipt.orderId);
                                if (!resolved) {
                                  toast.error(t("receipts.delete_failed"));
                                  return;
                                }
                                setDeleteOrderId(resolved);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("common.delete")}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("receipts.details_title")}</DialogTitle>
              <DialogDescription>
                {t("receipts.details_desc")}
              </DialogDescription>
            </DialogHeader>

            {detailLoading ? (
              <div className="py-10 text-center text-sm text-[#7C5D58]">
                {t("receipts.details_loading")}
              </div>
          ) : detailError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {detailError}
            </div>
            ) : !detail ? (
              <div className="py-6 text-sm text-[#7C5D58]">{t("receipts.no_receipt_selected")}</div>
            ) : (
            <div className="space-y-5">
                {/* Receipt Preview with Custom Settings */}
                {detail.receipt_settings && (
                  <div className="rounded-xl border-2 border-[#4B2E2B] bg-white overflow-hidden shadow-lg">
                    <div className="bg-[#4B2E2B] px-4 py-2 text-center text-white text-sm font-semibold">
                      {t("receipts.customer_receipt_title")}
                    </div>
                    <div className="bg-white p-4">
                      {detail.receipt_settings.show_logo && (
                        <div className="mb-3 flex justify-center">
                          <img src="/img/logo-coffee.png" alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
                        </div>
                      )}
                      
                      <div className="text-center mb-3">
                        <p className="text-sm font-bold text-[#4B2E2B]">{detail.receipt_settings.shop_name}</p>
                        <p className="text-[11px] text-[#8E706B]">{detail.receipt_settings.address}</p>
                        <p className="text-[11px] text-[#8E706B]">{detail.receipt_settings.phone}</p>
                        {detail.receipt_settings.tax_id && (
                          <p className="text-[11px] text-[#8E706B]">{t("receipts.tax_id_label")}: {detail.receipt_settings.tax_id}</p>
                        )}
                      </div>

                      <div className="my-2 border-t border-dashed border-[#EAD6C0]" />

                      {detail.receipt_settings.show_order_number && (
                        <div className="flex items-center justify-between mb-2 text-[11px] font-semibold text-[#4B2E2B]">
                          <span>{t("receipts.order_number_label")} #{detail.order_id}</span>
                          <span>
                            {detail.order.created_at ? new Date(detail.order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      )}

                      {detail.receipt_settings.show_customer_name && (
                        <div className="flex items-center gap-1 mb-2 text-[11px] text-[#4B2E2B]">
                          <User className="h-3 w-3" />
                          <span>{t("receipts.customer_label")}: {detail.customer_label}</span>
                        </div>
                      )}

                      <div className="my-2 border-t border-dashed border-[#EAD6C0]" />

                      {/* Items */}
                      <div className="space-y-1 text-[11px] text-[#4B2E2B]">
                        {detail.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.qty}x {item.name || `#${item.product_id}`}</span>
                            <span>{money.format(item.line_total)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="my-2 border-t border-dashed border-[#EAD6C0]" />

                      {/* Totals */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between text-[#8E706B]">
                          <span>{t("receipts.subtotal")}</span>
                          <span>{money.format(detail.totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-[#8E706B]">
                          <span>{t("receipts.tax", { rate: detail.totals.tax_rate })}</span>
                          <span>{money.format(detail.totals.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-[#4B2E2B]">
                          <span>{t("receipts.total")}</span>
                          <span>{money.format(detail.totals.total)}</span>
                        </div>
                      </div>

                      {detail.receipt_settings.show_qr_payment && (
                        <div className="mt-3 flex flex-col items-center gap-1">
                          <div className="rounded bg-[#F8EFE4] p-2 text-[#4B2E2B]">
                            <QrCode className="h-8 w-8" />
                          </div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8E706B]">
                            {t("receipts.scan_to_pay")}
                          </p>
                        </div>
                      )}


                      {detail.receipt_settings.footer_message && (
                        <p className="mt-3 text-center text-[10px] italic leading-relaxed text-[#8E706B]">
                          {detail.receipt_settings.footer_message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Info Cards */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[#EAD6C0] bg-[#FAF7F2] p-3">
                    <p className="text-xs font-medium text-[#7C5D58]">{t("receipts.label_receipt")}</p>
                    <p className="font-semibold text-[#4B2E2B]">{detail.receipt_id}</p>
                  </div>
                  <div className="rounded-xl border border-[#EAD6C0] bg-[#FAF7F2] p-3">
                    <p className="text-xs font-medium text-[#7C5D58]">{t("receipts.label_order")}</p>
                    <p className="font-semibold text-[#4B2E2B]">{detail.order_id}</p>
                  </div>
                  <div className="rounded-xl border border-[#EAD6C0] bg-[#FAF7F2] p-3">
                    <p className="text-xs font-medium text-[#7C5D58]">{t("receipts.label_customer_table")}</p>
                    <p className="font-semibold text-[#4B2E2B]">{detail.customer_label}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#EAD6C0] bg-white">
                  <div className="border-b border-[#EAD6C0] px-4 py-3 text-sm font-semibold text-[#4B2E2B]">
                    {t("receipts.items")}
                  </div>
                  <div className="max-h-[40vh] overflow-auto p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("receipts.item")}</TableHead>
                          <TableHead>{t("receipts.size")}</TableHead>
                          <TableHead className="text-right">{t("receipts.qty")}</TableHead>
                          <TableHead className="text-right">{t("receipts.price")}</TableHead>
                          <TableHead className="text-right">{t("receipts.total")}</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {detail.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name || `#${item.product_id}`}
                          </TableCell>
                          <TableCell className="capitalize">{item.size || "-"}</TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">{money.format(item.price)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {money.format(item.line_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#EAD6C0] bg-white p-4">
                  <p className="text-sm font-semibold text-[#4B2E2B]">{t("receipts.staff_source")}</p>
                  <div className="mt-2 space-y-1 text-sm text-[#7C5D58]">
                    <div>
                      {t("receipts.created_by")}:{" "}
                      <span className="font-medium text-[#4B2E2B]">
                        {detail.source.created_by
                          ? (detail.source.created_by.actor_type === "system"
                              ? t("receipts.system_customer")
                              : `${detail.source.created_by.actor_name} (${detail.source.created_by.actor_type})`)
                          : t("receipts.system_customer")}
                      </span>
                    </div>
                    <div>
                      {t("receipts.completed_by")}:{" "}
                      <span className="font-medium text-[#4B2E2B]">
                        {detail.source.completed_by
                          ? `${detail.source.completed_by.actor_name} (${detail.source.completed_by.actor_type})`
                          : t("receipts.unknown")}
                      </span>
                    </div>
                    <div>
                      {t("receipts.payment")}:{" "}
                      <span className="font-medium text-[#4B2E2B]">
                        {detail.order.payment_type
                          ? paymentLabel((detail.order.payment_type.toLowerCase() as PaymentMethod) ?? "cash")
                          : "-"}
                      </span>
                    </div>
                    <div>
                      {t("receipts.paid_at")}:{" "}
                      <span className="font-medium text-[#4B2E2B]">
                        {detail.order.paid_at
                          ? new Date(detail.order.paid_at).toLocaleString(lang === "km" ? "km-KH" : "en-US")
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#EAD6C0] bg-white p-4">
                  <p className="text-sm font-semibold text-[#4B2E2B]">{t("receipts.totals")}</p>
                  <div className="mt-2 space-y-1 text-sm text-[#7C5D58]">
                    <div className="flex justify-between">
                      <span>{t("receipts.subtotal")}</span>
                      <span className="font-medium text-[#4B2E2B]">{money.format(detail.totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("receipts.tax", { rate: detail.totals.tax_rate })}</span>
                      <span className="font-medium text-[#4B2E2B]">{money.format(detail.totals.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#EAD6C0] pt-2">
                      <span className="font-semibold text-[#4B2E2B]">{t("receipts.total")}</span>
                      <span className="font-semibold text-[#4B2E2B]">{money.format(detail.totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

           <DialogFooter>
             {detail ? (
               <>
                 <Button
                   variant="outline"
                   onClick={() => openReceiptPrintWindow("print")}
                   disabled={detailLoading}
                 >
                   <Printer className="h-4 w-4" />
                   {t("receipts.print")}
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => openReceiptPrintWindow("pdf")}
                   disabled={detailLoading}
                 >
                   <Download className="h-4 w-4" />
                   {t("receipts.save_pdf")}
                 </Button>
               </>
             ) : null}
             {isAdmin && detail?.order?.id ? (
               <Button
                 variant="destructive"
                 onClick={() => setDeleteOrderId(detail.order.id)}
              >
                <Trash2 className="h-4 w-4" />
                {t("receipts.delete_receipt")}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              {t("receipts.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOrderId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteOrderId(null);
        }}
      >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("receipts.delete_confirm_title")}</DialogTitle>
              <DialogDescription>
                {t("receipts.delete_confirm_desc")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOrderId(null)} disabled={deleteLoading}>
                {t("btn.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? t("receipts.deleting") : t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
