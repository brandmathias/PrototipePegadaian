"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Trash2,
  UserPlus,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fetchSuperAdminJson } from "@/lib/superadmin/client";
import { cn } from "@/lib/utils";

type UnitFormProps = {
  mode?: "create" | "update";
  unitId?: string;
  showTitle?: boolean;
  formId?: string;
  showSubmitButton?: boolean;
  submitLabel?: string;
  initialValue?: {
    code: string;
    name: string;
    address: string;
    isActive?: boolean;
  };
};

type ManagedUnitCreateResponse = {
  id: string;
  code: string;
  name: string;
  address: string;
};

type AccountDraft = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
};

type AdminDraft = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  temporaryPassword: string;
  showPassword: boolean;
};

const bankOptions = [
  "Bank Mandiri",
  "Bank BNI",
  "BRI",
  "BCA",
  "BTN",
  "BSI",
  "Bank Danamon",
  "Bank CIMB Niaga",
] as const;

function createDraftId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNationalId(value: string) {
  return value.replace(/\D/g, "");
}

function maskNationalId(value: string) {
  if (!value) {
    return "Tidak diisi";
  }

  if (value.length <= 8) {
    return value;
  }

  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getBankMark(bankName: string) {
  const normalized = bankName.toLowerCase();

  if (normalized.includes("mandiri")) {
    return {
      label: "mandiri",
      className: "border-blue-100 bg-blue-50 text-blue-700",
    };
  }

  if (normalized.includes("bni")) {
    return {
      label: "BNI",
      className: "border-orange-100 bg-orange-50 text-orange-700",
    };
  }

  if (normalized.includes("bri")) {
    return {
      label: "BRI",
      className: "border-sky-100 bg-sky-50 text-sky-700",
    };
  }

  if (normalized.includes("bca")) {
    return {
      label: "BCA",
      className: "border-indigo-100 bg-indigo-50 text-indigo-700",
    };
  }

  return {
    label: bankName.slice(0, 4).toUpperCase(),
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };
}

function SectionNumber({ value }: { value: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-[0.85rem] bg-[linear-gradient(135deg,#08754f,#005f40)] text-[0.72rem] font-black text-white shadow-[0_16px_28px_-22px_rgba(8,117,79,0.72),inset_0_1px_0_rgba(255,255,255,0.28)]">
      {value}
    </span>
  );
}

function FieldLabel({ children, htmlFor, required }: { children: React.ReactNode; htmlFor: string; required?: boolean }) {
  return (
    <label className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#64756e]" htmlFor={htmlFor}>
      {children}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.68rem] font-semibold leading-5 text-black/42">{children}</p>;
}

function UnitTextInput({
  help,
  id,
  label,
  required,
  ...props
}: React.ComponentProps<typeof Input> & {
  help?: string;
  id: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Input
        className="h-10 rounded-[0.9rem] border-[#dce6df] bg-[#fbfcfb] text-[0.78rem] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] placeholder:text-black/30 focus-visible:border-[#0a6a49]/24 focus-visible:ring-[#0a6a49]/16"
        id={id}
        {...props}
      />
      {help ? <FieldHelp>{help}</FieldHelp> : null}
    </div>
  );
}

function UnitFormSelect({
  id,
  label,
  onChange,
  required,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <select
        className="h-10 w-full rounded-[0.9rem] border border-[#dce6df] bg-[#fbfcfb] px-3 text-[0.78rem] font-bold text-[#13211c] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-[#0a6a49]/24 focus:ring-2 focus:ring-[#0a6a49]/16"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Pilih bank</option>
        {bankOptions.map((bank) => (
          <option key={bank} value={bank}>
            {bank}
          </option>
        ))}
      </select>
    </div>
  );
}

function UnitEditForm({
  formId,
  initialValue,
  mode,
  showSubmitButton = true,
  showTitle,
  submitLabel = "Perbarui Unit",
  unitId,
}: Required<Pick<UnitFormProps, "mode">> &
  Pick<UnitFormProps, "formId" | "initialValue" | "showSubmitButton" | "showTitle" | "submitLabel" | "unitId">) {
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
      await fetchSuperAdminJson(`/api/superadmin/unit/${unitId}`, {
        method: "PUT",
        body: JSON.stringify({
          code,
          name,
          address,
          isActive,
        }),
      });

      setMessage("Data unit berhasil diperbarui.");
      toast({
        title: "Data unit berhasil diperbarui.",
        description: "Perubahan unit langsung tersimpan dan halaman akan diperbarui otomatis.",
        variant: "success",
      });
      router.refresh();
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Data unit gagal diperbarui.";
      setError(errorMessage);
      toast({
        title: "Perubahan unit belum tersimpan.",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <form className="grid gap-4 lg:grid-cols-12" id={formId} onSubmit={handleSubmit}>
      <div className="lg:col-span-3">
        <UnitTextInput
          help="Contoh: CP-MND-01"
          id="unit-code-edit"
          label="Kode unit"
          onChange={(event) => setCode(event.target.value)}
          placeholder="Contoh: CP-MND-01"
          required
          value={code}
        />
      </div>
      <div className="lg:col-span-4">
        <UnitTextInput
          help="Nama resmi unit pelaksana."
          id="unit-name-edit"
          label="Nama unit"
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama unit Pegadaian"
          required
          value={name}
        />
      </div>
      <div className="space-y-1.5 lg:col-span-5">
        <FieldLabel htmlFor="unit-address-edit" required>
          Alamat Lengkap Unit
        </FieldLabel>
        <textarea
          className="min-h-20 w-full resize-none rounded-[0.9rem] border border-[#dce6df] bg-[#fbfcfb] px-4 py-2.5 text-[0.78rem] font-semibold leading-5 text-[#13211c] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/30 focus:border-[#0a6a49]/24 focus:ring-2 focus:ring-[#0a6a49]/16"
          id="unit-address-edit"
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Alamat lengkap sesuai dokumen resmi"
          value={address}
        />
        <FieldHelp>Alamat lengkap sesuai dokumen resmi unit.</FieldHelp>
      </div>
      <div className="space-y-4 lg:col-span-12">
        <label className="flex items-center gap-3 text-sm text-foreground">
          <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
          Unit aktif dan dapat dipakai operasional
        </label>
        {error ? <InlineFeedback className="feedback-pop" description={error} title="Periksa lagi data unit." variant="error" /> : null}
        {!error && message ? <InlineFeedback className="feedback-pop" description="Status operasional unit sudah diperbarui." title={message} variant="success" /> : null}
        {showSubmitButton ? (
          <Button disabled={loading} type="submit">
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        ) : null}
      </div>
    </form>
  );

  if (!showTitle) {
    return formContent;
  }

  return (
    <Card className="border border-border/70 bg-white">
      <CardHeader>
        <CardTitle>{mode === "update" ? "Perbarui data unit" : "Tambah unit baru"}</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}

function UnitCreateForm({ showTitle = true }: Pick<UnitFormProps, "showTitle">) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accounts, setAccounts] = useState<AccountDraft[]>([]);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhoneNumber, setAdminPhoneNumber] = useState("");
  const [adminNationalId, setAdminNationalId] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [credentialFieldsUnlocked, setCredentialFieldsUnlocked] = useState(false);
  const [showInputPassword, setShowInputPassword] = useState(false);
  const [admins, setAdmins] = useState<AdminDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readyChecks = useMemo(
    () => [
      { label: "Profil unit", done: Boolean(code.trim() && name.trim() && address.trim()) },
      { label: "Rekening utama", done: accounts.length > 0 },
      { label: "Admin unit", done: admins.length > 0 },
    ],
    [accounts.length, address, admins.length, code, name]
  );
  const canSubmit = readyChecks.every((item) => item.done);

  function resetAccountFields() {
    setBankName("");
    setAccountNumber("");
    setAccountHolderName("");
  }

  function resetAdminFields() {
    setAdminName("");
    setAdminEmail("");
    setAdminPhoneNumber("");
    setAdminNationalId("");
    setTemporaryPassword("");
    setShowInputPassword(false);
  }

  function addAccount() {
    setError(null);

    if (!bankName.trim() || !accountNumber.trim() || !accountHolderName.trim()) {
      setError("Nama bank, nomor rekening, dan pemilik rekening wajib diisi sebelum masuk daftar.");
      return;
    }

    setAccounts((current) => [
      ...current,
      {
        id: createDraftId("rekening"),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
      },
    ]);
    resetAccountFields();
  }

  function addAdmin() {
    setError(null);
    const normalizedNik = normalizeNationalId(adminNationalId);

    if (!adminName.trim() || !adminEmail.trim() || !temporaryPassword) {
      setError("Nama, email, dan password sementara admin wajib diisi sebelum masuk daftar.");
      return;
    }

    if (normalizedNik && normalizedNik.length !== 16) {
      setError("NIK admin unit harus 16 digit bila diisi.");
      return;
    }

    if (normalizedNik && admins.some((admin) => admin.nationalId === normalizedNik)) {
      setError("NIK admin unit sudah ada pada daftar setup ini.");
      return;
    }

    setAdmins((current) => [
      ...current,
      {
        id: createDraftId("admin"),
        name: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
        phoneNumber: adminPhoneNumber.trim(),
        nationalId: normalizedNik,
        temporaryPassword,
        showPassword: false,
      },
    ]);
    resetAdminFields();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!canSubmit) {
      setError("Profil unit, minimal 1 rekening, dan minimal 1 admin wajib lengkap sebelum aktivasi.");
      return;
    }

    setLoading(true);

    try {
      const [primaryAccount, ...secondaryAccounts] = accounts;
      const createdUnit = await fetchSuperAdminJson<ManagedUnitCreateResponse>("/api/superadmin/unit", {
        method: "POST",
        body: JSON.stringify({
          code,
          name,
          address,
          primaryAccount: {
            bankName: primaryAccount.bankName,
            accountNumber: primaryAccount.accountNumber,
            accountHolderName: primaryAccount.accountHolderName,
          },
        }),
      });

      for (const account of secondaryAccounts) {
        await fetchSuperAdminJson(`/api/superadmin/unit/${createdUnit.id}/rekening`, {
          method: "POST",
          body: JSON.stringify({
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountHolderName: account.accountHolderName,
            isActive: false,
          }),
        });
      }

      for (const admin of admins) {
        await fetchSuperAdminJson("/api/superadmin/admin", {
          method: "POST",
          body: JSON.stringify({
            name: admin.name,
            email: admin.email,
            phoneNumber: admin.phoneNumber,
            unitId: createdUnit.id,
            temporaryPassword: admin.temporaryPassword,
            isActive: true,
            // NIK admin hanya metadata tampilan setup, tidak dikirim ke user.nationalId agar buyer tetap bisa registrasi dengan NIK yang sama.
          }),
        });
      }

      setMessage("Unit pelaksana berhasil diaktivasi.");
      toast({
        title: "Unit pelaksana berhasil diaktivasi.",
        description: `${createdUnit.name} sudah tersimpan bersama rekening utama dan admin penanggung jawab.`,
        variant: "success",
      });
      setCode("");
      setName("");
      setAddress("");
      setAccounts([]);
      setAdmins([]);
      resetAccountFields();
      resetAdminFields();
      router.push("/superadmin/manajemen-unit");
      router.refresh();
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Setup unit gagal disimpan.";
      setError(errorMessage);
      toast({
        title: "Setup unit belum bisa disimpan.",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form autoComplete="off" className="space-y-5 pb-20" onSubmit={handleSubmit}>
      {showTitle ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#0a6a49] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#064b35]"
              href="/superadmin/manajemen-unit"
            >
              <ArrowLeft className="size-3.5" />
              Kembali ke Daftar Unit Pelaksana
            </Link>
            <h2 className="mt-2 font-headline text-2xl font-black tracking-[-0.035em] text-[#13211c]">
              Registrasi & Setup Unit Pelaksana Baru
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-black/52">
              Lengkapi informasi unit, rekening operasional, dan admin penanggung jawab untuk aktivasi unit baru.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-[1.45rem] border border-[#dfe8e3] bg-white shadow-[0_30px_90px_-74px_rgba(8,69,50,0.34)]">
        <CardContent className="p-0">
          <section className="space-y-4 px-4 py-5 sm:px-5 lg:px-6">
            <div className="flex items-center gap-3 border-b border-[#edf2ee] pb-3">
              <SectionNumber value="01" />
              <div>
                <h3 className="font-headline text-[0.98rem] font-black tracking-[-0.02em] text-[#13211c]">
                  Profil & Lokasi Unit
                </h3>
                <p className="text-[0.72rem] font-semibold text-black/42">Identitas operasional unit pelaksana.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <UnitTextInput
                  help="Contoh: UPB-2026-0123"
                  id="unit-code"
                  label="Kode Unit"
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="UPB-2026-0123"
                  required
                  value={code}
                />
              </div>
              <div className="lg:col-span-4">
                <UnitTextInput
                  help="Nama resmi unit pelaksana."
                  id="unit-name"
                  label="Nama Unit"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="UPB Pondok Indah"
                  required
                  value={name}
                />
              </div>
              <div className="space-y-1.5 lg:col-span-5">
                <FieldLabel htmlFor="unit-address" required>
                  Alamat Lengkap Unit
                </FieldLabel>
                <textarea
                  className="min-h-20 w-full resize-none rounded-[0.9rem] border border-[#dce6df] bg-[#fbfcfb] px-4 py-2.5 text-[0.78rem] font-semibold leading-5 text-[#13211c] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/30 focus:border-[#0a6a49]/24 focus:ring-2 focus:ring-[#0a6a49]/16"
                  id="unit-address"
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Alamat lengkap sesuai dokumen resmi"
                  value={address}
                />
                <FieldHelp>Alamat lengkap sesuai dokumen resmi unit.</FieldHelp>
              </div>
            </div>
          </section>

          <section className="border-t border-[#edf2ee] px-4 py-5 sm:px-5 lg:px-6">
            <div className="flex items-center gap-3 border-b border-[#edf2ee] pb-3">
              <SectionNumber value="02" />
              <div>
                <h3 className="font-headline text-[0.98rem] font-black tracking-[-0.02em] text-[#13211c]">
                  Rekening Operasional Cabang
                </h3>
                <p className="text-[0.72rem] font-semibold text-black/42">Rekening pertama otomatis menjadi rekening utama aktif.</p>
              </div>
            </div>

            <div className="grid gap-5 pt-4 xl:grid-cols-12 xl:gap-7">
              <div className="space-y-4 xl:col-span-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <UnitFormSelect id="account-bank" label="Nama Bank" onChange={setBankName} required value={bankName} />
                  <UnitTextInput
                    id="account-number"
                    label="Nomor Rekening"
                    onChange={(event) => setAccountNumber(event.target.value)}
                    placeholder="Masukkan nomor rekening"
                    required
                    value={accountNumber}
                  />
                </div>
                <div className="grid gap-4">
                  <UnitTextInput
                    id="account-holder"
                    label="Nama Pemilik Rekening"
                    onChange={(event) => setAccountHolderName(event.target.value)}
                    placeholder="PT Pegadaian Area"
                    required
                    value={accountHolderName}
                  />
                </div>
                <Button
                  className="h-10 rounded-[0.9rem] border-[#0a6a49]/28 px-4 text-[0.75rem] text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
                  onClick={addAccount}
                  type="button"
                  variant="secondary"
                >
                  <Plus className="size-4" />
                  Tambah Rekening
                </Button>
              </div>

              <div className="min-w-0 overflow-hidden rounded-[1rem] border border-[#dfe8e3] bg-white xl:col-span-7">
                <div className="border-b border-[#edf2ee] bg-[#fbfcfa] px-4 py-3 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/40">
                  Daftar Rekening Terdaftar ({accounts.length})
                </div>
                <div className="hidden grid-cols-[1fr_1fr_1.35fr_4rem] gap-3 border-b border-[#edf2ee] px-4 py-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-black/38 md:grid">
                  <span>Bank</span>
                  <span>Nomor Rekening</span>
                  <span>Nama Pemilik</span>
                  <span className="text-right">Aksi</span>
                </div>
                {accounts.length === 0 ? (
                  <div className="px-4 py-7 text-center text-[0.78rem] font-semibold text-black/42">
                    Rekening yang ditambahkan akan tampil sebagai ledger audit.
                  </div>
                ) : (
                  <div className="divide-y divide-[#edf2ee]">
                    {accounts.map((account, index) => {
                      const bankMark = getBankMark(account.bankName);

                      return (
                        <div
                          className="grid gap-2 px-4 py-3 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] md:grid-cols-[1fr_1fr_1.35fr_4rem] md:items-center md:gap-3"
                          key={account.id}
                        >
                          <div className="flex min-w-0 items-center gap-2 font-black text-[#13211c]">
                            <span className={cn("inline-flex min-w-12 items-center justify-center rounded-md border px-1.5 py-1 text-[0.64rem] font-black", bankMark.className)}>
                              {bankMark.label}
                            </span>
                            <span className="truncate">{account.bankName}</span>
                          </div>
                          <p className="truncate font-mono font-bold text-black/58">{account.accountNumber}</p>
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate font-semibold text-black/55">{account.accountHolderName}</p>
                            {index === 0 ? (
                              <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.12em] text-emerald-700">
                                Utama
                              </span>
                            ) : null}
                          </div>
                          <button
                            aria-label={`Hapus rekening ${account.bankName}`}
                            className="ml-auto grid size-8 place-items-center rounded-xl text-rose-500 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-rose-50"
                            onClick={() => setAccounts((current) => current.filter((item) => item.id !== account.id))}
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-[#edf2ee] px-4 py-5 sm:px-5 lg:px-6">
            <div className="flex items-center gap-3 border-b border-[#edf2ee] pb-3">
              <SectionNumber value="03" />
              <div>
                <h3 className="font-headline text-[0.98rem] font-black tracking-[-0.02em] text-[#13211c]">
                  Otoritas Admin Penanggung Jawab
                </h3>
                <p className="text-[0.72rem] font-semibold text-black/42">NIK admin hanya catatan tambahan dan tidak mengunci registrasi buyer.</p>
              </div>
            </div>

            <div className="grid gap-5 pt-4 xl:grid-cols-12 xl:gap-7">
              <div className="space-y-4 xl:col-span-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <UnitTextInput
                    id="admin-name"
                    label="Nama Lengkap"
                    onChange={(event) => setAdminName(event.target.value)}
                    placeholder="Nama admin unit"
                    required
                    value={adminName}
                  />
                  <UnitTextInput
                    autoComplete="off"
                    id="admin-email"
                    label="Email"
                    name="new-admin-contact-email"
                    onChange={(event) => setAdminEmail(event.target.value)}
                    onFocus={() => setCredentialFieldsUnlocked(true)}
                    placeholder="nama@pegadaian.co.id"
                    readOnly={!credentialFieldsUnlocked}
                    required
                    type="email"
                    value={adminEmail}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <UnitTextInput
                    id="admin-phone"
                    label="Nomor Telepon"
                    onChange={(event) => setAdminPhoneNumber(event.target.value)}
                    placeholder="08xxxxxxxxxx"
                    value={adminPhoneNumber}
                  />
                  <UnitTextInput
                    help="Unik di daftar setup, tidak dikirim sebagai identitas akun buyer."
                    id="admin-national-id"
                    inputMode="numeric"
                    label="NIK Admin"
                    maxLength={19}
                    onChange={(event) => setAdminNationalId(event.target.value)}
                    placeholder="16 digit NIK"
                    value={adminNationalId}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel htmlFor="admin-password" required>
                    Password Sementara
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      autoComplete="new-password"
                      className="h-10 rounded-[0.9rem] border-[#dce6df] bg-[#fbfcfb] pr-10 font-mono text-[0.78rem] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] placeholder:text-black/30 focus-visible:border-[#0a6a49]/24 focus-visible:ring-[#0a6a49]/16"
                      id="admin-password"
                      name="new-admin-temporary-password"
                      onFocus={() => setCredentialFieldsUnlocked(true)}
                      onChange={(event) => setTemporaryPassword(event.target.value)}
                      placeholder="Minimal 8 karakter"
                      readOnly={!credentialFieldsUnlocked}
                      type={showInputPassword ? "text" : "password"}
                      value={temporaryPassword}
                    />
                    <button
                      aria-label={showInputPassword ? "Sembunyikan password sementara" : "Tampilkan password sementara"}
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-black/42 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#edf7ef] hover:text-[#006747]"
                      onClick={() => setShowInputPassword((current) => !current)}
                      type="button"
                    >
                      {showInputPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="h-10 rounded-[0.9rem] border-[#0a6a49]/28 px-4 text-[0.75rem] text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
                  onClick={addAdmin}
                  type="button"
                  variant="secondary"
                >
                  <UserPlus className="size-4" />
                  Tambah Admin
                </Button>
              </div>

              <div className="min-w-0 overflow-hidden rounded-[1rem] border border-[#dfe8e3] bg-white xl:col-span-7">
                <div className="border-b border-[#edf2ee] bg-[#fbfcfa] px-4 py-3 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/40">
                  Daftar Admin Unit Terdaftar ({admins.length})
                </div>
                <div className="hidden grid-cols-[1.1fr_1.05fr_0.9fr_1fr_4rem] gap-3 border-b border-[#edf2ee] px-4 py-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-black/38 md:grid">
                  <span>Admin</span>
                  <span>Email</span>
                  <span>NIK Info</span>
                  <span>Password Sementara</span>
                  <span className="text-right">Aksi</span>
                </div>
                {admins.length === 0 ? (
                  <div className="px-4 py-7 text-center text-[0.78rem] font-semibold text-black/42">
                    Admin penanggung jawab yang ditambahkan akan tampil di sini.
                  </div>
                ) : (
                  <div className="divide-y divide-[#edf2ee]">
                    {admins.map((admin) => (
                      <div
                        className="grid gap-2 px-4 py-3 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] md:grid-cols-[1.1fr_1.05fr_0.9fr_1fr_4rem] md:items-center md:gap-3"
                        key={admin.id}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#bce9cf] bg-[#ecfff3] font-headline text-[0.68rem] font-black text-[#006747]">
                            {getInitials(admin.name)}
                          </span>
                          <span className="truncate font-black text-[#13211c]">{admin.name}</span>
                        </div>
                        <p className="truncate font-semibold text-black/50">{admin.email}</p>
                        <p className="truncate font-mono font-bold text-black/46">{maskNationalId(admin.nationalId)}</p>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-mono font-bold tracking-[0.18em] text-black/46">
                            {admin.showPassword ? admin.temporaryPassword : "********"}
                          </span>
                          <button
                            aria-label={`${admin.showPassword ? "Sembunyikan" : "Tampilkan"} password ${admin.name}`}
                            className="grid size-8 shrink-0 place-items-center rounded-xl text-black/42 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#edf7ef] hover:text-[#006747]"
                            onClick={() =>
                              setAdmins((current) =>
                                current.map((item) =>
                                  item.id === admin.id ? { ...item, showPassword: !item.showPassword } : item
                                )
                              )
                            }
                            type="button"
                          >
                            {admin.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        <button
                          aria-label={`Hapus admin ${admin.name}`}
                          className="ml-auto grid size-8 place-items-center rounded-xl text-rose-500 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-rose-50"
                          onClick={() => setAdmins((current) => current.filter((item) => item.id !== admin.id))}
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {error ? (
            <div className="border-t border-[#edf2ee] px-4 py-4 sm:px-5 lg:px-6">
              <InlineFeedback className="feedback-pop" description={error} title="Periksa lagi setup unit." variant="error" />
            </div>
          ) : null}
          {!error && message ? (
            <div className="border-t border-[#edf2ee] px-4 py-4 sm:px-5 lg:px-6">
              <InlineFeedback className="feedback-pop" description="Halaman daftar unit akan diperbarui otomatis." title={message} variant="success" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-20 rounded-[1.25rem] border border-[#dfe8e3] bg-white/96 px-4 py-3 shadow-[0_24px_70px_-48px_rgba(8,69,50,0.46),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold text-black/48">
            <Info className="size-4 shrink-0 text-[#64756e]" />
            {readyChecks.map((item) => (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  item.done
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-[#e5eee9] bg-[#fbfcfa] text-black/42"
                )}
                key={item.label}
              >
                {item.done ? <BadgeCheck className="size-3.5" /> : <LockKeyhole className="size-3.5" />}
                {item.label}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[0.95rem] border border-[#dfe8e3] bg-white px-5 text-[0.78rem] font-black text-[#475569] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfcfa] active:scale-[0.98]"
              href="/superadmin/manajemen-unit"
            >
              Batalkan Setup
            </Link>
            <Button
              className="h-11 rounded-[0.95rem] px-5 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
              disabled={loading || !canSubmit}
              type="submit"
            >
              {loading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Mengaktivasi...
                </>
              ) : (
                <>
                  <WalletCards className="size-4" />
                  Simpan & Aktivasi Unit Pelaksana
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function UnitForm({
  formId,
  mode = "create",
  showSubmitButton,
  submitLabel,
  unitId,
  showTitle = true,
  initialValue,
}: UnitFormProps) {
  if (mode === "update") {
    return (
      <UnitEditForm
        formId={formId}
        initialValue={initialValue}
        mode={mode}
        showSubmitButton={showSubmitButton}
        showTitle={showTitle}
        submitLabel={submitLabel}
        unitId={unitId}
      />
    );
  }

  return <UnitCreateForm showTitle={showTitle} />;
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
        method: "DELETE",
      });
      toast({
        title: "Unit berhasil dinonaktifkan.",
        description: "Unit tidak lagi muncul sebagai unit operasional aktif sampai diaktifkan kembali lewat pembaruan data.",
        variant: "success",
      });
      router.refresh();
      setOpen(false);
    } catch (caughtError) {
      toast({
        title: "Unit belum bisa dinonaktifkan.",
        description: caughtError instanceof Error ? caughtError.message : "Terjadi kendala saat memproses unit.",
        variant: "error",
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
