/**
 * Regex patterns for extracting data from German official letters.
 */

/** German date formats: DD.MM.YYYY or DD.MM.YY */
export const DATE_PATTERN = /\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g;

/** German currency format: 1.234,56 € or 1234,56 EUR */
export const AMOUNT_PATTERN = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:€|EUR|Euro)/gi;

/** IBAN format */
export const IBAN_PATTERN = /\b([A-Z]{2}\d{2}(?:\s?\d{4}){4}\s?\d{2})\b/gi;

/** Reference numbers (Aktenzeichen, Az.) */
export const REFERENCE_PATTERN = /(?:Az\.?|Aktenzeichen|Geschäftszeichen|Vorgangsnummer|Rechnungs-?Nr\.?)[:.]?\s*([A-Z0-9\-\/]+)/gi;

/** Deadline expressions: "innerhalb von X Tagen" or "Frist von X Tagen" */
export const DEADLINE_DAYS_PATTERN = /(?:innerhalb\s+(?:von\s+)?|frist\s+(?:von\s+)?|binnen\s+)(\d+)\s*(?:tage[n]?|werktage[n]?)/gi;

/** Invoice number */
export const INVOICE_PATTERN = /(?:Rechnung|Rechnungs-?Nr\.?)[:.]?\s*(\d+)/gi;
