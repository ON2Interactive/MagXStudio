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
    default: "MagXStudio",
    template: "%s | MagXStudio"
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }]
  },
  description:
    "Design posters, magazines, and layouts with an intuitive canvas and AI-powered creative tools.",
  openGraph: {
    title: "MagXStudio — The Future of Publication Design",
    description:
      "Modern publication design meets AI core technology.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
