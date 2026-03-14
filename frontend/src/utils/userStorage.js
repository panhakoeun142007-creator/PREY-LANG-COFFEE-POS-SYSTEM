export function persistUserToLocalStorage(user) {
  if (!user) return;

  const safeUser = { ...user };

  // Avoid storing large base64 data URLs in localStorage (can exceed quota and break refresh flow).
  if (typeof safeUser.profile_image_url === 'string' && safeUser.profile_image_url.startsWith('data:')) {
    delete safeUser.profile_image_url;
  }

  try {
    localStorage.setItem('user', JSON.stringify(safeUser));
  } catch {
    // Fallback: store only the minimal fields required for role-based routing.
    try {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: safeUser.id,
          name: safeUser.name,
          email: safeUser.email,
          role: safeUser.role,
        }),
      );
    } catch {
      // Ignore storage failures.
    }
  }
}

