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
  ChevronLeft,
  ChevronRight,
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

function statusClass(isActive: boolean, isDarkMode: boolean): string {
  if (isActive) {
    return isDarkMode
      ? 'bg-slate-700 text-slate-100 font-semibold shadow'
      : 'bg-[#F5E6D3] text-[#4B2E2B] font-semibold shadow';
  }
  return isDarkMode ? 'text-slate-200 hover:bg-slate-700/70' : 'text-white/80 hover:bg-white/10';
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogoutClick,
  isDark,
  onThemeToggle,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'recipe', label: 'Recipe', icon: BookOpen },
    { id: 'history', label: 'Order History', icon: History },
  ];

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-40 flex ${sidebarWidth} flex-col text-white transition-all duration-300 ${isDark
        ? 'border-r border-slate-700/70 bg-slate-950/90 backdrop-blur-xl'
        : 'bg-[#4B2E2B]'
        }`}>
        {/* Logo Section */}
        <div className={`flex items-center gap-3 px-4 py-5 ${isDark ? 'border-b border-slate-800' : 'border-b border-white/10'}`}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-11 h-11 rounded-lg overflow-hidden border-2 border-white/20 flex-shrink-0 bg-white shadow-inner"
          >
            <img src={LogoImage} alt="Logo" className="w-full h-full object-contain p-1" />
          </motion.div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">PREY LANG</p>
              <p className="text-xs text-white/80">COFFEE</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center rounded-xl px-3 py-2.5 text-sm transition ${statusClass(isActive, isDark)}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className={`p-3 ${isDark ? 'border-t border-slate-800' : 'border-t border-white/10'}`}>
          <button
            onClick={onThemeToggle}
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
            className={`w-full flex items-center rounded-xl px-3 py-2.5 text-sm transition ${isDark ? 'text-slate-300 hover:bg-slate-800/70' : 'text-white/80 hover:bg-white/10'
              }`}
          >
            <div className="relative w-[18px] h-[18px] flex items-center justify-center">
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            {!collapsed && <span className="ml-3">{isDark ? 'Dark Mode: On' : 'Dark Mode: Off'}</span>}
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center rounded-xl px-3 py-2.5 text-sm transition mt-2 ${isDark ? 'text-slate-300 hover:bg-slate-800/70' : 'text-white/80 hover:bg-white/10'
              }`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`absolute -right-3 top-24 hidden h-7 w-7 items-center justify-center rounded-full shadow md:flex ${isDark
            ? 'border-slate-600 bg-slate-800 text-slate-100'
            : 'border-[#EAD6C0] bg-[#FFF8F0] text-[#4B2E2B]'
            }`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
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
