import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import supabase from "../lib/supabase";

// FIXED: PageWrapper is now defined OUTSIDE the component, at module scope.
function PageWrapper({ isMobile, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 sm:px-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: isMobile
          ? `url(/images/bg_mobile.png)`
          : `url(/images/bg_login.png)`,
      }}
    >
      {children}
    </div>
  );
}

function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isBrowserBridge, setIsBrowserBridge] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const isTauri =
      Boolean(window.__TAURI__) || Boolean(window.__TAURI_INTERNALS__);

    if (!isTauri) {
      // ── Browser ────────────────────────────────────────────────────────────
      // Try to open the app via deep link. If the user has the app installed,
      // Android intercepts anisave:// and opens it. If not, we fall back to
      // handling the reset in the browser itself after a short timeout.
      const hash = window.location.hash;
      const search = window.location.search;
      const tokenParam = search || (hash && hash.length > 1 ? `?${hash.slice(1)}` : "");

      if (tokenParam) {
        // Fire the deep link attempt
        window.location.href = `anisave://reset-password${tokenParam}`;

        // After 2s, if the tab is still visible, the app didn't open —
        // fall back to handling reset in the browser via verifyOtp
        const fallbackTimer = setTimeout(() => {
          if (!document.hidden) {
            const params = new URLSearchParams(tokenParam);
            const tokenHash = params.get("token_hash");
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            const type = params.get("type");

            setIsBrowserBridge(false); // switch out of bridge mode

            if (accessToken && refreshToken) {
              supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                .then(({ data: { session } }) => {
                  if (session) setValidSession(true);
                  setCheckingSession(false);
                })
                .catch(() => setCheckingSession(false));
            } else if (tokenHash && type === "recovery") {
              supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
                .then(({ data: { session } }) => {
                  if (session) setValidSession(true);
                  setCheckingSession(false);
                })
                .catch(() => setCheckingSession(false));
            } else {
              setCheckingSession(false);
            }
          }
        }, 2000);

        // Show "Opening app..." while waiting
        setIsBrowserBridge(true);
        return () => clearTimeout(fallbackTimer);
      }

      // No token at all
      setCheckingSession(false);
      return;
    }

    // ── Inside Tauri app ──────────────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data: { session } }) => {
          if (session) setValidSession(true);
          setCheckingSession(false);
        })
        .catch(() => setCheckingSession(false));
    } else if (tokenHash && type === "recovery") {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ data: { session } }) => {
          if (session) setValidSession(true);
          setCheckingSession(false);
        })
        .catch(() => setCheckingSession(false));
    } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
            setValidSession(true);
          }
          setCheckingSession(false);
        }
      );

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setValidSession(true);
        setCheckingSession(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const hasMinLength = form.password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(form.password);
  const hasLowerCase = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const passwordsMatch = form.password === form.confirm && form.confirm.length > 0;
  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordStrong) {
      toast.error("Password does not meet requirements");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password. Please try again.");
        return;
      }

      toast.success("Password reset successfully!");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <PageWrapper isMobile={isMobile}>
        <div className="bg-white/90 backdrop-blur-sm p-10 rounded-2xl shadow-xl flex flex-col items-center gap-4 max-w-sm mx-4">
          <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
          {isBrowserBridge ? (
            <>
              <p className="text-gray-600 text-sm font-medium">Opening AniSave app...</p>
              <p className="text-gray-400 text-xs text-center leading-relaxed">
                If the app doesn't open, you'll be redirected here to reset your password in the browser instead.
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Verifying your link...</p>
          )}
        </div>
      </PageWrapper>
    );
  }

  if (!validSession) {
    return (
      <PageWrapper isMobile={isMobile}>
        <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 lg:p-11 rounded-2xl shadow-xl w-full max-w-md border border-white/20 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
            Link Expired
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            This password reset link is invalid or has already been used. Please request a new one.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Request New Link
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper isMobile={isMobile}>
      <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 lg:p-11 rounded-2xl shadow-xl w-full max-w-md border border-white/20">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <ShieldCheck className="w-8 h-8 text-green-700" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            Set New Password
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* New Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter new password"
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            {/* Password requirements */}
            {form.password.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                {[
                  { met: hasMinLength, text: "At least 6 characters" },
                  { met: hasUpperCase, text: "One uppercase letter (A-Z)" },
                  { met: hasLowerCase, text: "One lowercase letter (a-z)" },
                  { met: hasNumber, text: "One number (0-9)" },
                ].map(({ met, text }) => (
                  <div
                    key={text}
                    className={`flex items-center text-xs sm:text-sm ${met ? "text-green-600" : "text-red-500"}`}
                  >
                    <span className="mr-2">{met ? "✓" : "✗"}</span>
                    {text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label
              htmlFor="confirm"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter new password"
                required
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 text-sm sm:text-base border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 transition-all ${
                  form.confirm.length > 0
                    ? passwordsMatch
                      ? "border-green-500 focus:border-green-500"
                      : "border-red-400 focus:border-red-400"
                    : "border-black focus:border-green-700"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
            {form.confirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordStrong || !passwordsMatch}
            className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

export default ResetPassword;