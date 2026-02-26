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
} from "lucide-react"
import { fetchOrderHistory, LiveOrder, OrderHistoryParams, PaginatedResponse } from "../services/api"
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
} from "../components/ui/dialog"

// Mock data for demo when API is not available
const mockOrderHistory: LiveOrder[] = [
  {
    id: 105,
    queue_number: 105,
    status: "completed",
    total_price: 45.5,
    payment_type: "cash",
    created_at: "2026-02-25T18:30:00.000Z",
    updated_at: "2026-02-25T19:00:00.000Z",
    table: { id: 5, name: "Table 5" },
    items: [
      { id: 1, product_id: 1, size: "large", qty: 3, price: 5.5, product: { id: 1, name: "Cappuccino" } },
      { id: 2, product_id: 2, size: "regular", qty: 2, price: 4.0, product: { id: 2, name: "Croissant" } },
      { id: 3, product_id: 3, size: "medium", qty: 4, price: 6.0, product: { id: 3, name: "Latte" } },
    ],
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
    items: [
      { id: 4, product_id: 4, size: "small", qty: 2, price: 4.0, product: { id: 4, name: "Espresso" } },
      { id: 5, product_id: 5, size: "large", qty: 2, price: 7.0, product: { id: 5, name: "Mocha" } },
    ],
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
    items: [
      { id: 6, product_id: 6, size: "medium", qty: 2, price: 7.5, product: { id: 6, name: "Americano" } },
    ],
  },
  {
    id: 102,
    queue_number: 102,
    status: "completed",
    total_price: 68.0,
    payment_type: "khqr",
    created_at: "2026-02-25T14:30:00.000Z",
    updated_at: "2026-02-25T15:00:00.000Z",
    table: { id: 1, name: "Table 1" },
    items: [
      { id: 7, product_id: 7, size: "large", qty: 5, price: 8.0, product: { id: 7, name: "Flat White" } },
      { id: 8, product_id: 8, size: "regular", qty: 4, price: 7.0, product: { id: 8, name: "Blueberry Muffin" } },
    ],
  },
  {
    id: 101,
    queue_number: 101,
    status: "completed",
    total_price: 33.5,
    payment_type: "cash",
    created_at: "2026-02-25T12:00:00.000Z",
    updated_at: "2026-02-25T12:30:00.000Z",
    table: { id: 4, name: "Table 4" },
    items: [
      { id: 9, product_id: 9, size: "medium", qty: 3, price: 5.5, product: { id: 9, name: "Hot Chocolate" } },
      { id: 10, product_id: 10, size: "regular", qty: 2, price: 9.0, product: { id: 10, name: "Cheesecake" } },
    ],
  },
]

export default function OrderHistory() {
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Calculate totals
  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === "completed")
    const cancelled = orders.filter(o => o.status === "cancelled")
    const totalRevenue = completed.reduce((sum, o) => sum + o.total_price, 0)
    
    return {
      completed: completed.length,
      cancelled: cancelled.length,
      totalRevenue,
    }
  }, [orders])

  // Fetch orders
  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params: OrderHistoryParams = {
        page: currentPage,
      }
      
      if (searchQuery) params.search = searchQuery
      if (statusFilter !== "all") params.payment_type = statusFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      
      const response: PaginatedResponse<LiveOrder> = await fetchOrderHistory(params)
      setOrders(response.data)
      setTotalPages(response.last_page)
      setTotal(response.total)
    } catch {
      // Use mock data if API fails
      console.log("Using mock data for order history")
      let filtered = [...mockOrderHistory]
      
      if (searchQuery) {
        filtered = filtered.filter(o => 
          o.queue_number.toString().includes(searchQuery) ||
          o.id.toString().includes(searchQuery)
        )
      }
      
      if (statusFilter !== "all") {
        filtered = filtered.filter(o => o.status === statusFilter)
      }
      
      if (paymentFilter !== "all") {
        filtered = filtered.filter(o => o.payment_type === paymentFilter)
      }
      
      setOrders(filtered)
      setTotal(filtered.length)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, paymentFilter, dateFrom, dateTo])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleSearch = () => {
    setCurrentPage(1)
    loadOrders()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleViewDetails = (order: LiveOrder) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-500">View completed and cancelled orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">{total} total orders</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Orders</p>
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
                <p className="text-sm font-medium text-gray-500">Cancelled Orders</p>
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
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</p>
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
                  placeholder="Search by order ID or queue number..."
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Payment Type Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="khqr">KHQR</SelectItem>
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
              />
            </div>
            
            <span className="text-gray-400">to</span>
            
            {/* Date To */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>
            
            {/* Search Button */}
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <p>{error}</p>
              <Button variant="outline" onClick={loadOrders} className="mt-4">
                Retry
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Receipt className="h-12 w-12 mb-4" />
              <p>No orders found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Queue #</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <span className="font-bold text-lg">#{order.queue_number}</span>
                      </TableCell>
                      <TableCell>{order.table?.name || "Takeaway"}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
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
                          {order.payment_type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
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
            <DialogTitle>Order Details #{selectedOrder?.queue_number}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Queue Number</p>
                  <p className="font-medium">#{selectedOrder.queue_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Table</p>
                  <p className="font-medium">{selectedOrder.table?.name || "Takeaway"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment</p>
                  <p className="font-medium uppercase">{selectedOrder.payment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-lg text-blue-600">
                    {formatCurrency(selectedOrder.total_price)}
                  </p>
                </div>
              </div>
              
              {/* Items */}
              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
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
                          {formatCurrency(item.price * item.qty)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
