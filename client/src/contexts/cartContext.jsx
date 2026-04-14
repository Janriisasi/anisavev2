import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './authContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCartItems([]); setCartCount(0); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products(id, name, category, image_url, price, quantity_kg, status, user_id),
          seller:profiles!cart_items_seller_id_fkey(id, full_name, username, avatar_url, address, contact_number)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCartItems(data || []);
      setCartCount((data || []).length);
    } catch (err) {
      console.error('Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('cart-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `buyer_id=eq.${user.id}`
      }, () => fetchCart())
      .subscribe();
    return () => channel.unsubscribe();
  }, [user, fetchCart]);

  const addToCart = async ({ product, seller, quantityKg }) => {
    if (!user) return { error: 'Not logged in' };
    try {
      const snapshot = {
        name: product.name,
        image_url: product.image_url,
        category: product.category,
      };
      const { error } = await supabase.from('cart_items').upsert({
        buyer_id: user.id,
        product_id: product.id,
        seller_id: seller.id,
        quantity_kg: quantityKg,
        price_at_add: product.price,
        product_snapshot: snapshot,
      }, { onConflict: 'buyer_id,product_id' });

      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('buyer_id', user.id);
      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  const updateQuantity = async (cartItemId, newQty) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity_kg: newQty })
        .eq('id', cartItemId)
        .eq('buyer_id', user.id);
      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  const isInCart = (productId) => cartItems.some(item => item.product_id === productId);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      loading,
      fetchCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}