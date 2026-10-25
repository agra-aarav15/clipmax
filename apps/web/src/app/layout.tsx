import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { publicEnv } from "@/lib/public-env";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: {
    default: "ClipMax — Long video in. A week of clips out.",
    template: "%s · ClipMax",
  },
  description:
    "ClipMax finds the hooks, crops to 9:16, and burns word-level captions. One recording becomes a week of 9:16 clips — no timeline required.",
  applicationName: "ClipMax",
  openGraph: {
    title: "ClipMax — Long video in. A week of clips out.",
    description:
      "Long-form video in, scored vertical clips out. Hook detection, 9:16 cropping, and word-level captions in one asynchronous pipeline.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipMax — Long video in. A week of clips out.",
    description:
      "Turn long-form recordings into vertical, captioned clips. One upload; a week of posts.",
  },
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
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
