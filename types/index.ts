/**
 * Type definitions for Behörden-Klartext application.
 */

/** Urgency level displayed as traffic light */
export type UrgencyLevel = "green" | "yellow" | "red";

/** Category of letter detected by scoring engine */
export type LetterCategory =
  | "enforcement"      // Vollstreckungsbescheid
  | "final_notice"     // Letzte Mahnung
  | "payment_reminder" // Zahlungserinnerung
  | "informational"    // Informationsschreiben
  | "unknown";

/** Extracted data from letter text */
export interface ExtractedData {
  dates: string[];
  amounts: { value: number; formatted: string }[];
  references: string[];
  ibans: string[];
  deadlineDays?: number;
}

/** Individual keyword match found in text */
export interface KeywordMatch {
  keyword: string;
  category: LetterCategory;
  weight: number;
  context: string;
}

/** Result from scoring engine */
export interface ScoringResult {
  urgency: UrgencyLevel;
  score: number;
  category: LetterCategory;
  categoryLabel: string;
  matches: KeywordMatch[];
  summary: string;
  recommendations: string[];
}

/** Complete analysis result */
export interface AnalysisResult {
  rawText: string;
  normalizedText: string;
  extractedData: ExtractedData;
  scoring: ScoringResult;
  processedAt: Date;
}

/** OCR processing state */
export interface OCRState {
  isProcessing: boolean;
  progress: number;
  status: string;
  error: string | null;
}

/** Camera state */
export interface CameraState {
  isActive: boolean;
  hasPermission: boolean | null;
  error: string | null;
}

// ============================================================================
// HISTORY TYPES
// ============================================================================

/** Source of input for analysis */
export type InputSource = "pdf" | "camera" | "text";

/** Individual rule match stored in history (optimized for storage) */
export interface HistoryRuleMatch {
  keyword: string;
  weight: number;
  effectiveWeight: number;
  isNeutralized: boolean;
  reason: string;
}

/** Single history entry */
export interface HistoryEntry {
  id: string;                    // Unique ID (timestamp-based)
  timestamp: number;             // Unix timestamp
  inputSource: InputSource;
  urgency: UrgencyLevel;
  score: number;
  category: LetterCategory;
  categoryLabel: string;
  preview: string;               // First ~100 chars of text
  summary: string;               // Generated summary text
  matches: HistoryRuleMatch[];   // All matched rules with details
  recommendations: string[];
}
