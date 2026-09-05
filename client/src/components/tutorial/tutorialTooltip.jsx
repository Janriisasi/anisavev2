import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Globe } from "lucide-react";
import {
  LANGUAGES,
  UI_STRINGS,
  STEP_CONTENT,
  formatStepOf,
} from "./tutorialContent";
import { TutorialLangContext } from "./tutorialLangContext";

// ─── ELEVENLABS TTS ──────────────────────────────────────────────────────────
// Unchanged from the original implementation — free plan: 10,000 credits/mo.
// Add to .env:  VITE_ELEVENLABS_API_KEY=your_api_key_here
// eleven_multilingual_v2 handles English, Tagalog, and Hiligaynon naturally.
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_VOICE_ID || "agHbWXl8DJ2fQZVqV1w4";
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

function cleanTextForSpeech(text) {
  if (!text) return "";
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      "",
    )
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();
}

function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);
  const objectURL = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectURL.current) {
      URL.revokeObjectURL(objectURL.current);
      objectURL.current = null;
    }
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const fallbackSpeak = useCallback((cleanText) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(cleanText);
      utt.onend = () => setSpeaking(false);
      utt.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utt);
    } else {
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    async (text) => {
      stop();
      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      if (!ELEVENLABS_API_KEY) {
        console.warn(
          "VITE_ELEVENLABS_API_KEY not set — falling back to browser TTS",
        );
        fallbackSpeak(cleanText);
        return;
      }

      setSpeaking(true);
      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: cleanText,
              model_id: ELEVENLABS_MODEL,
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          },
        );

        if (!res.ok) {
          console.error("ElevenLabs TTS error:", res.status, await res.text());
          fallbackSpeak(cleanText);
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectURL.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setSpeaking(false);
          if (objectURL.current) {
            URL.revokeObjectURL(objectURL.current);
            objectURL.current = null;
          }
        };
        audio.onerror = () => {
          setSpeaking(false);
          fallbackSpeak(cleanText);
        };
        audio.play().catch((playErr) => {
          console.warn("Audio playback error:", playErr);
          fallbackSpeak(cleanText);
        });
      } catch (err) {
        console.error("ElevenLabs TTS network error:", err);
        fallbackSpeak(cleanText);
      }
    },
    [stop, fallbackSpeak],
  );

  useEffect(() => () => stop(), [stop]);

  return { speaking, speak, stop };
}

// ─── LANGUAGE PICKER ──────────────────────────────────────────────────────────
function LangPicker({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-bold text-green-800 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 hover:bg-green-100 transition-colors"
      >
        <Globe className="w-3 h-3" />
        {UI_STRINGS[lang].label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.94 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[10001] overflow-hidden min-w-[130px]"
          >
            {LANGUAGES.map((code) => (
              <button
                type="button"
                key={code}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors ${
                  lang === code
                    ? "font-bold text-green-800 bg-green-50/70"
                    : "text-gray-700"
                }`}
              >
                {UI_STRINGS[code].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TOOLTIP INNER (remounts per step id) ────────────────────────────────────
// Keyed by step.id in the wrapper below so TTS playback and the enter/exit
// animation reset cleanly on every step change — matching the original
// Card's `key={`${idx}-${lang}`}` remount behavior.
function TooltipInner({
  step,
  index,
  size,
  isLastStep,
  continuous,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  lang,
  onLang,
}) {
  const t = UI_STRINGS[lang];
  const content = STEP_CONTENT[lang]?.[step.id] ?? STEP_CONTENT.en[step.id];
  const { speaking, speak, stop } = useTTS();
  const primaryRef = useRef(null);
  const isCentered = step.placement === "center"; // true only for the no-target intro/outro steps

  useEffect(() => {
    // preventScroll matters here: without it, the browser tries to scroll
    // the newly-focused button into view on every step change, at the same
    // time Joyride is running its own scroll-to-target animation — two
    // competing scrolls is exactly what produces a visible up/down stutter
    // when moving between steps.
    primaryRef.current?.focus({ preventScroll: true });
  }, []);

  const withStop = (props) => ({
    ...props,
    onClick: (e) => {
      stop();
      props.onClick?.(e);
    },
  });

  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, scale: 0.9, y: isCentered ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: isCentered ? -6 : 6 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width:
          window.innerWidth >= 768
            ? 480
            : Math.min(310, window.innerWidth - 32),
      }}
    >
      {/* Progress */}
      {continuous && (
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-green-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((index + 1) / size) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <LangPicker lang={lang} onChange={onLang} />
          <div className="flex items-center gap-2">
            {/* TTS speaker button */}
            <button
              type="button"
              onClick={() =>
                speaking
                  ? stop()
                  : speak(`${content.title}. ${content.description}`)
              }
              title={speaking ? "Stop" : "Read aloud"}
              className={`p-1.5 rounded-full transition-colors ${
                speaking
                  ? "bg-green-100 text-green-700"
                  : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              }`}
            >
              {speaking ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  <path
                    d="M18.5 12a6.5 6.5 0 0 0-3.5-5.8v2.2a4.5 4.5 0 0 1 0 7.2v2.2a6.5 6.5 0 0 0 3.5-5.8z"
                    opacity=".5"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </button>
            <span className="text-xs sm:text-sm text-gray-400 font-medium">
              {formatStepOf(lang, index + 1, size)}
            </span>
            <button
              type="button"
              {...withStop(closeProps)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex gap-1 mb-3 sm:mb-4 flex-wrap">
          {Array.from({ length: size }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-4 sm:w-5 bg-green-700"
                  : i < index
                    ? "w-1.5 bg-green-700"
                    : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2 leading-snug">
          {content.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {content.description}
        </p>
      </div>

      {/* Buttons */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...withStop(skipProps)}
            className="px-3 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-green-800 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
          >
            {t.skip}
          </button>
          {index > 0 && (
            <button
              type="button"
              {...withStop(backProps)}
              className="px-3 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
            >
              {t.back}
            </button>
          )}
        </div>
        <button
          type="button"
          ref={primaryRef}
          {...withStop(primaryProps)}
          className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold bg-green-800 hover:bg-green-700 text-white rounded-xl shadow-sm transition-colors"
        >
          {isLastStep ? t.finish : t.next}
          {!isLastStep && <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── TOOLTIP (stable component identity — required by Joyride's tooltipComponent) ──
// Rendered inside Joyride's own positioned wrapper, which @floating-ui docks
// next to the resolved target using `placement: "auto"` (tutorialSteps.js) —
// it picks whichever side has the most room and flips automatically (e.g. a
// bottom-nav item on mobile gets the card placed above it instead of
// clipping off-screen). See tutorialOverlay.jsx's `floatingOptions` for the
// gutter/edge-padding tuning.
export default function TutorialTooltip(props) {
  const { lang, setLang } = useContext(TutorialLangContext);

  return (
    <AnimatePresence mode="wait">
      <TooltipInner
        key={props.step.id}
        {...props}
        lang={lang}
        onLang={setLang}
      />
    </AnimatePresence>
  );
}