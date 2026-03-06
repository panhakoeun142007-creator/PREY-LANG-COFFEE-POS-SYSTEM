import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, XCircle, Search, Hash, 
  BookOpen, Trash2, Coffee, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. IMPORT YOUR LOGO HERE
import logo from '../assets/coffee.png'; 

const RecipeHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  
  const [history, setHistory] = useState([
    { id: 'LOG-001', orderId: 'ORD-772', tableNo: 'T-04', name: 'Prey Lang Cold Brew', time: '14:20', date: 'Feb 27, 2026', wasPrinted: true },
    { id: 'LOG-002', orderId: 'ORD-775', tableNo: 'T-02', name: 'Latte Art Special', time: '13:45', date: 'Feb 27, 2026', wasPrinted: false },
    { id: 'LOG-003', orderId: 'ORD-780', tableNo: 'Takeaway', name: 'Matcha Forest Green', time: '12:10', date: 'Feb 27, 2026', wasPrinted: true },
    { id: 'LOG-004', orderId: 'ORD-782', tableNo: 'T-08', name: 'Espresso Double Shot', time: '10:05', date: 'Feb 27, 2026', wasPrinted: false },
  ]);

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmDelete = () => {
    setHistory(prev => prev.filter(h => h.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
      
      {/* 1. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-[#1A110B] border border-slate-200 dark:border-white/10 p-8 rounded-[40px] max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Remove Log?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                Deleting <span className="font-bold text-slate-800 dark:text-slate-200">{itemToDelete.name}</span> is permanent.
              </p>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 font-black text-white bg-red-600 rounded-2xl shadow-lg shadow-red-900/20 hover:bg-red-700 transition-all uppercase text-[10px] tracking-widest"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-2 rounded-2xl shadow-sm flex items-center justify-center transition-colors">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none transition-colors">Recipe History</h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">PREY LANG POS SYSTEM</p>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 px-6 py-4 rounded-[24px] shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-2.5 bg-orange-50 dark:bg-[#BD5E0A]/10 text-[#BD5E0A] rounded-xl">
            <Coffee size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 dark:text-white text-lg leading-none">{history.length}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Logs</span>
          </div>
        </div>
      </header>

      {/* 3. Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-[#BD5E0A] transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search recipes, order IDs, or tables..."
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[28px] py-6 pl-16 pr-8 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#BD5E0A]/10 transition-all shadow-sm"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. Main History Table */}
      <div className="bg-white dark:bg-white/5 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Order / Table</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Recipe Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredHistory.map((item) => (
                  <motion.tr 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="hover:bg-slate-50/40 dark:hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-black text-[#BD5E0A] flex items-center gap-1">
                          <Hash size={12} /> {item.orderId}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-white/10 w-fit px-2.5 py-1 rounded-lg">
                          {item.tableNo}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <span className="font-black text-slate-800 dark:text-slate-100 text-base block">{item.name}</span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-tight">Standard Brew</p>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 group-hover:text-[#BD5E0A] transition-colors">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-200">{item.time}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-tighter">{item.date}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      {item.wasPrinted ? (
                        <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full font-black italic">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] uppercase tracking-widest">Printed</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-slate-300 dark:text-slate-700 font-bold px-3 py-1.5 rounded-full">
                          <XCircle size={14} />
                          <span className="text-[10px] uppercase tracking-widest">Digital</span>
                        </div>
                      )}
                    </td>

                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setItemToDelete(item)} 
                        className="p-3 text-slate-200 dark:text-slate-800 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredHistory.length === 0 && (
            <div className="py-32 text-center">
              <div className="bg-slate-50 dark:bg-white/5 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto text-slate-200 dark:text-slate-800 mb-6">
                <BookOpen size={48} />
              </div>
              <p className="text-slate-900 dark:text-white font-black text-xl tracking-tight">No records found</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm font-medium mt-2">Maybe try a different search term?</p>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-10 opacity-30">
         <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em]">Prey Lang Coffee Management • Cambodia 2026</p>
      </footer>
    </div>
  );
};

export default RecipeHistory;