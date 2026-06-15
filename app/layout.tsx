import type { Metadata } from "next";

import { UiProviders } from "@/components/providers/ui-providers";

import "./globals.css";

const FALLBACK_SITE_URL = "https://app.tugasprototype.cloud";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export function resolvePublicSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.BETTER_AUTH_URL,
    FALLBACK_SITE_URL
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const parsedUrl = new URL(candidate);

      if (LOCAL_HOSTNAMES.has(parsedUrl.hostname)) {
        continue;
      }

      return parsedUrl.origin;
    } catch {
      continue;
    }
  }

  return FALLBACK_SITE_URL;
}

const siteUrl = resolvePublicSiteUrl();
const metadataBase = new URL(siteUrl);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Prototipe Platform Lelang Barang | Tugas Akhir",
    template: "%s | Prototipe Platform Lelang Barang"
  },
  applicationName: "Tugas Prototype Cloud",
  description:
    "Prototipe platform lelang barang untuk tugas akhir dengan katalog harga tetap, alur penawaran tertutup, wishlist, dan pengalaman transaksi digital yang mudah dipahami.",
  keywords: [
    "prototipe lelang barang",
    "tugas akhir",
    "katalog harga tetap",
    "penawaran tertutup",
    "wishlist barang",
    "transaksi digital",
    "app tugasprototype cloud"
  ],
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon.svg"]
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Tugas Prototype Cloud",
    title: "Prototipe Platform Lelang Barang untuk Katalog, Wishlist, dan Simulasi Transaksi",
    description:
      "Jelajahi prototipe tugas akhir untuk katalog barang, pembelian harga tetap, penawaran tertutup, dan alur transaksi digital dalam satu pengalaman web.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pratinjau Prototipe Platform Lelang Barang Tugas Akhir"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Prototipe Platform Lelang Barang | Tugas Akhir",
    description:
      "Katalog barang, wishlist, penawaran tertutup, dan simulasi transaksi digital dalam prototipe web tugas akhir.",
    images: ["/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <UiProviders>{children}</UiProviders>
      </body>
    </html>
  );
}
