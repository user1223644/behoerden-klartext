/**
 * PDF text extraction using pdf.js.
 * All processing happens client-side for privacy.
 */

export interface PDFProgress {
  status: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
}

export type PDFProgressCallback = (progress: PDFProgress) => void;

/**
 * Check if a file is a PDF.
 */
export function isPDF(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

/**
 * Convert PDF pages to images for OCR.
 * Uses dynamic import to avoid SSR issues.
 */
export async function convertPDFToImages(
  file: File | Blob,
  onProgress?: PDFProgressCallback
): Promise<Blob[]> {
  // Ensure we're in browser environment
  if (typeof window === "undefined") {
    throw new Error("PDF processing only works in browser environment");
  }

  onProgress?.({
    status: "Lade PDF-Bibliothek...",
    progress: 0,
  });

  try {
    // Import pdf.js v4
    const pdfjsLib = await import("pdfjs-dist");
    
    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

    onProgress?.({
      status: "Lade PDF...",
      progress: 5,
    });

    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const images: Blob[] = [];

    onProgress?.({
      status: `Verarbeite ${totalPages} Seiten...`,
      progress: 10,
      totalPages,
    });

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Render to canvas
      const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for better OCR quality
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      
      if (!context) {
        throw new Error("Canvas context creation failed");
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      } as any).promise;

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );

      if (blob) {
        images.push(blob);
      }

      const progress = 10 + Math.round((pageNum / totalPages) * 40); // PDF conversion is 10-50% of total process
      onProgress?.({
        status: `Konvertiere Seite ${pageNum} von ${totalPages}...`,
        progress,
        currentPage: pageNum,
        totalPages,
      });
    }

    return images;

  } catch (error) {
    console.error("PDF Conversion Error:", error);
    throw new Error("Fehler bei der PDF-Umwandlung: " + (error instanceof Error ? error.message : String(error)));
  }
}
