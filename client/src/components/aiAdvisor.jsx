import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Bot,
  Leaf,
  BarChart2,
  TrendingUp,
  Flame,
} from "lucide-react";
import supabase from "../lib/supabase";
import { useMarketPrices } from "../contexts/marketPricesContext";

// ─── Trend Data Fetcher ───────────────────────────────────────────────────────
/**
 * Queries the live `products` table and aggregates per product:
 *   sellerCount  – distinct farmers currently selling it
 *   totalQty     – total kg listed across all sellers
 *   avgPrice     – average asking price from sellers
 */
const fetchTrendData = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("name, category, price, quantity_kg, user_id")
      .eq("status", "Available");

    if (error) throw error;

    const map = {};
    (data || []).forEach(({ name, category, price, quantity_kg, user_id }) => {
      if (!map[name]) {
        map[name] = {
          name,
          category,
          sellerIds: new Set(),
          totalQty: 0,
          prices: [],
        };
      }
      map[name].sellerIds.add(user_id);
      map[name].totalQty += parseFloat(quantity_kg) || 0;
      map[name].prices.push(parseFloat(price) || 0);
    });

    return Object.values(map)
      .map((item) => ({
        name: item.name,
        category: item.category,
        sellerCount: item.sellerIds.size,
        totalQty: parseFloat(item.totalQty.toFixed(1)),
        avgPrice:
          item.prices.length > 0
            ? parseFloat(
                (item.prices.reduce((a, b) => a + b, 0) / item.prices.length).toFixed(2)
              )
            : 0,
      }))
      .sort((a, b) => b.sellerCount - a.sellerCount);
  } catch (err) {
    console.error("Trend fetch error:", err);
    return [];
  }
};

// ─── Context Helpers ──────────────────────────────────────────────────────────
const getMonthContext = () => {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  const wetSeason = [6, 7, 8, 9, 10, 11];
  const currentMonth = now.getMonth() + 1;
  const season = wetSeason.includes(currentMonth)
    ? "Tag-ulan (Habagat)"
    : "Tag-araw (Amihan)";
  return { month, year, season, currentMonth };
};

const buildContext = (myProducts, prices, trendData) => {
  const { month, year, season } = getMonthContext();

  const allCrops = [];
  Object.entries(prices || {}).forEach(([cat, items]) => {
    Object.entries(items).forEach(([name, price]) => {
      allCrops.push({ name, category: cat, price });
    });
  });

  const myProductNames =
    myProducts.map((p) => p.name).join(", ") || "wala pang nakalista";

  const top15 = trendData.slice(0, 15);
  const trendBlock =
    top15.length > 0
      ? `
LIVE MARKET TREND DATA (aktwal na listings ng mga magsasaka sa AniSave ngayon):
${top15
  .map(
    (t, i) =>
      `  ${i + 1}. ${t.name} (${t.category}) — ${t.sellerCount} seller${t.sellerCount !== 1 ? "s" : ""}, ${t.totalQty} kg available, avg farm price ₱${t.avgPrice}/kg`
  )
  .join("\n")}

PALIWANAG:
- "sellers" = bilang ng mga magsasaka na nag-list ng produkto sa platform
- Mas maraming sellers = mas mataas ang supply at demand sa produkto
- Gamitin ang data na ito bilang pangunahing batayan sa mga tanong tungkol sa trends`
      : "\n(Walang live trend data na available ngayon.)";

  return `
Ikaw ay isang AI Farming Advisor ng AniSave para sa mga magsasaka sa Pilipinas.

Kasalukuyang Buwan: ${month} ${year}
Kasalukuyang Season: ${season}
Mga Produkto ng Magsasaka: ${myProductNames}

OPISYAL NA PRESYO NG MGA PRODUKTO (₱/kg mula sa DA):
${allCrops.map((c) => `  • ${c.name} (${c.category}): ₱${c.price}`).join("\n")}
${trendBlock}

MAHALAGANG PATAKARAN:
- Sumagot LAGING sa wikang Tagalog.
- Gamitin PALAGI ang Live Market Trend Data kapag nagtanong tungkol sa pinakamabenta o pinaka-popular.
- Maging MAIKLI at TUWID sa punto — walang mahabang paliwanag.
- Gumamit ng bullet points at emojis para madaling basahin.
- Maximum 180 salita lang ang sagot (hindi kasama ang chart data).

CHART INSTRUCTIONS:
Kapag ang sagot ay may ranking o comparison (hal. pinakamabenta, pinaka-profitable, pinakamabuting itanim), DAPAT mag-include ng chart sa DULO ng sagot.

Format ng chart (JSON lang, wala nang ibang text pagkatapos):
<<<CHART>>>
{"type":"hbar","title":"Pamagat ng Chart","labels":["Item1","Item2","Item3"],"values":[10,8,5],"unit":"sellers","color":"green"}
<<<END_CHART>>>

Pwedeng gamitin na color: "green", "blue", "amber", "purple"
Pwedeng gamitin na unit: "sellers", "kg", "piso"
`.trim();
};

