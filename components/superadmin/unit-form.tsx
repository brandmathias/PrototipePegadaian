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

import { AdminSelect } from "@/components/admin/admin-select";
import { BankLogoMark, getBankDisplayName } from "@/components/shared/bank-logo";
import { unitBankOptions } from "@/components/superadmin/bank-options";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  extractUnitNumber,
  formatUnitCode,
  INDONESIA_PROVINCES,
} from "@/lib/locations/indonesia-provinces";
import { fetchSuperAdminJson } from "@/lib/superadmin/client";
import {
  normalizeUnitAccountNumber,
  normalizeUnitBankName,
} from "@/lib/superadmin/validation";
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
    domicile: string;
    isActive?: boolean;
  };
};

type ManagedUnitCreateResponse = {
  id: string;
  code: string;
  name: string;
  address: string;
  domicile: string;
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

function UnitCodePreview({ domicile, unitNumber }: { domicile: string; unitNumber: string }) {
  const code = formatUnitCode(domicile, unitNumber);

  return (
    <p
      aria-live="polite"
      className="mt-1.5 min-h-5 text-[0.7rem] font-black tracking-[0.06em] text-[#08754f]"
    >
      {code ?? "Pilih domisili dan masukkan 5 angka."}
    </p>
  );
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
        className="min-h-10 w-full rounded-[0.9rem] border-[#dce6df] bg-[#fbfcfb] text-[0.78rem] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] placeholder:text-black/30 focus-visible:border-[#0a6a49]/24 focus-visible:ring-[#0a6a49]/16"
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
  options,
  placeholder = "Pilih opsi",
  required,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <AdminSelect
        ariaLabel={label}
        allowWrap
        className="[&_.admin-select-trigger]:h-10 [&_.admin-select-trigger]:rounded-[0.9rem] [&_.admin-select-trigger]:border-[#dce6df] [&_.admin-select-trigger]:bg-[#fbfcfb] [&_.admin-select-trigger]:px-3 [&_.admin-select-trigger]:text-[0.78rem] [&_.admin-select-trigger]:font-bold [&_.admin-select-trigger]:text-[#13211c] [&_.admin-select-trigger]:shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] [&_.admin-select-trigger[aria-expanded='true']]:border-[#0a6a49]/35 [&_.admin-select-trigger[aria-expanded='true']]:bg-white [&_.admin-select-trigger[aria-expanded='true']]:shadow-[0_0_0_4px_rgba(189,232,208,0.42),0_18px_38px_-30px_rgba(0,103,71,0.34)] [&_.admin-select-option]:text-[0.82rem]"
        id={id}
        options={[
          { value: "", label: placeholder },
          ...options,
        ]}
        size="compact"
        onValueChange={onChange}
        value={value}
      />
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
  const [unitNumber, setUnitNumber] = useState(extractUnitNumber(initialValue?.code) ?? "");
  const [name, setName] = useState(initialValue?.name ?? "");
  const [address, setAddress] = useState(initialValue?.address ?? "");
  const [domicile, setDomicile] = useState(initialValue?.domicile ?? "");
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
          unitNumber,
          name,
          address,
          domicile,
          isActive: true,
        }),
      });

      setMessage("Data unit berhasil diperbarui.");
      toast({
        title: "Data unit berhasil diperbarui.",
        description: "Perubahan unit langsung tersimpan dan Anda dikembalikan ke daftar manajemen unit.",
        variant: "success",
      });
      router.push("/superadmin/manajemen-unit");
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
          autoComplete="off"
          help="Masukkan tepat 5 angka. Prefix CP dan kode wilayah dibuat otomatis."
          id="unit-number-edit"
          inputMode="numeric"
          label="Nomor unit"
          maxLength={5}
          onChange={(event) => setUnitNumber(event.target.value.replace(/\D/g, "").slice(0, 5))}
          pattern="\d{5}"
          placeholder="11793"
          required
          value={unitNumber}
        />
        <UnitCodePreview domicile={domicile} unitNumber={unitNumber} />
      </div>
      <div className="lg:col-span-4">
        <UnitTextInput
          help="Nama resmi unit pelaksana."
          id="unit-name-edit"
          label="Nama unit"
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama unit terkait"
          required
          value={name}
        />
      </div>
      <div className="lg:col-span-5">
        <UnitFormSelect
          id="unit-domicile-edit"
          label="Domisili"
          onChange={setDomicile}
          options={INDONESIA_PROVINCES.map((province) => ({ label: province, value: province }))}
          placeholder="Pilih domisili"
          required
          value={domicile}
        />
      </div>
      <div className="space-y-1.5 lg:col-span-12">
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
        {error ? <InlineFeedback className="feedback-pop" description={error} title="Periksa lagi data unit." variant="error" /> : null}
        {!error && message ? <InlineFeedback className="feedback-pop" description="Data profil unit sudah diperbarui." title={message} variant="success" /> : null}
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
  const [unitNumber, setUnitNumber] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [domicile, setDomicile] = useState("");
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
      { label: "Profil unit", done: Boolean(/^\d{5}$/.test(unitNumber) && name.trim() && address.trim() && domicile) },
      { label: "Rekening utama", done: accounts.length > 0 },
      { label: "Admin unit", done: admins.length > 0 },
    ],
    [accounts.length, address, admins.length, domicile, name, unitNumber]
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
        bankName: normalizeUnitBankName(bankName),
        accountNumber: normalizeUnitAccountNumber(accountNumber),
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

    if (admins.some((admin) => admin.email === adminEmail.trim().toLowerCase())) {
      setError("Email admin unit sudah ada pada daftar setup ini.");
      return;
    }

    if (adminPhoneNumber.trim() && admins.some((admin) => admin.phoneNumber === adminPhoneNumber.trim())) {
      setError("Nomor telepon admin unit sudah ada pada daftar setup ini.");
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
          unitNumber,
          name,
          address,
          domicile,
          accounts: secondaryAccounts.map((account) => ({
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountHolderName: account.accountHolderName,
            isActive: false,
          })),
          admins: admins.map((admin) => ({
            name: admin.name,
            email: admin.email,
            phoneNumber: admin.phoneNumber,
            temporaryPassword: admin.temporaryPassword,
            isActive: true,
            // NIK admin hanya metadata tampilan setup, tidak dikirim ke user.nationalId agar buyer tetap bisa registrasi dengan NIK yang sama.
          })),
          primaryAccount: {
            bankName: primaryAccount.bankName,
            accountNumber: primaryAccount.accountNumber,
            accountHolderName: primaryAccount.accountHolderName,
          },
        }),
      });

      setMessage("Unit pelaksana berhasil diaktivasi.");
      toast({
        title: "Unit pelaksana berhasil diaktivasi.",
        description: `${createdUnit.name} sudah tersimpan bersama rekening utama dan admin penanggung jawab.`,
        variant: "success",
      });
      setUnitNumber("");
      setName("");
      setAddress("");
      setDomicile("");
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
                  autoComplete="off"
                  help="Masukkan tepat 5 angka. Prefix CP dan kode wilayah dibuat otomatis."
                  id="unit-number"
                  inputMode="numeric"
                  label="Nomor Unit"
                  maxLength={5}
                  onChange={(event) => setUnitNumber(event.target.value.replace(/\D/g, "").slice(0, 5))}
                  pattern="\d{5}"
                  placeholder="11793"
                  required
                  value={unitNumber}
                />
                <UnitCodePreview domicile={domicile} unitNumber={unitNumber} />
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
              <div className="lg:col-span-5">
                <UnitFormSelect
                  id="unit-domicile"
                  label="Domisili"
                  onChange={setDomicile}
                  options={INDONESIA_PROVINCES.map((province) => ({ label: province, value: province }))}
                  placeholder="Pilih domisili"
                  required
                  value={domicile}
                />
              </div>
              <div className="space-y-1.5 lg:col-span-12">
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
                  <UnitFormSelect
                    id="account-bank"
                    label="Nama Bank"
                    onChange={setBankName}
                    options={unitBankOptions}
                    placeholder="Pilih bank"
                    required
                    value={bankName}
                  />
                  <UnitTextInput
                    id="account-number"
                    label="Nomor Rekening"
                    onChange={(event) =>
                      setAccountNumber(normalizeUnitAccountNumber(event.target.value))
                    }
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
                    placeholder="PT Area Unit"
                    required
                    value={accountHolderName}
                  />
                </div>
                <Button
                  className="min-h-10 w-full justify-center rounded-[0.9rem] border-[#0a6a49]/28 px-4 text-[0.75rem] text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] sm:w-auto"
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
                      return (
                        <div
                          className="grid gap-3 px-4 py-3 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] md:grid-cols-[1fr_1fr_1.35fr_4rem] md:items-center md:gap-3"
                          key={account.id}
                        >
                          <div className="flex min-w-0 items-center gap-2 font-black text-[#13211c]">
                            <BankLogoMark
                              bankName={account.bankName}
                              className="h-7 w-10 justify-start rounded-none bg-transparent"
                              imageClassName="max-h-5 max-w-10"
                              loading="lazy"
                              sizes="40px"
                            />
                            <span className="truncate">{getBankDisplayName(account.bankName)}</span>
                          </div>
                          <p className="flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 font-mono font-bold text-black/58 md:block md:rounded-none md:bg-transparent md:p-0">
                            <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Rekening</span>
                            <span className="min-w-0 truncate">{account.accountNumber}</span>
                          </p>
                          <div className="flex min-w-0 items-center justify-between gap-2 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 md:justify-start md:rounded-none md:bg-transparent md:p-0">
                            <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Pemilik</span>
                            <p className="min-w-0 truncate text-right font-semibold text-black/55 md:text-left">{account.accountHolderName}</p>
                            {index === 0 ? (
                              <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.12em] text-emerald-700">
                                Utama
                              </span>
                            ) : null}
                          </div>
                          <button
                            aria-label={`Hapus rekening ${account.bankName}`}
                            className="ml-auto grid size-10 place-items-center rounded-xl text-rose-500 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-rose-50 md:size-8"
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
                      className="min-h-10 rounded-[0.9rem] border-[#dce6df] bg-[#fbfcfb] pr-10 font-mono text-[0.78rem] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] placeholder:text-black/30 focus-visible:border-[#0a6a49]/24 focus-visible:ring-[#0a6a49]/16"
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
                  className="min-h-10 w-full justify-center rounded-[0.9rem] border-[#0a6a49]/28 px-4 text-[0.75rem] text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] sm:w-auto"
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
                {admins.length === 0 ? (
                  <div className="px-4 py-7 text-center text-[0.78rem] font-semibold text-black/42">
                    Admin penanggung jawab yang ditambahkan akan tampil di sini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="hidden min-w-[52rem] grid-cols-[minmax(10rem,1fr)_minmax(14rem,1.2fr)_minmax(10rem,0.9fr)_minmax(11rem,0.9fr)_3rem] gap-4 border-b border-[#edf2ee] px-4 py-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-black/38 md:grid">
                      <span>Admin</span>
                      <span>Email</span>
                      <span>NIK Info</span>
                      <span>Password Sementara</span>
                      <span className="text-right">Aksi</span>
                    </div>
                    <div className="divide-y divide-[#edf2ee] md:min-w-[52rem]">
                      {admins.map((admin) => (
                        <div
                          className="grid gap-3 px-4 py-3 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] md:grid-cols-[minmax(10rem,1fr)_minmax(14rem,1.2fr)_minmax(10rem,0.9fr)_minmax(11rem,0.9fr)_3rem] md:items-center md:gap-4"
                          key={admin.id}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#bce9cf] bg-[#ecfff3] font-headline text-[0.68rem] font-black text-[#006747]">
                              {getInitials(admin.name)}
                            </span>
                            <span className="min-w-0 truncate font-black text-[#13211c]">{admin.name}</span>
                          </div>
                          <p className="flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 font-semibold text-black/50 md:block md:rounded-none md:bg-transparent md:p-0">
                            <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Email</span>
                            <span className="block min-w-0 truncate text-right md:text-left">{admin.email}</span>
                          </p>
                          <p className="flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 font-mono font-bold text-black/46 md:block md:rounded-none md:bg-transparent md:p-0">
                            <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">NIK</span>
                            <span className="block min-w-0 truncate text-right md:text-left">{maskNationalId(admin.nationalId)}</span>
                          </p>
                          <div className="flex min-w-0 items-center justify-between gap-2 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 md:justify-start md:rounded-none md:bg-transparent md:p-0">
                            <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Password</span>
                            <span className="block min-w-0 truncate font-mono font-bold tracking-[0.18em] text-black/46">
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
                            className="ml-auto grid size-10 place-items-center rounded-xl text-rose-500 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-rose-50 md:size-8"
                            onClick={() => setAdmins((current) => current.filter((item) => item.id !== admin.id))}
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                      </div>
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

      <div className="safe-sticky-actions sticky z-20 rounded-[1.25rem] border border-[#dfe8e3] bg-white/96 px-3 py-3 shadow-[0_24px_70px_-48px_rgba(8,69,50,0.46),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl sm:px-4">
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
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[0.95rem] border border-[#dfe8e3] bg-white px-5 text-center text-[0.78rem] font-black text-[#475569] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfcfa] active:scale-[0.98] sm:w-auto"
              href="/superadmin/manajemen-unit"
            >
              Batalkan Setup
            </Link>
            <Button
              className="min-h-11 w-full rounded-[0.95rem] px-5 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] sm:w-auto"
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
