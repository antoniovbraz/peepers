import type { Metadata, Viewport } from "next";
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

// Componente para registrar Service Worker
function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                  console.log('[SW] Registered successfully:', registration.scope);

                  // Limpar cache periodicamente
                  setInterval(() => {
                    registration.active?.postMessage({ type: 'CLEAN_CACHE' });
                  }, 30 * 60 * 1000); // A cada 30 minutos
                })
                .catch(function(error) {
                  console.log('[SW] Registration failed:', error);
                });
            });
          }
        `,
      }}
    />
  );
}
