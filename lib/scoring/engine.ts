/**
 * Main scoring engine for letter analysis.
 * 
 * This engine now uses CONTEXT-AWARE keyword evaluation to prevent
 * false RED alerts when urgent keywords appear in negated/cancelled contexts.
 * 
 * Key changes from simple keyword matching:
 * 1. Text is split into sentences for independent evaluation
 * 2. Each keyword is checked for nearby negation patterns
 * 3. Cancelled/revoked actions are properly ignored
 * 4. Only non-neutralized keywords contribute to the final score
 */

import { LetterCategory, KeywordMatch, ScoringResult, ExtractedData, UrgencyLevel } from "@/types";
import {
  ALL_KEYWORDS,
  CATEGORY_LABELS,
  RED_KEYWORDS,
  YELLOW_KEYWORDS,
  GREEN_KEYWORDS,
  KeywordDefinition,
} from "./keywords";
import {
  getUrgencyFromScore,
  getDeadlineMultiplier,
  CATEGORY_RECOMMENDATIONS,
  SUMMARY_TEMPLATES,
} from "./rules";
import {
  splitIntoSentences,
  evaluateKeywordInContext,
  evaluateBetreffKeywordWithBodyContext,
  EvaluatedKeyword,
} from "./context";

// ============================================================================
// EXTENDED KEYWORD MATCH (includes context evaluation results)
// ============================================================================

interface ExtendedKeywordMatch extends KeywordMatch {
  originalWeight: number;
  effectiveWeight: number;
  isNeutralized: boolean;
  reason: string;
}

// ============================================================================
// SENTENCE-LEVEL KEYWORD DETECTION
// ============================================================================

/**
 * Find all keyword matches in a single sentence and evaluate their context.
 * 
 * This function:
 * 1. Finds all keywords present in the sentence
 * 2. Evaluates each keyword's context for negation/mitigation
 * 3. Returns evaluated keywords with effective weights
 */
function findKeywordMatchesInSentence(sentence: string): ExtendedKeywordMatch[] {
  const normalizedSentence = sentence.toLowerCase();
  const matches: ExtendedKeywordMatch[] = [];

  for (const def of ALL_KEYWORDS) {
    const index = normalizedSentence.indexOf(def.keyword);
    if (index !== -1) {
      // Evaluate this keyword in its sentence context
      const evaluated = evaluateKeywordInContext(
        sentence,
        def.keyword,
        def.category,
        def.weight
      );

      matches.push({
        keyword: def.keyword,
        category: def.category,
        weight: evaluated.effectiveWeight, // Use effective weight, not original
        context: evaluated.context,
        originalWeight: evaluated.originalWeight,
        effectiveWeight: evaluated.effectiveWeight,
        isNeutralized: evaluated.isNeutralized,
        reason: evaluated.reason,
      });
    }
  }

  return matches;
}

/**
 * Detect if a text contains a Betreff line and extract it with the body.
 * Returns null if no Betreff is found.
 */
function extractBetreffAndBody(text: string): { betreff: string; body: string } | null {
  // Common Betreff patterns in German official letters
  const betreffPatterns = [
    /Betreff:?\s*(.+?)(?:\n|$)/i,
    /Betr\.:?\s*(.+?)(?:\n|$)/i,
    /Bezug:?\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of betreffPatterns) {
    const match = text.match(pattern);
    if (match) {
      const betreffLine = match[1].trim();
      // Remove the Betreff line from the text to get the body
      const body = text.replace(match[0], '').trim();
      return { betreff: betreffLine, body };
    }
  }

  return null;
}

/**
 * Find keywords in a Betreff line and evaluate them against body context.
 */
function findBetreffKeywordMatches(
  betreffLine: string,
  bodyText: string
): ExtendedKeywordMatch[] {
  const normalizedBetreff = betreffLine.toLowerCase();
  const matches: ExtendedKeywordMatch[] = [];

  for (const def of ALL_KEYWORDS) {
    const index = normalizedBetreff.indexOf(def.keyword);
    if (index !== -1) {
      // Use special Betreff evaluation that considers full body context
      const evaluated = evaluateBetreffKeywordWithBodyContext(
        def.keyword,
        def.category,
        def.weight,
        betreffLine,
        bodyText
      );

      matches.push({
        keyword: def.keyword,
        category: def.category,
        weight: evaluated.effectiveWeight,
        context: evaluated.context,
        originalWeight: evaluated.originalWeight,
        effectiveWeight: evaluated.effectiveWeight,
        isNeutralized: evaluated.isNeutralized,
        reason: evaluated.reason,
      });
    }
  }

  return matches;
}

/**
 * Find all keyword matches across the entire text, sentence by sentence.
 * This is the main entry point for context-aware keyword detection.
 * 
 * Special handling for Betreff (subject) lines:
 * - Keywords in Betreff are evaluated against the FULL body context
 * - Body negations can neutralize Betreff keywords
 * - Exclusion patterns in body reduce Betreff keyword weights
 */
function findKeywordMatchesWithContext(text: string): ExtendedKeywordMatch[] {
  const allMatches: ExtendedKeywordMatch[] = [];
  
  // Check for Betreff line and handle specially
  const betreffExtraction = extractBetreffAndBody(text);
  
  if (betreffExtraction) {
    // Process Betreff keywords with body context
    const betreffMatches = findBetreffKeywordMatches(
      betreffExtraction.betreff,
      betreffExtraction.body
    );
    allMatches.push(...betreffMatches);
    
    // Process body sentences normally
    const bodySentences = splitIntoSentences(betreffExtraction.body);
    for (const sentence of bodySentences) {
      const sentenceMatches = findKeywordMatchesInSentence(sentence);
      allMatches.push(...sentenceMatches);
    }
  } else {
    // No Betreff found - process entire text sentence by sentence
    const sentences = splitIntoSentences(text);
    for (const sentence of sentences) {
      const sentenceMatches = findKeywordMatchesInSentence(sentence);
      allMatches.push(...sentenceMatches);
    }
  }

  return allMatches;
}

