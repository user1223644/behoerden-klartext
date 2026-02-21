"use client";

/**
 * History page - /history
 * Shows chronological list of past analyses with expandable details.
 */

import Link from "next/link";
import { useHistory } from "@/hooks/useHistory";
import { HistoryEntryCard } from "@/components/HistoryEntryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClipboardList } from "@/components/icons";

export default function HistoryPage() {
  const { entries, isLoading, deleteEntry, clearAll } = useHistory();

  return (
    <div className="bg-bg-primary text-text-primary transition-colors duration-300 min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border-color bg-bg-primary">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 font-medium hover:opacity-80 transition-opacity">
              <span className="text-primary-orange">~/</span>
              <span className="text-text-primary font-semibold">behörden-klartext</span>
            </Link>
            
            {/* Right nav items */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-text-secondary hover:text-primary-orange transition-colors"
              >
                Neue Analyse
              </Link>
              <ThemeToggle inline />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Verlauf</h1>
          <p className="text-text-secondary text-sm">
            Ihre bisherigen Analysen – lokal gespeichert, nur für Sie sichtbar.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12 text-text-secondary">
            Laden...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && (
          <div className="text-center py-12 bg-bg-secondary rounded-lg border border-border-color">
            <div className="mb-4 flex justify-center">
              <ClipboardList className="w-10 h-10 text-primary-orange" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-medium text-text-primary mb-2">
              Noch keine Analysen
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Analysierte Briefe werden hier automatisch gespeichert.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-primary-orange hover:bg-primary-orange-dark text-white rounded-lg font-medium transition-colors"
            >
              Erste Analyse starten
            </Link>
          </div>
        )}

        {/* History list */}
        {!isLoading && entries.length > 0 && (
          <>
            {/* Actions bar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-text-secondary">
                {entries.length} {entries.length === 1 ? "Eintrag" : "Einträge"}
              </span>
              <button
                onClick={() => {
                  if (confirm("Möchten Sie wirklich den gesamten Verlauf löschen?")) {
                    clearAll();
                  }
                }}
                className="text-sm text-red-500 hover:text-red-400 transition-colors"
              >
                Verlauf löschen
              </button>
            </div>

            {/* Entries */}
            <div className="space-y-3">
              {entries.map((entry) => (
                <HistoryEntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={deleteEntry}
                />
              ))}
            </div>

            {/* Privacy note */}
            <p className="mt-8 text-xs text-text-secondary text-center">
              Alle Daten werden ausschließlich lokal in Ihrem Browser gespeichert.
              <br />
              Es werden keine vollständigen Brieftexte archiviert.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
