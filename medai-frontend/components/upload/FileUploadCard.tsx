"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadCardProps {
  accept: string;
  label: string;
  hint: string;
  onFile: (file: File) => void;
  busy?: boolean;
  busyLabel?: string;
}

export function FileUploadCard({
  accept,
  label,
  hint,
  onFile,
  busy = false,
  busyLabel = "Processing…",
}: FileUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    onFile(f);
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload file"
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!busy) inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!busy) pick(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all",
        dragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          : "border-blue-300 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20",
        busy && "pointer-events-none opacity-70",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {busy ? (
        <>
          <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-600" />
          <p className="font-semibold">{busyLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">This can take a moment…</p>
        </>
      ) : file ? (
        <div className="flex items-center gap-3">
          <FileText className="h-10 w-10 text-blue-600" />
          <div className="text-left">
            <p className="max-w-xs truncate font-semibold">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={reset}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Remove file"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <>
          <UploadCloud className="mb-3 h-10 w-10 text-blue-600" />
          <p className="font-semibold">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">Drag &amp; drop or click to choose</p>
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        </>
      )}
    </div>
  );
}
