import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ArrowLeft,
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
      title: "1. Introduction",
      content:
        "AniSave is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard your personal information when you use our agricultural marketplace platform.",
    },
    {
      title: "2. Information We Collect",
      content:
        "We collect information that you provide directly to us when you create an account, complete your profile, list products, or communicate with other users:\n\n• Account Information: Name, email address, username, password, and authentication metadata.\n• Profile & Business Information: For farmers, this may include your contact details, farm location, product descriptions, prices, and images. For buyers, this may include feedback and ratings.\n• Communications: Messages, questions, and inquiries sent directly through the platform's contact and chat features.",
    },
    {
      title: "3. How We Use Your Information",
      content:
        "We use the collected information for various purposes, including to:\n\n• Provide, operate, and maintain the AniSave platform and marketplace.\n• Enable direct communication and commerce transactions between farmers and buyers.\n• Display farmer product listings and profiles to potential buyers.\n• Send updates, announcements, system notifications, and security alerts.\n• Monitor, analyze, and improve platform performance, usability, and safety.",
    },
    {
      title: "4. Information Sharing and Visibility",
      content:
        "AniSave is a public agricultural marketplace. Please be aware of how your information is shared:\n\n• Public Profiles: Farmer profiles, product listings, prices, and public contact information are visible to all platform users and visitors.\n• No Sale of Data: We do not sell, rent, or trade your personal data to third parties for marketing purposes.\n• Legal Requirements: We may disclose your information if required to do so by law or in response to valid requests by public authorities.",
    },
    {
      title: "5. Data Security & Storage",
      content:
        "We employ industry-standard security measures (supported by our database provider, Supabase) to protect the confidentiality and integrity of your data. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.",
    },
    {
      title: "6. Your Rights & Choices",
      content:
        "You have control over your information:\n\n• Account Information: You can access, review, and update your profile information at any time by logging into your account.\n• Account Deletion: You may delete or deactivate your account. Note that certain cached or public listing info may remain visible in archive forms.",
    },
    {
      title: "7. Changes to this Policy",
      content:
        "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date at the top of the policy.",
    },
    {
      title: "8. Contact Us",
      content:
        "If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at anisave14@gmail.com.",
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
              This Privacy Policy outlines how <span className="text-green-800 font-bold">AniSave</span> collects, uses, and safeguards your personal data. Please read it carefully to understand our commitment to protecting your information in our agricultural marketplace.
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
          <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-12 mb-10">
            <div className="lg:max-w-xs lg:shrink-0">
              <img
                className="w-36 h-auto mb-4"
                src="/images/invertedcolor_logo.webp"
                alt="AniSave Logo"
              />
              <p className="text-slate-600 text-sm mt-4 mb-6 max-w-xs leading-relaxed">
                Modernizing Filipino agriculture through data, community, and
                technology. Empowering the hands that feed the nation.
              </p>
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

        <div className="bg-[#ECEFF2] border-t border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <span className="hidden sm:block" aria-hidden="true" />
            <p className="text-slate-500 text-sm text-center">
              © 2026 Anisave. All rights reserved.
            </p>
            <button
              onClick={scrollToTop}
              className="bg-[#024310] hover:bg-[#035815] text-white rounded-full p-2.5 shadow-md transition-all duration-300 sm:justify-self-end"
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