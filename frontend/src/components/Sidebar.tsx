import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  BookOpen,
  History,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  shopName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogoutClick,
  isDark,
  onThemeToggle,
  isCollapsed,
  onToggleCollapse,
  shopName = 'Prey Lang',
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
      <div
        className={`h-screen bg-[#3f2622] bg-[linear-gradient(180deg,#4a2b27_0%,#2f1713_100%)] text-white flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 overflow-y-auto ${
          isCollapsed ? 'w-16 px-3' : 'w-72 p-6'
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          className="absolute -right-3 top-24 w-7 h-7 rounded-full bg-[#F6E8D7] text-[#5C2E22] shadow-md flex items-center justify-center border border-white/40"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`flex items-center ${isCollapsed ? 'mb-8 justify-center' : 'mb-10 gap-4'}`}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative rounded-2xl overflow-hidden border border-white/15 flex-shrink-0 bg-white shadow-inner flex items-center justify-center ${
              isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
            }`}
          >
            <img
              src={LogoImage}
              alt="Logo"
              className={`${isCollapsed ? 'w-6 h-6' : 'w-8 h-8'} object-contain`}
            />
          </motion.div>
          <div className={`flex flex-col ${isCollapsed ? 'sr-only' : ''}`}>
            <h1 className="text-base font-bold tracking-wide leading-tight text-white">PREY LANG</h1>
            <p className="text-xs tracking-[0.2em] text-white/80">COFFEE</p>
          </div>
        </div>

        <nav className={`flex-1 space-y-2 pb-6 ${isCollapsed ? 'items-center' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-2xl transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'gap-4 px-4 py-3'
                } ${isActive
                    ? 'bg-[#F6E8D7] text-[#5C2E22] shadow-md'
                    : 'text-white/90 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#5C2E22]' : 'text-white/80'}`} />
                <span className={`text-sm font-medium ${isCollapsed ? 'sr-only' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`mt-auto space-y-2 pt-4 border-t border-white/10 ${isCollapsed ? 'pb-2' : ''}`}>
          <button
            onClick={onThemeToggle}
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
            className={`w-full flex items-center rounded-2xl transition-colors text-white/90 hover:text-white hover:bg-white/5 ${
              isCollapsed ? 'justify-center px-0 py-3' : 'gap-4 px-4 py-3'
            }`}
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className={`text-sm font-medium ${isCollapsed ? 'sr-only' : ''}`}>
              {isDark ? 'Dark Mode: On' : 'Dark Mode: Off'}
            </span>
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center rounded-2xl transition-colors text-white/90 hover:text-white hover:bg-white/5 ${
              isCollapsed ? 'justify-center px-0 py-3' : 'gap-4 px-4 py-3'
            }`}
          >
            <LogOut size={20} />
            <span className={`text-sm font-medium ${isCollapsed ? 'sr-only' : ''}`}>Logout</span>
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
