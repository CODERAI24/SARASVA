import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth }               from "@/firebase/config.js";
import { authService }        from "@/services/auth.service.js";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider — Firebase Auth.
 * onAuthStateChanged automatically restores sessions across page reloads.
 * Context shape is identical to the localStorage version — no page changes needed.
 */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires immediately with the current Firebase user (or null),
    // then again on every auth state change (login / logout / token refresh).
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await authService.getMe();
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub; // cleanup listener on unmount
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await authService.login({ email, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (fields) => {
    const u = await authService.register(fields);
    setUser(u);
    return u;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const u = await authService.loginWithGoogle();
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authService.getMe();
    setUser(u ?? null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
