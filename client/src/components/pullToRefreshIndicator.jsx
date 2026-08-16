import { RefreshCw } from "lucide-react";

/**
 * Visual companion to usePullToRefresh — a Messenger-style circular
 * loader that grows and rotates as the user pulls, then spins in place
 * while `refreshing` is true.
 *
 * It is positioned absolutely at the top, overlapping the content.
 */
export default function PullToRefreshIndicator({
  pullDistance,
  refreshing,
  threshold = 70,
}) {
  if (pullDistance === 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const translateY = refreshing ? threshold : pullDistance;

  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center justify-center pointer-events-none transition-transform duration-200"
      style={{ top: 'calc(var(--nav-height, 64px) - 50px)', transform: `translateY(${translateY}px)` }}
      aria-hidden="true"
    >
      <div
        className={`w-9 h-9 rounded-full bg-white shadow-md border border-green-100 flex items-center justify-center ${
          refreshing ? "animate-spin" : ""
        }`}
        style={
          refreshing
            ? undefined
            : {
                opacity: progress,
                transform: `rotate(${progress * 360}deg) scale(${0.6 + progress * 0.4})`,
              }
        }
      >
        <RefreshCw className="w-4 h-4 text-green-700" />
      </div>
    </div>
  );
}
