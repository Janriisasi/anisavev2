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
    <nav className="bg-green-800 text-white px-4 py-3 shadow-lg backdrop-blur-sm relative z-50">
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
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
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
                      onClick={() => {
                        navigate(`/farmer/${user.id}`);
                        setShowSearchResults(false);
                        setSearchQuery('');
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
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 mt-3 px-4 bg-green-700/50 backdrop-blur-sm rounded-lg relative z-40">
          {/* mobile search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
            
            {/* mobile search results */}
            {showSearchResults && searchResults.users?.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-[9999] max-h-60 overflow-y-auto">
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-gray-700 font-semibold text-sm sticky top-0">Users</div>
                  {searchResults.users.map((user) => (
                    <div
                      key={user.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        navigate(`/farmer/${user.id}`);
                        setShowSearchResults(false);
                        setSearchQuery('');
                        setMenuOpen(false);
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
          
          {links.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="text-white hover:text-yellow-300 py-2 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-sm text-white font-medium mb-4"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}