import type { Metadata } from "next";

import { UiProviders } from "@/components/providers/ui-providers";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { resolvePublicSiteUrl } from "@/lib/site-url";

import "./globals.css";

const siteUrl = resolvePublicSiteUrl();
const metadataBase = new URL(siteUrl);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: `${BRAND_NAME} | Prototipe Katalog Barang Agunan`,
    template: `%s | ${BRAND_NAME}`
  },
  applicationName: BRAND_NAME,
  description:
    "Ruang Agunan adalah prototipe tugas akhir untuk katalog barang agunan, pembelian harga tetap, wishlist, penawaran tertutup, dan simulasi transaksi digital.",
  keywords: [
    "Ruang Agunan",
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
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} | Prototipe Katalog, Wishlist, dan Simulasi Transaksi`,
    description:
      `${BRAND_TAGLINE} dalam satu pengalaman web prototipe tugas akhir.`,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `Logo ${BRAND_NAME}`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | Prototipe Katalog Barang Agunan`,
    description:
      "Katalog barang agunan, wishlist, penawaran tertutup, dan simulasi transaksi digital dalam prototipe web tugas akhir.",
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
