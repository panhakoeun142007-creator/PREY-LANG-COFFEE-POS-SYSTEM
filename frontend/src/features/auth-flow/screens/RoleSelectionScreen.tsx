import { motion } from 'motion/react';
import { User, ShieldCheck, ArrowRight, Utensils, BarChart3 } from 'lucide-react';
import type { Navigate } from '../types';

interface RoleSelectionScreenProps {
  navigate: Navigate;
  motionProps: {
    initial: { opacity: number; y: number };
    animate: { opacity: number; y: number };
    exit: { opacity: number; y: number };
    transition: { duration: number; ease: 'easeOut' };
  };
}

export default function RoleSelectionScreen({ navigate, motionProps }: RoleSelectionScreenProps) {
  return (
    <motion.div key="role-selection" {...motionProps} className="w-full flex flex-col items-center">
      <div className="max-w-4xl w-full text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-slate-900 font-display">Welcome Back</h1>
        <p className="text-primary font-medium text-lg md:text-xl max-w-lg mx-auto opacity-90">
          Choose your portal to continue to the dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl px-2">
        <button
          onClick={() => navigate('staff-login')}
          className="group relative flex flex-col items-start text-left p-6 rounded-xl glass-panel transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:shadow-[0_0_30px_rgba(184,102,20,0.2)]"
        >
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
            <User className="text-primary w-8 h-8 group-hover:text-white" />
          </div>
                  <div className="mb-5">
            <h3 className="text-2xl font-bold mb-2 text-slate-800 font-display">Staff Portal</h3>
            <p className="leading-relaxed text-slate-600">Access the floor interface. Clock in, manage active orders, and handle point-of-sale operations.</p>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mt-auto">
            <span>Enter Staff Portal</span>
            <ArrowRight className="w-5 h-5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Utensils className="w-24 h-24" />
          </div>
        </button>

        <button
          onClick={() => navigate('admin-login')}
          className="group relative flex flex-col items-start text-left p-6 rounded-xl glass-panel transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:shadow-[0_0_30px_rgba(184,102,20,0.2)]"
        >
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
            <ShieldCheck className="text-primary w-8 h-8 group-hover:text-white" />
          </div>
                  <div className="mb-5">
            <h3 className="text-2xl font-bold mb-2 text-slate-800 font-display">Admin Portal</h3>
            <p className="leading-relaxed text-slate-600">Management and analytics suite. View sales reports, manage inventory, and handle staff scheduling.</p>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mt-auto">
            <span>Enter Admin Portal</span>
            <ArrowRight className="w-5 h-5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart3 className="w-24 h-24" />
          </div>
        </button>
      </div>
    </motion.div>
  );
}
