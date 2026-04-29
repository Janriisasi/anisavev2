import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SupabaseProvider } from './contexts/supabaseContext';
import { MarketPricesProvider } from './contexts/marketPricesContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SupabaseProvider>
      <MarketPricesProvider>
        <App />
      </MarketPricesProvider>
    </SupabaseProvider>
  </React.StrictMode>
);