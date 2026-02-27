import { motion } from 'motion/react';
import { RotateCcw, Clock, ArrowRight, LogOut } from 'lucide-react';
import type { Navigate } from '../types';

interface SessionExpiredScreenProps {
  navigate: Navigate;
  motionProps: {
    initial: { opacity: number; y: number };
    animate: { opacity: number; y: number };
    exit: { opacity: number; y: number };
    transition: { duration: number; ease: 'easeOut' };
  };
}

export default function SessionExpiredScreen({ navigate, motionProps }: SessionExpiredScreenProps) {
  return (
    <motion.div key="session-expired" {...motionProps} className="w-full flex flex-col items-center">
      <div className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="h-24 bg-primary/10 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ec5b13 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="bg-white p-4 rounded-full shadow-lg z-10">
            <RotateCcw className="text-primary w-10 h-10" />
          </div>
        </div>
        <div className="p-5 sm:p-6 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3 font-display">Session Expired</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-5 max-w-sm">
            For your security, your session has timed out. Please enter the 6-digit code sent to your registered device to continue.
          </p>
          <form className="w-full space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('verification-successful'); }}>
            <div className="flex justify-center gap-2 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <input
                  key={i}
                  className="w-9 h-11 sm:w-11 sm:h-12 text-center text-xl font-bold rounded-lg border-2 border-slate-200 bg-transparent focus:border-primary focus:ring-0 text-slate-900 transition-all outline-none"
                  maxLength={1}
                  placeholder="·"
                  type="text"
                />
              ))}
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <Clock className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-600">
                  Session expires in: <span className="text-primary font-bold">04:54</span>
                </p>
              </div>
              <button type="button" className="mt-2 text-primary hover:text-primary/80 text-sm font-semibold transition-colors">
                Didn&apos;t get a code? Resend
              </button>
            </div>
            <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2" type="submit">
              <span>Verify and Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-slate-100 w-full">
            <button
              onClick={() => navigate('staff-login')}
              className="text-slate-500 hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
            >
              <LogOut className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
