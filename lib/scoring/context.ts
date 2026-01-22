/**
 * Context-aware evaluation module for German official letters.
 * 
 * This module detects negation, cancellation, and mitigation patterns
 * that modify the urgency weight of keywords. It prevents false RED alerts
 * when urgent keywords appear in non-actionable contexts.
 * 
 * Example:
 *   "Die Zwangsvollstreckung wurde AUFGEHOBEN."
 *   → Keyword "Zwangsvollstreckung" is present but CANCELLED
 *   → effectiveWeight = 0, no RED alert triggered
 */

import { LetterCategory } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EvaluatedKeyword {
  keyword: string;
  category: LetterCategory;
  originalWeight: number;
  effectiveWeight: number;
  reason: string;
  isNeutralized: boolean;
  context: string;
}

interface NegationPattern {
  pattern: RegExp;
  type: "strong" | "cancellation" | "rejection";
  name: string;
}

interface MitigationPattern {
  pattern: RegExp;
  type: "informational" | "conditional";
  reduction: number; // 0.0 to 1.0 (e.g., 0.5 = 50% reduction)
  name: string;
}

// ============================================================================
// NEGATION PATTERNS (100% neutralize keyword weight)
// ============================================================================

/**
 * Strong negators: Words that directly negate the associated action.
 * When found within ±5 words of a keyword, the keyword is fully neutralized.
 * 
 * Example: "Eine Pfändung wird NICHT eingeleitet."
 */
export const STRONG_NEGATORS: NegationPattern[] = [
  { pattern: /\bnicht\b/i, type: "strong", name: "nicht" },
  { pattern: /\bkeine[nmrs]?\b/i, type: "strong", name: "keine" },
  { pattern: /\bkeinerlei\b/i, type: "strong", name: "keinerlei" },
  { pattern: /\bniemals\b/i, type: "strong", name: "niemals" },
  { pattern: /\bweder\b/i, type: "strong", name: "weder" },
  { pattern: /\bohne\b/i, type: "strong", name: "ohne" },
  { pattern: /\bnicht\s+mehr\b/i, type: "strong", name: "nicht mehr" },
];

/**
 * Cancellation verbs: Indicate a previously announced action was cancelled.
 * These are checked at the sentence level (not just the word window).
 * 
 * Example: "Das Vollstreckungsverfahren wurde AUFGEHOBEN."
 */
export const CANCELLATION_VERBS: NegationPattern[] = [
  { pattern: /\baufgehoben\b/i, type: "cancellation", name: "aufgehoben" },
  { pattern: /\bwiderrufen\b/i, type: "cancellation", name: "widerrufen" },
  { pattern: /\bzur[üu]ckgenommen\b/i, type: "cancellation", name: "zurückgenommen" },
  { pattern: /\beingestellt\b/i, type: "cancellation", name: "eingestellt" },
  { pattern: /\berledigt\b/i, type: "cancellation", name: "erledigt" },
  { pattern: /\bbeendet\b/i, type: "cancellation", name: "beendet" },
  { pattern: /\babgeschlossen\b/i, type: "cancellation", name: "abgeschlossen" },
];

/**
 * Rejection patterns: Indicate an action was denied or is not planned.
 * 
 * Example: "Eine Kontopfändung WIRD NICHT eingeleitet."
 */
export const REJECTION_PATTERNS: NegationPattern[] = [
  { pattern: /\babgelehnt\b/i, type: "rejection", name: "abgelehnt" },
  { pattern: /\bnicht\s+erteilt\b/i, type: "rejection", name: "nicht erteilt" },
  { pattern: /\bwird\s+nicht\b/i, type: "rejection", name: "wird nicht" },
  { pattern: /\bnicht\s+vorgesehen\b/i, type: "rejection", name: "nicht vorgesehen" },
  { pattern: /\bentf[äa]llt\b/i, type: "rejection", name: "entfällt" },
  { pattern: /\bnicht\s+erforderlich\b/i, type: "rejection", name: "nicht erforderlich" },
];

