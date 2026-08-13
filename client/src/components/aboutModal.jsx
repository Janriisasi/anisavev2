import { X, TrendingUp, Store, Sprout, Users, ShieldCheck, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const offerings = [
  {
    icon: TrendingUp,
    title: "Real-time Prices",
    description: "Live market price feeds so you always know what your harvest is worth.",
  },
  {
    icon: Store,
    title: "Categorized Products",
    description: "Vegetables, grains, herbs & spices — organized so buyers find you fast.",
  },
  {
    icon: Sprout,
    title: "Showcase Your Harvest",
    description: "Post listings with photos and details in minutes, no middleman required.",
  },
  {
    icon: Users,
    title: "Direct Farmer Contact",
    description: "Buyers and farmers connect and negotiate directly on the platform.",
  },
];

const whyAnisave = [
  {
    title: "Strategic Crop Planning",
    description: "Price trend history helps you plan what to plant and when to sell.",
  },
  {
    title: "Seamless Market Access",
    description: "Real-time price feeds reduce middlemen influence and even the playing field.",
  },
  {
    title: "DA Price Protection",
    description: "Built to work alongside the Department of Agriculture's price protection program for cooperatives.",
  },
];

export default function AboutModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 md:pt-[calc(var(--nav-height,4rem)_+_1.5rem)] z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 md:pt-[calc(var(--nav-height,4rem)_+_1.5rem)] z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white rounded-xl sm:rounded-2xl w-full max-w-[95%] sm:max-w-3xl max-h-[78vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-hide pointer-events-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with logo, tagline, and close button */}
              <motion.div
                className="relative pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6 text-center border-b border-gray-100 bg-cover bg-center bg-no-repeat"
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
                  <p className="text-white text-xs sm:text-sm">
                    Empowering the hands that feed the nation
                  </p>
                </div>
              </motion.div>

              {/* Content */}
              <div className="pt-5 sm:pt-6 px-4 sm:px-8 pb-2">
                <div className="space-y-8 sm:space-y-10">

                  {/* Intro */}
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-6 items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <div className="sm:col-span-2 rounded-lg sm:rounded-xl overflow-hidden shadow-md aspect-square sm:aspect-auto sm:h-full">
                      <img
                        src="/images/pexels-sorapong-chaipanya-4530766-1.webp"
                        alt="Farmer carrying seedlings"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <h1 className="text-lg sm:text-xl font-semibold text-[#00573C] mb-2 text-left">
                        What is AniSave?
                      </h1>
                      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm text-left">
                        AniSave is an agricultural marketplace built for Filipino farmers and buyers.
                        We deliver real-time market prices, a place to showcase your harvest, and a
                        direct line between growers and buyers — so every farmer gains a partner in
                        achieving a more secure and profitable harvest.
                      </p>
                    </div>
                  </motion.div>

                  {/* Mission & Vision */}
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                  >
                    <div>
                      <div className="border-t border-green-200 pt-3 mb-2"></div>
                      <h2 className="text-base sm:text-lg font-semibold text-[#00573C] mb-1.5 text-left">
                        Our Mission
                      </h2>
                      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm text-left">
                        To deliver real-time market prices, empowering farmers to make smarter choices.
                      </p>
                    </div>
                    <div>
                      <div className="border-t border-green-200 pt-3 mb-2"></div>
                      <h2 className="text-base sm:text-lg font-semibold text-[#00573C] mb-1.5 text-left">
                        Our Vision
                      </h2>
                      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm text-left">
                        Creating solutions that adapt to the changing needs of the agricultural community.
                      </p>
                    </div>
                  </motion.div>

                  {/* What We Offer */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <div className="border-t border-green-200 pt-3 mb-4"></div>
                    <h2 className="text-base sm:text-lg font-semibold text-[#00573C] mb-4 text-left">
                      What We Offer
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {offerings.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="shrink-0 bg-[#00573C]/10 text-[#00573C] rounded-lg p-2">
                            <item.icon size={18} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800 text-xs sm:text-sm mb-0.5 text-left">
                              {item.title}
                            </h3>
                            <p className="text-gray-600 text-xs leading-relaxed text-left">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Why AniSave */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                  >
                    <div className="border-t border-green-200 pt-3 mb-4"></div>
                    <h2 className="text-base sm:text-lg font-semibold text-[#00573C] mb-4 text-left">
                      Why Farmers Choose AniSave
                    </h2>
                    <div className="space-y-3">
                      {whyAnisave.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <ShieldCheck size={16} className="shrink-0 text-[#00573C] mt-0.5" />
                          <p className="text-gray-700 text-xs sm:text-sm text-left">
                            <span className="font-medium text-gray-800">{item.title}.</span>{" "}
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Closing statement + contact */}
                  <motion.div
                    className="bg-[#F5F5F5] rounded-lg p-4 sm:p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <p className="text-gray-700 leading-relaxed text-xs sm:text-sm text-left mb-3">
                      We're modernizing Filipino agriculture through data, community, and technology —
                      empowering the hands that feed the nation.
                    </p>
                    <div className="flex items-center gap-2 text-[#00573C] text-xs sm:text-sm font-medium">
                      <Mail size={16} />
                      <a href="mailto:anisave14@gmail.com" className="hover:underline">
                        anisave14@gmail.com
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <motion.div
                className="bg-gray-50 p-4 sm:p-6 border-t border-gray-200 text-center sticky bottom-0 relative z-20 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <motion.button
                  onClick={onClose}
                  className="bg-green-700 text-white px-6 sm:px-8 py-2 rounded-lg hover:bg-green-800 transition-colors duration-200 font-medium text-xs sm:text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}