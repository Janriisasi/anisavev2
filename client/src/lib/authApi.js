// src/lib/authApi.js
//
// Thin wrapper around supabase.functions.invoke() for the rate-limited auth
// Edge Functions (auth-login, auth-signup, auth-forgot-password).
//
// Why this exists: when an Edge Function returns a non-2xx status (like our
// 429s), supabase-js puts the response in `error`, not `data` — but the JSON
// body we set (e.g. { success: false, message: "..." }) is still readable
// via error.context.json(). This helper does that extraction once so every
// page doesn't have to.

import supabase from "./supabase";

export async function callAuthFunction(functionName, payload) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  });

  if (error) {
    let message = "Something went wrong. Please try again.";
    try {
      const parsed = await error.context.json();
      if (parsed?.message) message = parsed.message;
    } catch {
      // context wasn't JSON (network error, cold-start timeout, etc.) —
      // fall back to the generic message above.
    }
    return { data: null, error: { message, status: error.context?.status ?? null } };
  }

  return { data, error: null };
}