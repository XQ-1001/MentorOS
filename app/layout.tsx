import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resonance - Jobs Edition",
  description: "Echoes of Great Minds. Where your thoughts collide with Steve Jobs' vision, creating resonance across time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
