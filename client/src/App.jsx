import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/navbar';
import Routes from './Routes';
import Loader from './components/loader';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
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