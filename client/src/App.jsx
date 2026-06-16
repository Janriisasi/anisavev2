import { BrowserRouter as Router, useLocation } from "react-router-dom";
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

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { showTutorial, closeTutorial } = useTutorialContext();

  // All routes where Navbar should NEVER appear — even if a session exists
  const isPublicPage = [
    "/landing",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/verify-otp",       // OTP step — no session yet
    "/forgot-password",  // No session
    "/reset-password",   // Supabase creates a temp session here — hide navbar anyway
  ].includes(location.pathname);

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