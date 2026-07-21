// supabase/functions/auth-login/index.ts
//
// Rate-limited proxy for the login flow. Does exactly what loginPage.jsx's
// handleLogin used to do directly against supabase-js:
//   1. verify email + password (signInWithPassword)
//   2. sign out immediately (this endpoint never issues the real session)
//   3. send the Email OTP (signInWithOtp)
//
// The ONLY thing added here is the rate-limit gate, checked before step 1
// ever runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit, rateLimitedResponse, corsHeaders } from "../_shared/rateLimiter.ts";

const RATE_LIMIT = { action: "login" as const, maxAttempts: 5, windowMinutes: 15 };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse(405, { success: false, message: "Method not allowed." });
  }

  // ── Rate limit FIRST, before touching Supabase Auth at all ──
  const limit = await enforceRateLimit(req, RATE_LIMIT);
  if (!limit.allowed) {
    return rateLimitedResponse("login", limit.retryAfterSeconds);
  }

  let email: string, password: string;
  try {
    const body = await req.json();
    email = body.email;
    password = body.password;
  } catch {
    return jsonResponse(400, { success: false, message: "Invalid request body." });
  }

  if (!email || !password) {
    return jsonResponse(400, { success: false, message: "Email and password are required." });
  }

  // Same anon-key client the browser SDK used before — this function is a
  // thin proxy in front of the existing auth logic, not a reimplementation.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } }
  );

  // Step 1: verify credentials
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return jsonResponse(401, { success: false, message: "Incorrect email or password." });
  }

  // Step 2: sign out immediately — password check only, real session
  // isn't issued until OTP verification succeeds.
  await supabase.auth.signOut();

  // Step 3: send the Email OTP
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (otpError) {
    return jsonResponse(500, {
      success: false,
      message: "Could not send verification code. Please try again.",
    });
  }

  return jsonResponse(200, { success: true, message: "Code sent! Check your email." });
});