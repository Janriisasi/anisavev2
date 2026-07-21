import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, LineChart } from "lucide-react";
import { useMarketPrices } from "../contexts/marketPricesContext";
import { usePriceTrend } from "../hooks/usePriceTrend";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs text-gray-500">{point.label}</p>
      <p className="text-sm font-bold text-green-800">
        ₱{point.price?.toFixed(2)}/kg
      </p>
    </div>
  );
}

const MarketPriceTrend = () => {
  const { prices, loading: pricesLoading } = useMarketPrices();
  const [category, setCategory] = useState(null);
  const [product, setProduct] = useState(null);
  const [rangeDays, setRangeDays] = useState(30);

  const categories = useMemo(() => Object.keys(prices || {}), [prices]);
  const productsInCategory = useMemo(
    () => (category ? Object.keys(prices[category] || {}) : []),
    [prices, category],
  );

  // Default to the first category/product once prices load
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  useEffect(() => {
    if (productsInCategory.length > 0 && !productsInCategory.includes(product)) {
      setProduct(productsInCategory[0]);
    }
  }, [productsInCategory, product]);

  // The live, realtime-updated price for whatever product is selected —
  // used only to tell usePriceTrend "the price just changed, refetch".
  const rawLivePrice = category && product ? prices?.[category]?.[product] : undefined;
  const livePrice =
    typeof rawLivePrice === "object" ? rawLivePrice?.price : rawLivePrice;

  const { series, loading: trendLoading } = usePriceTrend(product, rangeDays, livePrice);

  const { currentPrice, percentChange } = useMemo(() => {
    const valid = series.filter((p) => p.price !== null);
    if (valid.length === 0) return { currentPrice: null, percentChange: null };
    const first = valid[0].price;
    const last = valid[valid.length - 1].price;
    const change = first > 0 ? ((last - first) / first) * 100 : 0;
    return { currentPrice: last, percentChange: change };
  }, [series]);

  const isLoading = pricesLoading || trendLoading;
  const trendUp = percentChange !== null && percentChange > 0.05;
  const trendDown = percentChange !== null && percentChange < -0.05;

  if (!pricesLoading && categories.length === 0) return null;

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-sm border mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      {/* Header row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-green-700 shrink-0" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              Market Price History
            </h3>
            <p className="text-xs text-gray-500">
              {rangeDays}-day price history, based on Department of Agriculture data
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category || ""}
            onChange={(e) => {
              setCategory(e.target.value);
              setProduct(null);
            }}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600/40"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "HerbsAndSpices" ? "Herbs & Spices" : c}
              </option>
            ))}
          </select>

          <select
            value={product || ""}
            onChange={(e) => setProduct(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600/40 min-w-[140px]"
          >
            {productsInCategory.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
            {[14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setRangeDays(d)}
                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  rangeDays === d
                    ? "bg-green-800 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current price + change badge */}
      {!isLoading && currentPrice !== null && (
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-800">
            ₱{currentPrice.toFixed(2)}
            <span className="text-sm font-normal text-gray-400">/kg</span>
          </span>
          <span
            className={`flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full ${
              trendUp
                ? "text-green-700 bg-green-50"
                : trendDown
                  ? "text-red-600 bg-red-50"
                  : "text-gray-500 bg-gray-50"
            }`}
          >
            {trendUp && <TrendingUp className="w-3.5 h-3.5" />}
            {trendDown && <TrendingDown className="w-3.5 h-3.5" />}
            {!trendUp && !trendDown && <Minus className="w-3.5 h-3.5" />}
            {percentChange !== null ? `${Math.abs(percentChange).toFixed(1)}%` : "—"}
          </span>
          <span className="text-xs text-gray-400">over last {rangeDays} days</span>
        </div>
      )}

      {/* Chart */}
      <div className="h-56 sm:h-64 -ml-2">
        {isLoading ? (
          <div className="h-full w-full animate-pulse bg-gray-100 rounded-xl" />
        ) : series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            No price history available yet for this product.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#166534" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#166534" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                interval={rangeDays === 30 ? 4 : 1}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickFormatter={(v) => `₱${v}`}
                width={48}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#166534"
                strokeWidth={2}
                fill="url(#priceTrendFill)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default MarketPriceTrend;