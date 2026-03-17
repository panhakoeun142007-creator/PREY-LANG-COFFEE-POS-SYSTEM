import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Hash, BookOpen, Trash2, AlertCircle, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import logo from '../assets/coffee.png';
interface RecipeLog {
  id: string;
  orderId: string;
  tableNo: string;
  name: string;
}

interface RecipeHistoryProps {
  history: RecipeLog[];
  isLoading: boolean;
  error: string | null;
  onDeleteLog: (logId: string) => Promise<void>;
}

const RecipeHistory: React.FC<RecipeHistoryProps> = ({ history, isLoading, error, onDeleteLog }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<RecipeLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const orderDisplayIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    let sequence = 1;

    history.forEach((item) => {
      const orderId = String(item.orderId);
      if (!map[orderId]) {
        map[orderId] = `POS_${String(sequence).padStart(3, '0')}`;
        sequence += 1;
      }
    });

    return map;
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return history.filter((item) => {
      if (pendingDeleteIds.has(item.id)) return false;
      return (
        item.name.toLowerCase().includes(q) ||
        (orderDisplayIdMap[item.orderId] ?? item.orderId).toLowerCase().includes(q) ||
        item.tableNo.toLowerCase().includes(q)
      );
    });
  }, [history, orderDisplayIdMap, pendingDeleteIds, searchQuery]);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const target = itemToDelete;
    setItemToDelete(null);
    setIsDeleting(true);
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      next.add(target.id);
      return next;
    });
    try {
      await onDeleteLog(target.id);
      toast.success('Receipt log deleted');
    } catch (error) {
      console.error(error);
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
      toast.error('Delete failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-8 transition-colors duration-500">
      
      {/* --- DELETE MODAL --- */}
      {itemToDelete && createPortal(
          <div className="fixed inset-0 z-[1000] grid place-items-center p-4 sm:p-6 bg-slate-900/70 dark:bg-black/85 overflow-y-auto">
            <div className="relative bg-white dark:bg-[#1A110B] p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] w-[min(92vw,460px)] shadow-2xl text-center border border-slate-100 dark:border-white/10 max-h-[90dvh] overflow-y-auto">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Remove Log?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm leading-relaxed">
                Deleting <span className="font-bold text-slate-800 dark:text-slate-200">{itemToDelete.name}</span> is permanent.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-7">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 font-black text-white bg-red-600 dark:bg-red-500 rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all uppercase text-[10px] tracking-widest shadow-lg dark:shadow-red-900/40"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- HEADER --- */}
      <header className="flex items-center justify-between gap-5 mb-2">
        <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-sm flex items-center justify-center">
          <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Receipt History</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">PREY LANG POS SYSTEM</p>
        </div>
        </div>
        <div className="hidden sm:flex items-center rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 px-4 py-2">
          <span className="text-[10px] uppercase tracking-wider text-orange-700 dark:text-orange-400 font-black">Total Logs</span>
          <span className="ml-2 text-lg font-black text-orange-700 dark:text-orange-400">{history.length}</span>
        </div>
      </header>

      {/* --- SEARCH BAR --- */}
      <div className="relative mb-6">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
        <input
          type="text"
          placeholder="Search receipt, order IDs, or tables..."
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BD5E0A]/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* --- LIST (CARDS INSTEAD OF TABLE) --- */}
      <div className="grid gap-4 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-4 md:p-5">
        {error && (
          <div className="text-center py-6 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-10 bg-white/70 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold">
            Loading receipt history...
          </div>
        )}

        <AnimatePresence>
          {filteredHistory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm transition-colors hover:border-[#BD5E0A]/30"
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0 w-full">
                {/* Icon Box */}
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center text-[#BD5E0A] dark:text-orange-400">
                   <Coffee size={18} />
                   <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">Brew</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight truncate">{item.name}</p>
                    <span className="shrink-0 text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {item.tableNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    <Hash size={12} className="text-slate-400 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                      {orderDisplayIdMap[item.orderId] ?? item.orderId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 w-full sm:w-auto relative z-10">
                <button
                  type="button"
                  onClick={() => setItemToDelete(item)}
                  aria-label={`Delete ${item.name}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-all active:scale-95 cursor-pointer font-bold text-xs uppercase tracking-wider"
                >
                  <Trash2 size={20} />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* --- EMPTY STATE --- */}
        {!isLoading && filteredHistory.length === 0 && (
          <div className="text-center py-20 bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 dark:text-slate-700">
                <BookOpen size={32} />
            </div>
            <p className="text-slate-400 dark:text-slate-600 font-bold">No matching records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeHistory;
