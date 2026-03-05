import { useEffect, useState, useMemo } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins === 1) return "1 min ago"
  if (diffMins < 60) return `${diffMins} mins ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return "1 hour ago"
  return `${diffHours} hours ago`
}

function formatTimeInStatus(status: string, updatedAt: string): string {
  const updated = new Date(updatedAt)
  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins === 1) return "1 min"
  if (diffMins < 60) return `${diffMins} mins`
  
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours}h ${diffMins % 60}m`
}

export default function LiveOrders() {
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch orders
  const loadOrders = async () => {
    try {
      setError(null)
      const data = await fetchLiveOrders()
      setOrders(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch live orders"
      setError(message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Initial load and auto-refresh
  useEffect(() => {
    loadOrders()
    
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

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
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      setError(null)
      await updateOrderStatus(orderId, newStatus)
      await loadOrders()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update order status"
      setError(message)
    }
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
            <h2 className="text-2xl font-bold text-[#4B2E2B]">Live Orders</h2>
            <p className="flex items-center gap-1 text-sm text-[#7C5D58]">
              <Clock className="h-3 w-3" />
              {currentTime.toLocaleTimeString("en-US", { 
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
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C5D58]" />
          <Input
            placeholder="Search by Order ID or Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
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
              <p className="text-sm text-[#7C5D58]">Pending</p>
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
              <p className="text-sm text-[#7C5D58]">Preparing</p>
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
              <p className="text-sm text-[#7C5D58]">Ready</p>
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
              <p className="text-sm text-[#7C5D58]">Total Active</p>
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
              <h3 className="text-lg font-semibold text-[#4B2E2B]">No active orders</h3>
              <p className="text-sm text-[#7C5D58]">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "New orders will appear here automatically"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5E6D3]/50 hover:bg-[#F5E6D3]/50">
                    <TableHead className="font-semibold">Order ID</TableHead>
                    <TableHead className="font-semibold">Table</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Items</TableHead>
                    <TableHead className="font-semibold">Total</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">In Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-semibold text-[#4B2E2B]">
                        #{order.queue_number}
                      </TableCell>
                      <TableCell>{order.table?.name || "Takeaway"}</TableCell>
                      <TableCell>{formatTimeAgo(order.created_at)}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-medium">
                        ${Number(order.total_price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-[#7C5D58]">
                        {formatTimeInStatus(order.status, order.updated_at)}
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
                                Start
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleStatusChange(order.id, "cancelled")}
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
                                Ready
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleStatusChange(order.id, "cancelled")}
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
                                Complete
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
                              View
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
              Order #{selectedOrder?.queue_number}
              {selectedOrder && <StatusBadge status={selectedOrder.status} />}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.table?.name || "Takeaway"} • {selectedOrder && formatTimeAgo(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Items */}
              <div>
                <h4 className="mb-2 font-semibold text-[#4B2E2B]">Order Items</h4>
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
                          <p className="font-medium text-[#4B2E2B]">{item.product?.name || `Product #${item.product_id}`}</p>
                          <p className="text-xs capitalize text-[#7C5D58]">{item.size}</p>
                        </div>
                      </div>
                      <span className="font-medium text-[#4B2E2B]">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-lg bg-[#F5E6D3]/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7C5D58]">Subtotal</span>
                  <span className="font-medium text-[#4B2E2B]">${Number(selectedOrder.total_price).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[#EAD6C0] pt-2">
                  <span className="font-semibold text-[#4B2E2B]">Total</span>
                  <span className="text-xl font-bold text-[#4B2E2B]">
                    ${Number(selectedOrder.total_price).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7C5D58]">Payment Method</span>
                <span className="font-medium capitalize text-[#4B2E2B]">{selectedOrder.payment_type}</span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
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
                Mark as Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