// ============================================================================
// MITIGATION PATTERNS (Reduce keyword weight, don't fully neutralize)
// ============================================================================

/**
 * Informational markers: Indicate the letter is for information only.
 * These reduce the keyword weight but don't fully neutralize it.
 * 
 * Example: "ZUR KENNTNIS: Ein Vollstreckungsverfahren läuft gegen Herrn X."
 */
export const INFORMATIONAL_MARKERS: MitigationPattern[] = [
  { pattern: /\bzur\s+Kenntnis\b/i, type: "informational", reduction: 0.5, name: "zur Kenntnis" },
  { pattern: /\bzur\s+Information\b/i, type: "informational", reduction: 0.5, name: "zur Information" },
  { pattern: /\bHinweis\b/i, type: "informational", reduction: 0.3, name: "Hinweis" },
  { pattern: /\bMitteilung\b/i, type: "informational", reduction: 0.3, name: "Mitteilung" },
  { pattern: /\bkein\s+Handlungsbedarf\b/i, type: "informational", reduction: 0.9, name: "kein Handlungsbedarf" },
  { pattern: /\bkeine\s+weiteren\s+Schritte\b/i, type: "informational", reduction: 0.9, name: "keine weiteren Schritte" },
  { pattern: /\bohne\s+weitere\s+Ma[ßs]nahmen\b/i, type: "informational", reduction: 0.7, name: "ohne weitere Maßnahmen" },
];

/**
 * Conditional markers: Indicate the action is hypothetical or conditional.
 * 
 * Example: "FALLS keine Zahlung erfolgt, wird eine Pfändung eingeleitet."
 */
export const CONDITIONAL_MARKERS: MitigationPattern[] = [
  { pattern: /\bfalls\b/i, type: "conditional", reduction: 0.4, name: "falls" },
  { pattern: /\bsofern\b/i, type: "conditional", reduction: 0.4, name: "sofern" },
  { pattern: /\bwenn\s+nicht\b/i, type: "conditional", reduction: 0.3, name: "wenn nicht" },
  { pattern: /\bw[üu]rde\b/i, type: "conditional", reduction: 0.5, name: "würde" },
  { pattern: /\bk[öo]nnte\b/i, type: "conditional", reduction: 0.5, name: "könnte" },
];

/**
 * Exclusion patterns: Indicate administrative/procedural context rather than enforcement.
 * When found in the body context for a Betreff keyword, reduce weight to YELLOW level (~60% reduction).
 * 
 * Example: "Betreff: Haftbefehl" + Body contains "Beschluss über Verfahrenskoordination"
 * → The Haftbefehl is mentioned in an administrative context, not enforcement
 */
export const EXCLUSION_PATTERNS: MitigationPattern[] = [
  { pattern: /\bBeschluss\b/i, type: "informational", reduction: 0.6, name: "Beschluss" },
  { pattern: /\bAnordnung\b/i, type: "informational", reduction: 0.6, name: "Anordnung" },
  { pattern: /\bWeisungen?\b/i, type: "informational", reduction: 0.6, name: "Weisung" },
  { pattern: /\bVerfahrenskoordination\b/i, type: "informational", reduction: 0.6, name: "Verfahrenskoordination" },
  { pattern: /\bVerwaltungsakt\b/i, type: "informational", reduction: 0.5, name: "Verwaltungsakt" },
  { pattern: /\bAktennotiz\b/i, type: "informational", reduction: 0.7, name: "Aktennotiz" },
];

// ============================================================================
// SENTENCE SEGMENTATION
// ============================================================================

/**
 * Contrastive conjunctions that should split a sentence into separate contexts.
 * Example: "Die Pfändung wurde aufgehoben, ABER eine neue wird eingeleitet."
 */
const CONTRASTIVE_CONJUNCTIONS = /\b(aber|jedoch|allerdings|dennoch|trotzdem)\b/gi;

