/**
 * Main scoring engine for letter analysis.
 */

import { LetterCategory, KeywordMatch, ScoringResult, ExtractedData, UrgencyLevel } from "@/types";
import {
  ALL_KEYWORDS,
  CATEGORY_LABELS,
  RED_KEYWORDS,
  YELLOW_KEYWORDS,
  GREEN_KEYWORDS,
} from "./keywords";
import {
  getUrgencyFromScore,
  getDeadlineMultiplier,
  CATEGORY_RECOMMENDATIONS,
  SUMMARY_TEMPLATES,
} from "./rules";

/**
 * Find all keyword matches in the text.
 */
function findKeywordMatches(text: string): KeywordMatch[] {
  const normalizedText = text.toLowerCase();
  const matches: KeywordMatch[] = [];

  for (const def of ALL_KEYWORDS) {
    const index = normalizedText.indexOf(def.keyword);
    if (index !== -1) {
      // Extract context (surrounding text)
      const start = Math.max(0, index - 30);
      const end = Math.min(normalizedText.length, index + def.keyword.length + 30);
      const context = text.substring(start, end).trim();

      matches.push({
        keyword: def.keyword,
        category: def.category,
        weight: def.weight,
        context: `...${context}...`,
      });
    }
  }

  return matches;
}

/**
 * Determine the primary category from matches.
 */
function determinePrimaryCategory(matches: KeywordMatch[]): LetterCategory {
  if (matches.length === 0) return "unknown";

  // Create category scores
  const categoryScores: Record<LetterCategory, number> = {
    enforcement: 0,
    final_notice: 0,
    payment_reminder: 0,
    informational: 0,
    unknown: 0,
  };

  for (const match of matches) {
    categoryScores[match.category] += match.weight;
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

/**
 * Calculate score based on highest keyword weight per urgency level.
 * This approach uses urgency levels: Red > Yellow > Green
 */
function calculateScore(
  matches: KeywordMatch[],
  deadlineDays?: number
): number {
  if (matches.length === 0) return 0;

  const lowerKeywords = matches.map((m) => m.keyword.toLowerCase());

  // Check for RED keywords first (highest priority)
  let maxRedWeight = 0;
  for (const def of RED_KEYWORDS) {
    if (lowerKeywords.includes(def.keyword)) {
      maxRedWeight = Math.max(maxRedWeight, def.weight);
    }
  }

  // If RED keyword found, use its weight as base score
  if (maxRedWeight > 0) {
    const multiplier = getDeadlineMultiplier(deadlineDays);
    return Math.min(100, Math.round(maxRedWeight * multiplier));
  }

  // Check for YELLOW keywords
  let maxYellowWeight = 0;
  for (const def of YELLOW_KEYWORDS) {
    if (lowerKeywords.includes(def.keyword)) {
      maxYellowWeight = Math.max(maxYellowWeight, def.weight);
    }
  }

  // If YELLOW keyword found, use its weight as base score
  if (maxYellowWeight > 0) {
    const multiplier = getDeadlineMultiplier(deadlineDays);
    return Math.min(79, Math.round(maxYellowWeight * multiplier)); // Cap below red threshold
  }

  // Check for GREEN keywords
  let maxGreenWeight = 0;
  for (const def of GREEN_KEYWORDS) {
    if (lowerKeywords.includes(def.keyword)) {
      maxGreenWeight = Math.max(maxGreenWeight, def.weight);
    }
  }

  // GREEN keywords = low score
  return Math.min(39, maxGreenWeight); // Cap below yellow threshold
}

/**
 * Analyze text and return scoring result.
 */
export function analyzeText(
  text: string,
  extractedData: ExtractedData
): ScoringResult {
  const matches = findKeywordMatches(text);
  const category = determinePrimaryCategory(matches);
  const score = calculateScore(matches, extractedData.deadlineDays);
  const urgency = getUrgencyFromScore(score);
  const categoryLabel = CATEGORY_LABELS[category];

  // Generate summary
  const summary = SUMMARY_TEMPLATES[urgency](category, categoryLabel);

  // Get recommendations for this category
  const recommendations = CATEGORY_RECOMMENDATIONS[category];

  return {
    urgency,
    score,
    category,
    categoryLabel,
    matches,
    summary,
    recommendations,
  };
}

/**
 * Quick check if text likely needs urgent attention.
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
