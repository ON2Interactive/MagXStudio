import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

const resolveMetadataBase = (): URL => {
  const fallback = "http://localhost:3002";
  const raw = process.env.APP_BASE_URL?.trim();
  try {
    return new URL(raw && raw.length > 0 ? raw : fallback);
  } catch {
    return new URL(fallback);
  }
};

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "MagXStudio — Design Sites, Slides, Pages & AI Visuals in One Studio",
    template: "%s | MagXStudio"
  },
  description:
    "MagXStudio is the all-in-one browser-based creative studio for generating websites, building presentation decks, designing multi-page publications, and creating AI-powered visuals — all in one place.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "MagXStudio — Design Sites, Slides, Pages & AI Visuals in One Studio",
    description:
      "The all-in-one browser-based creative studio. Generate websites, build decks, design publications, and create AI visuals — no installs, no switching tools.",
    type: "website",
    url: "https://magxstudio.com",
    siteName: "MagXStudio",
    images: [
      {
        url: "/share.png",
        width: 1200,
        height: 630,
        alt: "MagXStudio — One Studio for Site Design, Slides, Pages, and AI Visuals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MagXStudio — Design Sites, Slides, Pages & AI Visuals in One Studio",
    description:
      "The all-in-one browser-based creative studio. Generate websites, build decks, design publications, and create AI visuals.",
    images: ["/share.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
