import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  RefreshCw,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { fetchOrderHistory, LiveOrder, OrderHistoryParams, PaginatedOrderHistoryResponse, OrderHistorySummary } from "../services/api"
import { updateOrderStatus } from "../services/api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { useSettings } from "../context/SettingsContext"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog"
import { useI18n } from "../context/I18nContext"
import { useAutoRefresh } from "../hooks"

const KHR_PER_USD = 4100

export default function OrderHistory() {
  const { currency } = useSettings()
  const { t, lang } = useI18n()
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string
    status: string
    payment: string
    dateFrom: string
    dateTo: string
  }>({
    search: "",
    status: "all",
    payment: "all",
    dateFrom: "",
    dateTo: "",
  })
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<OrderHistorySummary | null>(null)

  const toNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0
    }
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value.replace(/,/g, ""))
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  // Calculate totals
  const stats = useMemo(() => {
    const completed = summary?.completed_count ?? orders.filter(o => o.status === "completed").length
    const cancelled = summary?.cancelled_count ?? orders.filter(o => o.status === "cancelled").length
    const totalRevenue = summary ? toNumber(summary.total_revenue) : orders
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + toNumber(o.total_price), 0)
    const totalRevenueKhr = totalRevenue * KHR_PER_USD
    
    return {
      completed: toNumber(completed),
      cancelled: toNumber(cancelled),
      totalRevenue,
      totalRevenueKhr,
    }
  }, [orders, summary])

  // Fetch orders
  const loadOrders = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (background) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    if (!background) {
      setError(null)
    }
    
    try {
      const params: OrderHistoryParams = {
        page: currentPage,
      }
      
      if (appliedFilters.search) params.search = appliedFilters.search
      if (appliedFilters.status !== "all") params.status = appliedFilters.status
      if (appliedFilters.payment !== "all") params.payment_type = appliedFilters.payment
      if (appliedFilters.dateFrom) params.date_from = appliedFilters.dateFrom
      if (appliedFilters.dateTo) params.date_to = appliedFilters.dateTo
      
      const response: PaginatedOrderHistoryResponse = await fetchOrderHistory(params, true)
      setOrders(response.data)
      setTotalPages(response.last_page)
      setTotal(response.total)
      setSummary(response.summary ?? null)
    } catch (err) {
      if (!background) {
        setError(err instanceof Error ? err.message : t("order_history.load_failed"))
        setOrders([])
        setTotal(0)
        setTotalPages(1)
        setSummary(null)
      }
    } finally {
      if (background) {
        setIsRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [currentPage, appliedFilters, t])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useAutoRefresh(() => loadOrders({ background: true }), { intervalMs: 10000, immediate: false })

  const handleSearch = () => {
    setAppliedFilters({
      search: searchQuery.trim(),
      status: statusFilter,
      payment: paymentFilter,
      dateFrom,
      dateTo,
    })
    setCurrentPage(1)
  }

  const formatActorType = (actorType?: string | null) => {
    const raw = String(actorType ?? "").toLowerCase().trim()
    if (!raw) return t("common.unknown")
    if (raw === "admin") return t("role.admin")
    if (raw === "staff") return t("role.staff")
    if (raw === "system") return t("actor.system")
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }

  const latestActionFor = (order: LiveOrder) => order.actions?.[0] ?? null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(lang === "km" ? "km-KH" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: unknown) => {
    return new Intl.NumberFormat(lang === "km" ? "km-KH" : "en-US", {
      style: "currency",
      currency,
    }).format(toNumber(amount))
  }

  const formatRiel = (amount: unknown) => {
    return new Intl.NumberFormat("km-KH", {
      style: "currency",
      currency: "KHR",
      maximumFractionDigits: 0,
    }).format(toNumber(amount))
  }

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

  const statusLabel = useCallback(
    (status?: string | null) => {
      const raw = String(status ?? "").toLowerCase()
      if (raw === "pending") return t("status.pending")
      if (raw === "preparing") return t("status.preparing")
      if (raw === "ready") return t("status.ready")
      if (raw === "completed") return t("status.completed")
      if (raw === "cancelled") return t("status.cancelled")
      return status ? String(status) : t("common.unknown")
    },
    [t],
  )

  const handleViewDetails = (order: LiveOrder) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  const handleHistoryStatusChange = async (
    order: LiveOrder,
    nextStatus: "completed" | "cancelled",
  ) => {
    if (order.status === nextStatus) return

    try {
      setUpdatingOrderId(order.id)
      const updated = await updateOrderStatus(order.id, nextStatus)

      setOrders((prev) =>
        prev.map((current) => (current.id === order.id ? { ...current, ...updated } : current)),
      )
      setSelectedOrder((current) =>
        current?.id === order.id ? { ...current, ...updated } : current,
      )

      toast.success(
        t("order_history.marked_status", {
          n: order.queue_number,
          status: statusLabel(nextStatus),
        }),
      )
      await loadOrders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("order_history.update_failed"))
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t("order_history.completed_orders")}</p>

                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t("order_history.cancelled_orders")}</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t("order_history.total_revenue")}</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm font-semibold text-[#4B2E2B]">
                  {formatRiel(stats.totalRevenueKhr)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("order_history.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("order_history.filter_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("order_history.status_all")}</SelectItem>
                <SelectItem value="completed">{t("status.completed")}</SelectItem>
                <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Payment Type Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("order_history.payment_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("order_history.payment_all")}</SelectItem>
                <SelectItem value="cash">{t("payment.cash")}</SelectItem>
                <SelectItem value="credit_card">{t("payment.credit_card")}</SelectItem>
                <SelectItem value="aba_pay">{t("payment.aba_pay")}</SelectItem>
                <SelectItem value="wing_money">{t("payment.wing_money")}</SelectItem>
                <SelectItem value="khqr">{t("payment.khqr")}</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date From */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
                aria-label={t("order_history.date_from")}
              />
            </div>
            
            <span className="text-gray-400">{t("order_history.date_to")}</span>
            
            {/* Date To */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
                aria-label={t("order_history.date_to")}
              />
            </div>
            
            {/* Search Button */}
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              {t("order_history.apply_filters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 relative">
          {isRefreshing && !loading && (
            <div
              className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 text-xs text-gray-600 shadow-sm backdrop-blur"
              aria-label="Refreshing"
              title="Refreshing"
            >
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">Refreshing</span>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <p>{error}</p>
              <Button variant="outline" onClick={() => void loadOrders()} className="mt-4">
                {t("common.retry")}
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Receipt className="h-12 w-12 mb-4" />
              <p>{t("order_history.no_orders_found")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.order_id")}</TableHead>
                    <TableHead>{t("order_history.queue_number")}</TableHead>
                    <TableHead>{t("table.table")}</TableHead>
                    <TableHead>{t("common.items")}</TableHead>
                    <TableHead>{t("table.total")}</TableHead>
                    <TableHead>{t("receipts.payment")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("order_history.last_action")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <span className="font-bold text-lg">#{order.queue_number}</span>
                      </TableCell>
                      <TableCell>{order.table?.name || t("common.takeaway")}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {order.items.length} {t("common.items")}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.total_price)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment_type === "cash" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {paymentLabel(order.payment_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        {latestActionFor(order) ? (
                          <div className="text-xs leading-5">
                            <p className="font-medium text-gray-800">
                              {latestActionFor(order)?.actor_name}
                            </p>
                            <p className="text-gray-500">
                              {formatActorType(latestActionFor(order)?.actor_type)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">{t("order_history.no_actions_yet")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={order.status === "completed" ? "default" : "outline"}
                            size="sm"
                            disabled={updatingOrderId === order.id}
                            onClick={() => void handleHistoryStatusChange(order, "completed")}
                          >
                            {updatingOrderId === order.id && order.status !== "completed" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant={order.status === "cancelled" ? "destructive" : "outline"}
                            size="sm"
                            disabled={updatingOrderId === order.id}
                            onClick={() => void handleHistoryStatusChange(order, "cancelled")}
                          >
                            {updatingOrderId === order.id && order.status !== "cancelled" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-gray-500">
                    {t("order_history.page_of", { page: currentPage, pages: totalPages })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("order_history.order_details", { n: selectedOrder?.queue_number ?? "" })}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">{t("table.order_id")}</p>
                  <p className="font-medium">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("order_history.queue_number")}</p>
                  <p className="font-medium">#{selectedOrder.queue_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("table.table")}</p>
                  <p className="font-medium">{selectedOrder.table?.name || t("common.takeaway")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("common.payment_method")}</p>
                  <p className="font-medium">{paymentLabel(selectedOrder.payment_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("table.status")}</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("common.last_updated")}</p>
                  <p className="font-medium">{formatDate(selectedOrder.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("table.total")}</p>
                  <p className="font-bold text-lg text-blue-600">
                    {formatCurrency(selectedOrder.total_price)}
                  </p>
                </div>
              </div>
              
              {/* Items */}
              <div>
                <h4 className="font-semibold mb-2">{t("common.order_items")}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.product")}</TableHead>
                      <TableHead>{t("common.size")}</TableHead>
                      <TableHead>{t("common.qty")}</TableHead>
                      <TableHead>{t("common.price")}</TableHead>
                      <TableHead className="text-right">{t("common.subtotal")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product?.name}</TableCell>
                        <TableCell>
                          <span className="capitalize">{item.size}</span>
                        </TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(toNumber(item.price) * toNumber(item.qty))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  disabled={updatingOrderId === selectedOrder.id || selectedOrder.status === "completed"}
                  onClick={() => void handleHistoryStatusChange(selectedOrder, "completed")}
                >
                  {updatingOrderId === selectedOrder.id && selectedOrder.status !== "completed" ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {t("order_history.mark_completed")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={updatingOrderId === selectedOrder.id || selectedOrder.status === "cancelled"}
                  onClick={() => void handleHistoryStatusChange(selectedOrder, "cancelled")}
                >
                  {updatingOrderId === selectedOrder.id && selectedOrder.status !== "cancelled" ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {t("order_history.mark_cancelled")}
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-2">{t("order_history.action_timeline")}</h4>
                {selectedOrder.actions && selectedOrder.actions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.actions.map((action) => (
                      <div
                        key={action.id}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {action.actor_name}
                              <span className="ml-2 text-xs font-normal uppercase tracking-wide text-gray-500">
                                {formatActorType(action.actor_type)}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              {action.description || t("order_history.action_recorded")}
                            </p>
                            {(action.from_status || action.to_status) && (
                              <p className="mt-1 text-xs text-gray-500">
                                {t("order_history.status_change", {
                                  from: statusLabel(action.from_status),
                                  to: statusLabel(action.to_status),
                                })}
                              </p>
                            )}
                          </div>
                          <p className="whitespace-nowrap text-xs text-gray-500">
                            {formatDate(action.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("order_history.no_recorded_actions")}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
