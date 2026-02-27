import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff, Shield, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Navigate } from '../types';

interface AdminLoginScreenProps {
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

export default function AdminLoginScreen({ navigate, showPassword, setShowPassword, motionProps }: AdminLoginScreenProps) {
  return (
    <motion.div key="admin-login" {...motionProps} className="w-full flex flex-col items-center">
      <div className="w-full max-w-md glass-panel rounded-xl p-6 shadow-2xl bg-white/95">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            <Shield className="w-3 h-3" />
            Secure Access
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase font-display">Admin Login</h2>
          <p className="text-sm text-slate-600">Administrative credentials required to access the management dashboard.</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate(''); }}>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Admin ID or Email</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
              <input
                className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400"
                placeholder="e.g. admin_01@dailygrind.com"
                type="text"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <button type="button" onClick={() => navigate('forgot-password')} className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
              <input
                className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400"
                placeholder="********"
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
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary" type="checkbox" />
              <span className="text-sm text-slate-600">Trust this device for 24 hours</span>
            </label>
          </div>
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20" type="submit">
            SIGN IN TO DASHBOARD
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            End-to-end encrypted administrative terminal
          </p>
        </div>
      </div>
    </motion.div>
  );
}
