import { normalizeText } from "./normalization/text";

export interface ValidationResult {
  isValidLetter: boolean;
  text: string;
  message?: string;
}

/**
 * Validates the extracted text to ensure it's suitable for analysis.
 * 
 * @param text The raw extracted text
 * @returns Object containing validity status, cleaned text, and optional error message
 */
export function validateLetter(text: string): ValidationResult {
  // Use existing normalization to clean the text first
  const cleanedText = normalizeText(text);

  // Check minimum length requirements
  if (cleanedText.length < 20) {
    return {
      isValidLetter: false,
      text: cleanedText,
      message: "Dokument zu kurz für automatische Analyse."
    };
  }

  return {
    isValidLetter: true,
    text: cleanedText
  };
}
