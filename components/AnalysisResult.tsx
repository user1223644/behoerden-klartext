"use client";

/**
 * Main analysis result display component.
 */

import { AnalysisResult } from "@/types";
import { TrafficLight } from "./TrafficLight";
import { ExtractedDataDisplay } from "./ExtractedData";

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function AnalysisResultDisplay({
  result,
  onReset,
}: AnalysisResultDisplayProps) {
  const { scoring, extractedData } = result;

  return (
    <div className="space-y-8">
      {/* Traffic light section */}
      <div className="flex flex-col items-center py-8">
        <TrafficLight
          level={scoring.urgency}
          score={scoring.score}
          showDescription
          size="lg"
        />
      </div>

      {/* Category badge */}
      <div className="flex justify-center">
        <span className="px-4 py-2 bg-gray-700 rounded-full text-sm font-medium">
          {scoring.categoryLabel}
        </span>
      </div>

      {/* Summary */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Zusammenfassung</h3>
        <p className="text-gray-300 leading-relaxed">{scoring.summary}</p>
      </div>

      {/* Extracted data */}
      <ExtractedDataDisplay data={extractedData} />

      {/* Recommendations */}
      {scoring.recommendations.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Empfohlene Maßnahmen
          </h3>
          <ul className="space-y-3">
            {scoring.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-blue-400 mt-0.5">→</span>
                <span className="text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Matched keywords (collapsible) */}
      {scoring.matches.length > 0 && (
        <details className="bg-gray-800/50 rounded-xl overflow-hidden">
          <summary className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors">
            <span className="font-medium text-white">
              Erkannte Schlüsselwörter ({scoring.matches.length})
            </span>
          </summary>
          <div className="p-4 pt-0 space-y-2">
            {scoring.matches.map((match, i) => (
              <div
                key={i}
                className="p-3 bg-gray-900/50 rounded-lg text-sm"
              >
                <span className="font-mono text-blue-400">{match.keyword}</span>
                <span className="text-gray-500 mx-2">→</span>
                <span className="text-gray-400 text-xs">{match.context}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Reset button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
        >
          Neuen Brief analysieren
        </button>
      </div>

      {/* Privacy note */}
      <p className="text-center text-xs text-gray-500">
        🔒 Alle Daten werden nur lokal in Ihrem Browser verarbeitet.
      </p>
    </div>
  );
}
