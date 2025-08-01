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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-64 object-cover rounded mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-gray-600 text-sm mb-2">Category: {product.category}</p>
        <p className="text-xl font-semibold mb-4">₱{product.price} / kg</p>

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
