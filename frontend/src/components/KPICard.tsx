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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg", iconBg, iconColor)}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h4 className="text-2xl font-bold mb-2">{value}</h4>
      <div className="flex items-center gap-1 text-xs font-bold">
        {trend === 'up' ? (
          <TrendingUp className={cn("size-3.5", title === 'Total Expenses' ? 'text-red-600' : 'text-green-600')} />
        ) : (
          <TrendingDown className="size-3.5 text-red-600" />
        )}
        <span className={cn(
          (trend === 'up' && title !== 'Total Expenses') || (trend === 'down' && title === 'Total Expenses') 
            ? 'text-green-600' 
            : 'text-red-600'
        )}>
          {change}
        </span>
        <span className="text-slate-400 font-normal ml-1">vs last month</span>
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
