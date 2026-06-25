// authFlowGuard.js
//
// Problem this solves:
// When we call supabase.auth.signInWithPassword() to CHECK credentials before
// sending the OTP, Supabase briefly creates a real session and fires
// onAuthStateChange("SIGNED_IN", session). If AuthContext blindly sets `user`
// from that event, the rest of the app (Routes.jsx, Navbar, redirects) reacts
// as if the user is fully logged in — causing a flash of homepage/landing
// before we sign them out again to wait for OTP verification.
//
// This guard is a simple in-memory flag (not React state, so no re-render
// delay) that AuthContext checks synchronously inside the onAuthStateChange
// callback. While the flag is ON, AuthContext ignores SIGNED_IN events and
// keeps `user` as null. This closes the race condition completely, on web,
// Tauri, and Android alike, since it's plain JS state shared across the app.

let suppressed = false;

export function suppressAuthState() {
  suppressed = true;
}

export function releaseAuthState() {
  suppressed = false;
}

export function isAuthStateSuppressed() {
  return suppressed;
}