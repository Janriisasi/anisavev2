const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in ms
// v2: bumped prefix so stale pre-fix cache entries (missing the ₱/kg unit
// on price charts) are treated as a miss instead of being served for up to
// 6 more hours after this fix ships.
const KEY_PREFIX = "ai_cache_v2_";
const QUICK_KEYS = ["plant", "price", "sell", "tips"];

// ─── Read ─────────────────────────────────────────────────────────────────────
/**
 * Returns a cached AI response if it exists and has not expired.
 * Returns null on cache miss, expiry, or any storage error.
 *
 * @param {string} key - Quick-prompt key (plant | price | sell | tips)
 * @returns {{ text: string, chartData: object|null } | null}
 */
export function getCachedResponse(key) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;

    const { data, expiry } = JSON.parse(raw);

    if (Date.now() > expiry) {
      localStorage.removeItem(KEY_PREFIX + key);
      return null;
    }

    return data;
  } catch {
    // Corrupt entry or SSR environment — treat as miss
    return null;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────
/**
 * Persists an AI response to localStorage with a 6-hour TTL.
 * Fails silently when localStorage is unavailable (private browsing, quota exceeded).
 *
 * @param {string} key
 * @param {{ text: string, chartData: object|null }} data
 */
export function setCachedResponse(key, data) {
  try {
    localStorage.setItem(
      KEY_PREFIX + key,
      JSON.stringify({ data, expiry: Date.now() + CACHE_TTL }),
    );
  } catch {
    // Storage full or unavailable — skip caching, do not throw
  }
}

// ─── Clear ────────────────────────────────────────────────────────────────────
/**
 * Removes all AI quick-prompt cache entries.
 * Called by the refresh button so stale data isn't served after a reset.
 */
export function clearCache() {
  QUICK_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(KEY_PREFIX + key);
    } catch {
      // ignore
    }
  });
}