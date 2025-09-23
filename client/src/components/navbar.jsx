import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Menu, X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
    setShowSearchResults(false);
    setSearchQuery('');
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const links = [
    { label: 'Homepage', to: '/homepage' },
    { label: 'Categories', to: '/categories' },
    { label: 'Contacts', to: '/contacts' },
    { label: 'Profile', to: '/profile' },
  ];

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
      
      <nav className="bg-green-800 text-white shadow-lg backdrop-blur-sm relative z-50">
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* our logo */}
            <Link to="/homepage" className="flex items-center">
              <img 
                src="/src/assets/anisave_logo.png"
                alt="Logo"
                className="h-10 w-auto"
              />
            </Link>

            {/* navigation - desktop */}
            <div className="hidden md:flex gap-7 items-center">
              {links.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`hover:text-gray-300 transition-colors duration-200 font-medium ${
                    location.pathname.startsWith(to) ? 'text-white border-b-2 border-white' : ''
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* search bar - desktop */}
            <div className="hidden md:flex items-center gap-4">
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
                              src={user.avatar_url || '/default-avatar.png'} 
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
          className={`md:hidden absolute top-full left-0 w-full bg-green-800 shadow-2xl z-40 overflow-hidden transition-all duration-500 ease-in-out ${
            menuOpen 
              ? 'max-h-[500px] opacity-100 transform translate-y-0' : 'max-h-0 opacity-0 transform -translate-y-4'
          }`}
        >
          <div className="px-4 py-6 space-y-4">
            {/* mobile search */}
            <div 
              className={`relative transition-all duration-700 delay-100 ${
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-[9999] max-h-60 overflow-y-auto animate-fadeIn">
                  <div>
                    <div className="px-4 py-2 bg-gray-50 text-gray-700 font-semibold text-sm sticky top-0">Users</div>
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
                            src={user.avatar_url || '/default-avatar.png'} 
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
            
            {/* navigation links */}
            {links.map(({ label, to }, index) => (
              <Link
                key={to}
                to={to}
                className={`block text-white hover:text-gray-300 py-3 font-medium text-lg transition-all duration-500 delay-${(index + 2) * 100} hover:translate-x-1 hover:drop-shadow-lg ${
                  menuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            
            {/* logout button */}
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className={`w-full bg-red-500 hover:bg-red-600 px-4 py-3 rounded-full text-lg text-white font-medium transition-all duration-700 delay-600 hover:scale-105 hover:shadow-xl ${
                menuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
              }`}
            >
              Logout
            </button>
          </div>
        </div>

        {/* backdrop */}
        {menuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-30 transition-opacity duration-300"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </nav>
    </>
  );
}