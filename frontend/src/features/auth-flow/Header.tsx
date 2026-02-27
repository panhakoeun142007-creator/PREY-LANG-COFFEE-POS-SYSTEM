import { Coffee, Globe } from 'lucide-react';
import type { Navigate } from './types';

interface HeaderProps {
  navigate: Navigate;
}

export default function Header({ navigate }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-3 md:px-8 z-20">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('role-selection')}>
        <div className="bg-primary p-2 rounded-lg flex items-center justify-center">
          <Coffee className="text-white w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black leading-tight tracking-tight uppercase text-slate-800 font-display">
          PREYLANG COFFEE
        </h2>
      </div>
      <div className="hidden md:flex items-center gap-2 text-slate-500">
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium tracking-widest uppercase">Downtown Branch</span>
      </div>
    </header>
  );
}
