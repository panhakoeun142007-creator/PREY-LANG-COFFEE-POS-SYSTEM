import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, LogOut } from 'lucide-react';
import type { Navigate } from '../types';

interface VerificationSuccessfulScreenProps {
  navigate: Navigate;
  motionProps: {
    initial: { opacity: number; y: number };
    animate: { opacity: number; y: number };
    exit: { opacity: number; y: number };
    transition: { duration: number; ease: 'easeOut' };
  };
}

export default function VerificationSuccessfulScreen({ navigate, motionProps }: VerificationSuccessfulScreenProps) {
  return (
    <motion.div key="verification-successful" {...motionProps} className="w-full flex flex-col items-center">
      <div className="w-full max-w-[470px]">
        <div className="bg-white p-6 md:p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="relative mb-5">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <CheckCircle2 className="text-primary w-16 h-16" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3 tracking-tight font-display">Verification Successful</h1>
          <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-sm font-medium">
            Your identity has been securely confirmed. You&apos;re ready to access your personalized dashboard.
          </p>
          <button
            onClick={() => navigate('role-selection')}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-base font-bold rounded-xl transition-all shadow-[0_10px_30px_rgba(184,102,20,0.3)] hover:scale-[1.02] flex items-center justify-center gap-3 mb-5"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            <p className="text-slate-600">Auto-redirecting in 5 seconds</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('staff-login')}
            className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </motion.div>
  );
}
