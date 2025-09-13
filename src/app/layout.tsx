import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peepers - Sua Loja Oficial no Mercado Livre",
  description: "Produtos de qualidade com a segurança e praticidade do Mercado Livre. Descubra nossa seleção exclusiva de produtos com frete grátis e entrega rápida.",
  keywords: "peepers, mercado livre, loja oficial, produtos, frete grátis, compra segura",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
