import { BrowserRouter as Router, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/authContext";
import { useAuth } from "./hooks/useAuth";
import { CartProvider } from "./contexts/cartContext";
import { NotificationProvider } from "./contexts/notificationContext";
import {
  TutorialProvider,
  useTutorialContext,
} from "./contexts/tutorialContext";
import Navbar from "./components/navbar";
import Routes from "./Routes";
import Loader from "./components/loader";
import TutorialOverlay from "./components/tutorialOverlay";
import toast, { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";
import { onOpenUrl, getCurrent } from "@tauri-apps/plugin-deep-link";
import supabase from "./lib/supabase";

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showTutorial, closeTutorial } = useTutorialContext();

  // Surface OAuth failures (e.g. "an account with this email already
  // exists" from the before-user-created Auth Hook) as a toast.
  //
  // On the web, oauthButtons.jsx sends redirectTo: `${origin}/homepage`.
  // If the provider/Supabase rejects the sign-in, it still redirects back
  // to /homepage but with ?error=...&error_description=... in the URL
  // instead of a session. Because /homepage is behind ProtectedRoute and
  // there's no session, the user gets bounced to /login almost
  // immediately — dropping those query params before anyone sees them.
  // Reading them here, on first mount, happens before that redirect and
  // toast() is global (via <Toaster/>) so it survives the navigation.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(
      window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash
    );
    const errorDescription = search.get("error_description") || hash.get("error_description");

    if (errorDescription) {
      toast.error(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
      // Strip the params so a refresh or back-navigation doesn't re-show it.
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // First-time OAuth users get an auto-generated username/blank name (no
  // 4-step signup form to fill those in). Send them to a one-time
  // "finish your profile" step instead of dropping them straight into the
  // app. `profile_completed` is set by handle_new_user() based on whether
  // the account was created with an explicit username (password signup)
  // or not (every OAuth provider) — see the migration for that.
  // profileCheckedRef guards this to a single check per login session so
  // it isn't re-querying the DB on every navigation.
  const profileCheckedRef = useRef(null);
  useEffect(() => {
    if (!user) {
      profileCheckedRef.current = null;
      return;
    }
    if (profileCheckedRef.current === user.id) return;
    if (location.pathname === "/complete-profile") return;

    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      profileCheckedRef.current = user.id;

      if (profile?.profile_completed === false) {
        navigate("/complete-profile", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, location.pathname, navigate]);

  // All routes where Navbar should NEVER appear — even if a session exists
  const isPublicPage = [
    "/landing",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/download",           // Has its own marketing-style header, like /landing
    "/verify-otp",        // OTP step — no session yet
    "/forgot-password",   // No session
    "/reset-password",    // Supabase creates a temp session here — hide navbar anyway
    "/complete-profile",  // First-time OAuth users finishing their profile
  ].includes(location.pathname);

  useEffect(() => {
    const isTauri =
      typeof window !== "undefined" &&
      (Boolean(window.__TAURI__) || Boolean(window.__TAURI_INTERNALS__));

    if (!isTauri) return;

    const handleUrl = (url) => {
      if (!url) return;

      if (url.includes("reset-password")) {
        const parsed = new URL(url.replace("anisave://", "https://placeholder.com/"));
        navigate(`/reset-password${parsed.search}`, { replace: true });
        return;
      }

      if (url.includes("oauth-callback")) {
        const parsed = new URL(url.replace("anisave://", "https://placeholder.com/"));
        // OAuth tokens come back in the hash fragment (#access_token=...),
        // not the query string — unlike the reset-password link above.
        const params = new URLSearchParams(
          parsed.hash ? parsed.hash.slice(1) : parsed.search,
        );
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          supabase.auth
            .setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(({ error }) => {
              if (error) {
                console.error("OAuth deep link setSession error:", error);
                navigate("/login", { replace: true });
                return;
              }
              navigate("/homepage", { replace: true });
            });
        } else {
          const errorDescription = params.get("error_description");
          console.error("OAuth deep link missing tokens:", errorDescription || url);
          toast.error(
            errorDescription
              ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
              : "Sign-in failed or was cancelled. Please try again.",
          );
          navigate("/login", { replace: true });
        }
        return;
      }
    };

    // Case 1: App was CLOSED and opened via deep link — grab the launch URL
    // getCurrent() returns string[] | null (not a single string)
    getCurrent().then((urls) => {
      if (urls?.[0]) handleUrl(urls[0]);
    }).catch(() => {});

    // Case 2: App was ALREADY OPEN when deep link fired
    let unlisten;
    onOpenUrl((urls) => {
      handleUrl(urls[0]);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => unlisten?.();
  }, [navigate]);

  if (loading && !isPublicPage) {
    return <Loader />;
  }

  return (
    <>
      {/* Only show Navbar when logged in AND not on a public/auth page */}
      {user && !isPublicPage && <Navbar />}
      <Routes />
      {/* Never show tutorial on public/auth pages — reset-password creates a
          temporary session that would otherwise trigger it */}
      {!isPublicPage && <TutorialOverlay isOpen={showTutorial} onClose={closeTutorial} />}
      <Toaster
        position="center-top"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#ffffff",
            color: "#00573C",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "10px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            maxWidth: "400px",
            border: "1px solid #e5e7eb",
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: "#00573C",
              secondary: "white",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#FEF2F2",
              color: "#991B1B",
              border: "1px solid #FEE2E2",
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <TutorialProvider>
              <AppContent />
            </TutorialProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;