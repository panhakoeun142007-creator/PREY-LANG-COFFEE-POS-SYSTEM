<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> feature/staff-dashboard-copy
import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  BookOpen,
  History,
  LogOut,
  Moon,
  Sun,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoImage from '../assets/coffee.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogoutClick: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogoutClick,
  isDark,
  onThemeToggle,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'recipe', label: 'Recipe', icon: BookOpen },
    { id: 'history', label: 'Order History', icon: History },
  ];

  return (
    <>
      <div className="w-72 h-screen bg-[#3e241f] bg-[linear-gradient(180deg,#4f2d26_0%,#311713_100%)] flex flex-col p-6 fixed left-0 top-0 z-40 transition-all duration-500 ease-in-out shadow-2xl border-r border-white/10">
        <div className="flex items-center mb-12 px-2 gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 flex-shrink-0 bg-white shadow-inner"
          >
            <img src={LogoImage} alt="Logo" className="w-full h-full object-contain p-1" />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tight leading-none mb-1 text-white">Prey Lang</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-orange-200">POS System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-white text-[#B75D17] shadow-xl translate-x-2'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 3 : 2} />
                <span className={`text-base ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute -left-2 w-1.5 h-8 bg-[#ffd6ae] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-white/20">
          <button
            onClick={onThemeToggle}
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95 text-white/80 hover:text-white hover:bg-black/10"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              {isDark ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <span className="text-base font-bold">{isDark ? 'Dark Mode: On' : 'Dark Mode: Off'}</span>
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95 text-white/80 hover:text-white hover:bg-red-600/20"
          >
            <LogOut size={22} />
            <span className="text-base font-bold">Logout</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1A110B] border border-white/5 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Wait a minute!</h2>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Are you sure you want to end your shift and log out?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogoutClick();
                  }}
                  className="w-full py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors shadow-lg shadow-red-900/40"
                >
                  Yes, Log Me Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 text-white/70 font-bold hover:bg-white/10 transition-colors"
                >
                  Stay Logged In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
<<<<<<< HEAD
>>>>>>> feature/staff-dashboard-copy
=======
=======
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
>>>>>>> feature/merge-staff-dashboard
>>>>>>> feature/staff-dashboard-copy