// ─── Chart JSON parser ────────────────────────────────────────────────────────
const parseAIResponse = (raw) => {
  const chartMatch = raw.match(/<<<CHART>>>([\s\S]*?)<<<END_CHART>>>/);
  const text = raw.replace(/<<<CHART>>>[\s\S]*?<<<END_CHART>>>/, "").trim();
  let chartData = null;
  if (chartMatch) {
    try {
      chartData = JSON.parse(chartMatch[1].trim());
    } catch {
      chartData = null;
    }
  }
  return { text, chartData };
};

// ─── Quick Prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { key: "plant", emoji: "🌱", label: "Pinakamabuting Itanim Ngayon" },
  { key: "price", emoji: "📈", label: "Presyo sa Susunod na Linggo" },
  { key: "sell",  emoji: "💰", label: "Pinakamabentang Produkto" },
  { key: "tips",  emoji: "💡", label: "Mga Tips sa Pagsasaka" },
];

const getQuickPromptText = (key, { month, season }) =>
  ({
    plant: `Buwan ng ${month}, ${season}. Base sa live trend data at presyo, aling 5 pananim ang pinaka-magandang itanim NGAYON? Ibigay ang: pangalan, araw bago anihin, at presyo. Gumawa ng chart gamit ang quantity available bilang value. Sagot sa Tagalog, maikli lang.`,
    price: `Base sa seasonal trends ng Pilipinas ngayong ${month} at sa live data, aling 5 produkto ang malamang na TATAAS ang presyo sa susunod na 1-2 linggo? Ibigay ang dahilan at gumawa ng chart. Sagot sa Tagalog, maikli lang.`,
    sell:  `Base sa LIVE MARKET TREND DATA, aling 5 produkto ang PINAKAMABENTA at PINAKA-IN-DEMAND sa AniSave NGAYON? Gamitin ang seller count bilang pangunahing batayan. I-rank at gumawa ng chart ng seller count. Sagot sa Tagalog, maikli lang.`,
    tips:  `Bigyan mo ako ng 5 praktikal na tips sa pagsasaka ngayong ${month} sa Pilipinas. Kasama na ang panahon, mga peste, lupa, at tamang oras ng pagbebenta. Sagot sa Tagalog, maikli lang.`,
  }[key]);

// ─── Loading Messages ─────────────────────────────────────────────────────────
const LOADING_MESSAGES = {
  plant: [
    "🌾 Tinitignan ang kasalukuyang season...",
    "📊 Sinusuri ang live market data...",
    "🗓️ Hinahanap ang pinakamabuting pananim...",
    "✅ Halos tapos na ang pagsusuri...",
  ],
  price: [
    "📡 Kinukuha ang pinakabagong datos ng presyo...",
    "📈 Sinusuri ang market trends...",
    "🔍 Hinahanap ang mga pagbabago sa presyo...",
    "✅ Halos handa na ang ulat...",
  ],
  sell: [
    "💹 Kinukuha ang live seller data...",
    "🛒 Binibilang ang sellers per produkto...",
    "🏆 Inire-rank ang pinaka-in-demand...",
    "📊 Ginagawa ang chart...",
  ],
  tips: [
    "🌤️ Tinitingnan ang kondisyon ng panahon...",
    "🐛 Sinusuri ang mga posibleng peste...",
    "🌱 Hinahanap ang pinakamahusay na paraan...",
    "✅ Inihahanda ang mga rekomendasyon...",
  ],
};
const DEFAULT_LOADING = [
  "⚙️ Sinisimulan ang pagsusuri...",
  "📦 Kinukuha ang impormasyon...",
  "🤔 Pinag-aaralan ang iyong tanong...",
  "✅ Halos tapos na...",
];

