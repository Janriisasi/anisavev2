import { useEffect, useRef, useState, useCallback } from "react";

const PULL_THRESHOLD = 70; // px of pull needed before releasing triggers a refresh
const MAX_PULL = 100; // visual cap so the indicator doesn't stretch forever
const RESISTANCE = 0.5; // each px of finger movement buys less visual pull
const COOLDOWN_MS = 2000; // 2 seconds cooldown to prevent spamming

/**
 * Facebook/Messenger-style pull-to-refresh.
 *
 * Usage:
 *   const { pullDistance, refreshing } = usePullToRefresh({
 *     onRefresh: fetchOrders,
 *     scrollRef: myContainerRef, // optional: if scrolling is within a container instead of window
 *   });
 */
export default function usePullToRefresh({ onRefresh, disabled = false, scrollRef }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const lastRefreshTime = useRef(0);

  const getScrollTop = useCallback(() => {
    return scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY;
  }, [scrollRef]);

  const handleTouchStart = useCallback(
    (e) => {
      if (disabled || refreshing) return;
      // Only arm the gesture if we're already scrolled to the top
      if (getScrollTop() > 0) return;
      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [disabled, refreshing, getScrollTop],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!pulling.current || disabled || refreshing) return;
      // The page may have scrolled mid-gesture
      if (getScrollTop() > 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
      const delta = e.touches[0].clientY - touchStartY.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      const distance = Math.min(delta * RESISTANCE, MAX_PULL);
      setPullDistance(distance);
      // Stop the native WebView overscroll bounce from fighting this
      // custom one once the gesture is clearly a downward pull.
      if (delta > 10 && e.cancelable) e.preventDefault();
    },
    [disabled, refreshing, getScrollTop],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      const now = Date.now();
      if (now - lastRefreshTime.current < COOLDOWN_MS) {
        setPullDistance(0); // cooldown active, just snap back
        return;
      }
      lastRefreshTime.current = now;

      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD); // hold the indicator open while loading
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    const target = scrollRef?.current || window;
    // touchmove must be non-passive for preventDefault() to work.
    target.addEventListener("touchstart", handleTouchStart, { passive: true });
    target.addEventListener("touchmove", handleTouchMove, { passive: false });
    target.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, scrollRef]);

  return { pullDistance, refreshing, threshold: PULL_THRESHOLD };
}
