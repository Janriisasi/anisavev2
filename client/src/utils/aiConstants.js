import { Sprout, ChartLine, HandCoins, Lightbulb } from "lucide-react";

// ─── Product Images ───────────────────────────────────────────────────────────
// Defined at module level to prevent object re-creation on every render.
export const PRODUCT_IMAGES = {
  Eggplant: "/images/eggplant.webp",
  Tomato: "/images/tomato.webp",
  Cabbage: "/images/cabbage.webp",
  Carrot: "/images/carrots.webp",
  Potato: "/images/potato.webp",
  Squash: "/images/squash.webp",
  "String Beans": "/images/54EDF324AD7242CA.png!c750x0.webp",
  Ampalaya: "/images/107992536.webp",
  Okra: "/images/okra.webp",
  Pechay: "/images/pechay.webp",
  "Bell Pepper": "/images/bellpepper.webp",
  Broccoli: "/images/broccoli.webp",
  "Lettuce (Green Ice)": "/images/lettuce_green.webp",
  "Lettuce (Iceberg)": "/images/lettuce_iceberg.webp",
  "Lettuce (Romaine)": "/images/lettuce_romaine.webp",
  Sitao: "/images/sitao.webp",
  Mango: "/images/mango.webp",
  "Banana (Lakatan)": "/images/lakatan.webp",
  "Banana (Latundan)": "/images/latundan.webp",
  "Banana (Saba)": "/images/saba.webp",
  Calamansi: "/images/calamansi.webp",
  Papaya: "/images/papaya.webp",
  Pineapple: "/images/pineapple.webp",
  Watermelon: "/images/watermelon.webp",
  Lanzones: "/images/lanzones.webp",
  Rambutan: "/images/rambutan.webp",
  Durian: "/images/durian.webp",
  Guyabano: "/images/guyabano.webp",
  Avocado: "/images/avocado.webp",
  Melon: "/images/melon.webp",
  Pomelo: "/images/pomelo.webp",
  "Rice (Local Fancy White)": "/images/rice_fancywhite.webp",
  "Rice (Local Premium 5% broken)": "/images/rice_premium.webp",
  "Rice (Local Well Milled)": "/images/will_milled_rice.webp",
  "Rice (Local Regular Milled)": "/images/rice_wellmilled.webp",
  "Corn (White Cob, Glutinous)": "/images/white_cob_corn.webp",
  "Corn (Yellow Cob, Sweet)": "/images/yellowcob_cornsweet.webp",
  "Corn Grits (White, Food Grade)": "/images/whitecorn_grits_foodgrade.webp",
  "Corn Grits (Yellow, Food Grade)": "/images/yellowcorn_grits_foodgrade.webp",
  "Corn Cracked (Yellow, Feed Grade)": "/images/yellowcob_corn_feedgrade.webp",
  "Corn Grits (Feed Grade)": "/images/corngrits.webp",
  Sorghum: "/images/sorghum.webp",
  Millet: "/images/millet.webp",
  Ginger: "/images/ginger.webp",
  Garlic: "/images/garlic.webp",
  "Red Onion": "/images/onion.webp",
  Chili: "/images/chili.webp",
  Lemongrass: "/images/lemongrass.webp",
  Basil: "/images/basil.webp",
  Turmeric: "/images/turmeric.webp",
};

// ─── Quick Prompts ────────────────────────────────────────────────────────────
export const QUICK_PROMPTS = [
  { key: "plant", icon: Sprout, label: "Pinakamabuting Itanim Ngayon" },
  { key: "price", icon: ChartLine, label: "Presyo sa Susunod na Linggo" },
  { key: "sell", icon: HandCoins, label: "Pinakamabentang Produkto" },
  { key: "tips", icon: Lightbulb, label: "Mga Tips sa Pagsasaka" },
];

// ─── Loading Messages ─────────────────────────────────────────────────────────
export const LOADING_MESSAGES = {
  plant: [
    "Tinitignan ang kasalukuyang season...",
    "Sinusuri ang live market data...",
    "Hinahanap ang pinakamabuting pananim...",
    "Halos tapos na ang pagsusuri...",
  ],
  price: [
    "Kinukuha ang pinakabagong datos ng presyo...",
    "Sinusuri ang market trends...",
    "Hinahanap ang mga pagbabago sa presyo...",
    "Halos handa na ang ulat...",
  ],
  sell: [
    "Kinukuha ang live seller data...",
    "Binibilang ang sellers per produkto...",
    "Inire-rank ang pinaka-in-demand...",
    "Ginagawa ang chart...",
  ],
  tips: [
    "Tinitingnan ang kondisyon ng panahon...",
    "Sinusuri ang mga posibleng peste...",
    "Hinahanap ang pinakamahusay na paraan...",
    "Inihahanda ang mga rekomendasyon...",
  ],
  chat: [
    "Pinag-aaralan ang iyong tanong...",
    "Kinukuha ang impormasyon...",
    "Hinahanap ang pinakamahusay na sagot...",
    "Halos tapos na...",
  ],
};

