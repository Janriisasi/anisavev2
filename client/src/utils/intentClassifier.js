// ─── Intent Keyword Sets ──────────────────────────────────────────────────────
const MARKET_KEYWORDS = [
  "demand", "trend", "trending", "mabenta", "popular", "suply", "supply",
  "pinaka-popular", "pinakamabenta", "in-demand", "market", "palengke",
  "pinaka-mabenta", "pinaka-in-demand", "best seller", "bestseller",
  "hot", "sikat", "maraming nagbibili",
];

const BUYER_KEYWORDS = [
  "buyer", "buyers", "mamimili", "bumibili", "customer", "customers",
  "sino ang", "top buyer", "pinaka-aktibo", "nagbibili", "sinong bumibili",
  "sino bumibili", "nag-oorder", "order count",
];

const PRODUCT_KEYWORDS = [
  "produkto", "inventory", "itanim", "itanin", "ani", "presyo", "price",
  "magkano", "halaga", "ibenta", "benta", "crop", "pananim", "prices",
  "selling", "gaano", "worth", "listed", "nakalista", "ibebenta",
  "ano ang presyo", "gaano kaganda",
];

// ─── Intent Classifier ────────────────────────────────────────────────────────
/**
 * Classifies user chat input into one of four intent categories.
 * Uses keyword matching only — no external libraries, runs synchronously.
 *
 * Priority order: MARKET > BUYER > PRODUCT > GENERAL_FARMING
 *
 * @param {string} text - Raw user message
 * @returns {'MARKET_ANALYSIS' | 'BUYER_ANALYSIS' | 'PRODUCT_ANALYSIS' | 'GENERAL_FARMING'}
 */
export function classifyIntent(text) {
  const lower = text.toLowerCase();

  if (MARKET_KEYWORDS.some((kw) => lower.includes(kw))) return "MARKET_ANALYSIS";
  if (BUYER_KEYWORDS.some((kw) => lower.includes(kw))) return "BUYER_ANALYSIS";
  if (PRODUCT_KEYWORDS.some((kw) => lower.includes(kw))) return "PRODUCT_ANALYSIS";

  return "GENERAL_FARMING";
}

// ─── Quick Prompt Data Needs ──────────────────────────────────────────────────
/**
 * Declares which Supabase data sources each quick-prompt key requires.
 * Used by useAIAdvisor to lazy-fetch only what's needed before calling AI.
 *
 * - 'trend'  → fetchTrendData() (Supabase RPC)
 * - 'prices' → from marketPricesContext (already in memory)
 * - 'buyers' → fetchTopBuyers()
 */
export const QUICK_PROMPT_NEEDS = {
  plant: ["trend", "prices"],
  price: ["trend", "prices"],
  sell:  ["trend"],
  tips:  [],           // no extra data — base prompt + season is enough
};
