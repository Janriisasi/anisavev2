// Import necessary hooks and Supabase client
import { useState } from 'react';
import supabase from '../lib/supabase';

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchQuery}%`);

    if (error) {
      console.error('Search error:', error.message);
    } else {
      if (onSearch) {
        onSearch(data);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search products"
          className="w-full px-3 py-2 border rounded"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;