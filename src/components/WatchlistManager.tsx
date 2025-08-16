'use client';

import { useState, useEffect } from 'react';

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  stocks?: Array<{
    id: string;
    symbol: string;
    addedAt: string;
  }>;
}

export default function WatchlistManager() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlists');
      const data = await response.json();
      
      if (data.success) {
        setWatchlists(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    
    try {
      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWatchlistName.trim(),
          description: newWatchlistDescription.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWatchlists([data.data, ...watchlists]);
        setNewWatchlistName('');
        setNewWatchlistDescription('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Failed to create watchlist:', error);
    }
  };

  const addStockToWatchlist = async (watchlistId: string) => {
    if (!newSymbol.trim()) return;
    
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newSymbol.trim().toUpperCase() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh watchlists to show the new stock
        await fetchWatchlists();
        setNewSymbol('');
      }
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  const removeStockFromWatchlist = async (watchlistId: string, symbol: string) => {
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/stocks?symbol=${symbol}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh watchlists to remove the stock
        await fetchWatchlists();
      }
    } catch (error) {
      console.error('Failed to remove stock:', error);
    }
  };

  const deleteWatchlist = async (watchlistId: string) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWatchlists(watchlists.filter(w => w.id !== watchlistId));
        if (selectedWatchlist === watchlistId) {
          setSelectedWatchlist(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading watchlists...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">My Watchlists</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Create Watchlist
        </button>
      </div>

      {/* Create Watchlist Form */}
      {showCreateForm && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h3 className="font-medium text-foreground mb-3">Create New Watchlist</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Watchlist name"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newWatchlistDescription}
              onChange={(e) => setNewWatchlistDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
            />
            <div className="flex gap-2">
              <button
                onClick={createWatchlist}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watchlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlists.map((watchlist) => (
          <div
            key={watchlist.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-foreground">{watchlist.name}</h3>
                {watchlist.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {watchlist.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteWatchlist(watchlist.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Stocks in watchlist */}
            <div className="space-y-2 mb-3">
              {watchlist.stocks?.map((stock) => (
                <div
                  key={stock.id}
                  className="flex justify-between items-center py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                >
                  <span className="font-medium text-foreground">{stock.symbol}</span>
                  <button
                    onClick={() => removeStockFromWatchlist(watchlist.id, stock.symbol)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              {(!watchlist.stocks || watchlist.stocks.length === 0) && (
                <p className="text-sm text-gray-500 italic">No stocks added yet</p>
              )}
            </div>

            {/* Add stock form */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add symbol"
                  value={selectedWatchlist === watchlist.id ? newSymbol : ''}
                  onChange={(e) => {
                    setSelectedWatchlist(watchlist.id);
                    setNewSymbol(e.target.value.toUpperCase());
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addStockToWatchlist(watchlist.id);
                    }
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-foreground"
                />
                <button
                  onClick={() => addStockToWatchlist(watchlist.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {watchlists.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No watchlists yet. Create your first watchlist to get started!
          </p>
        </div>
      )}
    </div>
  );
}