import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchDashboardData, DashboardData } from "../services/api";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
  completed: "bg-neutral-200 text-neutral-700",
};

const defaultData: DashboardData = {
  stats: [
    { label: "Total Revenue Today", value: "$0.00", trend: "Loading...", accent: "text-emerald-600" },
    { label: "Total Orders Today", value: "0", trend: "Loading...", accent: "text-emerald-600" },
    { label: "Low Stock Items", value: "0", trend: "Loading...", accent: "text-emerald-600" },
    { label: "Monthly Profit", value: "$0.00", trend: "Loading...", accent: "text-emerald-600" },
  ],
  revenueData: [
    { name: "Mon", revenue: 0 },
    { name: "Tue", revenue: 0 },
    { name: "Wed", revenue: 0 },
    { name: "Thu", revenue: 0 },
    { name: "Fri", revenue: 0 },
    { name: "Sat", revenue: 0 },
    { name: "Sun", revenue: 0 },
  ],
  categoryData: [
    { category: "Coffee", orders: 0 },
    { category: "Tea", orders: 0 },
    { category: "Pastries", orders: 0 },
    { category: "Smoothies", orders: 0 },
    { category: "Sandwiches", orders: 0 },
  ],
  recentOrders: [],
  lowStockItems: [],
  notifications: [],
};

export default function DashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
        setError(null);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load data. Using default values.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-[#4B2E2B] to-[#6B4E4B] px-6 py-7 text-white shadow-md">
        <h2 className="text-2xl font-semibold">Welcome back, Admin! ☕</h2>
        <p className="mt-2 text-sm text-white/85">
          Here's what's happening with your coffee shop today
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-[#7C5D58]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[#4B2E2B]">{card.value}</p>
            <p className={`mt-2 text-sm font-medium ${card.accent}`}>{card.trend}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#4B2E2B]">Revenue Over Time</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E3D3" />
                <XAxis dataKey="name" stroke="#8E706B" />
                <YAxis stroke="#8E706B" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4B2E2B"
                  strokeWidth={3}
                  dot={{ fill: "#4B2E2B" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#4B2E2B]">Orders by Category</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1E3D3" />
                <XAxis dataKey="category" stroke="#8E706B" />
                <YAxis stroke="#8E706B" />
                <Tooltip />
                <Bar dataKey="orders" fill="#8B5E57" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#4B2E2B]">Recent Orders</h3>
          <div className="mt-4 overflow-x-auto">
            {data.recentOrders.length > 0 ? (
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-[#F1E3D3] text-xs uppercase tracking-wide text-[#8E706B]">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Table</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#F7EBDD] text-sm">
                      <td className="py-3 font-medium text-[#4B2E2B]">{order.id}</td>
                      <td className="py-3 text-[#6E4F4A]">{order.table}</td>
                      <td className="py-3 text-[#6E4F4A]">{order.total}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[#7C5D58] py-4">No recent orders</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#4B2E2B]">Low Stock Warning</h3>
          <div className="mt-4 space-y-4">
            {data.lowStockItems.length > 0 ? (
              data.lowStockItems.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#6E4F4A]">{item.name}</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Low
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-red-100">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${item.level}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#7C5D58]">All stock levels are good</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
