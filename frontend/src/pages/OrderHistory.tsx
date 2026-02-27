import { useEffect, useState, useCallback, useRef } from "react"
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
  Download,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
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
    table: { id: 4, name: "Table 4" },
    items: [
      { id: 9, product_id: 9, size: "medium", qty: 3, price: 5.5, product: { id: 9, name: "Hot Chocolate" } },
      { id: 10, product_id: 10, size: "regular", qty: 2, price: 9.0, product: { id: 10, name: "Cheesecake" } },
    ],
  },
]

const isOnFilterDate = (createdAt: string, filterDate?: string) => {
  if (!filterDate) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filterDate)) return false

  const createdDate = new Date(createdAt)
  if (Number.isNaN(createdDate.getTime())) return false
  const createdIsoDate = createdDate.toISOString().slice(0, 10)
  return createdIsoDate === filterDate
}

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
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Stats from API
  const [stats, setStats] = useState({ completed: 0, cancelled: 0, totalRevenue: 0 })
  
  // Currency selection
  const [currency, setCurrency] = useState<"KHR" | "USD">("KHR")
  
  // Currency selection

  // Fetch orders
  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params: OrderHistoryParams = {
        page: currentPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      }
      
      if (searchQuery) params.search = searchQuery
      if (statusFilter !== "all") params.status = statusFilter
      if (paymentFilter !== "all") params.payment_type = paymentFilter
      if (dateFrom) {
        params.date_from = dateFrom
        params.date_to = dateFrom
      }
      
      const response: PaginatedResponse<LiveOrder> = await fetchOrderHistory(params)
      setOrders(response.data)
      setTotalPages(response.last_page)
      setTotal(response.total)
      
      // Calculate stats from all data (current page only as API doesn't provide aggregate)
      const completed = response.data.filter(o => o.status === "completed")
      const cancelled = response.data.filter(o => o.status === "cancelled")
      // Ensure total_price is treated as a number to prevent NaN
      const totalRevenue = completed.reduce((sum, o) => {
        const price = typeof o.total_price === 'number' ? o.total_price : parseFloat(o.total_price) || 0
        return sum + price
      }, 0)
      setStats({
        completed: completed.length,
        cancelled: cancelled.length,
        totalRevenue,
      })
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

      if (dateFrom) filtered = filtered.filter(o => isOnFilterDate(o.created_at, dateFrom))
      
      setOrders(filtered)
      setTotal(filtered.length)
      
      const completed = filtered.filter(o => o.status === "completed")
      const cancelled = filtered.filter(o => o.status === "cancelled")
      const totalRevenue = completed.reduce((sum, o) => {
        const price = typeof o.total_price === 'number' ? o.total_price : parseFloat(o.total_price) || 0
        return sum + price
      }, 0)
      setStats({
        completed: completed.length,
        cancelled: cancelled.length,
        totalRevenue,
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, paymentFilter, dateFrom, sortBy, sortOrder])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, paymentFilter, dateFrom, sortBy, sortOrder])

  // Use ref to store latest loadOrders function to avoid infinite loop
  const loadOrdersRef = useRef(loadOrders)
  loadOrdersRef.current = loadOrders

  // Reload orders when page or filters change
  useEffect(() => {
    loadOrdersRef.current()
  }, [currentPage, searchQuery, statusFilter, paymentFilter, dateFrom, sortBy, sortOrder])

  const handleSearch = () => {
    setCurrentPage(1)
    loadOrders()
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  // Helper function to escape CSV values
  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return ""
    const stringValue = String(value)
    // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return '"' + stringValue.replace(/"/g, '""') + '"'
    }
    return stringValue
  }

  // Format currency for CSV
  const formatCurrencyForCSV = (amount: number): string => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    if (currency === "KHR") {
      return String(Math.round(validAmount * 4100))
    }
    return validAmount.toFixed(2)
  }

  const handleExport = async () => {
    setLoading(true)
    let allOrders: LiveOrder[] = []
    
    try {
      // Fetch ALL orders (all pages) for comprehensive export
      const params: OrderHistoryParams = {}
      if (searchQuery) params.search = searchQuery
      if (statusFilter !== "all") params.status = statusFilter
      if (paymentFilter !== "all") params.payment_type = paymentFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      
      // Fetch first page to get total
      const firstPage: PaginatedResponse<LiveOrder> = await fetchOrderHistory({ ...params, page: 1 })
      allOrders = [...firstPage.data]
      
      // Fetch remaining pages
      for (let page = 2; page <= firstPage.last_page; page++) {
        const pageData: PaginatedResponse<LiveOrder> = await fetchOrderHistory({ ...params, page })
        allOrders = [...allOrders, ...pageData.data]
      }
    } catch {
      // Fallback to current page data if API fails
      console.log("Using current page data for CSV export")
      allOrders = orders
    } finally {
      setLoading(false)
    }
    
    // Build comprehensive CSV content
    const csvRows: string[] = []
    
    // Header row
    csvRows.push([
      "Order ID",
      "Queue Number",
      "Order Date",
      "Order Time",
      "Table",
      "Payment Type",
      "Status",
      "Item Count",
      "Subtotal",
      "Tax (0%)",
      "Total",
      "Currency",
      // Item details columns
      "Item 1 - Product",
      "Item 1 - Size",
      "Item 1 - Qty",
      "Item 1 - Price",
      "Item 1 - Subtotal",
      "Item 2 - Product",
      "Item 2 - Size",
      "Item 2 - Qty",
      "Item 2 - Price",
      "Item 2 - Subtotal",
      "Item 3 - Product",
      "Item 3 - Size",
      "Item 3 - Qty",
      "Item 3 - Price",
      "Item 3 - Subtotal",
      "Item 4 - Product",
      "Item 4 - Size",
      "Item 4 - Qty",
      "Item 4 - Price",
      "Item 4 - Subtotal",
      "Item 5 - Product",
      "Item 5 - Size",
      "Item 5 - Qty",
      "Item 5 - Price",
      "Item 5 - Subtotal",
    ].map(escapeCSV).join(","))
    
    // Data rows
    allOrders.forEach(order => {
      const date = new Date(order.created_at)
      const orderDate = date.toLocaleDateString("en-US")
      const orderTime = date.toLocaleTimeString("en-US", { hour12: false })
      const validPrice = typeof order.total_price === 'number' ? order.total_price : parseFloat(order.total_price) || 0
      const currencyValue = currency
      
      // Build item columns (up to 5 items)
      const itemColumns: string[] = []
      for (let i = 0; i < 5; i++) {
        const item = order.items[i]
        if (item) {
          const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
          itemColumns.push(
            escapeCSV(item.product?.name || "Unknown"),
            escapeCSV(item.size || ""),
            escapeCSV(item.qty),
            escapeCSV(formatCurrencyForCSV(itemPrice)),
            escapeCSV(formatCurrencyForCSV(itemPrice * item.qty))
          )
        } else {
          itemColumns.push("", "", "", "", "")
        }
      }
      
      csvRows.push([
        escapeCSV(order.id),
        escapeCSV(order.queue_number),
        escapeCSV(orderDate),
        escapeCSV(orderTime),
        escapeCSV(order.table?.name || "Takeaway"),
        escapeCSV(order.payment_type.toUpperCase()),
        escapeCSV(order.status.charAt(0).toUpperCase() + order.status.slice(1)),
        escapeCSV(order.items.length),
        escapeCSV(formatCurrencyForCSV(validPrice)),
        "0",
        escapeCSV(formatCurrencyForCSV(validPrice)),
        escapeCSV(currencyValue),
        ...itemColumns,
      ].join(","))
    })
    
    // Summary rows
    csvRows.push("")
    csvRows.push("SUMMARY")
    const completedOrders = allOrders.filter(o => o.status === "completed")
    const cancelledOrders = allOrders.filter(o => o.status === "cancelled")
    const totalRevenue = completedOrders.reduce((sum, o) => {
      const price = typeof o.total_price === 'number' ? o.total_price : parseFloat(o.total_price) || 0
      return sum + price
    }, 0)
    
    csvRows.push(["Total Orders", escapeCSV(allOrders.length)].join(","))
    csvRows.push(["Completed Orders", escapeCSV(completedOrders.length)].join(","))
    csvRows.push(["Cancelled Orders", escapeCSV(cancelledOrders.length)].join(","))
    csvRows.push(["Total Revenue", escapeCSV(formatCurrencyForCSV(totalRevenue)), escapeCSV(currency)].join(","))
    csvRows.push(["Generated At", escapeCSV(new Date().toLocaleString())].join(","))
    
    // Create and download CSV
    const csvContent = csvRows.join("\n")
    const BOM = "\uFEFF" // UTF-8 BOM for proper Excel handling
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `order_history_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(18)
    doc.text("Order History Report", 14, 22)
    
    // Date generated
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
    
    // Summary stats
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text(`Total Orders: ${orders.length}`, 14, 40)
    doc.text(`Completed: ${orders.filter(o => o.status === 'completed').length}`, 80, 40)
    doc.text(`Cancelled: ${orders.filter(o => o.status === 'cancelled').length}`, 140, 40)
    
    // Calculate total revenue
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (typeof o.total_price === 'number' ? o.total_price : parseFloat(o.total_price) || 0), 0)
    
    const revenueText = currency === 'KHR' 
      ? `៛${(totalRevenue * 4100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `${totalRevenue.toFixed(2)}`
    doc.text(`Total Revenue: ${revenueText}`, 14, 48)
    
    // Orders table
    const tableData = orders.map(order => {
      const validPrice = typeof order.total_price === 'number' ? order.total_price : parseFloat(order.total_price) || 0
      const priceText = currency === 'KHR'
        ? `៛${(validPrice * 4100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `${validPrice.toFixed(2)}`
      
      return [
        `#${order.id}`,
        `#${order.queue_number}`,
        order.table?.name || "Takeaway",
        order.items.length.toString(),
        priceText,
        order.payment_type.toUpperCase(),
        order.status.charAt(0).toUpperCase() + order.status.slice(1),
        new Date(order.created_at).toLocaleDateString(),
      ]
    })
    
    autoTable(doc, {
      head: [['Order ID', 'Queue #', 'Table', 'Items', 'Total', 'Payment', 'Status', 'Date']],
      body: tableData,
      startY: 55,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 15 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 25 },
      },
    })
    
    // Add item details for each order on a new page
    let yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
    
    // If we need more pages for item details
    orders.forEach((order) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Order #${order.queue_number} - Details`, 14, yPos)
      yPos += 8
      
      // Order info
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(`Order ID: #${order.id} | Table: ${order.table?.name || "Takeaway"} | Payment: ${order.payment_type.toUpperCase()} | Status: ${order.status}`, 14, yPos)
      yPos += 6
      
      // Items table for this order
      const itemData = order.items.map(item => {
        const validPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
        const itemPrice = currency === 'KHR'
          ? `៛${(validPrice * 4100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : `${validPrice.toFixed(2)}`
        const itemSubtotal = currency === 'KHR'
          ? `៛${(validPrice * item.qty * 4100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : `${(validPrice * item.qty).toFixed(2)}`
        
        return [
          item.product?.name || "Unknown",
          item.size || "-",
          item.qty.toString(),
          itemPrice,
          itemSubtotal,
        ]
      })
      
      autoTable(doc, {
        head: [['Product', 'Size', 'Qty', 'Price', 'Subtotal']],
        body: itemData,
        startY: yPos,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
      })
      
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    })
    
    // Save the PDF
    doc.save(`order_history_${new Date().toISOString().split("T")[0]}.pdf`)
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
    // Ensure amount is a valid number to prevent NaN
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    
    if (currency === "KHR") {
      // Convert USD to KHR (approximate rate: 1 USD = 4100 KHR)
      const khrAmount = validAmount * 4100
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KHR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(khrAmount)
    }
    // For USD, show with $ prefix
    return "$" + validAmount.toFixed(2)
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
        <div className="flex items-center gap-4">
          {/* Currency Selector */}
          <Select value={currency} onValueChange={(value: "KHR" | "USD") => setCurrency(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KHR">KHR (Riel)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">{total} total orders</span>
          </div>
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
                placeholder="From date"
              />
            </div>
            
            {/* Date To */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
                placeholder="To date"
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
                    <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort("id")}>
                      <div className="flex items-center gap-1">
                        Order ID
                        {sortBy === "id" && (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort("queue_number")}>
                      <div className="flex items-center gap-1">
                        Queue #
                        {sortBy === "queue_number" && (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort("total_price")}>
                      <div className="flex items-center gap-1">
                        Total
                        {sortBy === "total_price" && (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-1">
                        Date
                        {sortBy === "created_at" && (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
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
                        {formatCurrency(typeof order.total_price === 'number' ? order.total_price : parseFloat(order.total_price) || 0)}
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
                    Page {currentPage} of {totalPages} ({total} total orders)
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
                    <span className="text-sm text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
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
                    {formatCurrency(typeof selectedOrder.total_price === 'number' ? selectedOrder.total_price : parseFloat(selectedOrder.total_price) || 0)}
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
                        <TableCell className="font-medium">{item.product?.name || "Unknown Product"}</TableCell>
                        <TableCell>
                          <span className="capitalize">{item.size}</span>
                        </TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{formatCurrency(typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency((typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) * item.qty)}
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
