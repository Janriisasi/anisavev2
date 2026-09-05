// ─── TUTORIAL CONTENT ─────────────────────────────────────────────────────
// Auto-ported from the original tutorialOverlay.jsx translation data.
// UI_STRINGS: chrome text (buttons, progress label) per language.
// STEP_CONTENT: title/description per language, keyed by step id.
// STEP_ORDER + STEP_META: the single source of truth for step sequence,
// route, and DOM target — language-independent, so switching languages
// mid-tour can never desync step order the way the old per-language
// arrays could (the original Tagalog/Hiligaynon arrays had ai-advisor and
// product-cards swapped relative to English — this structure makes that
// class of bug impossible since order lives in exactly one place).

export const LANGUAGES = ["en","tl","hil"];

export const UI_STRINGS = {
  "en": {
    "label": "English",
    "skip": "Skip Tour",
    "next": "Next",
    "back": "Back",
    "finish": "Finish",
    "navigating": "Taking you there...",
    "stepOfTemplate": "{current} of {total}"
  },
  "tl": {
    "label": "Tagalog",
    "skip": "Laktawan",
    "next": "Susunod",
    "back": "Bumalik",
    "finish": "Tapusin",
    "navigating": "Dadalhin ka doon...",
    "stepOfTemplate": "{current} sa {total}"
  },
  "hil": {
    "label": "Hiligaynon",
    "skip": "Tapuson",
    "next": "Sunod",
    "back": "Balik",
    "finish": "Tapuson",
    "navigating": "Ginadala ka didto...",
    "stepOfTemplate": "{current} sa {total}"
  }
};

