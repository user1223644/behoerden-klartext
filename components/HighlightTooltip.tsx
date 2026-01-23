"use client";

/**
 * Tooltip component for displaying keyword match details.
 * Shows on hover/click over highlighted keywords.
 */

import { useEffect, useRef, useState } from "react";
import { HighlightSpan } from "@/lib/scoring/highlighter";
import { CATEGORY_LABELS } from "@/lib/scoring/keywords";

interface HighlightTooltipProps {
  span: HighlightSpan;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

export function HighlightTooltip({ span, anchorRect, onClose }: HighlightTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();

    // Position above the anchor element
    let top = anchorRect.top - tooltipRect.height - 8;
    let left = anchorRect.left + (anchorRect.width / 2) - (tooltipRect.width / 2);

    // Keep within viewport
    if (top < 8) {
      top = anchorRect.bottom + 8; // Show below if not enough space above
    }
    if (left < 8) {
      left = 8;
    }
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-bg-secondary border border-border-color rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header with urgency indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-3 h-3 rounded-full ${
            span.isNeutralized ? "bg-gray-400" : urgencyColors[span.urgency]
          }`}
        />
        <span className="font-semibold text-text-primary">
          {span.isNeutralized ? "Neutralisiert" : urgencyLabels[span.urgency]}
        </span>
      </div>

      {/* Keyword */}
      <div className="mb-3">
        <span className="text-xs text-text-secondary uppercase tracking-wider">Schlüsselwort</span>
        <p className="font-mono text-sm text-text-primary mt-1">"{span.keyword}"</p>
      </div>

      {/* Category */}
      <div className="mb-3">
        <span className="text-xs text-text-secondary uppercase tracking-wider">Kategorie</span>
        <p className="text-sm text-text-primary mt-1">{CATEGORY_LABELS[span.category]}</p>
      </div>

      {/* Weight info */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <span className="text-xs text-text-secondary uppercase tracking-wider">Gewichtung</span>
          <p className="text-sm text-text-primary mt-1">{span.originalWeight}</p>
        </div>
        <div>
          <span className="text-xs text-text-secondary uppercase tracking-wider">Effektiv</span>
          <p className={`text-sm mt-1 ${span.isNeutralized ? "text-gray-400 line-through" : "text-text-primary"}`}>
            {span.effectiveWeight}
          </p>
        </div>
      </div>

      {/* Reason */}
      <div className="pt-3 border-t border-border-color">
        <span className="text-xs text-text-secondary uppercase tracking-wider">Begründung</span>
        <p className="text-sm text-text-primary mt-1">{span.reason}</p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Schließen"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
