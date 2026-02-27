import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './Header';
import type { Screen } from './types';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import StaffLoginScreen from './screens/StaffLoginScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import VerifyCodeScreen from './screens/VerifyCodeScreen';
import VerificationSuccessfulScreen from './screens/VerificationSuccessfulScreen';
import SessionExpiredScreen from './screens/SessionExpiredScreen';

const motionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

export default function AuthFlow() {
  const [screen, setScreen] = useState<Screen>('role-selection');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = (to: Screen) => {
    setScreen(to);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 bg-coffee-hero -z-10" />
      <Header navigate={navigate} />

      <main className="flex-1 flex flex-col items-center justify-center px-3 py-3 z-10 overflow-hidden">
        <div className="w-full flex justify-center items-center origin-center [@media(max-height:900px)]:scale-[0.92] [@media(max-height:820px)]:scale-[0.85] [@media(max-height:740px)]:scale-[0.78] [@media(max-height:680px)]:scale-[0.72]">
          <AnimatePresence mode="wait">
            {screen === 'role-selection' && <RoleSelectionScreen navigate={navigate} motionProps={motionProps} />}
            {screen === 'staff-login' && (
              <StaffLoginScreen
                navigate={navigate}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                motionProps={motionProps}
              />
            )}
            {screen === 'admin-login' && (
              <AdminLoginScreen
                navigate={navigate}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                motionProps={motionProps}
              />
            )}
            {screen === 'forgot-password' && <ForgotPasswordScreen navigate={navigate} motionProps={motionProps} />}
            {screen === 'verify-code' && (
              <VerifyCodeScreen
                navigate={navigate}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                motionProps={motionProps}
              />
            )}
            {screen === 'verification-successful' && (
              <VerificationSuccessfulScreen navigate={navigate} motionProps={motionProps} />
            )}
            {screen === 'session-expired' && <SessionExpiredScreen navigate={navigate} motionProps={motionProps} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
