import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Search, Home, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AboutModal from './aboutModal';
import ChatButton from './chatButton';
import CartButton from './cartButton';
import NotificationButton from './notificationButton';
import { usePresence } from '../hooks/usePresence';

export default function Navbar() {
  const { user } = useAuth();
  const [showAbout, setShowAbout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  usePresence();

  const closeSearch = () => {
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);
      setSearchResults({ users: users || [] });
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/farmer/${userId}`);
    closeSearch();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoClick = () => setShowAbout(true);

  const links = [
    { label: 'Homepage',   to: '/homepage' },
    { label: 'Categories', to: '/categories' },
    { label: 'Contacts',   to: '/contacts' },
    { label: 'Profile',    to: '/profile' },
  ];

  const handleNavigation = (to) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(to);
    closeSearch();
    window.dispatchEvent(new CustomEvent('closeOverlays'));
  };

  // Exact-match active tab so only ONE indicator shows at a time.
  // Uses the first path segment so sub-routes like /homepage/foo still match.
  const activeTab = '/' + (location.pathname.split('/')[1] || '');
  const isTabActive = (path) => activeTab === path;

  // For overlay tabs (notifications, chat) that don't change the URL,
  // track which one is open so only one indicator shows at a time.
  const [activeOverlayTab, setActiveOverlayTab] = useState(null);

  // When the URL-based tab changes, clear any overlay tab
  useEffect(() => {
    setActiveOverlayTab(null);
  }, [location.pathname]);

  if (!user) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.1s ease-out; }

        /* Mobile body padding: top nav + bottom nav + safe areas */
        @media (max-width: 767px) {
          body {
            padding-bottom: calc(env(safe-area-inset-bottom) + 4rem);
          }
          .mobile-nav-safe-top {
            padding-top: calc(env(safe-area-inset-top) + 0.75rem) !important;
          }
        }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav
        className="bg-green-800 text-white shadow-lg backdrop-blur-sm sticky top-0 z-[70] block"
      >
        <div className="px-4 py-3 mobile-nav-safe-top">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">

            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
              title="About AniSave"
            >
              <img src="/images/anisave_logo.webp" alt="Logo" className="h-10 w-auto" />
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex gap-7 items-center">
              {links.map(({ label, to }) => (
                <button
                  key={to}
                  onClick={() => handleNavigation(to)}
                  className={`hover:text-gray-300 transition-colors duration-200 font-medium ${
                    location.pathname.startsWith(to) ? 'text-white border-b-2 border-white' : ''
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop right side — search + action buttons */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-white w-8 h-8 p-1 border rounded-full bg-green-800" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-68 pl-10 pr-4 py-2 bg-white rounded-full text-black placeholder-black focus:outline-none focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 300)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                  />
                </div>
                {showSearchResults && searchResults.users?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-[9999] max-h-80 overflow-y-auto">
                    <div className="px-4 py-2 bg-gray-50 text-gray-700 font-semibold text-sm sticky top-0">Users</div>
                    {searchResults.users.map((u) => (
                      <div
                        key={u.id}
                        className="px-4 py-4 hover:bg-gray-50 cursor-pointer text-gray-800"
                        onMouseDown={(e) => { e.preventDefault(); handleUserClick(u.id); }}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${u.username || u.id}`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="font-medium truncate">{u.full_name || u.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <NotificationButton />
              <CartButton />
              <ChatButton />
            </div>

            {/* ── MOBILE: Search + Logout (right of logo) ── */}
            <div className="flex md:hidden items-center gap-2 flex-1 justify-end">
              <AnimatePresence mode="wait">
                {isMobileSearchOpen ? (
                  <motion.div
                    key="mobile-search-expanded"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-green-800 w-4 h-4 pointer-events-none" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white rounded-full text-black text-sm placeholder-gray-400 focus:outline-none ring-2 ring-green-600/20 focus:ring-green-500"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearch(e.target.value);
                        }}
                        onBlur={() => {
                          if (!searchQuery) {
                            setTimeout(() => setIsMobileSearchOpen(false), 200);
                          }
                          setTimeout(() => setShowSearchResults(false), 300);
                        }}
                      />
                    </div>

                    {/* Mobile search dropdown */}
                    {showSearchResults && searchResults.users?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-[9999] max-h-72 overflow-y-auto animate-fadeIn">
                        <div className="px-4 py-2 bg-gray-50 text-gray-700 font-semibold text-xs sticky top-0">
                          Users
                        </div>
                        {searchResults.users.map((u) => (
                          <div
                            key={u.id}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleUserClick(u.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  u.avatar_url ||
                                  `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${u.username || u.id}`
                                }
                                alt=""
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="font-medium truncate text-sm">
                                {u.full_name || u.username}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.button
                    key="mobile-search-icon"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-green-700 hover:bg-green-600 transition-colors flex-shrink-0"
                    title="Search"
                  >
                    <Search className="w-4 h-4 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-green-700 hover:bg-red-500 transition-colors flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── BOTTOM TAB BAR (Mobile Only) ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 w-full bg-green-800 text-white z-[60] flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.1)] px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Home */}
        <motion.button
          onClick={() => { setActiveOverlayTab(null); handleNavigation('/homepage'); }}
          className={`relative flex flex-col items-center justify-center py-2 px-1 flex-1 min-w-0 transition-colors hover:bg-green-700/50 ${
            isTabActive('/homepage') && !activeOverlayTab ? 'text-white' : 'text-green-100/70 hover:text-white'
          }`}
        >
          <div className={`relative ${isTabActive('/homepage') && !activeOverlayTab ? 'scale-110' : ''} transition-transform`}>
            <Home className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">Home</span>
          {isTabActive('/homepage') && !activeOverlayTab && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-t-full" />
          )}
        </motion.button>

        {/* Alerts */}
        <NotificationButton
          mobileTab
          mobileMenu
          isActive={activeOverlayTab === 'notifications'}
          onOpen={(open) => setActiveOverlayTab(open ? 'notifications' : null)}
        />

        {/* Cart */}
        <CartButton
          mobileTab
          mobileMenu
          isActive={isTabActive('/cart') && !activeOverlayTab}
        />

        {/* Chat */}
        <ChatButton
          mobileTab
          mobileMenu
          isActive={activeOverlayTab === 'chat'}
          onOpen={(open) => setActiveOverlayTab(open ? 'chat' : null)}
        />

        {/* Profile (replaces Menu) */}
        <motion.button
          onClick={() => { setActiveOverlayTab(null); handleNavigation('/profile'); }}
          className={`relative flex flex-col items-center justify-center py-2 px-1 flex-1 min-w-0 transition-colors hover:bg-green-700/50 ${
            isTabActive('/profile') && !activeOverlayTab ? 'text-white' : 'text-green-100/70 hover:text-white'
          }`}
        >
          <div className={`relative ${isTabActive('/profile') && !activeOverlayTab ? 'scale-110' : ''} transition-transform`}>
            <User className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">Profile</span>
          {isTabActive('/profile') && !activeOverlayTab && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-t-full" />
          )}
        </motion.button>
      </div>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}