import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/authContext";
import { suppressAuthState, releaseAuthState } from "../lib/authFlowGuard";
import { callAuthFunction } from "../lib/authApi";

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Only redirect if a REAL completed session exists (post-OTP).
  // Because of the authFlowGuard, `user` will stay null throughout the
  // password-check + OTP-send steps below, so this won't fire prematurely.
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/homepage";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Safety net: always release the guard if this page unmounts mid-flow
  // (e.g. user closes tab or navigates away manually before OTP step).
  useEffect(() => {
    return () => releaseAuthState();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sendingToast = toast.loading("Checking credentials...");

    // Turn the guard ON before triggering any Supabase auth call.
    // This stops AuthContext from reacting to the SIGNED_IN event that
    // signInWithPassword() is about to fire — so `user` stays null and
    // nothing redirects/flashes to homepage or landing.
    suppressAuthState();

    try {
      // Credential check, sign-out, and OTP send now all happen server-side
      // in the auth-login Edge Function — same three steps as before, just
      // rate-limited (5 attempts / 15 min per IP) before they run.
      const { error } = await callAuthFunction("auth-login", {
        email: form.email,
        password: form.password,
      });

      if (error) {
        toast.dismiss(sendingToast);
        toast.error(error.message);
        return;
      }

      toast.dismiss(sendingToast);
      toast.success("Code sent! Check your email.");

      // Navigate to OTP screen. Guard stays ON until verifyOtpPage
      // explicitly releases it after a SUCCESSFUL verification —
      // so even on slow Tauri/Android webviews there is no window where
      // a stale session can leak through to protected routes.
      navigate("/verify-otp", {
        state: { email: form.email },
        replace: true, // replace so back button doesn't return to a half-finished login
      });
    } catch (error) {
      toast.dismiss(sendingToast);
      toast.error("An unexpected error occurred");
      console.error("Login error:", error);
      releaseAuthState(); // release on unexpected failure so app isn't stuck
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 sm:px-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: isMobile
          ? `url(/images/bg_mobile.png)`
          : `url(/images/bg_login.png)`,
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 lg:p-11 rounded-2xl shadow-xl w-full max-w-md border border-white/20 relative">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            Welcome Back
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Log in to your account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
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

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
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

            {/* Forgot password link below the input */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs sm:text-sm text-green-800 hover:text-green-900 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 sm:py-2.5 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <p className="text-center mt-4 sm:mt-6 text-gray-600 text-xs sm:text-base">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="text-green-800 hover:text-green-900 font-medium"
          >
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;