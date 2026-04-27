"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Modal"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Tancar"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:rgba(20,22,24,0.92)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
          className
        )}
      >
        {title ? (
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold tracking-wide">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Tancar"
              onClick={onClose}
              className="rounded-full px-3 py-2 text-sm text-[color:var(--color-text-muted)] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
            >
              Tancar
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

