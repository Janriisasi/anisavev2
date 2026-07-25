import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Loader, UserCircle2 } from "lucide-react";
import supabase from "../lib/supabase";
import { useAuth } from "../contexts/authContext";

function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [currentUsername, setCurrentUsername] = useState(""); // their existing (auto-generated) one
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // null | 'checking' | 'available' | 'taken'
  const [usernameStatus, setUsernameStatus] = useState(null);
  const usernameDebounceRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pre-fill with what's already there: the auto-generated username from
  // handle_new_user(), and whatever name the OAuth provider supplied — so
  // this reads as "confirm/adjust" rather than "fill in from scratch."
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.username) {
        setUsername(profile.username);
        setCurrentUsername(profile.username);
      }

      const meta = user.user_metadata || {};
      const providerName = meta.full_name || meta.name || "";
      setFullName(profile?.full_name || providerName);
    })();
  }, [user]);

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameStatus(null);
    clearTimeout(usernameDebounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 3) return;

    setUsernameStatus("checking");
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("public_profiles")
          .select("username")
          .eq("username", trimmed)
          .maybeSingle();

        if (error) {
          setUsernameStatus(null);
          return;
        }
        // Their current username still belongs to them — don't flag it
        // as "taken" just because they left it unchanged.
        if (data && trimmed !== currentUsername) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("available");
        }
      } catch {
        setUsernameStatus(null);
      }
    }, 500);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (usernameStatus === "checking") {
      toast.error("Please wait while we check username availability");
      return;
    }
    if (usernameStatus === "taken") {
      toast.error("That username is already taken");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          full_name: fullName.trim(),
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message || "Could not save your profile. Please try again.");
        return;
      }

      toast.success("You're all set!");
      navigate("/homepage", { replace: true });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("Complete profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      // Keep whatever username/name they already have (the auto-generated
      // one is still valid and unique) — just stop asking every login.
      await supabase
        .from("profiles")
        .update({ profile_completed: true })
        .eq("id", user.id);
    } catch (err) {
      console.error("Skip profile setup error:", err);
    } finally {
      setSkipping(false);
      navigate("/homepage", { replace: true });
    }
  };

  const UsernameStatusIcon = () => {
    if (username.trim().length < 3) return null;
    if (usernameStatus === "checking") return <Loader className="w-5 h-5 text-gray-400 animate-spin" />;
    if (usernameStatus === "available") return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (usernameStatus === "taken") return <XCircle className="w-5 h-5 text-red-500" />;
    return null;
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
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <UserCircle2 className="w-8 h-8 text-green-700" />
          </div>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            Finish Setting Up
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            One quick step — pick a username and confirm your name.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
          <div className="space-y-1">
            <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                maxLength={15}
                placeholder="Choose a username"
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-16 text-sm sm:text-base border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-xs text-gray-400">{username.length}/15</span>
                <UsernameStatusIcon />
              </div>
            </div>
            {usernameStatus === "taken" && (
              <p className="text-xs text-red-500 mt-1">Username is already taken. Please choose another.</p>
            )}
            {usernameStatus === "available" && (
              <p className="text-xs text-green-600 mt-1">Username is available!</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || skipping}
            className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base bg-green-800 hover:bg-green-900 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save and Continue"}
          </button>
        </form>

        <button
          onClick={handleSkip}
          disabled={loading || skipping}
          className="w-full mt-4 text-gray-500 hover:text-green-800 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
        >
          {skipping ? "..." : "Skip for now"}
        </button>
      </div>
    </div>
  );
}

export default CompleteProfile;