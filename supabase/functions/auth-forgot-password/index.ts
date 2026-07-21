// supabase/functions/auth-forgot-password/index.ts
//
// Rate-limited proxy for the forgot-password flow. Same
// resetPasswordForEmail() call and redirect target forgotPasswordPage.jsx
// used to make client-side.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit, rateLimitedResponse, corsHeaders } from "../_shared/rateLimiter.ts";

const RATE_LIMIT = { action: "forgot_password" as const, maxAttempts: 3, windowMinutes: 60 };

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
    return rateLimitedResponse("forgot_password", limit.retryAfterSeconds);
  }

  let email: string;
  try {
    const body = await req.json();
    email = body.email;
  } catch {
    return jsonResponse(400, { success: false, message: "Invalid request body." });
  }

  if (!email) {
    return jsonResponse(400, { success: false, message: "Email is required." });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } }
  );

  // Same redirect bridge as before: browser -> anisave://reset-password deep link,
  // falling back to in-browser reset if the app isn't installed.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://anisavedevelopment.vercel.app/reset-password",
  });

  if (error) {
    return jsonResponse(500, { success: false, message: "Something went wrong. Please try again." });
  }

  return jsonResponse(200, { success: true, message: "If an account exists, a reset link has been sent." });
});