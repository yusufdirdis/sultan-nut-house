"use client";

import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { clsx } from "clsx";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/avif";

interface ImageDropzoneProps {
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  label?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Drag-and-drop image upload target that also supports click-to-browse.
 * Purely a UI concern — callers own the actual upload (see
 * uploadProductImageAction / uploadCategoryImageAction) and just pass a
 * File through onFileSelected.
 */
export function ImageDropzone({
  onFileSelected,
  isUploading = false,
  label = "Drag & drop an image, or click to browse",
  compact = false,
  className,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    handleFiles(event.dataTransfer.files);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload image"
      aria-disabled={isUploading}
      onClick={() => !isUploading && inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isUploading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition-colors",
        compact ? "px-3 py-4" : "px-6 py-10",
        isDragging ? "border-brass bg-brass/5" : "border-espresso/20 hover:border-espresso/40",
        isUploading && "pointer-events-none opacity-60",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        disabled={isUploading}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <UploadIcon />
      <p className={clsx("text-espresso-soft", compact ? "text-xs" : "text-sm")}>
        {isUploading ? "Uploading…" : label}
      </p>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-espresso/40">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
