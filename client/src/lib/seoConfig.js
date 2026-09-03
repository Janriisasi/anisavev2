// SEO metadata for public routes only. Any path not listed here —
// protected pages, /admin, auth flow pages, 404s, unmatched dynamic
// routes — falls through to the noindex default in getSEOForPath().
// This is intentionally a whitelist, not a blocklist: a new protected
// route added to Routes.jsx is automatically noindex without anyone
// having to remember to add it here.

export const SITE_URL = "https://anisave-webapp.vercel.app";

const DEFAULT_TITLE =
  "AniSave";
const DEFAULT_DESCRIPTION =
  "AniSave connects Filipino farmers and buyers with real-time crop prices and a direct agricultural marketplace — know your prices like never before.";

const PUBLIC_ROUTES_SEO = {
  "/landing": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  "/faq": {
    title: "FAQ – AniSave",
    description:
      "Answers to common questions about tracking agricultural market prices and connecting with buyers or farmers on AniSave.",
  },
  "/download": {
    title: "Download AniSave",
    description:
      "Get AniSave for real-time agricultural market prices and a direct farmer-to-buyer marketplace.",
  },
  "/privacy": {
    title: "Privacy Policy – AniSave",
    description:
      "Read AniSave's privacy policy to learn how your information is collected, used, and protected.",
  },
  "/terms": {
    title: "Terms of Service – AniSave",
    description: "Read the terms of service that govern your use of AniSave.",
  },
};

const NOINDEX_FALLBACK = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

/**
 * Returns { title, description, index } for a given pathname.
 * `index: true` only for the whitelisted public routes above.
 */
export function getSEOForPath(pathname) {
  const match = PUBLIC_ROUTES_SEO[pathname];
  if (match) {
    return { ...match, index: true };
  }
  return { ...NOINDEX_FALLBACK, index: false };
}