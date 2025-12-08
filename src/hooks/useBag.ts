import { useState, useEffect, useCallback } from 'react';

/**
 * useBag Hook
 * 
 * Shared state management for shopping bag across mobile and desktop
 * Features:
 * - Fetch bag items from backend: GET /api/bag/
 * - Add items to bag: POST /api/bag/add/
 * - Remove items: DELETE /api/bag/<id>/
 * - Clear entire bag: POST /api/bag/clear/
 * - Optimistic updates with error recovery
 * - Loading and error state tracking
 * - Auto-refetch on mount and after mutations
 */

// Backend API URL - adjust based on environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface BagItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export interface BagState {
  items: BagItem[];
  itemCount: number;
  totalPrice: number;
  loading: boolean;
  error: string | null;
}

export const useBag = () => {
  const [state, setState] = useState<BagState>({
    items: [],
    itemCount: 0,
    totalPrice: 0,
    loading: false,
    error: null,
  });

  // Fetch bag items from backend
  const fetchBagItems = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_URL}/api/bag/`, {
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if available
          'Authorization': `Token ${localStorage.getItem('authToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bag: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.items || [];
      const itemCount = items.reduce((sum: number, item: BagItem) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum: number, item: BagItem) => sum + item.price * item.quantity, 0);

      setState({
        items,
        itemCount,
        totalPrice,
        loading: false,
        error: null,
      });

      // Expose to window for ProductCard access
      if (typeof window !== 'undefined') {
        (window as any).__shopittBag = { addItem, removeItem, clearBag };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load bag';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  // Add item to bag
  const addItem = useCallback(async (item: Omit<BagItem, 'quantity'>) => {
    // Optimistic update
    setState((prev) => {
      const existing = prev.items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        prev.items.push({ ...item, quantity: 1 });
      }
      return {
        ...prev,
        itemCount: prev.items.reduce((sum, i) => sum + i.quantity, 0),
        totalPrice: prev.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    });

    try {
      const response = await fetch(`${API_URL}/api/bag/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify({
          product_id: item.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      // Refetch to ensure consistency
      await fetchBagItems();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      setState((prev) => ({ ...prev, error: errorMessage }));
      // Refetch on error to recover state
      await fetchBagItems();
    }
  }, [fetchBagItems]);

  // Remove item from bag
  const removeItem = useCallback(async (itemId: string) => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
      itemCount: prev.items.reduce((sum, i) => (i.id === itemId ? sum : sum + i.quantity), 0),
      totalPrice: prev.items.reduce((sum, i) => (i.id === itemId ? sum : sum + i.price * i.quantity), 0),
    }));

    try {
      const response = await fetch(`${API_URL}/api/bag/${itemId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Refetch to ensure consistency
      await fetchBagItems();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item';
      setState((prev) => ({ ...prev, error: errorMessage }));
      // Refetch on error
      await fetchBagItems();
    }
  }, [fetchBagItems]);

  // Clear entire bag
  const clearBag = useCallback(async () => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      items: [],
      itemCount: 0,
      totalPrice: 0,
    }));

    try {
      const response = await fetch(`${API_URL}/api/bag/clear/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear bag');
      }

      setState({
        items: [],
        itemCount: 0,
        totalPrice: 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear bag';
      setState((prev) => ({ ...prev, error: errorMessage }));
      // Refetch on error
      await fetchBagItems();
    }
  }, [fetchBagItems]);

  // Fetch items on mount
  useEffect(() => {
    fetchBagItems();
  }, [fetchBagItems]);

  return {
    ...state,
    addItem,
    removeItem,
    clearBag,
    refetch: fetchBagItems,
  };
};
