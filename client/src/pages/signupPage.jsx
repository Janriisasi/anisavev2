import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import bgImage from '../assets/bg.png';

function SignUp() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/homepage');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordFocus = () => {
    setShowPasswordRequirements(true);
  };

  const handlePasswordBlur = () => {
    if (form.password === '') {
      setShowPasswordRequirements(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  //password validation
  const hasMinLength = form.password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(form.password);
  const hasLowerCase = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);

  const getRequirementClass = (isValid) => {
    return `flex items-center text-sm ${
      isValid ? 'text-green-600' : 'text-red-500'
    }`;
  };

  const RequirementItem = ({ isValid, text }) => (
    <div className={getRequirementClass(isValid)}>
      <span className="mr-2">
        {isValid ? '✔' : 'X'}
      </span>
      {text}
    </div>
  );

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { full_name, username, email, password } = form;

      if (!email || !password || !username || !full_name) {
        throw new Error('Please fill in all required fields.');
      }

      if (!hasMinLength) {
        throw new Error('Password must be at least 6 characters.');
      }

       if (!hasUpperCase || !hasLowerCase || !hasNumber) {
         throw new Error('Password must contain uppercase, lowercase, and number.');
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

      toast.success('Account created!');
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
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-black bg-clip-text text-transparent">
            Get Started
          </h2>
          <p className="text-gray-600 mt-2">Create your account now</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="full_name"
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    className="w-full px-4 py-3 pr-12 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* password requirements */}
                {showPasswordRequirements && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-500 rounded-lg">
                    {(!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) && (
                      <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    )}
                    
                    <div className="space-y-1">
                      {!hasMinLength && (
                        <RequirementItem 
                          isValid={false} 
                          text="At least 6 characters" 
                        />
                      )}
                      {!hasUpperCase && (
                        <RequirementItem 
                          isValid={false} 
                          text="One uppercase letter (A-Z)" 
                        />
                      )}
                      {!hasLowerCase && (
                        <RequirementItem 
                          isValid={false} 
                          text="One lowercase letter (a-z)" 
                        />
                      )}
                      {!hasNumber && (
                        <RequirementItem 
                          isValid={false} 
                          text="One number (0-9)" 
                        />
                      )}
                      {!hasSpecialChar && (
                        <RequirementItem 
                          isValid={false} 
                          text="One special character (!@#$%^&*)" 
                        />
                      )}
                      {hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && (
                        <div className="flex items-center text-sm text-green-600 font-medium">
                          <span className="mr-2">✔</span>
                          You have a strong password!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200"
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