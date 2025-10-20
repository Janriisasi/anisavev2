import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute';
import { useAuth } from './contexts/authContext';
import LandingPage from './pages/landingPage';
import Login from './pages/loginPage';
import SignUp from './pages/signupPage';
import Homepage from './pages/homepage';
import Profile from './pages/profile';
import Categories from './pages/categoriesPage';
import ProductSellers from './pages/productSellersPage';
import Contacts from './pages/contactPage';
import Farmer from './pages/farmersProfile';
import AdminDashboard from './pages/adminDashboard';
import PrivacyPolicy from './pages/privacyPolicy';

export default function Routes() {
  const { user } = useAuth();

  return (
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
            <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-gray-600">Page not found</p>
          </div>
        </div>
      } />
    </RouterRoutes>
  );
}