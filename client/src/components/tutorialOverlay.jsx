import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Globe, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../lib/supabase';

// ─── TUTORIAL CONTEXT ─────────────────────────────────────────────────────────
const TutorialContext = createContext(null);

export function useTutorial() {
  return useContext(TutorialContext);
}

// ─── TRANSLATIONS ────────────────────────────────────────────────────────────
const T = {
  en: {
    label: 'English',
    skip: 'Skip Tour',
    next: 'Next',
    back: 'Back',
    finish: 'Finish',
    stepOf: (c, t) => `${c} of ${t}`,
    navigating: 'Taking you there...',
    steps: [
      // ── WELCOME (no route, no target) ────────────────────────────────────
      {
        id: 'welcome',
        title: '🌾 Welcome to AniSave!',
        description:
          'This quick tour will walk you through every part of AniSave — your direct link to fresh produce from local farmers. It only takes a minute!',
        route: null,
        target: null,
      },
      // ── NAVBAR ───────────────────────────────────────────────────────────
      {
        id: 'navbar',
        title: 'Navigation Bar',
        description:
          '"The green bar at the top is your main navigation. Use it to jump between Home, Categories, Contacts, and your Profile at any time."',
        route: '/homepage',
        target: 'navbar',
      },
      {
        id: 'navbar-search',
        title: 'Search Farmers',
        description:
          '"Use the search bar to find farmers by name or username. Tap their profile to see what fresh produce they\'re currently selling."',
        route: '/homepage',
        target: 'navbar-search',
      },
      {
        id: 'navbar-notifications',
        title: 'Notifications',
        description:
          '"The bell icon shows your alerts — you\'ll be notified when a farmer approves or declines one of your order requests."',
        route: '/homepage',
        target: 'navbar-notifications',
      },
      {
        id: 'navbar-cart',
        title: 'Your Cart',
        description:
          '"The cart holds your pending and approved orders. Tap it anytime to review, track, or manage your purchases."',
        route: '/homepage',
        target: 'navbar-cart',
      },
      {
        id: 'navbar-chat',
        title: 'Messages',
        description:
          '"Chat directly with farmers to ask questions, negotiate prices, or coordinate your delivery — all in real time."',
        route: '/homepage',
        target: 'navbar-chat',
      },
      // ── HOMEPAGE ─────────────────────────────────────────────────────────
      {
        id: 'dashboard-stats',
        title: 'Your Dashboard',
        description:
          '"These four cards summarize your activity: your Best Selling product, Sales Summary, Your Rating (average customer satisfaction out of 5), and total Products you\'ve listed."',
        route: '/homepage',
        target: 'dashboard-stats',
      },
      {
        id: 'ai-advisor',
        title: 'AI Advisor',
        description:
          '"Tap the AI Advisor button to get smart, personalized insights on market prices, selling tips, and farming recommendations — powered by AI."',
        route: '/homepage',
        target: 'ai-advisor',
      },
      {
        id: 'product-cards',
        title: 'Browse Products',
        description:
          '"Scroll down to see all available crops from local farmers. Each card shows the product image, category, name, price per kg, and a \'View Sellers\' button."',
        route: '/homepage',
        target: 'product-cards',
      },
      // ── CATEGORIES PAGE ───────────────────────────────────────────────────
      {
        id: 'categories-intro',
        title: 'Categories Page',
        description:
          '"The Categories page lets you browse all crops grouped by type: Vegetables, Fruits, Grains, and Spices. Tap any crop to see who\'s selling it and at what price."',
        route: '/categories',
        target: 'categories-grid',
      },

      // ── PRODUCT SELLERS PAGE ───────────────────────────────────────────────
      {
        id: 'product-sellers-intro',
        title: 'Product Details',
        description:
          '"Here you can see the details of a specific product, including its market price. This helps you ensure you are getting a fair deal."',
        route: '/product/Eggplant/sellers',
        target: 'product-details-card',
      },
      {
        id: 'product-sellers-list',
        title: 'Available Farmers',
        description:
          '"This list shows all farmers selling this product. You can compare their prices, check their available stock, and add items directly to your cart."',
        route: '/product/Eggplant/sellers',
        target: 'product-sellers-list',
      },
      // ── FARMER PROFILE PAGE ───────────────────────────────────────────────
      {
        id: 'farmer-profile-intro',
        title: 'Farmer Profile',
        description:
          '"When you visit a farmer\'s profile, you can see their contact details and location. You can also save them to your contacts or chat with them directly."',
        route: 'DYNAMIC_FARMER',
        target: 'farmer-profile-card',
      },
      {
        id: 'farmer-products',
        title: 'Farmer\'s Products',
        description:
          '"Scroll down to see all the products this farmer is currently selling. You can easily add these to your cart from here."',
        route: 'DYNAMIC_FARMER',
        target: 'farmer-products-section',
      },
      // ── CONTACTS PAGE ─────────────────────────────────────────────────────
      {
        id: 'contacts-intro',
        title: 'Saved Contacts',
        description:
          '"Your Contacts page saves all the farmers you\'ve interacted with. Quickly find their contact info, view their profile, or rate them after a transaction."',
        route: '/contacts',
        target: 'contacts-list',
      },
      // ── CART PAGE ─────────────────────────────────────────────────────────
      {
        id: 'cart-intro',
        title: 'Cart & Order History',
        description:
          '"Your Cart shows active orders awaiting farmer approval. The History tab lets you review all past transactions and rate the farmers you\'ve bought from."',
        route: '/cart',
        target: 'cart-main',
      },
      // ── PROFILE PAGE ──────────────────────────────────────────────────────
      {
        id: 'profile-info',
        title: 'Your Profile',
        description:
          '"Update your name, avatar, address, and contact number here. Buyers and farmers can see your public profile when you interact with them."',
        route: '/profile',
        target: 'profile-info',
      },
      {
        id: 'profile-products',
        title: 'Manage Your Products',
        description:
          '"As a farmer, this is where you list, edit, and remove your produce. Tap the + button to add a new product with a photo, price, and quantity."',
        route: '/profile',
        target: 'profile-products',
      },
      {
        id: 'profile-orders',
        title: 'Order Requests',
        description:
          '"Buyers send you order requests here. You can approve or decline each request, and communicate with buyers via chat before confirming."',
        route: '/profile',
        target: 'profile-orders',
      },
      // ── FINISH ────────────────────────────────────────────────────────────
      {
        id: 'done',
        title: "You're all set! 🎉",
        description:
          'You now know everything you need to get started on AniSave. Start browsing fresh local produce, connect with farmers, and enjoy fair market prices!',
        route: '/homepage',
        target: null,
      },
    ],
  },
  tl: {
    label: 'Tagalog',
    skip: 'Laktawan',
    next: 'Susunod',
    back: 'Bumalik',
    finish: 'Tapusin',
    stepOf: (c, t) => `${c} sa ${t}`,
    navigating: 'Dadalhin ka doon...',
    steps: [
      {
        id: 'welcome',
        title: '🌾 Maligayang pagdating sa AniSave!',
        description:
          'Ang maikling pagtuturo na ito ay magagabay sa iyo sa bawat bahagi ng AniSave — ang iyong direktang koneksyon sa mga sariwang produkto mula sa mga lokal na magsasaka.',
        route: null,
        target: null,
      },
      {
        id: 'navbar',
        title: 'Navigation Bar',
        description:
          '"Ang berdeng bar sa itaas ay iyong pangunahing navigation. Gamitin ito upang lumipat sa Home, Categories, Contacts, at iyong Profile anumang oras."',
        route: '/homepage',
        target: 'navbar',
      },
      {
        id: 'navbar-search',
        title: 'Hanapin ang mga Magsasaka',
        description:
          '"Gamitin ang search bar upang mahanap ang mga magsasaka ayon sa pangalan o username. I-tap ang kanilang profile upang makita kung anong produkto ang kanilang ibinebenta."',
        route: '/homepage',
        target: 'navbar-search',
      },
      {
        id: 'navbar-notifications',
        title: 'Mga Abiso',
        description:
          '"Ang bell icon ay nagpapakita ng iyong mga alerto — maabisuhan ka kapag inaprubahan o tinanggihan ng magsasaka ang iyong order."',
        route: '/homepage',
        target: 'navbar-notifications',
      },
      {
        id: 'navbar-cart',
        title: 'Iyong Cart',
        description:
          '"Ang cart ay naglalaman ng iyong mga pending at approved na order. I-tap ito anumang oras upang suriin o pamahalaan ang iyong mga pagbili."',
        route: '/homepage',
        target: 'navbar-cart',
      },
      {
        id: 'navbar-chat',
        title: 'Mga Mensahe',
        description:
          '"Makipag-chat nang direkta sa mga magsasaka upang magtanong, makipag-negotiate, o mag-coordinate ng iyong delivery — lahat sa real time."',
        route: '/homepage',
        target: 'navbar-chat',
      },
      {
        id: 'dashboard-stats',
        title: 'Iyong Dashboard',
        description:
          '"Ang apat na card na ito ay nagbubuod ng iyong aktibidad: Pinakamabentang produkto, Buod ng Benta, Iyong Rating (average na kasiyahan ng customer sa 5), at kabuuang bilang ng Produkto."',
        route: '/homepage',
        target: 'dashboard-stats',
      },
      {
        id: 'product-cards',
        title: 'I-browse ang mga Produkto',
        description:
          '"Mag-scroll pababa upang makita ang lahat ng available na pananim mula sa mga lokal na magsasaka. Bawat card ay nagpapakita ng larawan, kategorya, pangalan, presyo bawat kg, at button na \'View Sellers\'."',
        route: '/homepage',
        target: 'product-cards',
      },
      {
        id: 'ai-advisor',
        title: 'AI Advisor',
        description:
          '"I-tap ang AI Advisor button upang makakuha ng matalinong, personalized na insight tungkol sa mga presyo sa merkado, mga tip sa pagbebenta, at mga rekomendasyon sa pagsasaka."',
        route: '/homepage',
        target: 'ai-advisor',
      },
      {
        id: 'categories-intro',
        title: 'Pahina ng Categories',
        description:
          '"Ang Categories page ay nagbibigay-daan sa iyo na mag-browse ng lahat ng pananim ayon sa uri: Gulay, Prutas, Butil, at Pampalasa. I-tap ang anumang pananim upang makita kung sino ang nagbebenta nito."',
        route: '/categories',
        target: 'categories-grid',
      },

      {
        id: 'product-sellers-intro',
        title: 'Detalye ng Produkto',
        description:
          '"Dito mo makikita ang detalye ng isang produkto, kabilang ang presyo sa merkado nito. Nakakatulong ito para makasiguro ka sa patas na presyo."',
        route: '/product/Eggplant/sellers',
        target: 'product-details-card',
      },
      {
        id: 'product-sellers-list',
        title: 'Mga Available na Magsasaka',
        description:
          '"Ipinapakita ng listahang ito ang lahat ng magsasakang nagbebenta ng produktong ito. Ikumpara ang kanilang presyo, stock, at ilagay ang mga item sa iyong cart."',
        route: '/product/Eggplant/sellers',
        target: 'product-sellers-list',
      },
      {
        id: 'farmer-profile-intro',
        title: 'Profile ng Magsasaka',
        description:
          '"Kapag binisita mo ang profile ng magsasaka, makikita mo ang kanilang contact at lokasyon. Maaari mo rin silang i-save o i-chat nang direkta."',
        route: 'DYNAMIC_FARMER',
        target: 'farmer-profile-card',
      },
      {
        id: 'farmer-products',
        title: 'Mga Produkto ng Magsasaka',
        description:
          '"Mag-scroll pababa upang makita ang lahat ng produkto na kasalukuyang ibinebenta ng magsasakang ito. Maaari mo itong direktang idagdag sa iyong cart mula rito."',
        route: 'DYNAMIC_FARMER',
        target: 'farmer-products-section',
      },
      {
        id: 'contacts-intro',
        title: 'Mga Naka-save na Contacts',
        description:
          '"Ang iyong Contacts page ay nagsasave ng lahat ng mga magsasakang nakipag-ugnayan ka. Mabilis na mahanap ang kanilang impormasyon, tingnan ang kanilang profile, o i-rate sila pagkatapos ng transaksyon."',
        route: '/contacts',
        target: 'contacts-list',
      },
      {
        id: 'cart-intro',
        title: 'Cart at Kasaysayan ng Order',
        description:
          '"Ang iyong Cart ay nagpapakita ng mga aktibong order na naghihintay ng approval ng magsasaka. Ang tab na History ay nagpapahintulot sa iyo na suriin ang lahat ng nakaraang transaksyon."',
        route: '/cart',
        target: 'cart-main',
      },
      {
        id: 'profile-info',
        title: 'Iyong Profile',
        description:
          '"I-update ang iyong pangalan, avatar, address, at contact number dito. Makikita ng mga buyer at magsasaka ang iyong pampublikong profile kapag nakikipag-ugnayan ka sa kanila."',
        route: '/profile',
        target: 'profile-info',
      },
      {
        id: 'profile-products',
        title: 'Pamahalaan ang Iyong mga Produkto',
        description:
          '"Bilang magsasaka, dito mo ilista, ie-edit, at aalisin ang iyong mga pananim. I-tap ang + button upang magdagdag ng bagong produkto na may larawan, presyo, at dami."',
        route: '/profile',
        target: 'profile-products',
      },
      {
        id: 'profile-orders',
        title: 'Mga Order Request',
        description:
          '"Ang mga buyer ay nagpapadala ng mga order request dito. Maaari mong i-approve o i-decline ang bawat request, at makipag-communicate sa mga buyer bago kumpirmahin."',
        route: '/profile',
        target: 'profile-orders',
      },
      {
        id: 'done',
        title: 'Handa ka na! 🎉',
        description:
          'Alam mo na ngayon ang lahat ng kailangan mo upang magsimula sa AniSave. Simulan ang pag-browse ng mga sariwang lokal na produkto, kumonekta sa mga magsasaka, at tamasahin ang mga patas na presyo!',
        route: '/homepage',
        target: null,
      },
    ],
  },
  hil: {
    label: 'Hiligaynon',
    skip: 'Laktawan',
    next: 'Sunod',
    back: 'Balik',
    finish: 'Tapuson',
    stepOf: (c, t) => `${c} sa ${t}`,
    navigating: 'Ginadala ka didto...',
    steps: [
      {
        id: 'welcome',
        title: '🌾 Maayon nga Pag-abot sa AniSave!',
        description:
          'Ang maabiabihon nga pagtudlo na ini magagabay sa imo sa kada bahin sang AniSave — ang imo direkta nga koneksyon sa mga sariwa nga produkto halin sa lokal nga mga mangunguma.',
        route: null,
        target: null,
      },
      {
        id: 'navbar',
        title: 'Navigation Bar',
        description:
          '"Ang berde nga bar sa ibabaw amo ang imo panguna nga navigation. Gamiton ini para maglukso sa Home, Categories, Contacts, kag imo Profile bisan kasan-o."',
        route: '/homepage',
        target: 'navbar',
      },
      {
        id: 'navbar-search',
        title: 'Pangitaon ang mga Mangunguma',
        description:
          '"Gamiton ang search bar para pangitaon ang mga mangunguma paagi sa ngalan o username. I-tap ang ila profile para makita kung ano nga mga produkto ang ila ginabaligya."',
        route: '/homepage',
        target: 'navbar-search',
      },
      {
        id: 'navbar-notifications',
        title: 'Mga Abiso',
        description:
          '"Ang bell icon nagapakita sang imo mga alerto — maabisuhan ka kung gin-aprubahan o gintanggihan sang mangunguma ang imo order."',
        route: '/homepage',
        target: 'navbar-notifications',
      },
      {
        id: 'navbar-cart',
        title: 'Imo Cart',
        description:
          '"Ang cart nagabutang sang imo mga pending kag approved nga order. I-tap ini bisan kasan-o para surion o pamahalaan ang imo mga pagbakal."',
        route: '/homepage',
        target: 'navbar-cart',
      },
      {
        id: 'navbar-chat',
        title: 'Mga Mensahe',
        description:
          '"Mag-chat direkta sa mga mangunguma para magpamangkot, makig-negotiate, o mag-coordinate sang imo delivery — tanan sa real time."',
        route: '/homepage',
        target: 'navbar-chat',
      },
      {
        id: 'dashboard-stats',
        title: 'Imo Dashboard',
        description:
          '"Ang apat ka card nagabuod sang imo aktibidad: Pinaka-mabenta nga produkto, Buod sang Benta, Imo Rating (average nga kasiyahan sang customer sa 5), kag total nga bilang sang Produkto."',
        route: '/homepage',
        target: 'dashboard-stats',
      },
      {
        id: 'product-cards',
        title: 'I-browse ang mga Produkto',
        description:
          '"Mag-scroll paidalom para makita ang tanan nga available nga pananom halin sa lokal nga mga mangunguma. Ang kada card nagapakita sang larawan, kategorya, ngalan, presyo kada kg, kag \'View Sellers\' nga pindutan."',
        route: '/homepage',
        target: 'product-cards',
      },
      {
        id: 'ai-advisor',
        title: 'AI Advisor',
        description:
          '"I-tap ang AI Advisor button para makakuha sang maalamon, personalized nga insight parte sa mga presyo sa merkado, mga tip sa pagbaligya, kag mga rekomendasyon sa pagpanguma."',
        route: '/homepage',
        target: 'ai-advisor',
      },
      {
        id: 'categories-intro',
        title: 'Pahina sang Categories',
        description:
          '"Ang Categories page nagapahanugot sa imo nga mag-browse sang tanan nga pananom ayon sa klase: Gulay, Prutas, Bugas, kag Pampalasa. I-tap ang bisan ano nga pananom para makita kung sin-o ang nagabaligya."',
        route: '/categories',
        target: 'categories-grid',
      },

      {
        id: 'product-sellers-intro',
        title: 'Detalye sang Produkto',
        description:
          '"Diri mo makita ang detalye sang isa ka produkto, pati na ang presyo sa merkado sini. Makabulig ini para makasiguro ka sa patas nga presyo."',
        route: '/product/Eggplant/sellers',
        target: 'product-details-card',
      },
      {
        id: 'product-sellers-list',
        title: 'Mga Available nga Mangunguma',
        description:
          '"Ginpapakita sang listahan nga ini ang tanan nga mangunguma nga nagabaligya sang produkto nga ini. Ikumpara ang ila presyo, stock, kag idugang ang mga item sa imo cart."',
        route: '/product/Eggplant/sellers',
        target: 'product-sellers-list',
      },
      {
        id: 'farmer-profile-intro',
        title: 'Profile sang Mangunguma',
        description:
          '"Kung bisitahon mo ang profile sang mangunguma, makita mo ang ila contact kag lokasyon. Pwede mo man sila i-save o i-chat sing direkta."',
        route: 'DYNAMIC_FARMER',
        target: 'farmer-profile-card',
      },
      {
        id: 'farmer-products',
        title: 'Mga Produkto sang Mangunguma',
        description:
          '"Mag-scroll paidalom para makita ang tanan nga produkto nga ginabaligya sang mangunguma nga ini. Pwede mo ini idugang sa imo cart halin diri."',
        route: 'DYNAMIC_FARMER',
        target: 'farmer-products-section',
      },
      {
        id: 'contacts-intro',
        title: 'Mga Na-save nga Contacts',
        description:
          '"Ang imo Contacts page nagasave sang tanan nga mga mangunguma nga ginkontak mo. Madali nga makita ang ila impormasyon, tan-awon ang ila profile, o i-rate sila pagkatapos sang transaksyon."',
        route: '/contacts',
        target: 'contacts-list',
      },
      {
        id: 'cart-intro',
        title: 'Cart kag Kasaysayan sang Order',
        description:
          '"Ang imo Cart nagapakita sang mga aktibo nga order nga nagahulat sang approval sang mangunguma. Ang History tab nagapahanugot sa imo nga surion ang tanan nga nakaaging transaksyon."',
        route: '/cart',
        target: 'cart-main',
      },
      {
        id: 'profile-info',
        title: 'Imo Profile',
        description:
          '"I-update ang imo ngalan, avatar, adres, kag contact number diri. Makikita sang mga buyer kag mangunguma ang imo pampubliko nga profile kung makipag-ugnayan ka sa ila."',
        route: '/profile',
        target: 'profile-info',
      },
      {
        id: 'profile-products',
        title: 'Pamahalaan ang Imo mga Produkto',
        description:
          '"Bilang mangunguma, diri mo ilista, ie-edit, kag tanggalon ang imo mga pananom. I-tap ang + button para magdugang sang bag-o nga produkto nga may larawan, presyo, kag dami."',
        route: '/profile',
        target: 'profile-products',
      },
      {
        id: 'profile-orders',
        title: 'Mga Order Request',
        description:
          '"Ang mga buyer nagapadala sang mga order request diri. Maaprubahan o matanggihan mo ang kada request, kag makipag-communicate sa mga buyer antes kumpirmahan."',
        route: '/profile',
        target: 'profile-orders',
      },
      {
        id: 'done',
        title: 'Handa ka na! 🎉',
        description:
          'Nahibal-an mo na karon ang tanan nga kinahanglan mo para magsugod sa AniSave. Magsugod sang pag-browse sang mga sariwa nga lokal nga produkto, kumonekta sa mga mangunguma, kag mag-enjoy sang mga patas nga presyo!',
        route: '/homepage',
        target: null,
      },
    ],
  },
};

