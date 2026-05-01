import type { Metadata } from "next";

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', width: '100vw', height: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
