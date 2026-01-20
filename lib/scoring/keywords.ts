/**
 * German keyword dictionaries for letter classification.
 * Keywords are grouped by urgency level with associated weights.
 */

import { LetterCategory, UrgencyLevel } from "@/types";

export interface KeywordDefinition {
  keyword: string;
  category: LetterCategory;
  urgency: UrgencyLevel;
  weight: number;
}

/**
 * Critical keywords indicating legal enforcement (🔴 Red)
 */
export const RED_KEYWORDS: KeywordDefinition[] = [
  { keyword: "zwangsvollstreckung", category: "enforcement", urgency: "red", weight: 100 },
  { keyword: "vollstreckung", category: "enforcement", urgency: "red", weight: 90 },
  { keyword: "erzwingungshaft", category: "enforcement", urgency: "red", weight: 100 },
  { keyword: "haftbefehl", category: "enforcement", urgency: "red", weight: 100 },
  { keyword: "pfändung", category: "enforcement", urgency: "red", weight: 90 },
  { keyword: "gerichtsvollzieher", category: "enforcement", urgency: "red", weight: 85 },
  { keyword: "vollstreckungsbehörde", category: "enforcement", urgency: "red", weight: 95 },
  { keyword: "zwangsmaßnahme", category: "enforcement", urgency: "red", weight: 90 },
  { keyword: "kontopfändung", category: "enforcement", urgency: "red", weight: 90 },
  { keyword: "lohnpfändung", category: "enforcement", urgency: "red", weight: 90 },
  { keyword: "räumungsklage", category: "enforcement", urgency: "red", weight: 95 },
  { keyword: "zwangsräumung", category: "enforcement", urgency: "red", weight: 100 },
];

/**
 * Urgent keywords indicating action required (🟡 Yellow)
 */
export const YELLOW_KEYWORDS: KeywordDefinition[] = [
  { keyword: "letzte mahnung", category: "final_notice", urgency: "yellow", weight: 80 },
  { keyword: "letzte zahlungsaufforderung", category: "final_notice", urgency: "yellow", weight: 80 },
  { keyword: "zahlungserinnerung", category: "payment_reminder", urgency: "yellow", weight: 60 },
  { keyword: "mahnung", category: "payment_reminder", urgency: "yellow", weight: 65 },
  { keyword: "mahngebühren", category: "payment_reminder", urgency: "yellow", weight: 55 },
  { keyword: "verzugszinsen", category: "payment_reminder", urgency: "yellow", weight: 55 },
  { keyword: "inkasso", category: "final_notice", urgency: "yellow", weight: 75 },
  { keyword: "rechtliche schritte", category: "final_notice", urgency: "yellow", weight: 70 },
  { keyword: "gerichtliche schritte", category: "final_notice", urgency: "yellow", weight: 75 },
  { keyword: "frist", category: "payment_reminder", urgency: "yellow", weight: 50 },
  { keyword: "fristablauf", category: "payment_reminder", urgency: "yellow", weight: 60 },
  { keyword: "säumniszuschlag", category: "payment_reminder", urgency: "yellow", weight: 55 },
  { keyword: "zahlungspflichtig", category: "payment_reminder", urgency: "yellow", weight: 50 },
  { keyword: "offene forderung", category: "payment_reminder", urgency: "yellow", weight: 55 },
  { keyword: "ausstehende zahlung", category: "payment_reminder", urgency: "yellow", weight: 55 },
  { keyword: "bitte überweisen", category: "payment_reminder", urgency: "yellow", weight: 40 },
  { keyword: "bitte begleichen", category: "payment_reminder", urgency: "yellow", weight: 45 },
];

/**
 * Informational keywords indicating no immediate action (🟢 Green)
 */
export const GREEN_KEYWORDS: KeywordDefinition[] = [
  { keyword: "informieren", category: "informational", urgency: "green", weight: 30 },
  { keyword: "zur information", category: "informational", urgency: "green", weight: 35 },
  { keyword: "zu ihrer information", category: "informational", urgency: "green", weight: 35 },
  { keyword: "erfolgreich", category: "informational", urgency: "green", weight: 40 },
  { keyword: "bestätigung", category: "informational", urgency: "green", weight: 35 },
  { keyword: "bestätigt", category: "informational", urgency: "green", weight: 35 },
  { keyword: "keine weiteren schritte", category: "informational", urgency: "green", weight: 50 },
  { keyword: "kein handlungsbedarf", category: "informational", urgency: "green", weight: 50 },
  { keyword: "abgeschlossen", category: "informational", urgency: "green", weight: 35 },
  { keyword: "erledigt", category: "informational", urgency: "green", weight: 40 },
  { keyword: "eingetragen", category: "informational", urgency: "green", weight: 30 },
  { keyword: "aktualisiert", category: "informational", urgency: "green", weight: 30 },
];

/** All keywords combined for iteration */
export const ALL_KEYWORDS: KeywordDefinition[] = [
  ...RED_KEYWORDS,
  ...YELLOW_KEYWORDS,
  ...GREEN_KEYWORDS,
];

/** Category labels in German */
export const CATEGORY_LABELS: Record<LetterCategory, string> = {
  enforcement: "Vollstreckungsbescheid",
  final_notice: "Letzte Mahnung",
  payment_reminder: "Zahlungserinnerung",
  informational: "Informationsschreiben",
  unknown: "Unbekannt",
};

/** Descriptions for each urgency level */
export const URGENCY_DESCRIPTIONS: Record<UrgencyLevel, string> = {
  red: "Dringend! Sofortiges Handeln erforderlich.",
  yellow: "Achtung! Handlungsbedarf innerhalb der angegebenen Frist.",
  green: "Zur Kenntnisnahme. Kein sofortiger Handlungsbedarf.",
};
