"use client";

/**
 * Hook for OCR processing with progress tracking.
 */

import { useState, useCallback } from "react";
import { OCRState } from "@/types";
import { recognizeImage, OCRProgress } from "@/lib/ocr/tesseract";

interface UseOCRReturn {
  state: OCRState;
  processImage: (image: File | Blob) => Promise<string>;
  reset: () => void;
}

const initialState: OCRState = {
  isProcessing: false,
  progress: 0,
  status: "",
  error: null,
};

export function useOCR(): UseOCRReturn {
  const [state, setState] = useState<OCRState>(initialState);

  const processImage = useCallback(async (image: File | Blob): Promise<string> => {
    setState({
      isProcessing: true,
      progress: 0,
      status: "Starte OCR...",
      error: null,
    });

    try {
      const text = await recognizeImage(image, (progress: OCRProgress) => {
        setState((prev) => ({
          ...prev,
          progress: Math.round(progress.progress * 100),
          status: progress.status,
        }));
      });

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        status: "Abgeschlossen",
      }));

      return text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OCR fehlgeschlagen";
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

  return { state, processImage, reset };
}
