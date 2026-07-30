import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../lib/supabase';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', id)
      .single();

    if (!error) setProduct(data);
  };

  if (!product) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  const unit = product.unit || 'kg';
  const formattedHarvestDate = product.harvest_date
    ? new Date(product.harvest_date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-64 object-cover rounded mb-4"
        />
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.negotiable && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Negotiable
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-2">Category: {product.category}</p>
        <p className="text-xl font-semibold mb-4">₱{product.price} / {unit}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
          {formattedHarvestDate && (
            <div>
              <span className="text-gray-400 block text-xs">Harvest Date</span>
              <span className="font-medium text-gray-800">{formattedHarvestDate}</span>
            </div>
          )}
          <div>
            <span className="text-gray-400 block text-xs">Available</span>
            <span className="font-medium text-gray-800">{product.quantity_kg} {unit}</span>
          </div>
          {product.min_order && (
            <div>
              <span className="text-gray-400 block text-xs">Minimum Order</span>
              <span className="font-medium text-gray-800">{product.min_order} {unit}</span>
            </div>
          )}
          {product.location && (
            <div>
              <span className="text-gray-400 block text-xs">Location</span>
              <span className="font-medium text-gray-800">{product.location}</span>
            </div>
          )}
        </div>

        {product.description && (
          <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-3">
          <img
            src={product.profiles?.avatar_url || '/default-avatar.png'}
            alt="Farmer"
            className="w-10 h-10 rounded-full"
          />
          <span className="font-medium">
            Sold by: {product.profiles?.full_name || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}