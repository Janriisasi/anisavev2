import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../lib/supabase.jsx';

const MarketPricesContext = createContext(null);

/**
 * Converts a flat array of { category, name, price } rows
 * into the nested object format: { Vegetables: { Eggplant: 95.99, ... }, ... }
 */
function rowsToNested(rows) {
  const nested = {};
  rows.forEach(({ category, name, price }) => {
    if (!nested[category]) nested[category] = {};
    nested[category][name] = parseFloat(price);
  });
  return nested;
}

export function MarketPricesProvider({ children }) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial fetch
    const fetchPrices = async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('category, name, price')
        .order('category')
        .order('name');

      if (error) {
        console.error('Error fetching market prices:', error);
      } else {
        setPrices(rowsToNested(data || []));
      }
      setLoading(false);
    };

    fetchPrices();

    // 2. Real-time subscription — when admin updates a price, all clients update instantly
    const channel = supabase
      .channel('market_prices_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_prices' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const { category, name, price } = payload.new;
            setPrices((prev) => ({
              ...prev,
              [category]: {
                ...(prev[category] || {}),
                [name]: parseFloat(price),
              },
            }));
          } else if (payload.eventType === 'DELETE') {
            const { category, name } = payload.old;
            setPrices((prev) => {
              const updated = { ...prev };
              if (updated[category]) {
                updated[category] = { ...updated[category] };
                delete updated[category][name];
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <MarketPricesContext.Provider value={{ prices, loading }}>
      {children}
    </MarketPricesContext.Provider>
  );
}

export function useMarketPrices() {
  const ctx = useContext(MarketPricesContext);
  if (!ctx) {
    throw new Error('useMarketPrices must be used inside <MarketPricesProvider>');
  }
  return ctx;
}
