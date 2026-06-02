-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: get_trend_data RPC function
--
-- PURPOSE:
--   Moves market trend aggregation from JavaScript into PostgreSQL.
--   Called via supabase.rpc('get_trend_data') in trendService.js.
--
-- BEFORE (JS-side): fetched ALL product rows, then grouped/counted/averaged
--   in JavaScript using forEach + reduce → expensive on mobile/low-memory.
--
-- AFTER (SQL-side): PostgreSQL does GROUP BY + COUNT DISTINCT + SUM + AVG,
--   returns already-aggregated rows → only one small result set travels
--   over the network.
--
-- HOW TO APPLY:
--   Option A — Supabase Dashboard:
--     1. Go to Database → SQL Editor
--     2. Paste this entire file and click Run
--
--   Option B — Supabase CLI:
--     supabase db push
--     (place this file in supabase/migrations/ with a timestamp prefix)
--
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_trend_data()
RETURNS TABLE (
  name          text,
  category      text,
  seller_count  bigint,
  total_qty     numeric,
  avg_price     numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    name,
    category,
    COUNT(DISTINCT user_id)    AS seller_count,
    SUM(quantity_kg)           AS total_qty,
    AVG(price)                 AS avg_price
  FROM public.products
  WHERE status = 'Available'
  GROUP BY name, category
  ORDER BY seller_count DESC;
$$;

-- Grant execute permission to the authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.get_trend_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trend_data() TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES:
--
-- STABLE: tells the planner this function reads but does not modify the DB,
--         enabling better query plan caching.
--
-- SECURITY DEFINER: runs with the privileges of the function owner (postgres),
--                   not the caller. Ensure RLS on `products` is set correctly
--                   if you do NOT want anon users to see aggregated data.
--                   If you want RLS to apply, change to SECURITY INVOKER and
--                   grant SELECT on products to authenticated/anon separately.
--
-- EXPECTED OUTPUT COLUMNS:
--   name          text     Product name (e.g. "Eggplant")
--   category      text     Product category (e.g. "Vegetables")
--   seller_count  bigint   Number of distinct sellers listing this product
--   total_qty     numeric  Sum of all quantity_kg listings
--   avg_price     numeric  Average price across all listings
-- ─────────────────────────────────────────────────────────────────────────────
