import React from 'react';
import { 
  LayoutDashboard, 
  Bell, 
  History, 
  Receipt, 
  Settings, 
  HelpCircle, 
  LogOut,
  Coffee,
  ShoppingBag,
  Package,
  BarChart3,
  Table2,
  BookOpen,
  Container
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
  const navItems = [
    { section: 'DASHBOARD', items: [
      { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    ]},
    { section: 'ORDERS', items: [
      { name: 'Live Orders', icon: Bell, id: 'live-orders' },
      { name: 'Order History', icon: History, id: 'order-history' },
      { name: 'Receipts', icon: Receipt, id: 'receipts' },
    ]},
    { section: 'MENU MANAGEMENT', items: [
      { name: 'Products', icon: Coffee, id: 'products' },
      { name: 'Categories', icon: LayoutDashboard, id: 'categories' },
    ]},
    { section: 'WORKSPACE', items: [
      { name: 'Table Management', icon: Table2, id: 'table-management' },
    ]},
    { section: 'INVENTORY', items: [
      { name: 'Recipes', icon: BookOpen, id: 'recipes' },
      { name: 'Ingredients / Stock', icon: Container, id: 'ingredients' },
    ]},
    { section: 'FINANCE', items: [
      { name: 'Income & Expenses', icon: BarChart3, id: 'finance' },
    ]},
    { section: 'SYSTEM', items: [
      { name: 'Settings', icon: Settings, id: 'settings', active: true },
      { name: 'Support', icon: HelpCircle, id: 'support' },
    ]},
  ];

  return (
    <aside className="w-64 bg-brand-sidebar text-white/90 flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Prey Lang Coffee</h1>
            <p className="text-[10px] opacity-60 uppercase tracking-wider">Admin Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-4 pb-10">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {section.section}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <a
                  key={item.id}
                  href="#"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                    item.active 
                      ? 'bg-brand-nav-active text-brand-text shadow-sm font-bold' 
                      : 'hover:bg-white/5 text-white/70 hover:text-white font-medium'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.active ? 'text-brand-text' : ''}`} />
                  <span className="text-xs">{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
             <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPA1tSP1bIunZzRXDoS39MJm_u_p0uhWF-CnATrUycQYfOkFBGihUeUn3I4fTch5mHTmL8YOM_hDY6r3ky5cXPkfcPt36wyseY6_zY_XRKEbHDZWhy0qOVoWVmtxXKvNdi8tTZWwCxWDlNGi02Ey5yJEjZ64ejHjoi7UCeZ9csQf0CwgDQDJNVVmOE5Tcb_AJz0Ah9tzQH9T5_fR2yCle8u6HdnK7RxdM1J6j_UB_xE5MksTqNBpCfb4X4-uSmiDxQBQvuyhewGXY" 
              alt="Admin User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-white">Admin User</p>
            <p className="text-[10px] text-white/50">Log out</p>
          </div>
          <LogOut className="w-4 h-4 ml-auto text-white/40" />
        </div>
      </div>
    </aside>
  );
}
