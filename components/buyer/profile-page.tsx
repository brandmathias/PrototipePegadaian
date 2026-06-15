import Image from "next/image";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  IdCard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  UserRound
} from "lucide-react";

import { LoginHistoryDialog } from "@/components/buyer/login-history-dialog";
import { BuyerProfileSettingsForm } from "@/components/buyer/profile-settings-form";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerProfileSummary } from "@/lib/services/buyer.service";
import { cn } from "@/lib/utils";

const BUYER_PROFILE_BACKGROUND_IMAGE = "/uploads/Gambar Background Halaman Profil.png";

function getBuyerPhone(buyer: BuyerSessionUser, summaryPhone?: string) {
  return buyer.phoneNumber ?? summaryPhone ?? "-";
}

function ProfileDetailCard({
  icon,
  title,
  children,
  className
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-white/70 bg-white/80 p-2 shadow-[0_28px_90px_-64px_rgba(8,69,50,0.58)] ring-1 ring-primary/5",
        className
      )}
    >
      <div className="h-full rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-white/90 p-5 md:p-6">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <span className="grid size-11 place-items-center rounded-[1.1rem] bg-primary/[0.08] text-primary">
            {icon}
          </span>
          <h3 className="font-headline text-lg font-black tracking-[-0.02em] text-foreground">
            {title}
          </h3>
        </div>
        <div className="mt-5 space-y-5">{children}</div>
      </div>
    </div>
  );
}

function ProfileDetailRow({
  label,
  value,
  accent
}: {
  label: string;
  value: ReactNode;
  accent?: "success" | "warning";
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(8rem,0.75fr)_minmax(0,1fr)] sm:items-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "min-w-0 break-words text-sm font-semibold leading-6 text-foreground",
          accent === "success" ? "text-primary" : null,
          accent === "warning" ? "text-amber-800" : null
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function ProfilePage({
  buyer,
  summary
}: {
  buyer: BuyerSessionUser;
  summary: BuyerProfileSummary;
}) {
  const displayName = summary.name ?? buyer.name;
  const displayEmail = summary.email ?? buyer.email;
  const phone = summary.phone && summary.phone !== "-" ? summary.phone : getBuyerPhone(buyer, summary.phone);
  const nationalId = summary.nationalId ?? "-";
  const hasRestriction = summary.blacklist.active;
  const restrictionLabel = hasRestriction ? "Pembatasan aktif" : "Tidak ada pembatasan";

  return (
    <div className="relative left-1/2 -my-8 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 overflow-hidden bg-[#f8f4ea] py-8 md:-my-10 md:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          alt=""
          className="h-full w-full object-fill"
          fill
          quality={60}
          sizes="100vw"
          src={BUYER_PROFILE_BACKGROUND_IMAGE}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.30)_0%,rgba(255,255,255,0.22)_24%,rgba(248,244,234,0.55)_62%,rgba(248,244,234,0.82)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_6%,rgba(8,91,62,0.08),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(216,173,56,0.11),transparent_26%)]" />
      </div>

      <div className="container relative space-y-6 md:space-y-7">
        <section className="space-y-3">
          <p className="inline-flex rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.24em] text-primary shadow-[0_14px_38px_-30px_rgba(8,69,50,0.55)]">
            Profil Pembeli
          </p>
          <div className="max-w-3xl">
            <h1 className="font-headline text-4xl font-black tracking-[-0.045em] text-[#13211c] md:text-5xl">
              Profil Saya
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Kelola informasi akun, keamanan, foto profil, dan status pembatasan dari satu halaman yang ringkas.
            </p>
          </div>
        </section>

        <section>
          <BuyerProfileSettingsForm
            email={displayEmail}
            hasRestriction={hasRestriction}
            initialImage={summary.image}
            initialName={displayName}
            initialNationalId={summary.nationalId ?? ""}
            initialPhone={phone}
            memberSince={summary.memberSince}
            restrictionLabel={restrictionLabel}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <ProfileDetailCard icon={<UserRound className="size-5" />} title="Informasi Pribadi">
            <ProfileDetailRow label="Nama Lengkap" value={displayName} />
            <ProfileDetailRow label="Email" value={displayEmail} />
            <ProfileDetailRow label="Nomor Telepon" value={phone} />
            <ProfileDetailRow label="Nomor KTP" value={nationalId} />
          </ProfileDetailCard>

          <ProfileDetailCard icon={<ShieldCheck className="size-5" />} title="Keamanan & Akses">
            <div className="space-y-3">
              <div className="rounded-[1.35rem] border border-primary/10 bg-[linear-gradient(180deg,#ffffff,#f8fbf8)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                      <LockKeyhole className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Password</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {summary.security.passwordUpdatedAt === "-"
                      ? "Belum ada riwayat perubahan"
                      : `Terakhir diubah ${summary.security.passwordUpdatedAt}`}
                  </p>
                </div>
              </div>

              <LoginHistoryDialog
                activeSessionCount={summary.security.activeSessionCount}
                entries={summary.security.sessionHistory}
              />
            </div>
          </ProfileDetailCard>

          <ProfileDetailCard icon={<IdCard className="size-5" />} title="Pembatasan & Riwayat">
            <ProfileDetailRow
              accent={hasRestriction ? "warning" : "success"}
              label="Status Pembatasan"
              value={
                <span className="inline-flex items-center gap-2">
                  {hasRestriction ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                  {restrictionLabel}
                </span>
              }
            />
            <ProfileDetailRow label="Sisa Waktu Pembatasan" value={hasRestriction ? summary.blacklist.until : "-"} />
            <ProfileDetailRow
              label="Riwayat Pelanggaran"
              value={summary.blacklist.violations > 0 ? `${summary.blacklist.violations} kali` : "Tidak ada pelanggaran"}
            />
          </ProfileDetailCard>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/70 p-2 shadow-[0_22px_70px_-58px_rgba(8,69,50,0.5)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-white/75 p-5 md:flex-row md:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ReceiptText className="size-5" />
            </span>
            <div className="min-w-0 md:border-l md:border-primary/10 md:pl-5">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary/50">
                Catatan Penting
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Pastikan data identitas selalu akurat. Informasi ini dipakai untuk pembayaran,
                pengambilan barang, nota transaksi, dan verifikasi jika terjadi pembatasan akun.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
