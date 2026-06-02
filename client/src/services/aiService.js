import supabase from "../lib/supabase";

// ─── Context Trimmer ──────────────────────────────────────────────────────────
/**
 * Trims a system context string to avoid Edge Function payload limits.
 * Tauri v2 Android has stricter request body limits than the browser.
 *
 * @param {string} context
 * @param {number} maxChars - Default 3000
 * @returns {string}
 */
export function trimContext(context, maxChars = 3000) {
  if (context.length <= maxChars) return context;
  return context.slice(0, maxChars) + "\n\n[Context trimmed for performance]";
}

// ─── Response Parser ──────────────────────────────────────────────────────────
/**
 * Extracts the optional <<<CHART>>> block from an AI response.
 * Returns clean text and parsed chart data (or null if no chart).
 *
 * @param {string} raw - Raw AI response string
 * @returns {{ text: string, chartData: object|null }}
 */
export function parseAIResponse(raw) {
  const chartMatch = raw.match(/<<<CHART>>>([\s\S]*?)<<<END_CHART>>>/);
  const text = raw
    .replace(/<<<CHART>>>[\s\S]*?<<<END_CHART>>>/, "")
    .trim();

  let chartData = null;
  if (chartMatch) {
    try {
      chartData = JSON.parse(chartMatch[1].trim());
    } catch {
      chartData = null;
    }
  }

  return { text, chartData };
}

// ─── Quick Prompt (single-turn) ───────────────────────────────────────────────
/**
 * Sends a single-turn request to the chat-advisor Edge Function.
 * Used for the 4 quick-prompt buttons.
 *
 * @param {string} systemContext - Pre-built, intent-specific context
 * @param {string} userText      - The quick-prompt question text
 * @returns {Promise<{ text: string, chartData: object|null }>}
 */
export async function callQuickPromptAI(systemContext, userText) {
  const trimmed = trimContext(systemContext);
  const { data, error } = await supabase.functions.invoke("chat-advisor", {
    body: { systemContext: trimmed, userText },
  });
  if (error) throw error;

  const raw =
    data?.choices?.[0]?.message?.content?.trim() ||
    "Pasensya na, hindi makasagot ngayon. Subukang muli.";

  return parseAIResponse(raw);
}

// ─── Chat (multi-turn) ────────────────────────────────────────────────────────
/**
 * Sends a multi-turn conversation to the chat-advisor Edge Function.
 * Used for free-text chat messages.
 *
 * @param {string} systemContext - Pre-built, intent-specific context
 * @param {{ role: string, content: string }[]} messages - Chat history
 * @returns {Promise<{ text: string, chartData: object|null }>}
 */
export async function callChatAI(systemContext, messages) {
  const trimmed = trimContext(systemContext);
  const { data, error } = await supabase.functions.invoke("chat-advisor", {
    body: { systemContext: trimmed, messages },
  });
  if (error) throw error;

  const raw =
    data?.choices?.[0]?.message?.content?.trim() ||
    "Pasensya na, hindi makasagot ngayon. Subukang muli.";

  return parseAIResponse(raw);
}
