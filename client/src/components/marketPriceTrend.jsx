import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  LineChart,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { useMarketPrices } from "../contexts/marketPricesContext";
import { usePriceTrend } from "../hooks/usePriceTrend";

// How long the baseline prices can go without a real admin update before
// the UI flags them as potentially outdated.
const STALE_THRESHOLD_DAYS = 7;

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

// "Last updated: <date>" — reads the timestamp fetched via
// get_last_price_update() (see marketPricesContext.jsx). Returns null when
// there's no history yet so the caller can skip rendering entirely.
function formatLastUpdated(date) {
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Same interaction/visual language as the CustomDropdown in ProductFormModal —
// button + rotating chevron + animated menu with green hover/selected states —
// just sized to fit the compact toolbar here instead of a full form field.
function TrendDropdown({
  value,
  options,
  onSelect,
  isOpen,
  setIsOpen,
  dropdownRef,
  minWidth,
}) {
  const display = (opt) => (opt === "HerbsAndSpices" ? "Herbs & Spices" : opt);

  return (
    <div className={`relative ${minWidth || ""}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 text-sm bg-gray-50 border rounded-lg px-3 py-1.5 text-gray-700 transition-all duration-200 ${
          isOpen
            ? "border-green-500 ring-2 ring-green-200"
            : "border-gray-200 hover:border-green-400"
        }`}
      >
        <span className="truncate">{value ? display(value) : ""}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 origin-top ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="max-h-52 sm:max-h-60 overflow-y-auto py-1">
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-green-50 hover:text-green-700 transition-colors duration-150 ${
                option === value
                  ? "bg-green-100 text-green-700 font-medium"
                  : "text-gray-900"
              }`}
              style={{
                animationDelay: `${index * 20}ms`,
                animation: isOpen ? "slideInDown 200ms ease-out forwards" : "",
              }}
            >
              {display(option)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const MarketPriceTrend = () => {
  const { prices, loading: pricesLoading, lastUpdated } = useMarketPrices();
  const [category, setCategory] = useState(null);
  const [product, setProduct] = useState(null);
  const [rangeDays, setRangeDays] = useState(30);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryRef = useRef(null);
  const productRef = useRef(null);

  // Ticks every 5 min so staleness can flip to "true" on its own while the
  // tab stays open, without needing a refresh or a new price event.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const daysSinceUpdate = useMemo(() => {
    if (!lastUpdated) return null;
    return Math.floor((now - lastUpdated.getTime()) / (24 * 60 * 60 * 1000));
  }, [lastUpdated, now]);

  const isStale =
    daysSinceUpdate !== null && daysSinceUpdate >= STALE_THRESHOLD_DAYS;

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
    if (
      productsInCategory.length > 0 &&
      !productsInCategory.includes(product)
    ) {
      setProduct(productsInCategory[0]);
    }
  }, [productsInCategory, product]);

  // Close the dropdowns when clicking outside of them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
      if (productRef.current && !productRef.current.contains(event.target)) {
        setProductOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // The live, realtime-updated price for whatever product is selected —
  // used only to tell usePriceTrend "the price just changed, refetch".
  const rawLivePrice =
    category && product ? prices?.[category]?.[product] : undefined;
  const livePrice =
    typeof rawLivePrice === "object" ? rawLivePrice?.price : rawLivePrice;

  const { series, loading: trendLoading } = usePriceTrend(
    product,
    rangeDays,
    livePrice,
  );

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
      data-tutorial="market-info"
      className="bg-white/80 backdrop-blur-sm rounded-2xl border mb-8 overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <div className={`px-4 pt-4 sm:px-6 sm:pt-6 bg-white ${isExpanded ? 'pb-4' : 'pb-4 sm:pb-6'} rounded-t-2xl`}>
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-green-700 shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">
                Market Price History
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                {rangeDays}-day price history, based on Department of Agriculture data
              </p>
              {lastUpdated && (
                <p
                  className={`text-[10px] sm:text-xs mt-0.5 flex items-center gap-1 ${
                    isStale ? "text-amber-600 font-medium" : "text-gray-400"
                  }`}
                >
                  {isStale && <AlertTriangle className="w-3 h-3 shrink-0" />}
                  Last updated: {formatLastUpdated(lastUpdated)}
                  {isStale && ` (${daysSinceUpdate}d ago)`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              onClick={() => setIsExpanded((p) => !p)}
              className="w-8 h-8 rounded-xl bg-green-700 hover:bg-green-800 text-white flex items-center justify-center transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white px-4 sm:px-6 pb-4 sm:pb-6"
          >
            {/* Data Freshness disclaimer */}
            {isStale && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold">Data Freshness Notice:</span>{" "}
                  These prices haven't been refreshed in{" "}
                  {daysSinceUpdate} days. Figures shown may not reflect
                  current market rates.
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <TrendDropdown
                value={category}
                options={categories}
                onSelect={(c) => {
                  setCategory(c);
                  setProduct(null);
                }}
                isOpen={categoryOpen}
                setIsOpen={setCategoryOpen}
                dropdownRef={categoryRef}
                minWidth="min-w-[130px]"
              />

              <TrendDropdown
                value={product}
                options={productsInCategory}
                onSelect={setProduct}
                isOpen={productOpen}
                setIsOpen={setProductOpen}
                dropdownRef={productRef}
                minWidth="min-w-[140px]"
              />

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
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MarketPriceTrend;