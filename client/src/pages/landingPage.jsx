import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, ChevronUp } from 'lucide-react';
import TrueFocus from '../components/trueFocus.jsx';

// Optimized smooth scroll with RAF throttling
const SmoothScroll = ({ children }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    let scrollY = 0;
    let currentY = 0;
    let rafId = null;
    const speed = 0.08;

    const smoothScroll = () => {
      scrollY = window.pageYOffset;
      currentY += (scrollY - currentY) * speed;
      
      if (scrollRef.current && Math.abs(scrollY - currentY) > 0.1) {
        scrollRef.current.style.transform = `translate3d(0, -${currentY}px, 0)`;
      }
      
      rafId = requestAnimationFrame(smoothScroll);
    };

    rafId = requestAnimationFrame(smoothScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollRef.current) {
        scrollRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', willChange: 'transform' }} ref={scrollRef}>
      {children}
    </div>
  );
};

// Button component
const Button = ({ className, variant = "default", size = "md", children, onClick, ...props }) => {
  const base = "inline-flex items-center justify-center font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const variantStyles = {
    default: "bg-[#024310] hover:bg-[#035815] text-white shadow-lg hover:shadow-xl focus-visible:ring-[#024310]/50",
    outline: "bg-white text-[#024310] hover:bg-gray-50 border border-gray-300 shadow-sm hover:shadow-md focus-visible:ring-[#024310]/50",
    ghost: "bg-transparent text-white hover:bg-white/10 border border-white/10 focus-visible:ring-white/50"
  };
  
  const sizeStyles = {
    sm: "h-8 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm rounded-md",
    md: "h-10 px-4 text-sm sm:h-12 sm:px-6 sm:text-base rounded-lg",
    lg: "h-12 px-5 text-base sm:h-14 sm:px-8 sm:text-lg rounded-lg"
  };
  
  return (
    <button
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Optimized feature card with lazy loading
const FeatureCard = ({ image, title, description, isHighlighted = false, width, height }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  return (
    <div 
      className={`bg-white rounded-[20px] shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer transform hover:-translate-y-2 ${
        isHighlighted ? 'ring-2 ring-[#00573C] ring-opacity-50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <div className={`w-full h-[180px] sm:h-[220px] lg:h-[280px] bg-gray-200 flex items-center justify-center transition-transform duration-500 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}>
          {!imgLoaded && <div className="text-gray-400">Loading...</div>}
          <img
            src={image}
            alt={title}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="text-gray-500 text-center font-medium">${title}<br/>Image</div>`;
            }}
          />
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : ''
        }`} />
      </div>
      <div className="p-4 sm:p-6 lg:p-6">
        <h3 className={`font-medium text-base sm:text-lg lg:text-[20px] leading-tight mb-2 sm:mb-3 transition-colors duration-300 ${
          isHighlighted ? 'text-[#00573C]' : 'text-[#00573C]'
        }`}>
          {title}
        </h3>
        <p className="text-[#726767] text-sm sm:text-base lg:text-[16px] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

// Logo with explicit dimensions
const Logo = ({ isScrolled = false }) => {
  return (
    <a href="" className="flex items-center gap-2 sm:gap-3 transition-all duration-300 cursor-pointer">
      <button className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
        <img 
          src="/images/anisave_logo.webp"
          alt="Logo"
          width="162"
          height="56"
          className="h-8 sm:h-10 lg:h-12 w-auto"
        />
      </button>
    </a>
  );
};

// Optimized scroll function using passive listeners
const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const offsetTop = el.getBoundingClientRect().top + window.pageYOffset;
  window.scrollTo({ top: offsetTop, behavior: "smooth" });
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Main landing page
export default function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    // Set body height for scrolling - batch DOM reads
    const updateHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.offsetHeight;
        document.body.style.height = `${height}px`;
      }
    };
    
    updateHeight();
    // Debounce resize
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateHeight, 150);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      document.body.style.height = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle scroll effects with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.pageYOffset;
          setIsScrolled(scrollY > 50);
          setShowScrollTop(scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Detect active section
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3, rootMargin: '-50px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => sections.forEach((s) => observer.unobserve(s));
  }, []);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "features", label: "Features" },
    { id: "about", label: "About Us" }
  ];

  return (
    <SmoothScroll>
      <div ref={contentRef} className="min-h-screen bg-white">
        {/* navbar */}
        <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`} style={{ position: 'absolute' }}>
          <nav className={`max-w-7xl mx-auto px-4 sm:px-6 h-12 sm:h-14 lg:h-18 flex items-center justify-between ${
            isScrolled ? 'mt-1 sm:mt-2' : 'mt-1 sm:mt-2'
          }`}>
            <Logo isScrolled={isScrolled} />

            {/* links */}
            <div className="hidden lg:flex items-center gap-12">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToId(link.id)}
                  className={`font-medium text-lg transition-all duration-300 relative group ${
                    isScrolled ? 'text-gray-700 hover:text-[#00573C]' : 'text-white hover:text-gray-200'
                  } ${activeSection === link.id ? (isScrolled ? 'text-[#00573C]' : 'text-white') : ''}`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-current transition-all duration-300 ${
                    activeSection === link.id ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </button>
              ))}
            </div>

            {/* buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="min-w-[60px] sm:min-w-[80px] lg:min-w-[120px]"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="min-w-[70px] sm:min-w-[100px] lg:min-w-[140px] gap-1 sm:gap-2"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </div>
          </nav>
        </header>

        {/* hero */}
        <section
          id="home"
          className="relative min-h-screen flex items-center overflow-hidden"
          style={{
            backgroundImage: "url('/images/bg_feat.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#024310'
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
            <div className="max-w-4xl mx-auto text-center">
              <TrueFocus 
                sentence="Know your prices like never before"
                manualMode={false}
                blurAmount={5}
                borderColor="green"
                animationDuration={0.5}
                pauseBetweenAnimations={0.5}
              />
              <p className="text-white/90 text-sm sm:text-base lg:text-xl leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8 lg:mb-12">
                A simple yet powerful tool designed to help farmers stay informed about real-time market prices for their crops. 
                With Anisave, every Filipino farmer gains a partner in achieving a more secure and profitable harvest.
              </p>

              <Button
                variant="default"
                size="lg"
                className="gap-2 sm:gap-3 transform hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/signup')}
              >
                Get started
                <img 
                  src="/images/ani_logo.webp" 
                  alt="Wheat" 
                  width="24"
                  height="24"
                  className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                />
              </Button>
            </div>
          </div>
        </section>

        {/* features section */}
        <section 
          id="features" 
          className="relative py-12 sm:py-16 lg:py-24 overflow-hidden"
          style={{
            backgroundImage: "url('/images/Notif.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#00573C'
          }}
        >
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              <div className="text-white">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[48px] font-bold mb-6 sm:mb-8 lg:mb-12">
                  Features
                </h2>

                <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                  {[
                    {
                      title: "Real-time Prices",
                      description: "Displays real-time prices for up-to-date market information."
                    },
                    {
                      title: "Categorized",
                      description: "Organizes products into clear, easy-to-browse categories."
                    },
                    {
                      title: "Showcase",
                      description: "Allows users to post and showcase their products quickly and effortlessly."
                    },
                    {
                      title: "Contact Farmers",
                      description: "Communicate with farmers for inquiries and deals."
                    }
                  ].map((feature, index) => (
                    <div 
                      key={index}
                      className="group cursor-pointer transition-all duration-300"
                    >
                      <h3 className="text-lg sm:text-xl lg:text-[37px] font-extrabold mb-1 sm:mb-2 group-hover:text-yellow-500 transition-colors duration-200">
                        {feature.title}
                      </h3>
                      <p className="text-white/80 text-sm sm:text-base lg:text-[20px] leading-relaxed group-hover:text-white transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* feature image */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative max-w-lg lg:max-w-2xl w-full">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform hover:scale-105 transition-all duration-500">
                    <img
                      src="/images/45202324647AM.webp"
                      alt="Farmer"
                      width="1013"
                      height="800"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-[300px] sm:h-[400px] lg:h-[600px] object-cover"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = '<div class="w-full h-[300px] sm:h-[400px] lg:h-[600px] bg-green-600 flex items-center justify-center text-white text-xl font-semibold rounded-2xl">Feature Image</div>';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* about section */}
        <section id="about" className="py-12 sm:py-16 lg:py-24 bg-[#F5F5F5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-12 sm:mb-16 lg:mb-24">
              <div className="flex justify-center lg:justify-start">
                <div className="relative max-w-lg lg:max-w-xl w-full">
                  <img
                    src="/images/pexels-sorapong-chaipanya-4530766-1.webp"
                    alt="Farmer carrying seedlings"
                    width="1203"
                    height="1202"
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-square object-cover rounded-lg shadow-xl transform hover:scale-105 transition-all duration-500"
                    onError={(e) => {
                      e.target.parentElement.innerHTML = '<div class="w-full aspect-square bg-green-200 flex items-center justify-center text-green-800 text-xl font-semibold rounded-lg shadow-xl">About Image</div>';
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="group mb-8 sm:mb-10 lg:mb-12">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[48px] font-bold text-[#00573C] mb-4 sm:mb-0">
                    About Anisave
                  </h2>
                  <p className="text-[#726767] text-xs sm:text-sm lg:text-[20px] leading-relaxed">
                    To empower farmers with real-time, accessible, and accurate market pricing information, 
                    enabling them to make informed decisions, improve their profitability, and thrive in an 
                    ever-changing agricultural landscape.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                  <div className="group">
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[48px] font-bold text-[#00573C] mb-4 sm:mb-0">
                      Our <br/> vision
                    </h3>
                    <p className="text-[#726767] text-xs sm:text-sm lg:text-[20px] leading-relaxed">
                      Creating solutions that are capable of adapting to the changing needs of the agricultural community.
                    </p>
                  </div>
                  
                  <div className="group">
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[48px] font-bold text-[#00573C] mb-4 sm:mb-0">
                      Our <br/> mission
                    </h3>
                    <p className="text-[#726767] text-xs sm:text-sm lg:text-[20px] leading-relaxed">
                      To deliver real-time market prices, empowering farmers to make smarter choices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* why use section */}
        <section className="py-16 sm:py-20 lg:py-24 bg-[#F5F5F5]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[48px] font-bold text-[#00573C] mb-4">
                Why Use Anisave
              </h2>
              <p className="text-[#767474] text-lg sm:text-xl lg:text-[24px] max-w-3xl mx-auto">
                Get today's market prices, grow tomorrow's profit.
              </p>
            </div>

            {/* cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <FeatureCard
                image="/images/52022106060_bb8f26ba3f_4k.webp"
                title="Strategic crop planning"
                description="Access to future price trends to improving profitability and reducing risk."
                width="1440"
                height="711"
              />
              
              <FeatureCard
                image="/images/two-happy-farmers-holding-hands-field_993599-21007.webp"
                title="Seamless Market Access"
                description="Real time price feeds reduce middlemen influence and enhance market efficiency."
                width="626"
                height="417"
              />
              
              <FeatureCard
                image="/images/Department-of-Agriculture-DA.webp"
                title="DA's price protection program"
                description="Guarantees stable pricing for cooperatives, working closely with buyers."
                width="1920"
                height="948"
                isHighlighted={true}
              />
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
                      More about AniSave
                    </Link>
                  </li>
                  <li>
                    <a href="/terms" className="text-black hover:text-[#00573C] transition-colors duration-300 text-base sm:text-lg">
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
  );
}