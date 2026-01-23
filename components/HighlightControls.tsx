"use client";

/**
 * Toggle controls for filtering highlights in the preview.
 */

import { useCallback } from "react";

interface HighlightControlsProps {
  showNeutralized: boolean;
  showGreen: boolean;
  onToggleNeutralized: (show: boolean) => void;
  onToggleGreen: (show: boolean) => void;
}

export function HighlightControls({
  showNeutralized,
  showGreen,
  onToggleNeutralized,
  onToggleGreen,
}: HighlightControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-bg-secondary rounded-lg border border-border-color">
      <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
        Anzeigen:
      </span>

      {/* Toggle neutralized keywords */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={showNeutralized}
            onChange={(e) => onToggleNeutralized(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-bg-primary border border-border-color rounded-full peer-checked:bg-gray-400 transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-text-secondary rounded-full transition-transform peer-checked:translate-x-4 peer-checked:bg-white" />
        </div>
        <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
          Neutralisierte
        </span>
      </label>

      {/* Toggle green (informational) keywords */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={showGreen}
            onChange={(e) => onToggleGreen(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-bg-primary border border-border-color rounded-full peer-checked:bg-green-500 transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-text-secondary rounded-full transition-transform peer-checked:translate-x-4 peer-checked:bg-white" />
        </div>
        <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
          Informationen
        </span>
      </label>
    </div>
  );
}
