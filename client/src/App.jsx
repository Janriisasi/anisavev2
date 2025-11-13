import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/authContext';
import Navbar from './components/navbar';
import Routes from './Routes';
import Loader from './components/loader';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isPublicPage = ['/landing', '/login', '/signup', '/privacy', '/terms'].includes(location.pathname);

  if (loading && !isPublicPage) {
    return <Loader />;
  }

  return (
    <>
      {user && <Navbar />}
      <Routes />
      <Toaster 
        position="center-top"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#f1f1f1',
            color: '#00573C',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;