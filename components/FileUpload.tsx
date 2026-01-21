"use client";

/**
 * File upload component with drag-and-drop and preview.
 * Supports images and PDFs.
 */

import { useState, useCallback, useRef } from "react";
import { isPDF } from "@/lib/pdf/extractor";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = "image/*,application/pdf",
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPDFFile, setIsPDFFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = isPDF(file);

      if (!isImage && !isPdf) {
        alert("Bitte nur Bilder oder PDF-Dateien hochladen.");
        return;
      }

      setFileName(file.name);
      setIsPDFFile(isPdf);

      if (isImage) {
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // No preview for PDFs, just show file name
        setPreview(null);
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setIsPDFFile(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative
          border-2 border-dashed rounded-xl
          p-8
          text-center
          cursor-pointer
          transition-all duration-300
          ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Vorschau"
              className="max-h-64 mx-auto rounded-lg shadow-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ) : isPDFFile && fileName ? (
          <div className="relative">
            <div className="flex flex-col items-center gap-3 p-6 bg-gray-700/50 rounded-lg">
              <span className="text-6xl">📑</span>
              <p className="text-lg font-medium text-white">{fileName}</p>
              <p className="text-sm text-gray-400">PDF-Datei ausgewählt</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📄</div>
            <div>
              <p className="text-lg font-medium text-gray-200">
                Datei hier ablegen oder klicken
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Unterstützt: JPG, PNG, WEBP, <strong>PDF</strong>
              </p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

