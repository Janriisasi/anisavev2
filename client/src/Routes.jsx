import { lazy, Suspense } from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute';
import { useAuth } from './contexts/authContext';
import Loader from './components/loader';

//lazy loading all page components
const LandingPage = lazy(() => import('./pages/landingPage'));
const Login = lazy(() => import('./pages/loginPage'));
const SignUp = lazy(() => import('./pages/signupPage'));
const Homepage = lazy(() => import('./pages/homepage'));
const Profile = lazy(() => import('./pages/profile'));
const Categories = lazy(() => import('./pages/categoriesPage'));
const ProductSellers = lazy(() => import('./pages/productSellersPage'));
const Contacts = lazy(() => import('./pages/contactPage'));
const Farmer = lazy(() => import('./pages/farmersProfile'));
const AdminDashboard = lazy(() => import('./pages/adminDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/privacyPolicy'));
const TermsOfService = lazy(() => import('./pages/terms'));

export default function Routes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<Loader />}>
      <RouterRoutes>
        {/* default route */}
        <Route path="/" element={
          <Navigate to={user ? "/homepage" : "/landing"} replace />
        } />
        
        {/* public routes */}
        <Route path="/landing" element={
          user ? <Navigate to="/homepage" replace /> : <LandingPage />
        } />
        
        <Route path="/login" element={
          user ? <Navigate to="/homepage" replace /> : <Login />
        } />
        
        <Route path="/signup" element={
          user ? <Navigate to="/homepage" replace /> : <SignUp />
        } />

        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* protected routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/homepage" element={
          <ProtectedRoute>
            <Homepage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/categories" element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        } />

        <Route path="/categories/:name" element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        } />

        <Route path="/product/:productName/sellers" element={
          <ProtectedRoute>
            <ProductSellers />
          </ProtectedRoute>
        } />

        <Route path="/contacts" element={
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        } />

        <Route path="/farmer/:id" element={
          <ProtectedRoute>
            <Farmer />
          </ProtectedRoute>
        } />

        {/* error 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-green-800 mb-4">404</h1>
              <p className="text-gray-600">Page not found</p>
            </div>
          </div>
        } />
      </RouterRoutes>
    </Suspense>
  );
}