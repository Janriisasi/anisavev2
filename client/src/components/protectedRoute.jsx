import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    //redirect to landing while saving the attempted location
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  return children;
}