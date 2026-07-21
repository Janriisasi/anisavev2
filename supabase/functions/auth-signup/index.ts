// supabase/functions/auth-signup/index.ts
//
// Rate-limited proxy for signup. Same supabase.auth.signUp() call and same
// error-message branching signupPage.jsx used to do client-side — just
// moved server-side so the rate limit can gate it before it runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit, rateLimitedResponse, corsHeaders } from "../_shared/rateLimiter.ts";

const RATE_LIMIT = { action: "signup" as const, maxAttempts: 5, windowMinutes: 60 };

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

  const limit = await enforceRateLimit(req, RATE_LIMIT);
  if (!limit.allowed) {
    return rateLimitedResponse("signup", limit.retryAfterSeconds);
  }

  let email: string, password: string, username: string, full_name: string;
  try {
    const body = await req.json();
    ({ email, password, username, full_name } = body);
  } catch {
    return jsonResponse(400, { success: false, message: "Invalid request body." });
  }

  if (!email || !password) {
    return jsonResponse(400, { success: false, message: "Email and password are required." });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, full_name } },
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      // Generic message — don't confirm whether an email exists to attackers
      return jsonResponse(400, {
        success: false,
        message: "Unable to create account. Please check your details or try logging in.",
      });
    }
    if (error.message.includes("Invalid email")) {
      return jsonResponse(400, { success: false, message: "Please enter a valid email address." });
    }
    return jsonResponse(500, { success: false, message: "Unable to create account. Please try again later." });
  }

  if (!data?.user) {
    return jsonResponse(500, { success: false, message: "Signup succeeded, but no user data returned." });
  }

  return jsonResponse(200, { success: true, message: "Account created!" });
});