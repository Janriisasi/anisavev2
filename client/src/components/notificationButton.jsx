import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Package, ThumbsUp, ThumbsDown, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../contexts/notificationContext';
import { useAuth } from '../contexts/authContext';

const typeIcon = (type) => {
  switch (type) {
    case 'order_approved': return <ThumbsUp className="w-4 h-4 text-green-600" />;
    case 'order_declined': return <ThumbsDown className="w-4 h-4 text-red-500" />;
    case 'order_request': return <ShoppingBag className="w-4 h-4 text-amber-600" />;
    default: return <Package className="w-4 h-4 text-gray-500" />;
  }
};

const typeBg = (type) => {
  switch (type) {
    case 'order_approved': return 'bg-green-50 border-green-100';
    case 'order_declined': return 'bg-red-50 border-red-100';
    case 'order_request': return 'bg-amber-50 border-amber-100';
    default: return 'bg-gray-50 border-gray-100';
  }
};

export default function NotificationButton({ mobileMenu = false }) {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleNotifClick = async (notif) => {
    if (!notif.read) await markAsRead(notif.id);
    // Navigate to relevant page
    if (notif.type === 'order_request') {
      navigate('/profile'); // farmer sees requests on their profile
    } else if (notif.type === 'order_approved' || notif.type === 'order_declined') {
      navigate('/cart'); // buyer sees order history in cart page
    }
    setIsOpen(false);
  };

  if (mobileMenu) {
    return (
      <motion.button
        onClick={() => { setIsOpen(!isOpen); }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between text-white hover:text-gray-300 py-3 font-medium text-lg transition-all duration-200 hover:translate-x-1 hover:drop-shadow-lg"
      >
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5" />
          <span>Notifications</span>
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-800 to-green-700">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white" />
                <span className="font-bold text-white text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notif.read ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${typeBg(notif.type)}`}>
                      {typeIcon(notif.type)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}