import type { Metadata } from "next";
import { Rajdhani, Space_Grotesk } from "next/font/google";
import Analytics from "@/components/analytics";
import { siteConfig } from "@/lib/site-content";
import "./globals.css";

const headingFont = Rajdhani({
  variable: "--font-heading",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "808bytes Store",
    template: "%s | 808bytes",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["808bytes", "sample packs", "producer tools", "music production", "digital downloads", "Sauce packs"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "808bytes Store",
    description: siteConfig.description,
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "808bytes interactive sound shop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "808bytes Store",
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