/**
 * Standard sentence delimiters.
 */
const SENTENCE_DELIMITERS = /[.!?;]\s+|\n\n+/;

/**
 * Split text into evaluable sentence units.
 * Handles both standard punctuation and contrastive conjunctions.
 */
export function splitIntoSentences(text: string): string[] {
  // First split on contrastive conjunctions (they create new contexts)
  const withContrastiveSplits = text.replace(CONTRASTIVE_CONJUNCTIONS, ". $1");
  
  // Then split on standard delimiters
  const sentences = withContrastiveSplits
    .split(SENTENCE_DELIMITERS)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

// ============================================================================
// CONTEXT WINDOW EXTRACTION
// ============================================================================

/**
 * Tokenize a sentence into words for window-based analysis.
 */
function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Get the context window around a keyword position.
 * Default window size is ±5 words.
 */
function getContextWindow(
  tokens: string[],
  keywordStartIndex: number,
  keywordLength: number,
  windowSize: number = 5
): string {
  const start = Math.max(0, keywordStartIndex - windowSize);
  const end = Math.min(tokens.length, keywordStartIndex + keywordLength + windowSize);
  return tokens.slice(start, end).join(" ");
}

/**
 * Find the token index where a keyword starts in a sentence.
 */
function findKeywordTokenIndex(tokens: string[], keyword: string): number {
  const keywordTokens = keyword.toLowerCase().split(/\s+/);
  const keywordFirst = keywordTokens[0];
  
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].includes(keywordFirst)) {
      return i;
    }
  }
  return -1;
}

// ============================================================================
// CONTEXT EVALUATION
// ============================================================================

/**
 * Evaluate a keyword within its sentence context.
 * Checks for negation, cancellation, rejection, and mitigation patterns.
 * 
 * @param sentence - The sentence containing the keyword
 * @param keyword - The keyword string
 * @param category - The keyword's category
 * @param originalWeight - The keyword's base weight
 * @returns EvaluatedKeyword with effective weight and reason
 */
