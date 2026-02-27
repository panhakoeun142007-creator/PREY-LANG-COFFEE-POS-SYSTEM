import { motion } from 'motion/react';
import { Contact, Lock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Navigate } from '../types';

interface StaffLoginScreenProps {
  navigate: Navigate;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  motionProps: {
    initial: { opacity: number; y: number };
    animate: { opacity: number; y: number };
    exit: { opacity: number; y: number };
    transition: { duration: number; ease: 'easeOut' };
  };
}

export default function StaffLoginScreen({ navigate, showPassword, setShowPassword, motionProps }: StaffLoginScreenProps) {
  return (
    <motion.div key="staff-login" {...motionProps} className="w-full flex flex-col items-center">
      <div className="w-full max-w-md glass-panel rounded-xl p-6 shadow-xl border border-primary/20 bg-white/95">
        <button
          onClick={() => navigate('role-selection')}
          className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-5 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-wider">Back to Role Selection</span>
        </button>
        <div className="mb-5">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight font-display">STAFF LOGIN</h1>
          <p className="text-slate-600 text-sm">Please enter your credentials to access the shop portal.</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate(''); }}>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Staff ID</label>
            <div className="relative group">
              <Contact className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
              <input
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400 outline-none"
                placeholder="Enter your staff ID"
                type="text"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">PIN / Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
              <input
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400 outline-none"
                placeholder="Enter your PIN"
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input className="rounded border-slate-300 bg-white text-primary focus:ring-primary" type="checkbox" />
              <span className="text-xs text-slate-600 group-hover:text-slate-800">Remember session</span>
            </label>
            <button type="button" onClick={() => navigate('forgot-password')} className="text-xs text-primary hover:underline font-medium">
              Forgot PIN?
            </button>
          </div>
          <button className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2" type="submit">
            <span>SIGN IN TO PORTAL</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm">
            Not staff?
            <button onClick={() => navigate('admin-login')} className="text-primary font-bold hover:underline ml-1">Admin Access</button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
