import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import { PreviewBar } from "../components/preview-bar";

import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ClipMax — Long video in. A week of clips out.",
    template: "%s · ClipMax",
  },
  description:
    "A static design preview of ClipMax: long-form video becomes vertical, captioned clips. The working upload, processing, and billing flows run in the full app.",
  applicationName: "ClipMax",
  openGraph: {
    title: "ClipMax — Long video in. A week of clips out.",
    description:
      "Hooks found, frame cropped, captions burned. This is the design preview; the working studio is the full Next.js app.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable} dark`}
    >
      <body className="min-h-dvh overflow-x-clip bg-background font-sans text-foreground">
        <PreviewBar />
        {children}
      </body>
    </html>
  );
}
