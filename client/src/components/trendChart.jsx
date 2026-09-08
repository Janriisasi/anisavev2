import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  Award,
  Layers,
  Crown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { getProductImage } from "../utils/aiConstants";

// ─── Solid Color Level Helper (Green = High, Yellow = Mid, Red = Low) ─────────
const getSolidTier = (pct) => {
  if (pct >= 66) {
    return {
      hex: "#16a34a", // Solid Green
      bgClass: "bg-green-600",
      textClass: "text-green-800",
      badgeClass: "bg-green-100 text-green-900 border-green-300",
      tag: "Mataas",
      indicatorColor: "bg-green-600",
    };
  }
  if (pct >= 35) {
    return {
      hex: "#eab308", // Solid Yellow
      bgClass: "bg-yellow-500",
      textClass: "text-yellow-800",
      badgeClass: "bg-yellow-100 text-yellow-900 border-yellow-300",
      tag: "Katamtaman",
      indicatorColor: "bg-yellow-500",
    };
  }
  return {
    hex: "#dc2626", // Solid Red
    bgClass: "bg-red-600",
    textClass: "text-red-800",
    badgeClass: "bg-red-100 text-red-900 border-red-300",
    tag: "Mababa",
    indicatorColor: "bg-red-600",
  };
};

// ─── Custom Tooltip for Column Graph ──────────────────────────────────────────
const CustomChartTooltip = ({ active, payload, isPrice, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const tier = getSolidTier(data.pct);
    const imgSrc = getProductImage(data.name);

    return (
      <div className="bg-white px-3 py-2 rounded-xl shadow-md border border-gray-200 text-xs flex items-center gap-2.5 z-50">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-200 flex items-center justify-center">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm">🌾</span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-black text-white"
              style={{ backgroundColor: tier.hex }}
            >
              #{data.rank}
            </span>
            <span>{data.name}</span>
          </div>
          <p
            className="font-black text-[13px] mt-0.5"
            style={{ color: tier.hex }}
          >
            {isPrice ? `₱${data.value}/kg` : `${data.value} ${unit || ""}`}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// ─── Main Redesigned TrendChart (Solid Colors: High = Green, Mid = Yellow, Low = Red) ─
export const TrendChart = memo(({ chartData }) => {
  if (!chartData || !chartData.labels || !chartData.values) return null;

  const [viewMode, setViewMode] = useState("cards"); // "cards" | "bars"
  const { title, labels, values, unit, isPrice } = chartData;
  const maxVal = Math.max(...values, 1);

  const formatVal = (v) => {
    if (isPrice) return `₱${v}/kg`;
    if (unit === "piso") return `₱${v}`;
    if (unit === "kg") return `${v} kg`;
    return `${v} ${unit || ""}`;
  };

  // Prepare chart dataset with solid color tiers
  const chartItems = labels.map((label, idx) => {
    const val = values[idx] || 0;
    const pct = (val / maxVal) * 100;
    const tier = getSolidTier(pct);

    return {
      rank: idx + 1,
      name: label,
      shortName: label.length > 9 ? `${label.substring(0, 8)}…` : label,
      value: val,
      pct,
      tier,
    };
  });

  const topItem = chartItems[0];

  return (
    <motion.div
      className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-white"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-emerald-50/70 border-b border-emerald-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-green-700 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <TrendingUp size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] leading-snug sm:text-sm font-bold text-gray-900 tracking-tight line-clamp-2 sm:truncate">
              {title}
            </h4>
            <p className="text-[10px] text-gray-500 font-medium">
              Live market trend data
            </p>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center bg-white p-0.5 rounded-lg border border-gray-200 shadow-2xs self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === "cards"
                ? "bg-green-700 text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Layers size={11} />
            <span>Ranggo</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("bars")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === "bars"
                ? "bg-green-700 text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart2 size={11} />
            <span>Kolum Graph</span>
          </button>
        </div>
      </div>

      {/* ─── Body Content ──────────────────────────────────────── */}
      <div className="p-2.5 sm:p-4">
        {viewMode === "bars" ? (
          /* ─── Option A: Recharts Column Bar Graph ────────────────── */
          <div className="pt-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartItems}
                  margin={{ top: 18, right: 10, left: -15, bottom: 25 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(v) => (isPrice ? `₱${v}` : v)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={
                      <CustomChartTooltip isPrice={isPrice} unit={unit} />
                    }
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                  >
                    {chartItems.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.tier.hex}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* ─── Option B: Modern Ranked Cards with Solid Color Progress Bars ── */
          <div className="space-y-2.5">
            {chartItems.map((item, i) => {
              const imgSrc = getProductImage(item.name);
              const isTop = i === 0;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.25 }}
                  className={`p-2 sm:p-3 rounded-xl border transition-all ${
                    isTop
                      ? "bg-white border-green-300 shadow-xs"
                      : "bg-gray-50/80 border-gray-200/80 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2">
                    {/* Left: Rank Badge + Thumbnail + Name */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                      {/* Rank Indicator */}
                      <div
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-black text-[10px] sm:text-[11px] flex-shrink-0 text-white shadow-2xs"
                        style={{ backgroundColor: item.tier.hex }}
                      >
                        {i === 0 ? (
                          <Crown size={11} className="stroke-[2.5]" />
                        ) : (
                          `#${i + 1}`
                        )}
                      </div>

                      {/* Product Thumbnail */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200 shadow-2xs flex items-center justify-center">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-base">🌱</span>
                        )}
                      </div>

                      {/* Crop Name */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-800 truncate flex items-center gap-1.5">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    {/* Right: Solid Value Pill */}
                    <div className="flex-shrink-0 text-right">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[11px] sm:px-2.5 sm:py-1 sm:text-xs rounded-lg font-black tracking-tight tabular-nums border ${item.tier.badgeClass}`}
                      >
                        {formatVal(item.value)}
                      </span>
                    </div>
                  </div>

                  {/* Solid Color Progress Bar (Green for High, Yellow for Mid, Red for Low) */}
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      className={`h-full rounded-full ${item.tier.bgClass}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(item.pct, 6)}%` }}
                      transition={{
                        delay: 0.1 + i * 0.05,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ─── Legend & Summary Footer ───────────────────────────── */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
          {topItem && (
            <span className="flex items-center gap-1.5 font-medium">
              <Award size={13} className="text-amber-500" />
              <span>
                Nangunguna:{" "}
                <strong className="text-gray-800 font-bold">
                  {topItem.name}
                </strong>{" "}
                ({formatVal(topItem.value)})
              </span>
            </span>
          )}

          {/* Solid Color Level Legend */}
          <div className="flex items-center gap-3 text-[10px] font-semibold text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-600" /> Mataas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> Katamtaman
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" /> Mababa
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

TrendChart.displayName = "TrendChart";