// ============================================================================
// CATEGORY DETERMINATION
// ============================================================================

/**
 * Determine the primary category from matches.
 * Only considers NON-NEUTRALIZED keywords.
 */
function determinePrimaryCategory(matches: ExtendedKeywordMatch[]): LetterCategory {
  // Filter to only active (non-neutralized) matches
  const activeMatches = matches.filter(m => !m.isNeutralized);
  
  if (activeMatches.length === 0) {
    // All keywords were negated - this is likely an informational letter
    return "informational";
  }

  // Create category scores from EFFECTIVE weights (not original)
  const categoryScores: Record<LetterCategory, number> = {
    enforcement: 0,
    final_notice: 0,
    payment_reminder: 0,
    informational: 0,
    unknown: 0,
  };

  for (const match of activeMatches) {
    categoryScores[match.category] += match.effectiveWeight;
  }

  // Find highest scoring category
  let maxScore = 0;
  let primaryCategory: LetterCategory = "unknown";

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryCategory = category as LetterCategory;
    }
  }

  return primaryCategory;
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Calculate score based on highest EFFECTIVE keyword weight per urgency level.
 * 
 * Key difference from simple scoring:
 * - Only NON-NEUTRALIZED keywords contribute to the score
 * - Effective weights (after context modifiers) are used
 * - If all RED keywords are negated, the score drops to YELLOW or GREEN
 */
function calculateScoreWithContext(
  matches: ExtendedKeywordMatch[],
  deadlineDays?: number
): number {
  // Filter to only active matches
  const activeMatches = matches.filter(m => !m.isNeutralized);
  
  if (activeMatches.length === 0) {
    // All keywords were negated - return 0 (GREEN)
    return 0;
  }

  // Check for active RED keywords
  const activeRedKeywords = activeMatches.filter(m => {
    const originalDef = RED_KEYWORDS.find(k => k.keyword === m.keyword);
    return originalDef !== undefined;
  });

  if (activeRedKeywords.length > 0) {
    const maxRedWeight = Math.max(...activeRedKeywords.map(m => m.effectiveWeight));
    const multiplier = getDeadlineMultiplier(deadlineDays);
    return Math.min(100, Math.round(maxRedWeight * multiplier));
  }

  // Check for active YELLOW keywords
  const activeYellowKeywords = activeMatches.filter(m => {
    const originalDef = YELLOW_KEYWORDS.find(k => k.keyword === m.keyword);
    return originalDef !== undefined;
  });

  if (activeYellowKeywords.length > 0) {
    const maxYellowWeight = Math.max(...activeYellowKeywords.map(m => m.effectiveWeight));
    const multiplier = getDeadlineMultiplier(deadlineDays);
    return Math.min(79, Math.round(maxYellowWeight * multiplier));
  }

  // Check for active GREEN keywords
  const activeGreenKeywords = activeMatches.filter(m => {
    const originalDef = GREEN_KEYWORDS.find(k => k.keyword === m.keyword);
    return originalDef !== undefined;
  });

  if (activeGreenKeywords.length > 0) {
    const maxGreenWeight = Math.max(...activeGreenKeywords.map(m => m.effectiveWeight));
    return Math.min(39, maxGreenWeight);
  }

  return 0;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze text and return scoring result.
 * This is the main entry point for the context-aware scoring engine.
 */
export function analyzeText(
  text: string,
  extractedData: ExtractedData
): ScoringResult {
  // Find all keywords with context-aware evaluation
  const matches = findKeywordMatchesWithContext(text);
  
  // Determine category from active keywords only
  const category = determinePrimaryCategory(matches);
  
  // Calculate score from active keywords only
  const score = calculateScoreWithContext(matches, extractedData.deadlineDays);
  
  // Get urgency level from score
  const urgency = getUrgencyFromScore(score);
  const categoryLabel = CATEGORY_LABELS[category];

  // Generate summary
  const summary = SUMMARY_TEMPLATES[urgency](category, categoryLabel);

  // Get recommendations for this category
  const recommendations = CATEGORY_RECOMMENDATIONS[category];

  // Log neutralized keywords for debugging (can be removed in production)
  const neutralizedCount = matches.filter(m => m.isNeutralized).length;
  if (neutralizedCount > 0) {
    console.log(`[Context-Aware Scoring] ${neutralizedCount} keyword(s) neutralized by context`);
  }

  // Convert extended matches back to standard KeywordMatch format for the result
  const standardMatches: KeywordMatch[] = matches.map(m => ({
    keyword: m.keyword,
    category: m.category,
    weight: m.effectiveWeight,
    context: m.isNeutralized 
      ? `${m.context} [${m.reason}]`  // Include neutralization reason in context
      : m.context,
  }));

  return {
    urgency,
    score,
    category,
    categoryLabel,
    matches: standardMatches,
    summary,
    recommendations,
  };
}

// ============================================================================
// QUICK CHECK UTILITY
// ============================================================================

/**
 * Quick check if text likely needs urgent attention.
 * This is a fast pre-filter that does NOT apply context evaluation.
 * Use analyzeText() for accurate scoring.
 */
export function quickUrgencyCheck(text: string): boolean {
  const lowerText = text.toLowerCase();
  const urgentKeywords = [
    "zwangsvollstreckung",
    "vollstreckung",
    "erzwingungshaft",
    "haftbefehl",
    "pfändung",
  ];

  return urgentKeywords.some((kw) => lowerText.includes(kw));
}

