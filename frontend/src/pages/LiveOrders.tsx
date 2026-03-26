import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
  Coffee,
  ShoppingCart,
  ChefHat,
  Check,
  AlertCircle,
} from "lucide-react"
import { fetchLiveOrders, updateOrderStatus, LiveOrder } from "../services/api"
import { useSettings } from "../context/SettingsContext"
import { useI18n } from "../context/I18nContext"
import { StatusBadge } from "../components/StatusBadge"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"
import { useAutoRefresh } from "../hooks"

function formatTimeAgo(
  t: (_key: string, _vars?: Record<string, string | number>) => string,
  dateString: string
): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return t("common.just_now")
  if (diffMins === 1) return t("common.minute_ago")
  if (diffMins < 60) return t("common.minutes_ago", { n: diffMins })
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return t("common.hour_ago")
  return t("common.hours_ago", { n: diffHours })
}

function formatTimeInStatus(
  t: (_key: string, _vars?: Record<string, string | number>) => string,
  status: string,
  updatedAt: string
): string {
  const updated = new Date(updatedAt)
  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return t("common.just_now")
  if (diffMins === 1) return t("common.minute_short")
  if (diffMins < 60) return t("common.minutes_short", { n: diffMins })
  
  const diffHours = Math.floor(diffMins / 60)
  return t("common.hours_minutes_short", { h: diffHours, m: diffMins % 60 })
}