export const DEFAULT_LOADING = [
  "Sinisimulan ang pagsusuri...",
  "Kinukuha ang impormasyon...",
  "Pinag-aaralan ang iyong tanong...",
  "Halos tapos na...",
];

// ─── Chart Colors ─────────────────────────────────────────────────────────────
export const CHART_COLORS = {
  green: {
    bar: "#16a34a",
    bg: "#f0fdf4",
    header: "#dcfce7",
    text: "#15803d",
    track: "#bbf7d0",
  },
  blue: {
    bar: "#2563eb",
    bg: "#eff6ff",
    header: "#dbeafe",
    text: "#1d4ed8",
    track: "#bfdbfe",
  },
  amber: {
    bar: "#d97706",
    bg: "#fffbeb",
    header: "#fef3c7",
    text: "#b45309",
    track: "#fde68a",
  },
  purple: {
    bar: "#7c3aed",
    bg: "#faf5ff",
    header: "#ede9fe",
    text: "#6d28d9",
    track: "#e9d5ff",
  },
};

export const MEDALS = ["🥇", "🥈", "🥉"];

// ─── Quick Prompt Text Generator ──────────────────────────────────────────────
export const getQuickPromptText = (key, { month, season }) =>
  ({
    plant: `Buwan ng ${month}, ${season}. Base sa live trend data at presyo, aling 5 pananim ang pinaka-magandang itanim NGAYON? Ibigay ang: pangalan, araw bago anihin, at presyo. Gumawa ng chart gamit ang quantity available bilang value. Sagot sa Tagalog, maikli lang.`,
    price: `Base sa seasonal trends ng Pilipinas ngayong ${month} at sa live data, aling 5 produkto ang malamang na TATAAS ang presyo sa susunod na 1-2 linggo? Ibigay ang dahilan at gumawa ng chart. Sagot sa Tagalog, maikli lang.`,
    sell: `Base sa LIVE MARKET TREND DATA, aling 5 produkto ang PINAKAMABENTA at PINAKA-IN-DEMAND sa AniSave NGAYON? Gamitin ang seller count bilang pangunahing batayan. I-rank at gumawa ng chart ng seller count. Sagot sa Tagalog, maikli lang.`,
    tips: `Bigyan mo ako ng 5 praktikal na tips sa pagsasaka ngayong ${month} sa Pilipinas. Kasama na ang panahon, mga peste, lupa, at tamang oras ng pagbebenta. Sagot sa Tagalog, maikli lang.`,
  })[key];

// ─── Greeting Helper ──────────────────────────────────────────────────────────
export const getGreeting = (userName, myProducts) => {
  const firstName = userName ? userName.split(" ")[0] : null;
  const hour = new Date().getHours();
  const timeGreet =
    hour < 12
      ? "Magandang umaga"
      : hour < 18
        ? "Magandang hapon"
        : "Magandang gabi";

  const greetings = firstName
    ? [
        `${timeGreet}, ${firstName}! Kumusta ang inyong taniman ngayon?`,
        `Hoy ${firstName}! Mayroon bang bago sa bukid?`,
        `${firstName}, ${timeGreet}! Handa ka na bang kumita ngayon?`,
        `${timeGreet}, ${firstName}! Anong balita sa inyong produkto?`,
      ]
    : [
        `${timeGreet}, Magsasaka! Kumusta ang taniman?`,
        `Handa ka na bang kumita ngayon?`,
      ];

  const tips =
    myProducts.length === 0
      ? [
          `Tip: Wala ka pang nakalista na produkto! Subukang mag-list ng iyong mga ani para makita ng mga buyer.`,
          `Mayroon bang pananim na handa nang ibenta? I-list na ngayon sa AniSave!`,
        ]
      : [
          `Tingnan ang live market trends para malaman kung kailan pinakamainam na magbenta.`,
          `Ang ${myProducts[0]?.name || "iyong produkto"} ay maaaring mas magandang ibenta ngayon!`,
        ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const tip = tips[Math.floor(Math.random() * tips.length)];

  return { greeting, tip };
};
