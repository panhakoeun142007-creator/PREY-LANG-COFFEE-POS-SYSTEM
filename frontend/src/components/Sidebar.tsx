import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  History, 
  LogOut,
  Coffee
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogoutClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogoutClick }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'recipe', label: 'Recipe', icon: BookOpen },
    { id: 'history', label: 'Order History', icon: History },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col p-6 fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white">
          <Coffee size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Prey Lang</h1>
          <p className="text-[10px] uppercase tracking-widest text-brand-primary font-bold">POS System</p>
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <button 
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
