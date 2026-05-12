import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";

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
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body
        style={{ margin: 0, padding: 0, width: "100vw", minHeight: "100vh" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
