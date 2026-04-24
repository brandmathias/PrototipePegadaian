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

type UnitFormProps = {
  mode?: "create" | "update";
  unitId?: string;
  initialValue?: {
    code: string;
    name: string;
    address: string;
    isActive?: boolean;
  };
};

export function UnitForm({ mode = "create", unitId, initialValue }: UnitFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState(initialValue?.code ?? "");
  const [name, setName] = useState(initialValue?.name ?? "");
  const [address, setAddress] = useState(initialValue?.address ?? "");
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
      const path = mode === "create" ? "/api/superadmin/unit" : `/api/superadmin/unit/${unitId}`;
      await fetchSuperAdminJson(path, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify({
          code,
          name,
          address,
          isActive
        })
      });

      const successTitle = mode === "create" ? "Unit baru berhasil ditambahkan." : "Data unit berhasil diperbarui.";
      const successDescription =
        mode === "create"
          ? "Unit baru sudah masuk ke sistem dan siap dilengkapi admin maupun rekening aktif."
          : "Perubahan unit langsung tersimpan dan halaman akan diperbarui otomatis.";
      setMessage(successTitle);
      toast({
        title: successTitle,
        description: successDescription,
        variant: "success"
      });
      if (mode === "create") {
        setCode("");
        setName("");
        setAddress("");
      }
      router.refresh();
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Unit gagal disimpan.";
      setError(errorMessage);
      toast({
        title: "Unit belum bisa disimpan.",
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
        <CardTitle>{mode === "create" ? "Tambah unit baru" : "Perbarui data unit"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Kode unit
            </label>
            <Input onChange={(event) => setCode(event.target.value)} placeholder="Contoh: CP-MND-01" value={code} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Nama unit
            </label>
            <Input onChange={(event) => setName(event.target.value)} placeholder="Nama unit Pegadaian" value={name} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Alamat unit
            </label>
            <Input onChange={(event) => setAddress(event.target.value)} placeholder="Alamat lengkap unit" value={address} />
          </div>
          {mode === "update" ? (
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
              Unit aktif dan dapat dipakai operasional
            </label>
          ) : null}
          {error ? (
            <InlineFeedback className="feedback-pop" description={error} title="Periksa lagi data unit." variant="error" />
          ) : null}
          {!error && message ? (
            <InlineFeedback
              className="feedback-pop"
              description="Anda bisa lanjut melengkapi rekening aktif atau admin unit setelah ini."
              title={message}
              variant="success"
            />
          ) : null}
          <Button disabled={loading} type="submit">
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : mode === "create" ? (
              "Simpan Unit"
            ) : (
              "Perbarui Unit"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type DeactivateUnitButtonProps = {
  unitId: string;
  disabled?: boolean;
};

export function DeactivateUnitButton({ unitId, disabled }: DeactivateUnitButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetchSuperAdminJson(`/api/superadmin/unit/${unitId}`, {
        method: "DELETE"
      });
      toast({
        title: "Unit berhasil dinonaktifkan.",
        description: "Unit tidak lagi muncul sebagai unit aktif operasional sampai diaktifkan kembali lewat pembaruan data.",
        variant: "success"
      });
      router.refresh();
      setOpen(false);
    } catch (caughtError) {
      toast({
        title: "Unit belum bisa dinonaktifkan.",
        description: caughtError instanceof Error ? caughtError.message : "Terjadi kendala saat memproses unit.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button disabled={disabled || loading} onClick={() => setOpen(true)} type="button" variant="destructive">
        {loading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Memproses...
          </>
        ) : (
          "Nonaktifkan Unit"
        )}
      </Button>
      <ConfirmDialog
        cancelLabel="Tetap aktif"
        confirmLabel="Ya, nonaktifkan"
        description="Unit akan berhenti tampil sebagai unit operasional aktif. Data historis tetap tersimpan dan bisa ditinjau kembali."
        loading={loading}
        onConfirm={handleClick}
        onOpenChange={setOpen}
        open={open}
        title="Nonaktifkan unit ini?"
        variant="destructive"
      />
    </>
  );
}
