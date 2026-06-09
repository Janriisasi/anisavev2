// ─── Base System Prompt (~300 tokens, always sent) ───────────────────────────
/**
 * Static identity + rules block sent with every AI call.
 * Kept minimal intentionally — dynamic data is injected per-intent only.
 */
export const BASE_SYSTEM_PROMPT = `
Ikaw ay isang AI Farming Advisor ng AniSave para sa mga magsasaka sa Pilipinas.

MAHALAGANG PATAKARAN:
- Sumagot LAGING sa wikang Tagalog.
- HUWAG KAILANMAN gamitin ang buong pangalan ng user sa loob ng sagot — gamitin ang "ikaw", "kayo", o first name lang.
- Gamitin PALAGI ang Market Trend Data kapag nagtanong tungkol sa pinakamabenta o pinaka-popular.
- Maging MAIKLI at TUWID sa punto — walang mahabang paliwanag.
- Gumamit ng bullet points at emojis para madaling basahin.
- Maximum 180 salita lang ang sagot (hindi kasama ang chart data).
- TANGGIHAN ang mga tanong na HINDI tungkol sa pagsasaka, agrikultura, pagbebenta ng produktong pang-bukid, o ekonomiya ng magsasaka. Kung ang tanong ay hindi agrikultural (hal. programming, showbiz, sports, general trivia), sumagot ng: "Paumanhin! Ako ay isang AI Farming Advisor lamang. Narito ako para sagutin ang mga tanong tungkol sa pagsasaka, presyo ng produkto, at agrikultura. Para sa ibang paksa, mangyaring gumamit ng ibang AI assistant. 🌾"
- Kung ang user ay WALA pang nakalista na produkto, himukin silang maglista na.
- Kung ang user ay TOP BUYER, purihin sila at i-motivate na patuloy na suportahan ang mga lokal na magsasaka.
- Kung may top buyers, banggitin sila (pero ang current user, "ikaw" lang ang tawag) kapag may tanong tungkol sa pagbebenta.

CHART INSTRUCTIONS:
Kapag ang sagot ay may ranking o comparison (hal. pinakamabenta, pinaka-profitable, pinakamabuting itanim), DAPAT mag-include ng chart sa DULO ng sagot.

Format ng chart (JSON lang, wala nang ibang text pagkatapos):
<<<CHART>>>
{"type":"hbar","title":"Pamagat ng Chart","labels":["Item1","Item2","Item3"],"values":[10,8,5],"unit":"sellers","color":"green"}
<<<END_CHART>>>

Pwedeng gamitin na color: "green", "blue", "amber", "purple"
Pwedeng gamitin na unit: "sellers", "kg", "piso"
`.trim();

