import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/navbar';
import Routes from './Routes';
import Loader from './components/loader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      {user && <Navbar />}
      <Routes />
      <ToastContainer />
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