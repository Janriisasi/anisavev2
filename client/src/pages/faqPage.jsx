import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Search,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

// Same inline Button primitive used across every marketing/public page
// (landing, download) so the look stays identical site-wide.
const Button = ({
  className,
  variant = "default",
  size = "md",
  children,
  onClick,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variantStyles = {
    default:
      "bg-[#024310] hover:bg-[#035815] text-white shadow-lg hover:shadow-xl focus-visible:ring-[#024310]/50",
    outline:
      "bg-white text-[#024310] hover:bg-gray-50 border border-gray-300 shadow-sm hover:shadow-md focus-visible:ring-[#024310]/50",
    secondary:
      "bg-white text-[#00573C] hover:bg-gray-50 shadow-sm hover:shadow-md focus-visible:ring-[#024310]/50",
    ghost:
      "bg-transparent text-white hover:bg-white/10 border border-white/10 focus-visible:ring-white/50",
  };

  const sizeStyles = {
    sm: "h-8 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm rounded-md",
    md: "h-10 px-4 text-sm sm:h-12 sm:px-6 sm:text-base rounded-lg",
    lg: "h-12 px-5 text-base sm:h-14 sm:px-8 sm:text-lg rounded-lg",
  };

  return (
    <button
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Logo = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
  >
    <img
      src="/images/anisave_logo.webp"
      alt="Anisave Logo"
      className="h-8 sm:h-10 lg:h-12 w-auto"
    />
  </button>
);

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const categories = [
  "All",
  "Getting Started",
  "Market Prices & Selling",
  "Account & Security",
  "App & Downloads",
  "Payments & Fees",
];

const faqs = [
  {
    id: "what-is-anisave",
    category: "Getting Started",
    question: "What is AniSave?",
    answer:
      "AniSave is a marketplace and market-intelligence app built for Filipino farmers. It gives you real-time crop prices, connects you directly with buyers and sellers, and puts an AI market advisor in your pocket \u2014 all in one place.",
  },
  {
    id: "is-it-free",
    category: "Getting Started",
    question: "Is AniSave free to use?",
    answer:
      "Yes. Creating an account, browsing market prices, and messaging other users is completely free. Some optional seller tools may carry a small fee, which is always shown to you before you confirm.",
  },
  {
    id: "who-can-use",
    category: "Getting Started",
    question: "Who can use AniSave?",
    answer:
      "AniSave is open to farmers, cooperatives, traders, and buyers anywhere in the Philippines. Anyone can sign up with a valid email address \u2014 no special certification is required to start browsing prices.",
  },
  {
    id: "price-updates",
    category: "Market Prices & Selling",
    question: "How often are market prices updated?",
    answer:
      "Market prices are refreshed regularly throughout the day using data sourced in partnership with the Department of Agriculture's price protection program, so you're always working with current numbers.",
  },
  {
    id: "list-product",
    category: "Market Prices & Selling",
    question: "How do I list a product for sale?",
    answer:
      "From your profile, tap \u201cSell a Product,\u201d fill in the crop details, quantity, and asking price, then publish. Your listing becomes visible to buyers browsing the product directory right away.",
  },
  {
    id: "ai-advisor",
    category: "Market Prices & Selling",
    question: "Can I chat with an AI market advisor?",
    answer:
      "Yes. The built-in AI Advisor answers questions about pricing trends and crop planning in Tagalog, so you can get quick, plain-language guidance without digging through charts.",
  },
  {
    id: "reset-password",
    category: "Account & Security",
    question: "How do I reset my password?",
    answer:
      "Tap \u201cForgot Password\u201d on the login screen and enter your email. We'll send you a one-time code to verify it's really you, then let you set a new password right away.",
  },
  {
    id: "otp-code",
    category: "Account & Security",
    question: "Why did I receive a 6-digit code by email?",
    answer:
      "That's your one-time verification code (OTP). We use email OTP instead of authenticator apps so the extra security step stays simple, even if you're new to smartphones.",
  },
  {
    id: "data-safety",
    category: "Account & Security",
    question: "Is my personal information safe?",
    answer:
      "Your data is protected with role-based access controls and encrypted connections, and we routinely audit our systems for vulnerabilities. We never sell your personal information to third parties.",
  },
  {
    id: "platforms",
    category: "App & Downloads",
    question: "Which platforms is AniSave available on?",
    answer:
      "AniSave runs on Android, iOS (via TestFlight), Windows, and macOS. Visit the Download page and we'll automatically point you to the right build for your device.",
  },
  {
    id: "android-warning",
    category: "App & Downloads",
    question: "Why does my phone warn me about installing the APK?",
    answer:
      "Android shows an \u201cinstall from unknown sources\u201d prompt for any app installed outside the Play Store, including AniSave's direct APK. This is expected \u2014 simply allow it to continue.",
  },
  {
    id: "desktop-warning",
    category: "App & Downloads",
    question:
      "Why does Windows or macOS show a security warning during install?",
    answer:
      "Our desktop installers aren't code-signed yet, so Windows SmartScreen or macOS Gatekeeper may flag them the first time. Choosing \u201cRun anyway\u201d or right-click \u2192 Open resolves it safely.",
  },
  {
    id: "commission",
    category: "Payments & Fees",
    question: "Does AniSave charge a commission on sales?",
    answer:
      "Browsing, listing, and messaging are free. Any transaction-related fee is disclosed up front on the listing before you confirm a sale, so there are never hidden charges.",
  },
  {
    id: "payment-methods",
    category: "Payments & Fees",
    question: "What payment methods are supported?",
    answer:
      "Buyers and sellers arrange payment directly with each other, and AniSave supports common options like GCash, bank transfer, and cash on meetup \u2014 whichever works best for both parties.",
  },
];

export default function FaqPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;
    const matchesQuery =
      query.trim() === "" ||
      faq.question.toLowerCase().includes(query.trim().toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-12 sm:h-14 lg:h-18 flex items-center justify-between mt-1 sm:mt-2">
          <Logo onClick={() => navigate("/landing")} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/landing")}
            className="gap-1.5 sm:gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="relative flex items-start justify-center overflow-hidden bg-[#024310] pt-20 pb-12 sm:pt-24 sm:pb-14 lg:pt-28 lg:pb-16"
        style={{
          backgroundImage: "url('/images/bg_feat.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-white/90 text-sm sm:text-base lg:text-xl leading-relaxed max-w-3xl mx-auto">
            Everything you need to know about using AniSave — from your
            first login to your next sale.
          </p>
        </div>
      </section>

      {/* Search + category filter */}
      <section className="py-10 sm:py-12 bg-[#F5F5F5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative mb-6">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a question..."
              className="w-full h-12 sm:h-14 pl-11 pr-4 rounded-xl border border-black/10 bg-white text-sm sm:text-base text-[#024310] placeholder:text-[#9a9a9a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#024310]/30 transition-shadow"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300 ${
                    isActive
                      ? "bg-[#024310] border-[#024310] text-white shadow-md"
                      : "bg-white border-black/10 text-[#00573C] hover:bg-[#D5E9D6]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ list */}
      <section
        className="py-12 sm:py-16 lg:py-20 bg-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/bg_privacy.png')" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#726767] text-sm sm:text-base">
                No questions match your search. Try a different keyword, or
                contact our support team below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <details
                  key={faq.id}
                  className="group bg-[#F5F5F5] rounded-xl border border-black/5 open:shadow-md transition-shadow"
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 sm:px-6 py-4 sm:py-5">
                    <span className="font-semibold text-[#00573C] text-sm sm:text-base">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-[#00573C] transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-[#726767] text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still need help CTA */}
      <section className="py-12 sm:py-16 lg:py-20 bg-[#F5F5F5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#726767] text-xs sm:text-sm font-bold uppercase tracking-wide mb-2 sm:mb-3">
            Still need help?
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00573C] mb-8 sm:mb-10">
            Our Experts are Standing by
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto sm:min-w-[180px]"
              onClick={() =>
                (window.location.href = "mailto:anisave14@gmail.com")
              }
            >
              Contact Support
            </Button>
            <Button
              variant="default"
              size="md"
              className="w-full sm:w-auto sm:min-w-[180px]"
              onClick={() => navigate("/download")}
            >
              Get the App
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#D5E9D6] border-t border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
            {/* Brand col */}
            <div className="sm:col-span-2 lg:col-span-1">
              <img
                className="w-36 h-auto mb-4"
                src="/images/invertedcolor_logo.webp"
                alt="AniSave Logo"
              />
              <p className="text-slate-600 text-sm mt-4 mb-6 max-w-xs leading-relaxed">
                Modernizing Filipino agriculture through data, community, and
                technology. Empowering the hands that feed the nation.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://facebook.com"
                  aria-label="Facebook"
                  className="text-slate-500 hover:text-[#00573C] transition-colors duration-300 transform hover:scale-110"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://instagram.com"
                  aria-label="Instagram"
                  className="text-slate-500 hover:text-[#00573C] transition-colors duration-300 transform hover:scale-110"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://linkedin.com"
                  aria-label="LinkedIn"
                  className="text-slate-500 hover:text-[#00573C] transition-colors duration-300 transform hover:scale-110"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm tracking-wide uppercase">
                Platform
              </h5>
              <ul className="space-y-3">
                {["Market Prices", "Product Directory", "Farmer Profiles"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="/signup"
                        className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm tracking-wide uppercase">
                Company
              </h5>
              <ul className="space-y-3">
                {[
                  { label: "About Us", href: "#about" },
                  { label: "FAQ", href: "/faq" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Install */}
            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm tracking-wide uppercase">
                Download
              </h5>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/download"
                    className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                  >
                    Download for Android
                  </a>
                </li>
                <li>
                  <a
                    href="/download"
                    className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                  >
                    Download for IOS
                  </a>
                </li>
                <li>
                  <a
                    href="/download"
                    className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                  >
                    Download for Windows
                  </a>
                </li>
                <li>
                  <a
                    href="/download"
                    className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                  >
                    Download for MacOS
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#ECEFF2] border-t border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-slate-500 text-sm text-center sm:text-left">
              © 2025 AniSave. All rights reserved. Proudly made in the
              Philippines.
            </p>
            <button
              onClick={scrollToTop}
              className="bg-[#024310] hover:bg-[#035815] text-white rounded-full p-2.5 shadow-md transition-all duration-300"
              aria-label="Scroll to top"
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}