export default function LiveOrders() {
  const { t, lang } = useI18n()
  const { currency } = useSettings()
  const money = useMemo(
    () =>
      new Intl.NumberFormat(lang === "km" ? "km-KH" : "en-US", {
        style: "currency",
        currency,
      }),
    [currency, lang],
  )
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<{ id: number; queueNumber: number } | null>(null)
  const defaultCancellationMessage = t("live_orders.cancel_default_message")
  const [cancellationMessage, setCancellationMessage] = useState(defaultCancellationMessage)
  const [cancellationDirty, setCancellationDirty] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const paymentLabel = useCallback(
    (method?: string | null) => {
      const raw = String(method ?? "").toLowerCase()
      if (raw === "cash") return t("payment.cash")
      if (raw === "credit_card") return t("payment.credit_card")
      if (raw === "aba_pay") return t("payment.aba_pay")
      if (raw === "wing_money") return t("payment.wing_money")
      if (raw === "khqr") return t("payment.khqr")
      return method ? String(method) : "-"
    },
    [t],
  )

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!cancellationDirty) {
      setCancellationMessage(defaultCancellationMessage)
    }
  }, [cancellationDirty, defaultCancellationMessage])

  // Fetch orders
  const loadOrders = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchLiveOrders(true)
      setOrders(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : t("live_orders.failed_fetch")
      setError(message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useAutoRefresh(loadOrders, { enabled: autoRefresh, intervalMs: 10000 })

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const orderId = `#ORD-${order.queue_number}`.toLowerCase()
        const tableName = order.table?.name?.toLowerCase() || ""
        return orderId.includes(query) || tableName.includes(query)
      }
      
      return true
    })
  }, [orders, statusFilter, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length
    const preparing = orders.filter((o) => o.status === "preparing").length
    const ready = orders.filter((o) => o.status === "ready").length
    const total = orders.length
    
    return { pending, preparing, ready, total }
  }, [orders])

  // Handle status change
  const handleStatusChange = async (orderId: number, newStatus: string, cancellationMessage?: string) => {
    try {
      setError(null)
      await updateOrderStatus(orderId, newStatus, cancellationMessage)
      await loadOrders()
    } catch (err) {
      const message = err instanceof Error ? err.message : t("live_orders.failed_update")
      setError(message)
    }
  }

  // Open cancel dialog
  const openCancelDialog = (orderId: number, queueNumber: number | null) => {
    setOrderToCancel({ id: orderId, queueNumber: queueNumber ?? 0 })
    setCancellationMessage(defaultCancellationMessage)
    setCancellationDirty(false)
    setCancelDialogOpen(true)
  }

  // Handle view details
  const handleViewDetails = (order: LiveOrder) => {
    setSelectedOrder(order)
    setDetailsOpen(true)
  }


  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4B2E2B]">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#4B2E2B]">{t("live_orders.title")}</h2>
            <p className="flex items-center gap-1 text-sm text-[#7C5D58]">
              <Clock className="h-3 w-3" />
              {currentTime.toLocaleTimeString(lang === "km" ? "km-KH" : "en-US", { 
                hour: "2-digit", 
                minute: "2-digit", 
                second: "2-digit" 
              })}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? t("live_orders.auto_refresh_on") : t("live_orders.auto_refresh_off")}
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C5D58]" />
          <Input
            placeholder={t("live_orders.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t("live_orders.filter_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("live_orders.all_statuses")}</SelectItem>
            <SelectItem value="pending">{t("status.pending")}</SelectItem>
            <SelectItem value="preparing">{t("status.preparing")}</SelectItem>
            <SelectItem value="ready">{t("status.ready")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Pending Orders */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#4B2E2B]">{stats.pending}</p>
              <p className="text-sm text-[#7C5D58]">{t("status.pending")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Preparing */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <ChefHat className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#4B2E2B]">{stats.preparing}</p>
              <p className="text-sm text-[#7C5D58]">{t("status.preparing")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ready for Pickup */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#4B2E2B]">{stats.ready}</p>
              <p className="text-sm text-[#7C5D58]">{t("status.ready")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Active */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Coffee className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#4B2E2B]">{stats.total}</p>
              <p className="text-sm text-[#7C5D58]">{t("live_orders.total_active")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-[#4B2E2B]" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5E6D3]">
                <Coffee className="h-8 w-8 text-[#7C5D58]" />
              </div>
              <h3 className="text-lg font-semibold text-[#4B2E2B]">{t("live_orders.no_active_orders")}</h3>
              <p className="text-sm text-[#7C5D58]">
                {searchQuery || statusFilter !== "all"
                  ? t("live_orders.try_adjusting_filters")
                  : t("live_orders.new_orders_appear")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5E6D3]/50 hover:bg-[#F5E6D3]/50">
                    <TableHead className="font-semibold">{t("table.order_id")}</TableHead>
                    <TableHead className="font-semibold">{t("table.table")}</TableHead>
                    <TableHead className="font-semibold">{t("common.time")}</TableHead>
                    <TableHead className="font-semibold">{t("common.items")}</TableHead>
                    <TableHead className="font-semibold">{t("table.total")}</TableHead>
                    <TableHead className="font-semibold">{t("table.status")}</TableHead>
                    <TableHead className="font-semibold">{t("common.in_status")}</TableHead>
                    <TableHead className="font-semibold text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-semibold text-[#4B2E2B]">
                        #{order.queue_number}
                      </TableCell>
                      <TableCell>{order.table?.name || t("common.takeaway")}</TableCell>
                      <TableCell>{formatTimeAgo(t, order.created_at)}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-medium">
                        {money.format(Number(order.total_price))}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-[#7C5D58]">
                        {formatTimeInStatus(t, order.status, order.updated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {/* Action buttons based on status */}
                          {order.status === "pending" && (
                            <>
                              <Button
                                variant="info"
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "preparing")}
                              >
                                <PlayCircle className="mr-1 h-4 w-4" />
                                {t("live_orders.start")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => openCancelDialog(order.id, order.queue_number)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {order.status === "preparing" && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "ready")}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                {t("status.ready")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => openCancelDialog(order.id, order.queue_number)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {order.status === "ready" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "completed")}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                {t("live_orders.complete")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(order.status === "completed" || order.status === "cancelled") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              {t("live_orders.view")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t("common.order")} #{selectedOrder?.queue_number}
              {selectedOrder && <StatusBadge status={selectedOrder.status} />}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.table?.name || t("common.takeaway")} • {selectedOrder && formatTimeAgo(t, selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Items */}
              <div>
                <h4 className="mb-2 font-semibold text-[#4B2E2B]">{t("common.order_items")}</h4>
                <div className="rounded-lg border border-[#EAD6C0]">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 ${
                        index !== selectedOrder.items.length - 1
                          ? "border-b border-[#EAD6C0]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F5E6D3] text-xs font-semibold text-[#4B2E2B]">
                          {item.qty}
                        </span>
                        <div>
                          <p className="font-medium text-[#4B2E2B]">
                            {item.product?.name || `${t("common.product")} #${item.product_id}`}
                          </p>
                          <p className="text-xs capitalize text-[#7C5D58]">{item.size}</p>
                        </div>
                      </div>
                      <span className="font-medium text-[#4B2E2B]">
                        {money.format(Number(item.price) * Number(item.qty))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-lg bg-[#F5E6D3]/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7C5D58]">{t("common.subtotal")}</span>
                  <span className="font-medium text-[#4B2E2B]">{money.format(Number(selectedOrder.total_price))}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[#EAD6C0] pt-2">
                  <span className="font-semibold text-[#4B2E2B]">{t("common.total_amount")}</span>
                  <span className="text-xl font-bold text-[#4B2E2B]">
                    {money.format(Number(selectedOrder.total_price))}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7C5D58]">{t("common.payment_method")}</span>
                <span className="font-medium text-[#4B2E2B]">{paymentLabel(selectedOrder.payment_type)}</span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              {t("common.close")}
            </Button>
            {selectedOrder?.status === "ready" && (
              <Button
                variant="default"
                onClick={() => {
                  if (selectedOrder) {
                    handleStatusChange(selectedOrder.id, "completed")
                    setDetailsOpen(false)
                  }
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                {t("live_orders.mark_completed")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("live_orders.cancel_order_title")}</DialogTitle>
            <DialogDescription>
              {t("live_orders.cancel_order_desc", { n: orderToCancel?.queueNumber ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-message">{t("live_orders.cancel_message_label")}</Label>
            <Input
              id="cancel-message"
              value={cancellationMessage}
              onChange={(e) => {
                setCancellationDirty(true)
                setCancellationMessage(e.target.value)
              }}
              placeholder={t("live_orders.cancel_message_placeholder")}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t("live_orders.cancel_keep")}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (orderToCancel) {
                  await handleStatusChange(orderToCancel.id, "cancelled", cancellationMessage)
                  setCancelDialogOpen(false)
                  setOrderToCancel(null)
                  setCancellationMessage(defaultCancellationMessage)
                  setCancellationDirty(false)
                }
              }}
            >
              {t("live_orders.cancel_yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
