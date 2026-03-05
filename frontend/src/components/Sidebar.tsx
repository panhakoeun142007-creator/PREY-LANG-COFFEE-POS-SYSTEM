import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  History, 
  Receipt, 
  Package, 
  Grid, 
  Table2, 
  BookOpen, 
  Box, 
  Wallet, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut,
  Coffee
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: ShoppingBag, label: 'Live Orders' },
  { icon: History, label: 'Order History' },
  { icon: Receipt, label: 'Receipts' },
  { icon: Package, label: 'Products' },
  { icon: Grid, label: 'Categories' },
  { icon: Table2, label: 'Table Management' },
  { icon: BookOpen, label: 'Recipes' },
  { icon: Box, label: 'Ingredients / Stock' },
  { icon: Wallet, label: 'Income & Expenses', active: true },
  { icon: BarChart3, label: 'Sales Analytics' },
];

const footerItems = [
  { icon: Settings, label: 'Settings' },
  { icon: HelpCircle, label: 'Support' },
  { icon: LogOut, label: 'Logout', color: 'text-red-400' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-primary text-white flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
          <Coffee className="text-white size-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">PREY LANG / COFFEE</h1>
          <p className="text-xs text-white/60">Management Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
              item.active 
                ? "bg-[#f9f3ef] text-primary ml-2 rounded-l-full font-semibold" 
                : "text-white/70 hover:bg-white/10 font-medium"
            )}
          >
            <item.icon className={cn("size-5", item.active ? "text-primary" : "text-white/70")} />
            <span className="text-sm">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="px-3 py-6 mt-auto border-t border-white/10 space-y-1">
        {footerItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium",
              item.color || "text-white/70 hover:bg-white/10"
            )}
          >
            <item.icon className="size-5" />
            <span className="text-sm">{item.label}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
