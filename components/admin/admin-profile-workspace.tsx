"use client";

import Image from "next/image";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  PenLine,
  Phone,
  ShieldCheck
} from "lucide-react";

import { LoginHistoryDialog } from "@/components/buyer/login-history-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ADMIN_PROFILE_BACKGROUND_IMAGE = "/uploads/Gambar Background Halaman Profil Admin Unit.png";

export type AdminProfileData = {
  activeSessionCount: number;
  email: string;
  image?: string | null;
  joinedAt: string;
  name: string;
  pageDescription?: string;
  pageTitle?: string;
  passwordUpdatedAt: string;
  phone: string;
  profileEditHeading?: string;
  profileEndpoint?: string;
  profileSaveFeedback?: string;
  roleLabel: string;
  sessionHistory: string[];
  workspaceAddressLabel?: string;
  workspaceCodeLabel?: string;
  workspaceFieldLabel?: string;
  workspaceLabel?: string;
  workspacePhoneLabel?: string;
  workspaceSectionTitle?: string;
  accessHistoryDescription?: string;
  accessHistoryLabel?: string;
  unitAddress: string;
  unitCode: string;
  unitName: string;
  updatedAt: string;
};

type ActivePanel = "profile" | "password" | null;

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProfileCard({
  children,
  className,
  icon,
  id,
  title
}: {
  children: React.ReactNode;
  className?: string;
  icon: ReactNode;
  id?: string;
  title: string;
}) {
  return (
    <section className={cn("rounded-[2rem] border border-white/70 bg-white/82 p-2 shadow-[0_24px_76px_-58px_rgba(8,69,50,0.52)]", className)} id={id}>
      <div className="h-full rounded-[calc(2rem-0.5rem)] border border-[#0a6a49]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,252,249,0.9))] p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#0a6a49]/8 text-[#0a6a49]">
            {icon}
          </span>
          <h3 className="font-headline text-lg font-black tracking-[-0.02em] text-[#122018]">{title}</h3>
        </div>
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  accent = false
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-black/42">{label}</p>
      <div className={cn("text-sm font-semibold leading-6 text-[#13211c]", accent && "text-[#0a6a49]")}>{value}</div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-black/8 px-4 py-4 md:border-r last:md:border-r-0">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#eff6f2] text-[#0a6a49]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-black/46">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-[#13211c]">{value}</p>
      </div>
    </div>
  );
}

export function AdminProfileWorkspace({ profile }: { profile: AdminProfileData }) {
  const router = useRouter();
  const workspaceLabel = profile.workspaceLabel ?? "Unit Kerja";
  const workspaceFieldLabel = profile.workspaceFieldLabel ?? "Unit kerja";
  const workspaceCodeLabel = profile.workspaceCodeLabel ?? "Kode Unit";
  const workspaceAddressLabel = profile.workspaceAddressLabel ?? "Alamat Unit";
  const workspacePhoneLabel = profile.workspacePhoneLabel ?? "Telepon Unit";
  const workspaceSectionTitle = profile.workspaceSectionTitle ?? "Informasi Unit";
  const accessHistoryLabel = profile.accessHistoryLabel ?? "Akses admin unit";
  const accessHistoryDescription = profile.accessHistoryDescription ?? "Lihat riwayat akses admin";
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [profileForm, setProfileForm] = useState({
    address: profile.unitAddress,
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    unitName: profile.unitName
  });
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: "",
    currentPassword: "",
    newPassword: ""
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const initials = useMemo(() => getInitials(profileForm.name || profile.name), [profile.name, profileForm.name]);
  const profileEndpoint = profile.profileEndpoint ?? "/api/admin/profil";

  function saveProfile() {
    setFeedback(null);
    startProfileTransition(async () => {
      const response = await fetch(profileEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phoneNumber: profileForm.phone
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFeedback(payload.message ?? "Profil belum tersimpan. Periksa nama, email, dan nomor telepon.");
        return;
      }

      setFeedback(profile.profileSaveFeedback ?? "Profil akun sudah diperbarui di database.");
      router.refresh();
    });
  }

  return (
    <div className="relative -my-6 min-h-[calc(100dvh-4rem)] w-full overflow-hidden rounded-[2rem] bg-[#f5f8f5] py-6 sm:-my-8 sm:py-8 md:-my-10 md:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          alt=""
          className="h-full w-full object-cover opacity-65"
          fill
          priority
          sizes="100vw"
          src={ADMIN_PROFILE_BACKGROUND_IMAGE}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,248,245,0.72)_48%,rgba(245,248,245,0.92))]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] space-y-5 px-4 sm:px-5 md:space-y-6 lg:px-6">
        <section>
          <h1 className="font-headline text-3xl font-black tracking-[-0.04em] text-[#122018] md:text-4xl">
            {profile.pageTitle ?? "Profil Admin Unit"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/56 md:text-base">
            {profile.pageDescription ?? "Kelola informasi akun, akses keamanan, dan data unit kerja Anda."}
          </p>
        </section>

        <section className="rounded-[2.25rem] border border-white/75 bg-white/70 p-2 shadow-[0_34px_110px_-72px_rgba(6,66,46,0.68)]">
          <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] border border-[#0a6a49]/18 bg-[#023d31] p-5 text-white md:p-7">
            <Image
              alt=""
              className="object-cover opacity-70 mix-blend-screen"
              fill
              priority
              sizes="100vw"
              src={ADMIN_PROFILE_BACKGROUND_IMAGE}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,61,49,0.94),rgba(3,86,63,0.78)_52%,rgba(2,61,49,0.62))]" />
            <div className="absolute -right-20 -top-24 size-64 rounded-full border border-[#d8ad38]/45" />
            <div className="absolute bottom-0 right-8 h-px w-1/2 bg-gradient-to-r from-transparent via-[#d8ad38]/70 to-transparent" />

            <div className="relative grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_14rem] lg:items-center">
              <div className="relative grid size-28 shrink-0 place-items-center rounded-[2rem] border-4 border-white/88 bg-white text-3xl font-black text-[#0a6a49] shadow-[0_24px_62px_-38px_rgba(0,0,0,0.8)] md:size-32">
                {profile.image ? (
                  <Image alt={profile.name} className="rounded-[1.65rem] object-cover" fill sizes="128px" src={profile.image} />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-[3px] border-white bg-[#0a6a49] text-white">
                  <CheckCircle2 className="size-4" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-headline text-2xl font-black tracking-[-0.03em] md:text-3xl">{profileForm.name}</h2>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#d8ad38]/45 bg-[#d8ad38]/12 px-3 py-1.5 text-xs font-bold text-[#f4d675]">
                    <ShieldCheck className="size-3.5" />
                    {profile.roleLabel}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-white/88 sm:grid-cols-2">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Mail className="size-4 shrink-0 text-white/72" />
                    <span className="truncate">{profileForm.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-white/72" />
                    {profileForm.phone || "-"}
                  </span>
                  <span className="inline-flex items-center gap-2 sm:col-span-2">
                    <CalendarDays className="size-4 shrink-0 text-white/72" />
                    Bergabung sejak {profile.joinedAt}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 lg:border-l lg:border-white/15 lg:pl-5">
                <Button
                  className="h-12 justify-center rounded-2xl bg-white text-[#0a6a49] shadow-[0_18px_42px_-28px_rgba(0,0,0,0.7)] hover:bg-[#f3fbf6]"
                  onClick={() => {
                    setFeedback(null);
                    setActivePanel((current) => (current === "profile" ? null : "profile"));
                  }}
                  type="button"
                >
                  <PenLine className="size-4" />
                  Edit Profil
                </Button>
                <Button
                  className="h-12 justify-center rounded-2xl border-white/25 bg-white/12 text-white hover:bg-white/18"
                  onClick={() => {
                    setFeedback(null);
                    setActivePanel((current) => (current === "password" ? null : "password"));
                  }}
                  type="button"
                  variant="ghost"
                >
                  <LockKeyhole className="size-4" />
                  Ubah Password
                </Button>
              </div>
            </div>
          </div>
        </section>

        {activePanel === "profile" ? (
          <section className="rounded-[2rem] border border-white/70 bg-white/82 p-2 shadow-[0_24px_76px_-58px_rgba(8,69,50,0.5)]">
            <div className="rounded-[calc(2rem-0.5rem)] border border-[#0a6a49]/10 bg-white/92 p-5 md:p-6">
              <div className="mb-5">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#0a6a49]/55">Edit Profil</p>
                <h3 className="font-headline text-2xl font-black tracking-[-0.03em] text-[#122018]">{profile.profileEditHeading ?? "Perbarui informasi admin unit"}</h3>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-profile-name">Nama admin</label>
                  <Input id="admin-profile-name" className="h-12 rounded-2xl bg-white" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-profile-phone">Nomor telepon</label>
                  <Input id="admin-profile-phone" className="h-12 rounded-2xl bg-white" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-profile-unit">{workspaceFieldLabel}</label>
                  <Input id="admin-profile-unit" className="h-12 rounded-2xl bg-white" value={profileForm.unitName} onChange={(event) => setProfileForm((current) => ({ ...current, unitName: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-profile-email">Email kerja</label>
                  <Input
                    id="admin-profile-email"
                    autoComplete="email"
                    className="h-12 rounded-2xl bg-white"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-profile-address">{workspaceAddressLabel}</label>
                  <Textarea id="admin-profile-address" className="min-h-28 rounded-2xl bg-white" value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} />
                </div>
              </div>
              <Button className="mt-5 h-12 rounded-2xl px-5" disabled={isProfilePending} type="button" onClick={saveProfile}>
                <PenLine className="size-4" />
                {isProfilePending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </section>
        ) : null}

        {activePanel === "password" ? (
          <section className="rounded-[2rem] border border-white/70 bg-white/82 p-2 shadow-[0_24px_76px_-58px_rgba(8,69,50,0.5)]">
            <div className="rounded-[calc(2rem-0.5rem)] border border-[#0a6a49]/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(242,250,244,0.88))] p-5 md:p-6">
              <div className="mb-5">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#0a6a49]/55">Keamanan</p>
                <h3 className="font-headline text-2xl font-black tracking-[-0.03em] text-[#122018]">Ubah kata sandi</h3>
                <p className="mt-2 text-sm leading-6 text-black/56">Gunakan kata sandi baru yang kuat untuk menjaga akses operasional unit.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-current-password">Kata sandi saat ini</label>
                  <Input id="admin-current-password" className="h-12 rounded-2xl bg-white" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-new-password">Kata sandi baru</label>
                  <Input id="admin-new-password" className="h-12 rounded-2xl bg-white" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="admin-confirm-password">Konfirmasi</label>
                  <Input id="admin-confirm-password" className="h-12 rounded-2xl bg-white" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
                </div>
              </div>
              <Button className="mt-5 h-12 rounded-2xl px-5" type="button" variant="secondary" onClick={() => setFeedback("Permintaan perubahan kata sandi sudah disiapkan.")}>
                <KeyRound className="size-4" />
                Perbarui Kata Sandi
              </Button>
            </div>
          </section>
        ) : null}

        {feedback ? (
          <div className="rounded-[1.4rem] border border-[#0a6a49]/15 bg-[#e9f6ef] px-4 py-3 text-sm font-semibold text-[#075f42]">
            {feedback}
          </div>
        ) : null}

        <section className="grid overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/86 shadow-[0_22px_68px_-56px_rgba(8,69,50,0.5)] md:grid-cols-4">
          <InfoTile icon={<Building2 className="size-5" />} label={workspaceLabel} value={profileForm.unitName} />
          <InfoTile icon={<BadgeCheck className="size-5" />} label="Peran" value={profile.roleLabel} />
          <InfoTile icon={<Clock3 className="size-5" />} label="Terakhir Ubah" value={profile.updatedAt} />
          <InfoTile icon={<CalendarDays className="size-5" />} label="Bergabung Sejak" value={profile.joinedAt} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <ProfileCard icon={<Building2 className="size-5" />} title={workspaceSectionTitle}>
            <div className="space-y-5">
              <DetailRow label={workspaceLabel} value={profileForm.unitName} />
              <DetailRow label={workspaceCodeLabel} value={profile.unitCode} />
              <DetailRow label={workspaceAddressLabel} value={profileForm.address} />
              <DetailRow accent label={workspacePhoneLabel} value={profileForm.phone || "-"} />
            </div>
          </ProfileCard>

          <ProfileCard icon={<ShieldCheck className="size-5" />} id="panduan" title="Keamanan & Akses">
            <div className="space-y-3">
              <div className="rounded-[1.35rem] border border-[#0a6a49]/10 bg-[linear-gradient(180deg,#ffffff,#f8fbf8)] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#0a6a49]/8 text-[#0a6a49]">
                      <LockKeyhole className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#122018]">Password</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-black/54 pl-[3.25rem] sm:pl-0 sm:text-right">
                    {profile.passwordUpdatedAt === "-" ? "Belum ada riwayat perubahan" : `Terakhir diubah ${profile.passwordUpdatedAt}`}
                  </p>
                </div>
              </div>
              <LoginHistoryDialog
                accessLabel={accessHistoryLabel}
                activeSessionCount={profile.activeSessionCount}
                description={accessHistoryDescription}
                entries={profile.sessionHistory}
              />
            </div>
          </ProfileCard>
        </section>
      </div>
    </div>
  );
}
