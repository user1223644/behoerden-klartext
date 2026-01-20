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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState({
        isActive: true,
        hasPermission: true,
        error: null,
      });
    } catch (error) {
      let errorMessage = "Kamera konnte nicht gestartet werden";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Kamerazugriff wurde verweigert";
        } else if (error.name === "NotFoundError") {
          errorMessage = "Keine Kamera gefunden";
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
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Convert to blob synchronously isn't possible, so we return null
    // The actual implementation uses toDataURL
    let result: Blob | null = null;

    canvas.toBlob(
      (blob) => {
        result = blob;
      },
      "image/jpeg",
      0.9
    );

    // Return data URL converted to blob for immediate use
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      arr[i] = bytes.charCodeAt(i);
    }

    return new Blob([arr], { type: "image/jpeg" });
  }, [state.isActive]);

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
