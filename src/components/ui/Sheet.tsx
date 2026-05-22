"use client";

import * as React from "react";
import { Drawer } from "vaul";

import { cn } from "@/lib/cn";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Visual hint that the sheet snaps to a partial height. */
  snapPoints?: (string | number)[];
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  snapPoints,
}: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={snapPoints}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto mt-24 flex h-auto max-h-[92vh] w-full max-w-[480px] flex-col rounded-t-[var(--r-xl)]",
            "border border-b-0 border-[color:var(--border-md)] bg-[color:var(--surface)] outline-none",
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[color:var(--surface-3)]" />
          {title ? (
            <Drawer.Title className="display px-6 pt-4 text-lg font-bold tracking-[-0.02em] text-[color:var(--text)]">
              {title}
            </Drawer.Title>
          ) : null}
          {description ? (
            <Drawer.Description className="px-6 pt-1 text-sm text-[color:var(--text-muted)]">
              {description}
            </Drawer.Description>
          ) : null}
          <div className="overflow-y-auto px-6 pb-6 pt-4">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
