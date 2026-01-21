"use client";

/**
 * Hook for PDF text extraction with progress tracking.
 */

import { useState, useCallback } from "react";
import { PDFProgress } from "@/lib/pdf/extractor";

interface PDFState {
  isProcessing: boolean;
  progress: number;
  status: string;
  error: string | null;
}

interface UsePDFReturn {
  state: PDFState;
  extractText: (file: File | Blob) => Promise<string>;
  reset: () => void;
}

const initialState: PDFState = {
  isProcessing: false,
  progress: 0,
  status: "",
  error: null,
};

export function usePDF(): UsePDFReturn {
  const [state, setState] = useState<PDFState>(initialState);

  const extractText = useCallback(async (file: File | Blob): Promise<string> => {
    setState({
      isProcessing: true,
      progress: 0,
      status: "Starte PDF-Verarbeitung...",
      error: null,
    });

    try {
      // Step 1: Convert PDF to images
      // Dynamic import to avoid SSR issues
      const { convertPDFToImages } = await import("@/lib/pdf/extractor");
      
      const images = await convertPDFToImages(file, (progress: PDFProgress) => {
        setState((prev) => ({
          ...prev,
          progress: Math.round(progress.progress * 0.5), // First 50% is PDF conversion
          status: progress.status,
        }));
      });

      if (images.length === 0) {
        throw new Error("Keine Seiten im PDF gefunden");
      }

      setState((prev) => ({
        ...prev,
        progress: 50,
        status: "Starte Texterkennung (OCR)...",
      }));

      // Step 2: Run OCR on images
      const { batchRecognize } = await import("@/lib/ocr/tesseract");

      const textParts = await batchRecognize(images, (current, total) => {
        const ocrProgress = Math.round((current / total) * 100);
        const totalProgress = 50 + Math.round(ocrProgress * 0.5); // Second 50% is OCR
        
        setState((prev) => ({
          ...prev,
          progress: totalProgress,
          status: `Analysiere Seite ${current} von ${total}...`,
        }));
      });

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        status: "Abgeschlossen",
      }));

      return textParts.join("\n\n");
    } catch (error) {
      console.error("PDF Processing Error:", error);
      const errorMessage = error instanceof Error ? error.message : "PDF-Verarbeitung fehlgeschlagen";
      setState({
        isProcessing: false,
        progress: 0,
        status: "",
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { state, extractText, reset };
}
