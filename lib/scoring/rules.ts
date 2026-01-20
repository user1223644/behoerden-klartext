/**
 * Scoring rules and recommendation templates.
 */

import { LetterCategory, UrgencyLevel } from "@/types";

/** Threshold values for urgency classification */
export const URGENCY_THRESHOLDS = {
  red: 80,    // Score >= 80 = Red
  yellow: 40, // Score >= 40 = Yellow
  green: 0,   // Score < 40 = Green
};

/** Recommendations per category */
export const CATEGORY_RECOMMENDATIONS: Record<LetterCategory, string[]> = {
  enforcement: [
    "Suchen Sie sofort rechtliche Beratung (z.B. Schuldnerberatung, Rechtsanwalt).",
    "Prüfen Sie die genannte Forderung auf Richtigkeit.",
    "Zahlen Sie keine Barzahlungen an Unbekannte.",
    "Bewahren Sie alle Unterlagen sorgfältig auf.",
    "Reagieren Sie innerhalb der angegebenen Frist.",
  ],
  final_notice: [
    "Begleichen Sie die Forderung vor Ablauf der Frist.",
    "Kontaktieren Sie den Absender für eine Ratenzahlung, falls nötig.",
    "Prüfen Sie, ob die Forderung berechtigt ist.",
    "Ignorieren Sie das Schreiben nicht - es drohen weitere Kosten.",
  ],
  payment_reminder: [
    "Überprüfen Sie die genannte Rechnung in Ihren Unterlagen.",
    "Begleichen Sie den offenen Betrag zeitnah.",
    "Bei Unklarheiten: Kontaktieren Sie den Absender.",
    "Bewahren Sie den Zahlungsnachweis auf.",
  ],
  informational: [
    "Keine sofortigen Maßnahmen erforderlich.",
    "Lesen Sie das Schreiben zur Information.",
    "Heften Sie das Dokument zu Ihren Unterlagen.",
  ],
  unknown: [
    "Lesen Sie das Schreiben sorgfältig durch.",
    "Bei Unklarheiten: Kontaktieren Sie den Absender.",
    "Prüfen Sie, ob eine Reaktion erforderlich ist.",
  ],
};

/** Summary templates per urgency level */
export const SUMMARY_TEMPLATES: Record<UrgencyLevel, (category: string) => string> = {
  red: (category) =>
    `Dies ist ein ${category} mit höchster Dringlichkeit. Es drohen unmittelbare rechtliche Konsequenzen wie Pfändung oder Zwangsvollstreckung.`,
  yellow: (category) =>
    `Dies ist ein ${category}. Sie sollten innerhalb der angegebenen Frist reagieren, um weitere Kosten oder rechtliche Schritte zu vermeiden.`,
  green: (category) =>
    `Dies ist ein ${category}. Es handelt sich um eine Information - keine dringende Reaktion erforderlich.`,
};

/**
 * Determine urgency level from score.
 */
export function getUrgencyFromScore(score: number): UrgencyLevel {
  if (score >= URGENCY_THRESHOLDS.red) return "red";
  if (score >= URGENCY_THRESHOLDS.yellow) return "yellow";
  return "green";
}

/**
 * Calculate deadline priority multiplier based on days remaining.
 */
export function getDeadlineMultiplier(days: number | undefined): number {
  if (days === undefined) return 1;
  if (days <= 3) return 1.5;  // Very urgent
  if (days <= 7) return 1.25; // Urgent
  if (days <= 14) return 1.1; // Soon
  return 1;
}
