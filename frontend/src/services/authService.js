import { apiRequest } from './api';

export const authService = {
  register(payload) {
    return apiRequest('/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  login(payload) {
    return apiRequest('/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  sendResetLink(payload) {
    return apiRequest('/send-reset-link', { method: 'POST', body: JSON.stringify(payload) });
  },
  verifyCode(payload) {
    return apiRequest('/verify-code', { method: 'POST', body: JSON.stringify(payload) });
  },
  logout() {
    return apiRequest('/logout', { method: 'POST' });
  },
  forgotPassword(payload) {
    return apiRequest('/forgot-password', { method: 'POST', body: JSON.stringify(payload) });
  },
  resetPassword(payload) {
    return apiRequest('/reset-password', { method: 'POST', body: JSON.stringify(payload) });
  },
};
