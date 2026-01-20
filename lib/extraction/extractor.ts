/**
 * Data extraction from letter text.
 */

import { ExtractedData } from "@/types";
import {
  DATE_PATTERN,
  AMOUNT_PATTERN,
  IBAN_PATTERN,
  REFERENCE_PATTERN,
  DEADLINE_DAYS_PATTERN,
} from "./patterns";

/**
 * Parse German number format (1.234,56) to number.
 */
function parseGermanNumber(value: string): number {
  // Remove thousand separators (dots) and replace decimal comma with dot
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized);
}

/**
 * Extract all dates from text.
 */
function extractDates(text: string): string[] {
  const dates: string[] = [];
  const regex = new RegExp(DATE_PATTERN.source, "g");
  let match;

  while ((match = regex.exec(text)) !== null) {
    dates.push(match[0]);
  }

  return [...new Set(dates)]; // Remove duplicates
}

/**
 * Extract all currency amounts from text.
 */
function extractAmounts(text: string): { value: number; formatted: string }[] {
  const amounts: { value: number; formatted: string }[] = [];
  const regex = new RegExp(AMOUNT_PATTERN.source, "gi");
  let match;

  while ((match = regex.exec(text)) !== null) {
    const value = parseGermanNumber(match[1]);
    if (!isNaN(value)) {
      amounts.push({
        value,
        formatted: match[0].trim(),
      });
    }
  }

  return amounts;
}

/**
 * Extract all IBANs from text.
 */
function extractIBANs(text: string): string[] {
  const ibans: string[] = [];
  const regex = new RegExp(IBAN_PATTERN.source, "gi");
  let match;

  while ((match = regex.exec(text)) !== null) {
    ibans.push(match[1].replace(/\s/g, ""));
  }

  return [...new Set(ibans)];
}

/**
 * Extract reference numbers from text.
 */
function extractReferences(text: string): string[] {
  const references: string[] = [];
  const regex = new RegExp(REFERENCE_PATTERN.source, "gi");
  let match;

  while ((match = regex.exec(text)) !== null) {
    references.push(match[1]);
  }

  return [...new Set(references)];
}

/**
 * Extract deadline days from text.
 */
function extractDeadlineDays(text: string): number | undefined {
  const regex = new RegExp(DEADLINE_DAYS_PATTERN.source, "gi");
  const match = regex.exec(text);

  if (match) {
    return parseInt(match[1], 10);
  }

  return undefined;
}

/**
 * Extract all data from text.
 */
export function extractData(text: string): ExtractedData {
  return {
    dates: extractDates(text),
    amounts: extractAmounts(text),
    ibans: extractIBANs(text),
    references: extractReferences(text),
    deadlineDays: extractDeadlineDays(text),
  };
}
