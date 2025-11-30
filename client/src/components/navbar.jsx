import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Menu, X, Search, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import AboutModal from './aboutModal';
import AnnouncementModal from './announcementModal';

export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const closeMenu = () => {
    setMenuOpen(false);
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
      //search only users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);

      setSearchResults({
        users: users || []
      });
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleUserClick = (userId) => {
    console.log('Clicking on user:', userId);
    navigate(`/farmer/${userId}`);
    closeMenu();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoClick = () => {
    setShowAbout(true);
  };

  const links = [
    { label: 'Homepage', to: '/homepage' },
    { label: 'Categories', to: '/categories' },
    { label: 'Contacts', to: '/contacts' },
    { label: 'Profile', to: '/profile' },
  ];

  const handleNavigation = (to) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(to);
    closeMenu();
  };

  //if no user the navbar will not appear
  if (!user) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.1s ease-out;
        }
      `}</style>
      
      <nav className="bg-green-800 text-white shadow-lg backdrop-blur-sm sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* our logo */}
            <button onClick={handleLogoClick} className="flex items-center hover:opacity-80 transition-opacity cursor-pointer" title="About AniSave">
              <img 
                src="/images/anisave_logo.webp"
                alt="Logo"
                className="h-10 w-auto"
              />
            </button>

            {/* navigation - desktop */}
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

            {/* search bar and announcement - desktop */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-white w-8 h-8 p-1 border rounded-full bg-green-800" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-68 pl-10 pr-4 py-2 bg-white rounded-full text-black placeholder-black focus:outline-none focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    onBlur={() => {
                      //increased the timeout to allow click events to process
                      setTimeout(() => setShowSearchResults(false), 300);
                    }}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                  />
                </div>
                
                {/* search results dropdown */}
                {showSearchResults && searchResults.users?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-[9999] max-h-80 overflow-y-auto">
                    <div>
                      <div className="px-4 py-2 bg-gray-50 text-gray-700 font-semibold text-sm sticky top-0">Users</div>
                      {searchResults.users.map((user) => (
                        <div
                          key={user.id}
                          className="px-4 py-4 hover:bg-gray-50 cursor-pointer text-gray-800"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleUserClick(user.id);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={user.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${user.username || user.id}`} 
                              alt="" 
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{user.full_name || user.username}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Announcement button - desktop */}
              <button
                onClick={() => setShowAnnouncement(true)}
                className="relative p-2 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-all duration-200 hover:scale-110 group"
                title="View Market Updates"
              >
                <Megaphone className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>
            </div>

            {/* mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="transition-transform duration-300 hover:scale-110"
              >
                <div className={`transition-all duration-300 ${menuOpen ? 'rotate-90' : 'rotate-0'}`}>
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* mobile menu animation */}
        <div 
          className={`md:hidden absolute top-full left-0 w-full bg-green-800 shadow-2xl z-20 overflow-visible transition-all duration-500 ease-in-out ${
            menuOpen 
              ? 'max-h-screen opacity-100 transform translate-y-0' 
              : 'max-h-0 opacity-0 transform -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="px-4 py-6 space-y-4">
            {/* mobile search */}
            <div 
              className={`relative transition-all duration-700 delay-100 z-50 ${
                menuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
              }`}
            >
              <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-white w-8 h-8 p-1 border rounded-full bg-green-800" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-black placeholder-black focus:outline-none focus:border-transparent transition-all duration-300 hover:shadow-lg"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSearchResults(false), 300);
                }}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              
              {/* mobile search results */}
              {showSearchResults && searchResults.users?.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-[60] max-h-60 overflow-y-auto animate-fadeIn">
                  <div>
                    <div className="px-4 py-2 bg-gray-50 text-gray-700 font-semibold text-sm sticky top-0 z-[60]">Users</div>
                    {searchResults.users.map((user, index) => (
                      <div
                        key={user.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0 transition-all duration-300 hover:translate-x-1`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleUserClick(user.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${user.username || user.id}`} 
                            alt="" 
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0" 
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate text-sm">{user.username || user.full_name}</div>
                            <div className="text-xs text-gray-500">Farmer</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Announcement button - mobile */}
            <button
              onClick={() => {
                setShowAnnouncement(true);
                closeMenu();
              }}
              className={`w-full bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-full text-lg text-white font-medium transition-all duration-700 hover:scale-105 flex items-center justify-center gap-2 ${
                menuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
              }`}
              style={{
                transitionDelay: menuOpen ? '200ms' : '0ms',
                pointerEvents: menuOpen ? 'auto' : 'none'
              }}
            >
              <Megaphone size={20} />
              Market Updates 📢
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            
            {/* navigation links */}
            {links.map(({ label, to }, index) => (
              <button
                key={to}
                onClick={() => handleNavigation(to)}
                className={`block text-white hover:text-gray-300 py-3 font-medium text-lg transition-all duration-500 hover:translate-x-1 hover:drop-shadow-lg w-full text-left ${
                  menuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
                }`}
                style={{
                  transitionDelay: menuOpen ? `${(index + 3) * 100}ms` : '0ms',
                  pointerEvents: menuOpen ? 'auto' : 'none'
                }}
              >
                {label}
              </button>
            ))}
            
            {/* logout button */}
            <button
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
              className={`w-full bg-red-500 hover:bg-red-600 px-4 py-3 rounded-full text-lg text-white font-medium transition-all duration-700 hover:scale-105 hover:shadow-xl ${
                menuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
              }`}
              style={{
                transitionDelay: menuOpen ? '700ms' : '0ms',
                pointerEvents: menuOpen ? 'auto' : 'none'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* backdrop */}
        {menuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-10 bg-black/20 transition-opacity duration-300"
            onClick={closeMenu}
          />
        )}
      </nav>

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Announcement Modal */}
      <AnnouncementModal isOpen={showAnnouncement} onClose={() => setShowAnnouncement(false)} />
    </>
  );
}