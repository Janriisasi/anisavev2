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
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { onOpenUrl, getCurrent } from "@tauri-apps/plugin-deep-link";

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showTutorial, closeTutorial } = useTutorialContext();

  // All routes where Navbar should NEVER appear — even if a session exists
  const isPublicPage = [
    "/landing",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/verify-otp",        // OTP step — no session yet
    "/forgot-password",   // No session
    "/reset-password",    // Supabase creates a temp session here — hide navbar anyway
  ].includes(location.pathname);

  useEffect(() => {
    const isTauri =
      typeof window !== "undefined" &&
      (Boolean(window.__TAURI__) || Boolean(window.__TAURI_INTERNALS__));

    if (!isTauri) return;

    const handleUrl = (url) => {
      if (!url) return;
      if (url.includes("reset-password")) {
        // Normalise anisave:// → https://placeholder.com/ so URL() can parse it
        const parsed = new URL(url.replace("anisave://", "https://placeholder.com/"));

        // The bridge converts hash fragments to query params, so both styles
        // (token_hash=... and access_token=...) arrive as search params here.
        // Just forward the whole query string to the in-app route.
        navigate(`/reset-password${parsed.search}`, { replace: true });
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
      <TutorialOverlay isOpen={showTutorial} onClose={closeTutorial} />
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