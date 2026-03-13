import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  fetchSalesAnalyticsData,
  PeakHourDataPoint,
  SalesTrendDataPoint,
} from "../services/api";
import { useSettings } from "../context/SettingsContext";

const monthlyTrendMockData: SalesTrendDataPoint[] = [
  { month: "Jan", sales: 9800, orders: 248 },
  { month: "Feb", sales: 10200, orders: 260 },
  { month: "Mar", sales: 10950, orders: 276 },
  { month: "Apr", sales: 11500, orders: 289 },
  { month: "May", sales: 12100, orders: 302 },
  { month: "Jun", sales: 12750, orders: 318 },
  { month: "Jul", sales: 13350, orders: 331 },
  { month: "Aug", sales: 13900, orders: 346 },
  { month: "Sep", sales: 14550, orders: 359 },
  { month: "Oct", sales: 15100, orders: 372 },
  { month: "Nov", sales: 14850, orders: 366 },
  { month: "Dec", sales: 16200, orders: 398 },
];

const peakHoursMockData: PeakHourDataPoint[] = [
  { hour: "6 AM", orders: 12 },
  { hour: "7 AM", orders: 18 },
  { hour: "8 AM", orders: 26 },
  { hour: "9 AM", orders: 34 },
  { hour: "10 AM", orders: 41 },
  { hour: "11 AM", orders: 49 },
  { hour: "12 PM", orders: 62 },
  { hour: "1 PM", orders: 54 },
  { hour: "2 PM", orders: 46 },
  { hour: "3 PM", orders: 39 },
  { hour: "4 PM", orders: 31 },
  { hour: "5 PM", orders: 24 },
];

const tooltipStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

export default function SalesAnalytics() {
  const { currency } = useSettings();
  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      }),
    [currency],
  );
  const [monthlyTrendData, setMonthlyTrendData] = useState<SalesTrendDataPoint[]>(monthlyTrendMockData);
  const [peakHoursData, setPeakHoursData] = useState<PeakHourDataPoint[]>(peakHoursMockData);
  const [monthlyPerformanceData, setMonthlyPerformanceData] =
    useState<SalesTrendDataPoint[]>(monthlyTrendMockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const payload = await fetchSalesAnalyticsData();
        if (!mounted) return;

        const nextMonthlyTrend =
          payload.monthlyTrendData.length > 0 ? payload.monthlyTrendData : monthlyTrendMockData;
        const nextPeakHours = payload.peakHoursData.length > 0 ? payload.peakHoursData : peakHoursMockData;
        const nextMonthlyPerformance =
          payload.monthlyPerformanceData.length > 0
            ? payload.monthlyPerformanceData
            : nextMonthlyTrend;

        setMonthlyTrendData(nextMonthlyTrend);
        setPeakHoursData(nextPeakHours);
        setMonthlyPerformanceData(nextMonthlyPerformance);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load sales analytics");
        setMonthlyTrendData(monthlyTrendMockData);
        setPeakHoursData(peakHoursMockData);
        setMonthlyPerformanceData(monthlyTrendMockData);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-[#4B2E2B]">Sales Trend (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      name === "Sales" ? money.format(value) : value,
                      name,
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#4B2E2B"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8B6F47" }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={!loading}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-[#4B2E2B]">Peak Hours (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="orders"
                    name="Orders"
                    fill="#8B6F47"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={!loading}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg text-[#4B2E2B]">Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    name === "Sales" ? money.format(value) : value,
                    name,
                  ]}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  name="Orders"
                  fill="#8B6F47"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={!loading}
                />
                <Bar
                  yAxisId="right"
                  dataKey="sales"
                  name="Sales"
                  fill="#4B2E2B"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={!loading}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
