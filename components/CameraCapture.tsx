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
      <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl text-center">
        <p className="text-red-400">{state.error}</p>
        <button
          onClick={startCamera}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
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
          w-full py-4 px-6
          bg-gradient-to-r from-blue-600 to-purple-600
          hover:from-blue-500 hover:to-purple-500
          rounded-xl
          font-medium text-lg
          transition-all duration-300
          flex items-center justify-center gap-3
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span className="text-2xl">📷</span>
        Kamera öffnen
      </button>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-700">
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full aspect-[4/3] object-cover bg-black"
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center gap-4">
          {/* Capture button */}
          <button
            onClick={handleCapture}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
          >
            <div className="w-12 h-12 bg-red-500 rounded-full" />
          </button>

          {/* Close button */}
          <button
            onClick={stopCamera}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
