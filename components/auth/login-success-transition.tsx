"use client";

import { Check, LogOut } from "lucide-react";
import type { CSSProperties } from "react";

export function LoginSuccessTransition() {
  const confetti = [
    "left-[13%] top-[18%] rotate-[-16deg] bg-amber-300",
    "left-[23%] top-[31%] rotate-[19deg] bg-emerald-500",
    "left-[74%] top-[17%] rotate-[31deg] bg-yellow-500",
    "left-[83%] top-[38%] rotate-[-24deg] bg-emerald-400",
    "left-[18%] top-[67%] rotate-[28deg] bg-yellow-600",
    "left-[78%] top-[72%] rotate-[-12deg] bg-amber-200"
  ];

  return (
    <div
      aria-live="polite"
      className="auth-success-stage fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#eef6ef] px-5 text-[#063d2b]"
      role="status"
    >
      <div className="auth-success-aurora pointer-events-none absolute inset-0" />
      <div className="auth-success-grid pointer-events-none absolute inset-0" />
      <div className="auth-success-city pointer-events-none absolute inset-x-0 bottom-0 h-40" />

      <div className="auth-success-card relative w-full max-w-[31rem] overflow-hidden rounded-[2.25rem] border border-emerald-900/10 bg-white/88 px-7 py-8 text-center shadow-[0_28px_90px_rgba(3,61,43,0.22)] backdrop-blur-2xl sm:px-10">
        <div className="auth-success-card-sheen pointer-events-none absolute inset-0" />

        {confetti.map((className, index) => (
          <span
            aria-hidden="true"
            className={`auth-success-confetti absolute h-3 w-1.5 rounded-full ${className}`}
            key={className}
            style={{ "--confetti-index": index } as CSSProperties}
          />
        ))}

        <div className="auth-success-medallion relative mx-auto mb-6 flex size-32 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#5df39b,#08764f_54%,#03442f)] shadow-[inset_0_2px_18px_rgba(255,255,255,0.42),0_20px_52px_rgba(6,92,60,0.34)] ring-8 ring-emerald-100/90">
          <div className="auth-success-seal relative z-[1] grid size-[5.6rem] place-items-center rounded-full bg-white/12 ring-1 ring-white/24">
            <Check aria-hidden="true" className="auth-success-check size-16 text-white" strokeWidth={3.2} />
          </div>
        </div>

        <p className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.36em] text-emerald-900/52">
          Akses terverifikasi
        </p>
        <h2 className="text-4xl font-black tracking-[-0.04em] text-[#063d2b] sm:text-5xl">
          Login Berhasil
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-emerald-950/64">
          Selamat datang kembali. Akun Anda siap digunakan dan Anda akan segera masuk ke beranda utama.
        </p>

        <div className="mt-7 overflow-hidden rounded-full bg-emerald-950/10 p-1">
          <div className="auth-success-progress h-3 rounded-full bg-[linear-gradient(90deg,#006b45,#22b76f,#d8ad38,#006b45)]" />
        </div>
        <p className="mt-3 text-xs font-semibold text-emerald-950/54">
          Mohon tunggu sebentar, kami sedang mengarahkan Anda.
        </p>
      </div>
    </div>
  );
}

export function LogoutSuccessTransition() {
  const particles = [
    "left-[15%] top-[20%] bg-amber-300",
    "left-[28%] top-[30%] bg-emerald-500",
    "left-[74%] top-[22%] bg-amber-400",
    "left-[84%] top-[34%] bg-emerald-400",
    "left-[20%] top-[72%] bg-emerald-200",
    "left-[76%] top-[74%] bg-amber-200"
  ];

  return (
    <div
      aria-live="polite"
      className="auth-logout-stage fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f7f5ef] px-5 text-[#0b513f]"
      role="status"
    >
      <div className="auth-logout-aurora pointer-events-none absolute inset-0" />
      <div className="auth-logout-rings pointer-events-none absolute inset-0" />
      <div className="auth-logout-landscape pointer-events-none absolute inset-x-0 bottom-0 h-44" />

      <div className="auth-logout-card relative w-full max-w-[28rem] overflow-hidden rounded-[2.35rem] border border-[#dcd9cb] bg-white/92 px-7 py-8 text-center shadow-[0_26px_80px_rgba(61,87,73,0.14)] backdrop-blur-xl sm:px-10">
        <div className="auth-logout-card-sheen pointer-events-none absolute inset-0" />

        {particles.map((className, index) => (
          <span
            aria-hidden="true"
            className={`auth-logout-particle absolute h-2.5 w-2.5 rounded-[4px] ${className}`}
            key={className}
            style={{ "--logout-particle-index": index } as CSSProperties}
          />
        ))}

        <div className="auth-logout-medallion relative mx-auto mb-6 flex size-32 items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.98),rgba(248,250,247,0.96)_55%,rgba(223,235,229,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_45px_rgba(76,112,93,0.14)] ring-8 ring-white/80">
          <div className="auth-logout-icon-shell relative z-[1] grid size-24 place-items-center rounded-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_rgba(11,81,63,0.08)] ring-1 ring-[#dbe7df]">
            <LogOut aria-hidden="true" className="auth-logout-icon size-12 text-[#0b7a61]" strokeWidth={2.3} />
          </div>
        </div>

        <h2 className="text-[2.2rem] font-black tracking-[-0.04em] text-[#0b513f] sm:text-5xl">
          Logout Berhasil
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#42685b]">
          Sesi Anda sudah ditutup dengan aman. Anda akan kembali ke halaman masuk dalam beberapa saat.
        </p>

        <div className="auth-logout-pill mt-8 inline-flex items-center justify-center rounded-full border border-[#a9c9ba] bg-white/88 px-7 py-3 text-sm font-bold text-[#0b6b54] shadow-[0_10px_24px_rgba(11,81,63,0.08)]">
          Sampai jumpa kembali
        </div>

        <div className="mt-7 overflow-hidden rounded-full bg-[#dce8e1] p-1">
          <div className="auth-success-progress h-2.5 rounded-full bg-[linear-gradient(90deg,#0b7a61,#41b883,#d8ad38,#0b7a61)]" />
        </div>
      </div>
    </div>
  );
}
