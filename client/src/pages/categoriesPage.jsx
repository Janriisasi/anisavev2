import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import ProductCard from '../components/productCard';
import productPrices from '../data/productPrices.json';
import { ArrowLeft, ChevronUp } from 'lucide-react';

export default function CategoriesPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [showSellers, setShowSellers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

    const productImages = {
    // vegetables
    "Eggplant": "/images/eggplant.webp",
    "Tomato": "/images/tomato.webp",
    "Cabbage": "/images/cabbage.webp",
    "Carrot": "/images/carrots.webp",
    "Potato": "/images/potato.webp",
    "Squash": "/images/squash.webp",
    "String Beans": "/images/54EDF324AD7242CA.png!c750x0.webp",
    "Ampalaya": "/images/107992536.webp",
    "Okra": "/images/okra.webp",
    "Pechay": "/images/pechay.webp",
    "Bell Pepper": "/images/bellpepper.webp",
    "Broccoli": "/images/broccoli.webp",
    "Lettuce (Green Ice)": "/images/lettuce_green.webp",
    "Lettuce (Iceberg)": "/images/lettuce_iceberg.webp",
    "Lettuce (Romaine)": "/images/lettuce_romaine.webp",
    "Sitao": "/images/sitao.webp",

    // fruits
    "Mango": "/images/mango.webp",
    "Banana (Lakatan)": "/images/lakatan.webp",
    "Banana (Latundan)": "/images/latundan.webp",
    "Banana (Saba)": "/images/saba.webp",
    "Calamansi": "/images/calamansi.webp",
    "Papaya": "/images/papaya.webp",
    "Pineapple": "/images/pineapple.webp",
    "Watermelon": "/images/watermelon.webp",
    "Lanzones": "/images/lanzones.webp",
    "Rambutan": "/images/rambutan.webp",
    "Durian": "/images/durian.webp",
    "Guyabano": "/images/guyabano.webp",
    "Avocado": "/images/avocado.webp",
    "Melon": "/images/melon.webp",
    "Pomelo": "/images/pomelo.webp",

    // grains
    "Rice (Local Fancy White)": "/images/rice_fancywhite.webp",
    "Rice (Local Premium 5% broken)": "/images/rice_premium.webp",
    "Rice (Local Well Milled)": "/images/will_milled_rice.webp",
    "Rice (Local Regular Milled)": "/images/rice_wellmilled.webp",
    "Corn (White Cob, Glutinous)": "/images/white_cob_corn.webp",
    "Corn (Yellow Cob, Sweet)": "/images/yellowcob_cornsweet.webp",
    "Corn Grits (White, Food Grade)": "/images/whitecorn_grits_foodgrade.webp",
    "Corn Grits (Yellow, Food Grade)": "/images/yellowcorn_grits_foodgrade.webp",
    "Corn Cracked (Yellow, Feed Grade)": "/images/yellowcob_corn_feedgrade.webp",
    "Corn Grits (Feed Grade)": "/images/corngrits.webp",
    "Sorghum": "/images/sorghum.webp",
    "Millet": "/images/millet.webp",

    // herbs & spices
    "Ginger": "/images/ginger.webp",
    "Garlic": "/images/garlic.webp",
    "Red Onion": "/images/onion.webp",
    "Chili": "/images/chili.webp",
    "Lemongrass": "/images/lemongrass.webp",
    "Basil": "/images/basil.webp",
    "Turmeric": "/images/turmeric.webp"
  };

  const categories = ['Vegetables', 'Fruits', 'Grains', 'HerbsAndSpices'];

  useEffect(() => {
    setLoading(true);
    setProducts([]);
    
    if (name) {
      generateCategoryProducts();
    } else {
      generateAllProducts();
    }
  }, [name]);

  const getProductImage = (category, productName) => {
    return productImages[productName] || `https://via.placeholder.com/300x200?text=${encodeURIComponent(productName)}`;
  };

  const groupProductsByName = (allProducts) => {
    const grouped = new Map();
    
    allProducts.forEach(product => {
      const key = `${product.name.toLowerCase().trim()}_${product.category.toLowerCase().trim()}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...product,
          variations: [product]
        });
      } else {
        const existing = grouped.get(key);
        existing.variations.push(product);
      }
    });
    
    return Array.from(grouped.values());
  };

  const generateCategoryProducts = async () => {
    setLoading(true);
    const allCategoryProducts = [];
    let productId = 1;

    // Get default prices from productPrices.json for this category
    const defaultPrices = productPrices[name] || {};

    // Fetch products from db to get seller information
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles(id, username, full_name, avatar_url, address, contact_number)
      `)
      .eq('category', name)
      .eq('status', 'Available');

    // Add template products from productPrices.json
    if (defaultPrices && typeof defaultPrices === 'object') {
      Object.entries(defaultPrices).forEach(([productName, defaultPrice]) => {
        if (productName === 'images' || typeof defaultPrice !== 'number') {
          return;
        }

        // Filter sellers for this product
        const productSellers = dbProducts?.filter(p => p.name === productName) || [];

        allCategoryProducts.push({
          id: `template-${productId++}`,
          name: productName,
          category: name,
          price: defaultPrice,
          quantity_kg: Math.floor(Math.random() * 100) + 10,
          image_url: getProductImage(name, productName),
          description: `Fresh ${productName.toLowerCase()} from local farmers`,
          profiles: null,
          variations: productSellers
        });
      });
    }

    // Group products by name and category
    const groupedProducts = groupProductsByName(allCategoryProducts);
    
    setProducts(groupedProducts);
    setLoading(false);
  };

  const generateAllProducts = async () => {
    setLoading(true);
    const allProducts = [];
    let productId = 1;

    // Add template products from productPrices.json
    Object.entries(productPrices).forEach(([category, items]) => {
      if (typeof items === 'object' && items !== null) {
        Object.entries(items).forEach(([productName, priceData]) => {
          if (productName === 'images' || typeof priceData !== 'number') {
            return;
          }

          allProducts.push({
            id: `template-${productId++}`,
            name: productName,
            category: category,
            price: priceData,
            quantity_kg: Math.floor(Math.random() * 100) + 10,
            image_url: getProductImage(category, productName),
            description: `Fresh ${productName.toLowerCase()} from local farmers`,
            profiles: null
          });
        });
      }
    });

    // Group products by name and category
    const groupedProducts = groupProductsByName(allProducts);
    
    setProducts(groupedProducts);
    setLoading(false);
  };

  const filteredProducts = () => {
    return products.filter(product => 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleViewSellers = (product) => {
    setSelectedProduct(product);
    setSellers(product.variations || [product]);
    setShowSellers(true);
  };

  const handleSaveContact = async (farmerId) => {
    const { data: { user } } = await supabase.auth.getUser();
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

if (showSellers && selectedProduct) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setShowSellers(false)}
          className="flex items-center gap-2 text-green-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* product details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 h-fit">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Product Details</h2>
            <img
              src={selectedProduct.image_url || '/placeholder.jpg'}
              alt={selectedProduct.name}
              className="w-full h-64 object-cover rounded-xl mb-4"
            />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{selectedProduct.name}</h3>
            <p className="text-gray-600 mb-2">Category: {selectedProduct.category}</p>
            <p className="text-green-600 font-bold text-lg mb-2">
              Market Price: ₱{selectedProduct.price}/kg
            </p>
            <p className="text-gray-700">{selectedProduct.description}</p>
          </div>

          {/* sellers list */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
              Available Sellers ({sellers.length})
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sellers.map((seller, index) => (
                <div
                  key={`${seller.id}-${index}`}
                  className="bg-white rounded-xl p-4 shadow border border-gray-100"
                >
                  {seller.profiles ? (
                    <>
                      <div className="flex items-center gap-4 mb-3">
                        <img
                          src={seller.profiles.avatar_url || '/default-avatar.png'}
                          alt="Seller"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {seller.profiles.username || seller.profiles.full_name}
                          </h4>
                          {seller.profiles.address && (
                            <p className="text-sm text-gray-600">{seller.profiles.address}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500">Price:</span>
                          <span className="font-semibold text-green-600 ml-1">
                            ₱{seller.price}/kg
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Available:</span>
                          <span className="font-semibold ml-1">{seller.quantity_kg} kg</span>
                        </div>
                      </div>

                      {seller.profiles.contact_number && (
                        <div className="text-sm text-gray-600 mb-3">
                          Contact: {seller.profiles.contact_number}
                        </div>
                      )}

                      <button
                        onClick={() => handleSaveContact(seller.profiles.id)}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        Save Contact
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500">Market Price:</span>
                          <span className="font-semibold text-green-600 ml-1">₱{seller.price}/kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Available:</span>
                          <span className="font-semibold ml-1">{seller.quantity_kg} kg</span>
                        </div>
                      </div>
                      <p className="text-gray-500">Template Product - No specific seller</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-4 sm:right-6 md:right-8 lg:right-32 bg-green-800 hover:bg-green-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
    <div className="max-w-7xl mx-auto">
      {name ? (
        <div className="mb-6">
          <div className="block sm:hidden">
            <button
              onClick={() => navigate('/categories')}
              className="flex items-center text-green-800 font-medium mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-center text-2xl font-bold text-gray-800">
              {name === 'HerbsAndSpices' ? 'Herbs & Spices' : name} Products
            </h1>
          </div>
          <div className="hidden sm:flex items-center justify-between">
            <button
              onClick={() => navigate('/categories')}
              className="flex items-center gap-2 text-green-800 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Categories</span>
            </button>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 flex-1 text-center">
              {name === 'HerbsAndSpices' ? 'Herbs & Spices' : name} Products
            </h1>
            <div className="w-[160px]"></div>
          </div>
        </div>
      ) : (
        <h1 className="text-center text-2xl sm:text-4xl font-bold text-gray-800 mb-6">
          Categories
        </h1>
      )}

     {!name && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-10">
        {categories.map((category) => {
          const displayName = category === 'HerbsAndSpices' ? 'Herbs & Spices' : category;

          return (
            <Link
              key={category}
              to={`/categories/${category}`}
              className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm border border-white/20 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-green-800 text-center group h-16 sm:h-24 flex items-center justify-center"
            >
              <h3 className="font-semibold text-xs sm:text-sm text-gray-800 group-hover:text-white line-clamp-2">
                {displayName}
              </h3>
            </Link>
          );
        })}
      </div>
    )}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white backdrop-blur-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : filteredProducts().length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20 text-center">
          <p className="text-gray-500 text-lg">
            {search ? 'No products found matching your search.' : 'No products found in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts().map((product) => (
            <div key={product.id} className="relative">
              <ProductCard
                product={product}
                onViewSellers={() => handleViewSellers(product)}
                showSaveButton={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>

    {showScrollTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-4 sm:right-6 md:right-8 lg:right-32 bg-green-800 hover:bg-green-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <ChevronUp size={24} />
      </button>
    )}
  </div>
);
}