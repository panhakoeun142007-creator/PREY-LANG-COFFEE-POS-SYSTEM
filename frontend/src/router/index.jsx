import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import App from '../App.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import SessionExpired from '../pages/SessionExpired.jsx';
import VerifyCode from '../pages/VerifyCode.jsx';
import VerifySuccessful from '../pages/VerifySuccessful.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/verify-successful" element={<VerifySuccessful />} />
        <Route path="/kiosk" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

