import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementModal({ isOpen, onClose }) {
  const priceData = {
    vegetables: [
      { name: 'Eggplant', prev: '207.50', new: '109.08', change: '-98.42', trend: 'down' },
      { name: 'Tomato', prev: '120.83', new: '175.42', change: '+54.59', trend: 'up' },
      { name: 'Cabbage', prev: '92.50', new: '96.64', change: '+4.14', trend: 'up' },
      { name: 'Squash', prev: '58.33', new: '60.15', change: '+1.82', trend: 'up' },
      { name: 'String Beans', prev: '150.00', new: '136.98', change: '-13.02', trend: 'down' },
      { name: 'Ampalaya', prev: '219.58', new: '116.11', change: '-103.47', trend: 'down' },
      { name: 'Pechay', prev: '136.67', new: '99.62', change: '-37.05', trend: 'down' },
      { name: 'Carrot', prev: '161.11', new: '109.61', change: '-51.50', trend: 'down' },
      { name: 'Bell Pepper', prev: '466.57', new: '466.57', change: '0.00', trend: 'stable' },
      { name: 'Broccoli', prev: '423.33', new: '267.50', change: '-155.83', trend: 'down' },
      { name: 'Potato', prev: '161.82', new: '150.39', change: '-11.43', trend: 'down' },
      { name: 'Sitao', prev: '150.00', new: '136.98', change: '-13.02', trend: 'down' },
      { name: 'Lettuce (Green Ice)', prev: '307.78', new: '375.74', change: '+67.96', trend: 'up' },
      { name: 'Lettuce (Iceberg)', prev: '343.33', new: '450.00', change: '+106.67', trend: 'up' },
      { name: 'Lettuce (Romaine)', prev: '298.57', new: '391.30', change: '+92.73', trend: 'up' }
    ],

    fruits: [
      { name: 'Mango', prev: '216.36', new: '211.64', change: '-4.72', trend: 'down' },
      { name: 'Calamansi', prev: '115.83', new: '136.03', change: '+20.20', trend: 'up' },
      { name: 'Papaya', prev: '71.11', new: '72.04', change: '+0.93', trend: 'up' },
      { name: 'Watermelon', prev: '76.88', new: '76.90', change: '+0.02', trend: 'up' },
      { name: 'Avocado', prev: '333.33', new: '378.62', change: '+45.29', trend: 'up' },
      { name: 'Melon', prev: '104.55', new: '108.13', change: '+3.58', trend: 'up' },
      { name: 'Pomelo', prev: '175.00', new: '177.59', change: '+2.59', trend: 'up' },
      { name: 'Banana (Lakatan)', prev: '95.42', new: '97.33', change: '+1.91', trend: 'up' },
      { name: 'Banana (Latundan)', prev: '74.00', new: '75.56', change: '+1.56', trend: 'up' },
      { name: 'Banana (Saba)', prev: '50.45', new: '53.54', change: '+3.09', trend: 'up' }
    ],

    grains: [
      { name: 'Rice (Fancy White)', prev: '56.92', new: '57.69', change: '+0.77', trend: 'up' },
      { name: 'Rice (Premium 5%)', prev: '49.75', new: '50.48', change: '+0.73', trend: 'up' },
      { name: 'Rice (Well Milled)', prev: '43.80', new: '43.76', change: '-0.04', trend: 'down' },
      { name: 'Rice (Regular Milled)', prev: '38.38', new: '38.88', change: '+0.50', trend: 'up' },
      { name: 'Corn (White Glutinous)', prev: '120.00', new: '104.62', change: '-15.38', trend: 'down' },
      { name: 'Corn (Yellow Sweet)', prev: '92.73', new: '90.11', change: '-2.62', trend: 'down' }
    ],

    herbsSpices: [
      { name: 'Ginger', prev: '204.29', new: '165.78', change: '-38.51', trend: 'down' },
      { name: 'Garlic', prev: '400.00', new: '410.00', change: '+10.00', trend: 'up' },
      { name: 'Red Onion', prev: '304.44', new: '227.78', change: '-76.66', trend: 'down' },
      { name: 'Chili', prev: '595.45', new: '725.96', change: '+130.51', trend: 'up' }
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
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">Prev (Nov 30)</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">New (Dec 26)</th>
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
                    Prices have shifted once again! This update compares November 30 prices against
                    the latest December 26 DPI-AFC report.
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
                    TOTAL PRODUCTS UPDATED: <span className="text-green-700">35 items</span>
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