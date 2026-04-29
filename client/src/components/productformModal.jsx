import { useState, useMemo, useRef, useEffect } from 'react';
import supabase from '../lib/supabase';
import { Upload, ChevronDown, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMarketPrices } from '../contexts/marketPricesContext';
import compressImage from '../utils/imageCompression';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const formatWithCommas = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = value.toString().replace(/,/g, '');
  if (isNaN(num)) return value;
  const parts = num.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const stripCommas = (value) => value.toString().replace(/,/g, '');

export default function ProductFormModal({ onClose, onSuccess, existingProduct, userProfile }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: existingProduct?.name || '',
    category: existingProduct?.category || 'Vegetables',
    price: existingProduct?.price ? formatWithCommas(existingProduct.price) : '',
    quantity_kg: existingProduct?.quantity_kg ? formatWithCommas(existingProduct.quantity_kg) : '',
    image_url: existingProduct?.image_url || '',
    description: existingProduct?.description || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingProduct?.image_url || null);
  const [errors, setErrors] = useState({});
  const { prices } = useMarketPrices();
  
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const categoryRef = useRef(null);
  const productRef = useRef(null);

  const isProfileComplete = userProfile?.address && userProfile?.contact_number;

  const availableProducts = useMemo(() => {
    if (!form.category || !prices[form.category]) return [];
    return Object.keys(prices[form.category] || {});
  }, [form.category, prices]);

  const handleProductSelect = (productName) => {
    const suggestedPrice = prices[form.category]?.[productName] || 0;
    setForm(prev => ({
      ...prev,
      name: productName,
      price: formatWithCommas(suggestedPrice)
    }));
    setErrors(prev => ({ ...prev, name: '' }));
  };

  const categories = Object.keys(prices || {});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
      if (productRef.current && !productRef.current.contains(event.target)) {
        setProductOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!imagePreview && !imageFile) {
      newErrors.image = 'Product image is required';
    }

    if (!form.category || form.category.trim() === '') {
      newErrors.category = 'Category is required';
    }

    if (!form.name || form.name.trim() === '') {
      newErrors.name = 'Product name is required';
    }

    if (!form.price || form.price === '' || parseFloat(stripCommas(form.price)) <= 0) {
      newErrors.price = 'Valid price is required';
    } else if (parseFloat(stripCommas(form.price)) > 999999) {
      newErrors.price = 'Price cannot exceed ₱999,999';
    }

    if (!form.quantity_kg || form.quantity_kg === '' || parseFloat(stripCommas(form.quantity_kg)) <= 0) {
      newErrors.quantity_kg = 'Valid quantity is required';
    } else if (parseFloat(stripCommas(form.quantity_kg)) > 5000) {
      newErrors.quantity_kg = 'Quantity cannot exceed 5,000 kg';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const CustomDropdown = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    placeholder, 
    isOpen, 
    setIsOpen, 
    dropdownRef, 
    disabled = false,
    error = null
  }) => {
    return (
      <div className="space-y-1 sm:space-y-2" ref={dropdownRef}>
        <label className="block text-xs sm:text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm bg-white border rounded-lg shadow-sm transition-all duration-200 ${
              disabled 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 cursor-pointer'
            } ${
              error
                ? 'border-red-500 ring-2 ring-red-200'
                : isOpen 
                ? 'border-green-500 ring-2 ring-green-200 shadow-lg' 
                : 'border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                {value || placeholder}
              </span>
              <ChevronDown 
                className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`} 
              />
            </div>
          </button>

          <div className={`absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 origin-top ${
            isOpen 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}>
            <div className="max-h-52 sm:max-h-60 overflow-y-auto py-1">
              {options.map((option, index) => (
                <button
                  key={option.value || option}
                  type="button"
                  onClick={() => {
                    onSelect(option.value || option);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 sm:py-3 text-left text-sm hover:bg-green-50 hover:text-green-700 transition-colors duration-150 ${
                    (option.value || option) === value 
                      ? 'bg-green-100 text-green-700 font-medium' 
                      : 'text-gray-900'
                  }`}
                  style={{ 
                    animationDelay: `${index * 20}ms`,
                    animation: isOpen ? 'slideInDown 200ms ease-out forwards' : ''
                  }}
                >
                  {option.label || (option === 'HerbsAndSpices' ? 'Herbs & Spices' : option)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}
      </div>
    );
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      try {
        const loadingToast = toast.loading('Uploading image...');
        const compressedFile = await compressImage(file);
        
        toast.dismiss(loadingToast);
        toast.success(`Image Uploaded!`);
        
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        setErrors(prev => ({ ...prev, image: '' }));
      } catch (error) {
        toast.error('Failed to upload. Please try again.');
        console.error('Compression error:', error);
      }
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = form.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
      }

      if (existingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: form.name,
            category: form.category,
            price: stripCommas(form.price),
            quantity_kg: stripCommas(form.quantity_kg),
            image_url: imageUrl,
            description: form.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProduct.id);

        if (error) throw error;
        toast.success('Product updated successfully!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([
            {
              user_id: user.id,
              name: form.name,
              category: form.category,
              price: stripCommas(form.price),
              quantity_kg: stripCommas(form.quantity_kg),
              image_url: imageUrl,
              description: form.description,
              status: 'Available'
            }
          ]);

        if (error) throw error;
        toast.success('Product added successfully!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        error.message.includes('upload') 
          ? 'Failed to upload image. Please try again.' 
          : (existingProduct ? 'Failed to update product' : 'Failed to add product')
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl sm:rounded-2xl w-full max-w-[95%] sm:max-w-3xl p-4 sm:p-5 max-h-[80vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.h2 
            className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {existingProduct ? 'Edit Product' : 'Add New Product'}
          </motion.h2>

          {!isProfileComplete && (
            <motion.div
              className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3 sm:mb-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] sm:text-xs text-blue-700 leading-relaxed">
                <span className="font-semibold">Tip:</span> Adding your{' '}
                {!userProfile?.address && !userProfile?.contact_number
                  ? 'address and phone number'
                  : !userProfile?.address
                  ? 'address'
                  : 'phone number'}{' '}
                helps buyers reach you and arrange delivery.
              </div>
            </motion.div>
          )}
          
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-3 sm:space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <motion.div 
                className="space-y-2 sm:space-y-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                  Product Image <span className="text-red-500">*</span>
                </h3>
                <div className={`border-2 border-dashed rounded-lg p-2 sm:p-4 text-center h-36 sm:h-64 ${
                  errors.image ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label 
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center h-full justify-center"
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 sm:w-12 sm:h-12 text-gray-400 mb-1 sm:mb-3" />
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Click to upload image
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1">
                          Max 5MB
                        </span>
                      </>
                    )}
                  </label>
                </div>
                {errors.image && <p className="text-xs sm:text-sm text-red-500">{errors.image}</p>}
                {imageFile && (
                  <p className="text-xs sm:text-sm text-green-600 text-center truncate">
                    ✓ {imageFile.name}
                  </p>
                )}
              </motion.div>

              <motion.div 
                className="space-y-2 sm:space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Product Details</h3>
                
                <CustomDropdown
                  label="Category"
                  value={form.category}
                  options={categories}
                  onSelect={(category) => {
                    setForm({
                      ...form,
                      category: category,
                      name: '',
                      price: ''
                    });
                    setErrors(prev => ({ ...prev, category: '' }));
                  }}
                  placeholder="Select Category"
                  isOpen={categoryOpen}
                  setIsOpen={setCategoryOpen}
                  dropdownRef={categoryRef}
                  error={errors.category}
                />
                
                <CustomDropdown
                  label="Product Name"
                  value={form.name}
                  options={availableProducts}
                  onSelect={handleProductSelect}
                  placeholder="Select Product"
                  isOpen={productOpen}
                  setIsOpen={setProductOpen}
                  dropdownRef={productRef}
                  disabled={!form.category}
                  error={errors.name}
                />
                
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Price per kg <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex border rounded-lg overflow-hidden transition-all duration-200 ${
                    errors.price
                      ? 'border-red-500 ring-2 ring-red-200'
                      : 'border-gray-300 focus-within:ring-2 focus-within:ring-green-200 focus-within:border-green-500'
                  }`}>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      className="input flex-1 pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm outline-none border-none bg-white"
                      value={form.price}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
                        const parts = raw.split('.');
                        // Max 6 digits before decimal
                        if (parts[0].length > 6) return;
                        const formatted = formatWithCommas(raw);
                        setForm({...form, price: formatted});
                        setErrors(prev => ({ ...prev, price: '' }));
                      }}
                    />
                  </div>
                  {errors.price && <p className="text-xs sm:text-sm text-red-500">{errors.price}</p>}
                  {form.name && !errors.price && prices[form.category]?.[form.name] && (
                    <p className="text-xs text-gray-500">
                      Suggested: ₱ {formatWithCommas(prices[form.category][form.name])}/kg
                    </p>
                  )}
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Quantity (kg) <span className="text-red-500">*</span>
                    <p className="text-xs sm:text-xs text-gray-400">Max: 5,000 kg</p>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    className={`input w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border rounded-lg transition-all duration-200 ${
                      errors.quantity_kg
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500'
                    }`}
                    value={form.quantity_kg}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
                      const numVal = parseFloat(raw);
                      if (!isNaN(numVal) && numVal > 5000) return;
                      const formatted = formatWithCommas(raw);
                      setForm({...form, quantity_kg: formatted});
                      setErrors(prev => ({ ...prev, quantity_kg: '' }));
                    }}
                  />
                  {errors.quantity_kg && <p className="text-xs sm:text-sm text-red-500">{errors.quantity_kg}</p>}
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-700 text-white py-2.5 sm:py-3 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Processing...' : existingProduct ? 'Update' : 'Add Product'}
              </motion.button>
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}