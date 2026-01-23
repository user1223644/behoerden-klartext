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
import { ThemeToggle } from "@/components/ThemeToggle";
import { TextPreview } from "@/components/TextPreview";
import { HighlightControls } from "@/components/HighlightControls";
import { DisclaimerModal, useDisclaimer } from "@/components/DisclaimerModal";
import { AnalysisResult } from "@/types";
import { isPDF } from "@/lib/pdf/extractor";
import { validateLetter } from "@/lib/validation";
import { AlertTriangle } from "@/components/icons";

type InputMode = "upload" | "camera" | "text";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [textInput, setTextInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Disclaimer modal state
  const { hasAccepted, acceptDisclaimer, isLoading: isDisclaimerLoading } = useDisclaimer();
  
  // Preview state - shows highlighted text before final analysis
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [showNeutralized, setShowNeutralized] = useState(true);
  const [showGreen, setShowGreen] = useState(true);

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
      setValidationError(null);
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

        const validation = validateLetter(text);
        if (!validation.isValidLetter) {
          setValidationError(validation.message || "Validierung fehlgeschlagen");
          return;
        }

        // Show preview first instead of direct analysis
        setPreviewText(validation.text);
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    },
    [extractPDFText, processImage, analyze]
  );

  const handleTextAnalysis = useCallback(() => {
    setValidationError(null);
    if (!textInput.trim()) return;

    const validation = validateLetter(textInput);
    if (!validation.isValidLetter) {
      setValidationError(validation.message || "Validierung fehlgeschlagen");
      return;
    }

    // Show preview first instead of direct analysis
    setPreviewText(validation.text);
  }, [textInput, analyze]);

  const handleReset = useCallback(() => {
    setAnalysisResult(null);
    setPreviewText(null);
    setValidationError(null);
    setTextInput("");
    resetOCR();
    resetPDF();
    resetScoring();
  }, [resetOCR, resetPDF, resetScoring]);

  // Handle proceeding from preview to analysis
  const handleProceedToAnalysis = useCallback(() => {
    if (!previewText) return;
    const result = analyze(previewText);
    setAnalysisResult(result);
  }, [previewText, analyze]);

  // Handle going back from preview to input
  const handleBackToInput = useCallback(() => {
    setPreviewText(null);
  }, []);

  // Show loading state while checking disclaimer status
  if (isDisclaimerLoading) {
    return (
      <div className="bg-bg-primary min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Laden...</div>
      </div>
    );
  }

  // Show disclaimer modal on first visit
  if (!hasAccepted) {
    return (
      <div className="bg-bg-primary min-h-screen">
        <DisclaimerModal onAccept={acceptDisclaimer} />
      </div>
    );
  }

  // Show results if analysis is complete
  if (analysisResult) {
    return (
      <div className="bg-bg-primary text-text-primary transition-colors duration-300 min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <AnalysisResultDisplay result={analysisResult} onReset={handleReset} />
        </div>
      </div>
    );
  }

  // Show preview with highlighted keywords
  if (previewText) {
    return (
      <div className="bg-bg-primary text-text-primary transition-colors duration-300 min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBackToInput}
              className="text-sm text-text-secondary hover:text-primary-orange transition-colors flex items-center gap-1 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück
            </button>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Vorschau mit Markierungen</h2>
            <p className="text-text-secondary text-sm">
              Überprüfen Sie die erkannten Schlüsselwörter. Klicken Sie auf markierte Begriffe für Details.
            </p>
          </div>

          {/* Highlight controls */}
          <div className="mb-4">
            <HighlightControls
              showNeutralized={showNeutralized}
              showGreen={showGreen}
              onToggleNeutralized={setShowNeutralized}
              onToggleGreen={setShowGreen}
            />
          </div>

          {/* Text preview with highlights */}
          <TextPreview
            text={previewText}
            showNeutralized={showNeutralized}
            showGreen={showGreen}
            onAnalyze={handleProceedToAnalysis}
          />
        </div>
      </div>
    );
  }

  // Show loading during OCR or PDF processing
  if (isProcessing) {
    return (
      <div className="bg-bg-primary text-text-primary transition-colors duration-300 min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mt-12">
            <LoadingSpinner progress={processingProgress} status={processingStatus} />
          </div>
        </div>
      </div>
    );
  }

  // Main input UI
  return (
    <div className="bg-bg-primary text-text-primary transition-colors duration-300 min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <Header />

        {/* Input mode tabs */}
        <div className="flex gap-6 mb-8 border-b border-border-color">
          <TabButton
            active={inputMode === "upload"}
            onClick={() => {
              setInputMode("upload");
              setValidationError(null);
            }}
            label="HOCHLADEN"
          />
          <TabButton
            active={inputMode === "camera"}
            onClick={() => {
              setInputMode("camera");
              setValidationError(null);
            }}
            label="KAMERA"
          />
          <TabButton
            active={inputMode === "text"}
            onClick={() => {
              setInputMode("text");
              setValidationError(null);
            }}
            label="TEXT"
          />
        </div>

        {/* Input area */}
        <div className={`bg-bg-secondary rounded-lg p-8 border-2 border-dashed transition-colors ${validationError ? 'border-red-500/50' : 'border-border-color'}`}>
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
                onChange={(e) => {
                  setTextInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Fügen Sie hier den Text des Briefes ein..."
                className={`w-full h-64 bg-bg-primary border rounded-lg p-4 text-text-primary placeholder-text-secondary/50 focus:ring-1 resize-none transition-all ${validationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border-color focus:border-primary-orange focus:ring-primary-orange'}`}
              />
              <button
                onClick={handleTextAnalysis}
                disabled={!textInput.trim()}
                className="w-full py-3 bg-primary-orange hover:bg-primary-orange-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-all"
              >
                Analysieren
              </button>
            </div>
          )}
        </div>

        {/* Error display */}
        {(processingError || validationError) && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">{processingError || validationError}</span>
          </div>
        )}

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <FeatureCard
            title="DATENSCHUTZ"
            heading="100% Lokal."
            description="Alle Daten bleiben in Ihrem Browser. Keine Server-Speicherung Ihrer sensiblen Dokumente."
          />
          <FeatureCard
            title="DRINGLICHKEIT"
            heading="Ampelsystem."
            description="Sofort die Dringlichkeit erkennen und Fristen niemals wieder versäumen."
          />
          <FeatureCard
            title="VERSTÄNDLICH"
            heading="Klartext."
            description="Komplizierte Behördensprache wird verständlich erklärt und zusammengefasst."
          />
        </div>

        <Footer />
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="border-b border-border-color bg-bg-primary">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-1 font-medium">
            <span className="text-primary-orange">~/</span>
            <span className="text-text-primary font-semibold">behörden-klartext</span>
          </div>
          
          {/* Right nav items */}
          <div className="flex items-center">
            <ThemeToggle inline />
          </div>
        </div>
      </div>
    </nav>
  );
}

