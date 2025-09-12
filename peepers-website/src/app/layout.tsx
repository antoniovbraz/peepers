import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Peepers - Sua Loja Oficial no Mercado Livre",
    template: "%s | Peepers"
  },
  description: "Sua loja oficial com produtos de qualidade, integrada ao Mercado Livre para sua segurança e comodidade. Qualidade garantida e entrega rápida.",
  keywords: ["peepers", "loja online", "mercado livre", "produtos de qualidade", "entrega rápida", "compra segura"],
  authors: [{ name: "Peepers" }],
  creator: "Peepers",
  publisher: "Peepers",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://peepers.com.br",
    siteName: "Peepers",
    title: "Peepers - Sua Loja Oficial no Mercado Livre",
    description: "Sua loja oficial com produtos de qualidade, integrada ao Mercado Livre para sua segurança e comodidade.",
    images: [
      {
        url: "/logo-full.png",
        width: 1200,
        height: 630,
        alt: "Peepers - Sua Loja Oficial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peepers - Sua Loja Oficial no Mercado Livre",
    description: "Sua loja oficial com produtos de qualidade, integrada ao Mercado Livre para sua segurança e comodidade.",
    images: ["/logo-full.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2d5a27" },
    { media: "(prefers-color-scheme: dark)", color: "#2d5a27" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased bg-accent-50 text-accent-900">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
