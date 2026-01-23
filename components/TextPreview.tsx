"use client";

/**
 * Text preview component with keyword highlighting.
 * Works for plain text input, OCR'd content, and extracted PDF text.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { getHighlightSpans, HighlightSpan, HighlightResult } from "@/lib/scoring/highlighter";
import { HighlightTooltip } from "./HighlightTooltip";

interface TextPreviewProps {
  text: string;
  showNeutralized?: boolean;
  showGreen?: boolean;
  onAnalyze?: () => void;
}

export function TextPreview({
  text,
  showNeutralized = true,
  showGreen = true,
  onAnalyze,
}: TextPreviewProps) {
  const [selectedSpan, setSelectedSpan] = useState<HighlightSpan | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get highlight spans from the highlighting engine
  const highlightResult = useMemo<HighlightResult>(() => {
    return getHighlightSpans(text);
  }, [text]);

  // Filter spans based on visibility settings
  const visibleSpans = useMemo(() => {
    return highlightResult.spans.filter((span) => {
      if (!showNeutralized && span.isNeutralized) return false;
      if (!showGreen && span.urgency === "green" && !span.isNeutralized) return false;
      return true;
    });
  }, [highlightResult.spans, showNeutralized, showGreen]);

  // Handle click on highlighted span
  const handleSpanClick = useCallback(
    (span: HighlightSpan, event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setAnchorRect(rect);
      setSelectedSpan(span);
    },
    []
  );

  // Close tooltip
  const handleCloseTooltip = useCallback(() => {
    setSelectedSpan(null);
    setAnchorRect(null);
  }, []);

  // Build the highlighted text content
  const renderedContent = useMemo(() => {
    if (visibleSpans.length === 0) {
      return <span>{text}</span>;
    }

    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    // Sort spans by start position
    const sortedSpans = [...visibleSpans].sort((a, b) => a.start - b.start);

    sortedSpans.forEach((span, index) => {
      // Add text before this span
      if (span.start > lastEnd) {
        elements.push(
          <span key={`text-${index}`}>{text.substring(lastEnd, span.start)}</span>
        );
      }

      // Get highlight class based on urgency and neutralization
      const highlightClass = span.isNeutralized
        ? "highlight-neutralized"
        : `highlight-${span.urgency}`;

      // Add the highlighted span
      elements.push(
        <span
          key={`highlight-${index}`}
          className={`${highlightClass} cursor-pointer transition-all hover:ring-2 hover:ring-primary-orange/50 rounded-sm`}
          onClick={(e) => handleSpanClick(span, e)}
          title={`${span.keyword}: ${span.reason}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setAnchorRect(rect);
              setSelectedSpan(span);
            }
          }}
        >
          {text.substring(span.start, span.end)}
        </span>
      );

      lastEnd = span.end;
    });

    // Add remaining text after last span
    if (lastEnd < text.length) {
      elements.push(<span key="text-end">{text.substring(lastEnd)}</span>);
    }

    return elements;
  }, [text, visibleSpans, handleSpanClick]);

  return (
    <div className="relative">
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-bg-primary rounded-lg border border-border-color">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-text-secondary">
            {highlightResult.activeCount.red} kritisch
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm text-text-secondary">
            {highlightResult.activeCount.yellow} Achtung
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-text-secondary">
            {highlightResult.activeCount.green} Info
          </span>
        </div>
        {highlightResult.neutralizedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-text-secondary">
              {highlightResult.neutralizedCount} neutralisiert
            </span>
          </div>
        )}
      </div>

      {/* Text content with highlights */}
      <div
        ref={containerRef}
        className="bg-bg-primary border border-border-color rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto"
      >
        {renderedContent}
      </div>

      {/* Analyze button */}
      {onAnalyze && (
        <div className="mt-4">
          <button
            onClick={onAnalyze}
            className="w-full py-3 bg-primary-orange hover:bg-primary-orange-dark rounded-lg font-medium text-white transition-all"
          >
            Analyse anzeigen
          </button>
        </div>
      )}

      {/* Tooltip */}
      {selectedSpan && anchorRect && (
        <HighlightTooltip
          span={selectedSpan}
          anchorRect={anchorRect}
          onClose={handleCloseTooltip}
        />
      )}
    </div>
  );
}
