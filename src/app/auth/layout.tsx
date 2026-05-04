"use client";

import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 500);
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    document.body.style.background = isMobile
      ? "#F4F1EC"
      : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.background = "";
    };
  }, [isMobile]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isMobile
          ? "#F4F1EC"
          : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          height: "100%",
          maxHeight: isMobile ? "100%" : 900,
          position: "relative",
          overflow: "hidden",
          borderRadius: isMobile ? 0 : 40,
          boxShadow: isMobile
            ? "none"
            : "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
          background: "#fff",
        }}
      >
        {children}
      </div>
    </div>
  );
}
