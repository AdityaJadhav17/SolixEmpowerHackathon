import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Designed for low-vision readers; fits users reading dense government letters.
const font = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coverage Keeper",
  description:
    "Understand your Medicaid letter: what it asks, the deadline, and what to send.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1520" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
