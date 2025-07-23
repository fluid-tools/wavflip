import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StateProviders from "@/state/providers";
import { PillsNav } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

const PlayerDock = dynamic(() => import("@/components/player-dock"))

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WAVFLIP - AI Audio Sampler",
  description:
    "wavflip is an ai-powered audio sampler and soundpack generator. 100x your audio-sampling workflow. free and open-source. - AI-powered sampler - sample anything. produce tracks in minutes. generate royalty-free soundpacks in seconds",
  openGraph: {
    title: "WAV\u00A0FLIP - AI Audio Sampler",
    description:
      "wavflip is an ai-powered audio sampler and soundpack generator. 100x your audio-sampling workflow. free and open-source.",
    url: "https://wavflip.com",
    siteName: "wavflip",
    images: [
      {
        url: "/file.svg", // or a proper OG image
        width: 1200,
        height: 630,
        alt: "wavflip logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WAV\u00A0FLIP - AI Audio Sampler",
    description:
      "wavflip is an ai-powered audio sampler and soundpack generator. 100x your audio-sampling workflow. free and open-source.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StateProviders>
          <PillsNav />
          {children}
          <PlayerDock />
        </StateProviders>
      </body>
    </html>
  );
}
