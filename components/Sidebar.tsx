"use client";

/**
 * Sidebar component showing instructions and recent history.
 * Displays on the right side of the main page.
 */

import Link from "next/link";
import { useHistory } from "@/hooks/useHistory";
import { formatRelativeTime, getInputSourceLabel } from "@/lib/history";

export function Sidebar() {
  const { entries, isLoading } = useHistory();

  const urgencyColors = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
  };

  return (
    <aside className="w-72 flex-shrink-0 hidden lg:block">
      <div className="sticky top-8 space-y-6">
        {/* Instructions section */}
        <div className="bg-bg-secondary border border-border-color rounded-lg p-5">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Anleitung
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-primary-orange font-mono text-sm font-bold">01</span>
              <p className="text-sm text-text-primary">
                Dokument hochladen oder abfotografieren.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-primary-orange font-mono text-sm font-bold">02</span>
              <p className="text-sm text-text-primary">
                Der Text wird automatisch erkannt und regelbasiert analysiert.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-primary-orange font-mono text-sm font-bold">03</span>
              <p className="text-sm text-text-primary">
                Zusammenfassung und Fristen erhalten.
              </p>
            </div>
          </div>
        </div>

        {/* Recent history section */}
        <div className="bg-bg-secondary border border-border-color rounded-lg p-5">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Letzte Dateien
          </h3>

          {isLoading && (
            <p className="text-sm text-text-secondary">Laden...</p>
          )}

          {!isLoading && entries.length === 0 && (
            <p className="text-sm text-text-secondary">
              Keine Dokumente im Verlauf
            </p>
          )}

          {!isLoading && entries.length > 0 && (
            <>
              {/* Scrollable container - shows ~3 entries, scroll for more */}
              <div className="max-h-40 overflow-y-auto space-y-2 -mx-2 px-2">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href="/history"
                    className="block w-full text-left p-2 rounded hover:bg-bg-primary transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${urgencyColors[entry.urgency]}`} />
                      <span className="text-sm text-text-primary truncate flex-1">
                        {entry.preview.substring(0, 30)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-4">
                      <span className="text-xs text-text-secondary">
                        {getInputSourceLabel(entry.inputSource)}
                      </span>
                      <span className="text-xs text-text-secondary">•</span>
                      <span className="text-xs text-text-secondary">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Link to full history */}
              <Link
                href="/history"
                className="block text-xs text-primary-orange hover:text-primary-orange-dark transition-colors mt-3 pt-2 border-t border-border-color"
              >
                Alle Einträge anzeigen →
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
