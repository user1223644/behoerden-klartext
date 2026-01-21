"use client";

/**
 * Main application page for Behörden-Klartext.
 */

import { useState, useCallback } from "react";
import { useOCR } from "@/hooks/useOCR";
import { usePDF } from "@/hooks/usePDF";
import { useScoring } from "@/hooks/useScoring";
import { FileUpload } from "@/components/FileUpload";
import { CameraCapture } from "@/components/CameraCapture";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AnalysisResultDisplay } from "@/components/AnalysisResult";
import { AnalysisResult } from "@/types";
import { isPDF } from "@/lib/pdf/extractor";

type InputMode = "upload" | "camera" | "text";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [textInput, setTextInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { state: ocrState, processImage, reset: resetOCR } = useOCR();
  const { state: pdfState, extractText: extractPDFText, reset: resetPDF } = usePDF();
  const { analyze, reset: resetScoring } = useScoring();

  // Determine if we're processing (OCR or PDF)
  const isProcessing = ocrState.isProcessing || pdfState.isProcessing;
  const processingProgress = ocrState.isProcessing ? ocrState.progress : pdfState.progress;
  const processingStatus = ocrState.isProcessing ? ocrState.status : pdfState.status;
  const processingError = ocrState.error || pdfState.error;

  const handleFileAnalysis = useCallback(
    async (file: File | Blob) => {
      try {
        let text: string;

        // Check if it's a PDF (only Files can be PDFs, not Blobs from camera)
        const isFilePDF = file instanceof File && isPDF(file);

        if (isFilePDF) {
          // Use PDF extractor for PDFs
          text = await extractPDFText(file);
        } else {
          // Use OCR for images (including camera captures)
          text = await processImage(file);
        }

        const result = analyze(text);
        setAnalysisResult(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    },
    [extractPDFText, processImage, analyze]
  );

  const handleTextAnalysis = useCallback(() => {
    if (!textInput.trim()) return;
    const result = analyze(textInput);
    setAnalysisResult(result);
  }, [textInput, analyze]);

  const handleReset = useCallback(() => {
    setAnalysisResult(null);
    setTextInput("");
    resetOCR();
    resetPDF();
    resetScoring();
  }, [resetOCR, resetPDF, resetScoring]);

  // Show results if analysis is complete
  if (analysisResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Header />
        <AnalysisResultDisplay result={analysisResult} onReset={handleReset} />
      </div>
    );
  }

  // Show loading during OCR or PDF processing
  if (isProcessing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Header />
        <div className="mt-12">
          <LoadingSpinner progress={processingProgress} status={processingStatus} />
        </div>
      </div>
    );
  }

  // Main input UI
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl bg-bg-primary text-text-primary transition-colors duration-300">
      <Header />

      {/* Input mode tabs */}
      <div className="flex gap-2 mb-6 bg-bg-secondary border border-border-color rounded-xl p-1">
        <TabButton
          active={inputMode === "upload"}
          onClick={() => setInputMode("upload")}
          icon="📄"
          label="Datei hochladen"
        />
        <TabButton
          active={inputMode === "camera"}
          onClick={() => setInputMode("camera")}
          icon="📷"
          label="Foto aufnehmen"
        />
        <TabButton
          active={inputMode === "text"}
          onClick={() => setInputMode("text")}
          icon="✏️"
          label="Text eingeben"
        />
      </div>

      {/* Input area */}
      <div className="bg-bg-secondary rounded-2xl p-6 border border-border-color shadow-sm">
        {inputMode === "upload" && (
          <FileUpload onFileSelect={handleFileAnalysis} />
        )}

        {inputMode === "camera" && (
          <CameraCapture onCapture={handleFileAnalysis} />
        )}

        {inputMode === "text" && (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Fügen Sie hier den Text des Briefes ein..."
              className="w-full h-64 bg-bg-primary border border-border-color rounded-xl p-4 text-text-primary placeholder-text-secondary/50 focus:border-primary-orange focus:ring-1 focus:ring-primary-orange resize-none transition-all"
            />
            <button
              onClick={handleTextAnalysis}
              disabled={!textInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-primary-orange to-primary-orange-light hover:from-primary-orange-light hover:to-primary-orange disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-all shadow-md active:scale-[0.98]"
            >
              Analysieren
            </button>
          </div>
        )}
      </div>

      {/* Error display */}
      {processingError && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-600 dark:text-red-400">
          {processingError}
        </div>
      )}

      {/* Feature highlights */}
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon="🔒"
          title="100% Lokal"
          description="Alle Daten bleiben in Ihrem Browser"
        />
        <FeatureCard
          icon="🚦"
          title="Ampelsystem"
          description="Sofort die Dringlichkeit erkennen"
        />
        <FeatureCard
          icon="📋"
          title="Daten-Extraktion"
          description="Beträge, Fristen und Aktenzeichen"
        />
      </div>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-orange to-primary-orange-light bg-clip-text text-transparent mb-3">
        Behörden-Klartext
      </h1>
      <p className="text-text-secondary text-lg">
        Verstehen Sie amtliche Schreiben in Sekunden
      </p>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-2 px-3 rounded-lg font-medium text-sm
        transition-all duration-300
        ${
          active
            ? "bg-bg-primary text-primary-orange shadow-sm border border-border-color"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-primary/50"
        }
      `}
    >
      <span className="mr-2">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-bg-secondary rounded-xl text-center border border-border-color hover:border-primary-orange/30 transition-colors shadow-sm">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 text-center text-sm text-text-secondary border-t border-border-color pt-8">
      <p className="max-w-md mx-auto">
        Keine Rechtsberatung. Bei wichtigen Entscheidungen konsultieren Sie einen
        Rechtsanwalt.
      </p>
    </footer>
  );
}
