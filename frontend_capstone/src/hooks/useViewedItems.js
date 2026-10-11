import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to track which items have been viewed by the user
 * Uses localStorage to persist viewed state
 * 
 * @param {string} storageKey - Unique key for this type of item (e.g., 'viewed_owners', 'viewed_equipment')
 * @returns {object} - Methods to check and mark items as viewed
 */
export function useViewedItems(storageKey) {
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever viewedIds changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(viewedIds));
  }, [viewedIds, storageKey]);

  /**
   * Check if an item has been viewed
   */
  const isViewed = useCallback((itemId) => {
    return viewedIds.includes(itemId);
  }, [viewedIds]);

  /**
   * Check if an item is new (not viewed)
   */
  const isNew = useCallback((itemId) => {
    return !viewedIds.includes(itemId);
  }, [viewedIds]);

  /**
   * Mark an item as viewed
   */
  const markAsViewed = useCallback((itemId) => {
    setViewedIds(prev => {
      if (prev.includes(itemId)) return prev;
      return [...prev, itemId];
    });
  }, []);

  /**
   * Mark multiple items as viewed
   */
  const markManyAsViewed = useCallback((itemIds) => {
    setViewedIds(prev => {
      const newIds = itemIds.filter(id => !prev.includes(id));
      if (newIds.length === 0) return prev;
      return [...prev, ...newIds];
    });
  }, []);

  /**
   * Clear all viewed items
   */
  const clearViewed = useCallback(() => {
    setViewedIds([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  /**
   * Remove specific item from viewed list (useful if item is updated)
   */
  const unmarkAsViewed = useCallback((itemId) => {
    setViewedIds(prev => prev.filter(id => id !== itemId));
  }, []);

  /**
   * Get count of new items from a list
   */
  const getNewCount = useCallback((items, idKey = 'id') => {
    if (!Array.isArray(items)) return 0;
    return items.filter(item => !viewedIds.includes(item[idKey])).length;
  }, [viewedIds]);

  /**
   * Filter items to only show new ones
   */
  const filterNew = useCallback((items, idKey = 'id') => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => !viewedIds.includes(item[idKey]));
  }, [viewedIds]);

  return {
    isViewed,
    isNew,
    markAsViewed,
    markManyAsViewed,
    clearViewed,
    unmarkAsViewed,
    getNewCount,
    filterNew,
    viewedIds,
  };
}

/**
 * Hook to check if an item was created recently (within last 24 hours)
 * Useful for highlighting truly new items
 */
export function useRecentItems(hours = 24) {
  const isRecent = useCallback((createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff < hours;
  }, [hours]);

  return { isRecent };
}

/**
 * Combined hook for "new and unviewed" logic
 * An item is considered "new" if it's both recent AND not viewed
 */
export function useNewItems(storageKey, recentHours = 72) {
  const { isViewed, markAsViewed, markManyAsViewed, getNewCount } = useViewedItems(storageKey);
  const { isRecent } = useRecentItems(recentHours);

  const isNew = useCallback((item, idKey = 'id', dateKey = 'created_at') => {
    const itemId = item[idKey];
    const createdAt = item[dateKey];
    return isRecent(createdAt) && !isViewed(itemId);
  }, [isRecent, isViewed]);

  const getNewItemsCount = useCallback((items, idKey = 'id', dateKey = 'created_at') => {
    if (!Array.isArray(items)) return 0;
    return items.filter(item => isNew(item, idKey, dateKey)).length;
  }, [isNew]);

  return {
    isNew,
    markAsViewed,
    markManyAsViewed,
    getNewItemsCount,
  };
}
