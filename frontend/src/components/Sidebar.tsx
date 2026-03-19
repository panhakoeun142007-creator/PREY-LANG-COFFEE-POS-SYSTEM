import { ChevronLeft, ChevronRight, LayoutDashboard, ShoppingBag, BookOpen, History, LogOut, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import LogoImage from '../assets/coffee.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogoutClick: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
  shopName?: string;
}

function statusClass(isActive: boolean, isDark: boolean): string {
  if (isActive) {
    return isDark
      ? 'bg-slate-700 text-slate-100 font-semibold shadow'
      : 'bg-[#F5E6D3] text-[#4B2E2B] font-semibold shadow';
  }
  return isDark ? 'text-slate-200 hover:bg-slate-700/70' : 'text-white/80 hover:bg-white/10';
}

const navGroups = [
  {
    group: 'Dashboard',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    group: 'Orders',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'history', label: 'Order History', icon: History },
    ],
  },
  {
    group: 'Inventory',
    items: [{ id: 'recipe', label: 'Receipt', icon: BookOpen }],
  },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogoutClick,
  onThemeToggle,
  isDark,
  shopName = 'Prey Lang',
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex flex-col text-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        isDark
          ? 'border-r border-slate-700/70 bg-slate-950/90 backdrop-blur-xl'
          : 'bg-[#4B2E2B]',
      ].join(' ')}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${isDark ? 'border-b border-slate-800' : 'border-b border-white/10'}`}>
        <img
          src={LogoImage}
          alt="Logo"
          className="h-11 w-11 flex-shrink-0 rounded-lg bg-white/20 object-contain p-1"
        />
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">{shopName}</p>
            <p className="text-xs text-white/80">POS System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-2">
              {!collapsed && (
                <p className={`px-2 text-[11px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-white/50'}`}>
                  {group.group}
                </p>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition ${statusClass(activeTab === item.id, isDark)}`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>

      {/* Theme toggle + Logout */}
      <div className={`p-3 space-y-0.5 ${isDark ? 'border-t border-slate-800' : 'border-t border-white/10'}`}>
        <button
          type="button"
          onClick={onThemeToggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition ${isDark ? 'text-slate-300 hover:bg-slate-800/70' : 'text-white/80 hover:bg-white/10'}`}
        >
          {isDark ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
          {!collapsed && <span className="ml-3">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          type="button"
          onClick={onLogoutClick}
          className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition ${isDark ? 'text-slate-300 hover:bg-slate-800/70' : 'text-white/80 hover:bg-white/10'}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label="Toggle sidebar"
        className={`absolute -right-3 top-24 flex h-7 w-7 items-center justify-center rounded-full shadow ${
          isDark
            ? 'border-slate-600 bg-slate-800 text-slate-100'
            : 'border-[#EAD6C0] bg-[#FFF8F0] text-[#4B2E2B]'
        }`}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
