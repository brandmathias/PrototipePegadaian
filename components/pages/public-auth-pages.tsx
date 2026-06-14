import { Suspense, type CSSProperties } from "react";
import { Landmark } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export function LoginPage() {
  const loginStats = [
    { label: "Katalog aktif", value: "10K+" },
    { label: "Unit terhubung", value: "47+" },
    { label: "Transaksi aman", value: "98%" }
  ];

  return (
    <main className="grid min-h-[100dvh] w-full overflow-hidden bg-[#03140d] text-white lg:grid-cols-[1.08fr_0.92fr]">
      <section
        className="relative hidden min-h-[100dvh] overflow-hidden bg-center bg-cover p-12 text-white lg:flex lg:flex-col lg:justify-end lg:bg-[image:var(--login-hero-image)] xl:p-16"
        style={{
          "--login-hero-image":
            "linear-gradient(180deg, rgba(2, 15, 10, 0.04) 0%, rgba(2, 23, 13, 0.22) 42%, rgba(1, 13, 8, 0.92) 100%), linear-gradient(90deg, rgba(44, 27, 8, 0.12), rgba(0, 54, 31, 0.22)), url('/uploads/Gambar%20Wallpaper%20Login.png')"
        } as CSSProperties}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,207,91,0.24),transparent_26%),radial-gradient(circle_at_80%_14%,rgba(5,67,40,0.38),transparent_28%)]" />
        <div className="absolute left-12 top-12 flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[0.66rem] font-black uppercase tracking-[0.26em] text-white/86 backdrop-blur-md xl:left-16 xl:top-16">
          <Landmark className="size-3.5 text-amber-200" />
          Pegadaian Lelang
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(0deg,rgba(0,14,8,0.96)_0%,rgba(0,18,10,0.78)_46%,transparent_100%)]" />
        <div className="relative max-w-[700px] space-y-7">
          <div className="space-y-3">
            <h1 className="font-headline text-[clamp(3.25rem,5.4vw,5.65rem)] font-black leading-[0.95] tracking-[-0.055em]">
              Beli langsung atau ikut lelang dalam satu akun.
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/74">
              Temukan barang bernilai, pilih harga tetap untuk proses cepat,
              atau ikuti Lelang Tertutup dengan penawaran tertutup yang aman.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-4">
            {loginStats.map((item) => (
              <div
                className="rounded-3xl border border-white/12 bg-white/[0.08] px-5 py-4 backdrop-blur-md"
                key={item.label}
              >
                <div className="font-headline text-3xl font-black tracking-tight text-amber-200">
                  {item.value}
                </div>
                <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-white/62">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_92%_10%,rgba(232,181,48,0.24),transparent_26%),radial-gradient(circle_at_14%_86%,rgba(23,155,91,0.22),transparent_30%),linear-gradient(145deg,#04331e_0%,#062414_44%,#03150c_100%)] px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
        <div className="absolute -right-28 top-10 size-80 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-full bg-[radial-gradient(circle_at_100%_100%,rgba(13,143,83,0.30),transparent_52%)]" />
        <div className="absolute inset-y-0 left-0 hidden w-px bg-white/10 lg:block" />

        <div className="relative w-full max-w-[560px]">
          <div className="mb-9 space-y-6">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-3xl border border-amber-200/18 bg-amber-200/10 text-amber-100">
                <Landmark className="size-6" />
              </span>
              <div>
                <p className="font-headline text-xl font-black leading-none tracking-tight">
                  Pegadaian Lelang
                </p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-100/58">
                  Akun pembeli
                </p>
              </div>
            </div>
            <div>
              <h2 className="font-headline text-4xl font-black tracking-tight xl:text-5xl">
                Masuk ke akun Anda
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-emerald-50/66">
                Lanjutkan ke katalog, transaksi, riwayat bid, dan nota dengan
                akun pembeli yang sudah terdaftar.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-50/70">Menyiapkan formulir masuk...</div>}>
            <LoginForm />
          </Suspense>
          <div className="mt-5 rounded-[1.15rem] border border-amber-200/18 bg-amber-200/10 p-4 text-sm leading-6 text-emerald-50/72">
            Akun sedang terkunci karena blacklist? Hubungi admin unit Pegadaian terkait untuk pengecekan manual.
          </div>
        </div>
      </section>
    </main>
  );
}

export function RegisterPage() {
  return (
    <main className="grid min-h-[100dvh] w-full overflow-hidden bg-[#03140d] text-white lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_12%,rgba(232,181,48,0.20),transparent_25%),radial-gradient(circle_at_88%_80%,rgba(23,155,91,0.20),transparent_30%),linear-gradient(145deg,#032216_0%,#062414_52%,#03150c_100%)] px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
        <div className="absolute -left-24 top-8 size-80 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-full bg-[radial-gradient(circle_at_0%_100%,rgba(13,143,83,0.28),transparent_52%)]" />
        <div className="relative w-full max-w-[650px]">
          <div className="mb-9 space-y-6">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-3xl border border-amber-200/18 bg-amber-200/10 text-amber-100">
                <Landmark className="size-6" />
              </span>
              <div>
                <p className="font-headline text-xl font-black leading-none tracking-tight">
                  Pegadaian Lelang
                </p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-100/58">
                  Registrasi pembeli
                </p>
              </div>
            </div>
            <div>
              <h1 className="font-headline text-4xl font-black tracking-tight xl:text-5xl">
                Buat akun pembeli baru
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-emerald-50/66">
                Satu akun untuk melihat katalog harga tetap, mengikuti Lelang Tertutup,
                memantau pembayaran, dan menyimpan riwayat transaksi.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-50/70">Menyiapkan formulir registrasi...</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </section>

      <section
        className="relative hidden min-h-[100dvh] overflow-hidden bg-center bg-cover p-12 text-white lg:flex lg:flex-col lg:justify-end lg:bg-[image:var(--register-hero-image)] xl:p-16"
        style={{
          "--register-hero-image":
            "linear-gradient(180deg, rgba(2, 15, 10, 0.08) 0%, rgba(2, 23, 13, 0.18) 38%, rgba(1, 13, 8, 0.90) 100%), linear-gradient(90deg, rgba(0, 54, 31, 0.18), rgba(44, 27, 8, 0.12)), url('/uploads/Gambar%20Wallpaper%20Register.png')"
        } as CSSProperties}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,207,91,0.22),transparent_26%),radial-gradient(circle_at_20%_14%,rgba(5,67,40,0.36),transparent_28%)]" />
        <div className="absolute left-12 top-12 flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[0.66rem] font-black uppercase tracking-[0.26em] text-white/86 backdrop-blur-md xl:left-16 xl:top-16">
          <Landmark className="size-3.5 text-amber-200" />
          Pegadaian Lelang
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(0deg,rgba(0,14,8,0.96)_0%,rgba(0,18,10,0.78)_46%,transparent_100%)]" />
        <div className="relative max-w-[680px] space-y-7">
          <h2 className="font-headline text-[clamp(3.05rem,5vw,5.35rem)] font-black leading-[0.96] tracking-[-0.055em]">
            Akses katalog, transaksi, dan nota dalam satu tempat.
          </h2>
          <div className="grid max-w-2xl grid-cols-3 gap-4">
            {[
              { label: "Harga tetap", value: "Beli" },
              { label: "Lelang Tertutup", value: "Bid" },
              { label: "Nota", value: "Arsip" }
            ].map((item) => (
              <div
                className="rounded-3xl border border-white/12 bg-white/[0.08] px-5 py-4 backdrop-blur-md"
                key={item.label}
              >
                <div className="font-headline text-2xl font-black tracking-tight text-amber-200">
                  {item.value}
                </div>
                <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-white/62">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
