import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  progress?: number;
}

export function KPICard({ title, value, change, trend, icon: Icon, iconBg, iconColor, progress }: KPICardProps) {
  return (
    <div className="rounded-xl border border-[#EAD6C0] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg", iconBg, iconColor, "dark:brightness-90")}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mb-1 text-sm font-medium text-[#4B2E2B] dark:text-slate-300">{title}</p>
      <h4 className="mb-2 text-2xl font-bold text-[#111827] dark:text-slate-100">{value}</h4>
      <div className="flex items-center gap-1 text-xs font-bold">
        {trend === 'up' ? (
          <TrendingUp className={cn("size-3.5", title === 'Total Expenses' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')} />
        ) : (
          <TrendingDown className="size-3.5 text-red-600 dark:text-red-400" />
        )}
        <span className={cn(
          (trend === 'up' && title !== 'Total Expenses') || (trend === 'down' && title === 'Total Expenses') 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        )}>
          {change}
        </span>
        <span className="ml-1 font-normal text-[#7C5D58] dark:text-slate-500">vs last month</span>
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5E6D3] dark:bg-slate-700">
            <div className="bg-[#4B2E2B] dark:bg-amber-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