export function evaluateKeywordInContext(
  sentence: string,
  keyword: string,
  category: LetterCategory,
  originalWeight: number
): EvaluatedKeyword {
  const tokens = tokenize(sentence);
  const keywordIndex = findKeywordTokenIndex(tokens, keyword);
  const keywordLength = keyword.split(/\s+/).length;
  
  // Get the ±5 word window around the keyword
  const windowText = keywordIndex >= 0 
    ? getContextWindow(tokens, keywordIndex, keywordLength, 5)
    : sentence.toLowerCase();
  
  // Extract display context (surrounding text)
  const lowerSentence = sentence.toLowerCase();
  const keywordPos = lowerSentence.indexOf(keyword.toLowerCase());
  const contextStart = Math.max(0, keywordPos - 30);
  const contextEnd = Math.min(sentence.length, keywordPos + keyword.length + 30);
  const displayContext = `...${sentence.substring(contextStart, contextEnd).trim()}...`;

  // -------------------------------------------------------------------------
  // Rule 1: Check strong negators in word window (100% neutralize)
  // -------------------------------------------------------------------------
  for (const negator of STRONG_NEGATORS) {
    if (negator.pattern.test(windowText)) {
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: 0,
        reason: `Negiert durch "${negator.name}"`,
        isNeutralized: true,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 2: Check cancellation verbs in full sentence (100% neutralize)
  // These indicate the action was cancelled/revoked/completed
  // NOTE: Check against lowercase sentence for case-insensitive matching
  // -------------------------------------------------------------------------
  for (const verb of CANCELLATION_VERBS) {
    if (verb.pattern.test(lowerSentence)) {
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: 0,
        reason: `Aufgehoben/Erledigt: "${verb.name}"`,
        isNeutralized: true,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 3: Check rejection patterns in word window (100% neutralize)
  // -------------------------------------------------------------------------
  for (const pattern of REJECTION_PATTERNS) {
    if (pattern.pattern.test(windowText)) {
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: 0,
        reason: `Abgelehnt: "${pattern.name}"`,
        isNeutralized: true,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 4: Check informational markers (reduce weight 30-90%)
  // These indicate the letter is for information only
  // NOTE: Check against lowercase sentence for case-insensitive matching
  // -------------------------------------------------------------------------
  for (const marker of INFORMATIONAL_MARKERS) {
    if (marker.pattern.test(lowerSentence)) {
      const reducedWeight = Math.round(originalWeight * (1 - marker.reduction));
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: reducedWeight,
        reason: `Nur zur Information: "${marker.name}" (-${Math.round(marker.reduction * 100)}%)`,
        isNeutralized: false,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 5: Check conditional markers (reduce weight 30-50%)
  // These indicate the action is hypothetical or conditional
  // -------------------------------------------------------------------------
  for (const marker of CONDITIONAL_MARKERS) {
    if (marker.pattern.test(windowText)) {
      const reducedWeight = Math.round(originalWeight * (1 - marker.reduction));
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: reducedWeight,
        reason: `Bedingt: "${marker.name}" (-${Math.round(marker.reduction * 100)}%)`,
        isNeutralized: false,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 6: No modifiers found - keyword has full urgency weight
  // -------------------------------------------------------------------------
  return {
    keyword,
    category,
    originalWeight,
    effectiveWeight: originalWeight,
    reason: "Direkte/handlungsrelevante Aussage",
    isNeutralized: false,
    context: displayContext,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a sentence contains any strong negation pattern.
 * Useful for quick pre-filtering.
 */
export function hasStrongNegation(sentence: string): boolean {
  const lowerSentence = sentence.toLowerCase();
  return (
    STRONG_NEGATORS.some(n => n.pattern.test(lowerSentence)) ||
    CANCELLATION_VERBS.some(v => v.pattern.test(lowerSentence)) ||
    REJECTION_PATTERNS.some(r => r.pattern.test(lowerSentence))
  );
}

/**
 * Check if a sentence has informational framing.
 */
export function hasInformationalFraming(sentence: string): boolean {
  return INFORMATIONAL_MARKERS.some(m => m.pattern.test(sentence));
}

// ============================================================================
// BETREFF (SUBJECT LINE) CONTEXT EVALUATION
// ============================================================================

/**
 * Evaluate a Betreff keyword against the FULL body context.
 * 
 * Unlike regular sentence-level evaluation, this function:
 * 1. Looks for negations anywhere in the body that reference the keyword
 * 2. Checks for exclusion patterns (administrative/procedural terms)
 * 3. Allows body context to neutralize or reduce Betreff keyword weights
 * 
 * @param keyword - The keyword found in the Betreff line
 * @param category - The keyword's category
 * @param originalWeight - The keyword's base weight
 * @param betreffLine - The full Betreff line (for context display)
 * @param bodyText - The full body text of the letter (excluding Betreff)
 * @returns EvaluatedKeyword with effective weight based on body context
 */
export function evaluateBetreffKeywordWithBodyContext(
  keyword: string,
  category: LetterCategory,
  originalWeight: number,
  betreffLine: string,
  bodyText: string
): EvaluatedKeyword {
  const lowerBody = bodyText.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const displayContext = `Betreff: ${betreffLine.substring(0, 50)}...`;

  // -------------------------------------------------------------------------
  // Rule 1: Check if the keyword itself is negated in the body
  // Look for patterns like "der Haftbefehl wird nicht erteilt"
  // -------------------------------------------------------------------------
  
  // Check for keyword + negation phrase patterns
  const keywordNegationPatterns = [
    new RegExp(`${lowerKeyword}[^.]*\\b(nicht|keine[nmrs]?|niemals)\\b`, 'i'),
    new RegExp(`\\b(nicht|keine[nmrs]?|niemals)\\b[^.]*${lowerKeyword}`, 'i'),
    new RegExp(`${lowerKeyword}[^.]*\\b(wird nicht|nicht erteilt|nicht vorgesehen|entfällt|abgelehnt)\\b`, 'i'),
    new RegExp(`(wird nicht|nicht erteilt|nicht vorgesehen|entfällt|abgelehnt)[^.]*${lowerKeyword}`, 'i'),
  ];

  for (const pattern of keywordNegationPatterns) {
    if (pattern.test(lowerBody)) {
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: 0,
        reason: `Betreff-Keyword im Body negiert`,
        isNeutralized: true,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 2: Check cancellation verbs in body that mention the keyword
  // -------------------------------------------------------------------------
  for (const verb of CANCELLATION_VERBS) {
    // Check if keyword and cancellation verb appear in the same sentence in body
    const sentences = splitIntoSentences(bodyText);
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (lowerSentence.includes(lowerKeyword) && verb.pattern.test(lowerSentence)) {
        return {
          keyword,
          category,
          originalWeight,
          effectiveWeight: 0,
          reason: `Betreff-Keyword im Body aufgehoben: "${verb.name}"`,
          isNeutralized: true,
          context: displayContext,
        };
      }
    }
  }

  // -------------------------------------------------------------------------
  // Rule 3: Check general negations in body (even without keyword mention)
  // Strong negations suggest the action is not being taken
  // -------------------------------------------------------------------------
  for (const negator of STRONG_NEGATORS) {
    if (negator.pattern.test(lowerBody)) {
      // Check if the negation relates to the keyword
      const sentences = splitIntoSentences(bodyText);
      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (negator.pattern.test(lowerSentence) && lowerSentence.includes(lowerKeyword)) {
          return {
            keyword,
            category,
            originalWeight,
            effectiveWeight: 0,
            reason: `Betreff-Keyword negiert: "${negator.name}"`,
            isNeutralized: true,
            context: displayContext,
          };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Rule 4: Check rejection patterns in body
  // -------------------------------------------------------------------------
  for (const pattern of REJECTION_PATTERNS) {
    if (pattern.pattern.test(lowerBody)) {
      const sentences = splitIntoSentences(bodyText);
      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (pattern.pattern.test(lowerSentence) && lowerSentence.includes(lowerKeyword)) {
          return {
            keyword,
            category,
            originalWeight,
            effectiveWeight: 0,
            reason: `Betreff-Keyword abgelehnt: "${pattern.name}"`,
            isNeutralized: true,
            context: displayContext,
          };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Rule 5: Check exclusion patterns (reduce to YELLOW level, ~60% reduction)
  // These indicate administrative/procedural context
  // -------------------------------------------------------------------------
  for (const exclusion of EXCLUSION_PATTERNS) {
    if (exclusion.pattern.test(bodyText)) {
      const reducedWeight = Math.round(originalWeight * (1 - exclusion.reduction));
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: reducedWeight,
        reason: `Betreff in Verwaltungskontext: "${exclusion.name}" (-${Math.round(exclusion.reduction * 100)}%)`,
        isNeutralized: false,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 6: Check informational markers in body
  // -------------------------------------------------------------------------
  for (const marker of INFORMATIONAL_MARKERS) {
    if (marker.pattern.test(lowerBody)) {
      const reducedWeight = Math.round(originalWeight * (1 - marker.reduction));
      return {
        keyword,
        category,
        originalWeight,
        effectiveWeight: reducedWeight,
        reason: `Betreff zur Information: "${marker.name}" (-${Math.round(marker.reduction * 100)}%)`,
        isNeutralized: false,
        context: displayContext,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Rule 7: No body context modifies the Betreff keyword - full weight
  // -------------------------------------------------------------------------
  return {
    keyword,
    category,
    originalWeight,
    effectiveWeight: originalWeight,
    reason: "Betreff: Keine neutralisierende Kontext im Body",
    isNeutralized: false,
    context: displayContext,
  };
}
