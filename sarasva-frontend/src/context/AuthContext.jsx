import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth }               from "@/firebase/config.js";
import { authService }        from "@/services/auth.service.js";
import { sessionsService, getSessionId } from "@/services/sessions.service.js";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider — Firebase Auth.
 * onAuthStateChanged automatically restores sessions across page reloads.
 * Also manages per-device session docs for the "Active Sessions" feature.
 */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs for cleanup across renders
  const heartbeatRef   = useRef(null);
  const selfListenRef  = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Always clean up previous session infra first
      if (heartbeatRef.current)  { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      if (selfListenRef.current) { selfListenRef.current(); selfListenRef.current = null; }

      if (firebaseUser) {
        const profile = await authService.getMe();
        setUser(profile);

        const uid = firebaseUser.uid;

        // Register / refresh this device's session doc
        await sessionsService.register(uid).catch(() => {});

        // Heartbeat every 5 minutes so lastActive stays fresh
        heartbeatRef.current = setInterval(() => {
          sessionsService.heartbeat(uid);
        }, 5 * 60 * 1000);

        // Listen to own session doc — if another device deletes it, sign out here
        selfListenRef.current = sessionsService.listenToSelf(uid, async () => {
          // Only act if we're still signed in (prevents loop during voluntary logout)
          if (auth.currentUser) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
            await firebaseSignOut(auth);
            setUser(null);
          }
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      unsub();
      if (heartbeatRef.current)  clearInterval(heartbeatRef.current);
      if (selfListenRef.current) selfListenRef.current();
    };
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
    const uid = auth.currentUser?.uid;
    // Sign out first so auth.currentUser becomes null — this stops the
    // listenToSelf callback from triggering a redundant signOut when we
    // delete our own session doc below.
    await authService.logout();
    setUser(null);
    // Now delete our session doc (safe — listener won't react because currentUser is null)
    if (uid) {
      await sessionsService.remove(uid, getSessionId()).catch(() => {});
    }
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
