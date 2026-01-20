"use client";

/**
 * Hook for letter analysis and scoring.
 */

import { useState, useCallback } from "react";
import { AnalysisResult, ExtractedData, ScoringResult } from "@/types";
import { analyzeText } from "@/lib/scoring/engine";
import { extractData } from "@/lib/extraction/extractor";
import { normalizeText } from "@/lib/normalization/text";

interface UseScoringReturn {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  analyze: (rawText: string) => AnalysisResult;
  reset: () => void;
}

export function useScoring(): UseScoringReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback((rawText: string): AnalysisResult => {
    setIsAnalyzing(true);

    try {
      // Step 1: Normalize text
      const normalizedText = normalizeText(rawText);

      // Step 2: Extract data
      const extractedData: ExtractedData = extractData(normalizedText);

      // Step 3: Analyze and score
      const scoring: ScoringResult = analyzeText(normalizedText, extractedData);

      // Build result
      const analysisResult: AnalysisResult = {
        rawText,
        normalizedText,
        extractedData,
        scoring,
        processedAt: new Date(),
      };

      setResult(analysisResult);
      return analysisResult;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setIsAnalyzing(false);
  }, []);

  return { result, isAnalyzing, analyze, reset };
}
