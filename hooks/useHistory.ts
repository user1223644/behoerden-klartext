"use client";

/**
 * React hook for managing analysis history.
 * 
 * Provides:
 * - Loading history entries
 * - Adding new entries after analysis
 * - Deleting individual entries
 * - Clearing all history
 */

import { useState, useEffect, useCallback } from "react";
import { HistoryEntry, AnalysisResult, InputSource } from "@/types";
import {
  loadHistory,
  saveHistoryEntry,
  deleteHistoryEntry as deleteFromStorage,
  clearHistory as clearFromStorage,
  createHistoryEntry,
} from "@/lib/history";

interface UseHistoryReturn {
  entries: HistoryEntry[];
  isLoading: boolean;
  addEntry: (result: AnalysisResult, inputSource: InputSource) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
  refresh: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    const loaded = loadHistory();
    setEntries(loaded);
    setIsLoading(false);
  }, []);

  // Refresh entries from storage
  const refresh = useCallback(() => {
    const loaded = loadHistory();
    setEntries(loaded);
  }, []);

  // Add new entry
  const addEntry = useCallback((result: AnalysisResult, inputSource: InputSource) => {
    const entry = createHistoryEntry(result, inputSource);
    saveHistoryEntry(entry);
    // Update local state
    setEntries(prev => [entry, ...prev].slice(0, 20));
  }, []);

  // Delete single entry
  const deleteEntry = useCallback((id: string) => {
    deleteFromStorage(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  // Clear all entries
  const clearAll = useCallback(() => {
    clearFromStorage();
    setEntries([]);
  }, []);

  return {
    entries,
    isLoading,
    addEntry,
    deleteEntry,
    clearAll,
    refresh,
  };
}
