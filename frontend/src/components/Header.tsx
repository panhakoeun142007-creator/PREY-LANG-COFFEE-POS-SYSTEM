import React from 'react';
import { Search, Calendar, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-background-light shrink-0">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-bold text-slate-900">Income & Expenses</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-[#f9f3ef] border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Search data..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-100 shadow-sm">
          <Calendar className="size-3.5" />
          October 24, 2023
        </div>
        <button className="relative text-slate-600 hover:text-primary transition-colors">
          <Bell className="size-5" />
          <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">Alex Rivera</p>
            <p className="text-[11px] text-slate-500">Store Manager</p>
          </div>
          <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            AR
          </div>
        </div>
      </div>
    </header>
  );
}
