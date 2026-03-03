import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const barData = [
  { name: 'MAY', expenses: 6000, revenue: 8000 },
  { name: 'JUN', expenses: 5500, revenue: 7500 },
  { name: 'JUL', expenses: 7000, revenue: 9000 },
  { name: 'AUG', expenses: 6500, revenue: 8500 },
  { name: 'SEP', expenses: 7500, revenue: 9500 },
  { name: 'OCT', expenses: 6000, revenue: 8200 },
];

const pieData = [
  { name: 'Ingredients', value: 45, color: '#3d2b24' },
  { name: 'Labor', value: 25, color: '#e65100' },
  { name: 'Utilities', value: 15, color: '#d7ccc8' },
  { name: 'Rent', value: 15, color: '#bcaaa4' },
];

export function Charts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Monthly Revenue vs Expenses</h3>
          <select className="cursor-pointer rounded-lg border-none bg-background-light px-3 py-2 text-xs font-semibold outline-none focus:ring-0 dark:bg-slate-800 dark:text-slate-100">
            <option>Last 6 Months</option>
            <option>Year to Date</option>
          </select>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="expenses" fill="#3d2b2466" radius={[2, 2, 0, 0]} barSize={16} />
              <Bar dataKey="revenue" fill="#3d2b24" radius={[2, 2, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 border-t border-slate-50 pt-6 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary/40"></span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-300">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary"></span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-300">Revenue</span>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-8 font-bold text-slate-800 dark:text-slate-100">Expense Categories</h3>
        <div className="relative h-[200px] w-full flex items-center justify-center mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">$8,120</span>
            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Total</span>
          </div>
        </div>
        <div className="space-y-3 mt-auto">
          {pieData.map((item) => (
            <div key={item.name} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs text-slate-500 dark:text-slate-300">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