// ─── DOM SELECTOR MAP ─────────────────────────────────────────────────────────
const SELECTORS = {
  navbar:              '[data-tutorial="mobile-bottom-bar"], nav[class*="bg-green-800"], nav[class*="green"]',
  'navbar-search':     '[data-tutorial="mobile-search-btn"], nav input[type="text"]',
  'navbar-notifications': '[data-tutorial="mobile-tab-alerts"], nav button[title="Notifications"]',
  'navbar-cart':       '[data-tutorial="mobile-tab-cart"], nav button[title="My Cart"], nav button[title="Cart"], nav a[href="/cart"]',
  'navbar-chat':       '[data-tutorial="mobile-tab-chat"], nav button[title="Messages"]',
  'dashboard-stats':   '[data-tutorial="dashboard-stats"]',
  'product-cards':     '[data-tutorial="product-cards"]',
  'ai-advisor':        '[data-tutorial="ai-advisor"]',
  'categories-grid':   '[data-tutorial="categories-grid"]',
  'categories-sellers':'[data-tutorial="categories-sellers"]',
  'market-info':       '[data-tutorial="market-info"]',
  'contacts-list':     '[data-tutorial="contacts-list"]',
  'cart-main':         '[data-tutorial="cart-main"]',
  'profile-info':      '[data-tutorial="profile-info"]',
  'profile-products':  '[data-tutorial="profile-products"]',
  'profile-orders':    '[data-tutorial="profile-orders"]',
  'product-details-card': '[data-tutorial="product-details-card"]',
  'product-sellers-list': '[data-tutorial="product-sellers-list"]',
  'farmer-profile-card': '[data-tutorial="farmer-profile-card"]',
  'farmer-products-section': '[data-tutorial="farmer-products-section"]',
};

