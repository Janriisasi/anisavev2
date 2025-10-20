import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { ChevronUp, ArrowLeft, Facebook, Instagram, Linkedin,  } from 'lucide-react';

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
          src="/images/invertedcolor_logo.svg"
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

          {/* hero section with background image */}
<section className="relative pt-28 pb-12 sm:pb-16 lg:pb-20 overflow-hidden flex items-end">
  {/* Background image container */}
  <div className="absolute inset-0 w-full h-full">
    <img 
      src="/images/bg_privacytitle.svg" // Replace with your image path
      alt="Privacy Policy Background"
      className="w-6/12 h-full mt-8"
      onError={(e) => e.target.style.display = 'none'}
    />
  </div>

  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <button 
          onClick={() => window.location.href = '/'}
          className="text-green-800 flex items-center gap-1 text-sm sm:text-base"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-800 mb-2">
        Privacy Policy
      </h1>
      <p className="text-green-800 text-xs sm:text-sm">
        Last Updated: October 17, 2025
      </p>
    </div>
  </div>
</section>


          {/* main content */}
          <section className="py-12 sm:py-16 lg:py-20 bg-white relative">
            {/* single large background decoration */}
            <div className="absolute inset-0 w-full h-full opacity-70">
              <img 
                src="/images/bg_privacy.svg" 
                alt="Privacy background" 
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              {/* intro paragraph */}
              <p className="text-[#666] text-base sm:text-lg leading-relaxed mb-10">
                AniSave ("we", "our", or "us") values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
              </p>

              {/* sections */}
              <div className="space-y-10">
                {/* Section 1 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    Information We Collect
                  </h2>
                  <div className="space-y-3 text-[#666] text-sm sm:text-base leading-relaxed">
                    <p>We may collect information about you if we have a reason to do so – for example, to provide our Services, to communicate with, or to make our Services better.</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>Personal Information:</strong> such as your name, email address, and contact number when you create an account or interact with our services.</li>
                      <li><strong>Usage Data:</strong> including your login activity, visited pages, and interactions within the platform.</li>
                      <li><strong>Uploaded Content:</strong> such as product listings, images, and descriptions you share on AniSave.</li>
                    </ul>
                  </div>
                </div>

                {/* Section 2 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    How We Use Your Information
                  </h2>
                  <div className="space-y-3 text-[#666] text-sm sm:text-base leading-relaxed">
                    <p>We use the collected information to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Provide and maintain the AniSave platform</li>
                      <li>Connect farmers and buyers effectively</li>
                      <li>Improve user experience and platform performance</li>
                      <li>Communicate important updates and offers related to our services</li>
                      <li>Ensure platform security and prevent fraud</li>
                    </ul>
                  </div>
                </div>

                {/* Section 3 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    Data Storage and Security
                  </h2>
                  <p className="text-[#666] text-sm sm:text-base leading-relaxed">
                    Your data is securely stored using Supabase. We apply encryption, authentication, and other industry-standard practices to protect your information from unauthorized access, disclosure, or misuse.
                  </p>
                </div>

                {/* Section 4 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    Sharing of Information
                  </h2>
                  <div className="space-y-3 text-[#666] text-sm sm:text-base leading-relaxed">
                    <p>We do not sell or share your personal information with third parties except:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>When required by law or government authorities</li>
                      <li>To trusted service providers who help operate our platform under strict confidentiality agreements</li>
                    </ul>
                  </div>
                </div>

                {/* Section 5 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    Your Rights
                  </h2>
                  <div className="space-y-3 text-[#666] text-sm sm:text-base leading-relaxed">
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Access, update, or delete your personal information</li>
                      <li>Withdraw your consent at any time</li>
                      <li>Contact us to inquire about your stored data</li>
                    </ul>
                  </div>
                </div>

                {/* Section 6 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    Cookies and Tracking
                  </h2>
                  <p className="text-[#666] text-sm sm:text-base leading-relaxed">
                    AniSave may use cookies or similar technologies to improve your experience, analyze usage, and personalize content. You can manage cookie preferences in your browser settings.
                  </p>
                </div>

                {/* Section 7 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    Updates to This Policy
                  </h2>
                  <p className="text-[#666] text-sm sm:text-base leading-relaxed">
                    We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
                  </p>
                </div>

                {/* Section 8 */}
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#666] mb-3">
                    Contact Us
                  </h2>
                  <p className="text-[#666] text-sm sm:text-base leading-relaxed">
                    If you have any questions or concerns about this Privacy Policy, contact us at:<br />
                    <a href="https://mail.google.com/mail/u/0/#inbox?compose=new" className="text-[#024310] font-semibold hover:text-[#035815] transition-colors underline">
                      anisave.team@gmail.com
                    </a>
                  </p>
                </div>
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
                          onClick={() => scrollToId(link.id)}
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
                      <Link 
                        to="/privacy" 
                        className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg"
                      >
                        Privacy Policy
                      </Link>
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