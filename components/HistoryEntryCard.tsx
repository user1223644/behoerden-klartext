"use client";

/**
 * History entry component with expand/collapse functionality.
 * Shows summary in collapsed state, detailed breakdown when expanded.
 */

import { useState } from "react";
import { HistoryEntry } from "@/types";
import { formatRelativeTime, getInputSourceLabel } from "@/lib/history";
import { CATEGORY_LABELS } from "@/lib/scoring/keywords";

interface HistoryEntryCardProps {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
}

export function HistoryEntryCard({ entry, onDelete }: HistoryEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const urgencyColors = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
  };

  const urgencyLabels = {
    red: "Kritisch",
    yellow: "Achtung",
    green: "Information",
  };

  const sourceIcons = {
    pdf: "📄",
    camera: "📷",
    text: "📝",
  };

  return (
    <div className="bg-bg-secondary border border-border-color rounded-lg overflow-hidden transition-all">
      {/* Collapsed header (always visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-bg-primary/50 transition-colors"
      >
        {/* Urgency indicator */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${urgencyColors[entry.urgency]}`} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Category and source */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary">
              {entry.categoryLabel || CATEGORY_LABELS[entry.category]}
            </span>
            <span className="text-xs text-text-secondary">
              {sourceIcons[entry.inputSource]} {getInputSourceLabel(entry.inputSource)}
            </span>
          </div>

          {/* Preview text */}
          <p className="text-sm text-text-secondary truncate">
            {entry.preview}
          </p>
        </div>

        {/* Timestamp and expand icon */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <span className="text-xs text-text-secondary whitespace-nowrap">
            {formatRelativeTime(entry.timestamp)}
          </span>
          <svg
            className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border-color p-4 space-y-4">
          {/* Score and urgency */}
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${urgencyColors[entry.urgency]}`}>
              {urgencyLabels[entry.urgency]}
            </div>
            <span className="text-sm text-text-secondary">
              Score: <span className="font-mono text-text-primary">{entry.score}</span>
            </span>
          </div>

          {/* Summary */}
          <div>
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Zusammenfassung
            </h4>
            <p className="text-sm text-text-primary">{entry.summary}</p>
          </div>

          {/* Matched keywords */}
          {entry.matches.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Erkannte Schlüsselwörter ({entry.matches.length})
              </h4>
              <div className="space-y-2">
                {entry.matches.map((match, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      match.isNeutralized
                        ? "bg-gray-500/10 text-text-secondary"
                        : "bg-bg-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={match.isNeutralized ? "line-through" : "font-medium text-text-primary"}>
                        "{match.keyword}"
                      </span>
                      {match.isNeutralized && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-500/20 rounded">
                          Neutralisiert
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span>Gewicht: {match.weight}</span>
                      <span title={match.reason}>
                        {match.reason.length > 25 ? match.reason.substring(0, 25) + "…" : match.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {entry.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Empfehlungen
              </h4>
              <ul className="list-disc list-inside text-sm text-text-primary space-y-1">
                {entry.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Delete button */}
          <div className="pt-2 border-t border-border-color">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="text-xs text-red-500 hover:text-red-400 transition-colors"
            >
              Eintrag löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
