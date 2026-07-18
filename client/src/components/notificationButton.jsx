import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  ThumbsUp,
  ThumbsDown,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../contexts/notificationContext';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';

const typeIcon = (type) => {
  switch (type) {
    case 'order_approved':
      return <ThumbsUp className="w-4 h-4 text-green-600" />;
    case 'order_declined':
      return <ThumbsDown className="w-4 h-4 text-red-500" />;
    case 'order_request':
      return <ShoppingBag className="w-4 h-4 text-amber-600" />;
    default:
      return <Package className="w-4 h-4 text-gray-500" />;
  }
};

const typeBg = (type) => {
  switch (type) {
    case 'order_approved':
      return 'bg-green-50 border-green-100';
    case 'order_declined':
      return 'bg-red-50 border-red-100';
    case 'order_request':
      return 'bg-amber-50 border-amber-100';
    default:
      return 'bg-gray-50 border-gray-100';
  }
};

/**
 * NotificationButton — renders the notifications action in three variants:
 *
 * • Default (no props) — desktop dropdown popup, unchanged.
 * • mobileTab          — bottom-bar tab; navigates to /notifications on mobile.
 * • mobileMenu         — hamburger-menu row; navigates on mobile.
 */
export default function NotificationButton({
  mobileMenu = false,
  mobileTab = false,
  isActive = false,
  showIndicator = false,
  indicatorLayoutId = 'tab-indicator',
  onOpen,
}) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    ensureNotificationsLoaded,
  } = useNotifications();

  // Desktop-only popup state
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const setOpenState = async (val) => {
    if (val && user) {
      await ensureNotificationsLoaded?.();
    }
    setIsOpen(val);
    onOpen?.(val);
  };

  // Close popup on route change
  useEffect(() => {
    setOpenState(false);
  }, [location.pathname]);

  // Close on global overlay-close event (desktop only, harmless on mobile)
  useEffect(() => {
    const handleClose = () => setOpenState(false);
    window.addEventListener('closeOverlays', handleClose);
    return () => window.removeEventListener('closeOverlays', handleClose);
  }, []);

  // Click-outside closes the desktop popup
  useEffect(() => {
    if (mobileMenu || mobileTab || !isOpen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpenState(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, mobileMenu, mobileTab]);

  if (!user) return null;

  const handleNotifClick = async (notif) => {
    if (!notif.read) await markAsRead(notif.id);
    if (notif.type === 'order_request') {
      navigate('/profile', { state: { activeSection: 'orders' } });
    } else if (
      notif.type === 'order_approved' ||
      notif.type === 'order_declined'
    ) {
      navigate('/cart', { state: { activeTab: 'history' } });
    }
    setOpenState(false);
  };

  // ── Desktop popup content (shared between default and mobileMenu variants) ─
  const desktopPopupContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute right-0 top-full mt-2 w-80 max-h-[480px] rounded-2xl shadow-2xl border border-gray-100 z-[9999] bg-white overflow-hidden flex flex-col"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-green-700" />
              <span className="font-bold text-gray-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-green-100 text-green-700 font-bold rounded-full text-[10px] px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-green-700 hover:text-green-800 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setOpenState(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <Bell className="w-10 h-10 text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left transition-colors flex items-start py-2.5 px-3 gap-3 ${
                    !notif.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div
                    className={`rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border ${typeBg(
                      notif.type
                    )}`}
                  >
                    {typeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-tight mb-0.5 ${
                        !notif.read
                          ? 'font-bold text-gray-900'
                          : 'text-gray-700'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Mobile bottom-tab variant ─────────────────────────────────────────────
  if (mobileTab) {
    const handleClick = () => {
      if (isMobile) {
        navigate('/notifications');
      } else {
        // Edge case: tab bar shown on desktop — fall back to popup
        setOpenState(!isOpen);
      }
    };

    return (
      <button
        onClick={handleClick}
        data-tutorial="mobile-tab-alerts"
        className={`relative flex flex-col items-center justify-center py-2 flex-1 min-w-0 transition-colors hover:bg-green-700/50 ${
          isActive ? 'text-white' : 'text-green-100/70 hover:text-white'
        }`}
      >
        <div
          className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}
        >
          <Bell className="w-6 h-6" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-sm"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] mt-1 font-medium">Alerts</span>
        {isActive && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-t-full" />
        )}
        {/* No portal/overlay on mobile — navigates to /notifications page */}
      </button>
    );
  }

  // ── Mobile hamburger-menu variant ─────────────────────────────────────────
  if (mobileMenu) {
    return (
      <motion.button
        onClick={() => {
          if (isMobile) {
            navigate('/notifications');
          } else {
            setOpenState(!isOpen);
          }
        }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between text-white hover:text-gray-300 py-3 font-medium text-lg transition-all duration-200 hover:translate-x-1 hover:drop-shadow-lg"
      >
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5" />
          <span>Notifications</span>
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-1.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>
    );
  }

  // ── Desktop icon variant (default) — popup behavior unchanged ─────────────
  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        onClick={() => setOpenState(!isOpen)}
        className="relative p-2 bg-green-800 hover:bg-green-700 rounded-full transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      {desktopPopupContent}
    </div>
  );
}
