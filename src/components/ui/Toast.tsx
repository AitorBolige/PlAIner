"use client";

import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--surface)",
          color: "var(--text)",
          border: "1px solid var(--border-md)",
          borderRadius: "var(--r-md)",
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-lg)",
        },
      }}
    />
  );
}
