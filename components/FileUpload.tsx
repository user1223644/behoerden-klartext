"use client";

/**
 * File upload component with drag-and-drop and preview.
 * Supports images and PDFs.
 */

import { useState, useCallback, useRef } from "react";
import { isPDF } from "@/lib/pdf/extractor";
import { Upload, FileText, X } from "@/components/icons";

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
          p-10
          text-center
          cursor-pointer
          transition-all duration-300
          ${
            isDragging
              ? "border-primary-orange bg-primary-orange/5"
            : "border-border-color hover:border-primary-orange/30 bg-bg-secondary"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Vorschau"
              className="max-h-64 mx-auto rounded-lg shadow-xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              aria-label="Vorschau löschen"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : isPDFFile && fileName ? (
          <div className="relative">
            <div className="flex flex-col items-center gap-4 p-8 bg-bg-primary/50 rounded-lg border border-border-color">
              <span className="w-16 h-16 rounded-full bg-primary-orange/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary-orange" aria-hidden="true" />
              </span>
              <p className="text-lg font-bold text-text-primary mb-1">{fileName}</p>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">PDF-Datei ausgewählt</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              aria-label="Auswahl löschen"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <Upload className="w-8 h-8 text-primary-orange" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-text-primary">
                Datei hier ablegen oder klicken
              </p>
              <p className="text-xs text-text-secondary mt-2 uppercase tracking-wider">
                Unterstützt: JPG, PNG, WEBP, PDF
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

