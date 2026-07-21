// supabase/functions/_shared/rateLimiter.ts
//
// Shared rate-limiting middleware for auth Edge Functions
// (auth-login, auth-signup, auth-forgot-password).
// Backed by public.rate_limit_attempts + public.check_rate_limit()
// — see supabase/migrations/20260720000000_rate_limiting.sql.
//
// Usage inside a function's index.ts:
//
//   const limit = await enforceRateLimit(req, {
//     action: "login",
//     maxAttempts: 5,
//     windowMinutes: 15,
//   });
//   if (!limit.allowed) return rateLimitedResponse("login", limit.retryAfterSeconds);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type RateLimitAction = "login" | "signup" | "forgot_password";

export interface RateLimitConfig {
  action: RateLimitAction;
  maxAttempts: number;
  windowMinutes: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

// Exact messages required per endpoint — kept in one place so they can't drift.
export const RATE_LIMIT_MESSAGES: Record<RateLimitAction, string> = {
  login: "Too many login attempts. Please try again in 15 minutes.",
  signup: "Too many account creation attempts. Please try again later.",
  forgot_password: "Too many password reset requests. Please try again later.",
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Service-role client — ONLY ever used to call the rate-limit RPC.
// Never used to perform the actual auth action itself.
function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

// Best-effort client IP extraction. Edge Functions sit behind a proxy, so
// the real client IP arrives via x-forwarded-for.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Should rarely hit this in production — keeps local
  // `supabase functions serve` testing from throwing.
  return "unknown";
}

export async function enforceRateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<RateLimitCheckResult> {
  const identifier = getClientIp(req);
  const admin = getAdminClient();

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_identifier: identifier,
    p_action: config.action,
    p_max_attempts: config.maxAttempts,
    p_window_minutes: config.windowMinutes,
  });

  if (error) {
    // Fail OPEN on infra errors (DB hiccup, etc.) so a rate-limiter outage
    // can't take down auth entirely. Logged loudly so it doesn't go unnoticed —
    // check these logs in the Supabase dashboard if auth ever seems "off".
    console.error(`[rateLimiter] check_rate_limit failed for action=${config.action}:`, error);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    retryAfterSeconds: Number(row?.retry_after_seconds ?? 0),
  };
}

export function rateLimitedResponse(action: RateLimitAction, retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ success: false, message: RATE_LIMIT_MESSAGES[action] }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds || 900),
        ...corsHeaders,
      },
    }
  );
}