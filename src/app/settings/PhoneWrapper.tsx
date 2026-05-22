"use client";

import React from "react";

export function PhoneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <div className="relative min-h-dvh w-full max-w-[480px] overflow-hidden border-x border-border bg-bg">
        {children}
      </div>
    </div>
  );
}
