import React from 'react';
import { 
  Printer, 
  Download, 
  Moon,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'motion/react';

import { toast } from 'react-hot-toast';

interface RecipeViewProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const RecipeView: React.FC<RecipeViewProps> = ({ isDarkMode, setIsDarkMode }) => {
  const handlePrint = () => {
    window.print();
    toast.success('Preparing print document...');
  };

  const handleDownload = () => {
    toast.loading('Generating PDF...', { duration: 2000 });
    setTimeout(() => {
      toast.success('Recipe downloaded successfully');
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <Moon size={18} />
        </button>
      </div>

      <div className={`recipe-card relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-100 text-slate-900'}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-400 rounded-b-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-pink-400 rounded-t-full" />

        <div className="flex justify-between text-[8px] text-slate-400 font-mono mb-12">
          <span>RECIPE SPECIFICATION</span>
          <span>PREY LANG COFFEE - INTERNAL DOC</span>
        </div>

        <div className="text-center space-y-2 mb-12">
          <h2 className="text-4xl font-black text-brand-primary tracking-tight">PREY LANG COFFEE</h2>
          <p className="text-[10px] font-bold tracking-[0.3em] text-slate-600 uppercase">Sustainable Forest Brews</p>
        </div>

        <div className="grid grid-cols-2 gap-y-4 text-[10px] font-mono mb-12">
          <div className="space-y-1">
            <p className="text-slate-400">DRINK NAME:</p>
            <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>PREY LANG COLD BREW</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400">RECIPE ID:</p>
            <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>R-182938</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400">CATEGORY:</p>
            <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>COLD BREW</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-bold tracking-widest text-blue-300 uppercase">Ingredients</h3>
          <ul className="space-y-4">
            {[
              '18g Forest Blend Coffee (Coarse Ground)',
              '150ml Filtered Water (Room Temp)',
              'Slow-filtered Ice (Optional for Serving)'
            ].map((ingredient, idx) => (
              <li key={idx} className={`flex items-center gap-3 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        <div className={`mt-24 p-8 rounded-xl border text-center space-y-2 ${
          isDarkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50/30 border-emerald-100'
        }`}>
          <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Thank you for sharing the taste of Prey Lang Forest conservation.
          </p>
          <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Every cup brewed spreads awareness of our protected landscapes.
          </p>
        </div>

        <div className="mt-12 text-center space-y-1">
          <p className="text-[8px] font-bold text-slate-400">Prey Lang Coffee Co. Ltd</p>
          <p className="text-[8px] font-bold text-slate-400">Phnom Penh, Cambodia</p>
          <p className="text-[8px] font-bold text-brand-primary underline">www.preylangcoffee.kh</p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
        >
          <Printer size={16} />
          Print Recipe
        </button>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-md"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>
    </motion.div>
  );
};

export default RecipeView;
