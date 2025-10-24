import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AboutModal({ isOpen, onClose }) {
  const sections = [
    {
      title: "Information We Collect",
      content: "We may collect information about you if we have a reason to do so — for example, to provide our Services, to communicate with, or to make our Services better.\n\n• Personal Information: such as your name, email address, and contact number when you create an account or interact with our services.\n• Usage Data: including your login activity, visited pages, and interactions within the platform.\n• Uploaded Content: such as product listings, images, and descriptions you share on AniSave."
    },
    {
      title: "How We Use Your Information",
      content: "We use the collected information to:\n\n• Provide and maintain the AniSave platform\n• Connect farmers and buyers effectively\n• Improve user experience and platform performance\n• Communicate important updates and offers related to our services\n• Ensure platform security and prevent fraud"
    },
    {
      title: "Data Storage and Security",
      content: "Your data is securely stored using Supabase. We apply encryption, authentication, and other industry-standard practices to protect your information from unauthorized access, disclosure, or misuse."
    },
    {
      title: "Sharing of Information",
      content: "We do not sell or share your personal information with third parties except:\n\n• When required by law or government authorities\n• To trusted service providers who help operate our platform under strict confidentiality agreements"
    },
    {
      title: "Your Rights",
      content: "You have the right to:\n\n• Access, update, or delete your personal information\n• Withdraw your consent at any time\n• Contact us to inquire about your stored data"
    },
    {
      title: "Cookies and Tracking",
      content: "AniSave may use cookies or similar technologies to improve your experience, analyze usage, and personalize content. You can manage cookie preferences in your browser settings."
    },
    {
      title: "Updates to This Policy",
      content: "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date."
    },
    {
      title: "Contact Us",
      content: "If you have any questions or concerns about this Privacy Policy, contact us at:\nanisave.team@gmail.com"
    }
  ];

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
              className="bg-white rounded-2xl w-full max-w-[95%] sm:max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-hide pointer-events-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-colors duration-200 z-10"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </motion.button>

              {/* Header with centered logo and title */}
              <motion.div
                className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6 text-center border-b border-gray-100 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/images/bg_feat.png)' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="flex flex-col items-center">
                  <img
                    src="/images/anisave_logo.png"
                    alt="AniSave Logo"
                    className="h-12 sm:h-16 w-auto mb-1"
                  />
                  <p className="text-white text-xs sm:text-sm">
                    Your privacy matters to us
                  </p>
                </div>
              </motion.div>

              {/* Content */}
              <div
                className="pt-5 sm:pt-6 px-4 sm:px-8 relative bg-center bg-fixed bg-no-repeat"
                style={{ backgroundImage: 'url(/images/bg_privacy.svg)', backgroundSize: '70%' }}
              >
                <div className="absolute inset-0 bg-white/50 pointer-events-none"></div>
                <div className="relative z-10 space-y-6 sm:space-y-8">
                  <motion.p
                    className="text-gray-700 leading-relaxed text-xs sm:text-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    AniSave values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
                  </motion.p>

                  {sections.map((section, index) => (
                    <motion.div
                      key={index}
                      className="space-y-2 sm:space-y-3 mb-6 sm:mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05, duration: 0.4 }}
                    >
                      <div className="border-t border-green-200 pt-2 mb-2"></div>
                      <h1 className="text-lg sm:text-xl font-semibold text-gray-800 text-left">
                        {section.title}
                      </h1>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                        {section.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <motion.div
                className="bg-gray-50 p-4 sm:p-6 border-t border-gray-200 text-center sticky bottom-0 relative z-20"
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