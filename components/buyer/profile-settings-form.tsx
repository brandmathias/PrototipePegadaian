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
        description: "Samakan password baru dan konfirmasinya sebelum menyimpan.",
        variant: "error"
      });
      toast({
        title: "Konfirmasi password belum cocok",
        description: "Samakan password baru dan konfirmasinya sebelum menyimpan.",
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
          payload.message ?? "Pastikan password saat ini benar dan password baru minimal 8 karakter.";
        setPasswordFeedback({
          title: "Password belum berubah",
          description,
          variant: "error"
        });
        toast({
          title: "Password belum berubah",
          description,
          variant: "error",
          scope: "buyer"
        });
        return;
      }

      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordFeedback({
        title: "Password diperbarui",
        description: "Akun pembeli tetap aktif dan password baru sudah tersimpan.",
        variant: "success"
      });
      toast({
        title: "Password diperbarui",
        description: "Password akun pembeli berhasil diganti.",
        variant: "success",
        scope: "buyer"
      });
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-[1.5rem] border border-border/70 bg-white p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground">Data akun pembeli</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Perubahan profil langsung tersimpan ke akun dan data profil pembeli.
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
            <Input autoComplete="email" disabled id="buyer-profile-email" name="email" value={email} />
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
              id="buyer-profile-national-id"
              inputMode="numeric"
              name="nationalId"
              onChange={(event) => updateProfileField("nationalId", event.target.value)}
              value={profile.nationalId}
            />
          </div>
          <div className="md:col-span-2">
            <Button disabled={!isHydrated || isProfilePending} onClick={saveProfile} type="button">
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

      <div className="rounded-[1.5rem] border border-border/70 bg-white p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground">Keamanan akun</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ganti password dengan validasi Better Auth agar session tetap aman.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
              htmlFor="buyer-current-password"
            >
              Password saat ini
            </label>
            <Input
              autoComplete="current-password"
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
              Password baru
            </label>
            <Input
              autoComplete="new-password"
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
              Konfirmasi password baru
            </label>
            <Input
              autoComplete="new-password"
              id="buyer-confirm-password"
              name="confirmPassword"
              onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
              type="password"
              value={password.confirmPassword}
            />
          </div>
          <Button
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
            {!isHydrated ? "Menyiapkan\u2026" : isPasswordPending ? "Memperbarui\u2026" : "Perbarui Password"}
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
  );
}
