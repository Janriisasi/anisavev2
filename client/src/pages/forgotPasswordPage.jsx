import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound, ArrowLeft } from "lucide-react";
import supabase from "../lib/supabase";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // This URL must be added to your Supabase "Redirect URLs" allowlist
        // in: Auth → URL Configuration → Redirect URLs
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error("Something went wrong. Please try again.");
        return;
      }

      // Always show success — don't reveal if email exists (security best practice)
      setSent(true);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("Forgot password error:", err);
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
      <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 lg:p-11 rounded-2xl shadow-xl w-full max-w-md border border-white/20">
        {!sent ? (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <KeyRound className="w-8 h-8 text-green-700" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-black">
                Forgot Password?
              </h2>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                No problem. Enter your email and we'll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-xs sm:text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            {/* Back to login */}
            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 w-full mt-5 text-gray-500 hover:text-green-800 text-xs sm:text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </>
        ) : (
          /* Success State */
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <KeyRound className="w-8 h-8 text-green-700" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-black">
                Check Your Email
              </h2>
              <p className="text-gray-600 mt-3 text-sm sm:text-base leading-relaxed">
                If an account exists for{" "}
                <span className="font-semibold text-green-800 break-all">
                  {email}
                </span>
                , you'll receive a password reset link shortly.
              </p>
              <p className="text-gray-500 mt-2 text-xs sm:text-sm">
                Don't see it? Check your spam folder.
              </p>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>

            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full mt-3 text-gray-500 hover:text-green-800 text-xs sm:text-sm font-medium transition-colors"
            >
              Try a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;