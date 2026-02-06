import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementModal({ isOpen, onClose }) {
  const priceData = {
    vegetables: [
    { name: 'Eggplant', prev: '109.08', new: '95.99', change: '-13.09', trend: 'down' },
    { name: 'Tomato', prev: '175.42', new: '77.12', change: '-98.30', trend: 'down' },
    { name: 'Cabbage', prev: '96.64', new: '85.00', change: '-11.64', trend: 'down' },
    { name: 'Squash', prev: '60.15', new: '60.92', change: '+0.77', trend: 'up' },
    { name: 'String Beans', prev: '136.98', new: '137.56', change: '+0.58', trend: 'up' },
    { name: 'Ampalaya', prev: '116.11', new: '165.66', change: '+49.55', trend: 'up' },
    { name: 'Pechay', prev: '99.62', new: '86.64', change: '-12.98', trend: 'down' },
    { name: 'Carrot', prev: '109.61', new: '97.65', change: '-11.96', trend: 'down' },
    { name: 'Bell Pepper', prev: '466.57', new: '238.80', change: '-227.77', trend: 'down' },
    { name: 'Broccoli', prev: '267.50', new: '201.67', change: '-65.83', trend: 'down' },
    { name: 'Potato', prev: '150.39', new: '124.01', change: '-26.38', trend: 'down' },
    { name: 'Sitao', prev: '136.98', new: '137.56', change: '+0.58', trend: 'up' },
    { name: 'Lettuce (Green Ice)', prev: '375.74', new: '190.56', change: '-185.18', trend: 'down' },
    { name: 'Lettuce (Iceberg)', prev: '450.00', new: '265.95', change: '-184.05', trend: 'down' },
    { name: 'Lettuce (Romaine)', prev: '391.30', new: '246.40', change: '-144.90', trend: 'down' }
  ],

    fruits: [
    { name: 'Mango', prev: '211.64', new: '200.23', change: '-11.41', trend: 'down' },
    { name: 'Calamansi', prev: '136.03', new: '131.34', change: '-4.69', trend: 'down' },
    { name: 'Papaya', prev: '72.04', new: '72.17', change: '+0.13', trend: 'up' },
    { name: 'Watermelon', prev: '76.90', new: '79.34', change: '+2.44', trend: 'up' },
    { name: 'Avocado', prev: '378.62', new: '331.86', change: '-46.76', trend: 'down' },
    { name: 'Melon', prev: '108.13', new: '105.37', change: '-2.76', trend: 'down' },
    { name: 'Pomelo', prev: '177.59', new: '185.96', change: '+8.37', trend: 'up' },
    { name: 'Banana (Lakatan)', prev: '97.33', new: '99.31', change: '+1.98', trend: 'up' },
    { name: 'Banana (Latundan)', prev: '75.56', new: '75.74', change: '+0.18', trend: 'up' },
    { name: 'Banana (Saba)', prev: '53.54', new: '55.77', change: '+2.23', trend: 'up' }
  ],

    grains: [
    { name: 'Rice (Premium 5%)', prev: '50.48', new: '52.16', change: '+1.68', trend: 'up' },
    { name: 'Rice (Well Milled)', prev: '43.76', new: '45.60', change: '+1.84', trend: 'up' },
    { name: 'Rice (Regular Milled)', prev: '38.88', new: '41.60', change: '+2.72', trend: 'up' },
    { name: 'Corn (White Glutinous)', prev: '104.62', new: '84.00', change: '-20.62', trend: 'down' },
    { name: 'Corn (Yellow Sweet)', prev: '90.11', new: '82.88', change: '-7.23', trend: 'down' },
    { name: 'Corn Grits (Feed Grade)', prev: '47.50', new: '46.67', change: '-0.83', trend: 'down' }
  ],

    herbsSpices: [
    { name: 'Ginger', prev: '165.78', new: '155.92', change: '-9.86', trend: 'down' },
    { name: 'Garlic', prev: '410.00', new: '366.67', change: '-43.33', trend: 'down' },
    { name: 'Red Onion', prev: '227.78', new: '150.09', change: '-77.69', trend: 'down' },
    { name: 'Chili', prev: '725.96', new: '258.76', change: '-467.20', trend: 'down' }
  ]
};

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '🔺';
    if (trend === 'down') return '🔻';
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-red-600';
    if (trend === 'down') return 'text-blue-600';
  };

  const PriceTable = ({ data, category, emoji, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-4 sm:mb-6"
    >
      <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
        {category} — {subtitle}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full bg-white text-xs sm:text-sm">
          <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold">Product</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">Prev (Dec 26)</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">New (Feb 6)</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  item.hot ? 'bg-yellow-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="py-1.5 sm:py-3 px-2 sm:px-4 font-medium text-gray-700">
                  {item.name}
                </td>
                <td className="py-1.5 sm:py-3 px-2 sm:px-4 text-right text-gray-600">
                  ₱{item.prev}
                </td>
                <td className="py-1.5 sm:py-3 px-2 sm:px-4 text-right font-bold text-gray-800">
                  ₱{item.new}
                </td>
                <td className={`py-1.5 sm:py-3 px-2 sm:px-4 text-right font-semibold ${getTrendColor(item.trend)}`}>
                  {getTrendIcon(item.trend)} {item.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-[90%] sm:max-w-5xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col pointer-events-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                className="pt-3 sm:pt-6 pb-3 sm:pb-6 px-3 sm:px-6 text-center border-b border-gray-100 bg-cover bg-center bg-no-repeat relative"
                style={{ backgroundImage: 'url(/images/bg_feat.webp)' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="flex flex-col items-center">
                  <img
                    src="/images/anisave_logo.webp"
                    alt="AniSave Logo"
                    className="h-10 sm:h-16 w-auto mb-1"
                  />
                  <h2 className="text-base sm:text-xl font-bold text-white mb-1">📢 MARKET PRICE UPDATE</h2>
                  <p className="text-white text-xs sm:text-sm">
                    December 26, 2025 DPI-AFC Report
                  </p>
                </div>
              </motion.div>

              {/* Content */}
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                {/* Intro */}
                <motion.div
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-2.5 sm:p-4 rounded-r-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-gray-700 text-xs sm:text-sm font-medium">
                    Fresh market update is here! Prices cooled down sharply for vegetables and spices,
                    with massive drops in tomato, bell pepper, lettuce, and chili — while rice prices
                    continue to creep upward.
                  </p>
                </motion.div>

                {/* Vegetables Table */}
                <PriceTable 
                  data={priceData.vegetables} 
                  category="VEGETABLES" 
                  subtitle="THE BIG SHAKERS!"
                />

                {/* Fruits Table */}
                <PriceTable 
                  data={priceData.fruits} 
                  category="FRUITS" 
                  subtitle="SWEET RISES & FALLS!"
                />

                {/* Grains Table */}
                <PriceTable 
                  data={priceData.grains} 
                  category="GRAINS" 
                  subtitle="SLOW BUT STEADY CHANGES"
                />

                {/* Herbs & Spices Table */}
                <PriceTable 
                  data={priceData.herbsSpices} 
                  category="HERBS & SPICES" 
                  subtitle="THE SPICY SURPRISE!"
                />

                {/* Summary */}
                <motion.div
                  className="bg-green-100 rounded-lg p-3 sm:p-4 text-center border-2 border-green-300 mt-4 sm:mt-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm sm:text-lg font-bold text-gray-800">
                    TOTAL PRODUCTS UPDATED: <span className="text-green-700">33 items</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Stay informed with AniSave's market updates!
                  </p>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200 text-center sticky bottom-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={onClose}
                  className="bg-green-600 text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-xs sm:text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Got it!
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}