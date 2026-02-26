/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  ArrowRight, 
  ArrowLeft, 
  BadgeCheck, 
  TrendingUp, 
  Share2, 
  Settings,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
  Shield,
  Users,
} from 'lucide-react';
import { View } from '../types';
import { forgotStaffPassword, staffLogin } from '../api';
import Preylang from "../assets/images/Preylang.png";
import CoffeeImage from "../assets/images/Coffee.png";


// --- Shared Components ---

const Header = ({ onBack, currentView }: { onBack?: () => void, currentView: View }) => (
  <header className="flex items-center justify-between border-b border-brand/10 px-6 py-4 md:px-20 lg:px-40 bg-white sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="text-brand flex items-center justify-center">
        {/* < size={32} /> */}
        <img src={Preylang} alt="Prey-Lang-Coffee Logo" className="w-8 h-8" />
      </div>
      <h1 className="text-slate-900 text-xl font-extrabold leading-tight tracking-tight">Prey-Lang-Coffee</h1>
    </div>
    <div className="flex items-center gap-6">
      {currentView === View.PORTAL_SELECTION ? (
        <>
          <button className="hidden md:flex min-w-[120px] cursor-pointer items-center justify-center rounded-xl h-10 px-5 bg-brand/10 text-brand text-sm font-bold transition-colors hover:bg-brand/20">
            <span className="truncate">Downtown Branch</span>
          </button>
          <div className="bg-brand/20 rounded-full size-10 flex items-center justify-center border border-brand/10 overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              alt="User profile avatar" 
              src="https://picsum.photos/seed/user123/100/100"
              referrerPolicy="no-referrer"
            />
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-brand/10 text-brand hover:bg-brand/20 transition-colors">
            <Users size={20} />
          </button>
          <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-brand/10 text-brand hover:bg-brand/20 transition-colors">
            <Shield size={20} className="text-brand" />
          </button>
        </div>
      )}
    </div>
  </header>
);

const Footer = () => (
  <footer className="flex flex-col gap-8 px-6 py-12 text-center md:px-20 lg:px-40 border-t border-brand/5 mt-auto">
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      <a className="text-brand/60 hover:text-brand transition-colors text-base font-semibold min-w-[120px]" href="#">Help Center</a>
      <a className="text-brand/60 hover:text-brand transition-colors text-base font-semibold min-w-[120px]" href="#">General Website</a>
    </div>
    <div className="flex flex-col gap-2">
      <p className="text-brand/40 text-sm font-medium">© 2024 The Daily Grind Coffee Shop. All rights reserved.</p>
      <div className="flex items-center justify-center gap-4 text-brand/30">
        <Coffee size={20} className="cursor-pointer hover:text-brand transition-colors" />
        <Share2 size={20} className="cursor-pointer hover:text-brand transition-colors" />
        <Settings size={20} className="cursor-pointer hover:text-brand transition-colors" />
      </div>
    </div>
  </footer>
);

// --- Screen Components ---

