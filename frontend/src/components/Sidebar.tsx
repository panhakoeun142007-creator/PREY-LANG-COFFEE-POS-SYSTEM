  import React, { useState, useEffect } from 'react';
  import { 
    LayoutDashboard, 
    ShoppingBag, 
    BookOpen, 
    History, 
    LogOut,
    Moon,
    Sun,
    AlertCircle 
  } from 'lucide-react';
  import { motion, AnimatePresence } from 'framer-motion';

  import LogoImage from '../assets/coffee.png'; 

  interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogoutClick: () => void;
  }

  const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogoutClick }) => {
    // Prefer saved preference first; fallback to system preference
    const [isDark, setIsDark] = useState<boolean>(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const applyTheme = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark);
      document.body.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    };

    const setDarkMode = () => {
      setIsDark(true);
      applyTheme(true);
    };

    const setLightMode = () => {
      setIsDark(false);
      applyTheme(false);
    };

    const handleThemeToggle = () => {
      if (isDark) {
        setLightMode();
      } else {
        setDarkMode();
      }
    };

    useEffect(() => {
      applyTheme(isDark);
    }, [isDark]);

    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'recipe', label: 'Recipe', icon: BookOpen },
      { id: 'history', label: 'Order History', icon: History },
    ];

    return (
      <>
        {/* SIDEBAR CONTAINER */}
        <div className="w-72 h-screen bg-[#4E2A27] flex flex-col p-6 fixed left-0 top-0 z-40 transition-all duration-500 ease-in-out shadow-2xl">
          
          {/* BRANDING SECTION */}
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

          {/* NAVIGATION */}
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
                      ? 'bg-white text-[#BD5E0A] shadow-xl translate-x-2'
                      : 'text-white/80 hover:text-white hover:bg-black/10'
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 3 : 2} />
                  <span className={`text-base ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activePill"
                      className="absolute -left-2 w-1.5 h-8 bg-white rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* FOOTER CONTROLS */}
          <div className="mt-auto space-y-2 pt-6 border-t border-white/20">
            <button 
              onClick={handleThemeToggle}
              aria-label="Toggle dark mode"
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95 text-white/80 hover:text-white hover:bg-black/10"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                {isDark ? <Sun size={22} /> : <Moon size={22} />}
              </div>
              <span className="text-base font-bold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
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

        {/* LOGOUT CONFIRMATION MODAL */}
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
