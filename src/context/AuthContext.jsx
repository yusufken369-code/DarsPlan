import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
});

const LOCAL_USERS_KEY = 'darsplan_local_users';
const ACTIVE_SESSION_KEY = 'darsplan_active_session';

// Helper to get local users list
function getStoredLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Error reading local users:', e);
    return [];
  }
}

// Helper to save local users list
function saveStoredLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving local users:', e);
  }
}

// Helper to get cached active session
function getCachedActiveSession() {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCachedActiveSession());
  const [user, setUser] = useState(() => getCachedActiveSession()?.user ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check cached local session first
    const cachedSession = getCachedActiveSession();
    if (cachedSession && mounted) {
      setSession(cachedSession);
      setUser(cachedSession.user ?? null);
      setLoading(false);
    }

    // Attempt to verify or refresh with Supabase in background
    supabase.auth
      .getSession()
      .then(({ data: { session: remoteSession }, error }) => {
        if (!mounted) return;
        if (remoteSession) {
          setSession(remoteSession);
          setUser(remoteSession.user ?? null);
          try {
            localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(remoteSession));
          } catch {}
        } else if (!cachedSession) {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        // Network or host unreachable - keep using local cached session if available
        if (cachedSession) {
          setSession(cachedSession);
          setUser(cachedSession.user ?? null);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      });

    // Listen to real-time auth changes if Supabase is active
    let subscription = null;
    try {
      const authRes = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user ?? null);
            try {
              localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(currentSession));
            } catch {}
          } else if (!localStorage.getItem(ACTIVE_SESSION_KEY)) {
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        }
      });
      subscription = authRes?.data?.subscription;
    } catch (e) {
      console.warn('onAuthStateChange subscription warning:', e);
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  // ── Local Registration Fallback ──
  const performLocalSignUp = ({ name, email, password, role = 'teacher' }) => {
    const trimmedEmail = email.trim().toLowerCase();
    const users = getStoredLocalUsers();

    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return {
        data: null,
        error: { message: "Bu email manzili allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring." },
      };
    }

    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser = {
      id: newUserId,
      email: email.trim(),
      password,
      user_metadata: {
        full_name: name.trim(),
        name: name.trim(),
        account_type: role || 'teacher',
      },
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredLocalUsers(users);

    const newSession = {
      access_token: `local_session_${Date.now()}`,
      user: newUser,
    };

    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(newSession));
    } catch {}

    setSession(newSession);
    setUser(newUser);

    return {
      data: {
        user: newUser,
        session: newSession,
      },
      error: null,
    };
  };

  // ── Local Sign In Fallback ──
  const performLocalSignIn = ({ email, password }) => {
    const trimmedEmail = email.trim().toLowerCase();
    const users = getStoredLocalUsers();

    const matched = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (matched) {
      if (matched.password && matched.password !== password) {
        return {
          data: null,
          error: { message: "Email yoki parol noto'g'ri." },
        };
      }

      const activeSession = {
        access_token: `local_session_${Date.now()}`,
        user: matched,
      };

      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
      } catch {}

      setSession(activeSession);
      setUser(matched);

      return {
        data: {
          user: matched,
          session: activeSession,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: { message: "Bunday foydalanuvchi topilmadi. Iltimos, avval ro'yxatdan o'ting." },
    };
  };

  // ── Robust Sign Up ──
  const signUp = async ({ name, email, password, role = 'teacher' }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            account_type: role,
          },
        },
      });

      if (error) {
        const msg = error.message || '';
        // If it's a known conflict
        if (msg.includes('already registered') || msg.includes('already exists')) {
          return {
            data: null,
            error: { message: "Bu email manzili allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring." },
          };
        }
        if (msg.includes('Password should be at least')) {
          return {
            data: null,
            error: { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." },
          };
        }

        // If network issue, "Failed to fetch", or unresolvable backend
        if (
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('fetch') ||
          error.status === 0 ||
          !window.navigator.onLine
        ) {
          console.warn('Backend server unresolvable, registering locally offline:', error);
          return performLocalSignUp({ name, email, password, role });
        }

        return { data: null, error };
      }

      // Check if user already exists (Supabase identity obfuscation)
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        return {
          data: null,
          error: { message: "Bu email manzili allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring." },
        };
      }

      if (data?.session) {
        try {
          localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(data.session));
        } catch {}
        setSession(data.session);
        setUser(data.user);
      }

      return { data, error: null };
    } catch (err) {
      console.warn('Supabase signUp network failure, falling back to local storage:', err);
      return performLocalSignUp({ name, email, password, role });
    }
  };

  // ── Robust Sign In ──
  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('Invalid login credentials')) {
          // Check local users before showing error
          const localRes = performLocalSignIn({ email, password });
          if (!localRes.error) return localRes;

          return {
            data: null,
            error: { message: "Email yoki parol noto'g'ri." },
          };
        }

        if (msg.includes('Email not confirmed')) {
          return {
            data: null,
            error: { message: "Elektron pochtangiz hali tasdiqlanmagan. Iltimos, emailingizni tekshiring." },
          };
        }

        // If network error, Failed to fetch, etc.
        if (
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('fetch') ||
          error.status === 0 ||
          !window.navigator.onLine
        ) {
          console.warn('Backend server unresolvable, checking local authentication:', error);
          return performLocalSignIn({ email, password });
        }

        return { data: null, error };
      }

      if (data?.session) {
        try {
          localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(data.session));
        } catch {}
        setSession(data.session);
        setUser(data.user);
      }

      return { data, error: null };
    } catch (err) {
      console.warn('Supabase signIn exception, falling back to local users:', err);
      return performLocalSignIn({ email, password });
    }
  };

  // ── Robust Sign Out ──
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error (offline/unreachable):', err);
    } finally {
      try {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      } catch {}
      setSession(null);
      setUser(null);
    }
  };

  // ── Robust Update User Profile ──
  const updateUser = async ({ fullName, password }) => {
    const updatePayload = {};
    if (fullName) {
      updatePayload.data = { full_name: fullName.trim(), name: fullName.trim() };
    }
    if (password) {
      updatePayload.password = password;
    }

    try {
      await supabase.auth.updateUser(updatePayload);
    } catch (err) {
      console.warn('Supabase updateUser network warning:', err);
    }

    // Always update local session state
    if (user) {
      const updatedUser = {
        ...user,
        ...(password ? { password } : {}),
        user_metadata: {
          ...user.user_metadata,
          ...(fullName ? { full_name: fullName.trim(), name: fullName.trim() } : {}),
        },
      };

      const updatedSession = session
        ? { ...session, user: updatedUser }
        : { access_token: `local_session_${Date.now()}`, user: updatedUser };

      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(updatedSession));
      } catch {}

      // Update in local users list as well
      const users = getStoredLocalUsers();
      const idx = users.findIndex((u) => u.id === user.id || u.email === user.email);
      if (idx !== -1) {
        users[idx] = updatedUser;
        saveStoredLocalUsers(users);
      }

      setUser(updatedUser);
      setSession(updatedSession);
    }

    return { error: null };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
