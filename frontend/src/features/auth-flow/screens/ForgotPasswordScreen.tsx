import { motion } from 'motion/react';
import { Coffee, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Navigate } from '../types';

interface ForgotPasswordScreenProps {
  navigate: Navigate;
  motionProps: {
    initial: { opacity: number; y: number };
    animate: { opacity: number; y: number };
    exit: { opacity: number; y: number };
    transition: { duration: number; ease: 'easeOut' };
  };
}

export default function ForgotPasswordScreen({ navigate, motionProps }: ForgotPasswordScreenProps) {
  return (
    <motion.div key="forgot-password" {...motionProps} className="w-full flex flex-col items-center">
      <div className="w-full max-w-[450px]">
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
            <Coffee className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">The Daily Grind</h1>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xl flex flex-col gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight font-display">Forgot Password?</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Enter the email address associated with your account and we&apos;ll send you a 6-digit verification code to reset your password.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-slate-700 text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                className="w-full bg-white border border-slate-300 rounded-lg py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                placeholder="e.g. alex@example.com"
                type="email"
              />
            </div>
          </div>
          <button
            onClick={() => navigate('verify-code')}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
          >
            <span>Send Verification Code</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="pt-2 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => navigate('staff-login')}
              className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
