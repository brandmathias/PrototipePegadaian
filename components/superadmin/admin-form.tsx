"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  initialValue
}: AdminFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initialValue?.name ?? "");
  const [email, setEmail] = useState(initialValue?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialValue?.phoneNumber ?? "");
  const [unitId, setUnitId] = useState(initialValue?.unitId ?? units[0]?.id ?? "");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

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
        setTemporaryPassword("");
        setUnitId(units[0]?.id ?? "");
      }
      router.refresh();
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

  return (
    <Card className="border border-border/70 bg-white">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Tambah admin unit" : "Perbarui admin unit"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input onChange={(event) => setName(event.target.value)} placeholder="Nama admin unit" value={name} />
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="Email admin unit" type="email" value={email} />
          <Input onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Nomor telepon admin" value={phoneNumber} />
          <select
            className="h-11 w-full rounded-xl border border-transparent bg-surface-low px-4 py-2 text-sm text-foreground focus-visible:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onChange={(event) => setUnitId(event.target.value)}
            value={unitId}
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.code})
              </option>
            ))}
          </select>
          {mode === "create" ? (
            <Input
              onChange={(event) => setTemporaryPassword(event.target.value)}
              placeholder="Password sementara"
              type="password"
              value={temporaryPassword}
            />
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
          <Button disabled={loading || units.length === 0} type="submit">
            {loading
              ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  {mode === "create" ? "Membuat akun..." : "Menyimpan perubahan..."}
                </>
              )
              : mode === "create"
                ? "Simpan Admin Unit"
                : "Perbarui Admin Unit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type DeactivateAdminButtonProps = {
  adminId: string;
  disabled?: boolean;
};

export function DeactivateAdminButton({ adminId, disabled }: DeactivateAdminButtonProps) {
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
        title: "Akun admin berhasil dinonaktifkan.",
        description: "Akun ini tidak lagi bisa login sampai diaktifkan kembali oleh superadmin.",
        variant: "success"
      });
      router.refresh();
      setOpen(false);
    } catch (caughtError) {
      toast({
        title: "Akun admin belum bisa dinonaktifkan.",
        description: caughtError instanceof Error ? caughtError.message : "Terjadi kendala saat memperbarui status akun.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button disabled={disabled || loading} onClick={() => setOpen(true)} type="button" variant="secondary">
        {loading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Memproses...
          </>
        ) : (
          "Nonaktifkan Akun"
        )}
      </Button>
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Ya, nonaktifkan"
        description="Akun ini akan langsung kehilangan akses login. Session aktif yang masih tersisa juga akan diputus."
        loading={loading}
        onConfirm={handleClick}
        onOpenChange={setOpen}
        open={open}
        title="Nonaktifkan akun admin ini?"
        variant="destructive"
      />
    </>
  );
}
