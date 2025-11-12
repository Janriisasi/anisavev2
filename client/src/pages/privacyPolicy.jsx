import React, { useEffect, useState, useRef } from "react";
import { ChevronUp, ArrowLeft, Facebook, Instagram, Linkedin } from 'lucide-react';

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
        scrollRef.current.style.transform = 'translateY(0)';
      }
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', willChange: 'transform' }} ref={scrollRef}>
      {children}
    </div>
  );
};

const Logo = () => {
  return (
    <a href="/" className="flex items-center gap-2 transition-all duration-300 cursor-pointer">
      <button className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
        <img 
          src="/images/invertedcolor_logo.webp"
          alt="Logo"
          className="h-12 w-auto"
        />
      </button>
    </a>
  );
};

const navLinks = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "about", label: "About Us" }
];

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export default function PrivacyPolicy() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef(null);

  const sections = [
    {
      title: "Our Story",
      content: "AniSave was born from a simple yet powerful idea — to bridge the gap between farmers and buyers through technology. In many parts of the Philippines, local farmers struggle to find direct access to fair markets, often relying on middlemen who take a large portion of their profits. At the same time, buyers find it difficult to source fresh produce directly from trusted farmers.\n\nAniSave was created to change that reality — to give farmers a digital space where they can showcase their products, connect directly with buyers, and stay informed about real-time market prices.\n\nWe believe that empowering farmers with technology can lead to stronger communities, fairer trade, and sustainable livelihoods."
    },
    {
      title: "Our Mission",
      content: "To empower Filipino farmers by providing a reliable digital platform that connects them directly with buyers, promotes transparency in pricing, and helps improve the overall flow of agricultural commerce in the country.\n\nWe aim to make agriculture more accessible, fair, and future-ready by using simple, user-friendly technology."
    },
    {
      title: "Our Vision",
      content: "To build a digitally connected agricultural ecosystem where every Filipino farmer has equal opportunity to sell their harvest, monitor market trends, and grow their business sustainably. AniSave envisions a future where technology and agriculture work hand in hand to improve the lives of farmers and the quality of local food supply."
    },
    {
      title: "What AniSave Does",
      content: "AniSave serves as a modern platform that simplifies how farmers and buyers interact:\n\n• Farmers can easily list their products, track market prices, and manage their profiles.\n• Buyers can browse, search, and connect with farmers to purchase fresh produce directly.\n• Both sides benefit from a transparent, efficient, and trustworthy environment.\n\nWith real-time price monitoring, category-based product discovery, and direct contact features, AniSave is transforming how agricultural trade happens in the Philippines."
    },
    {
      title: "Our Objective",
      content: "To support and uplift the agricultural sector by:\n\n• Encouraging fair trade between farmers and consumers\n• Enhancing digital literacy among local producers\n• Promoting sustainability and transparency in the supply chain\n• Strengthening the connection between technology and farming"
    },
    {
      title: "Why AniSave Matters",
      content: "Agriculture is the heart of the Philippines — yet many farmers remain underserved in the digital world. AniSave aims to bridge that divide by being a platform built for farmers, by students who care about their growth. We're not just building an app; we're building a community where innovation meets compassion, helping ensure that every harvest finds its way to the right table."
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      document.body.style.height = `${contentRef.current.offsetHeight}px`;
    }

    return () => {
      document.body.style.height = '';
    };
  }, []);

  return (
    <>
      <SmoothScroll>
        <div ref={contentRef} className="min-h-screen bg-white">
          {/* navbar */}
          <header className="fixed inset-x-0 top-0 z-50 bg-white" style={{ position: 'absolute' }}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <Logo />
            </nav>
          </header>

          <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-12 sm:pb-16 lg:pb-24 overflow-hidden"
            style={{
              backgroundImage: "url('/images/bg_feat.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#024310'
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="text-white hover:text-white/60 transition-colors flex items-center gap-1 text-sm sm:text-base"
                    aria-label="Back to home"
                  >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                  </button>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                  About AniSave
                </h1>
                <p className="text-white/90 text-base sm:text-lg lg:text-xl">
                  Empowering Filipino farmers through technology and direct market access.
                </p>
              </div>
            </div>
          </section>

          {/* main content */}
          <section className="py-12 sm:py-16 lg:py-20 bg-white relative">
            <div className="absolute inset-0 w-full h-full opacity-70">
              <img 
                src="/images/bg_privacy.webp" 
                alt="About background" 
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              <p className="text-[#666] text-base sm:text-lg leading-relaxed mb-10">
                <span className="text-green-800 font-bold">AniSave</span> is a digital platform dedicated to empowering <span className="text-green-800 font-bold">Filipino farmers</span> and connecting them with buyers for <span className="text-yellow-400 font-bold">fair and transparent </span> agricultural trade.
              </p>

              {/* sections */}
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
          </section>

          {/* footer */}
          <footer className="bg-[#D5E9D6] border-t border-black/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mb-6 sm:mb-8">
                <div>
                  <ul className="space-y-3 sm:space-y-4">
                    {navLinks.map((link) => (
                      <li key={link.id}>
                        <button 
                          onClick={() => window.location.href = '#'}
                          className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg font-medium"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-black text-base sm:text-lg mb-3 sm:mb-4">Legal</h4>
                  <ul className="space-y-3 sm:space-y-4">
                    <li>
                      <a 
                        href="/privacy" 
                        className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg"
                      >
                       More about AniSave
                      </a>
                    </li>
                    <li>
                      <a href="#terms" className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg">
                        Terms of service
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-black text-base sm:text-lg mb-3 sm:mb-4">Follow us</h4>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <a
                      href="https://facebook.com"
                      aria-label="Facebook"
                      className="text-black hover:text-[#00573C] transition-colors duration-300 transform hover:scale-110"
                    >
                      <Facebook size={20} className="sm:w-6 sm:h-6" />
                    </a>
                    <a
                      href="https://instagram.com"
                      aria-label="Instagram"
                      className="text-black hover:text-[#00573C] transition-colors duration-300 transform hover:scale-110"
                    >
                      <Instagram size={20} className="sm:w-6 sm:h-6" />
                    </a>
                    <a
                      href="https://linkedin.com"
                      aria-label="LinkedIn"
                      className="text-black hover:text-[#00573C] transition-colors duration-300 transform hover:scale-110"
                    >
                      <Linkedin size={20} className="sm:w-6 sm:h-6" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#ECEFF2] border-t border-black/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <p className="text-center text-black text-sm sm:text-base lg:text-lg">
                  © 2025 Anisave. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {/* scroll to top button */}
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