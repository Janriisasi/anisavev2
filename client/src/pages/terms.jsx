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
//         scrollRef.current.style.transform = "translateY(0)";
//       }
//     };
//   }, []);

//   return (
//     <div style={{ position: "fixed", top: 0, left: 0, width: "100%", willChange: "transform" }} ref={scrollRef}>
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

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

export default function TermsOfService() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sections = [
    {
      title: "1. Overview",
      content:
        "AniSave is an online platform designed to connect farmers and buyers to promote efficient agricultural commerce. The platform enables users to list products, view prices, communicate, and engage in transactions in a transparent and user-friendly environment.",
    },
    {
      title: "2. Acceptance of Terms",
      content:
        "By creating an account or using AniSave, you confirm that you are at least 18 years old or have legal permission from a guardian. You agree to comply with these Terms and all applicable laws. AniSave may modify or update these Terms at any time, and continued use constitutes acceptance of any changes.",
    },
    {
      title: "3. User Accounts",
      content:
        "Users must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your account credentials. AniSave is not liable for any loss or damage resulting from unauthorized access to your account.",
    },
    {
      title: "4. Use of the Platform",
      content:
        "You agree to use AniSave solely for lawful purposes. You must not post false, misleading, or inappropriate content; attempt to hack or disrupt the system; or engage in fraudulent activities. Violations may result in account suspension or termination.",
    },
    {
      title: "5. Product Listings and Transactions",
      content:
        "Farmers are responsible for the accuracy and quality of their product listings. Buyers are responsible for verifying product details. AniSave acts only as a connecting platform and is not involved in payments, deliveries, or disputes between users.",
    },
    {
      title: "6. Data Privacy",
      content:
        "Your personal data is handled according to our Privacy Policy. By using AniSave, you consent to the collection and use of your data for purposes related to account management, platform operation, and improvement.",
    },
    {
      title: "7. Intellectual Property",
      content:
        "All materials, designs, and code associated with AniSave are owned or licensed by the platform. Users may not copy, modify, or distribute any part of AniSave without written permission.",
    },
    {
      title: "8. Limitation of Liability",
      content:
        "AniSave is provided 'as is' and 'as available'. We make no guarantees regarding the accuracy of listings or uninterrupted service. AniSave and its developers are not liable for any losses or damages resulting from the use or inability to use the platform.",
    },
    {
      title: "9. Termination",
      content:
        "AniSave reserves the right to suspend or terminate accounts for policy violations, fraudulent activity, or misuse of the platform. Upon termination, all rights granted to the user under these Terms immediately cease.",
    },
    {
      title: "10. Contact Us",
      content:
        "For questions or concerns about these Terms, you may contact us at anisave.team@gmail.com.",
    },
  ];

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
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
            Terms of Service
          </h1>
          <p className="text-white/90 text-sm sm:text-base lg:text-xl leading-relaxed max-w-2xl mx-auto">
            Understand the rules and responsibilities of using AniSave.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-[#F5F5F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-lg sm:p-8 lg:p-10">
            <p className="text-[#666] text-base sm:text-lg leading-relaxed mb-10">
              These Terms of Service outline your rights and obligations when
              using <span className="text-green-800 font-bold">AniSave</span>.
              Please read them carefully to ensure a safe and transparent
              experience on our platform.
            </p>

            <div className="space-y-10">
              {sections.map((section, index) => (
                <div key={index}>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 mb-3">
                    {section.title}
                  </h2>
                  <p className="text-[#666] text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
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
