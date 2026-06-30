import type { Metadata } from "next";
import { Kalam, Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";

import { UiProviders } from "@/components/providers/ui-providers";
import {
  BRAND_ICON_SRC,
  BRAND_NAME,
  BRAND_SHARE_IMAGE_HEIGHT,
  BRAND_SHARE_IMAGE_SRC,
  BRAND_SHARE_IMAGE_WIDTH,
  BRAND_TAGLINE
} from "@/lib/brand";
import { resolvePublicSiteUrl } from "@/lib/site-url";

import "./globals.css";

const siteUrl = resolvePublicSiteUrl();
const metadataBase = new URL(siteUrl);

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-kalam",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["italic"],
  preload: false,
  variable: "--font-cormorant",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  preload: false,
  variable: "--font-plus-jakarta",
});

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
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: BRAND_ICON_SRC, sizes: "128x128", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [BRAND_ICON_SRC]
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
        url: BRAND_SHARE_IMAGE_SRC,
        width: BRAND_SHARE_IMAGE_WIDTH,
        height: BRAND_SHARE_IMAGE_HEIGHT,
        alt: `Logo ${BRAND_NAME}`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | Prototipe Katalog Barang Agunan`,
    description:
      "Katalog barang agunan, wishlist, penawaran tertutup, dan simulasi transaksi digital dalam prototipe web tugas akhir.",
    images: [BRAND_SHARE_IMAGE_SRC]
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
    <html lang="id" className={`${kalam.variable} ${cormorantGaramond.variable} ${plusJakartaSans.variable}`}>
      <body>
        <UiProviders>
          {children}
        </UiProviders>
      </body>
    </html>
  );
}
