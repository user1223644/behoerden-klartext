/**
 * Highlighting engine for visual keyword highlighting in previews.
 *
 * This module wraps the existing context evaluation logic to provide
 * highlighting data with exact text positions. It ensures the preview
 * behaves identically to the scoring engine.
 *
 * Key design:
 * - Reuses evaluateKeywordInContext from context.ts
 * - Reuses ALL_KEYWORDS from keywords.ts
 * - No duplicated heuristics - same rules, same results
 */

import { UrgencyLevel, LetterCategory } from "@/types";
import { ALL_KEYWORDS, RED_KEYWORDS, YELLOW_KEYWORDS, GREEN_KEYWORDS } from "./keywords";
import {
  splitIntoSentences,
  evaluateKeywordInContext,
  evaluateBetreffKeywordWithBodyContext,
  EvaluatedKeyword,
} from "./context";

// ============================================================================
// TYPES
// ============================================================================

/**
 * A span of text that should be highlighted in the preview.
 * Contains all information needed for rendering and tooltips.
 */
export interface HighlightSpan {
  /** The matched keyword text */
  keyword: string;
  /** Start character offset in the source text */
  start: number;
  /** End character offset in the source text */
  end: number;
  /** Original urgency level of the keyword */
  urgency: UrgencyLevel;
  /** Category of the keyword */
  category: LetterCategory;
  /** Whether this keyword was neutralized by context */
  isNeutralized: boolean;
  /** Human-readable reason for the match status */
  reason: string;
  /** Original weight before context evaluation */
  originalWeight: number;
  /** Effective weight after context evaluation */
  effectiveWeight: number;
  /** The sentence containing this keyword (for context display) */
  sentenceContext: string;
}

/**
 * Result of highlighting analysis for a text.
 */
export interface HighlightResult {
  /** All highlight spans found in the text */
  spans: HighlightSpan[];
  /** Count of active (non-neutralized) spans by urgency */
  activeCount: {
    red: number;
    yellow: number;
    green: number;
  };
  /** Count of neutralized spans */
  neutralizedCount: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the urgency level from keyword definition.
 */
function getKeywordUrgency(keyword: string): UrgencyLevel {
  if (RED_KEYWORDS.some(k => k.keyword === keyword)) return "red";
  if (YELLOW_KEYWORDS.some(k => k.keyword === keyword)) return "yellow";
  if (GREEN_KEYWORDS.some(k => k.keyword === keyword)) return "green";
  return "green"; // Fallback
}

/**
 * Find all occurrences of a keyword in text and return their positions.
 * Handles case-insensitive matching while preserving original positions.
 */
function findKeywordPositions(
  text: string,
  keyword: string
): Array<{ start: number; end: number }> {
  const positions: Array<{ start: number; end: number }> = [];
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  let searchStart = 0;
  while (searchStart < lowerText.length) {
    const index = lowerText.indexOf(lowerKeyword, searchStart);
    if (index === -1) break;

    positions.push({
      start: index,
      end: index + keyword.length,
    });

    searchStart = index + 1;
  }

  return positions;
}

/**
 * Find the sentence containing a specific character position.
 */
function findContainingSentence(text: string, position: number): string {
  const sentences = splitIntoSentences(text);
  let currentPos = 0;

  for (const sentence of sentences) {
    const sentenceStart = text.indexOf(sentence, currentPos);
    if (sentenceStart === -1) continue;

    const sentenceEnd = sentenceStart + sentence.length;
    if (position >= sentenceStart && position < sentenceEnd) {
      return sentence;
    }
    currentPos = sentenceEnd;
  }

  // Fallback: return a window around the position
  const windowStart = Math.max(0, position - 50);
  const windowEnd = Math.min(text.length, position + 50);
  return text.substring(windowStart, windowEnd);
}

// ============================================================================
// BETREFF DETECTION
// ============================================================================

/**
 * Extract Betreff line and body from text.
 * Returns null if no Betreff is found.
 */
function extractBetreffAndBody(text: string): { betreff: string; body: string; betreffStart: number; betreffEnd: number } | null {
  const betreffPatterns = [
    /Betreff:?\s*(.+?)(?:\n|$)/i,
    /Betr\.:?\s*(.+?)(?:\n|$)/i,
    /Bezug:?\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of betreffPatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      const betreffLine = match[1].trim();
      const betreffStart = match.index + match[0].indexOf(match[1]);
      const betreffEnd = betreffStart + betreffLine.length;
      const body = text.replace(match[0], '').trim();
      return { betreff: betreffLine, body, betreffStart, betreffEnd };
    }
  }

  return null;
}

// ============================================================================
// MAIN HIGHLIGHTING FUNCTION
// ============================================================================

/**
 * Analyze text and return all highlight spans.
 *
 * This function mirrors the scoring engine's logic exactly:
 * 1. Splits text into sentences
 * 2. Evaluates each keyword in its sentence context
 * 3. Applies negation, cancellation, and mitigation patterns
 * 4. Returns positioned spans for highlighting
 *
 * @param text - The full text to analyze
 * @returns HighlightResult with all spans and counts
 */