// ─── Slideshow Loader ─────────────────────────────────────────────────────────
const SlideshowLoader = ({ promptKey }) => {
  const messages = LOADING_MESSAGES[promptKey] || DEFAULT_LOADING;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((p) => (p + 1) % messages.length), 1800);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className="flex items-start gap-3 px-4 pb-4">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-green-700 text-white shadow-sm mt-0.5">
        <Bot size={15} />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex-1 min-h-[44px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="text-sm text-gray-600 font-medium"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Animated Horizontal Bar Chart ───────────────────────────────────────────
const CHART_COLORS = {
  green:  { bar: "#16a34a", bg: "#f0fdf4", header: "#dcfce7", text: "#15803d", track: "#bbf7d0" },
  blue:   { bar: "#2563eb", bg: "#eff6ff", header: "#dbeafe", text: "#1d4ed8", track: "#bfdbfe" },
  amber:  { bar: "#d97706", bg: "#fffbeb", header: "#fef3c7", text: "#b45309", track: "#fde68a" },
  purple: { bar: "#7c3aed", bg: "#faf5ff", header: "#ede9fe", text: "#6d28d9", track: "#e9d5ff" },
};
const MEDALS = ["🥇", "🥈", "🥉"];

const TrendChart = ({ chartData }) => {
  if (!chartData) return null;
  const { title, labels, values, unit, color = "green" } = chartData;
  const c = CHART_COLORS[color] || CHART_COLORS.green;
  const maxVal = Math.max(...values, 1);

  const formatVal = (v) => {
    if (unit === "piso") return `₱${v}`;
    if (unit === "kg")   return `${v} kg`;
    return `${v} ${unit}`;
  };

  return (
    <motion.div
      className="mt-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
      style={{ background: c.bg }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: c.header }}>
        <BarChart2 size={13} style={{ color: c.text }} />
        <span className="text-xs font-semibold" style={{ color: c.text }}>
          {title}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {labels.map((label, i) => {
          const pct = (values[i] / maxVal) * 100;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="text-sm">{MEDALS[i] ?? `#${i + 1}`}</span>
                  {label}
                </span>
                <span className="text-xs font-bold tabular-nums" style={{ color: c.text }}>
                  {formatVal(values[i])}
                </span>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 10, background: c.track }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: c.bar, opacity: i === 0 ? 1 : 0.75 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 3)}%` }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.55, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─── Trending Ticker shown when idle ─────────────────────────────────────────
const TrendingTicker = ({ trendData }) => {
  if (!trendData.length) return null;
  const top3 = trendData.slice(0, 3);
  return (
    <motion.div
      className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Flame size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">
          Trending sa Platform Ngayon
        </p>
        <p className="text-xs text-amber-800">
          {top3.map((t, i) => (
            <span key={t.name}>
              {MEDALS[i]} <strong>{t.name}</strong> ({t.sellerCount} sellers)
              {i < top3.length - 1 ? "  ·  " : ""}
            </span>
          ))}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Markdown Renderer ────────────────────────────────────────────────────────
const MarkdownText = ({ text }) => {
  const renderInline = (str) =>
    str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={j}>{part.slice(1, -1)}</em>;
      return part;
    });

  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const numMatch = line.match(/^(\d+\.\s+)(.*)/);
        if (numMatch)
          return (
            <div key={i} className="flex gap-2">
              <span className="font-semibold text-green-700 flex-shrink-0">{numMatch[1]}</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        const bulletMatch = line.match(/^[-*•]\s+(.*)/);
        if (bulletMatch)
          return (
            <div key={i} className="flex gap-2">
              <span className="text-green-600 flex-shrink-0 mt-0.5">•</span>
              <span>{renderInline(bulletMatch[1])}</span>
            </div>
          );
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AiAdvisor = ({ myProducts = [] }) => {
  const [response, setResponse]     = useState(null);
  const [chartData, setChartData]   = useState(null);
  const [activeKey, setActiveKey]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [trendData, setTrendData]   = useState([]);
  const [trendReady, setTrendReady] = useState(false);

  const advisorRef = useRef(null);
  const { month, season } = getMonthContext();
  const { prices } = useMarketPrices();

  // Load live trend data once on mount
  useEffect(() => {
    fetchTrendData().then((data) => {
      setTrendData(data);
      setTrendReady(true);
    });
  }, []);

  const callAI = async (key) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setChartData(null);
    setActiveKey(key);

    setTimeout(() => {
      advisorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    try {
      const systemContext = buildContext(myProducts, prices, trendData);
      const userText = getQuickPromptText(key, { month, season });

      const { data, error: funcError } = await supabase.functions.invoke("chat-advisor", {
        body: { systemContext, userText },
      });

      if (funcError) throw funcError;

      const raw =
        data?.choices?.[0]?.message?.content?.trim() ||
        "Pasensya na, hindi makasagot ngayon. Subukang muli.";

      const { text, chartData: parsed } = parseAIResponse(raw);
      setResponse(text);
      setChartData(parsed);
    } catch (err) {
      console.error("AI error:", err);
      setError(`May error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (loading) return;
    setResponse(null);
    setChartData(null);
    setActiveKey(null);
    setError(null);
  };

  const activePrompt = QUICK_PROMPTS.find((p) => p.key === activeKey);

  return (
    <motion.div
      ref={advisorRef}
      className="mb-10 rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-white"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      {/* ── Header ── */}
      <div className="bg-green-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">
                AI Farming Advisor
              </h3>
              <p className="text-green-200 text-xs mt-0.5 flex items-center gap-1.5">
                {month} · {season}
                {trendReady && trendData.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[9px] font-semibold">
                    <TrendingUp size={8} /> Live Trends
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefresh}
              disabled={loading}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
              title="I-reset"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </motion.button>
            <motion.button
              onClick={() => setIsExpanded((p) => !p)}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50"
          >
            <div className="pt-4">
              <AnimatePresence mode="wait">

                {/* Loading */}
                {loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SlideshowLoader promptKey={activeKey} />
                  </motion.div>
                )}

                {/* Response */}
                {!loading && (response || error) && (
                  <motion.div
                    key="response"
                    className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activePrompt && !error && (
                      <div className="bg-green-700 px-4 py-2 flex items-center gap-2">
                        <span className="text-base">{activePrompt.emoji}</span>
                        <span className="text-white text-xs font-semibold">
                          {activePrompt.label}
                        </span>
                        {chartData && (
                          <span className="ml-auto flex items-center gap-1 bg-white/20 text-white text-[9px] font-semibold rounded-full px-2 py-0.5">
                            <BarChart2 size={9} /> May chart
                          </span>
                        )}
                      </div>
                    )}

                    {error ? (
                      <div className="bg-red-50 p-4 flex items-start gap-2 text-sm text-red-600">
                        <X size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-800 leading-relaxed">
                        <MarkdownText text={response} />
                        {chartData && <TrendChart chartData={chartData} />}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Idle */}
                {!loading && !response && !error && (
                  <motion.div
                    key="idle"
                    className="pb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {trendReady && <TrendingTicker trendData={trendData} />}
                    <div className="px-4 text-center">
                      <div className="flex items-center justify-center gap-2 py-4">
                        <Sparkles size={14} className="text-gray-300" />
                        <p className="text-gray-400 text-xs">
                          Piliin ang kategorya at alamin ang mga rekomendasyon at
                          tips para mas gumanda ang ani mo!
                        </p>
                        <Sparkles size={14} className="text-gray-300" />
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* 4 Prompt Buttons */}
            <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
              {QUICK_PROMPTS.map((qp, i) => (
                <motion.button
                  key={qp.key}
                  onClick={() => callAI(qp.key)}
                  disabled={loading}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`
                    relative overflow-hidden
                    bg-white border rounded-2xl p-3.5
                    flex flex-col items-center gap-1.5 shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    hover:shadow-md hover:border-green-300 hover:-translate-y-0.5
                    ${activeKey === qp.key && !loading
                      ? "border-green-600 ring-2 ring-green-200 shadow-md"
                      : "border-gray-200"}
                  `}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                >
                  {activeKey === qp.key && !loading && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-600" />
                  )}
                  <span className="text-xl">{qp.emoji}</span>
                  <span className="text-[11px] font-semibold text-center leading-tight text-gray-700">
                    {qp.label}
                  </span>
                </motion.button>
              ))}
            </div>

            <p className="text-center text-[10px] text-gray-400 pb-3 px-4">
              Ito ay advice o gabay lamang. Kung maari ay kumonsulta sa inyong
              lokal na agricultural officer.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AiAdvisor;