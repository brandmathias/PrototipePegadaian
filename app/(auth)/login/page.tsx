import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { LoginPage } from "@/components/pages/public-pages";
import { getAuthenticatedLoginRedirectPath } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Masuk ke Akun Pembeli - Ruang Agunan",
  description: "Masuk ke akun pembeli Ruang Agunan Anda untuk memantau status lelang, mengelola transaksi, dan mengakses penawaran aset terbaik secara instan.",
  keywords: ["masuk akun", "login pembeli", "ruang agunan", "lelang online"],
  openGraph: {
    title: "Masuk ke Akun Pembeli - Ruang Agunan",
    description: "Masuk ke akun pembeli Ruang Agunan Anda untuk memantau status lelang, mengelola transaksi, dan mengakses penawaran aset terbaik secara instan.",
    type: "website",
  }
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const [session, params] = await Promise.all([getServerSession(), searchParams]);
  const rawNext = Array.isArray(params?.next) ? params?.next[0] : params?.next;
  const redirectPath = getAuthenticatedLoginRedirectPath(session?.user, rawNext);

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <LoginPage />;
}
