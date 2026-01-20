/**
 * Text normalization for OCR error correction.
 */

/**
 * Common OCR errors in German text.
 */
const OCR_CORRECTIONS: [RegExp, string][] = [
  // Common letter confusions
  [/l{2,}/g, "ll"],           // Multiple 'l' merged
  [/([a-z])0([a-z])/gi, "$1o$2"], // Zero as 'o'
  [/([a-z])1([a-z])/gi, "$1l$2"], // One as 'l'
  [/([a-z])5([a-z])/gi, "$1s$2"], // Five as 's'
  [/rn/g, "m"],               // 'rn' often misread as 'm'

  // German-specific
  [/ä/g, "ä"],                // Ensure proper umlaut
  [/ö/g, "ö"],
  [/ü/g, "ü"],
  [/ß/g, "ß"],

  // Common word fixes
  [/\bMahn\s*ung\b/gi, "Mahnung"],
  [/\bZah\s*lung\b/gi, "Zahlung"],
  [/\bFor\s*de\s*rung\b/gi, "Forderung"],
  [/\bVoll\s*stre\s*ckung\b/gi, "Vollstreckung"],

  // Fix broken words (space in middle)
  [/Zahl ungs/gi, "Zahlungs"],
  [/Mahn gebühren/gi, "Mahngebühren"],
  [/Voll streck/gi, "Vollstreck"],
];

/**
 * Fix broken currency amounts.
 */
function fixCurrencyAmounts(text: string): string {
  // Fix "1 .200,00" -> "1.200,00"
  return text.replace(/(\d)\s+\.(\d)/g, "$1.$2")
    // Fix "1. 200,00" -> "1.200,00"
    .replace(/(\d)\.\s+(\d)/g, "$1.$2")
    // Fix "1.200 ,00" -> "1.200,00"
    .replace(/(\d)\s+,(\d)/g, "$1,$2");
}

/**
 * Remove excessive whitespace while preserving structure.
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\t/g, " ")           // Replace tabs
    .replace(/  +/g, " ")          // Multiple spaces to single
    .replace(/\n{3,}/g, "\n\n")    // Max 2 newlines
    .trim();
}

/**
 * Apply OCR corrections to text.
 */
function applyCorrections(text: string): string {
  let result = text;

  for (const [pattern, replacement] of OCR_CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Normalize OCR text for better analysis.
 */
export function normalizeText(rawText: string): string {
  let text = rawText;

  // Apply corrections
  text = applyCorrections(text);

  // Fix currency formatting
  text = fixCurrencyAmounts(text);

  // Clean whitespace
  text = normalizeWhitespace(text);

  return text;
}

/**
 * Quick clean for display purposes only.
 */
export function cleanForDisplay(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 500);
}
