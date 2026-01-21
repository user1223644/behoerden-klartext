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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <span className="px-5 py-2.5 bg-bg-secondary border border-border-color rounded-full text-sm font-bold text-text-primary shadow-sm tracking-wide">
          {scoring.categoryLabel}
        </span>
      </div>

      {/* Summary */}
      <div className="bg-bg-secondary rounded-2xl p-8 border border-border-color shadow-sm transition-all hover:border-primary-orange/30">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="text-primary-orange">✨</span> Zusammenfassung
        </h3>
        <p className="text-text-secondary leading-relaxed text-lg italic">{scoring.summary}</p>
      </div>

      {/* Extracted data */}
      <ExtractedDataDisplay data={extractedData} />

      {/* Recommendations */}
      {scoring.recommendations.length > 0 && (
        <div className="bg-bg-secondary rounded-2xl p-8 border border-border-color shadow-sm transition-all hover:border-primary-orange/30">
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-primary-orange">🎯</span> Empfohlene Maßnahmen
          </h3>
          <ul className="space-y-4">
            {scoring.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-4 items-start group">
                <span className="text-primary-orange mt-1 group-hover:translate-x-1 transition-transform">→</span>
                <span className="text-text-secondary leading-snug">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Matched keywords (collapsible) */}
      {scoring.matches.length > 0 && (
        <details className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden group shadow-sm">
          <summary className="p-5 cursor-pointer hover:bg-bg-primary/50 transition-colors flex items-center justify-between">
            <span className="font-bold text-text-primary flex items-center gap-2">
              <span className="text-primary-orange">🔎</span> Erkannte Schlüsselwörter ({scoring.matches.length})
            </span>
            <span className="text-text-secondary group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-5 pt-0 grid gap-3">
            {scoring.matches.map((match, i) => (
              <div
                key={i}
                className="p-4 bg-bg-primary rounded-xl border border-border-color group/match"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span key={i} className="px-3 py-1 bg-primary-orange/10 text-primary-orange text-sm rounded-full border border-border-color">{match.keyword}</span>
                  <span className="text-text-secondary/30">|</span>
                  <span className="text-xs text-text-secondary/50 font-medium">GEWICHT: {match.weight}</span>
                </div>
                <p className="text-text-secondary text-sm italic mt-1 font-serif">&quot;{match.context}&quot;</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Reset button */}
      <div className="flex flex-col items-center gap-6 pt-10">
        <button
          onClick={onReset}
          className="px-10 py-4 bg-gradient-to-r from-primary-orange to-primary-orange-light hover:from-primary-orange-light hover:to-primary-orange text-white rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-primary-orange/20 active:scale-95 flex items-center gap-3"
        >
          <span>↺</span> Neuen Brief analysieren
        </button>
        
        {/* Privacy note */}
        <p className="flex items-center gap-2 text-text-secondary/60 text-xs font-medium uppercase tracking-widest bg-bg-secondary px-4 py-2 rounded-full">
          <span className="text-primary-orange text-sm">🔒</span> 100% lokal & privat
        </p>
      </div>
    </div>
  );
}
