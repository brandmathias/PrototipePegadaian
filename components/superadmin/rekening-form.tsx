"use client";

import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fetchSuperAdminJson } from "@/lib/superadmin/client";

type RekeningFormProps = {
  unitId: string;
  mode?: "create" | "update";
  accountId?: string;
  showTitle?: boolean;
  showActiveToggle?: boolean;
  submitLabel?: string;
  initialValue?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    branchName: string;
    isActive: boolean;
  };
};

export function RekeningForm({
  unitId,
  mode = "create",
  accountId,
  showTitle = true,
  showActiveToggle = true,
  submitLabel,
  initialValue
}: RekeningFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bankName, setBankName] = useState(initialValue?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initialValue?.accountNumber ?? "");
  const [accountHolderName, setAccountHolderName] = useState(initialValue?.accountHolderName ?? "");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generatedId = useId();
  const bankId = `${generatedId}-rekening-bank`;
  const accountNumberId = `${generatedId}-rekening-number`;
  const accountHolderId = `${generatedId}-rekening-holder`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const path =
        mode === "create"
          ? `/api/superadmin/unit/${unitId}/rekening`
          : `/api/superadmin/unit/${unitId}/rekening/${accountId}`;

      await fetchSuperAdminJson(path, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify({
          bankName,
          accountNumber,
          accountHolderName,
          branchName: initialValue?.branchName ?? "",
          isActive
        })
      });

      setMessage(
        mode === "create"
          ? "Rekening unit berhasil disimpan."
          : "Perubahan rekening unit berhasil disimpan."
      );
      toast({
        title:
          mode === "create"
            ? "Rekening unit berhasil ditambahkan."
            : "Perubahan rekening unit berhasil disimpan.",
        description:
          isActive
            ? "Rekening ini sekarang siap dipakai sebagai rekening aktif unit bila tidak ada rekening aktif lain yang lebih baru."
            : "Rekening tersimpan sebagai cadangan dan tetap bisa diaktifkan kapan saja.",
        variant: "success"
      });
      if (mode === "create") {
        setBankName("");
        setAccountNumber("");
        setAccountHolderName("");
        setIsActive(true);
      }
      router.refresh();
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : mode === "create"
            ? "Rekening unit gagal disimpan."
            : "Perubahan rekening unit gagal disimpan.";
      setError(errorMessage);
      toast({
        title: mode === "create" ? "Rekening belum bisa ditambahkan." : "Perubahan rekening belum tersimpan.",
        description: errorMessage,
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  const resolvedSubmitLabel =
    submitLabel ?? (mode === "create" ? "Simpan Rekening" : "Perbarui Rekening");

  const form = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={bankId}>
            Nama bank
          </label>
          <Input
            autoComplete="off"
            id={bankId}
            onChange={(event) => setBankName(event.target.value)}
            placeholder="Contoh: Bank Mandiri"
            value={bankName}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={accountNumberId}>
            Nomor rekening
          </label>
          <Input
            autoComplete="off"
            id={accountNumberId}
            onChange={(event) => setAccountNumber(event.target.value)}
            placeholder="Masukkan nomor rekening"
            value={accountNumber}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={accountHolderId}>
          Nama pemilik rekening
        </label>
        <Input
          autoComplete="off"
          id={accountHolderId}
          onChange={(event) => setAccountHolderName(event.target.value)}
          placeholder="Nama pemilik rekening"
          value={accountHolderName}
        />
      </div>
      {showActiveToggle ? (
        <label className="flex items-center gap-3 text-sm text-foreground">
          <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
          Jadikan sebagai rekening aktif unit
        </label>
      ) : null}
      {error ? (
        <InlineFeedback className="feedback-pop" description={error} title="Cek lagi data rekening ini." variant="error" />
      ) : null}
      {!error && message ? (
        <InlineFeedback
          className="feedback-pop"
          description="Pastikan nama bank, pemilik, dan nomor rekening sesuai dokumen resmi unit."
          title={message}
          variant="success"
        />
      ) : null}
      <Button
        className="h-10 rounded-[0.9rem] border-[#0a6a49]/28 px-4 text-[0.75rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
        disabled={loading}
        type="submit"
        variant={mode === "create" ? "secondary" : "default"}
      >
        {loading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            {mode === "create" ? <Plus className="size-4" /> : null}
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
        <CardTitle>{mode === "create" ? "Tambah rekening unit" : "Perbarui rekening unit"}</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}

type ActivateRekeningButtonProps = {
  unitId: string;
  account: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch: string;
    status: string;
  };
};

export function ActivateRekeningButton({ unitId, account }: ActivateRekeningButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isActive = account.status === "AKTIF";

  async function handleClick() {
    setLoading(true);

    try {
      await fetchSuperAdminJson(`/api/superadmin/unit/${unitId}/rekening/${account.id}`, {
        method: "PUT",
        body: JSON.stringify({
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountHolderName: account.accountHolder,
          branchName: account.branch,
          isActive: true
        })
      });
      toast({
        title: "Rekening aktif berhasil diganti.",
        description: `${account.bankName} • ${account.accountNumber} sekarang menjadi rekening aktif unit ini.`,
        variant: "success"
      });
      router.refresh();
      setOpen(false);
    } catch (caughtError) {
      toast({
        title: "Rekening belum bisa diaktifkan.",
        description: caughtError instanceof Error ? caughtError.message : "Terjadi kendala saat memperbarui rekening aktif.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        disabled={loading || isActive}
        onClick={() => setOpen(true)}
        type="button"
        variant={isActive ? "secondary" : "default"}
      >
        {loading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Memproses...
          </>
        ) : isActive ? (
          "Sedang Aktif"
        ) : (
          "Aktifkan Rekening"
        )}
      </Button>
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Aktifkan sekarang"
        description="Jika dilanjutkan, rekening aktif sebelumnya pada unit ini akan otomatis berubah menjadi cadangan."
        loading={loading}
        onConfirm={handleClick}
        onOpenChange={setOpen}
        open={open}
        title="Jadikan rekening ini sebagai rekening aktif?"
      />
    </>
  );
}

type DeleteRekeningButtonProps = {
  unitId: string;
  account: {
    id: string;
    bankName: string;
    accountNumber: string;
    status: string;
  };
};

export function DeleteRekeningButton({ unitId, account }: DeleteRekeningButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      await fetchSuperAdminJson(`/api/superadmin/unit/${unitId}/rekening/${account.id}`, {
        method: "DELETE"
      });
      toast({
        title: "Rekening unit berhasil dihapus.",
        description: `${account.bankName} ${account.accountNumber} tidak lagi tampil pada daftar rekening unit.`,
        variant: "success"
      });
      router.refresh();
      setOpen(false);
    } catch (caughtError) {
      toast({
        title: "Rekening belum bisa dihapus.",
        description: caughtError instanceof Error ? caughtError.message : "Terjadi kendala saat menghapus rekening unit.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        aria-label={`Hapus rekening ${account.bankName}`}
        className="ml-auto size-8 rounded-xl p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
        disabled={loading}
        onClick={() => setOpen(true)}
        type="button"
        variant="ghost"
      >
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Ya, hapus"
        description={
          account.status === "AKTIF"
            ? "Rekening utama aktif akan dihapus. Jika masih ada rekening lain, sistem akan menjadikan salah satunya sebagai rekening aktif baru."
            : "Rekening ini akan dihapus dari daftar rekening operasional unit."
        }
        loading={loading}
        onConfirm={handleClick}
        onOpenChange={setOpen}
        open={open}
        title="Hapus rekening unit ini?"
        variant="destructive"
      />
    </>
  );
}