// ─── Month / Season Helper ────────────────────────────────────────────────────
export const getMonthContext = () => {
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

// ─── Block Builders ───────────────────────────────────────────────────────────

function buildUserBlock(userName, userId, myProducts, topBuyers) {
  const userBuyerRank = userId
    ? topBuyers.findIndex((b) => b.id === userId)
    : -1;
  const isTopBuyer = userBuyerRank === 0;
  const isInTopBuyers = userBuyerRank >= 0;

  const userInfo = userName
    ? `Ang pangalan ng kasalukuyang user (ang taong kausap mo) ay "${userName}". Tukuyin siya bilang "ikaw" o gamitin ang kanyang first name sa mga personal na sagot — HUWAG gamitin ang buong pangalan niya sa sagot.`
    : "Hindi pa alam ang pangalan ng kasalukuyang user.";

  const myProductNames =
    myProducts.map((p) => p.name).join(", ") || "wala pang nakalista";

  const sellingStatus =
    myProducts.length > 0
      ? `Ang kasalukuyang user ay may ${myProducts.length} produkto na nakalista sa platform: ${myProductNames}. Sila ay isang SELLER/MAGSASAKA na aktibo sa AniSave.`
      : "Ang kasalukuyang user ay WALA pang nakalista na produkto sa platform. Himukin silang maglista ng kanilang mga produkto.";

  const achievementBlock = isTopBuyer
    ? `\nUSER ACHIEVEMENT:\n- Ang kasalukuyang user ay ang PINAKA-AKTIBONG BUYER (#1) sa buong platform ngayon!\n- I-acknowledge ito nang may pagpupuri at higit sa lahat, i-motivate sila na patuloy na suportahan ang mga lokal na magsasaka.\n- Maaari rin silang hikayatin na subukan ang mga bagong produkto mula sa mga trending na magsasaka.`
    : isInTopBuyers
      ? `\nUSER ACHIEVEMENT:\n- Ang kasalukuyang user ay nasa Top ${userBuyerRank + 1} buyers ng platform!\n- Banggitin ito nang may papuri at himukin silang umabot sa #1 spot.`
      : "";

  return `KASALUKUYANG USER:\n${userInfo}\n${sellingStatus}${achievementBlock}`;
}

function buildPricesBlock(prices) {
  const allCrops = [];
  Object.entries(prices || {}).forEach(([cat, items]) => {
    Object.entries(items).forEach(([name, price]) => {
      allCrops.push({ name, category: cat, price });
    });
  });
  if (allCrops.length === 0) return "";
  return (
    `OPISYAL NA PRESYO NG MGA PRODUKTO (₱/kg mula sa DA):\n` +
    allCrops.map((c) => `  • ${c.name} (${c.category}): ₱${c.price}`).join("\n")
  );
}

function buildTrendBlock(trendData) {
  const top15 = (trendData || []).slice(0, 15);
  if (top15.length === 0) return "(Walang live trend data na available ngayon.)";
  return (
    `LIVE MARKET TREND DATA (aktwal na listings ng mga magsasaka sa AniSave ngayon):\n` +
    top15
      .map(
        (t, i) =>
          `  ${i + 1}. ${t.name} (${t.category}) — ${t.sellerCount} seller${t.sellerCount !== 1 ? "s" : ""}, ${t.totalQty} kg available, avg farm price ₱${t.avgPrice}/kg`,
      )
      .join("\n") +
    `\n\nPALIWANAG:\n- "sellers" = bilang ng mga magsasaka na nag-list ng produkto sa platform\n- Mas maraming sellers = mas mataas ang supply at demand sa produkto\n- Gamitin ang data na ito bilang pangunahing batayan sa mga tanong tungkol sa trends`
  );
}

function buildBuyerBlock(topBuyers, userId) {
  if (!topBuyers || topBuyers.length === 0)
    return "(Walang buyer data na available.)";
  return (
    `TOP BUYERS SA PLATFORM (base sa bilang ng approved orders):\n` +
    topBuyers
      .map((b, i) => {
        const isCurrentUser = userId && b.id === userId;
        const label = isCurrentUser
          ? `${b.name} (ITO ANG KASALUKUYANG USER — tukuyin bilang "ikaw" sa sagot)`
          : b.name;
        return `  ${i + 1}. ${label} — ${b.orderCount} approved order${b.orderCount !== 1 ? "s" : ""}`;
      })
      .join("\n")
  );
}

// ─── Main Context Builder ──────────────────────────────────────────────────────
/**
 * Assembles a minimal system context based on the detected intent.
 * Only data blocks relevant to the query are included, reducing token
 * usage by 55–75% compared to the monolithic approach.
 *
 * @param {'GENERAL_FARMING'|'MARKET_ANALYSIS'|'PRODUCT_ANALYSIS'|'BUYER_ANALYSIS'|'QUICK_PROMPT'} intent
 * @param {object} data
 * @param {Array}  data.myProducts   - Current user's listed products
 * @param {object} data.prices       - Market prices from context
 * @param {Array}  data.trendData    - Aggregated trend rows
 * @param {Array}  data.topBuyers    - Top 3 buyers
 * @param {string} data.userName     - User display name
 * @param {string} data.userId       - User UUID
 * @param {string[]} data.needs      - For QUICK_PROMPT: explicit data needs
 * @returns {string} Assembled system context string
 */
export function buildContext(
  intent,
  {
    myProducts = [],
    prices = {},
    trendData = [],
    topBuyers = [],
    userName = null,
    userId = null,
    needs = [],
  } = {},
) {
  const { month, year, season } = getMonthContext();

  const includePrices =
    intent === "PRODUCT_ANALYSIS" ||
    (intent === "QUICK_PROMPT" && needs.includes("prices"));

  const includeTrend =
    intent === "MARKET_ANALYSIS" ||
    intent === "PRODUCT_ANALYSIS" ||
    (intent === "QUICK_PROMPT" && needs.includes("trend"));

  const includeBuyers =
    intent === "BUYER_ANALYSIS" ||
    (intent === "QUICK_PROMPT" && needs.includes("buyers"));

  // Always pass topBuyers to user block for achievement rendering,
  // but only include the full buyer list block when buyers are explicitly needed.
  const blocks = [
    BASE_SYSTEM_PROMPT,
    `\nKasalukuyang Buwan: ${month} ${year}\nKasalukuyang Season: ${season}`,
    `\n${buildUserBlock(userName, userId, myProducts, includeBuyers ? topBuyers : [])}`,
  ];

  if (includePrices && Object.keys(prices).length > 0) {
    blocks.push(`\n${buildPricesBlock(prices)}`);
  }
  if (includeTrend) {
    blocks.push(`\n${buildTrendBlock(trendData)}`);
  }
  if (includeBuyers) {
    blocks.push(`\n${buildBuyerBlock(topBuyers, userId)}`);
  }

  return blocks.join("\n").trim();
}
