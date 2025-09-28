import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import bgImage from '../assets/bg.png';

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  //redirect if already logged in
  useEffect(() => {
    if (user) {
      //redirect to the page they tried to visit or homepage
      const from = location.state?.from?.pathname || '/homepage';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      //attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      //check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // if no profile exists, create one
      if (profileError) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username: data.user.email.split('@')[0],
              full_name: '',
              avatar_url: '',
              address: '',
              contact_number: '',
              updated_at: new Date().toISOString()
            }
          ]);

        if (createError) {
          console.error('Error creating profile:', createError);
          toast.error('Error creating profile. Please contact support.');
          return;
        }
      }

      toast.success('Login successful!');
      navigate('/homepage');

    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-3 sm:px-4 relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 lg:p-11 rounded-2xl shadow-xl w-full max-w-md h-full border border-white/20 relative">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            Welcome Back
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Log in your account now!</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-1">
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700">
              Email
            </label>
            <input 
              id="email"
              className="w-full px-3 sm:px-4 py-2 sm:py-2 text-sm sm:text-base border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700" 
              name="email" 
              type="email"
              value={form.email}
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="space-y-1 sm:space-y-1">
            <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-3 sm:px-4 py-2 sm:py-2 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2 sm:py-2 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200"
          >
            {loading ? 'Logging In...' : 'Log in'}
          </button>
        </form>
        
        <p className="text-center mt-4 sm:mt-6 text-gray-600 text-xs sm:text-base">
          Don't have an account?{' '}
          <a href="/signup" className="text-green-800 hover:text-green-900 font-medium">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;