import { createContext, useContext, useState, useEffect, useRef } from "react";
import supabase from "../lib/supabase";
import { isAuthStateSuppressed } from "../lib/authFlowGuard";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const resolvedOnce = useRef(false);

  useEffect(() => {
    // We rely entirely on onAuthStateChange rather than a separate
    // getSession() call. Supabase always fires an "INITIAL_SESSION" event
    // as the first event on every subscription, and it waits for any
    // pending OAuth redirect session detection to finish first. A separate
    // getSession() call racing against that detection was what caused
    // `loading` to flip to false (with `user` still null) right after
    // Google/Facebook redirected back to /homepage — bouncing straight to
    // /landing before the real session had landed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // While the login page is mid-flow (verifying password, about to
      // sign out + send OTP), ignore this event's session entirely. This
      // prevents `user` from ever becoming truthy during that window,
      // which is what was causing the flash to homepage/landing before
      // /verify-otp. We still resolve `loading` once so pages don't hang.
      if (isAuthStateSuppressed()) {
        if (!resolvedOnce.current) {
          resolvedOnce.current = true;
          setLoading(false);
        }
        return;
      }

      // On the reset-password page, verifyOtp() creates a temporary session
      // so the user can call updateUser(). We must NOT propagate that session
      // to the global auth state — otherwise the app sees a logged-in user
      // and may redirect away before the password form is submitted.
      if (window.location.pathname === "/reset-password") {
        if (!resolvedOnce.current) {
          resolvedOnce.current = true;
          setLoading(false);
        }
        return;
      }

      setUser(session?.user ?? null);
      resolvedOnce.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};