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
  Send,
  User,
  ShoppingBag,
  Star,
} from "lucide-react";
import supabase from "../lib/supabase";
import { useMarketPrices } from "../contexts/marketPricesContext";

// ─── Trend Data Fetcher ───────────────────────────────────────────────────────
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

// ─── Fetch top buyers (by approved orders count) ─────────────────────────────
const fetchTopBuyers = async () => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("buyer_id, profiles!orders_buyer_id_fkey(full_name, username)")
      .eq("status", "approved");

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

    return Object.values(map)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 3);
  } catch (err) {
    console.error("Buyer fetch error:", err);
    return [];
  }
};

// ─── Fetch current user profile ───────────────────────────────────────────────
const fetchUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Profile fetch error:", err);
    return null;
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

const buildContext = (myProducts, prices, trendData, topBuyers, userName) => {
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

  const buyerBlock =
    topBuyers.length > 0
      ? `
TOP BUYERS SA PLATFORM (base sa bilang ng approved orders):
${topBuyers.map((b, i) => `  ${i + 1}. ${b.name} — ${b.orderCount} approved order${b.orderCount !== 1 ? "s" : ""}`).join("\n")}`
      : "\n(Walang buyer data na available.)";

  const hasProducts = myProducts.length > 0;
  const sellingStatus = hasProducts
    ? `Ang magsasaka ay may ${myProducts.length} produkto na nakalista: ${myProductNames}`
    : "Ang magsasaka ay WALA pang nakalista na produkto sa platform.";

  const greeting = userName
    ? `Ang pangalan ng gumagamit ay ${userName}.`
    : "";

  return `
Ikaw ay isang AI Farming Advisor ng AniSave para sa mga magsasaka sa Pilipinas.
${greeting}

Kasalukuyang Buwan: ${month} ${year}
Kasalukuyang Season: ${season}
${sellingStatus}

OPISYAL NA PRESYO NG MGA PRODUKTO (₱/kg mula sa DA):
${allCrops.map((c) => `  • ${c.name} (${c.category}): ₱${c.price}`).join("\n")}
${trendBlock}
${buyerBlock}

MAHALAGANG PATAKARAN:
- Sumagot LAGING sa wikang Tagalog.
- Gamitin PALAGI ang Live Market Trend Data kapag nagtanong tungkol sa pinakamabenta o pinaka-popular.
- Maging MAIKLI at TUWID sa punto — walang mahabang paliwanag.
- Gumamit ng bullet points at emojis para madaling basahin.
- Maximum 180 salita lang ang sagot (hindi kasama ang chart data).
- TANGGIHAN ang mga tanong na HINDI tungkol sa pagsasaka, agrikultura, pagbebenta ng produktong pang-bukid, o ekonomiya ng magsasaka. Kung ang tanong ay hindi agrikultural (hal. programming, showbiz, sports, general trivia), sumagot ng: "Paumanhin! Ako ay isang AI Farming Advisor lamang. Narito ako para sagutin ang mga tanong tungkol sa pagsasaka, presyo ng produkto, at agrikultura. Para sa ibang paksa, mangyaring gumamit ng ibang AI assistant. 🌾"
- Kung ang magsasaka ay WALA pang nakalista na produkto, himukin silang maglista na.
- Kung may top buyers, banggitin sila kapag may tanong tungkol sa pagbebenta.

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
  chat: [
    "🤔 Pinag-aaralan ang iyong tanong...",
    "📦 Kinukuha ang impormasyon...",
    "🌿 Hinahanap ang pinakamahusay na sagot...",
    "✅ Halos tapos na...",
  ],
};
const DEFAULT_LOADING = [
  "⚙️ Sinisimulan ang pagsusuri...",
  "📦 Kinukuha ang impormasyon...",
  "🤔 Pinag-aaralan ang iyong tanong...",
  "✅ Halos tapos na...",
];

// ─── Greeting Helpers ─────────────────────────────────────────────────────────
const getGreeting = (userName, myProducts) => {
  const firstName = userName ? userName.split(" ")[0] : null;
  const hour = new Date().getHours();
  const timeGreet =
    hour < 12 ? "Magandang umaga" : hour < 18 ? "Magandang hapon" : "Magandang gabi";

  const greetings = firstName
    ? [
        `${timeGreet}, ${firstName}! 🌾 Kumusta ang inyong taniman ngayon?`,
        `Hoy ${firstName}! 🌱 Mayroon bang bago sa bukid?`,
        `${firstName}, ${timeGreet}! 💰 Handa ka na bang kumita ngayon?`,
        `${timeGreet}, ${firstName}! 🌿 Anong balita sa inyong produkto?`,
      ]
    : [
        `${timeGreet}, Magsasaka! 🌾 Kumusta ang taniman?`,
        `Handa ka na bang kumita ngayon? 💰`,
      ];

  const tips =
    myProducts.length === 0
      ? [
          `💡 Tip: Wala ka pang nakalista na produkto! Subukang mag-list ng iyong mga ani para makita ng mga buyer.`,
          `🛒 Mayroon bang pananim na handa nang ibenta? I-list na ngayon sa AniSave!`,
        ]
      : [
          `📊 Tingnan ang live market trends para malaman kung kailan pinakamainam na magbenta.`,
          `💡 Ang ${myProducts[0]?.name || "iyong produkto"} ay maaaring mas magandang ibenta ngayon!`,
        ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const tip = tips[Math.floor(Math.random() * tips.length)];

  return { greeting, tip };
};

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

// ─── Enhanced Trending Ticker ─────────────────────────────────────────────────
const TrendingSection = ({ trendData, topBuyers, myProducts, userName }) => {
  const firstName = userName ? userName.split(" ")[0] : null;
  const top3 = trendData.slice(0, 3);
  const hasProducts = myProducts.length > 0;

  return (
    <div className="mx-4 mb-3 space-y-2">
      {/* Hot products ticker */}
      {top3.length > 0 && (
        <motion.div
          className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center flex-shrink-0">
            <Flame size={14} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
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
      )}

      {/* Sell nudge if no products */}
      {!hasProducts && (
        <motion.div
          className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-8 h-8 rounded-xl bg-green-200/60 flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={14} className="text-green-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-0.5">
              Simulan na ang Pagbebenta!
            </p>
            <p className="text-xs text-green-800">
              {firstName ? `${firstName}, mag` : "Mag"}-list na ng iyong produkto at kumita ngayon! 🌾{" "}
              {top3.length > 0 && (
                <span>
                  Mataas ang demand sa <strong>{top3[0].name}</strong> ngayon.
                </span>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Top buyers */}
      {topBuyers.length > 0 && (
        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-200/60 flex items-center justify-center flex-shrink-0">
            <Star size={14} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-0.5">
              Pinaka-Active na Buyers
            </p>
            <p className="text-xs text-blue-800">
              {topBuyers.map((b, i) => (
                <span key={b.id}>
                  {MEDALS[i] ?? `#${i + 1}`} <strong>{b.name}</strong> ({b.orderCount} orders)
                  {i < topBuyers.length - 1 ? "  ·  " : ""}
                </span>
              ))}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Greeting Banner ──────────────────────────────────────────────────────────
