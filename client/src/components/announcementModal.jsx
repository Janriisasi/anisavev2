import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementModal({ isOpen, onClose }) {
  const priceData = {
    vegetables: [
      { name: 'Eggplant', prev: '128.56', new: '207.50', change: '+78.94', trend: 'up' },
      { name: 'Tomato', prev: '142.89', new: '120.83', change: '-22.06', trend: 'down' },
      { name: 'Cabbage', prev: '88.66', new: '92.50', change: '+3.84', trend: 'up' },
      { name: 'Squash', prev: '67.53', new: '58.33', change: '-9.20', trend: 'down' },
      { name: 'String Beans', prev: '120.86', new: '150.00', change: '+29.14', trend: 'up' },
      { name: 'Ampalaya', prev: '130.68', new: '219.58', change: '+88.90', trend: 'up' },
      { name: 'Pechay', prev: '121.74', new: '136.67', change: '+14.93', trend: 'up' },
      { name: 'Carrot', prev: '161.24', new: '161.11', change: '-0.13', trend: 'down' },
      { name: 'Bell Pepper', prev: '303.83', new: '311.11', change: '+7.28', trend: 'up' },
      { name: 'Broccoli', prev: '194.67', new: '423.33', change: '+228.66', trend: 'up' },
      { name: 'Potato', prev: '142.38', new: '161.82', change: '+19.44', trend: 'up' },
      { name: 'Sitao', prev: '120.86', new: '150.00', change: '+29.14', trend: 'up' },
      { name: 'Lettuce (Green Ice)', prev: '206.19', new: '307.78', change: '+101.59', trend: 'up' },
      { name: 'Lettuce (Iceberg)', prev: '206.81', new: '343.33', change: '+136.52', trend: 'up' },
      { name: 'Lettuce (Romaine)', prev: '197.50', new: '298.57', change: '+101.07', trend: 'up' }
    ],
    fruits: [
      { name: 'Mango', prev: '218.31', new: '216.36', change: '-1.95', trend: 'down' },
      { name: 'Calamansi', prev: '146.17', new: '115.83', change: '-30.34', trend: 'down' },
      { name: 'Papaya', prev: '70.38', new: '71.11', change: '+0.73', trend: 'up' },
      { name: 'Watermelon', prev: '76.33', new: '76.88', change: '+0.55', trend: 'up' },
      { name: 'Avocado', prev: '433.91', new: '333.33', change: '-100.58', trend: 'down' },
      { name: 'Melon', prev: '104.15', new: '104.55', change: '+0.40', trend: 'up' },
      { name: 'Pomelo', prev: '183.39', new: '175.00', change: '-8.39', trend: 'down' },
      { name: 'Banana (Lakatan)', prev: '97.63', new: '95.42', change: '-2.21', trend: 'down' },
      { name: 'Banana (Latundan)', prev: '75.18', new: '74.00', change: '-1.18', trend: 'down' },
      { name: 'Banana (Saba)', prev: '53.32', new: '50.45', change: '-2.87', trend: 'down' }
    ],
    grains: [
      { name: 'Rice (Fancy White)', prev: '56.92', new: '56.92', change: '0', trend: 'stable' },
      { name: 'Rice (Premium 5%)', prev: '48.39', new: '49.75', change: '+1.36', trend: 'up' },
      { name: 'Rice (Well Milled)', prev: '42.29', new: '43.80', change: '+1.51', trend: 'up' },
      { name: 'Rice (Regular Milled)', prev: '37.25', new: '38.38', change: '+1.13', trend: 'up' },
      { name: 'Corn (White Glutinous)', prev: '97.65', new: '120.00', change: '+22.35', trend: 'up' },
      { name: 'Corn (Yellow Sweet)', prev: '78.58', new: '92.73', change: '+14.15', trend: 'up' },
      { name: 'Corn Grits (Feed Grade)', prev: '47.50', new: '45.00', change: '-2.50', trend: 'down' }
    ],
    herbsSpices: [
      { name: 'Ginger', prev: '193.50', new: '204.29', change: '+10.79', trend: 'up' },
      { name: 'Garlic', prev: '414.29', new: '400.00', change: '-14.29', trend: 'down' },
      { name: 'Red Onion', prev: '215.11', new: '304.44', change: '+89.33', trend: 'up' },
      { name: 'Chili', prev: '422.29', new: '595.45', change: '+173.16', trend: 'up' }
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
      className="mb-6"
    >
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        {category} — {subtitle}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full bg-white text-xs sm:text-sm">
          <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold">Product</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">Prev (Nov 11)</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">New (Nov 30)</th>
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
                <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-700">
                  {item.name}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-gray-600">
                  ₱{item.prev}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-right font-bold text-gray-800">
                  ₱{item.new}
                </td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold ${getTrendColor(item.trend)}`}>
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
              className="bg-white rounded-2xl w-full max-w-[95%] sm:max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col pointer-events-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6 text-center border-b border-gray-100 bg-cover bg-center bg-no-repeat relative"
                style={{ backgroundImage: 'url(/images/bg_feat.webp)' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="flex flex-col items-center">
                  <img
                    src="/images/anisave_logo.webp"
                    alt="AniSave Logo"
                    className="h-12 sm:h-16 w-auto mb-1"
                  />
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-1">📢 MARKET PRICE UPDATE</h2>
                  <p className="text-white text-xs sm:text-sm">
                    November 30, 2025 DPI-AFC Report
                  </p>
                </div>
              </motion.div>

              {/* Content */}
              <div className="p-3 sm:p-6 space-y-4">
                {/* Intro */}
                <motion.div
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-r-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-gray-700 text-xs sm:text-sm font-medium">
                    The latest market update is IN! Some prices really SHOCKED the charts!
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
                  className="bg-green-100 rounded-lg p-3 sm:p-4 text-center border-2 border-green-300 mt-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm sm:text-lg font-bold text-gray-800">
                    TOTAL PRODUCTS UPDATED: <span className="text-green-700">46 items</span>
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