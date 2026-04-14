import { useEffect, useRef } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/authContext';

/**
 * Custom hook for managing user presence (online/offline status)
 *
 * FIX SUMMARY:
 * - sendBeacon was failing silently (no auth headers to Supabase REST).
 * - Presence now relies on a heartbeat timestamp. Any record whose
 *   last_activity is older than STALE_THRESHOLD is treated as offline
 *   by consumers (fetchPresence / subscription checks).
 * - On mount we do a hard upsert; on unload we do a synchronous XHR
 *   (keepalive fetch) which correctly carries the session token.
 * - Inactivity timeout reduced to 90 s for snappier offline detection.
 */
export function usePresence() {
  const { user } = useAuth();
  const activityTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const isOnlineRef = useRef(false);

  // How long (ms) without a heartbeat before we consider the user offline.
  // Consumers should use this same value when deciding "is stale = offline".
  const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

  useEffect(() => {
    if (!user) return;

    setOnline();
    isOnlineRef.current = true;

    // Activity events
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    const handleActivity = () => {
      if (!isOnlineRef.current) {
        setOnline();
        isOnlineRef.current = true;
      }
      resetInactivityTimer();
    };
    activityEvents.forEach(ev => document.addEventListener(ev, handleActivity, { passive: true }));

    // Heartbeat every 30 s keeps last_activity fresh
    heartbeatIntervalRef.current = setInterval(() => {
      if (isOnlineRef.current) updatePresence(true);
    }, 30_000);

    // Page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        startInactivityTimer();
      } else {
        clearInactivityTimer();
        setOnline();
        isOnlineRef.current = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Page unload — use keepalive fetch so the request survives tab close
    const handleBeforeUnload = () => {
      setOfflineKeepalive();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      activityEvents.forEach(ev => document.removeEventListener(ev, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      clearInterval(heartbeatIntervalRef.current);
      clearInactivityTimer();
      // Normal navigation / component unmount — async is fine here
      setOffline();
    };
  }, [user]);

  // ─── Presence writers ───────────────────────────────────────────────────────

  const setOnline = async () => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      await supabase.from('user_presence').upsert(
        { user_id: user.id, is_online: true, last_seen: now, last_activity: now, updated_at: now },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      console.error('usePresence setOnline:', err);
    }
  };

  const setOffline = async () => {
    if (!user) return;
    isOnlineRef.current = false;
    try {
      const now = new Date().toISOString();
      await supabase
        .from('user_presence')
        .update({ is_online: false, last_seen: now, updated_at: now })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('usePresence setOffline:', err);
    }
  };

  /**
   * keepalive fetch — unlike sendBeacon, this carries the Authorization header
   * and survives tab/window close on modern browsers.
   */
  const setOfflineKeepalive = () => {
    if (!user) return;
    isOnlineRef.current = false;

    try {
      const session = supabase.auth.session?.() // supabase-js v1
        ?? null; // will be filled below for v2

      // supabase-js v2: getSession() is async, so we read from localStorage
      // as a synchronous fallback during unload.
      let token = session?.access_token;
      if (!token) {
        // Try to pull the token from localStorage (supabase-js v2 key)
        try {
          const raw = localStorage.getItem(
            `sb-${new URL(supabase.supabaseUrl).hostname.split('.')[0]}-auth-token`
          );
          if (raw) token = JSON.parse(raw)?.access_token;
        } catch { /* ignore */ }
      }

      const url = `${supabase.supabaseUrl}/rest/v1/user_presence?user_id=eq.${user.id}`;
      const now = new Date().toISOString();
      const body = JSON.stringify({ is_online: false, last_seen: now, updated_at: now });

      fetch(url, {
        method: 'PATCH',
        keepalive: true,           // ← survives tab close
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Prefer': 'return=minimal',
        },
        body,
      }).catch(() => { /* swallow — page is already unloading */ });
    } catch (err) {
      console.error('usePresence setOfflineKeepalive:', err);
    }
  };

  const updatePresence = async (isOnline) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      await supabase.from('user_presence').upsert(
        {
          user_id: user.id,
          is_online: isOnline,
          last_seen: now,
          ...(isOnline ? { last_activity: now } : {}),
          updated_at: now,
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      console.error('usePresence updatePresence:', err);
    }
  };

  // ─── Inactivity timer ───────────────────────────────────────────────────────

  const startInactivityTimer = () => {
    clearInactivityTimer();
    activityTimeoutRef.current = setTimeout(() => {
      setOffline();
    }, 90_000); // 90 s of inactivity → offline
  };

  const clearInactivityTimer = () => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  };

  const resetInactivityTimer = () => {
    clearInactivityTimer();
    updatePresence(true);
    startInactivityTimer();
  };

  return { setOnline, setOffline, updateActivity: resetInactivityTimer };
}