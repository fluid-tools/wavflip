import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { BaseProviders } from "@/state/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wavflip.com"),
  applicationName: "WAVFLIP",
  title: "WAVFLIP — AI-Native Audio Workflows in the Browser",
  description:
    "Browser-based AI sampler and multi-track studio. Go from prompt to sound, generate stems, split stems, edit with ai agents, then export locally or save to your WAVFLIP Vault.",
  keywords: [
    "AI audio sampler",
    "prompt to sound",
    "multi-track",
    "cursor",
    "sampling",
    "AI-Native",
    "stems",
    "music production",
    "browser-based",
    "web app",
    "WAVFLIP",
  ],
  alternates: {
    canonical: "https://wavflip.com",
  },
  openGraph: {
    title: "WAVFLIP — AI-Native Audio Workflows in the Browser",
    description:
      "AI-Assist for music production in your browser. Prompt to sound, generate and edit stems, multi-track arranging, and exporting or saving to your Vault.",
    url: "https://wavflip.com",
    siteName: "WAVFLIP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WAVFLIP — AI-Native Audio Workflows in the Browser",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WAVFLIP — AI-Native Audio Workflows in the Browser",
    description:
      "Browser-based AI sampler and multi-track studio. Prompt to sound, agent-powered editing, and Vault storage.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${instrumentSerif.variable} ${geistMono.variable} antialiased`}
      >
        <BaseProviders>
          {children}
        </BaseProviders>
      </body>
    </html>
  );
}