export function getHighlightSpans(text: string): HighlightResult {
  const spans: HighlightSpan[] = [];
  const processedPositions = new Set<string>(); // Avoid duplicate spans at same position

  // Check for Betreff line
  const betreffExtraction = extractBetreffAndBody(text);

  if (betreffExtraction) {
    // Process Betreff keywords with body context
    for (const def of ALL_KEYWORDS) {
      const positions = findKeywordPositions(betreffExtraction.betreff, def.keyword);

      for (const pos of positions) {
        // Adjust position to account for Betreff location in original text
        const absoluteStart = betreffExtraction.betreffStart + pos.start;
        const absoluteEnd = betreffExtraction.betreffStart + pos.end;
        const posKey = `${absoluteStart}-${absoluteEnd}`;

        if (processedPositions.has(posKey)) continue;
        processedPositions.add(posKey);

        // Evaluate with body context
        const evaluated = evaluateBetreffKeywordWithBodyContext(
          def.keyword,
          def.category,
          def.weight,
          betreffExtraction.betreff,
          betreffExtraction.body
        );

        spans.push({
          keyword: def.keyword,
          start: absoluteStart,
          end: absoluteEnd,
          urgency: getKeywordUrgency(def.keyword),
          category: def.category,
          isNeutralized: evaluated.isNeutralized,
          reason: evaluated.reason,
          originalWeight: evaluated.originalWeight,
          effectiveWeight: evaluated.effectiveWeight,
          sentenceContext: `Betreff: ${betreffExtraction.betreff}`,
        });
      }
    }

    // Process body sentences
    const bodySentences = splitIntoSentences(betreffExtraction.body);
    let bodySearchStart = text.indexOf(betreffExtraction.body);
    if (bodySearchStart === -1) bodySearchStart = 0;

    for (const sentence of bodySentences) {
      const sentenceStart = text.indexOf(sentence, bodySearchStart);
      if (sentenceStart === -1) continue;

      for (const def of ALL_KEYWORDS) {
        const positions = findKeywordPositions(sentence, def.keyword);

        for (const pos of positions) {
          const absoluteStart = sentenceStart + pos.start;
          const absoluteEnd = sentenceStart + pos.end;
          const posKey = `${absoluteStart}-${absoluteEnd}`;

          if (processedPositions.has(posKey)) continue;
          processedPositions.add(posKey);

          const evaluated = evaluateKeywordInContext(
            sentence,
            def.keyword,
            def.category,
            def.weight
          );

          spans.push({
            keyword: def.keyword,
            start: absoluteStart,
            end: absoluteEnd,
            urgency: getKeywordUrgency(def.keyword),
            category: def.category,
            isNeutralized: evaluated.isNeutralized,
            reason: evaluated.reason,
            originalWeight: evaluated.originalWeight,
            effectiveWeight: evaluated.effectiveWeight,
            sentenceContext: sentence,
          });
        }
      }
    }
  } else {
    // No Betreff - process entire text sentence by sentence
    const sentences = splitIntoSentences(text);
    let searchStart = 0;

    for (const sentence of sentences) {
      const sentenceStart = text.indexOf(sentence, searchStart);
      if (sentenceStart === -1) continue;

      for (const def of ALL_KEYWORDS) {
        const positions = findKeywordPositions(sentence, def.keyword);

        for (const pos of positions) {
          const absoluteStart = sentenceStart + pos.start;
          const absoluteEnd = sentenceStart + pos.end;
          const posKey = `${absoluteStart}-${absoluteEnd}`;

          if (processedPositions.has(posKey)) continue;
          processedPositions.add(posKey);

          const evaluated = evaluateKeywordInContext(
            sentence,
            def.keyword,
            def.category,
            def.weight
          );

          spans.push({
            keyword: def.keyword,
            start: absoluteStart,
            end: absoluteEnd,
            urgency: getKeywordUrgency(def.keyword),
            category: def.category,
            isNeutralized: evaluated.isNeutralized,
            reason: evaluated.reason,
            originalWeight: evaluated.originalWeight,
            effectiveWeight: evaluated.effectiveWeight,
            sentenceContext: sentence,
          });
        }
      }

      searchStart = sentenceStart + sentence.length;
    }
  }

  // Sort spans by position
  spans.sort((a, b) => a.start - b.start);

  // Calculate counts
  const activeCount = { red: 0, yellow: 0, green: 0 };
  let neutralizedCount = 0;

  for (const span of spans) {
    if (span.isNeutralized) {
      neutralizedCount++;
    } else {
      activeCount[span.urgency]++;
    }
  }

  return {
    spans,
    activeCount,
    neutralizedCount,
  };
}

/**
 * Quick check if text has any highlightable keywords.
 * Useful for determining if preview should be shown.
 */
export function hasHighlightableContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ALL_KEYWORDS.some(def => lowerText.includes(def.keyword));
}
