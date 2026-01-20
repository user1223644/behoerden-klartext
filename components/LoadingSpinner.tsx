"use client";

/**
 * Loading spinner component with progress.
 */

interface LoadingSpinnerProps {
  progress?: number;
  status?: string;
}

export function LoadingSpinner({ progress, status }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Spinner */}
      <div className="relative">
        <div className="w-20 h-20 border-4 border-gray-700 rounded-full" />
        <div
          className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
        />

        {/* Progress in center */}
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{progress}%</span>
          </div>
        )}
      </div>

      {/* Status text */}
      {status && (
        <p className="text-gray-300 text-center animate-pulse">{status}</p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
