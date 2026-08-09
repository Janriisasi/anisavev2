import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import { DOWNLOAD_LINKS } from "../config/downloadLinks";

// Same inline Button primitive used on the landing page, kept identical so
// every marketing/public page shares one look.
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

// Anchor-based "button" — real <a> tags are what make browsers actually
// trigger a file download instead of just calling an onClick handler.
const DownloadLink = ({ href, external, className, children }) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 active:scale-95 h-11 px-4 text-sm sm:h-12 sm:text-sm rounded-lg bg-[#024310] hover:bg-[#035815] text-white shadow-lg hover:shadow-xl w-full";

  return (
    <a
      href={href}
      className={`${base} ${className || ""}`}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : { download: true })}
    >
      {children}
    </a>
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

// Detect the visitor's OS so we can highlight the build that's actually
// relevant to them — purely cosmetic, never blocks the other downloads.
const detectPlatform = () => {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/win/i.test(ua)) return "windows";
  if (/mac/i.test(ua)) return "mac";
  return null;
};

const platforms = [
  {
    id: "android",
    name: "Android",
    iconSrc: "/images/androidIcon.svg",
    tagline: "Phones & tablets",
    cta: "Download APK",
    note: "Requires Android 8.0+. You'll be asked to allow \u201cinstall from unknown sources\u201d the first time — that's expected.",
  },
  {
    id: "windows",
    name: "Windows",
    iconSrc: "/images/windowsIcon.svg",
    tagline: "Windows 10 & 11",
    cta: "Download for Windows",
    note: "64-bit installer. Windows SmartScreen may show a warning since the app isn't code-signed yet — this is normal for a new installer.",
  },
  {
    id: "mac",
    name: "macOS",
    iconSrc: "/images/macosIcon.svg",
    tagline: "Apple Silicon & Intel",
    cta: "Download for Mac",
    note: "If macOS says the app \u201cis damaged\u201d or can't be opened, right-click the app and choose Open once to bypass Gatekeeper.",
  },
  {
    id: "ios",
    name: "iOS",
    iconSrc: "/images/iosIcon.svg",
    tagline: "iPhone & iPad",
    cta: "Get via TestFlight",
    note: "AniSave for iOS is currently distributed through TestFlight. Please install the free TestFlight app first to join our open beta.",
  },
];

const installGuides = [
  {
    id: "android",
    title: "Installing on Android",
    steps: [
      "Tap \u201cDownload APK\u201d above and wait for the download to finish.",
      "Open the downloaded AniSave.apk file from your Notifications or Files app.",
      "If prompted, allow installs from this source (Settings > Apps > Special access > Install unknown apps).",
      "Tap Install, then open AniSave once it finishes.",
    ],
  },
  {
    id: "windows",
    title: "Installing on Windows",
    steps: [
      "Download the installer and open it once it finishes.",
      "If SmartScreen appears, click \u201cMore info\u201d then \u201cRun anyway.\u201d",
      "Follow the setup wizard — AniSave will add a shortcut to your Start Menu.",
    ],
  },
  {
    id: "mac",
    title: "Installing on macOS",
    steps: [
      "Open the downloaded .dmg file and drag AniSave into Applications.",
      "On first launch, right-click (or Control-click) the app and choose Open.",
      "Click Open again in the confirmation dialog — you'll only need to do this once.",
    ],
  },
  {
    id: "ios",
    title: "Installing on iOS",
    steps: [
      "Tap \u201cGet via TestFlight\u201d and install the free TestFlight app if you don't have it yet.",
      "Accept the invite to join the AniSave beta.",
      "Install AniSave from within TestFlight.",
    ],
  },
];