export const STEP_CONTENT = {
  "en": {
    "welcome": {
      "title": "🌾 Welcome to AniSave!",
      "description": "This quick tour will walk you through every part of AniSave — your direct link to fresh produce from local farmers. It only takes a minute!"
    },
    "navbar": {
      "title": "Navigation Bar",
      "description": "\"The green bar at the top is your main navigation. Use it to jump between Home, Categories, Contacts, and your Profile at any time.\""
    },
    "navbar-search": {
      "title": "Search Farmers",
      "description": "\"Use the search bar to find farmers by name or username. Tap their profile to see what fresh produce they're currently selling.\""
    },
    "navbar-notifications": {
      "title": "Notifications",
      "description": "\"The bell icon shows your alerts — you'll be notified when a farmer approves or declines one of your order requests.\""
    },
    "navbar-cart": {
      "title": "Your Cart",
      "description": "\"The cart holds your pending and approved orders. Tap it anytime to review, track, or manage your purchases.\""
    },
    "navbar-chat": {
      "title": "Messages",
      "description": "\"Chat directly with farmers to ask questions, negotiate prices, or coordinate your delivery — all in real time.\""
    },
    "dashboard-stats": {
      "title": "Your Dashboard",
      "description": "\"These four cards summarize your activity: your Best Selling product, Sales Summary, Your Rating (average customer satisfaction out of 5), and total Products you've listed.\""
    },
    "ai-advisor": {
      "title": "AI Advisor",
      "description": "\"Tap the AI Advisor button to get smart, personalized insights on market prices, selling tips, and farming recommendations — powered by AI.\""
    },
    "market-history": {
      "title": "Market Price History",
      "description": "\"Check the 30-day market price history based on Department of Agriculture data. This helps you track trends and ensure fair pricing.\""
    },
    "product-cards": {
      "title": "Browse Products",
      "description": "\"Scroll down to see all available crops from local farmers. Each card shows the product image, category, name, price per kg, and a 'View Sellers' button.\""
    },
    "categories-intro": {
      "title": "Categories Page",
      "description": "\"The Categories page lets you browse all crops grouped by type: Vegetables, Fruits, Grains, and Spices. Tap any crop to see who's selling it and at what price.\""
    },
    "product-sellers-intro": {
      "title": "Product Details",
      "description": "\"Here you can see the details of a specific product, including its market price. This helps you ensure you are getting a fair deal.\""
    },
    "product-sellers-list": {
      "title": "Available Farmers",
      "description": "\"This list shows all farmers selling this product. You can compare their prices, check their available stock, and add items directly to your cart.\""
    },
    "farmer-profile-intro": {
      "title": "Farmer Profile",
      "description": "\"When you visit a farmer's profile, you can see their contact details and location. You can also save them to your contacts or chat with them directly.\""
    },
    "farmer-products": {
      "title": "Farmer's Products",
      "description": "\"Scroll down to see all the products this farmer is currently selling. You can easily add these to your cart from here.\""
    },
    "contacts-intro": {
      "title": "Saved Contacts",
      "description": "\"Your Contacts page saves all the farmers you've interacted with. Quickly find their contact info, view their profile, or rate them after a transaction.\""
    },
    "cart-intro": {
      "title": "Cart & Order History",
      "description": "\"Your Cart shows active orders awaiting farmer approval. The History tab lets you review all past transactions and rate the farmers you've bought from.\""
    },
    "profile-info": {
      "title": "Your Profile",
      "description": "\"Update your name, avatar, address, and contact number here. Buyers and farmers can see your public profile when you interact with them.\""
    },
    "profile-products": {
      "title": "Manage Your Products",
      "description": "\"As a farmer, this is where you list, edit, and remove your produce. Tap the + button to add a new product with a photo, price, and quantity.\""
    },
    "profile-orders": {
      "title": "Order Requests",
      "description": "\"Buyers send you order requests here. You can approve or decline each request, and communicate with buyers via chat before confirming.\""
    },
    "done": {
      "title": "You're all set! 🎉",
      "description": "You now know everything you need to get started on AniSave. Start browsing fresh local produce, connect with farmers, and enjoy fair market prices!"
    }
  },
  "tl": {
    "welcome": {
      "title": "🌾 Maligayang pagdating sa AniSave!",
      "description": "Ang maikling pagtuturo na ito ay magagabay sa iyo sa bawat bahagi ng AniSave — ang iyong direktang koneksyon sa mga sariwang produkto mula sa mga lokal na magsasaka."
    },
    "navbar": {
      "title": "Navigation Bar",
      "description": "\"Ang berdeng bar sa itaas ay iyong pangunahing navigation. Gamitin ito upang lumipat sa Home, Categories, Contacts, at iyong Profile anumang oras.\""
    },
    "navbar-search": {
      "title": "Hanapin ang mga Magsasaka",
      "description": "\"Gamitin ang search bar upang mahanap ang mga magsasaka ayon sa pangalan o username. I-tap ang kanilang profile upang makita kung anong produkto ang kanilang ibinebenta.\""
    },
    "navbar-notifications": {
      "title": "Mga Abiso",
      "description": "\"Ang bell icon ay nagpapakita ng iyong mga alerto — maabisuhan ka kapag inaprubahan o tinanggihan ng magsasaka ang iyong order.\""
    },
    "navbar-cart": {
      "title": "Iyong Cart",
      "description": "\"Ang cart ay naglalaman ng iyong mga pending at approved na order. I-tap ito anumang oras upang suriin o pamahalaan ang iyong mga pagbili.\""
    },
    "navbar-chat": {
      "title": "Mga Mensahe",
      "description": "\"Makipag-chat nang direkta sa mga magsasaka upang magtanong, makipag-negotiate, o mag-coordinate ng iyong delivery — lahat sa real time.\""
    },
    "dashboard-stats": {
      "title": "Iyong Dashboard",
      "description": "\"Ang apat na card na ito ay nagbubuod ng iyong aktibidad: Pinakamabentang produkto, Buod ng Benta, Iyong Rating (average na kasiyahan ng customer sa 5), at kabuuang bilang ng Produkto.\""
    },
    "product-cards": {
      "title": "I-browse ang mga Produkto",
      "description": "\"Mag-scroll pababa upang makita ang lahat ng available na pananim mula sa mga lokal na magsasaka. Bawat card ay nagpapakita ng larawan, kategorya, pangalan, presyo bawat kg, at button na 'View Sellers'.\""
    },
    "ai-advisor": {
      "title": "AI Advisor",
      "description": "\"I-tap ang AI Advisor button upang makakuha ng matalinong, personalized na insight tungkol sa mga presyo sa merkado, mga tip sa pagbebenta, at mga rekomendasyon sa pagsasaka.\""
    },
    "market-history": {
      "title": "Market Price History",
      "description": "\"Suriin ang 14 hanggang 30 araw na kasaysayan ng presyo sa merkado batay sa datos ng Department of Agriculture. Nakakatulong ito upang masubaybayan ang mga trend at masiguro ang patas na presyo.\""
    },
    "categories-intro": {
      "title": "Pahina ng Categories",
      "description": "\"Ang Categories page ay nagbibigay-daan sa iyo na mag-browse ng lahat ng pananim ayon sa uri: Gulay, Prutas, Butil, at Pampalasa. I-tap ang anumang pananim upang makita kung sino ang nagbebenta nito.\""
    },
    "product-sellers-intro": {
      "title": "Detalye ng Produkto",
      "description": "\"Dito mo makikita ang detalye ng isang produkto, kabilang ang presyo sa merkado nito. Nakakatulong ito para makasiguro ka sa patas na presyo.\""
    },
    "product-sellers-list": {
      "title": "Mga Available na Magsasaka",
      "description": "\"Ipinapakita ng listahang ito ang lahat ng magsasakang nagbebenta ng produktong ito. Ikumpara ang kanilang presyo, stock, at ilagay ang mga item sa iyong cart.\""
    },
    "farmer-profile-intro": {
      "title": "Profile ng Magsasaka",
      "description": "\"Kapag binisita mo ang profile ng magsasaka, makikita mo ang kanilang contact at lokasyon. Maaari mo rin silang i-save o i-chat nang direkta.\""
    },
    "farmer-products": {
      "title": "Mga Produkto ng Magsasaka",
      "description": "\"Mag-scroll pababa upang makita ang lahat ng produkto na kasalukuyang ibinebenta ng magsasakang ito. Maaari mo itong direktang idagdag sa iyong cart mula rito.\""
    },
    "contacts-intro": {
      "title": "Mga Naka-save na Contacts",
      "description": "\"Ang iyong Contacts page ay nagsasave ng lahat ng mga magsasakang nakipag-ugnayan ka. Mabilis na mahanap ang kanilang impormasyon, tingnan ang kanilang profile, o i-rate sila pagkatapos ng transaksyon.\""
    },
    "cart-intro": {
      "title": "Cart at Kasaysayan ng Order",
      "description": "\"Ang iyong Cart ay nagpapakita ng mga aktibong order na naghihintay ng approval ng magsasaka. Ang tab na History ay nagpapahintulot sa iyo na suriin ang lahat ng nakaraang transaksyon.\""
    },
    "profile-info": {
      "title": "Iyong Profile",
      "description": "\"I-update ang iyong pangalan, avatar, address, at contact number dito. Makikita ng mga buyer at magsasaka ang iyong pampublikong profile kapag nakikipag-ugnayan ka sa kanila.\""
    },
    "profile-products": {
      "title": "Pamahalaan ang Iyong mga Produkto",
      "description": "\"Bilang magsasaka, dito mo ilista, ie-edit, at aalisin ang iyong mga pananim. I-tap ang + button upang magdagdag ng bagong produkto na may larawan, presyo, at dami.\""
    },
    "profile-orders": {
      "title": "Mga Order Request",
      "description": "\"Ang mga buyer ay nagpapadala ng mga order request dito. Maaari mong i-approve o i-decline ang bawat request, at makipag-communicate sa mga buyer bago kumpirmahin.\""
    },
    "done": {
      "title": "Handa ka na! 🎉",
      "description": "Alam mo na ngayon ang lahat ng kailangan mo upang magsimula sa AniSave. Simulan ang pag-browse ng mga sariwang lokal na produkto, kumonekta sa mga magsasaka, at tamasahin ang mga patas na presyo!"
    }
  },
  "hil": {
    "welcome": {
      "title": "🌾 Malipayon nga Pag-abot sa AniSave!",
      "description": "Ang maabiabihon nga pagtudlo nga ini magagabay sa imo sa kada bahin sang AniSave — ang imo direkta nga koneksyon sa mga sariwa nga produkto halin sa lokal nga mga mangunguma."
    },
    "navbar": {
      "title": "Navigation Bar",
      "description": "\"Ang berde nga bar sa ibabaw amo ang imo una nga navigation. Gamiton ini para makakadto ka sa Home, Categories, Contacts, kag imo Profile.\""
    },
    "navbar-search": {
      "title": "Pangitaon ang mga Mangunguma",
      "description": "\"Gamiton ang search bar para pangitaon ang mga mangunguma paagi sa ngalan ukon ila username. I-tap ang ila profile para makita kung ano nga mga produkto ang ila ginabaligya.\""
    },
    "navbar-notifications": {
      "title": "Mga Abiso",
      "description": "\"Ang bell icon nagapakita sang imo mga alerto — maabisuhan ka kung gin-aprubahan o wala pa sang mangunguma ang imo order.\""
    },
    "navbar-cart": {
      "title": "Imo Cart",
      "description": "\"Ang cart nagabutang sang imo mga pending kag aprubado nga order. I-tap ini bisan kasan-o para makita ukon pamahalaan ang imo mga pagbakal.\""
    },
    "navbar-chat": {
      "title": "Mga Chat",
      "description": "\"Mag-chat direkta sa mga mangunguma ukon manugbakal para magpamangkot, makipagnegosyar, ukon mag-coordinate sang delivery — tanan direkta.\""
    },
    "dashboard-stats": {
      "title": "Imo Dashboard",
      "description": "\"Ang apat ka card nagapakita sang imo mga aktibidad: Pinaka-mabenta nga produkto, Imo benta, Imo Rating (average nga kasiyahan sang customer sa 5), kag total nga bilin sang imo produkto.\""
    },
    "product-cards": {
      "title": "I-browse ang mga Produkto",
      "description": "\"Mag-scroll paidalom para makita ang tanan nga available nga pananom halin sa lokal nga mga mangunguma. Ang kada card nagapakita sang larawan, kategorya, ngalan, presyo kada kilo ukon sinako, kag 'View Sellers' nga pindutan.\""
    },
    "ai-advisor": {
      "title": "AI Advisor",
      "description": "\"I-tap ang AI Advisor button para makakuha sang maalamon, personalized nga insight parte sa mga presyo sa merkado, mga tip sa pagbaligya, kag mga rekomendasyon sa pagpanguma.\""
    },
    "market-history": {
      "title": "Market Price History",
      "description": "\"Makit-an mo diri ang presyo sa merkado sang mga produkto base sa datos sang Department of Agriculture. Makabulig ini para mabantayan ang mga presyo kag masiguro ang patas nga presyo.\""
    },
    "categories-intro": {
      "title": "Pahina sang Categories",
      "description": "\"Ang Categories page nagapahanugot sa imo nga mag-browse sang tanan nga pananom nga naayon sa klase: Gulay, Prutas, Bugas, kag Pampalasa. I-tap ang bisan ano nga pananom para makita kung sin-o ang nagabaligya.\""
    },
    "product-sellers-intro": {
      "title": "Detalye sang Produkto",
      "description": "\"Diri mo makita ang detalye sang isa ka produkto, pati na ang presyo sa merkado sini. Makabulig ini para makasiguro ka sa patas nga presyo.\""
    },
    "product-sellers-list": {
      "title": "Mga Available nga Mangunguma",
      "description": "\"Ginpapakita sang listahan nga ini ang tanan nga mangunguma nga nagabaligya sang produkto nga ini. Ikumpara ang ila presyo, stock, kag idugang ang mga item sa imo cart.\""
    },
    "farmer-profile-intro": {
      "title": "Profile sang Mangunguma",
      "description": "\"Kung bisitahon mo ang profile sang mangunguma, makita mo ang ila contact kag lokasyon. Pwede mo man sila i-save o i-chat sing direkta.\""
    },
    "farmer-products": {
      "title": "Mga Produkto sang Mangunguma",
      "description": "\"Mag-scroll paidalom para makita ang tanan nga produkto nga ginabaligya sang mangunguma nga ini. Pwede mo ini idugang sa imo cart mismo.\""
    },
    "contacts-intro": {
      "title": "Mga Na-save nga Contacts",
      "description": "\"Ang imo Contacts page nagasave sang tanan nga mga mangunguma nga gin-save mo. Madali nga makita ang ila impormasyon, tan-awon ang ila profile, o i-rate sila pagkatapos sang transaksyon.\""
    },
    "cart-intro": {
      "title": "Cart kag Kasaysayan sang Order",
      "description": "\"Ang imo Cart nagapakita sang mga aktibo nga order nga nagahulat sang approval sang mangunguma. Ang History tab nagapahanugot sa imo nga surion ang tanan nga nakaaging transaksyon.\""
    },
    "profile-info": {
      "title": "Imo Profile",
      "description": "\"I-update ang imo ngalan, avatar, address, kag contact number diri. Makikita sang mga buyer kag mangunguma ang imo pampubliko nga profile kung makipag-ugnayan ka sa ila.\""
    },
    "profile-products": {
      "title": "Pamahalaan ang Imo mga Produkto",
      "description": "\"Bilang mangunguma, diri mo ilista, ie-edit, kag tanggalon ang imo mga pananom. I-tap ang + button para magdugang sang bag-o nga produkto nga may larawan, presyo, kag stock.\""
    },
    "profile-orders": {
      "title": "Mga Order Request",
      "description": "\"Ang mga buyer nagapadala sang mga order request diri. Maaprubahan ukon indi mo ang kada request, kag makipag-communicate sa mga buyer antes kumpirmahon ila order.\""
    },
    "done": {
      "title": "Handa ka na! 🎉",
      "description": "Nahibal-an mo na karon ang tanan nga kinahanglan mo para magsugod sa AniSave. Magsugod sang pag-browse sang mga sariwa nga lokal nga produkto, magkonekta sa mga mangunguma kag manugbakal, kag mag-enjoy sang patas nga presyo!"
    }
  }
};

