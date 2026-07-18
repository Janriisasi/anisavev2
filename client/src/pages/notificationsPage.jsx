import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Package,
  ThumbsUp,
  ThumbsDown,
  ShoppingBag,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../contexts/notificationContext';
import { useAuth } from '../hooks/useAuth';

// ─── Helpers (shared with NotificationButton) ────────────────────────────────

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
 * NotificationsPage — full-page notifications for mobile (< md).
 *
 * Reuses the same data (useNotifications context) and mark-as-read logic
 * as the desktop NotificationButton popup. Navigation links to Orders/Cart
 * are preserved.
 */
export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    ensureNotificationsLoaded,
  } = useNotifications();

  // Lazy-load notifications if not yet fetched
  useEffect(() => {
    ensureNotificationsLoaded?.();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [ensureNotificationsLoaded]);

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
  };

  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* Header */}
      <div className="grid grid-cols-3 items-center border-b border-gray-100 bg-white px-4 py-4 flex-shrink-0">
        <div />
        <div className="flex items-center justify-center gap-2">
          <Bell className="w-5 h-5 text-green-700" />
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-green-100 text-green-700 font-bold text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex justify-end">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-green-700 hover:text-green-800 font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-green-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 flex flex-col divide-y divide-gray-50 bg-white overscroll-contain">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-16 text-center"
          >
            <Bell className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400 text-base">No notifications yet</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((notif, i) => (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleNotifClick(notif)}
                className={`w-full text-left flex items-start p-5 gap-4 transition-colors active:bg-gray-100 ${
                  !notif.read ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Icon */}
                <div
                  className={`rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 border-2 ${typeBg(
                    notif.type
                  )}`}
                >
                  {typeIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`leading-tight mb-0.5 text-base ${
                      !notif.read
                        ? 'font-bold text-gray-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {notif.title}
                  </p>
                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mt-1">
                    {notif.message}
                  </p>
                  <p className="text-gray-400 font-medium text-xs mt-2">
                    {formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}