import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { useMarketPrices } from "../contexts/marketPricesContext";
import { useAIAdvisor } from "../hooks/useAIAdvisor";
import {
  PRODUCT_IMAGES,
  QUICK_PROMPTS,
  LOADING_MESSAGES,
  DEFAULT_LOADING,
  CHART_COLORS,
  MEDALS,
  getGreeting,
} from "../utils/aiConstants";

// ─── Slideshow Loader ─────────────────────────────────────────────────────────
const SlideshowLoader = memo(({ promptKey }) => {
  const messages = LOADING_MESSAGES[promptKey] || DEFAULT_LOADING;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setIndex((p) => (p + 1) % messages.length),
      1800,
    );
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className="flex items-start gap-3 pb-2">
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
});
SlideshowLoader.displayName = "SlideshowLoader";

// ─── Animated Horizontal Bar Chart ───────────────────────────────────────────
const TrendChart = memo(({ chartData }) => {
  if (!chartData) return null;
  const { title, labels, values, unit, color = "green" } = chartData;
  const c = CHART_COLORS[color] || CHART_COLORS.green;
  const maxVal = Math.max(...values, 1);

  const formatVal = (v) => {
    if (unit === "piso") return `₱${v}`;
    if (unit === "kg") return `${v} kg`;
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
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: c.header }}
      >
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
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: c.text }}
                >
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
                  transition={{
                    delay: 0.1 + i * 0.06,
                    duration: 0.55,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});
TrendChart.displayName = "TrendChart";

// ─── Trending Section ─────────────────────────────────────────────────────────
const TrendingSection = memo(
  ({ trendData, topBuyers, myProducts, userName, userId }) => {
    const firstName = userName ? userName.split(" ")[0] : null;
    const top3 = trendData.slice(0, 3);
    const hasProducts = myProducts.length > 0;

    const userBuyerRank = userId
      ? topBuyers.findIndex((b) => b.id === userId)
      : -1;
    const isTopBuyer = userBuyerRank === 0;
    const isInTopBuyers = userBuyerRank >= 0;

    return (
      <div className="mx-4 mb-1 space-y-2">
        {/* Hot products ticker — only shown when trendData is passed (not from idle, which passes []) */}
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
                    {MEDALS[i]} <strong>{t.name}</strong> ({t.sellerCount}{" "}
                    sellers)
                    {i < top3.length - 1 ? "  ·  " : ""}
                  </span>
                ))}
              </p>
            </div>
          </motion.div>
        )}

        {/* Achievement banner — top buyer motivation */}
        {isTopBuyer && (
          <motion.div
            className="bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="w-8 h-8 rounded-xl bg-yellow-200/60 flex items-center justify-center flex-shrink-0 text-base">
              🏆
            </div>
            <div>
              <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide mb-0.5">
                Ikaw ang Top Buyer ngayon!
              </p>
              <p className="text-xs text-yellow-800">
                {firstName ? `${firstName}, patuloy` : "Patuloy"} kang
                sumusuporta sa mga lokal na magsasaka — salamat! 🌾
              </p>
            </div>
          </motion.div>
        )}

        {!isTopBuyer && isInTopBuyers && (
          <motion.div
            className="bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="w-8 h-8 rounded-xl bg-yellow-200/60 flex items-center justify-center flex-shrink-0 text-base">
              ⭐
            </div>
            <div>
              <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide mb-0.5">
                Top #{userBuyerRank + 1} Buyer ka!
              </p>
              <p className="text-xs text-yellow-800">
                Malapit ka na sa #1! Tuloy-tuloy lang sa pagsuporta sa ating mga
                magsasaka. 💪
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
                {firstName ? `${firstName}, mag` : "Mag"}-list na ng iyong
                produkto at kumita ngayon! 🌾{" "}
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
                {topBuyers.map((b, i) => {
                  const isMe = userId && b.id === userId;
                  return (
                    <span key={b.id}>
                      {MEDALS[i] ?? `#${i + 1}`}{" "}
                      <strong>{isMe ? "Ikaw" : b.name}</strong> ({b.orderCount}{" "}
                      orders)
                      {i < topBuyers.length - 1 ? "  ·  " : ""}
                    </span>
                  );
                })}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    );
  },
);
TrendingSection.displayName = "TrendingSection";

// ─── Greeting Banner ──────────────────────────────────────────────────────────
const GreetingBanner = memo(({ userName, myProducts }) => {
  const [greetData] = useState(() => getGreeting(userName, myProducts));

  return (
    <motion.div
      className="mx-4 mb-5 bg-green-50 border border-green-300 rounded-xl px-4 py-3"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-green-200/60 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-green-700" />
        </div>
        <div>
          <p className="text-green-700 text-xs font-semibold leading-snug">
            {greetData.greeting}
          </p>
          <p className="text-green-600 text-[11px] mt-1 leading-snug">
            {greetData.tip}
          </p>
        </div>
      </div>
    </motion.div>
  );
});
GreetingBanner.displayName = "GreetingBanner";