const PortalSelection: React.FC<{ onSelect: (view: View) => void }> = ({ onSelect }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="max-w-[960px] w-full flex flex-col gap-10"
  >
    <div className="flex flex-col gap-4 text-center md:text-left">
      <h2 className="text-slate-900 text-5xl font-black leading-tight tracking-tight text-center">Welcome Prey-Lang Coffee</h2>
      <p className="text-orange-500 text-brand/70 text-lg font-medium text-center">Choose your portal to continue to the dashboard</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div 
        onClick={() => onSelect(View.STAFF_LOGIN)}
        className="group flex flex-col gap-5 p-8 bg-white rounded-2xl border border-brand/5 shadow-sm hover:shadow-md transition-all cursor-pointer"
      >
        <div className="w-full aspect-video bg-brand/5 rounded-xl overflow-hidden flex items-center justify-center border border-brand/10">
          <BadgeCheck size={64} className="text-brand/40 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-slate-900 text-2xl font-bold text-center">Staff</h3>
          <p className="text-brand/60 text-base leading-relaxed">Access daily operations, live orders, and customer management tools for your shift.</p>
        </div>
        <div className="pt-2">
          <button className=" text-orange-600 inline-flex items-center gap-2 text-brand font-bold text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
            Enter Staff Portal
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div 
        onClick={() => onSelect(View.ADMIN_LOGIN)}
        className="group flex flex-col gap-5 p-8 bg-white rounded-2xl border border-brand/5 shadow-sm hover:shadow-md transition-all cursor-pointer"
      >
        <div className="w-full aspect-video bg-brand/5 rounded-xl overflow-hidden flex items-center justify-center border border-brand/10">
          <TrendingUp size={64} className="text-brand/40 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-slate-900 text-2xl font-bold text-center">Admin</h3>
          <p className="text-brand/60 text-base leading-relaxed">Manage branch settings, inventory levels, payroll reports, and performance analytics.</p>
        </div>
        <div className="pt-2">
          <button className=" text-orange-600 inline-flex items-center gap-2 text-brand font-bold text-sm uppercase tracking-wider group-hover:gap-3 transition-all ">
            Enter Admin Portal
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const StaffLogin: React.FC<{ onBack: () => void, onForgot: () => void, onSuccess: () => void }> = ({ onBack, onForgot, onSuccess }) => {
  const [showPin, setShowPin] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const normalizedStaffId = staffId.replace(/(\r\n|\n|\r|\\n|\\r)/g, '').trim();
      const normalizedPin = pin.replace(/(\r\n|\n|\r|\\n|\\r)/g, '').trim();

      await staffLogin({
        staff_id: normalizedStaffId,
        pin: normalizedPin,
      });
      onSuccess();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="login-card"
    >
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-brand transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={12} className="mr-1" />
          Back to Role Selection
        </button>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">STAFF LOGIN</h1>
        <p className="text-sm text-slate-500 leading-relaxed px-4">
          Please enter your credentials to access the shop portal.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Staff Email / Name</label>
          <input 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-sm" 
            placeholder="Enter email or name" 
            type="text"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-1.5 relative">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">PIN / Password</label>
          <input 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-sm" 
            placeholder="Enter your PIN" 
            type={showPin ? "text" : "password"}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <button 
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-4 top-9 text-slate-400 hover:text-brand"
          >
            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="flex items-center justify-between text-xs font-medium pt-1">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-500">
            <input className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" type="checkbox" />
            <span>Remember session</span>
          </label>
          <button type="button" onClick={onForgot} className="text-brand hover:underline font-bold italic">Forgot Password?</button>
        </div>
        {errorMessage && (
          <p className="text-sm font-semibold text-red-600" role="alert">
            {errorMessage}
          </p>
        )}
        <button 
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 mt-6 shadow-sm" 
        disabled={isSubmitting}
        type="submit"
        >
        <span>{isSubmitting ? 'SIGNING IN...' : 'SIGN IN TO PORTAL'}</span>
        <ArrowRight size={18} />
        </button>
      </form>
      <div className="mt-10 text-center">
        <p className="text-xs font-medium text-slate-500">
          Not staff? <button className="text-orange-600 hover:text-orange-700 font-bold underline decoration-2 underline-offset-2">Admin Access</button>
        </p>
      </div>
    </motion.div>
  );
};

