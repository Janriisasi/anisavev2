import { lazy, Suspense } from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute';
import AdminGate from './components/admin/adminGate';
import { useAuth } from './contexts/authContext';
import Loader from './components/loader';

const LandingPage    = lazy(() => import('./pages/landingPage'));
const Login          = lazy(() => import('./pages/loginPage'));
const SignUp         = lazy(() => import('./pages/signupPage'));
const VerifyOtp      = lazy(() => import('./pages/verifyOtpPage'));       // NEW
const ForgotPassword = lazy(() => import('./pages/forgotPasswordPage'));  // NEW
const ResetPassword  = lazy(() => import('./pages/resetPasswordPage'));   // NEW
const Homepage       = lazy(() => import('./pages/homepage'));
const Profile        = lazy(() => import('./pages/profile'));
const Categories     = lazy(() => import('./pages/categoriesPage'));
const ProductSellers = lazy(() => import('./pages/productSellersPage'));
const Contacts       = lazy(() => import('./pages/contactPage'));
const Farmer         = lazy(() => import('./pages/farmersProfile'));
const AdminDashboard = lazy(() => import('./pages/adminDashboard'));
const PrivacyPolicy  = lazy(() => import('./pages/privacyPolicy'));
const TermsOfService = lazy(() => import('./pages/terms'));
const CartPage       = lazy(() => import('./pages/cartPage'));
const NotFoundPage   = lazy(() => import('./pages/notFoundPage'));

export default function Routes() {
  const { user } = useAuth();

  const isTauri = typeof window !== 'undefined' && (
    Boolean(window.__TAURI__) ||
    Boolean(window.__TAURI_INTERNALS__) ||
    navigator.userAgent.includes('Tauri')
  );

  return (
    <Suspense fallback={<Loader />}>
      <RouterRoutes>
        {/* Default route */}
        <Route
          path="/"
          element={
            <Navigate to={user ? "/homepage" : isTauri ? "/login" : "/landing"} replace />
          }
        />

        {/* Public routes */}
        <Route
          path="/landing"
          element={
            isTauri
              ? <Navigate to="/login" replace />
              : user
                ? <Navigate to="/homepage" replace />
                : <LandingPage />
          }
        />
        <Route path="/login"          element={user ? <Navigate to="/homepage" replace /> : <Login />} />
        <Route path="/signup"         element={user ? <Navigate to="/homepage" replace /> : <SignUp />} />

        {/* Auth flow routes — accessible without a session */}
        <Route path="/verify-otp"     element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/privacy"        element={<PrivacyPolicy />} />
        <Route path="/terms"          element={<TermsOfService />} />

        {/* Admin — deliberately NOT wrapped in ProtectedRoute. AdminGate's
            own server-side check (verify_admin_access RPC) already covers
            auth + admin role, and needs to be the outermost wrapper so a
            visit to /admin with no/wrong key bounces straight to 404
            instead of a login redirect that would hint something's here. */}
        <Route path="/admin"    element={<AdminGate><AdminDashboard /></AdminGate>} />

        {/* Protected routes */}
        <Route path="/homepage" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/categories"     element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/categories/:name" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/product/:productName/sellers" element={<ProtectedRoute><ProductSellers /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/farmer/:id"     element={<ProtectedRoute><Farmer /></ProtectedRoute>} />
        <Route path="/cart"     element={<ProtectedRoute><CartPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </RouterRoutes>
    </Suspense>
  );
}