// ─── Markdown Renderer ────────────────────────────────────────────────────────
const MarkdownText = memo(({ text }) => {
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
              <span className="font-semibold text-green-700 flex-shrink-0">
                {numMatch[1]}
              </span>
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
});
MarkdownText.displayName = "MarkdownText";

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
const ChatBubble = memo(({ msg }) => {
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
});
ChatBubble.displayName = "ChatBubble";

// ─── Main Component ───────────────────────────────────────────────────────────
const AiAdvisor = ({ myProducts = [] }) => {
  const { prices } = useMarketPrices();

  const {
    response,
    chartData,
    activeKey,
    loading,
    error,
    isExpanded,
    trendData,
    trendReady,
    topBuyers,
    userName,
    userId,
    chatHistory,
    chatInput,
    chatLoading,
    showChat,
    month,
    season,
    callAI,
    handleChatSend,
    handleKeyDown,
    handleRefresh,
    setChatInput,
    setIsExpanded,
    advisorRef,
    chatEndRef,
    inputRef,
  } = useAIAdvisor({ myProducts, prices });

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
      <div className="bg-green-700 px-5 pt-4 pb-4 rounded-t-3xl">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
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
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefresh}
              disabled={loading || chatLoading}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading || chatLoading ? 1 : 1.05 }}
              whileTap={{ scale: loading || chatLoading ? 1 : 0.95 }}
              title="I-reset"
            >
              <RefreshCw
                size={14}
                className={loading || chatLoading ? "animate-spin" : ""}
              />
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

        {/* Market Trends pill strip — inside the green header */}
        {trendReady && trendData.length > 0 && (
          <div className="mb-0">
            <div className="bg-white rounded-2xl px-3 pt-2.5 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={11} className="text-red-500" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  Market Trends
                </span>
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-0.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {trendData.slice(0, 8).map((t, i) => {
                  const imgSrc = PRODUCT_IMAGES[t.name];
                  return (
                    <motion.div
                      key={t.name}
                      className="flex-shrink-0 flex items-center gap-2 bg-gray-100 rounded-xl px-2.5 py-1.5"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      {/* Square product image */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={t.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">
                            🌾
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                          {t.name}
                        </p>
                        <p className="text-[9px] text-gray-500 leading-tight">
                          {t.sellerCount} sellers
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white"
          >
            <div className="pt-4">
              <AnimatePresence mode="wait">
                {/* Loading (quick prompt) */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
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
                    className="mx-4 mb-4 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="px-3 py-3 space-y-3 max-h-72 overflow-y-auto">
                      {chatHistory.map((msg, i) => (
                        <ChatBubble key={i} msg={msg} />
                      ))}
                      {chatLoading && <SlideshowLoader promptKey="chat" />}
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
                    <GreetingBanner
                      userName={userName}
                      myProducts={myProducts}
                    />

                    {/* Achievement / nudge banners and market trends */}
                    {trendReady && (
                      <TrendingSection
                        trendData={trendData}
                        topBuyers={topBuyers}
                        myProducts={myProducts}
                        userName={userName}
                        userId={userId}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4 Quick Prompt Buttons — hidden once a chat conversation starts */}
            <AnimatePresence>
              {!showChat && (
                <motion.div
                  key="quick-prompts"
                  className="grid grid-cols-1 md:grid-cols-2 gap-2.5 px-4 pt-4 pb-3"
                  initial={{ opacity: 1, height: "auto" }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    marginBottom: 0,
                    overflow: "hidden",
                  }}
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
                        bg-white border rounded-2xl p-4
                        flex flex-col items-center gap-2 shadow-sm
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200
                        hover:shadow-md hover:border-green-300 hover:-translate-y-0.5
                        ${
                          activeKey === qp.key && !loading
                            ? "border-green-600 ring-2 ring-green-200 shadow-md"
                            : "border-gray-200"
                        }
                      `}
                      whileTap={{ scale: loading || chatLoading ? 1 : 0.97 }}
                    >
                      {activeKey === qp.key && !loading && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-600" />
                      )}
                      <qp.icon size={24} className="text-green-700" />
                      <span className="text-xs font-semibold text-center leading-tight text-gray-700">
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
                  placeholder="Ano ang inyong mga katanungan o nais malaman?"
                  rows={1}
                  disabled={loading || chatLoading}
                  className="flex-1 resize-none bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none leading-relaxed py-1 disabled:opacity-50"
                  style={{ maxHeight: 80 }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 80) + "px";
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
