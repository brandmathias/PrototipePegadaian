import type { Metadata } from "next";

import { UiProviders } from "@/components/providers/ui-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pegadaian Lelang",
  description:
    "Frontend prototipe Pegadaian Lelang berbasis Next.js, Tailwind CSS, dan komponen gaya shadcn/ui."
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
