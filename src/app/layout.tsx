import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "./Providers";
import { Toaster } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "PLAIner — MVP Premium",
  description: "El teu pròxim viatge, a 3 minuts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('pl-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){}})();",
          }}
        />
      </head>
      <body
        style={{ margin: 0, padding: 0, width: "100vw", minHeight: "100vh" }}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <Script src="/i18n.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
