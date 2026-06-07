import { useState, useEffect, useRef, useCallback } from "react";
import supabase from "../lib/supabase";
import { classifyIntent, QUICK_PROMPT_NEEDS } from "../utils/intentClassifier";
import { buildContext, getMonthContext } from "../utils/contextBuilder";
import { getCachedResponse, setCachedResponse } from "../services/cacheService";
import { fetchTrendData, fetchTopBuyers } from "../services/trendService";
import { callQuickPromptAI, callChatAI } from "../services/aiService";
import { getQuickPromptText } from "../utils/aiConstants";

const MAX_HISTORY = 8;

// ─── User Profile Fetcher ─────────────────────────────────────────────────────
// Kept here (not in trendService) because it's lightweight and always needed
// for personalised greetings — unlike trend/buyer data which are lazy-loaded.
async function fetchUserProfile() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return { ...data, id: user.id };
  } catch (err) {
    console.error("Profile fetch error:", err);
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * useAIAdvisor — all state, data fetching, and event handlers for the AI Advisor.
 *
 * Extracted from the monolithic AiAdvisor component to:
 * - Separate business logic from rendering
 * - Enable lazy loading of market data
 * - Enable intent-based context injection
 * - Enable quick-prompt response caching
 *
 * @param {{ myProducts: Array, prices: object }} params
 */
export function useAIAdvisor({ myProducts, prices }) {
  // ── Quick-prompt state ──────────────────────────────────────────────────────
  const [response, setResponse] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Lazy-loaded market data ─────────────────────────────────────────────────
  // NOT fetched on mount — only when an intent or quick-prompt requires them.
  const [trendData, setTrendData] = useState([]);
  const [trendReady, setTrendReady] = useState(false);
  const [topBuyers, setTopBuyers] = useState([]);

  // ── User profile (fetched on mount — lightweight, always needed) ────────────
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const advisorRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Ref mirrors for latest state values inside stable callbacks
  const trendDataRef = useRef([]);
  const topBuyersRef = useRef([]);

  const { month, season } = getMonthContext();

  // ── Mount: fetch user profile only ─────────────────────────────────────────
  useEffect(() => {
    fetchUserProfile().then((profile) => {
      if (profile) {
        setUserName(profile.full_name || profile.username || null);
        setUserId(profile.id || null);
      }
    });
  }, []);

  // ── Mount: fetch market trends and top buyers by default ───────────────────
  useEffect(() => {
    const loadDefaultData = async () => {
      const trendData = await fetchTrendData();
      setTrendData(trendData);
      setTrendReady(true);

      const buyerData = await fetchTopBuyers();
      setTopBuyers(buyerData);
    };
    loadDefaultData();
  }, []);

  // ── Sync state → refs so callbacks always see the latest values ─────────────
  useEffect(() => {
    trendDataRef.current = trendData;
  }, [trendData]);

  useEffect(() => {
    topBuyersRef.current = topBuyers;
  }, [topBuyers]);

  // ── Auto-scroll chat only when user sends a message ──────────────────────────
  useEffect(() => {
    if (showChat && chatHistory.length > 0) {
      // Only scroll if the last message is from the user (not AI response)
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    }
  }, [showChat]);

  // ── Lazy data helpers ───────────────────────────────────────────────────────
  const ensureTrendData = useCallback(async () => {
    if (trendDataRef.current.length > 0) return trendDataRef.current;
    const data = await fetchTrendData();
    setTrendData(data);
    setTrendReady(true);
    return data;
  }, []);

  const ensureBuyerData = useCallback(async () => {
    if (topBuyersRef.current.length > 0) return topBuyersRef.current;
    const data = await fetchTopBuyers();
    setTopBuyers(data);
    return data;
  }, []);

  // ── Quick Prompt ─────────────────────────────────────────────────────────────
  const callAI = useCallback(
    async (key) => {
      if (loading) return;
      setLoading(true);
      setError(null);
      setResponse(null);
      setChartData(null);
      setActiveKey(key);
      setShowChat(false);

      // Removed auto-scroll on quick prompt to prevent unwanted page scrolling

      try {
        // 1. Serve from cache if available (6-hour TTL)
        const cached = getCachedResponse(key);
        if (cached) {
          setResponse(cached.text);
          setChartData(cached.chartData);
          setLoading(false);
          return;
        }

        // 2. Lazy-fetch only what this prompt needs
        const needs = QUICK_PROMPT_NEEDS[key] || [];
        let resolvedTrend = trendDataRef.current;
        let resolvedBuyers = topBuyersRef.current;

        if (needs.includes("trend")) resolvedTrend = await ensureTrendData();
        if (needs.includes("buyers")) resolvedBuyers = await ensureBuyerData();

        // 3. Build minimal, intent-specific context
        const systemContext = buildContext("QUICK_PROMPT", {
          myProducts,
          prices,
          trendData: resolvedTrend,
          topBuyers: resolvedBuyers,
          userName,
          userId,
          needs,
        });

        const userText = getQuickPromptText(key, { month, season });

        // 4. Call AI
        const { text, chartData: parsed } = await callQuickPromptAI(
          systemContext,
          userText,
        );

        // 5. Cache the result for 6 hours
        setCachedResponse(key, { text, chartData: parsed });

        console.log("🔍 HOOK - useAIAdvisor callAI:");
        console.log("Text to be stored in state - length:", text.length);
        console.log("Text (first 500 chars):", text.substring(0, 500));

        setResponse(text);
        setChartData(parsed);
      } catch (err) {
        console.error("AI error:", err);
        setError(`May error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loading,
      myProducts,
      prices,
      userName,
      userId,
      month,
      season,
      ensureTrendData,
      ensureBuyerData,
    ],
  );

  // ── Free Chat Send ────────────────────────────────────────────────────────────
  const handleChatSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    // Keep last MAX_HISTORY messages (existing 8-message strategy preserved)
    const trimmedHistory = chatHistory.slice(-MAX_HISTORY);
    const newHistory = [...trimmedHistory, { role: "user", content: text }];

    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);
    setShowChat(true);
    setResponse(null);
    setChartData(null);
    setActiveKey(null);
    setError(null);

    try {
      // 1. Classify intent — zero cost, no AI call
      const intent = classifyIntent(text);

      // 2. Lazy-fetch only what this intent needs
      let resolvedTrend = trendDataRef.current;
      let resolvedBuyers = topBuyersRef.current;

      if (intent === "MARKET_ANALYSIS" || intent === "PRODUCT_ANALYSIS") {
        resolvedTrend = await ensureTrendData();
      }
      if (intent === "BUYER_ANALYSIS") {
        resolvedBuyers = await ensureBuyerData();
      }

      // 3. Build minimal, intent-specific context
      const systemContext = buildContext(intent, {
        myProducts,
        prices,
        trendData: resolvedTrend,
        topBuyers: resolvedBuyers,
        userName,
        userId,
      });

      // 4. Strip chartData from history — only role + content goes to the API
      const messages = newHistory.map(({ role, content }) => ({
        role,
        content,
      }));

      // 5. Call AI
      const { text: aiText, chartData: parsed } = await callChatAI(
        systemContext,
        messages,
      );

      console.log("🔍 HOOK - handleChatSend:");
      console.log("AI text length:", aiText.length);
      console.log("AI text (first 500 chars):", aiText.substring(0, 500));

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
  }, [
    chatInput,
    chatLoading,
    chatHistory,
    myProducts,
    prices,
    userName,
    userId,
    ensureTrendData,
    ensureBuyerData,
  ]);

  // ── Keyboard Handler ──────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
      }
    },
    [handleChatSend],
  );

  // ── Reset / Refresh ───────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (loading || chatLoading) return;
    setResponse(null);
    setChartData(null);
    setActiveKey(null);
    setError(null);
    setChatHistory([]);
    setShowChat(false);
    setChatInput("");
  }, [loading, chatLoading]);

  return {
    // State
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
    // Handlers
    callAI,
    handleChatSend,
    handleKeyDown,
    handleRefresh,
    setChatInput,
    setIsExpanded,
    // Refs
    advisorRef,
    chatEndRef,
    inputRef,
  };
}
