import { Suspense, type CSSProperties } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandLockup } from "@/components/shared/brand";

const LOGIN_HERO_IMAGE =
  "linear-gradient(180deg, rgba(2, 15, 10, 0.04) 0%, rgba(2, 23, 13, 0.22) 42%, rgba(1, 13, 8, 0.92) 100%), linear-gradient(90deg, rgba(44, 27, 8, 0.12), rgba(0, 54, 31, 0.22)), image-set(url('/assets/login-wallpaper-lcp.avif') type('image/avif'), url('/assets/login-wallpaper-lcp.webp') type('image/webp'), url('/uploads/Gambar%20Wallpaper%20Login.png') type('image/png'))";

function LoginBrandCluster() {
  return (
    <div className="relative inline-flex max-w-full flex-col gap-5">
      <div className="pointer-events-none absolute -left-7 -top-3 h-24 w-24 rounded-full bg-[#f0d287]/24 blur-3xl" />
      <div className="pointer-events-none absolute -left-5 -top-4 h-24 w-[24rem] rounded-full bg-[radial-gradient(circle_at_24%_50%,rgba(249,243,230,0.34),rgba(249,243,230,0.18)_36%,transparent_72%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-3 top-0 h-16 rounded-full bg-[linear-gradient(90deg,rgba(247,241,227,0.32),rgba(247,241,227,0.12),transparent_78%)] blur-2xl" />
      <div className="pointer-events-none absolute -left-1 top-4 h-16 w-[20rem] bg-[linear-gradient(90deg,rgba(240,210,135,0.22),rgba(240,210,135,0.08),transparent_78%)] blur-xl" />
      <BrandLockup
        className="relative z-[1] max-w-full drop-shadow-[0_20px_32px_rgba(0,0,0,0.24)]"
        markClassName="size-[3.75rem]"
        nameClassName="h-[3.1rem] max-w-[19.5rem] brightness-[1.08] contrast-[1.08]"
      />
      <span className="relative z-[1] ml-1 h-px w-36 bg-[linear-gradient(90deg,rgba(240,210,135,0.92),rgba(240,210,135,0.24),transparent)]" />
    </div>
  );
}

export function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] w-full overflow-hidden bg-[#03140d] text-white lg:grid-cols-[1.08fr_0.92fr]">
      <section
        className="relative hidden min-h-[100dvh] overflow-hidden bg-center bg-cover p-12 text-white lg:flex lg:flex-col lg:justify-end lg:bg-[image:var(--login-hero-image)] xl:p-16"
        style={{
          "--login-hero-image": LOGIN_HERO_IMAGE
        } as CSSProperties}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,207,91,0.24),transparent_26%),radial-gradient(circle_at_80%_14%,rgba(5,67,40,0.38),transparent_28%)]" />
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
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_92%_10%,rgba(232,181,48,0.24),transparent_26%),radial-gradient(circle_at_14%_86%,rgba(23,155,91,0.22),transparent_30%),linear-gradient(145deg,#04331e_0%,#062414_44%,#03150c_100%)] px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
        <div className="absolute -right-28 top-10 size-80 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-full bg-[radial-gradient(circle_at_100%_100%,rgba(13,143,83,0.30),transparent_52%)]" />
        <div className="absolute inset-y-0 left-0 hidden w-px bg-white/10 lg:block" />

        <div className="relative w-full max-w-[560px]">
          <div className="mb-9 space-y-6">
            <LoginBrandCluster />
            <div>
              <h2 className="font-headline text-4xl font-black tracking-tight xl:text-5xl">
                Masuk ke akun Anda
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-emerald-50/66">
                Masuk untuk menjelajahi katalog aset pilihan, memantau proses penawaran lelang, dan mengelola seluruh transaksi secara aman.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-50/70">Menyiapkan formulir masuk...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
