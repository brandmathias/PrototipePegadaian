"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  PenLine,
  ShieldCheck,
  UploadCloud,
  UserRound
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BuyerProfileSettingsFormProps = {
  initialName: string;
  email: string;
  initialPhone: string;
  initialNationalId: string;
  initialImage?: string | null;
  memberSince: string;
  restrictionLabel: string;
  hasRestriction: boolean;
};

type ProfilePanel = "profile" | "password" | null;

function getProfileInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "BD";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function shouldSkipImageOptimization(src: string) {
  return src.startsWith("data:") || src.startsWith("blob:");
}

async function resizeProfileImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Pilih file gambar PNG, JPG, atau WebP.");
  }

  if (file.size > 5_000_000) {
    throw new Error("Ukuran foto maksimal 5 MB.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = document.createElement("img");
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Foto profil tidak dapat dibaca."));
      element.src = objectUrl;
    });
    const maxSide = 320;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Browser tidak dapat memproses foto profil.");
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function BuyerProfileSettingsForm({
  initialName,
  email,
  initialPhone,
  initialNationalId,
  initialImage,
  memberSince,
  restrictionLabel,
  hasRestriction
}: BuyerProfileSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activePanel, setActivePanel] = useState<ProfilePanel>(null);
  const [avatarImage, setAvatarImage] = useState(initialImage ?? "");
  const [profile, setProfile] = useState({
    name: initialName,
    email,
    phoneNumber: initialPhone,
    nationalId: initialNationalId,
    image: initialImage ?? null
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileFeedback, setProfileFeedback] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  function updateProfileField(field: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updatePasswordField(field: keyof typeof password, value: string) {
    setPassword((current) => ({ ...current, [field]: value }));
  }

  function getProfileUpdatePayload(nextProfile = profile, includeImage = false) {
    return {
      name: nextProfile.name,
      ...(includeImage && nextProfile.image !== undefined ? { image: nextProfile.image } : {})
    };
  }

  function saveProfile(
    nextProfile = profile,
    successCopy = "Username pembeli sudah diperbarui.",
    options: { includeImage?: boolean } = {}
  ) {
    setProfileFeedback(null);
    startProfileTransition(async () => {
      const response = await fetch("/api/user/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getProfileUpdatePayload(nextProfile, options.includeImage))
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const description = payload.message ?? "Periksa kembali username dan foto profil.";
        setProfileFeedback({
          title: "Profil belum tersimpan",
          description,
          variant: "error"
        });
        toast({
          title: "Profil belum tersimpan",
          description,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      setProfileFeedback({
        title: "Profil tersimpan",
        description: successCopy,
        variant: "success"
      });
      toast({
        title: "Profil diperbarui",
        description: successCopy,
        variant: "success",
        scope: "buyer"
      });
      router.refresh();
    });
  }

  async function handleAvatarUpload(file?: File) {
    if (!file) return;

    setProfileFeedback({
      title: "Mengolah foto profil",
      description: "Foto sedang dirapikan agar ringan dan tajam saat ditampilkan.",
      variant: "info"
    });

    try {
      const image = await resizeProfileImage(file);
      const nextProfile = { ...profile, image };
      setAvatarImage(image);
      setProfile(nextProfile);
      saveProfile(nextProfile, "Foto profil baru sudah tersimpan.", { includeImage: true });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Foto profil belum dapat diunggah.";
      setProfileFeedback({
        title: "Foto belum tersimpan",
        description,
        variant: "error"
      });
      toast({
        title: "Foto belum tersimpan",
        description,
        variant: "error",
        scope: "buyer"
      });
    }
  }

  function changePassword() {
    setPasswordFeedback(null);
    if (password.newPassword !== password.confirmPassword) {
      setPasswordFeedback({
        title: "Konfirmasi belum cocok",
        description: "Samakan kata sandi baru dan konfirmasinya sebelum menyimpan.",
        variant: "error"
      });
      toast({
        title: "Konfirmasi kata sandi belum cocok",
        description: "Samakan kata sandi baru dan konfirmasinya sebelum menyimpan.",
        variant: "error",
        scope: "buyer"
      });
      return;
    }

    startPasswordTransition(async () => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
          revokeOtherSessions: false
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const description =
          payload.message ?? "Pastikan kata sandi saat ini benar dan kata sandi baru minimal 8 karakter.";
        setPasswordFeedback({
          title: "Kata sandi belum berubah",
          description,
          variant: "error"
        });
        toast({
          title: "Kata sandi belum berubah",
          description,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordFeedback({
        title: "Kata sandi diperbarui",
        description: "Akses akun sudah memakai kata sandi baru.",
        variant: "success"
      });
      toast({
        title: "Kata sandi diperbarui",
        description: "Kata sandi akun pembeli berhasil diganti.",
        variant: "success",
        scope: "buyer"
      });
    });
  }

  const initials = getProfileInitials(profile.name);

  return (
    <div className="space-y-4">
      <div className="rounded-[2.25rem] border border-white/70 bg-white/75 p-2 shadow-[0_32px_110px_-72px_rgba(5,56,38,0.65)] ring-1 ring-primary/5">
        <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] border border-primary/10 bg-[linear-gradient(120deg,rgba(255,255,255,0.94),rgba(245,250,246,0.82)_58%,rgba(255,248,223,0.78))] p-5 md:p-6">
          <div className="absolute -right-20 -top-24 size-56 rounded-full bg-[#d8ad38]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="relative grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                aria-label="Unggah foto profil"
                className="group relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_35%_22%,#effaf1,#b7dcc1_58%,#0b6a45)] text-4xl font-black tracking-[-0.08em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_24px_56px_-40px_rgba(8,69,50,0.88)] ring-1 ring-primary/15 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.98] md:size-32 md:text-5xl"
                disabled={isProfilePending}
                onClick={() => avatarInputRef.current?.click()}
                type="button"
              >
                {avatarImage ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    loading="eager"
                    sizes="(max-width: 768px) 7rem, 8rem"
                    src={avatarImage}
                    unoptimized={shouldSkipImageOptimization(avatarImage)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] text-primary opacity-0 shadow-[0_16px_36px_-28px_rgba(5,56,38,0.8)] transition duration-500 group-hover:opacity-100">
                  {isProfilePending ? <LoaderCircle className="button-spinner size-3" /> : <Camera className="size-3" />}
                  Foto
                </span>
              </button>
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
                ref={avatarInputRef}
                type="file"
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-headline text-3xl font-black tracking-[-0.045em] text-foreground md:text-4xl">
                {profile.name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Mail className="size-4 text-primary/60" />
                  <span className="break-all">{profile.email}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary/60" />
                  Member sejak {memberSince}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary" variant="default">
                  <UserRound className="size-3.5" />
                  Buyer
                </Badge>
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1.5",
                    hasRestriction ? "bg-amber-50 text-amber-900" : "bg-surface-low text-foreground"
                  )}
                  variant="muted"
                >
                  {hasRestriction ? <LockKeyhole className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                  {restrictionLabel}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 border-primary/10 lg:min-w-56 lg:border-l lg:pl-6">
              <Button
                className="h-12 justify-center rounded-2xl shadow-[0_18px_38px_-30px_rgba(8,69,50,0.9)]"
                onClick={() => setActivePanel((current) => (current === "profile" ? null : "profile"))}
                type="button"
              >
                <PenLine className="size-4" />
                Edit Profil
              </Button>
              <Button
                className="h-12 justify-center rounded-2xl bg-white/80"
                onClick={() => setActivePanel((current) => (current === "password" ? null : "password"))}
                type="button"
                variant="secondary"
              >
                <LockKeyhole className="size-4" />
                Ubah Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      {activePanel === "profile" ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-2 shadow-[0_22px_70px_-56px_rgba(8,69,50,0.58)]">
          <div className="rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-white/90 p-5 md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary/50">
                  Edit Profil
                </p>
                <h3 className="font-headline text-2xl font-black tracking-[-0.03em] text-foreground">
                  Perbarui username
                </h3>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-4 py-2 text-sm font-semibold text-primary transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-primary/10"
                onClick={() => avatarInputRef.current?.click()}
                type="button"
              >
                <UploadCloud className="size-4" />
                Ganti foto
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="buyer-profile-name">
                  Username
                </label>
                <Input
                  autoComplete="name"
                  className="h-12 rounded-2xl bg-white/90"
                  id="buyer-profile-name"
                  name="name"
                  onChange={(event) => updateProfileField("name", event.target.value)}
                  value={profile.name}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="buyer-profile-email">
                  Email
                </label>
                <Input
                  autoComplete="email"
                  className="h-12 rounded-2xl border-primary/10 bg-surface-low/80 text-muted-foreground"
                  disabled
                  id="buyer-profile-email"
                  name="email"
                  value={profile.email}
                />
                <p className="text-xs font-semibold leading-5 text-muted-foreground">
                  Email terkunci untuk audit pelanggaran dan verifikasi akun.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="buyer-profile-phone">
                  Nomor telepon
                </label>
                <Input
                  autoComplete="tel"
                  className="h-12 rounded-2xl border-primary/10 bg-surface-low/80 text-muted-foreground"
                  disabled
                  id="buyer-profile-phone"
                  name="phoneNumber"
                  value={profile.phoneNumber}
                />
                <p className="text-xs font-semibold leading-5 text-muted-foreground">
                  Nomor telepon terkunci agar riwayat transaksi tetap konsisten.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="buyer-profile-national-id">
                  Nomor KTP
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-2xl border-primary/10 bg-surface-low/80 text-muted-foreground"
                  disabled
                  id="buyer-profile-national-id"
                  inputMode="numeric"
                  name="nationalId"
                  value={profile.nationalId}
                />
                <p className="text-xs font-semibold leading-5 text-muted-foreground">
                  NIK terkunci sebagai identitas utama fitur pelanggaran.
                </p>
              </div>
              <div className="md:col-span-2">
                <Button
                  className="h-12 rounded-2xl px-5"
                  disabled={!isHydrated || isProfilePending}
                  onClick={() => saveProfile()}
                  type="button"
                >
                  {isProfilePending ? (
                    <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                  ) : (
                    <PenLine aria-hidden="true" className="size-4" />
                  )}
                  {!isHydrated ? "Menyiapkan..." : isProfilePending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
                {profileFeedback ? (
                  <InlineFeedback
                    className="feedback-lift mt-4"
                    description={profileFeedback.description}
                    title={profileFeedback.title}
                    variant={profileFeedback.variant}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activePanel === "password" ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-2 shadow-[0_22px_70px_-56px_rgba(8,69,50,0.58)]">
          <div className="rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.88),rgba(246,251,246,0.76))] p-5 md:p-6">
            <div className="mb-5">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary/50">
                Keamanan
              </p>
              <h3 className="font-headline text-2xl font-black tracking-[-0.03em] text-foreground">
                Ubah kata sandi
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Gunakan kata sandi baru yang kuat untuk menjaga akses transaksi dan nota tetap aman.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="buyer-current-password">
                  Kata sandi saat ini
                </label>
                <Input
                  autoComplete="current-password"
                  className="h-12 rounded-2xl bg-white/90"
                  id="buyer-current-password"
                  name="currentPassword"
                  onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
                  type="password"
                  value={password.currentPassword}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="buyer-new-password">
                  Kata sandi baru
                </label>
                <Input
                  autoComplete="new-password"
                  className="h-12 rounded-2xl bg-white/90"
                  id="buyer-new-password"
                  name="newPassword"
                  onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                  type="password"
                  value={password.newPassword}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="buyer-confirm-password">
                  Konfirmasi
                </label>
                <Input
                  autoComplete="new-password"
                  className="h-12 rounded-2xl bg-white/90"
                  id="buyer-confirm-password"
                  name="confirmPassword"
                  onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                  type="password"
                  value={password.confirmPassword}
                />
              </div>
              <div className="md:col-span-3">
                <Button
                  className="h-12 rounded-2xl px-5"
                  disabled={!isHydrated || isPasswordPending}
                  onClick={changePassword}
                  type="button"
                  variant="secondary"
                >
                  {isPasswordPending ? (
                    <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                  ) : (
                    <KeyRound aria-hidden="true" className="size-4" />
                  )}
                  {!isHydrated ? "Menyiapkan..." : isPasswordPending ? "Memperbarui..." : "Perbarui Kata Sandi"}
                </Button>
                {passwordFeedback ? (
                  <InlineFeedback
                    className="feedback-lift mt-4"
                    description={passwordFeedback.description}
                    title={passwordFeedback.title}
                    variant={passwordFeedback.variant}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
