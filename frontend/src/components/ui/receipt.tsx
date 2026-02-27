import { 
  LayoutDashboard, 
  PlayCircle, 
  History, 
  FileText, 
  UtensilsCrossed, 
  Grid2X2, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  QrCode,
  Banknote,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

// --- Types ---

interface Receipt {
  id: string;
  orderId: string;
  dateTime: string;
  customer: string;
  amount: number;
  paymentMethod: 'QR Code' | 'Cash';
  status: 'PAID';
}

// --- Mock Data ---

const MOCK_RECEIPTS: Receipt[] = [
  { id: '#REC-8422', orderId: '#ORD-1042', dateTime: 'May 12, 09:42 AM', customer: 'Sokha Phala', amount: 12.50, paymentMethod: 'QR Code', status: 'PAID' },
  { id: '#REC-8421', orderId: '#ORD-1041', dateTime: 'May 12, 09:30 AM', customer: 'Bopha Devi', amount: 4.00, paymentMethod: 'Cash', status: 'PAID' },
  { id: '#REC-8420', orderId: '#ORD-1040', dateTime: 'May 12, 09:15 AM', customer: 'Guest (Walk-in)', amount: 18.25, paymentMethod: 'QR Code', status: 'PAID' },
  { id: '#REC-8419', orderId: '#ORD-1039', dateTime: 'May 12, 08:50 AM', customer: 'Chakra Vong', amount: 6.75, paymentMethod: 'Cash', status: 'PAID' },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, sub = false, color = "text-white/70" }: { icon: any, label: string, active?: boolean, sub?: boolean, color?: string }) => (
  <a 
    href="#" 
    className={`flex items-center px-4 py-2.5 text-sm transition-colors rounded-lg ${
      active 
        ? 'font-bold text-brand-sidebar bg-brand-active shadow-sm' 
        : `font-medium ${color} hover:bg-white/5`
    }`}
  >
    <Icon className={`w-5 h-5 mr-3 ${active ? 'text-brand-sidebar' : ''}`} />
    {label}
  </a>
);

const SectionHeader = ({ label }: { label: string }) => (
  <p className="px-4 text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2 mt-6">
    {label}
  </p>
);

const StatsCard = ({ label, value, icon: Icon, iconBg, iconColor }: { label: string, value: string, icon: any, iconBg: string, iconColor: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
    <div>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
  </div>
);

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-sidebar text-white flex flex-col flex-shrink-0 h-full overflow-y-auto custom-scrollbar">
        <div className="p-6 flex items-center space-x-3 border-b border-white/10">
          <div className="w-10 h-10 bg-brand-accent-green-text rounded-full flex items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Prey Lang Coffee</h1>
            <p className="text-[10px] text-white/60">Admin Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" />
          
          <SectionHeader label="Orders" />
          <div className="space-y-1">
            <SidebarItem icon={PlayCircle} label="Live Orders" />
            <SidebarItem icon={History} label="Order History" />
            <SidebarItem icon={FileText} label="Receipts" active />
          </div>

          <SectionHeader label="Menu Management" />
          <div className="space-y-1">
            <SidebarItem icon={UtensilsCrossed} label="Products" />
            <SidebarItem icon={Grid2X2} label="Categories" />
          </div>

          <SectionHeader label="Performance" />
          <div className="space-y-1">
            <SidebarItem icon={TrendingUp} label="Income & Expenses" />
            <SidebarItem icon={BarChart3} label="Sales Analytics" />
          </div>
        </nav>

        <div className="px-4 py-6 border-t border-white/10 space-y-2">
          <SidebarItem icon={Settings} label="Settings" />
          <SidebarItem icon={HelpCircle} label="Support" />
          <SidebarItem icon={LogOut} label="Logout" color="text-orange-400 hover:text-orange-300" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="bg-white px-8 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-brand-sidebar" />
            <h2 className="text-xl font-bold">Receipts</h2>
          </div>
          
          <div className="flex items-center space-x-6">
            <span className="text-sm text-slate-500">May 12, 2026</span>
            
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <Bell className="w-6 h-6 text-slate-400" />
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">3</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-none">Admin User</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Manager</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden border border-emerald-200">
                <img 
                  src="https://picsum.photos/seed/admin/100/100" 
                  alt="Admin" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              label="Total Receipts" 
              value="1,284" 
              icon={FileText} 
              iconBg="bg-gray-50" 
              iconColor="text-brand-sidebar/60" 
            />
            <StatsCard 
              label="Total Collected" 
              value="$15,420.50" 
              icon={Banknote} 
              iconBg="bg-brand-accent-green" 
              iconColor="text-brand-accent-green-text" 
            />
            <StatsCard 
              label="Today's Receipts" 
              value="42" 
              icon={Clock} 
              iconBg="bg-brand-accent-peach" 
              iconColor="text-brand-accent-peach-icon" 
            />
          </section>

          {/* Receipt Archive Table */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Table Header/Filters */}
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="font-bold text-slate-800">Receipt Archive</h4>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search receipts..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm focus:ring-brand-sidebar focus:border-brand-sidebar outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <select className="bg-gray-50 border border-gray-100 rounded-lg py-2 pl-4 pr-10 text-sm focus:ring-brand-sidebar focus:border-brand-sidebar outline-none appearance-none">
                  <option>All Payment Methods</option>
                  <option>Cash</option>
                  <option>QR Code</option>
                </select>

                <button className="bg-brand-sidebar text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-opacity-90 transition-all">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Receipt ID</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {MOCK_RECEIPTS.map((receipt, idx) => (
                    <motion.tr 
                      key={receipt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 font-bold">{receipt.id}</td>
                      <td className="px-6 py-5 text-slate-400">{receipt.orderId}</td>
                      <td className="px-6 py-5 text-slate-500">{receipt.dateTime}</td>
                      <td className="px-6 py-5 font-semibold text-slate-700">{receipt.customer}</td>
                      <td className="px-6 py-5 text-right font-bold">${receipt.amount.toFixed(2)}</td>
                      <td className="px-6 py-5">
                        <div className={`flex items-center space-x-2 ${receipt.paymentMethod === 'QR Code' ? 'text-blue-500' : 'text-slate-500'}`}>
                          {receipt.paymentMethod === 'QR Code' ? <QrCode className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                          <span>{receipt.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 rounded-md bg-brand-accent-green text-brand-accent-green-text text-[10px] font-bold">
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-6 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto">
              <p className="text-sm text-slate-500">Showing 1 to 10 of 1,284 results</p>
              <nav className="flex items-center space-x-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-slate-400">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-sidebar text-white font-bold text-xs">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 text-slate-500 font-medium text-xs">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 text-slate-500 font-medium text-xs">3</button>
                <span className="text-slate-400 text-xs px-1">...</span>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 text-slate-500 font-medium text-xs">129</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
