import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import bgImage from '../assets/bg.png';

function SignUp() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    address: '',
    contact_number: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/homepage');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { full_name, username, email, password } = form;

      if (!email || !password || !username || !full_name) {
        throw new Error('Please fill in all required fields.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name,
          },
        },
      });

      if (error) {
        console.error('Supabase sign up error:', error);

        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error('Unable to create account. Please try again later.');
        }
      }

      if (!data?.user) {
        throw new Error('Signup succeeded, but no user data returned.');
      }

      toast.success('Account created! Please check your email to confirm.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >

      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-black bg-clip-text text-transparent">
            Get Started
          </h2>
          <p className="text-gray-600 mt-2">Create your account now</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-400"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            placeholder="Full Name"
          />
          <input
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-400"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="Username"
          />
          <input
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-400"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />
          <input
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-400"
            name="contact_number"
            value={form.contact_number}
            onChange={handleChange}
            placeholder="Contact Number"
          />
          <input
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-400"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Email"
          />
          <input
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-400"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Password (min 6 characters)"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-green-800 hover:text-green-900 font-medium"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
