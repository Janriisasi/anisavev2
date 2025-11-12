import React, { useEffect, useState, useRef } from "react";
import { ChevronUp, ArrowLeft, Facebook, Instagram, Linkedin } from "lucide-react";

const SmoothScroll = ({ children }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    let scrollY = 0;
    let currentY = 0;
    const speed = 0.08;

    const smoothScroll = () => {
      scrollY = window.pageYOffset;
      currentY += (scrollY - currentY) * speed;

      if (scrollRef.current) {
        scrollRef.current.style.transform = `translateY(-${currentY}px)`;
      }

      requestAnimationFrame(smoothScroll);
    };

    smoothScroll();
    return () => {
      if (scrollRef.current) {
        scrollRef.current.style.transform = "translateY(0)";
      }
    };
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", willChange: "transform" }} ref={scrollRef}>
      {children}
    </div>
  );
};

const Logo = () => (
  <a href="/" className="flex items-center gap-2 transition-all duration-300 cursor-pointer">
    <button className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
      <img src="/images/invertedcolor_logo.webp" alt="Logo" className="h-12 w-auto" />
    </button>
  </a>
);

const navLinks = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "about", label: "About Us" }
];

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

export default function TermsOfService() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef(null);

  const sections = [
    {
      title: "1. Overview",
      content:
        "AniSave is an online platform designed to connect farmers and buyers to promote efficient agricultural commerce. The platform enables users to list products, view prices, communicate, and engage in transactions in a transparent and user-friendly environment."
    },
    {
      title: "2. Acceptance of Terms",
      content:
        "By creating an account or using AniSave, you confirm that you are at least 18 years old or have legal permission from a guardian. You agree to comply with these Terms and all applicable laws. AniSave may modify or update these Terms at any time, and continued use constitutes acceptance of any changes."
    },
    {
      title: "3. User Accounts",
      content:
        "Users must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your account credentials. AniSave is not liable for any loss or damage resulting from unauthorized access to your account."
    },
    {
      title: "4. Use of the Platform",
      content:
        "You agree to use AniSave solely for lawful purposes. You must not post false, misleading, or inappropriate content; attempt to hack or disrupt the system; or engage in fraudulent activities. Violations may result in account suspension or termination."
    },
    {
      title: "5. Product Listings and Transactions",
      content:
        "Farmers are responsible for the accuracy and quality of their product listings. Buyers are responsible for verifying product details. AniSave acts only as a connecting platform and is not involved in payments, deliveries, or disputes between users."
    },
    {
      title: "6. Data Privacy",
      content:
        "Your personal data is handled according to our Privacy Policy. By using AniSave, you consent to the collection and use of your data for purposes related to account management, platform operation, and improvement."
    },
    {
      title: "7. Intellectual Property",
      content:
        "All materials, designs, and code associated with AniSave are owned or licensed by the platform. Users may not copy, modify, or distribute any part of AniSave without written permission."
    },
    {
      title: "8. Limitation of Liability",
      content:
        "AniSave is provided 'as is' and 'as available'. We make no guarantees regarding the accuracy of listings or uninterrupted service. AniSave and its developers are not liable for any losses or damages resulting from the use or inability to use the platform."
    },
    {
      title: "9. Termination",
      content:
        "AniSave reserves the right to suspend or terminate accounts for policy violations, fraudulent activity, or misuse of the platform. Upon termination, all rights granted to the user under these Terms immediately cease."
    },
    {
      title: "10. Contact Us",
      content:
        "For questions or concerns about these Terms, you may contact us at anisave.team@gmail.com."
    }
  ];

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (contentRef.current) document.body.style.height = `${contentRef.current.offsetHeight}px`;
    return () => (document.body.style.height = "");
  }, []);

  return (
    <>
      <SmoothScroll>
        <div ref={contentRef} className="min-h-screen bg-white">
          {/* Header */}
          <header className="fixed inset-x-0 top-0 z-50 bg-white" style={{ position: "absolute" }}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <Logo />
            </nav>
          </header>

          {/* Hero Section */}
          <section
            className="relative pt-24 sm:pt-32 lg:pt-40 pb-12 sm:pb-16 lg:pb-24 overflow-hidden"
            style={{
              backgroundImage: "url('/images/bg_feat.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#024310"
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="text-white hover:text-white/60 transition-colors flex items-center gap-1 text-sm sm:text-base"
                    aria-label="Back to home"
                  >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                  </button>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Terms of Service
                </h1>
                <p className="text-white/90 text-base sm:text-lg lg:text-xl">
                  Understanding the rules and responsibilities of using AniSave.
                </p>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="py-12 sm:py-16 lg:py-20 bg-white relative">
            <div className="absolute inset-0 w-full h-full opacity-70">
              <img
                src="/images/bg_privacy.webp"
                alt="Terms background"
                className="w-full h-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              <p className="text-[#666] text-base sm:text-lg leading-relaxed mb-10">
                These Terms of Service outline your rights and obligations when using{" "}
                <span className="text-green-800 font-bold">AniSave</span>. Please read them
                carefully to ensure a safe and transparent experience on our platform.
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
          </section>

          {/* Footer */}
          <footer className="bg-[#D5E9D6] border-t border-black/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mb-6 sm:mb-8">
                <div>
                  <ul className="space-y-3 sm:space-y-4">
                    {navLinks.map((link) => (
                      <li key={link.id}>
                        <button
                          onClick={() => (window.location.href = "#")}
                          className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg font-medium"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-black text-base sm:text-lg mb-3 sm:mb-4">
                    Legal
                  </h4>
                  <ul className="space-y-3 sm:space-y-4">
                    <li>
                      <a
                        href="/privacy"
                        className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="/terms"
                        className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg"
                      >
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-black text-base sm:text-lg mb-3 sm:mb-4">
                    Follow us
                  </h4>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <a href="https://facebook.com" className="text-black hover:text-[#00573C] transition transform hover:scale-110">
                      <Facebook size={20} />
                    </a>
                    <a href="https://instagram.com" className="text-black hover:text-[#00573C] transition transform hover:scale-110">
                      <Instagram size={20} />
                    </a>
                    <a href="https://linkedin.com" className="text-black hover:text-[#00573C] transition transform hover:scale-110">
                      <Linkedin size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#ECEFF2] border-t border-black/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <p className="text-center text-black text-sm sm:text-base lg:text-lg">
                  © 2025 AniSave. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 bg-[#024310] hover:bg-[#035815] text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-40"
              aria-label="Scroll to top"
            >
              <ChevronUp size={24} />
            </button>
          )}
        </div>
      </SmoothScroll>
    </>
  );
}
