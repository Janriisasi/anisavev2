import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

/**
 * Turns sparse price-change events into a continuous daily series by
 * carrying the last known price forward across days with no change.
 *
 * events: [{ price, recorded_at }] — anchor point (if any) + changes in range
 * days:   window size (14 or 30)
 */
function buildDailySeries(events, days) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const sorted = [...events]
    .filter((e) => e.price !== null && e.price !== undefined)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  const series = [];
  let eventIndex = 0;
  let currentPrice = sorted.length ? Number(sorted[0].price) : null;

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - i);

    // Cutoff is the END of each past day (23:59:59.999) so any change that
    // happened later in that day is picked up — except for today, where the
    // cutoff is "right now". Using midnight as today's cutoff was the bug:
    // it excluded every price change that happened after 12:00 AM today.
    const isToday = i === 0;
    const cutoff = isToday
      ? now
      : new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    while (
      eventIndex < sorted.length &&
      new Date(sorted[eventIndex].recorded_at) <= cutoff
    ) {
      currentPrice = Number(sorted[eventIndex].price);
      eventIndex++;
    }

    series.push({
      date: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: currentPrice,
    });
  }

  return series;
}

/**
 * Fetches and forward-fills the price history for a single product.
 *
 * @param {string|null} productName - exact `name` value from market_prices
 * @param {number} days - 14 or 30
 * @param {string|number} [refreshKey] - pass the product's live current price
 *   here (from useMarketPrices()). market_prices already has a realtime
 *   subscription, so when the admin updates a price, this value changes and
 *   re-triggers the fetch below — without it, the chart would only ever
 *   reflect whatever was true the moment the product was first selected.
 */
export function usePriceTrend(productName, days = 30, refreshKey) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productName) {
      setSeries([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .rpc("get_price_trend", { p_name: productName, p_days: days })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Error fetching price trend:", error.message);
          setError(error.message);
          setSeries([]);
        } else {
          setSeries(buildDailySeries(data || [], days));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productName, days, refreshKey]);

  return { series, loading, error };
}