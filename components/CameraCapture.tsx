"use client";

/**
 * Camera capture component for mobile devices.
 */

import { useCamera } from "@/hooks/useCamera";

interface CameraCaptureProps {
  onCapture: (image: Blob) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const { state, videoRef, startCamera, stopCamera, captureImage } = useCamera();

  const handleCapture = () => {
    const blob = captureImage();
    if (blob) {
      stopCamera();
      onCapture(blob);
    }
  };

  if (state.error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/50 rounded-xl text-center shadow-inner">
        <p className="text-red-600 dark:text-red-400 font-medium">{state.error}</p>
        <button
          onClick={startCamera}
          className="mt-4 px-6 py-2 bg-primary-orange hover:bg-primary-orange-light text-white rounded-lg transition-colors font-medium shadow-md"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!state.isActive) {
    return (
      <button
        onClick={startCamera}
        disabled={disabled}
        className={`
          w-full py-5 px-6
          bg-gradient-to-r from-primary-orange to-primary-orange-light
          hover:from-primary-orange-light hover:to-primary-orange
          rounded-xl
          font-bold text-lg text-white
          transition-all duration-300
          flex items-center justify-center gap-3
          shadow-lg active:scale-[0.98]
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span className="text-2xl">📷</span>
        Kamera öffnen
      </button>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border-color shadow-2xl">
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full aspect-[4/3] object-cover bg-black"
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex justify-center items-center gap-8">
          {/* Capture button */}
          <button
            onClick={handleCapture}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-90"
            aria-label="Foto aufnehmen"
          >
            <div className="w-16 h-16 border-4 border-black/5 rounded-full bg-primary-orange shadow-inner" />
          </button>

          {/* Close button */}
          <button
            onClick={stopCamera}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Kamera schließen"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
