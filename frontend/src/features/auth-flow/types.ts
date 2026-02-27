export type Screen =
  | 'role-selection'
  | 'staff-login'
  | 'admin-login'
  | 'forgot-password'
  | 'verify-code'
  | 'verification-successful'
  | 'session-expired';

export type Navigate = (to: Screen) => void;
