"use client";

/**
 * Main application page for Behörden-Klartext.
 */

import { useState, useCallback } from "react";
import { useOCR } from "@/hooks/useOCR";
import { useScoring } from "@/hooks/useScoring";
import { FileUpload } from "@/components/FileUpload";
import { CameraCapture } from "@/components/CameraCapture";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AnalysisResultDisplay } from "@/components/AnalysisResult";
import { AnalysisResult } from "@/types";

type InputMode = "upload" | "camera" | "text";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [textInput, setTextInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { state: ocrState, processImage, reset: resetOCR } = useOCR();
  const { analyze, reset: resetScoring } = useScoring();

  const handleImageAnalysis = useCallback(
    async (image: File | Blob) => {
      try {
        const text = await processImage(image);
        const result = analyze(text);
        setAnalysisResult(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    },
    [processImage, analyze]
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
    resetScoring();
  }, [resetOCR, resetScoring]);

  // Show results if analysis is complete
  if (analysisResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Header />
        <AnalysisResultDisplay result={analysisResult} onReset={handleReset} />
      </div>
    );
  }

  // Show loading during OCR
  if (ocrState.isProcessing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Header />
        <div className="mt-12">
          <LoadingSpinner progress={ocrState.progress} status={ocrState.status} />
        </div>
      </div>
    );
  }

  // Main input UI
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Header />

      {/* Input mode tabs */}
      <div className="flex gap-2 mb-6 bg-gray-800/50 rounded-xl p-1">
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
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
        {inputMode === "upload" && (
          <FileUpload onFileSelect={handleImageAnalysis} />
        )}

        {inputMode === "camera" && (
          <CameraCapture onCapture={handleImageAnalysis} />
        )}

        {inputMode === "text" && (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Fügen Sie hier den Text des Briefes ein..."
              className="w-full h-64 bg-gray-800 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleTextAnalysis}
              disabled={!textInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all"
            >
              Analysieren
            </button>
          </div>
        )}
      </div>

      {/* OCR Error display */}
      {ocrState.error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-400">
          {ocrState.error}
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
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
        Behörden-Klartext
      </h1>
      <p className="text-gray-400">
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
        transition-all duration-200
        ${
          active
            ? "bg-gray-700 text-white"
            : "text-gray-400 hover:text-white hover:bg-gray-700/50"
        }
      `}
    >
      <span className="mr-1">{icon}</span>
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
    <div className="p-4 bg-gray-800/30 rounded-xl text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 text-center text-sm text-gray-500">
      <p>
        Keine Rechtsberatung. Bei wichtigen Entscheidungen konsultieren Sie einen
        Rechtsanwalt.
      </p>
    </footer>
  );
}