const ForgotPassword: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSending(true);

    try {
      const result = await forgotStaffPassword(email);
      const passwordHint = result.temporary_password
        ? ` Temporary password (local): ${result.temporary_password}`
        : '';
      setSuccessMessage(`${result.message}${passwordHint}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to process forgot password.',
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="login-card"
    >
      <div className="p-0 flex flex-col items-center text-center">
        <div className="mb-6">
          <div className="size-16 bg-brand/10 rounded-full flex items-center justify-center mb-4 mx-auto">
            <img 
              src={CoffeeImage} 
              alt="Coffee" 
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <h2 className="text-brand text-xl font-bold tracking-tight">Prey-Leng-Coffee</h2>
        </div>
        <div className="mb-8">
          <h1 className="text-orange-600 text-2xl font-bold mb-3">Forgot Password?</h1>
          <p className="text-brand/70 text-sm leading-relaxed max-w-sm mx-auto">
            Enter staff email to generate a new temporary password.
          </p>
        </div>
        <form className="w-full space-y-6" onSubmit={handleForgotSubmit}>
          <div className="flex flex-col items-start w-full">
            <label className="text-slate-900 text-sm font-semibold mb-2 ml-1">Email Address</label>
            <input 
              className="w-full rounded-xl border border-brand/20 bg-white text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/20 h-14 px-4 text-base outline-none transition-all" 
              placeholder="e.g. alex@example.com" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
              required
            />
          </div>
          {errorMessage && (
            <p className="text-sm font-semibold text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-sm font-semibold text-emerald-700" role="status">
              {successMessage}
            </p>
          )}
          <button
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300 text-white rounded-xl h-14 text-base font-bold transition-colors shadow-md shadow-orange-500/20"
            disabled={isSending}
          >
            <span>{isSending ? 'Sending...' : 'Send New Password'}</span>
            <ArrowRight size={20} />
          </button>
        </form>
        <div className="mt-8">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-brand/70 hover:text-brand text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const VerifyCode: React.FC<{ onBack: () => void, onVerify: () => void }> = ({ onBack, onVerify }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="login-card flex flex-col items-center text-center"
    >
      <div className="mb-6">
        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
          <Coffee size={40} className="text-brand" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Session Expired</h1>
      <p className="text-slate-600 text-sm leading-relaxed mb-8">
        For your security, your session has timed out. Please enter the 6-digit code sent to your registered device to continue.
      </p>
      <div className="flex justify-center gap-2 mb-6">
        {code.map((digit, i) => (
          <input 
            key={i}
            id={`code-${i}`}
            className="w-12 h-14 text-center text-xl font-bold border-0 border-b-2 border-brand/20 bg-transparent focus:ring-0 focus:border-brand text-slate-900 outline-none" 
            maxLength={1} 
            type="text" 
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1 mb-8">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Session expires in <span className="text-brand font-bold">60s</span>
        </p>
        <button className="text-sm font-bold text-brand hover:underline">
          Didn't get a code? Resend
        </button>
      </div>
      <button 
        onClick={onVerify}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-14 flex items-center justify-center gap-2 font-bold transition-all shadow-md mb-6"
      >
        Verify and Continue
        <ArrowRight size={20} />
      </button>
      <button 
        onClick={onBack}
        className="text-sm font-medium text-slate-500 hover:text-brand transition-colors flex items-center gap-1"
      >
        <LogOut size={16} />
        Back to Login
      </button>
    </motion.div>
  );
};

const SuccessScreen: React.FC<{ onDashboard: () => void, onBack: () => void }> = ({ onDashboard, onBack }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="login-card text-center"
  >
    <div className="mb-8 flex justify-center">
      <div className="size-24 rounded-full bg-brand/10 flex items-center justify-center text-brand">
        <CheckCircle2 size={64} />
      </div>
    </div>
    <h2 className="text-3xl font-bold mb-4 text-slate-900">Verification Successful</h2>
    <p className="text-slate-600 mb-10 leading-relaxed text-lg">
      Your identity has been securely confirmed. You're ready to access your personalized dashboard.
    </p>
    <div className="space-y-6">
      <button 
        onClick={onDashboard}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-orange-500/20 group"
      >
        <span>Go to Dashboard</span>
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </button>
      <button 
        onClick={onBack}
        className="inline-block text-brand font-medium hover:underline underline-offset-4 decoration-brand/30"
      >
        Back to Login
      </button>
    </div>
  </motion.div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.PORTAL_SELECTION);

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header currentView={currentView} onBack={() => setCurrentView(View.PORTAL_SELECTION)} />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {currentView === View.PORTAL_SELECTION && (
            <PortalSelection key="portal" onSelect={setCurrentView} />
          )}
          {currentView === View.STAFF_LOGIN && (
            <StaffLogin 
              key="login" 
              onBack={() => setCurrentView(View.PORTAL_SELECTION)} 
              onForgot={() => setCurrentView(View.FORGOT_PASSWORD)}
              onSuccess={() => setCurrentView(View.SUCCESS)}
            />
          )}
          {currentView === View.FORGOT_PASSWORD && (
            <ForgotPassword 
              key="forgot" 
              onBack={() => setCurrentView(View.STAFF_LOGIN)}
            />
          )}
          {currentView === View.VERIFY_CODE && (
            <VerifyCode 
              key="verify" 
              onBack={() => setCurrentView(View.STAFF_LOGIN)} 
              onVerify={() => setCurrentView(View.SUCCESS)}
            />
          )}
          {currentView === View.SUCCESS && (
            <SuccessScreen 
              key="success" 
              onDashboard={() => alert('Redirecting to dashboard...')} 
              onBack={() => setCurrentView(View.PORTAL_SELECTION)}
            />
          )}
        </AnimatePresence>
      </main>

      {currentView === View.SUCCESS && (
        <div className="fixed bottom-6 left-6 hidden md:block">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-brand/10 shadow-sm">
            <div className="flex items-center justify-center text-emerald-600">
              <Shield size={20} />
            </div>
            <span className="text-sm font-medium text-slate-700">Secure Session Active</span>
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
