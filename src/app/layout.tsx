import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { WebVitals } from "@/components/WebVitals";

// FORCE CACHE BUSTING - BUILD: 2025-09-15-20-35
const FORCE_CACHE_BUST = "2025-09-15-20-35";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Melhor performance para fontes
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Peepers - Sua Loja Oficial no Mercado Livre",
  description: "Produtos de qualidade com a segurança e praticidade do Mercado Livre. Descubra nossa seleção exclusiva de produtos com frete grátis e entrega rápida.",
  keywords: "peepers, mercado livre, loja oficial, produtos, frete grátis, compra segura",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Peepers",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Peepers - Sua Loja Oficial no Mercado Livre",
    description: "Produtos de qualidade com a segurança e praticidade do Mercado Livre.",
    url: "https://peepers.vercel.app",
    siteName: "Peepers",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peepers - Sua Loja Oficial no Mercado Livre",
    description: "Produtos de qualidade com a segurança e praticidade do Mercado Livre.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "cache-bust": FORCE_CACHE_BUST,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Peepers" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <WebVitals />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
