import { useState, useMemo } from 'react';
import supabase from '../lib/supabase';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import productPrices from '../data/productPrices.json';
import { useAuth } from '../contexts/AuthContext';

export default function ProductFormModal({ onClose, onSuccess, existingProduct }) {
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { //2MB limit
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6">
          {existingProduct ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* image upload section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label 
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg mb-2"
                />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
              )}
              <span className="text-sm text-gray-500">
                {imageFile ? 'Click to change image' : 'Click to upload product image'}
              </span>
            </label>
          </div>

          {/* category selection */}
          <select
            className="input"
            value={form.category}
            onChange={(e) => {
              setForm({
                ...form,
                category: e.target.value,
                name: '', //reset product name when category changes
                price: '' //reset price when category changes
              });
            }}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'HerbsAndSpices' ? 'Herbs & Spices' : cat}
              </option>
            ))}
          </select>
          
          {/* product name selection */}
          <select
            className="input"
            value={form.name}
            onChange={(e) => handleProductSelect(e.target.value)}
            required
            disabled={!form.category}
          >
            <option value="">Select Product</option>
            {availableProducts.map(product => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
          
          {/* price input with suggested price */}
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Price per kg"
              className="input"
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
          
          <input
            type="number"
            placeholder="Quantity (kg)"
            className="input"
            value={form.quantity_kg}
            onChange={(e) => setForm({...form, quantity_kg: e.target.value})}
            required
          />
          
          <textarea
            placeholder="Description"
            className="input min-h-20"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
          />
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : existingProduct ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};