export const STEP_ORDER = [
  "welcome",
  "navbar",
  "navbar-search",
  "navbar-notifications",
  "navbar-cart",
  "navbar-chat",
  "dashboard-stats",
  "ai-advisor",
  "market-history",
  "product-cards",
  "categories-intro",
  "product-sellers-intro",
  "product-sellers-list",
  "farmer-profile-intro",
  "farmer-products",
  "contacts-intro",
  "cart-intro",
  "profile-info",
  "profile-orders",
  "profile-products",
  "done"
];

export const STEP_META = {
  "welcome": {
    "route": null,
    "target": null
  },
  "navbar": {
    "route": "/homepage",
    "target": "navbar"
  },
  "navbar-search": {
    "route": "/homepage",
    "target": "navbar-search"
  },
  "navbar-notifications": {
    "route": "/homepage",
    "target": "navbar-notifications"
  },
  "navbar-cart": {
    "route": "/homepage",
    "target": "navbar-cart"
  },
  "navbar-chat": {
    "route": "/homepage",
    "target": "navbar-chat"
  },
  "dashboard-stats": {
    "route": "/homepage",
    "target": "dashboard-stats"
  },
  "ai-advisor": {
    "route": "/homepage",
    "target": "ai-advisor"
  },
  "market-history": {
    "route": "/homepage",
    "target": "market-info"
  },
  "product-cards": {
    "route": "/homepage",
    "target": "product-cards"
  },
  "categories-intro": {
    "route": "/categories",
    "target": "categories-grid"
  },
  "product-sellers-intro": {
    "route": "/product/Eggplant/sellers",
    "target": "product-details-card"
  },
  "product-sellers-list": {
    "route": "/product/Eggplant/sellers",
    "target": "product-sellers-list"
  },
  "farmer-profile-intro": {
    "route": "DYNAMIC_FARMER",
    "target": "farmer-profile-card"
  },
  "farmer-products": {
    "route": "DYNAMIC_FARMER",
    "target": "farmer-products-section"
  },
  "contacts-intro": {
    "route": "/contacts",
    "target": "contacts-list"
  },
  "cart-intro": {
    "route": "/cart",
    "target": "cart-main"
  },
  "profile-info": {
    "route": "/profile",
    "target": "profile-info"
  },
  "profile-orders": {
    "route": "/profile",
    "target": "profile-orders"
  },
  "profile-products": {
    "route": "/profile",
    "target": "profile-products"
  },
  "done": {
    "route": "/homepage",
    "target": null
  }
};

