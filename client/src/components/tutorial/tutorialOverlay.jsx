import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useJoyride, STATUS, EVENTS } from "react-joyride";
import { buildTourSteps } from "./tutorialSteps";
import { UI_STRINGS } from "./tutorialContent";
import { TutorialLangContext } from "./tutorialLangContext";
import TutorialTooltip from "./TutorialTooltip";

/**
 * Place <TutorialOverlay isOpen={...} onClose={...} /> once in your App.jsx,
 * inside <TutorialProvider> (see tutorialContext.jsx — that file needs no
 * changes, it just flips `isOpen` and gets notified via `onClose`).
 *
 * Internally this is a thin wrapper around react-joyride's useJoyride hook:
 * step sequencing, target finding, scrolling, positioning, the spotlight
 * cutout, and the overlay backdrop are all handled by Joyride. This file's
 * job is just to wire up navigation between steps and translate our own
 * design (TTS, 3-language content) into Joyride's options/tooltipComponent.
 */
export default function TutorialOverlay({ isOpen, onClose }) {
  const [lang, setLang] = useState("en");
  const navigate = useNavigate();
  const location = useLocation();

  // A ref instead of closing over `location.pathname` directly, so the
  // `before` hooks (created once via useMemo) always check against the
  // CURRENT route rather than whatever it was when the steps were built.
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;
  const getPathname = useCallback(() => pathnameRef.current, []);

  const steps = useMemo(
    () => buildTourSteps({ navigate, getPathname }),
    [navigate, getPathname],
  );

  // Sync Joyride's own ARIA button labels to the selected language too.
  const locale = useMemo(() => {
    const t = UI_STRINGS[lang];
    return {
      back: t.back,
      close: t.skip,
      last: t.finish,
      next: t.next,
      skip: t.skip,
    };
  }, [lang]);

  // ─── STRICT MODE ────────────────────────────────────────────────────────
  // Block user-initiated scrolling (mouse wheel, touch drag) while the tour
  // is running, so the page can't drift out from under the spotlight. This
  // does NOT touch Joyride's own scroll-to-target — that's a programmatic
  // scrollIntoView/scrollTo call, which never fires wheel/touchmove events,
  // so it's completely unaffected by preventDefault() here. Clicking is
  // already blocked by options.blockTargetInteraction + overlayClickAction
  // above; this closes the remaining gap (scroll input isn't a "click").
  useEffect(() => {
    if (!isOpen) return;

    const blockScroll = (e) => e.preventDefault();
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
    };
  }, [isOpen]);

  const handleEvent = useCallback(
    (data, controls) => {
      if (data.type === EVENTS.TARGET_NOT_FOUND && import.meta.env.DEV) {
        console.warn(
          `[Tutorial] target not found for step "${data.step?.id}" — check its data-tutorial attribute.`,
        );
      }
      if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
        controls.reset(); // rewind to step 0 for the next time this opens
        onClose?.();
      }
    },
    [onClose],
  );

  const { Tour } = useJoyride({
    steps,
    run: isOpen,
    continuous: true,
    scrollToFirstStep: true,
    debug: import.meta.env.DEV,
    onEvent: handleEvent,
    tooltipComponent: TutorialTooltip,
    locale,
    options: {
      primaryColor: "#166534", // green-800
      backgroundColor: "#ffffff",
      textColor: "#111827",
      arrowColor: "#ffffff",
      overlayColor: "rgba(0,0,0,0.72)",
      spotlightPadding: 10,
      spotlightRadius: 14,
      scrollDuration: 400,
      scrollOffset: 80,
      // Deliberately huge — guarantees the tour renders above a sticky/fixed
      // navbar regardless of whatever z-index the app's own layout uses.
      zIndex: 999999,
      blockTargetInteraction: true, // spotlight is visual only — matches the old click-blocker
      overlayClickAction: false, // clicking the backdrop does nothing, same as before
      closeButtonAction: "skip", // the X ends the tour (old behavior), not "advance"
      dismissKeyAction: "skip", // Esc ends the tour too
    },
    // Gutter between the card and the target (offset), and a minimum margin
    // from the viewport edges when @floating-ui's shift middleware has to
    // nudge the card to keep it on-screen (padding) — so on mobile it never
    // ends up flush against the screen edge. This is the real v3 prop;
    // floaterProps/modifiers (react-floater + Popper.js) was the old v2 API
    // and silently did nothing here.
    floatingOptions: {
      offset: 14,
      padding: 16,
    },
    styles: {
      // NOTE: no backdropFilter here on purpose. Joyride's overlay applies it
      // to the whole overlay layer, not just the dimmed area outside the
      // spotlight cutout — so it blurred the highlighted element too.
      spotlight: {
        stroke: "#16a34a",
        strokeWidth: 3,
        filter: "drop-shadow(0 0 8px rgba(22,163,74,0.45))",
      },
    },
  });

  return (
    <TutorialLangContext.Provider value={{ lang, setLang }}>
      {Tour}
    </TutorialLangContext.Provider>
  );
}