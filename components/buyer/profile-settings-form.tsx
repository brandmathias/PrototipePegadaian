"use client";

import { useEffect, useState, useTransition } from "react";
import { KeyRound, LoaderCircle, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type BuyerProfileSettingsFormProps = {
  initialName: string;
  email: string;
  initialPhone: string;
  initialNationalId: string;
};

export function BuyerProfileSettingsForm({
  initialName,
  email,
  initialPhone,
  initialNationalId
}: BuyerProfileSettingsFormProps) {
  const { toast } = useToast();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isHydrated, setIsHydrated] = useState(false);
  const [profile, setProfile] = useState({
    name: initialName,
    phoneNumber: initialPhone,
    nationalId: initialNationalId
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

  function saveProfile() {
    setProfileFeedback(null);
    startProfileTransition(async () => {
      const response = await fetch("/api/user/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const description = payload.message ?? "Periksa kembali nama, nomor telepon, dan NIK.";
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
        description: "Data pembeli sudah diperbarui di akun dan profil database.",
        variant: "success"
      });
      toast({
        title: "Profil diperbarui",
        description: "Data pembeli sudah tersimpan ke database.",
        variant: "success",
        scope: "buyer"
      });
    });
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
        description: "Akun pembeli tetap aktif dan kata sandi baru sudah tersimpan.",
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

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-white/60 bg-white/72 p-2 shadow-[0_24px_70px_-52px_rgba(8,69,50,0.52)] backdrop-blur-sm">
        <div className="rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-white/82 p-5 md:p-6">
          <div className="mb-6">
            <h3 className="font-headline text-2xl font-black tracking-[-0.03em] text-foreground">
              Edit informasi pribadi
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Perubahan profil langsung tersimpan ke akun pembeli dan digunakan pada proses transaksi.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="buyer-profile-name"
              >
                Nama lengkap
              </label>
              <Input
                autoComplete="name"
                className="h-12 rounded-2xl bg-white/80"
                id="buyer-profile-name"
                name="name"
                onChange={(event) => updateProfileField("name", event.target.value)}
                value={profile.name}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="buyer-profile-email"
              >
                Email
              </label>
              <Input
                autoComplete="email"
                className="h-12 rounded-2xl bg-surface-low/70"
                disabled
                id="buyer-profile-email"
                name="email"
                value={email}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Email menjadi identitas login dan tidak diubah dari form profil ini.
              </p>
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="buyer-profile-phone"
              >
                Nomor telepon
              </label>
              <Input
                autoComplete="tel"
                className="h-12 rounded-2xl bg-white/80"
                id="buyer-profile-phone"
                name="phoneNumber"
                onChange={(event) => updateProfileField("phoneNumber", event.target.value)}
                value={profile.phoneNumber}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="buyer-profile-national-id"
              >
                Nomor KTP
              </label>
              <Input
                autoComplete="off"
                className="h-12 rounded-2xl bg-white/80"
                id="buyer-profile-national-id"
                inputMode="numeric"
                name="nationalId"
                onChange={(event) => updateProfileField("nationalId", event.target.value)}
                value={profile.nationalId}
              />
            </div>
            <div className="md:col-span-2">
              <Button
                className="h-12 rounded-2xl px-5"
                disabled={!isHydrated || isProfilePending}
                onClick={saveProfile}
                type="button"
              >
                {isProfilePending ? (
                  <LoaderCircle aria-hidden="true" className="button-spinner size-4" />
                ) : (
                  <User aria-hidden="true" className="size-4" />
                )}
                {!isHydrated ? "Menyiapkan\u2026" : isProfilePending ? "Menyimpan\u2026" : "Simpan Perubahan"}
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

      <div className="rounded-[2rem] border border-white/60 bg-white/72 p-2 shadow-[0_24px_70px_-52px_rgba(8,69,50,0.52)] backdrop-blur-sm">
        <div className="rounded-[calc(2rem-0.5rem)] border border-primary/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.86),rgba(246,251,246,0.78))] p-5 md:p-6">
          <div className="mb-6">
            <h3 className="font-headline text-2xl font-black tracking-[-0.03em] text-foreground">Keamanan akun</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Perbarui kata sandi secara berkala untuk menjaga akses akun tetap aman.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="buyer-current-password"
              >
                Kata sandi saat ini
              </label>
              <Input
                autoComplete="current-password"
                className="h-12 rounded-2xl bg-white/80"
                id="buyer-current-password"
                name="currentPassword"
                onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
                type="password"
                value={password.currentPassword}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="buyer-new-password"
              >
                Kata sandi baru
              </label>
              <Input
                autoComplete="new-password"
                className="h-12 rounded-2xl bg-white/80"
                id="buyer-new-password"
                name="newPassword"
                onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                type="password"
                value={password.newPassword}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                htmlFor="buyer-confirm-password"
              >
                Konfirmasi kata sandi baru
              </label>
              <Input
                autoComplete="new-password"
                className="h-12 rounded-2xl bg-white/80"
                id="buyer-confirm-password"
                name="confirmPassword"
                onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                type="password"
                value={password.confirmPassword}
              />
            </div>
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
              {!isHydrated ? "Menyiapkan\u2026" : isPasswordPending ? "Memperbarui\u2026" : "Perbarui Kata Sandi"}
            </Button>
            {passwordFeedback ? (
              <InlineFeedback
                className="feedback-lift"
                description={passwordFeedback.description}
                title={passwordFeedback.title}
                variant={passwordFeedback.variant}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
