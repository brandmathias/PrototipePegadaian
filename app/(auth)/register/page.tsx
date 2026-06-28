import { RegisterPage } from "@/components/pages/public-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun Pembeli Baru - Ruang Agunan",
  description: "Buat akun pembeli baru di Ruang Agunan untuk mendapatkan akses penuh ke katalog aset berkualitas tinggi dan mengajukan penawaran lelang secara aman.",
  keywords: ["daftar akun", "registrasi pembeli", "katalog lelang", "ruang agunan", "lelang tertutup"],
  openGraph: {
    title: "Daftar Akun Pembeli Baru - Ruang Agunan",
    description: "Buat akun pembeli baru di Ruang Agunan untuk mendapatkan akses penuh ke katalog aset berkualitas tinggi dan mengajukan penawaran lelang secara aman.",
    type: "website",
  }
};

export default function Page() {
  return <RegisterPage />;
}
