import { AlertCircle, X, Trash2 } from 'lucide-react';

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting = false,
  productName = 'this product',
  type = 'product'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade-in animation */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card with scale and fade animation */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full transform transition-all duration-300 animate-in fade-in zoom-in-95 scale-100">

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon with bounce animation */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-in fade-in bounce duration-500" style={{animationDelay: '100ms'}}>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title with fade-in animation */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2 animate-in fade-in duration-500" style={{animationDelay: '150ms'}}>
            {type === 'product' ? 'Delete Product?' : 'Remove Contact?'}
          </h3>

          {/* Description with fade-in animation */}
          <p className="text-gray-600 text-center mb-6 text-sm animate-in fade-in duration-500" style={{animationDelay: '200ms'}}>
            {type === 'product' 
              ? `Are you sure you want to delete "${productName}"? This action cannot be undone and all product information will be permanently removed.`
              : `Are you sure you want to remove "${productName}" from your contacts? This action cannot be undone.`
            }
          </p>

          {/* Buttons with fade-in animation */}
          <div className="flex gap-3 animate-in fade-in duration-500" style={{animationDelay: '250ms'}}>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{type === 'product' ? 'Deleting...' : 'Removing...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{type === 'product' ? 'Delete' : 'Remove'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce {
          animation: bounce 0.6s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-in {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }

        @keyframes zoomIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .zoom-in-95 {
          animation: zoomIn 0.3s ease-out forwards;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}