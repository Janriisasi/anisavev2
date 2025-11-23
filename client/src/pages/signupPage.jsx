import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/authContext';

function SignUp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');

  const totalSteps = 4;

  useEffect(() => {
    if (user) {
      navigate('/homepage');
    }
  }, [user, navigate]);

  
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

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
    return `flex items-center text-xs sm:text-sm ${
      isValid ? 'text-green-600' : 'text-red-500'
    }`;
  };

  const RequirementItem = ({ isValid, text }) => (
    <div className={getRequirementClass(isValid)}>
      <span className="mr-2">
        {isValid ? '✓' : 'X'}
      </span>
      {text}
    </div>
  );

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!form.full_name.trim()) {
          toast.error('Please enter your full name');
          return false;
        }
        return true;
      case 2:
        if (!form.username.trim()) {
          toast.error('Please enter a username');
          return false;
        }
        return true;
      case 3:
        if (!form.email.trim()) {
          toast.error('Please enter your email');
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(form.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        return true;
      case 4:
        if (!form.password) {
          toast.error('Please enter a password');
          return false;
        }
        if (!hasMinLength) {
          toast.error('Password must be at least 6 characters');
          return false;
        }
        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
          toast.error('Password must contain uppercase, lowercase, and number');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setSlideDirection('next');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setSlideDirection('');
      }, 300);
    }
  };

  const handlePrevious = () => {
    setSlideDirection('prev');
    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      setSlideDirection('');
    }, 300);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);

    try {
      const { full_name, username, email, password } = form;

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-2">
            <label htmlFor="full_name" className="block text-sm sm:text-base font-medium text-gray-700">
              What's your full name?
            </label>
            <input
              id="full_name"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border-2 border-black rounded-xl focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700 transition-all"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoFocus
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm sm:text-base font-medium text-gray-700">
              Choose a username
            </label>
            <input
              id="username"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border-2 border-black rounded-xl focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700 transition-all"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              autoFocus
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700">
              What's your email?
            </label>
            <input
              id="email"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border-2 border-black rounded-xl focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700 transition-all"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoFocus
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700">
              Create a password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-base sm:text-lg border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                placeholder="Enter your password"
                autoFocus
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
            
            {/* Password requirements */}
            {showPasswordRequirements && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
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
                      <span className="mr-2">✓</span>
                      You have a strong password!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-3 sm:px-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: isMobile 
          ? `url(/images/bg_mobile.png)` 
          : `url(/images/bg_login.png)`
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl w-full max-w-lg border border-white/20 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            Get Started
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-1/4 h-2 mx-1 rounded-full transition-all duration-300 ${
                  step <= currentStep ? 'bg-green-700' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className={`flex-1 text-center ${currentStep === 1 ? 'text-green-700 font-medium' : ''}`}>Name</span>
            <span className={`flex-1 text-center ${currentStep === 2 ? 'text-green-700 font-medium' : ''}`}>Username</span>
            <span className={`flex-1 text-center ${currentStep === 3 ? 'text-green-700 font-medium' : ''}`}>Email</span>
            <span className={`flex-1 text-center ${currentStep === 4 ? 'text-green-700 font-medium' : ''}`}>Password</span>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Current Step Content */}
          <div className="overflow-hidden">
            <div className={`transition-all duration-300 ease-in-out ${
              slideDirection === 'next' ? '-translate-x-full opacity-0' : 
              slideDirection === 'prev' ? 'translate-x-full opacity-0' : 
              'translate-x-0 opacity-100'
            }`}>
              {renderStep()}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex-1 py-3 px-4 text-sm sm:text-base bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            )}
          </div>
        </form>

        <p className="text-center mt-6 text-gray-600 text-xs sm:text-base">
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