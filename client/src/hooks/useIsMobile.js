import { useState, useEffect } from 'react';

/** Tailwind's `md` breakpoint — must match the CSS variable */
const MOBILE_BREAKPOINT = 768;

/**
 * Returns `true` when the viewport is narrower than Tailwind's `md` breakpoint
 * (< 768 px). Updates reactively via a MediaQueryList listener so components
 * re-render immediately on resize — no polling, no layout thrashing.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
