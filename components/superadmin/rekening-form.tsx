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

type RekeningFormProps = {
  unitId: string;
  mode?: "create" | "update";
  accountId?: string;
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
  initialValue
}: RekeningFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bankName, setBankName] = useState(initialValue?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initialValue?.accountNumber ?? "");
  const [accountHolderName, setAccountHolderName] = useState(initialValue?.accountHolderName ?? "");
  const [branchName, setBranchName] = useState(initialValue?.branchName ?? "");
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
          branchName,
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
        setBranchName("");
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

  return (
    <Card className="border border-border/70 bg-white">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Tambah rekening unit" : "Perbarui rekening unit"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Nama bank
            </label>
            <Input onChange={(event) => setBankName(event.target.value)} placeholder="Contoh: Bank Mandiri" value={bankName} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Nomor rekening
            </label>
            <Input onChange={(event) => setAccountNumber(event.target.value)} placeholder="Masukkan nomor rekening" value={accountNumber} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Nama pemilik rekening
            </label>
            <Input
              onChange={(event) => setAccountHolderName(event.target.value)}
              placeholder="Nama pemilik rekening"
              value={accountHolderName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Cabang bank
            </label>
            <Input onChange={(event) => setBranchName(event.target.value)} placeholder="Contoh: Manado Pusat" value={branchName} />
          </div>
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
            Jadikan sebagai rekening aktif unit
          </label>
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
          <Button disabled={loading} type="submit">
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : mode === "create" ? (
              "Simpan Rekening"
            ) : (
              "Perbarui Rekening"
            )}
          </Button>
        </form>
      </CardContent>
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
