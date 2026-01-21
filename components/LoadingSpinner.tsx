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
    <div className="flex flex-col items-center justify-center p-8 space-y-8">
      {/* Spinner */}
      <div className="relative group">
        <div className="w-24 h-24 border-4 border-border-color rounded-full" />
        <div
          className="absolute top-0 left-0 w-24 h-24 border-4 border-primary-orange rounded-full border-t-transparent animate-spin shadow-[0_0_15px_rgba(255,165,0,0.3)]"
        />

        {/* Progress in center */}
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-text-primary tracking-tighter">
              {progress}<span className="text-primary-orange text-sm ml-0.5">%</span>
            </span>
          </div>
        )}
      </div>

      {/* Status text */}
      {status && (
        <div className="text-center space-y-2">
           <p className="text-text-primary font-bold text-lg animate-pulse tracking-wide uppercase">{status}</p>
           <p className="text-text-secondary text-sm">Bitte haben Sie einen Moment Geduld...</p>
        </div>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs h-3 bg-bg-secondary rounded-full overflow-hidden border border-border-color p-0.5">
          <div
            className="h-full bg-gradient-to-r from-primary-orange to-primary-orange-light rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
