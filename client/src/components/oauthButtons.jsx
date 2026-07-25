import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import supabase from "../lib/supabase";

function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const isTauri =
    typeof window !== "undefined" &&
    (Boolean(window.__TAURI__) || Boolean(window.__TAURI_INTERNALS__));

  const handleOAuth = async (provider) => {
    setLoadingProvider(provider);
    try {
      const options = {
        redirectTo: isTauri
          ? "anisave://oauth-callback"
          : `${window.location.origin}/homepage`,
      };

      // Azure/Microsoft doesn't include an email claim by default the way
      // Google and Facebook do — without this, Supabase's server-side
      // callback fails with "Error getting user email from external
      // provider" before a session is ever created.
      if (provider === "azure") {
        options.scopes = "openid email profile";
      }

      if (isTauri) {
        // Providers block sign-in from embedded webviews (Google shows
        // "This browser may not be secure"), so the OAuth page has to
        // open in the system's real browser, not inside the app. This
        // returns the provider's authorize URL instead of navigating
        // the current window to it.
        options.skipBrowserRedirect = true;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (isTauri && data?.url) {
        await openUrl(data.url);
        // The system browser now owns the flow. Once the provider and
        // Supabase finish, the OS hands control back to the app via the
        // anisave://oauth-callback deep link, caught in App.jsx.
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(`${provider} login error:`, error);
    } finally {
      // Typically the page will redirect (web) or the browser takes over
      // (Tauri), but if there's an error we stop loading either way.
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuth("google")}
        className="w-full flex items-center justify-center gap-3 py-2 px-4 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
        )}
        Continue with Google
      </button>

      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuth("facebook")}
        className="w-full flex items-center justify-center gap-3 py-2 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === "facebook" ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <img
            src="https://www.svgrepo.com/show/475647/facebook-color.svg"
            alt="Facebook"
            className="w-5 h-5 brightness-0 invert"
          />
        )}
        Continue with Facebook
      </button>

      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuth("azure")}
        className="w-full flex items-center justify-center gap-3 py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === "azure" ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <img
            src="https://www.svgrepo.com/show/452062/microsoft.svg"
            alt="Microsoft"
            className="w-5 h-5"
          />
        )}
        Continue with Microsoft
      </button>
    </div>
  );
}

export default OAuthButtons;