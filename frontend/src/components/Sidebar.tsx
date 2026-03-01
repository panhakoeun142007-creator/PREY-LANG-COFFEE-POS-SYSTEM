import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  History, 
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

// Using your specific logo file
import LogoImage from '../assets/coffee.png'; 

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
      
      {/* BRANDING SECTION: Circle Image + Text Next to It */}
      <div className="flex items-center mb-10 px-2 gap-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 flex-shrink-0 shadow-sm"
        >
          <img 
            src={LogoImage} 
            alt="Prey Lang Coffee Logo" 
            className="w-full h-full object-cover" 
          />
        </motion.div>
        <div className="flex flex-col">
          <h1 className="font-bold text-slate-900 text-lg leading-tight">Prey Lang</h1>
          {/* BACK TO YOUR BRAND PRIMARY COLOR */}
          <p className="text-[10px] uppercase tracking-widest text-brand-primary font-bold">POS System</p>
        </div>
      </div>

      {/* NAVIGATION: REVERTED TO BRAND-PRIMARY COLORS */}
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

      {/* FOOTER / LOGOUT */}
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