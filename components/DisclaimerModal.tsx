"use client";

/**
 * Legal disclaimer modal shown on first visit.
 * Sets correct expectations about the tool's limitations.
 */

import { useState, useEffect } from "react";

const DISCLAIMER_KEY = "behoerden-klartext-disclaimer-accepted";

interface DisclaimerModalProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-primary border border-border-color rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-primary">
            Wichtiger Hinweis
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-text-secondary text-sm leading-relaxed">
          <p>
            <strong className="text-text-primary">Behörden-Klartext</strong> ist ein 
            technisches Hilfsmittel zur Analyse amtlicher Schreiben. Die Ergebnisse 
            basieren auf automatisierten Regeln und dienen ausschließlich der 
            Orientierung.
          </p>

          <div className="bg-bg-secondary rounded-lg p-4 border border-border-color">
            <p className="font-medium text-text-primary mb-2">
              Dies ist keine Rechtsberatung.
            </p>
            <p>
              Die angezeigten Einschätzungen zur Dringlichkeit sind technische 
              Bewertungen, keine rechtlichen Urteile. Bei wichtigen Entscheidungen 
              wenden Sie sich bitte an einen Rechtsanwalt, eine Beratungsstelle 
              oder die zuständige Behörde.
            </p>
          </div>

          <p>
            <strong className="text-text-primary">Bitte beachten Sie:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Fristen und Beträge immer im Originaldokument prüfen</li>
            <li>Bei gescannten Dokumenten können OCR-Fehler auftreten</li>
            <li>Automatische Analyse ersetzt keine fachliche Prüfung</li>
          </ul>

          <p className="text-text-secondary/80 text-xs pt-2">
            Mit der Nutzung bestätigen Sie, dass Sie diese Hinweise verstanden haben.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-color">
          <button
            onClick={onAccept}
            className="w-full py-3 bg-primary-orange hover:bg-primary-orange-dark rounded-lg font-medium text-white transition-all"
          >
            Verstanden, weiter zur Anwendung
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage disclaimer acceptance state.
 * Uses localStorage to remember if user has accepted.
 */
export function useDisclaimer() {
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage on mount
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    setHasAccepted(accepted === "true");
  }, []);

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setHasAccepted(true);
  };

  return {
    hasAccepted,
    acceptDisclaimer,
    isLoading: hasAccepted === null,
  };
}

/**
 * Short version for mobile or condensed displays.
 */
export const DISCLAIMER_SHORT = `
Behörden-Klartext ist ein technisches Hilfsmittel – keine Rechtsberatung. 
Ergebnisse basieren auf automatisierten Regeln. Fristen und Beträge immer 
im Original prüfen. Bei Fragen einen Rechtsanwalt oder Beratungsstelle kontaktieren.
`.trim();

/**
 * Checkbox sentence for forms.
 */
export const DISCLAIMER_CHECKBOX = 
  "Ich habe verstanden, dass dieses Tool keine Rechtsberatung darstellt und " +
  "die Ergebnisse nur zur Orientierung dienen.";
