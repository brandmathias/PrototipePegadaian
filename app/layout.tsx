import type { Metadata } from "next";

import { UiProviders } from "@/components/providers/ui-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pegadaian Lelang",
  description:
    "Frontend prototipe Pegadaian Lelang berbasis Next.js, Tailwind CSS, dan komponen gaya shadcn/ui."
};

const themeScript = `
(() => {
  try {
    const storageKey = "pegadaian:admin-theme";
    const storedTheme = window.localStorage.getItem(storageKey);
    const preferredTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.classList.toggle("dark", preferredTheme === "dark");
    document.documentElement.style.colorScheme = preferredTheme;
  } catch (_) {}
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <UiProviders>{children}</UiProviders>
      </body>
    </html>
  );
}