const GreetingBanner = ({ userName, myProducts }) => {
  const [greetData] = useState(() => getGreeting(userName, myProducts));

  return (
    <motion.div
      className="mx-4 mb-3 bg-gradient-to-r from-green-700 to-green-600 rounded-xl px-4 py-3"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-white" />
        </div>
        <div>
          <p className="text-white text-xs font-semibold leading-snug">{greetData.greeting}</p>
          <p className="text-green-200 text-[11px] mt-1 leading-snug">{greetData.tip}</p>
        </div>
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

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
const ChatBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <motion.div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-green-700 text-white mb-0.5">
          <Bot size={13} />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
          isUser
            ? "bg-green-700 text-white rounded-br-sm"
            : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <span>{msg.content}</span>
        ) : (
          <>
            <MarkdownText text={msg.content} />
            {msg.chartData && <TrendChart chartData={msg.chartData} />}
          </>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200 text-gray-600 mb-0.5">
          <User size={13} />
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AiAdvisor = ({ myProducts = [] }) => {
  const [response, setResponse]       = useState(null);
  const [chartData, setChartData]     = useState(null);
  const [activeKey, setActiveKey]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [isExpanded, setIsExpanded]   = useState(true);
  const [trendData, setTrendData]     = useState([]);
  const [trendReady, setTrendReady]   = useState(false);
  const [topBuyers, setTopBuyers]     = useState([]);
  const [userName, setUserName]       = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // { role, content, chartData? }
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat]       = useState(false);

  const advisorRef  = useRef(null);
  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);
  const { month, season } = getMonthContext();
  const { prices } = useMarketPrices();

  // Load data on mount
  useEffect(() => {
    fetchTrendData().then((data) => {
      setTrendData(data);
      setTrendReady(true);
    });
    fetchTopBuyers().then(setTopBuyers);
    fetchUserProfile().then((profile) => {
      if (profile) {
        setUserName(profile.full_name || profile.username || null);
      }
    });
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, chatLoading, showChat]);

  // ── Quick prompt call ──────────────────────────────────────────────────────
  const callAI = async (key) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setChartData(null);
    setActiveKey(key);
    setShowChat(false);

    setTimeout(() => {
      advisorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    try {
      const systemContext = buildContext(myProducts, prices, trendData, topBuyers, userName);
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

  // ── Free chat send ─────────────────────────────────────────────────────────
  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    // Keep last 4 exchanges (8 messages) + new one = max 5 pairs
    const MAX_HISTORY = 8;
    const trimmedHistory = chatHistory.slice(-MAX_HISTORY);

    const newHistory = [
      ...trimmedHistory,
      { role: "user", content: text },
    ];

    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);
    setShowChat(true);
    setResponse(null);
    setChartData(null);
    setActiveKey(null);
    setError(null);

    try {
      const systemContext = buildContext(myProducts, prices, trendData, topBuyers, userName);

      // Build messages array for the API (only role + content)
      const messages = newHistory.map(({ role, content }) => ({ role, content }));

      const { data, error: funcError } = await supabase.functions.invoke("chat-advisor", {
        body: { systemContext, messages },
      });

      if (funcError) throw funcError;

      const raw =
        data?.choices?.[0]?.message?.content?.trim() ||
        "Pasensya na, hindi makasagot ngayon. Subukang muli.";

      const { text: aiText, chartData: parsed } = parseAIResponse(raw);

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: aiText, chartData: parsed || null },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ May error: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const handleRefresh = () => {
    if (loading || chatLoading) return;
    setResponse(null);
    setChartData(null);
    setActiveKey(null);
    setError(null);
    setChatHistory([]);
    setShowChat(false);
    setChatInput("");
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
              disabled={loading || chatLoading}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: (loading || chatLoading) ? 1 : 1.05 }}
              whileTap={{ scale: (loading || chatLoading) ? 1 : 0.95 }}
              title="I-reset"
            >
              <RefreshCw size={14} className={(loading || chatLoading) ? "animate-spin" : ""} />
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

                {/* Loading (quick prompt) */}
                {loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SlideshowLoader promptKey={activeKey} />
                  </motion.div>
                )}

                {/* Quick Prompt Response */}
                {!loading && !showChat && (response || error) && (
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

                {/* Chat Thread */}
                {showChat && (
                  <motion.div
                    key="chat"
                    className="mx-4 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Messages */}
                    <div className="px-3 py-3 space-y-3 max-h-72 overflow-y-auto">
                      {chatHistory.map((msg, i) => (
                        <ChatBubble key={i} msg={msg} />
                      ))}
                      {chatLoading && (
                        <SlideshowLoader promptKey="chat" />
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </motion.div>
                )}

                {/* Idle */}
                {!loading && !response && !error && !showChat && (
                  <motion.div
                    key="idle"
                    className="pb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Greeting banner */}
                    <GreetingBanner userName={userName} myProducts={myProducts} />

                    {/* Trending section */}
                    {trendReady && (
                      <TrendingSection
                        trendData={trendData}
                        topBuyers={topBuyers}
                        myProducts={myProducts}
                        userName={userName}
                      />
                    )}

                    <div className="px-4 text-center">
                      <div className="flex items-center justify-center gap-2 py-3">
                        <Sparkles size={14} className="text-gray-300" />
                        <p className="text-gray-400 text-xs">
                          Piliin ang kategorya o mag-type ng tanong sa ibaba!
                        </p>
                        <Sparkles size={14} className="text-gray-300" />
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* 4 Quick Prompt Buttons — hidden once a chat conversation starts */}
            <AnimatePresence>
            {!showChat && (
            <motion.div
              key="quick-prompts"
              className="grid grid-cols-2 gap-2.5 px-4 pb-3"
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
              transition={{ duration: 0.25 }}
            >
              {QUICK_PROMPTS.map((qp, i) => (
                <motion.button
                  key={qp.key}
                  onClick={() => callAI(qp.key)}
                  disabled={loading || chatLoading}
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
                  whileTap={{ scale: (loading || chatLoading) ? 1 : 0.97 }}
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
            </motion.div>
            )}
            </AnimatePresence>

            {/* ── Free Chat Input ── */}
            <div className="px-4 pb-4">
              <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                <textarea
                  ref={inputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Magtanong tungkol sa pagsasaka, presyo, o pagbebenta..."
                  rows={1}
                  disabled={loading || chatLoading}
                  className="flex-1 resize-none bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none leading-relaxed py-1 disabled:opacity-50"
                  style={{ maxHeight: 80 }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                  }}
                />
                <motion.button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim() || loading || chatLoading}
                  className="w-8 h-8 rounded-xl bg-green-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: chatInput.trim() ? 1.05 : 1 }}
                  whileTap={{ scale: chatInput.trim() ? 0.95 : 1 }}
                >
                  <Send size={13} />
                </motion.button>
              </div>
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