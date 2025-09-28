import { useState, useMemo, useRef, useEffect } from 'react';
import supabase from '../lib/supabase';
import { Upload, ChevronDown, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import productPrices from '../data/productPrices.json';
import { useAuth } from '../contexts/AuthContext';

export default function ProductFormModal({ onClose, onSuccess, existingProduct, userProfile }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: existingProduct?.name || '',
    category: existingProduct?.category || 'Vegetables',
    price: existingProduct?.price || '',
    quantity_kg: existingProduct?.quantity_kg || '',
    image_url: existingProduct?.image_url || '',
    description: existingProduct?.description || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingProduct?.image_url || null);
  
  //dropdown
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const categoryRef = useRef(null);
  const productRef = useRef(null);

  //check if user profile is complete
  const isProfileComplete = userProfile?.address && userProfile?.contact_number;

  //get available products based on selected category
  const availableProducts = useMemo(() => {
    if (!form.category) return [];
    return Object.keys(productPrices[form.category] || {});
  }, [form.category]);

  //set suggested price when product is selected
  const handleProductSelect = (productName) => {
    const suggestedPrice = productPrices[form.category][productName];
    setForm(prev => ({
      ...prev,
      name: productName,
      price: suggestedPrice
    }));
  };

  const categories = Object.keys(productPrices);

  //close dropdowns
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

  //dropdown component
  const CustomDropdown = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    placeholder, 
    isOpen, 
    setIsOpen, 
    dropdownRef, 
    disabled = false 
  }) => {
    return (
      <div className="space-y-2" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-4 py-3 text-left bg-white border rounded-lg shadow-sm transition-all duration-200 ${
              disabled 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 cursor-pointer'
            } ${
              isOpen 
                ? 'border-green-500 ring-2 ring-green-200 shadow-lg' 
                : 'border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                {value || placeholder}
              </span>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
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
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option, index) => (
                <button
                  key={option.value || option}
                  type="button"
                  onClick={() => {
                    onSelect(option.value || option);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-green-50 hover:text-green-700 transition-colors duration-150 ${
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
      </div>
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { //limit for image upload
        toast.error('Image must be less than 2MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  //upload image to Supabase storage
  const uploadImage = async (file) => {
    if (!file) return null;

    try {
      //create unique filename
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

      //get public URL
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
    
    //check if profile is complete
    if (!isProfileComplete) {
      toast.error('Please complete your profile with address and phone number before adding products.');
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

      //updates the existing product of the farmer
      if (existingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: form.name,
            category: form.category,
            price: form.price,
            quantity_kg: form.quantity_kg,
            image_url: imageUrl,
            description: form.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProduct.id);

        if (error) throw error;
        toast.success('Product updated successfully!');
      } else {
        //creates a new product for the farmer
        const { error } = await supabase
          .from('products')
          .insert([
            {
              user_id: user.id,
              name: form.name,
              category: form.category,
              price: form.price,
              quantity_kg: form.quantity_kg,
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

  //if profile is not complete, show warning message
  if (!isProfileComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              To add products, you need to complete your profile with:
            </p>
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <ul className="space-y-2">
                {!userProfile?.address && (
                  <li className="flex items-center text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    Address information
                  </li>
                )}
                {!userProfile?.contact_number && (
                  <li className="flex items-center text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    Phone number
                  </li>
                )}
              </ul>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This information helps buyers contact you and arrange deliveries.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition-colors font-medium"
              >
                Update Profile
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          {existingProduct ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Product Image</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center h-80">
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
                      <Upload className="w-16 h-16 text-gray-400 mb-4" />
                      <span className="text-lg text-gray-500 font-medium">
                        Click to upload product image
                      </span>
                      <span className="text-sm text-gray-400 mt-2">
                        Maximum file size: 5MB
                      </span>
                    </>
                  )}
                </label>
              </div>
              {imageFile && (
                <p className="text-sm text-green-600 text-center">
                  ✓ Image selected: {imageFile.name}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Product Details</h3>
              
              <CustomDropdown
                label="Category"
                value={form.category}
                options={categories}
                onSelect={(category) => {
                  setForm({
                    ...form,
                    category: category,
                    name: '', //reset product name when category changes
                    price: '' //reset price when category changes
                  });
                }}
                placeholder="Select Category"
                isOpen={categoryOpen}
                setIsOpen={setCategoryOpen}
                dropdownRef={categoryRef}
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
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Price per kg</label>
                <input
                  type="number"
                  placeholder="Price per kg"
                  className="input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  value={form.price}
                  onChange={(e) => setForm({...form, price: e.target.value})}
                  required
                />
                {form.name && (
                  <p className="text-sm text-gray-500">
                    Suggested price: ₱{productPrices[form.category]?.[form.name]}/kg
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                <input
                  type="number"
                  placeholder="Quantity in kilograms"
                  className="input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  value={form.quantity_kg}
                  onChange={(e) => setForm({...form, quantity_kg: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Processing...' : existingProduct ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};