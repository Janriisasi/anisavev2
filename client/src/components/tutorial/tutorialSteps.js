import supabase from "../../lib/supabase";
import { STEP_ORDER, STEP_META, STEP_CONTENT, SELECTORS } from "./tutorialContent";

// ─── TARGET RESOLUTION ────────────────────────────────────────────────────────
// Joyride's `target` field accepts a function that returns an element, which
// lets us keep the same "try each selector in priority order" fallback logic
// the original getRect() used (a plain comma-separated CSS selector would
// resolve to the first DOM-order match across ALL of them, not the first
// match by priority — this preserves the original's actual behavior).
function resolveTarget(targetKey) {
  return () => {
    const raw = SELECTORS[targetKey];
    if (!raw) return null;
    for (const sel of raw.split(",")) {
      const el = document.querySelector(sel.trim());
      if (el) {
        // Selector lists are mobile-first (e.g. navbar checks the mobile
        // bottom bar before the desktop nav). On desktop the mobile element
        // still exists in the DOM, just hidden — querySelector finds it
        // fine, but its rect is 0×0. Joyride then (correctly) treats that as
        // "no real target" and skips the step. Matching the original
        // getRect()'s behavior: skip hidden matches, keep checking the rest
        // of the fallback list.
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return el;
      }
    }
    return null;
  };
}

// ─── DYNAMIC FARMER ID ────────────────────────────────────────────────────────
// Cached so every DYNAMIC_FARMER step (and repeat tour runs) only ever hits
// Supabase once per page load, instead of re-querying per step like before.
let farmerIdPromise = null;
function getSampleFarmerId() {
  if (!farmerIdPromise) {
    farmerIdPromise = supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .then(({ data }) => data?.[0]?.id ?? null)
      .catch(() => null);
  }
  return farmerIdPromise;
}

// ─── WAIT FOR ELEMENT ──────────────────────────────────────────────────────
// Polls resolveTarget() until it finds the (visible) element or the timeout
// elapses. Used instead of a fixed settle delay: fast pages resolve almost
// immediately, and slow ones (a farmer's profile — bio, products, ratings,
// all fetched only after the route mounts) get real headroom on a cold
// first visit instead of a guess that happens to be too short.
function waitForElement(targetKey, timeout = 12000, interval = 150) {
  if (!targetKey) return new Promise((resolve) => setTimeout(resolve, 400));
  const check = resolveTarget(targetKey);
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const el = check();
      if (el || Date.now() - start >= timeout) {
        resolve(el);
        return;
      }
      setTimeout(tick, interval);
    };
    tick();
  });
}

// ─── BEFORE-STEP NAVIGATION HOOK ──────────────────────────────────────────────
// Runs before a step tries to find its target. Joyride awaits this promise
// before doing its own (much shorter) targetWaitTimeout poll — so by the
// time it starts looking, the element should already be there for anything
// but a truly broken step.
function makeBeforeHook(route, targetKey, { navigate, getPathname }) {
  return async () => {
    let targetRoute = route;

    if (targetRoute === "DYNAMIC_FARMER") {
      const farmerId = await getSampleFarmerId();
      if (!farmerId) return; // no farmer to demo with — step will fail gracefully via TARGET_NOT_FOUND
      targetRoute = `/farmer/${farmerId}`;
    }

    if (!getPathname().startsWith(targetRoute)) {
      navigate(targetRoute);
      await waitForElement(targetKey);
    }
  };
}

// ─── STEP BUILDER ──────────────────────────────────────────────────────────
/**
 * Builds the Joyride `steps` array. Language-agnostic — the actual title and
 * description text is looked up at render time inside TutorialTooltip using
 * `step.id` + the current language, so switching languages never touches
 * this array and can't desync step order (unlike the old per-language
 * `T[lang].steps` arrays, where Tagalog/Hiligaynon had "ai-advisor" and
 * "product-cards" swapped relative to English).
 *
 * Real-target steps use a normal placement ('auto') so Joyride computes and
 * renders the highlight ring + cutout around the actual element — 'center'
 * is the one placement value where Joyride disables the spotlight entirely
 * (baked into the library), so it's reserved for the no-target intro/outro
 * steps. The tooltip docks beside whichever real element it targets
 * (@floating-ui picks the side with the most room and flips automatically).
 *
 * @param {object} args
 * @param {(path: string) => void} args.navigate - react-router navigate()
 * @param {() => string} args.getPathname - returns the CURRENT pathname
 *   (pass a function backed by a ref, not a stale closed-over value, so the
 *   before-hook always checks against live location)
 */

// Some consecutive steps sit side-by-side on the same page at roughly the
// same height (e.g. the product detail card on the left, the sellers list
// on the right, of /product/:name/sellers). Without this, Joyride still
// recomputes an "ideal" scroll position for each new target — even one
// that's already fully visible — because the docked tooltip itself needs
// room, which can nudge the page by a few px for no real reason. Pointing
// scrollTarget at the PREVIOUS step's target instead tells Joyride "the
// scroll anchor hasn't changed," so it doesn't move the page at all between
// these two, while the spotlight still moves normally to the new target.
const SCROLL_TARGET_OVERRIDES = {
  "product-sellers-list": "product-details-card",
};

export function buildTourSteps({ navigate, getPathname }) {
  return STEP_ORDER.map((id) => {
    const meta = STEP_META[id];
    const fallback = STEP_CONTENT.en[id]; // required by Step's type; the real copy comes from TutorialTooltip
    const scrollTargetKey = SCROLL_TARGET_OVERRIDES[id];

    return {
      id,
      target: meta.target ? resolveTarget(meta.target) : "body",
      scrollTarget: scrollTargetKey ? resolveTarget(scrollTargetKey) : undefined,
      placement: meta.target ? "auto" : "center",
      title: fallback.title,
      content: fallback.description,
      spotlightPadding: 10,
      spotlightRadius: 14,
      // Belt-and-suspenders on top of waitForElement in the before hook,
      // which already does the real waiting — this just needs to not be
      // so short that it undercuts that work.
      targetWaitTimeout: meta.route ? 4000 : 2000,
      before: meta.route ? makeBeforeHook(meta.route, meta.target, { navigate, getPathname }) : undefined,
    };
  });
}