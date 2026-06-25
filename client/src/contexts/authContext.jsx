import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../lib/supabase";
import { isAuthStateSuppressed } from "../lib/authFlowGuard";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error checking auth status:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // While the login page is mid-flow (verifying password, about to
      // sign out + send OTP), ignore this event entirely. This prevents
      // `user` from ever becoming truthy during that window, which is
      // what was causing the flash to homepage/landing before /verify-otp.
      if (isAuthStateSuppressed()) {
        return;
      }
      setUser(session?.user ?? null);
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