export const SELECTORS = {
  "navbar": "[data-tutorial=\"mobile-bottom-bar\"], nav[class*=\"bg-green-800\"], nav[class*=\"green\"]",
  "navbar-search": "[data-tutorial=\"mobile-search-btn\"], [data-tutorial=\"desktop-search-btn\"], nav input[type=\"text\"]",
  "navbar-notifications": "[data-tutorial=\"mobile-tab-alerts\"], nav button[title=\"Notifications\"]",
  "navbar-cart": "[data-tutorial=\"mobile-tab-cart\"], nav button[title=\"My Cart\"], nav button[title=\"Cart\"], nav a[href=\"/cart\"]",
  "navbar-chat": "[data-tutorial=\"mobile-tab-chat\"], nav button[title=\"Messages\"]",
  "dashboard-stats": "[data-tutorial=\"dashboard-stats\"]",
  "product-cards": "[data-tutorial=\"product-card-first\"], [data-tutorial=\"product-cards\"]",
  "ai-advisor": "[data-tutorial=\"ai-advisor\"]",
  "categories-grid": "[data-tutorial=\"categories-grid\"]",
  "categories-sellers": "[data-tutorial=\"categories-sellers\"]",
  "market-info": "[data-tutorial=\"market-info\"]",
  "contacts-list": "[data-tutorial=\"contacts-list\"]",
  "cart-main": "[data-tutorial=\"cart-first-item\"], [data-tutorial=\"cart-tabs\"]",
  "profile-info": "[data-tutorial=\"profile-info\"]",
  "profile-products": "[data-tutorial=\"profile-products\"]",
  "profile-orders": "[data-tutorial=\"profile-orders\"]",
  "product-details-card": "[data-tutorial=\"product-details-card\"]",
  "product-sellers-list": "[data-tutorial=\"product-sellers-list\"]",
  "farmer-profile-card": "[data-tutorial=\"farmer-profile-card\"]",
  "farmer-products-section": "[data-tutorial=\"farmer-products-section\"]"
};

export function formatStepOf(lang, current, total) {
  const template = UI_STRINGS[lang]?.stepOfTemplate || UI_STRINGS.en.stepOfTemplate;
  return template.replace('{current}', current).replace('{total}', total);
}