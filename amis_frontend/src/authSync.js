import { useState, useEffect } from 'react';

/**
 * Retrieve the current authenticated user from sessionStorage only (for per-tab session isolation).
 */
export function getAuthUser() {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse authenticated user:', err);
    return null;
  }
}

export function getAuthConfig() {
  const sessionId = sessionStorage.getItem('sessionId');
  return sessionId ? { headers: { 'x-session-id': sessionId } } : {};
}

/**
 * Update authenticated user in sessionStorage only (for per-tab session isolation),
 * retaining the security-critical role boundary, and emit a global synchronization event.
 *
 * @param {Object} updatedFields - Fields to update, e.g. { username, pic }
 * @returns {Object} The updated user object
 */
export function updateAuthUser(updatedFields) {
  const current = getAuthUser() || {};
  
  // Guard role: Do not allow accidental role mutation when updating profile
  const preservedRole = current.role || sessionStorage.getItem('currentUser');
  
  const merged = {
    ...current,
    ...updatedFields,
    // Preserve existing role unless explicitly provided and valid
    role: updatedFields.role !== undefined ? updatedFields.role : preservedRole
  };

  try {
    const serialized = JSON.stringify(merged);
    sessionStorage.setItem('user', serialized);

    if (merged.username) {
      sessionStorage.setItem('username', merged.username);
    }
    if (merged.role) {
      sessionStorage.setItem('currentUser', merged.role);
    }
  } catch (err) {
    console.error('Failed to save updated user into storage:', err);
  }

  // Dispatch custom event for real-time reactivity across same-window React tree
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('amis_user_updated', { detail: merged }));
  }

  return merged;
}

/**
 * React hook to keep local component user state reactive to authSync updates in real time.
 *
 * @param {Object} [initialUser] - Optional initial user from props
 * @returns {Object|null}
 */
export function useAuthUser(initialUser) {
  const [user, setUser] = useState(() => initialUser || getAuthUser());

  useEffect(() => {
    if (initialUser) {
      setUser((prev) => {
        // Only update if properties actually changed
        if (JSON.stringify(prev) !== JSON.stringify(initialUser)) {
          return initialUser;
        }
        return prev;
      });
    }
  }, [initialUser]);

  useEffect(() => {
    const handleCustomUpdate = (e) => {
      if (e.detail) {
        setUser(e.detail);
      }
    };

    const handleStorageUpdate = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Storage update parse error:', err);
        }
      }
    };

    window.addEventListener('amis_user_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('amis_user_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  return user;
}

/**
 * Helper to compute an absolute, sanitized image URL for profile pictures.
 */
export function getProfilePicUrl(pic) {
  if (!pic) return '/assets/profiles/default.svg';
  pic = String(pic).trim().replace(/\\/g, '/').replace(/^\.\//, '');
  if (!pic || pic === 'default_profile.jpg' || pic === 'default.png') {
    return '/assets/profiles/default.svg';
  }
  if (pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('data:')) {
    return pic;
  }
  if (pic.startsWith('uploads/')) {
    return `http://localhost:5000/${pic}`;
  }
  if (pic.startsWith('/uploads/')) {
    return `http://localhost:5000${pic}`;
  }
  if (pic.startsWith('assets/profiles/') || pic.startsWith('/assets/profiles/')) {
    return `http://localhost:5000/${pic.replace(/^\//, '')}`;
  }
  return `http://localhost:5000/uploads/${pic}`;
}