function Header() {
  return (
    <div className="mb-10 mt-8">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
        behörden-klartext
      </h1>
      <p className="text-text-secondary font-mono text-sm">
        Verstehen Sie amtliche Schreiben in Sekunden.
        <br />
        Datenschutzorientierte, lokale Dokumentenanalyse.
      </p>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        pb-3 text-xs font-medium tracking-wider transition-colors
        ${
          active
            ? "text-primary-orange border-b-2 border-primary-orange -mb-[1px]"
            : "text-text-secondary hover:text-text-primary"
        }
      `}
    >
      {label}
    </button>
  );
}

interface FeatureCardProps {
  title: string;
  heading: string;
  description: string;
}

function FeatureCard({ title, heading, description }: FeatureCardProps) {
  return (
    <div className="text-left">
      <p className="text-xs font-medium tracking-wider text-primary-orange mb-4">
        {title}
      </p>
      <p className="text-text-primary">
        <span className="font-semibold">{heading}</span>{" "}
        <span className="text-text-secondary">{description}</span>
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border-color pt-8 pb-4">
      <p className="max-w-md text-sm text-text-secondary mb-8">
        Keine Rechtsberatung. Bei wichtigen Entscheidungen konsultieren Sie einen
        Rechtsanwalt.
      </p>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm font-medium opacity-80 gap-4">
        <p className="text-text-secondary">
          © {new Date().getFullYear()} <span className="text-primary-orange">mario nguyen</span>
        </p>
        
        <a 
          href="https://github.com/user1223644" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-text-secondary hover:text-primary-orange transition-colors flex items-center gap-2"
        >
          github.com/user1223644
        </a>
      </div>
    </footer>
  );
}
