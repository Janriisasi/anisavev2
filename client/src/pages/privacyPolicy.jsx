import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ArrowLeft,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

// const SmoothScroll = ({ children }) => {
//   const scrollRef = useRef(null);

//   useEffect(() => {
//     let scrollY = 0;
//     let currentY = 0;
//     const speed = 0.08;

//     const smoothScroll = () => {
//       scrollY = window.pageYOffset;
//       currentY += (scrollY - currentY) * speed;

//       if (scrollRef.current) {
//         scrollRef.current.style.transform = `translateY(-${currentY}px)`;
//       }

//       requestAnimationFrame(smoothScroll);
//     };

//     smoothScroll();

//     return () => {
//       if (scrollRef.current) {
//         scrollRef.current.style.transform = 'translateY(0)';
//       }
//     };
//   }, []);

//   return (
//     <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', willChange: 'transform' }} ref={scrollRef}>
//       {children}
//     </div>
//   );
// };

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
      alt="AniSave Logo"
      className="h-8 sm:h-10 lg:h-12 w-auto"
    />
  </button>
);

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sections = [
    {
      title: "Our Story",
      content:
        "AniSave was born from a simple yet powerful idea — to bridge the gap between farmers and buyers through technology. In many parts of the Philippines, local farmers struggle to find direct access to fair markets, often relying on middlemen who take a large portion of their profits. At the same time, buyers find it difficult to source fresh produce directly from trusted farmers.\n\nAniSave was created to change that reality — to give farmers a digital space where they can showcase their products, connect directly with buyers, and stay informed about real-time market prices.\n\nWe believe that empowering farmers with technology can lead to stronger communities, fairer trade, and sustainable livelihoods.",
    },
    {
      title: "Our Mission",
      content:
        "To empower Filipino farmers by providing a reliable digital platform that connects them directly with buyers, promotes transparency in pricing, and helps improve the overall flow of agricultural commerce in the country.\n\nWe aim to make agriculture more accessible, fair, and future-ready by using simple, user-friendly technology.",
    },
    {
      title: "Our Vision",
      content:
        "To build a digitally connected agricultural ecosystem where every Filipino farmer has equal opportunity to sell their harvest, monitor market trends, and grow their business sustainably. AniSave envisions a future where technology and agriculture work hand in hand to improve the lives of farmers and the quality of local food supply.",
    },
    {
      title: "What AniSave Does",
      content:
        "AniSave serves as a modern platform that simplifies how farmers and buyers interact:\n\n• Farmers can easily list their products, track market prices, and manage their profiles.\n• Buyers can browse, search, and connect with farmers to purchase fresh produce directly.\n• Both sides benefit from a transparent, efficient, and trustworthy environment.\n\nWith real-time price monitoring, category-based product discovery, and direct contact features, AniSave is transforming how agricultural trade happens in the Philippines.",
    },
    {
      title: "Our Objective",
      content:
        "To support and uplift the agricultural sector by:\n\n• Encouraging fair trade between farmers and consumers\n• Enhancing digital literacy among local producers\n• Promoting sustainability and transparency in the supply chain\n• Strengthening the connection between technology and farming",
    },
    {
      title: "Why AniSave Matters",
      content:
        "Agriculture is the heart of the Philippines — yet many farmers remain underserved in the digital world. AniSave aims to bridge that divide by being a platform built for farmers, by students who care about their growth. We're not just building an app; we're building a community where innovation meets compassion, helping ensure that every harvest finds its way to the right table.",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
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

      <section
        className="relative flex items-start justify-center overflow-hidden bg-[#024310] pt-20 pb-12 sm:pt-24 sm:pb-14 lg:pt-28 lg:pb-16"
        style={{
          backgroundImage: "url('/images/bg_feat.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            Privacy Policy
          </h1>
          <p className="text-white/90 text-sm sm:text-base lg:text-xl leading-relaxed max-w-2xl mx-auto">
            Understand how AniSave handles your information and protects your
            privacy.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-[#F5F5F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-lg sm:p-8 lg:p-10">
            <p className="text-[#666] text-base sm:text-lg leading-relaxed mb-10">
              <span className="text-green-800 font-bold">AniSave</span> is a
              digital platform dedicated to empowering{" "}
              <span className="text-green-800 font-bold">Filipino farmers</span>{" "}
              and connecting them with buyers for{" "}
              <span className="text-yellow-400 font-bold">
                fair and transparent{" "}
              </span>
              agricultural trade.
            </p>

            <div className="space-y-10">
              {sections.map((section, index) => (
                <div key={index}>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 mb-3">
                    {section.title}
                  </h2>
                  <div className="space-y-3 text-[#666] text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    <p>{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#D5E9D6] border-t border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
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

            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm tracking-wide uppercase">
                Platform
              </h5>
              <ul className="space-y-3">
                {[
                  "Market Prices",
                  "Product Directory",
                  "Farmer Profiles",
                  "Government Feed",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="/signup"
                      className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm tracking-wide uppercase">
                Company
              </h5>
              <ul className="space-y-3">
                {[
                  { label: "About Us", href: "/landing#about" },
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

            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm tracking-wide uppercase">
                Support
              </h5>
              <ul className="space-y-3">
                {["Help Center", "Contact Sales", "Live Support"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-slate-600 hover:text-[#00573C] transition-colors duration-300 text-sm"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>

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
