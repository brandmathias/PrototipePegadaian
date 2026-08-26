"use client";

import { LoaderCircle, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { AdminSelect } from "@/components/admin/admin-select";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fetchSuperAdminJson } from "@/lib/superadmin/client";

type AdminFormProps = {
  units: Array<{ id: string; name: string; code: string }>;
  mode?: "create" | "update";
  adminId?: string;
  showTitle?: boolean;
  showNationalIdField?: boolean;
  showUnitField?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
  initialValue?: {
    name: string;
    email: string;
    phoneNumber: string;
    unitId: string;
    isActive: boolean;
  };
};

export function AdminUnitForm({
  units,
  mode = "create",
  adminId,
  showTitle = true,
  showNationalIdField = false,
  showUnitField = true,
  submitLabel,
  onSuccess,
  initialValue
}: AdminFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initialValue?.name ?? "");
  const [email, setEmail] = useState(initialValue?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialValue?.phoneNumber ?? "");
  const [nationalId, setNationalId] = useState("");
  const [unitId, setUnitId] = useState(initialValue?.unitId ?? units[0]?.id ?? "");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [credentialFieldsUnlocked, setCredentialFieldsUnlocked] = useState(mode === "update");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generatedId = useId();
  const nameId = `${generatedId}-admin-name`;
  const emailId = `${generatedId}-admin-email`;
  const phoneId = `${generatedId}-admin-phone`;
  const nationalIdId = `${generatedId}-admin-national-id`;
  const unitIdField = `${generatedId}-admin-unit`;
  const passwordId = `${generatedId}-admin-password`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedNationalId = nationalId.replace(/\D/g, "");
    if (showNationalIdField && normalizedNationalId && normalizedNationalId.length !== 16) {
      setError("NIK admin unit harus 16 digit bila diisi.");
      return;
    }

    setLoading(true);

    try {
      const path = mode === "create" ? "/api/superadmin/admin" : `/api/superadmin/admin/${adminId}`;
      await fetchSuperAdminJson(path, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          unitId,
          temporaryPassword,
          isActive
        })
      });

      setMessage(
        mode === "create"
          ? "Admin unit berhasil dibuat dan siap login."
          : "Data admin unit berhasil diperbarui."
      );
      toast({
        title:
          mode === "create"
            ? "Akun admin unit berhasil dibuat."
            : "Perubahan admin unit berhasil disimpan.",
        description:
          mode === "create"
            ? "Admin baru sudah bisa masuk menggunakan email dan password sementara yang Anda buat."
            : "Status, unit, dan identitas admin langsung diperbarui di sistem.",
        variant: "success"
      });
      if (mode === "create") {
        setName("");
        setEmail("");
        setPhoneNumber("");
        setNationalId("");
        setTemporaryPassword("");
        setUnitId(units[0]?.id ?? "");
        setCredentialFieldsUnlocked(false);
      }
      router.refresh();
      onSuccess?.();
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : mode === "create"
            ? "Admin unit gagal dibuat."
            : "Data admin unit gagal diperbarui.";
      setError(errorMessage);
      toast({
        title: mode === "create" ? "Akun admin unit belum bisa dibuat." : "Perubahan admin unit belum tersimpan.",
        description: errorMessage,
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  const resolvedSubmitLabel =
    submitLabel ?? (mode === "create" ? "Simpan Admin Unit" : "Perbarui Admin Unit");

  const form = (
    <form autoComplete="off" className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={nameId}>
            Nama lengkap
          </label>
          <Input
            autoComplete="off"
            id={nameId}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama admin unit"
            value={name}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={emailId}>
            Email
          </label>
          <Input
            autoComplete="off"
            id={emailId}
            name="new-admin-unit-email"
            onChange={(event) => setEmail(event.target.value)}
            onFocus={() => setCredentialFieldsUnlocked(true)}
            placeholder="Email admin unit"
            readOnly={!credentialFieldsUnlocked}
            type="email"
            value={email}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={phoneId}>
            Nomor telepon
          </label>
          <Input
            autoComplete="off"
            id={phoneId}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="Nomor telepon admin"
            value={phoneNumber}
          />
        </div>
        {showNationalIdField ? (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={nationalIdId}>
              NIK Admin
            </label>
            <Input
              autoComplete="off"
              id={nationalIdId}
              inputMode="numeric"
              maxLength={19}
              onChange={(event) => setNationalId(event.target.value)}
              placeholder="16 digit NIK"
              value={nationalId}
            />
            <p className="text-xs font-semibold leading-5 text-muted-foreground">
              Unik sebagai catatan form, tidak dikirim sebagai identitas akun buyer.
            </p>
          </div>
        ) : null}
        {showUnitField ? (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={unitIdField}>
              Unit penugasan
            </label>
            {units.length === 1 ? (
              <div
                className="min-h-11 rounded-xl border border-primary/10 bg-surface-low px-4 py-2 text-sm font-semibold text-foreground"
                id={unitIdField}
              >
                <span className="block truncate">{units[0]?.name}</span>
                <span className="mt-0.5 block text-xs font-bold uppercase tracking-[0.16em] text-primary/65">
                  {units[0]?.code}
                </span>
              </div>
            ) : (
              <AdminSelect
                ariaLabel="Unit penugasan admin unit"
                allowWrap
                className="[&_.admin-select-trigger]:rounded-xl [&_.admin-select-trigger]:border-transparent [&_.admin-select-trigger]:bg-surface-low [&_.admin-select-trigger]:text-sm [&_.admin-select-trigger]:font-semibold [&_.admin-select-trigger[aria-expanded='true']]:border-primary/20 [&_.admin-select-trigger[aria-expanded='true']]:bg-white [&_.admin-select-menu]:rounded-2xl [&_.admin-select-option]:text-sm"
                id={unitIdField}
                onValueChange={setUnitId}
                options={units.map((unit) => ({
                  value: unit.id,
                  label: `${unit.name} (${unit.code})`
                }))}
                value={unitId}
              />
            )}
          </div>
        ) : null}
      </div>
      {mode === "create" ? (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={passwordId}>
            Password sementara
          </label>
          <Input
            autoComplete="new-password"
            id={passwordId}
            name="new-admin-unit-temporary-password"
            onChange={(event) => setTemporaryPassword(event.target.value)}
            onFocus={() => setCredentialFieldsUnlocked(true)}
            placeholder="Password sementara"
            readOnly={!credentialFieldsUnlocked}
            type="password"
            value={temporaryPassword}
          />
        </div>
      ) : (
        <label className="flex items-center gap-3 text-sm text-foreground">
          <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
          Akun admin aktif dan dapat login
        </label>
      )}
      {error ? (
        <InlineFeedback
          className="feedback-pop"
          description={error}
          title={mode === "create" ? "Lengkapi data admin terlebih dahulu." : "Periksa lagi perubahan admin ini."}
          variant="error"
        />
      ) : null}
      {!error && message ? (
        <InlineFeedback
          className="feedback-pop"
          description={
            mode === "create"
              ? "Simpan kredensial sementara sebelum akun diberikan ke admin unit terkait."
              : "Perubahan baru akan langsung dipakai pada sesi login berikutnya."
          }
          title={message}
          variant="success"
        />
      ) : null}
      <Button
        className="min-h-10 w-full justify-center rounded-[0.9rem] border-[#0a6a49]/28 px-4 text-[0.75rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] sm:w-auto"
        disabled={loading || units.length === 0}
        type="submit"
        variant={mode === "create" ? "secondary" : "default"}
      >
        {loading
          ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              {mode === "create" ? "Membuat akun..." : "Menyimpan perubahan..."}
            </>
          )
          : (
            <>
              {mode === "create" ? <UserPlus className="size-4" /> : null}
              {resolvedSubmitLabel}
            </>
          )}
      </Button>
    </form>
  );

  if (!showTitle) {
    return form;
  }

  return (
    <Card className="border border-border/70 bg-white">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Tambah admin unit" : "Perbarui admin unit"}</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}

type DeactivateAdminButtonProps = {
  adminId: string;
  adminName?: string;
  compact?: boolean;
  disabled?: boolean;
};

export function DeactivateAdminButton({ adminId, adminName, compact = false, disabled }: DeactivateAdminButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetchSuperAdminJson(`/api/superadmin/admin/${adminId}`, {
        method: "DELETE"
      });
      toast({
        title: "Akun admin berhasil dihapus dari unit.",
        description: "Akun ini tidak lagi tampil pada daftar admin unit dan akses loginnya sudah diputus.",
        variant: "success"
      });
      router.refresh();
      setOpen(false);
    } catch (caughtError) {
      toast({
        title: "Akun admin belum bisa dihapus.",
        description: caughtError instanceof Error ? caughtError.message : "Terjadi kendala saat menghapus akses admin.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        aria-label={compact ? `Hapus admin ${adminName ?? "unit"}` : undefined}
        className={compact ? "ml-auto size-10 rounded-xl p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 md:size-8" : undefined}
        disabled={disabled || loading}
        onClick={() => setOpen(true)}
        type="button"
        variant={compact ? "ghost" : "secondary"}
      >
        {loading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            {compact ? null : "Memproses..."}
          </>
        ) : compact ? (
          <Trash2 className="size-4" />
        ) : (
          "Hapus Akun"
        )}
      </Button>
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Ya, hapus"
        description="Akun ini akan langsung hilang dari daftar admin unit. Session aktif yang masih tersisa juga akan diputus."
        loading={loading}
        onConfirm={handleClick}
        onOpenChange={setOpen}
        open={open}
        title="Hapus admin dari unit ini?"
        variant="destructive"
      />
    </>
  );
}
