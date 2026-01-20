/**
 * Tesseract.js wrapper for German OCR.
 */

import Tesseract from "tesseract.js";

export interface OCRProgress {
  status: string;
  progress: number;
}

export type ProgressCallback = (progress: OCRProgress) => void;

/**
 * Perform OCR on an image file or blob.
 */
export async function recognizeImage(
  image: File | Blob | string,
  onProgress?: ProgressCallback
): Promise<string> {
  const result = await Tesseract.recognize(image, "deu", {
    logger: (m) => {
      if (onProgress && m.status) {
        onProgress({
          status: translateStatus(m.status),
          progress: m.progress || 0,
        });
      }
    },
  });

  return result.data.text;
}

/**
 * Translate Tesseract status messages to German.
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    "loading tesseract core": "Lade OCR-Engine...",
    "initializing tesseract": "Initialisiere...",
    "loading language traineddata": "Lade deutsche Sprachdaten...",
    "initializing api": "Bereite Analyse vor...",
    "recognizing text": "Erkenne Text...",
  };

  return translations[status] || status;
}

/**
 * Create a worker for batch processing.
 */
export async function createWorker(): Promise<Tesseract.Worker> {
  const worker = await Tesseract.createWorker("deu", 1, {
    logger: () => {},
  });

  return worker;
}

/**
 * Process multiple images with the same worker.
 */
export async function batchRecognize(
  images: (File | Blob)[],
  onProgress?: (index: number, total: number) => void
): Promise<string[]> {
  const worker = await createWorker();
  const results: string[] = [];

  try {
    for (let i = 0; i < images.length; i++) {
      const result = await worker.recognize(images[i]);
      results.push(result.data.text);

      if (onProgress) {
        onProgress(i + 1, images.length);
      }
    }
  } finally {
    await worker.terminate();
  }

  return results;
}
