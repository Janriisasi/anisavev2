import { useState, useMemo } from 'react';
import supabase from '../lib/supabase';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import productPrices from '../data/productPrices.json';

const ProductFormModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity_kg: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      //handle image upload first
      let image_url = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`products/${fileName}`, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${fileName}`);
          
        image_url = publicUrl;
      }

      //create product with image URL
      const { error } = await supabase.from('products').insert([{
        ...form,
        user_id: user.id,
        price: parseFloat(form.price),
        quantity_kg: parseFloat(form.quantity_kg),
        image_url
      }]);

      if (error) throw error;

      toast.success('Product created successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Error creating product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add New Product</h3>
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
                Click to upload product image
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
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;