function getRect(targetId) {
  if (!targetId) return null;
  const raw = SELECTORS[targetId];
  if (!raw) return null;
  for (const s of raw.split(',')) {
    const el = document.querySelector(s.trim());
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return { ...r.toJSON(), el };
    }
  }
  return null;
}

// ─── SPOTLIGHT ────────────────────────────────────────────────────────────────
function Spotlight({ rect, pad = 10 }) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[9990] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)' }}
      />
    );
  }

  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const r = Math.min(14, h / 2);

  const clip = `polygon(
    0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,
    ${x}px ${y + r}px,${x}px ${y + h - r}px,
    ${x + r}px ${y + h}px,${x + w - r}px ${y + h}px,
    ${x + w}px ${y + h - r}px,${x + w}px ${y + r}px,
    ${x + w - r}px ${y}px,${x + r}px ${y}px,
    ${x}px ${y + r}px
  )`;

  return (
    <>
      <div
        className="fixed inset-0 z-[9990] pointer-events-none transition-all duration-400"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)', clipPath: clip }}
      />
      <motion.div
        key={`${x}-${y}-${w}-${h}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="fixed z-[9991] pointer-events-none rounded-xl"
        style={{
          top: y - 3, left: x - 3, width: w + 6, height: h + 6,
          boxShadow: '0 0 0 3px #16a34a, 0 0 28px 8px rgba(22,163,74,0.4)',
          borderRadius: r + 3,
        }}
      />
    </>
  );
}

// ─── LANGUAGE PICKER ──────────────────────────────────────────────────────────
function LangPicker({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-bold text-green-800 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 hover:bg-green-100 transition-colors"
      >
        <Globe className="w-3 h-3" />
        {T[lang].label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.94 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[10001] overflow-hidden min-w-[130px]"
          >
            {Object.entries(T).map(([code, t]) => (
              <button
                key={code}
                onClick={() => { onChange(code); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors ${lang === code ? 'font-bold text-green-800 bg-green-50/70' : 'text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CARD POSITION LOGIC ─────────────────────────────────────────────────────
function cardPos(rect) {
  const PAD = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Bigger on desktop (480px), mobile fills width up to 310px
  const W = vw >= 768 ? 480 : Math.min(310, vw - 32);
  const H = vw >= 768 ? 300 : 280;

  if (!rect) return {
    top: '50%',
    left: '50%',
    _w: W,
  };

  const below = vh - rect.bottom - PAD;
  const above = rect.top - PAD;
  const right = vw - rect.right - PAD;
  const left  = rect.left - PAD;

  let top, leftVal;

  if (below >= H) {
    top = rect.bottom + PAD;
    leftVal = Math.min(Math.max(rect.left, PAD), vw - W - PAD);
  } else if (above >= H) {
    top = rect.top - H - PAD;
    leftVal = Math.min(Math.max(rect.left, PAD), vw - W - PAD);
  } else if (right >= W) {
    leftVal = rect.right + PAD;
    top = Math.min(Math.max(rect.top, PAD), vh - H - PAD);
  } else if (left >= W) {
    leftVal = rect.left - W - PAD;
    top = Math.min(Math.max(rect.top, PAD), vh - H - PAD);
  } else {
    top = vh / 2 - H / 2;
    leftVal = vw / 2 - W / 2;
  }
  return { top, left: leftVal, _w: W };
}

// ─── ELEVENLABS TTS ──────────────────────────────────────────────────────────
// Free plan: 10,000 credits/month — more than enough for a tutorial overlay.
// Add this to your .env file:
//   VITE_ELEVENLABS_API_KEY=your_api_key_here
//
// eleven_multilingual_v2 handles English, Tagalog, and Hiligaynon naturally.
// Voice: Rachel (21m00Tcm4TlvDq8ikWAM) — clear, neutral, multilingual.

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;
const ELEVENLABS_MODEL    = 'eleven_multilingual_v2';

function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef  = useRef(null);
  const objectURL = useRef(null);

  // Stop any currently playing audio and free memory
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectURL.current) {
      URL.revokeObjectURL(objectURL.current);
      objectURL.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text) => {
    stop();

    // Fallback to browser TTS if API key is missing
    if (!ELEVENLABS_API_KEY) {
      console.warn('VITE_ELEVENLABS_API_KEY not set — falling back to browser TTS');
      const utt = new SpeechSynthesisUtterance(text);
      window.speechSynthesis?.speak(utt);
      return;
    }

    setSpeaking(true);
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: ELEVENLABS_MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!res.ok) {
        console.error('ElevenLabs TTS error:', res.status, await res.text());
        setSpeaking(false);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      objectURL.current = url;

      const audio = new Audio(url);
      audioRef.current  = audio;
      audio.onended  = () => setSpeaking(false);
      audio.onerror  = () => setSpeaking(false);
      audio.play();
    } catch (err) {
      console.error('ElevenLabs TTS error:', err);
      setSpeaking(false);
    }
  }, [stop]);

  // Clean up when Card unmounts (step change / overlay close)
  useEffect(() => () => stop(), [stop]);

  return { speaking, speak, stop };
}

// ─── TOOLTIP CARD ─────────────────────────────────────────────────────────────
function Card({ step, idx, total, lang, onLang, onSkip, onBack, onNext, rect, navigating }) {
  const t = T[lang];
  const isFirst = idx === 0;
  const isLast  = idx === total - 1;
  const progress = ((idx + 1) / total) * 100;
  const { speaking, speak, stop } = useTTS();


  const isCentered = !step.target || !rect;
  const vw = window.innerWidth;
  const W = vw >= 768 ? 480 : Math.min(310, vw - 32);
  const pos = isCentered
    ? { top: '50%', left: '50%', _w: W }
    : cardPos(rect);

  return (
    <motion.div
      key={`${idx}-${lang}`}
      initial={{ opacity: 0, scale: 0.9, x: isCentered ? "-50%" : 0, y: isCentered ? "-45%" : 10 }}
      animate={{ opacity: 1, scale: 1, x: isCentered ? "-50%" : 0, y: isCentered ? "-50%" : 0 }}
      exit={{ opacity: 0, scale: 0.9, x: isCentered ? "-50%" : 0, y: isCentered ? "-45%" : 10 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="fixed z-[9999] bg-white rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: pos._w ?? 310, maxWidth: 'calc(100vw - 32px)', top: pos.top, left: pos.left }}
    >
      {/* Progress */}
      <div className="h-1 bg-gray-100">
        <motion.div
          className="h-full bg-green-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      <div className="p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <LangPicker lang={lang} onChange={onLang} />
          <div className="flex items-center gap-2">
            {/* TTS speaker button — uses free built-in Web Speech API */}
            {window.speechSynthesis && (
              <button
                onClick={() => speaking ? stop() : speak(`${step.title}. ${step.description.replace(/^"|"$/g, '')}`)}
                title={speaking ? 'Stop' : 'Read aloud'}
                className={`p-1.5 rounded-full transition-colors ${speaking ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
              >
                {speaking ? (
                  /* animated speaker wave */
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    <path d="M18.5 12a6.5 6.5 0 0 0-3.5-5.8v2.2a4.5 4.5 0 0 1 0 7.2v2.2a6.5 6.5 0 0 0 3.5-5.8z" opacity=".5"/>
                  </svg>
                ) : (
                  /* muted speaker */
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                )}
              </button>
            )}
            <span className="text-xs sm:text-sm text-gray-400 font-medium">{t.stepOf(idx + 1, total)}</span>
            <button onClick={() => { stop(); onSkip(); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex gap-1 mb-3 sm:mb-4 flex-wrap">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === idx ? 'w-4 sm:w-5 bg-green-700' : i < idx ? 'w-1.5 bg-green-700' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2 leading-snug">{step.title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.description}</p>

        {navigating && (
          <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-green-700 font-medium bg-green-50 rounded-lg px-3 py-2">
            <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            {t.navigating}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { stop(); onSkip(); }}
            className="px-3 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-green-800 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
          >
            {t.skip}
          </button>
        </div>
        <button
          onClick={onNext}
          disabled={navigating}
          className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold bg-green-800 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl shadow-sm transition-colors"
        >
          {isLast ? t.finish : t.next}
          {!isLast && <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── MAIN TUTORIAL OVERLAY ────────────────────────────────────────────────────
/**
 * Place <TutorialOverlay /> once in your App.jsx and wrap it with
 * <TutorialProvider>.
 *
 * It auto-shows for new users and navigates between pages as needed.
 */
export default function TutorialOverlay({ isOpen, onClose }) {
  const [lang, setLang]       = useState('en');
  const [idx, setIdx]         = useState(0);
  const [rect, setRect]       = useState(null);
  const [navigating, setNav]  = useState(false);
  const [dynamicFarmerId, setDynamicFarmerId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOpen && !dynamicFarmerId) {
      supabase.from('profiles').select('id').limit(1).then(({ data }) => {
        if (data && data.length > 0) {
          setDynamicFarmerId(data[0].id);
        }
      });
    }
  }, [isOpen, dynamicFarmerId]);

  const steps = T[lang].steps;
  const step  = steps[idx];

  // ── measure target element ─────────────────────────────────────────────────
  const measure = useCallback(() => {
    if (!step.target) { setRect(null); return; }
    const found = getRect(step.target);
    setRect(found);
  }, [step.target]);

  useEffect(() => {
    if (!isOpen) return;
    // small delay to let page render
    const tid = setTimeout(measure, 120);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(tid);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isOpen, idx, lang, location.pathname, measure]);

  // ── auto-navigate when step needs a different route ───────────────────────
  useEffect(() => {
    if (!isOpen || !step.route) return;
    
    let targetRoute = step.route;
    if (targetRoute === 'DYNAMIC_FARMER') {
      if (!dynamicFarmerId) return; // Wait until farmer ID is fetched
      targetRoute = `/farmer/${dynamicFarmerId}`;
    }

    const needsNav = !location.pathname.startsWith(targetRoute);
    if (needsNav) {
      setNav(true);
      navigate(targetRoute);
    }
  }, [isOpen, idx, dynamicFarmerId]); // eslint-disable-line

  // ── once navigation lands, stop spinner + re-measure ─────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setNav(false);
    setTimeout(measure, 300);
  }, [location.pathname]); // eslint-disable-line

  // ── scroll target into view ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !step.target) return;
    const raw = SELECTORS[step.target];
    if (!raw) return;
    for (const s of raw.split(',')) {
      const el = document.querySelector(s.trim());
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); break; }
    }
  }, [isOpen, idx, lang, location.pathname]);

  const close = useCallback(() => {
    setIdx(0);
    onClose?.();
  }, [onClose]);

  const handleNext = () => {
    if (idx < steps.length - 1) setIdx(i => i + 1);
    else close();
  };

  const handleBack = () => setIdx(i => Math.max(0, i - 1));

  const handleLang = (code) => {
    // keep step index in new language
    setLang(code);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Click-blocker (does NOT block the card itself) */}
      <div className="fixed inset-0 z-[9989]" />

      <Spotlight rect={rect} />

      <AnimatePresence mode="wait">
        <Card
          key={`${idx}-${lang}`}
          step={step}
          idx={idx}
          total={steps.length}
          lang={lang}
          onLang={handleLang}
          onSkip={close}
          onBack={handleBack}
          onNext={handleNext}
          rect={rect}
          navigating={navigating}
        />
      </AnimatePresence>
    </>,
    document.body
  );
}