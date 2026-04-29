import { useState, useEffect } from "react";
import supabase from "../../lib/supabase";
import { Edit2, Save, X, RefreshCw, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function PriceManagement() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: 0 });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("market_prices")
        .select("*")
        .order("category")
        .order("name");

      if (error) throw error;
      
      setPrices(data || []);
      
      // Extract unique categories
      const uniqueCategories = ["All", ...new Set(data?.map(item => item.category) || [])];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error("Failed to load prices");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({ price: item.price });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ price: 0 });
  };

  const handleSave = async (id) => {
    try {
      setSaving(true);
      
      if (editForm.price <= 0) {
        toast.error("Price must be greater than 0");
        return;
      }

      const { error } = await supabase
        .from("market_prices")
        .update({ price: parseFloat(editForm.price) })
        .eq("id", id);

      if (error) throw error;

      toast.success("Price updated successfully!");
      setEditingId(null);
      
      // Update local state instead of refetching everything
      setPrices(prev => prev.map(item => 
        item.id === id ? { ...item, price: parseFloat(editForm.price) } : item
      ));

    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  const filteredPrices = activeCategory === "All" 
    ? prices 
    : prices.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
          <p className="text-gray-500">Loading market prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800">Market Price Management</h3>
            <p className="text-sm text-gray-500">Update standard prices for all products. Changes reflect instantly across the platform.</p>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                } border`}
              >
                {cat === 'HerbsAndSpices' ? 'Herbs & Spices' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs md:text-sm text-gray-500 uppercase tracking-wider">
              <th className="p-3 md:p-4 font-medium">Product Name</th>
              <th className="p-3 md:p-4 font-medium hidden sm:table-cell">Category</th>
              <th className="p-3 md:p-4 font-medium">Market Price (₱)</th>
              <th className="p-3 md:p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPrices.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 md:p-4">
                  <span className="font-medium text-gray-800 text-sm md:text-base">{item.name}</span>
                  <div className="sm:hidden text-xs text-gray-500 mt-1">
                    {item.category === 'HerbsAndSpices' ? 'Herbs & Spices' : item.category}
                  </div>
                </td>
                <td className="p-3 md:p-4 hidden sm:table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.category === 'HerbsAndSpices' ? 'Herbs & Spices' : item.category}
                  </span>
                </td>
                <td className="p-3 md:p-4">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">₱</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-24 px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(item.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <span className="text-xs text-gray-400">/kg</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 font-medium text-gray-800 text-sm md:text-base">
                      ₱{item.price} <span className="text-xs text-gray-500 font-normal">/kg</span>
                    </div>
                  )}
                </td>
                <td className="p-3 md:p-4 text-right">
                  {editingId === item.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={saving}
                        className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(item)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Edit Price"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            
            {filteredPrices.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No prices found for this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
