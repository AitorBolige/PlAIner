import type { Metadata } from "next";
import "./globals.css";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { TopBar } from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "PLAIner",
  description: "Travel planning, closed-loop and budget-transparent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@700,800&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <TopBar />
        <main className="pb-24 md:pb-0">{children}</main>
        <div className="hidden md:block">
          <Footer />
        </div>
        <BottomTabBar />
      </body>
    </html>
  );
}
