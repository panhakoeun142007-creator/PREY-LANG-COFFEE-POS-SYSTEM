export type StaffLoginPayload = {
  staff_id: string;
  pin: string;
};

type StaffLoginResponse = {
  message: string;
  data: {
    staff_id: string;
    role: string;
  };
};

type ForgotPasswordResponse = {
  message: string;
  temporary_password?: string;
};

const baseApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  const proxyUrl = `/api${path}`;
  const directUrl = `${(baseApiUrl || 'http://127.0.0.1:8000').replace(/\/$/, '')}/api${path}`;
  const primaryUrl = baseApiUrl ? directUrl : proxyUrl;
  const fallbackUrl = baseApiUrl ? proxyUrl : directUrl;

  try {
    const response = await fetch(primaryUrl, init);
    if (response.ok) {
      return response;
    }

    // Try fallback target when primary target responds but is not usable.
    if (response.status >= 500 || response.status === 404) {
      return fetch(fallbackUrl, init);
    }

    return response;
  } catch {
    // Try fallback target when primary target is unavailable.
  }

  return fetch(fallbackUrl, init);
}

export async function staffLogin(payload: StaffLoginPayload): Promise<StaffLoginResponse> {
  const response = await apiFetch('/staff/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Login request failed.',
    );
  }

  return body as StaffLoginResponse;
}

export async function forgotStaffPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await apiFetch('/staff/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({email}),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Forgot password request failed.',
    );
  }

  return body as ForgotPasswordResponse;
}

// Token-based password reset types
type RequestResetResponse = {
  message: string;
  token_sent_to?: string;
  expires_in?: number;
  debug_token?: string; // Only in debug mode
};

type VerifyResetResponse = {
  message: string;
};

type VerifyResetPayload = {
  email: string;
  token: string;
  new_pin: string;
};

/**
 * Request a password reset token - sends 6-digit code to user's email
 */
export async function requestPasswordReset(email: string): Promise<RequestResetResponse> {
  const response = await apiFetch('/staff/request-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({email}),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Password reset request failed.',
    );
  }

  return body as RequestResetResponse;
}

/**
 * Verify the token and set new PIN
 */
export async function verifyAndResetPassword(payload: VerifyResetPayload): Promise<VerifyResetResponse> {
  const response = await apiFetch('/staff/reset-with-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Password reset verification failed.',
    );
  }

  return body as VerifyResetResponse;
}
