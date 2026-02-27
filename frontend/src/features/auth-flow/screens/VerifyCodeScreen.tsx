import { motion } from 'motion/react';
import { Coffee, Eye, EyeOff } from 'lucide-react';
import type { Navigate } from '../types';

interface VerifyCodeScreenProps {
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

export default function VerifyCodeScreen({ navigate, showPassword, setShowPassword, motionProps }: VerifyCodeScreenProps) {
  return (
    <motion.div key="verify-code" {...motionProps} className="w-full flex flex-col items-center">
      <div className="w-full max-w-[450px]">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-5 md:p-6 mb-3">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100">
              <Coffee className="text-primary-orange w-8 h-8" />
            </div>
            <h1 className="text-slate-900 text-2xl font-black tracking-tight mb-2 font-display">Verify Code</h1>
            <p className="text-slate-600 leading-relaxed">
              We&apos;ve sent a 6-digit code to your email. Please enter it below along with your new password.
            </p>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('session-expired'); }}>
            <div className="space-y-3">
              <label className="text-slate-500 text-xs font-bold uppercase tracking-[0.15em] block text-center mb-4">Verification Code</label>
              <div className="flex justify-between gap-2 max-w-sm mx-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <input
                    key={i}
                    className="w-10 h-12 bg-slate-50 border border-slate-200 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 text-center text-xl font-bold text-slate-900 rounded-lg transition-all outline-none"
                    maxLength={1}
                    placeholder="•"
                    type="text"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-sm font-semibold">New Password</label>
                <div className="relative group">
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all placeholder:text-slate-400 outline-none"
                    placeholder="Min. 8 characters"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary-orange transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-sm font-semibold">Confirm New Password</label>
                <div className="relative group">
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all placeholder:text-slate-400 outline-none"
                    placeholder="Confirm your password"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary-orange transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <button className="w-full bg-primary-orange hover:bg-[#b86614] text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] mt-3 text-base" type="submit">
              Reset Password
            </button>
            <div className="text-center pt-2">
              <p className="text-slate-500 text-sm">
                Didn&apos;t receive a code?
                <button type="button" className="text-primary-orange hover:text-primary-orange/80 font-semibold underline decoration-primary-orange/30 underline-offset-4 ml-1">Resend</button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
