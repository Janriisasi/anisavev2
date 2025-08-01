import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/productCard';
import productPrices from '../data/productPrices.json';
import { TrendingUp, Package, ShoppingCart, Star, Plus } from 'lucide-react';

const Home = () => {
  const [user, setUser] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        fetchMyProducts(user.id);
        generateProductsFromPrices();
      }
    };

    getUser();
  }, []);

  const fetchMyProducts = async (userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);

    if (!error) setMyProducts(data);
    else console.error('Error fetching your products:', error.message);
  };

  //generate products from productPrices.json
  const generateProductsFromPrices = () => {
    const products = [];
    let productId = 1;

    Object.entries(productPrices).forEach(([category, items]) => {
      Object.entries(items).forEach(([name, price]) => {
        products.push({
          id: productId++,
          name: name,
          category: category,
          price: price,
          quantity_kg: Math.floor(Math.random() * 100) + 10, // Random quantity
          image_url: `https://via.placeholder.com/300x200?text=${encodeURIComponent(name)}`,
          description: `Fresh ${name.toLowerCase()} available for purchase`,
          profiles: null // Will be populated when viewing sellers
        });
      });
    });

    setAllProducts(products);
  };

  const handleSaveContact = async (farmerId) => {
    if (!user) {
      alert('Please login to save contacts');
      return;
    }

    const { error } = await supabase.from('saved_contacts').insert({
      buyer_id: user.id,
      farmer_id: farmerId,
    });

    if (error) {
      if (error.code === '23505') {
        alert('Contact already saved!');
      } else {
        alert('Error saving contact');
      }
    } else {
      alert('Contact saved successfully!');
    }
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = myProducts.reduce((acc, product) => acc + (product.price * 10), 0);
  const avgRating = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50">
      <div className="p-6">
        <h2 className="text-center text-4xl font-bold text-gray-800 mb-6">Dashboard</h2>
        {/* dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Best Seller</p>
                <h2 className="text-xl font-bold text-gray-800 mt-1">
                  {myProducts[0]?.name || 'No products yet'}
                </h2>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Sales Summary</p>
                <h2 className="text-xl font-bold text-gray-800 mt-1">₱{totalSales.toLocaleString()}</h2>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Your Rating</p>
                <h2 className="text-xl font-bold text-gray-800 mt-1">{avgRating}/5</h2>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Your Products</p>
                <h2 className="text-xl font-bold text-gray-800 mt-1">{myProducts.length}</h2>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* explore products */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h2 className="text-center text-4xl font-bold text-gray-800 mb-6">Explore Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard
                  product={product}
                  onSaveContact={() => handleSaveContact(product.profiles?.id)}
                  showSaveButton={false}
                />
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;