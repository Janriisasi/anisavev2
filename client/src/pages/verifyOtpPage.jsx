import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, RefreshCw } from "lucide-react";
import supabase from "../lib/supabase";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const inputRefs = useRef([]);

  // Email is passed via navigation state from loginPage
  const email = location.state?.email;

  useEffect(() => {
    // If no email in state, redirect back to login
    if (!email) {
      navigate("/login", { replace: true });
      return;
    }
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // On backspace with empty input, go to previous
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    // Focus last filled input
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join("");
    if (token.length < 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) {
        toast.error("Invalid or expired code. Please try again.");
        // Clear OTP inputs
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      // Check/create profile after OTP verification (same logic as loginPage)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        await supabase.from("profiles").insert([
          {
            id: data.user.id,
            username: data.user.email.split("@")[0],
            full_name: "",
            avatar_url: "",
            address: "",
            contact_number: "",
            updated_at: new Date().toISOString(),
          },
        ]);
      }

      toast.success("Verified! Welcome back.");
      navigate("/homepage", { replace: true });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("OTP verify error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        toast.error("Could not resend code. Please try again.");
        return;
      }

      toast.success("A new code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResending(false);
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
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <Mail className="w-8 h-8 text-green-700" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            Check Your Email
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            We sent a 6-digit code to
          </p>
          <p className="text-green-800 font-semibold text-sm sm:text-base mt-1 break-all">
            {email}
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all ${
                digit ? "border-green-500 bg-green-50" : "border-black"
              }`}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join("").length < 6}
          className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        {/* Resend */}
        <div className="text-center mt-5">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center justify-center gap-2 mx-auto text-green-800 hover:text-green-900 font-medium text-sm sm:text-base transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Sending..." : "Resend code"}
            </button>
          ) : (
            <p className="text-gray-500 text-xs sm:text-sm">
              Resend code in{" "}
              <span className="font-semibold text-green-700">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center mt-4 text-gray-500 text-xs sm:text-sm">
          Wrong email?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-green-800 hover:text-green-900 font-medium"
          >
            Go back
          </button>
        </p>
      </div>
    </div>
  );
}

export default VerifyOtp;