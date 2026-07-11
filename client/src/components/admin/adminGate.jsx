import React, { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import supabase from "../../lib/supabase";

/**
 * AdminGate
 * ---------
 * Wraps the /admin route. Two layers, both enforced so that neither one
 * alone is the thing standing between a random visitor and the dashboard:
 *
 * 1. HONEYPOT LAYER (traffic filter, not the lock itself)
 *    Visiting /admin with no ?k= param at all never touches Supabase —
 *    it's bounced to /404 immediately, same as any made-up URL on the
 *    site. This is what keeps bots, scanners, and casual poking from
 *    ever seeing a request go out, let alone a login form.
 *
 * 2. REAL ACCESS CONTROL LAYER
 *    If a ?k= param IS present (right or wrong), the value is sent to
 *    the `verify_admin_access` RPC, which checks it against a secret
 *    stored only inside the Postgres function itself — never in this
 *    file, never in a Vite env var, never in the built JS bundle.
 *    That same call also checks the caller's auth.uid() against the
 *    admin_roles table. Both have to be true. Nothing client-editable
 *    (no password, no email string, no user_metadata flag) is part of
 *    the decision, and nobody who reads this file or the compiled
 *    bundle can find the correct key — only guess it.
 */
export default function AdminGate({ children }) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking | denied | granted

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const providedKey = searchParams.get("k");

      // No key at all → don't even talk to Supabase. True dead end for
      // anything that isn't specifically probing this URL.
      if (!providedKey) {
        if (!cancelled) setStatus("denied");
        return;
      }

      // Single server-side call does both checks: is this the right key,
      // AND is the caller (if any) an admin. The secret comparison never
      // happens in the browser.
      const { data: isAdmin, error } = await supabase.rpc(
        "verify_admin_access",
        { input_key: providedKey },
      );

      if (!cancelled) {
        setStatus(!error && isAdmin ? "granted" : "denied");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === "checking") return null;
  if (status === "denied") return <Navigate to="/404" replace />;
  return children;
}