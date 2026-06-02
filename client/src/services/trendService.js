import supabase from "../lib/supabase";

// ─── In-memory cache + in-flight deduplication guards ────────────────────────
// These live at module scope so they persist across re-renders and prevent
// duplicate Supabase requests when multiple callers ask for the same data.
let trendCache = null;
let buyerCache = null;
let trendPromise = null;
let buyerPromise = null;

// ─── Trend Data (via Supabase RPC) ───────────────────────────────────────────
/**
 * Fetches aggregated market trend data via the `get_trend_data` Supabase RPC.
 *
 * Aggregation (GROUP BY name/category, COUNT DISTINCT sellers, SUM qty, AVG price)
 * runs in PostgreSQL — not in JavaScript — which is faster and cheaper on
 * mobile/low-memory devices (Tauri Android).
 *
 * Results are cached in memory for the component lifetime.
 * Concurrent calls before the first response share a single in-flight promise.
 *
 * Requires the `get_trend_data` RPC function to be deployed:
 *   see supabase/migrations/get_trend_data_rpc.sql
 *
 * @returns {Promise<Array<{name, category, sellerCount, totalQty, avgPrice}>>}
 */
export async function fetchTrendData() {
  if (trendCache) return trendCache;
  if (trendPromise) return trendPromise;

  trendPromise = supabase
    .rpc("get_trend_data")
    .then(({ data, error }) => {
      if (error) throw error;
      trendCache = (data || []).map((row) => ({
        name: row.name,
        category: row.category,
        sellerCount: Number(row.seller_count),
        totalQty: parseFloat(parseFloat(row.total_qty).toFixed(1)),
        avgPrice: parseFloat(parseFloat(row.avg_price).toFixed(2)),
      }));
      trendPromise = null;
      return trendCache;
    })
    .catch((err) => {
      console.error("Trend fetch error:", err);
      trendPromise = null;
      return [];
    });

  return trendPromise;
}

// ─── Top Buyers ───────────────────────────────────────────────────────────────
/**
 * Fetches the top 3 buyers by approved order count.
 *
 * Results are cached in memory for the component lifetime.
 * Concurrent calls share a single in-flight promise.
 *
 * @returns {Promise<Array<{id, name, orderCount}>>}
 */
export async function fetchTopBuyers() {
  if (buyerCache) return buyerCache;
  if (buyerPromise) return buyerPromise;

  buyerPromise = supabase
    .from("orders")
    .select("buyer_id, profiles!orders_buyer_id_fkey(full_name, username)")
    .eq("status", "approved")
    .then(({ data, error }) => {
      if (error) throw error;

      const map = {};
      (data || []).forEach(({ buyer_id, profiles: prof }) => {
        if (!map[buyer_id]) {
          map[buyer_id] = {
            id: buyer_id,
            name: prof?.full_name || prof?.username || "Unknown Buyer",
            orderCount: 0,
          };
        }
        map[buyer_id].orderCount++;
      });

      buyerCache = Object.values(map)
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 3);

      buyerPromise = null;
      return buyerCache;
    })
    .catch((err) => {
      console.error("Buyer fetch error:", err);
      buyerPromise = null;
      return [];
    });

  return buyerPromise;
}

// ─── Cache Reset ──────────────────────────────────────────────────────────────
/**
 * Clears in-memory caches. Useful for testing or forcing a fresh fetch
 * after a manual refresh.
 */
export function clearTrendCache() {
  trendCache = null;
  buyerCache = null;
}
