import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, XCircle, Search, Hash, 
  BookOpen, Trash2, Leaf, Coffee, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RecipeHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null); // Tracks which log is being deleted
  
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

  // Function to confirm and execute deletion
  const confirmDelete = () => {
    setHistory(prev => prev.filter(h => h.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      
      {/* 1. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white p-8 rounded-[40px] max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Are you sure?</h3>
              <p className="text-slate-500 font-medium mt-2 leading-relaxed">
                You are about to delete the log for <span className="font-bold text-slate-800">{itemToDelete.name}</span>. This action cannot be undone.
              </p>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 font-black text-slate-400 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 font-black text-white bg-red-500 rounded-2xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all uppercase text-xs tracking-widest"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Header with Brand Logo */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-brand-primary p-3 rounded-2xl shadow-lg shadow-brand-primary/20">
            <Leaf className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">ព្រៃឡង់</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Recipe Log System</p>
          </div>
        </div>
        <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Coffee size={18} />
          </div>
          <span className="font-black text-slate-700 text-sm">{history.length} Total Logs</span>
        </div>
      </header>

      {/* 3. Search Bar */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by Recipe, Order ID, or Table..."
          className="w-full bg-white border border-slate-200 rounded-[24px] py-5 pl-14 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. Main History Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order / Table</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recipe Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Print Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredHistory.map((item) => (
                  <motion.tr 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="hover:bg-slate-50/40 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-brand-primary flex items-center gap-1">
                          <Hash size={12} /> {item.orderId}
                        </span>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                          {item.tableNo}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <span className="font-black text-slate-800 text-base">{item.name}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Standard Brew</p>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-brand-primary transition-colors">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{item.time}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.date}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      {item.wasPrinted ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-black italic">
                          <CheckCircle2 size={18} />
                          <span className="text-xs uppercase tracking-widest underline decoration-2 decoration-emerald-200">Printed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                          <XCircle size={18} />
                          <span className="text-xs uppercase tracking-widest">Digital Only</span>
                        </div>
                      )}
                    </td>

                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setItemToDelete(item)} // Opens the modal
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
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
            <div className="p-24 text-center space-y-4">
              <div className="bg-slate-50 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto text-slate-200">
                <BookOpen size={40} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-black">No History Records</p>
                <p className="text-slate-400 text-sm font-medium">Try searching for a different recipe or order ID.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center py-6">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Prey Lang Coffee Management • Est. 2026</p>
      </div>
    </div>
  );
};

export default RecipeHistory;