"use client";

import { useEffect } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.body.style.background = "var(--surface-2, #f5f5f5)";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.background = "";
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "480px",
        margin: "0 auto",
        background: "var(--surface, #fff)",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}
