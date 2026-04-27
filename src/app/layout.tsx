import type { Metadata } from "next";
import "./globals.css";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { TopBar } from "@/components/layout/TopBar";
import { Providers } from "@/app/Providers";

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
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <div className="hidden md:block">
            <Navbar />
          </div>
          <TopBar />
          <main className="pb-24 md:pb-0">{children}</main>
          <div className="hidden md:block">
            <Footer />
          </div>
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
