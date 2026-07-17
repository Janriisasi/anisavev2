import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  ShieldCheck,
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
            Take AniSave wherever you farm
          </h1>
          <p className="text-white/90 text-sm sm:text-base lg:text-xl leading-relaxed max-w-3xl mx-auto">
            One app, every device. Get real-time market prices on your phone,
            laptop, or desktop — online or on the go.
          </p>
        </div>
      </section>

      {/* Platform cards */}
      <section className="py-12 sm:py-16 lg:py-20 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 text-[#00573C] text-sm sm:text-base font-medium mb-10 sm:mb-12">
            <ShieldCheck size={18} />
            Official builds, provided directly by the AniSave team
          </div>

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

                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#D5E9D6] flex items-center justify-center mb-5 sm:mb-6">
                    <img
                      src={platform.iconSrc}
                      alt={`${platform.name} icon`}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                    />
                  </div>

                  <h3 className="font-bold text-lg sm:text-xl text-[#00573C] mb-1">
                    {platform.name}
                  </h3>
                  <p className="text-[#726767] text-sm mb-1">
                    {platform.tagline}
                  </p>
                  <p className="text-[#9a9a9a] text-xs mb-5 sm:mb-6">
                    {link.version} &middot; {link.size}
                  </p>

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
      </section>

      {/* Install guides */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00573C] mb-3">
              Need help installing?
            </h2>
            <p className="text-[#726767] text-sm sm:text-base">
              A couple of extra taps are normal the first time — here's exactly
              what to expect.
            </p>
          </div>

          <div className="space-y-4">
            {installGuides.map((guide) => (
              <details
                key={guide.id}
                className="group bg-[#F5F5F5] rounded-xl border border-black/5 open:shadow-md transition-shadow"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none px-5 sm:px-6 py-4 sm:py-5">
                  <span className="font-semibold text-[#00573C] text-sm sm:text-base">
                    {guide.title}
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-[#00573C] transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <ol className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2.5 list-decimal list-inside text-[#726767] text-sm leading-relaxed">
                  {guide.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </details>
            ))}
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
