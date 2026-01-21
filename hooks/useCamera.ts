"use client";

/**
 * Hook for camera access and capture.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { CameraState } from "@/types";

interface UseCameraReturn {
  state: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => Blob | null;
}

const initialState: CameraState = {
  isActive: false,
  hasPermission: null,
  error: null,
};

export function useCamera(): UseCameraReturn {
  const [state, setState] = useState<CameraState>(initialState);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      let stream: MediaStream | null = null;
      let error: unknown = null;

      // Strategy 1: Try environment camera (back camera)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch (e) {
        console.log("Environment camera failed, trying fallback...", e);
        error = e;
      }

      // Strategy 2: If failed, try any camera without specific facing mode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          }); // Fallback to basic constraints
          error = null;
        } catch (e) {
          console.error("Fallback camera failed:", e);
          error = e;
        }
      }

      if (!stream) {
        throw error || new Error("Keine Kamera gefunden");
      }

      streamRef.current = stream;

      // Update state to trigger re-render and mount video element
      setState({
        isActive: true,
        hasPermission: true,
        error: null,
      });
    } catch (error) {
      console.error("Camera start failed:", error);
      let errorMessage = "Kamera konnte nicht gestartet werden";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Kamerazugriff wurde verweigert";
        } else if (error.name === "NotFoundError") {
          errorMessage = "Keine Kamera gefunden";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Kamera wird bereits verwendet";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Kamera-Einstellungen nicht unterstützt"; // Should be caught by fallback
        }
      }

      setState({
        isActive: false,
        hasPermission: false,
        error: errorMessage,
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const captureImage = useCallback((): Blob | null => {
    if (!videoRef.current || !state.isActive) {
      return null;
    }

    const video = videoRef.current;
    
    // Ensure we have dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob via data URL (synchronous-like behavior for hook return)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      arr[i] = bytes.charCodeAt(i);
    }

    return new Blob([arr], { type: "image/jpeg" });
  }, [state.isActive]);

  // Effect to attach stream to video element when active
  useEffect(() => {
    if (state.isActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      
      video.play().catch((e) => {
        console.error("Video auto-play failed:", e);
      });
    }
  }, [state.isActive]); // Depend on isActive state change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { state, videoRef, startCamera, stopCamera, captureImage };
}
