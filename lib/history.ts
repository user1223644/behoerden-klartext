/**
 * Local history storage service.
 * 
 * Stores analysis history in localStorage with:
 * - Entry limit enforcement (oldest removed when limit exceeded)
 * - No full text storage for privacy
 * - CRUD operations for history entries
 */

import { HistoryEntry, HistoryRuleMatch, AnalysisResult, InputSource } from "@/types";

// ============================================================================
// CONSTANTS
// ============================================================================

const HISTORY_KEY = "behoerden-klartext-history";
const MAX_ENTRIES = 20;

// ============================================================================
// LOW-LEVEL STORAGE OPERATIONS
// ============================================================================

/**
 * Load all history entries from localStorage.
 * Returns empty array if no history exists or on error.
 */
export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    return parsed as HistoryEntry[];
  } catch (error) {
    console.error("[History] Failed to load history:", error);
    return [];
  }
}

/**
 * Save history entries to localStorage.
 * Enforces MAX_ENTRIES limit by removing oldest entries.
 */
function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  
  try {
    // Enforce entry limit (keep newest)
    const limited = entries.slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("[History] Failed to save history:", error);
  }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Save a new history entry.
 * Entry is prepended (newest first).
 */
export function saveHistoryEntry(entry: HistoryEntry): void {
  const entries = loadHistory();
  entries.unshift(entry); // Add to beginning
  saveHistory(entries);
}

/**
 * Delete a single history entry by ID.
 */
export function deleteHistoryEntry(id: string): void {
  const entries = loadHistory();
  const filtered = entries.filter(e => e.id !== id);
  saveHistory(filtered);
}

/**
 * Clear all history entries.
 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Generate a unique ID for a history entry.
 * Uses timestamp + random suffix for uniqueness.
 */
function generateEntryId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Extract a preview from the raw text.
 * Takes first ~100 characters, cleaned up.
 */
function extractPreview(text: string): string {
  // Remove excess whitespace and newlines
  const cleaned = text.replace(/\s+/g, " ").trim();
  
  // Take first 100 characters
  if (cleaned.length <= 100) return cleaned;
  
  // Try to cut at word boundary
  const truncated = cleaned.substring(0, 100);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > 60) {
    return truncated.substring(0, lastSpace) + "…";
  }
  
  return truncated + "…";
}

/**
 * Convert KeywordMatch array to HistoryRuleMatch array.
 * Parses the context field for neutralization info.
 */
function convertMatches(matches: AnalysisResult["scoring"]["matches"]): HistoryRuleMatch[] {
  return matches.map(match => {
    // Check if context contains neutralization info (format: "context [reason]")
    const neutralizationMatch = match.context.match(/\[([^\]]+)\]$/);
    const isNeutralized = match.weight === 0 || neutralizationMatch !== null;
    const reason = neutralizationMatch 
      ? neutralizationMatch[1] 
      : (match.weight === 0 ? "Neutralisiert" : "Direkte Aussage");
    
    return {
      keyword: match.keyword,
      weight: match.weight,
      effectiveWeight: match.weight,
      isNeutralized,
      reason,
    };
  });
}

/**
 * Create a HistoryEntry from an AnalysisResult.
 * This is the main conversion function used after analysis completes.
 */
export function createHistoryEntry(
  result: AnalysisResult,
  inputSource: InputSource
): HistoryEntry {
  return {
    id: generateEntryId(),
    timestamp: Date.now(),
    inputSource,
    urgency: result.scoring.urgency,
    score: result.scoring.score,
    category: result.scoring.category,
    categoryLabel: result.scoring.categoryLabel,
    preview: extractPreview(result.rawText),
    summary: result.scoring.summary,
    matches: convertMatches(result.scoring.matches),
    recommendations: result.scoring.recommendations,
  };
}

// ============================================================================
// RELATIVE TIME FORMATTING
// ============================================================================

/**
 * Format a timestamp as relative time in German.
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  // Less than 1 minute
  if (diff < minute) {
    return "Gerade eben";
  }
  
  // Less than 1 hour
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `Vor ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}`;
  }
  
  // Today
  const today = new Date();
  const date = new Date(timestamp);
  if (date.toDateString() === today.toDateString()) {
    return `Heute, ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
  }
  
  // Yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Gestern, ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
  }
  
  // Less than 7 days
  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `Vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
  }
  
  // Older: show full date
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Get input source label in German.
 */
export function getInputSourceLabel(source: InputSource): string {
  switch (source) {
    case "pdf": return "PDF";
    case "camera": return "Kamera";
    case "text": return "Text";
  }
}