export default function DownloadPage() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [detected, setDetected] = useState(null);

  useEffect(() => {
    setDetected(detectPlatform());
    const onScroll = () => setShowScrollTop(window.pageYOffset > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

      {/* Hero + Platform cards + Install guides — one continuous green section,
          background image supplies both the base color and the wheat artwork */}
      <section
        className="relative overflow-hidden bg-[#024310] bg-cover bg-top bg-no-repeat pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20"
        style={{ backgroundImage: "url('/images/dp-bg.jpg')" }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center mb-10 sm:mb-12 lg:mb-14">
          <p className="text-white/80 text-xs sm:text-sm font-bold tracking-[0.15em] uppercase mb-2 sm:mb-3">
            Cross-platform support
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Select your Platform
          </h1>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {platforms.map((platform) => {
              const link = DOWNLOAD_LINKS[platform.id];
              const isRecommended = detected === platform.id;

              return (
                <div
                  key={platform.id}
                  className={`relative bg-white rounded-[20px] shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 p-6 sm:p-8 flex flex-col ${
                    isRecommended ? "ring-2 ring-[#00573C] ring-opacity-50" : ""
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute top-4 right-4 bg-[#00573C] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                      For your device
                    </span>
                  )}

                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-4 sm:mb-5">
                    <img
                      src={platform.iconSrc}
                      alt={`${platform.name} icon`}
                      className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                    />
                  </div>

                  <h3 className="font-bold text-lg sm:text-xl text-[#00573C] mb-1">
                    {platform.name}
                  </h3>
                  <p className="text-[#726767] text-sm mb-2.5">
                    {platform.tagline}
                  </p>
                  <div className="flex items-center gap-2 mb-5 sm:mb-6">
                    <span className="bg-[#024310] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {link.version}
                    </span>
                    <span className="text-[#9a9a9a] text-xs">
                      {link.size}
                    </span>
                  </div>

                  <div className="mt-auto">
                    <DownloadLink href={link.url} external={link.external}>
                      {platform.cta}
                    </DownloadLink>
                    <p className="text-[#9a9a9a] text-xs leading-relaxed mt-3 min-h-[85px]">
                      {platform.note}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 mt-16 sm:mt-20 lg:mt-24">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Need Help Installing?
            </h2>
            <p className="text-white/90 text-sm sm:text-base">
              A couple of extra taps are normal for the first time — here's
              exactly what to expect when setting up AniSave on your device.
            </p>
          </div>

          <div className="space-y-4">
            {installGuides.map((guide, index) => {
              const guideIcon = platforms.find((p) => p.id === guide.id)
                ?.iconSrc;

              return (
                <details
                  key={guide.id}
                  open={index === 0}
                  className="group bg-white rounded-xl shadow-sm open:shadow-md transition-shadow"
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 sm:px-6 py-4 sm:py-5">
                    <span className="flex items-center gap-3 sm:gap-4">
                      <span className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        {guideIcon && (
                          <img
                            src={guideIcon}
                            alt=""
                            className="w-5 h-5 object-contain"
                          />
                        )}
                      </span>
                      <span className="font-semibold text-[#00573C] text-sm sm:text-base">
                        {guide.title}
                      </span>
                    </span>
                    <ChevronDown
                      size={18}
                      className="text-[#00573C] shrink-0 transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                    <ol className="flex-1 space-y-2.5 list-decimal list-inside text-[#726767] text-sm leading-relaxed">
                      {guide.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    {guide.image && (
                      <img
                        src={guide.image}
                        alt={`${guide.title} preview`}
                        className="w-full sm:w-40 lg:w-48 h-32 sm:h-28 lg:h-32 rounded-lg object-cover shrink-0"
                      />
                    )}
                  </div>
                </details>
              );
            })}
          </div>
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
                window.open("https://mail.google.com/mail/?view=cm&fs=1&to=anisave14@gmail.com", "_blank")
              }
            >
              Contact Support
            </Button>
            <Button
              variant="default"
              size="md"
              className="w-full sm:w-auto sm:min-w-[180px]"
              onClick={() => navigate("/faq")}
            >
              FAQ
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#D5E9D6] border-t border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-12 mb-10">
            {/* Brand col */}
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
                {[
                  "Market Prices",
                  "Product Directory",
                  "Farmer Profiles",
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
            {/* Company */}
            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm tracking-wide uppercase">
                Company
              </h5>
              <ul className="space-y-3">
                {[
                  { label: "About Us", href: "#about" },
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <span className="hidden sm:block" aria-hidden="true" />
            <p className="text-slate-500 text-sm text-center">
              © 2025 Anisave. All rights reserved.
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