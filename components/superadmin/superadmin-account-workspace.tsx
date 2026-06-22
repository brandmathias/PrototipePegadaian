"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CalendarDays,
  Crown,
  History,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  ShieldAlert,
  type LucideIcon,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { AdminSelect } from "@/components/admin/admin-select";
import { DetailActionLink } from "@/components/shared/detail-action-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fetchSuperAdminJson } from "@/lib/superadmin/client";
import { cn } from "@/lib/utils";

type SuperAdminAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneNumber: string;
  level: "owner" | "operator";
  levelLabel: string;
  isActive: boolean;
  status: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  isCurrentUser: boolean;
};

type SuperAdminAudit = {
  id: string;
  action: string;
  note: string;
  actorUserId?: string | null;
  actorName: string;
  targetUserId?: string | null;
  targetName: string;
  createdAt: string;
  createdAtLabel: string;
};

type SuperAdminAccountWorkspaceProps = {
  data: {
    accounts: SuperAdminAccount[];
    audit: SuperAdminAudit[];
    stats: {
      total: number;
      activeOwners: number;
      activeOperators: number;
      inactive: number;
      recentAudit: number;
    };
    currentUser: {
      id: string;
      level: "owner" | "operator";
      canManage: boolean;
    };
  };
};

type PendingAction =
  | {
      type: "status";
      account: SuperAdminAccount;
      nextIsActive: boolean;
    }
  | {
      type: "level";
      account: SuperAdminAccount;
      nextLevel: "owner" | "operator";
    }
  | null;

const levelOptions = [
  { value: "owner", label: "Owner" },
  { value: "operator", label: "Operator" }
];

function levelTone(level: SuperAdminAccount["level"]) {
  return level === "owner"
    ? "border-[#d8eadf] bg-[#f0faf4] text-[#07563e]"
    : "border-[#e6e9ee] bg-[#f8fafc] text-[#475569]";
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    activate: "Aktivasi",
    change_level: "Ubah Level",
    create: "Buat Akun",
    deactivate: "Nonaktif",
    rejected: "Ditolak",
    reset_password: "Reset Password",
    update_profile: "Perbarui Profil"
  };

  return labels[action] ?? action;
}

function StatCard({
  detail,
  icon: Icon,
  label,
  value
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-[#dfe8e3] bg-white px-4 py-4 shadow-[0_18px_48px_-42px_rgba(8,69,50,0.34),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-black/40">{label}</p>
          <p className="mt-2 font-headline text-2xl font-black tracking-[-0.04em] text-[#13211c]">{value}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-[1rem] bg-[#edf7ef] text-[#006747]">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-[0.78rem] font-semibold leading-5 text-black/48">{detail}</p>
    </div>
  );
}

function LevelBadge({ level }: { level: SuperAdminAccount["level"] }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.13em]", levelTone(level))}>
      {level === "owner" ? <Crown className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
      {level === "owner" ? "Owner" : "Operator"}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.13em]",
        active ? "bg-[#edf7ef] text-[#006747]" : "bg-[#fff1f1] text-[#b4233a]"
      )}
    >
      {active ? <BadgeCheck className="size-3.5" /> : <Ban className="size-3.5" />}
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatIsoDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function ProfileCard({
  children,
  className,
  icon,
  title
}: {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className={cn("rounded-[2rem] border border-white/70 bg-white/82 p-2 shadow-[0_24px_76px_-58px_rgba(8,69,50,0.52)]", className)}>
      <div className="h-full rounded-[calc(2rem-0.5rem)] border border-[#0a6a49]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,252,249,0.9))] p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#0a6a49]/8 text-[#0a6a49]">
            {icon}
          </span>
          <h3 className="font-headline text-lg font-black tracking-[-0.02em] text-[#122018]">{title}</h3>
        </div>
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  accent = false,
  label,
  value
}: {
  accent?: boolean;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-black/42">{label}</p>
      <div className={cn("break-words text-sm font-semibold leading-6 text-[#13211c]", accent && "text-[#0a6a49]")}>{value}</div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-black/8 px-4 py-4 md:border-r last:md:border-r-0">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#eff6f2] text-[#0a6a49]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-black/46">{label}</p>
        <div className="mt-1 truncate text-sm font-bold text-[#13211c]">{value}</div>
      </div>
    </div>
  );
}

function ResetPasswordDialog({
  account,
  onClose,
  onReset
}: {
  account: SuperAdminAccount | null;
  onClose: () => void;
  onReset: (account: SuperAdminAccount, password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccount = account;

  if (!activeAccount) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeAccount) {
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await onReset(activeAccount, password);
      setPassword("");
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Password sementara gagal direset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-[#13211c]/38 px-4 py-5 backdrop-blur-sm">
      <form
        className="toast-enter modal-viewport w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[#dfe8e3] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] px-5 py-4">
          <div>
            <p className="page-heading-eyebrow">Reset Password</p>
            <h3 className="mt-1 font-headline text-[1.15rem] font-black tracking-[-0.03em] text-[#13211c]">
              {activeAccount.name}
            </h3>
            <p className="mt-1 text-sm font-medium leading-6 text-black/52">
              Session aktif akun ini akan diputus setelah password diganti.
            </p>
          </div>
          <button
            aria-label="Tutup reset password"
            className="grid size-10 shrink-0 place-items-center rounded-full text-black/45 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f6faf7] hover:text-[#13211c]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-black/45" htmlFor="superadmin-reset-password">
              Password sementara baru
            </label>
            <Input
              autoComplete="new-password"
              id="superadmin-reset-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 8 karakter"
              type="password"
              value={password}
            />
          </div>
          {error ? <InlineFeedback description={error} title="Reset belum bisa diproses." variant="error" /> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={loading} onClick={onClose} type="button" variant="secondary">
              Batal
            </Button>
            <Button disabled={loading} type="submit">
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Reset Password
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CreateSuperAdminPanel({
  canManage,
  form,
  formError,
  formLoading,
  onClose,
  onFormChange,
  onSubmit,
  open
}: {
  canManage: boolean;
  form: {
    name: string;
    email: string;
    phoneNumber: string;
    level: "owner" | "operator";
    temporaryPassword: string;
  };
  formError: string | null;
  formLoading: boolean;
  onClose: () => void;
  onFormChange: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phoneNumber: string;
      level: "owner" | "operator";
      temporaryPassword: string;
    }>
  >;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  open: boolean;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] scrollbar-none sm:px-6 sm:py-6">
      <button
        aria-label="Tutup panel tambah akses"
        className="absolute inset-0 bg-[#052315]/34 backdrop-blur-[3px]"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-[141] my-auto w-full max-w-xl py-8 sm:py-10">
        <section
          aria-labelledby="superadmin-create-panel-title"
          aria-modal="true"
          className="toast-enter relative rounded-[2rem] border border-[#dfe8e2] bg-white shadow-[0_42px_120px_-52px_rgba(3,21,14,0.82),0_18px_38px_-28px_rgba(8,69,50,0.24)]"
          role="dialog"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
              <UserPlus className="size-6 text-white" strokeWidth={2.2} />
            </div>
          </div>

          <div className="p-5 pt-10 sm:p-7 sm:pt-11">
            <div className="flex justify-end">
              <button
                aria-label="Tutup panel tambah akses"
                className="grid size-9 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98]"
                onClick={onClose}
                type="button"
              >
                <X className="size-4.5" strokeWidth={2.2} />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <h2
                className="font-headline text-[1.55rem] font-black tracking-tight text-[#15231d] sm:text-[1.72rem]"
                id="superadmin-create-panel-title"
              >
                Akun superadmin baru
              </h2>
              <p className="mx-auto max-w-md text-[0.9rem] leading-7 text-slate-500">
                Buat Owner atau Operator baru dengan password sementara.
              </p>
            </div>

            {canManage ? (
              <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-black/38" htmlFor="superadmin-name">
                  Nama lengkap
                </label>
                <Input
                  className="h-11 rounded-[1.05rem] bg-[#f7faf8] text-sm"
                  id="superadmin-name"
                  onChange={(event) => onFormChange((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nama superadmin"
                  value={form.name}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-black/38" htmlFor="superadmin-email">
                  Email
                </label>
                <Input
                  autoComplete="off"
                  className="h-11 rounded-[1.05rem] bg-[#f7faf8] text-sm"
                  id="superadmin-email"
                  onChange={(event) => onFormChange((current) => ({ ...current, email: event.target.value }))}
                  placeholder="email@pegadaian.co.id"
                  type="email"
                  value={form.email}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-black/38" htmlFor="superadmin-phone">
                  Nomor telepon
                </label>
                <Input
                  className="h-11 rounded-[1.05rem] bg-[#f7faf8] text-sm"
                  id="superadmin-phone"
                  onChange={(event) => onFormChange((current) => ({ ...current, phoneNumber: event.target.value }))}
                  placeholder="Opsional"
                  value={form.phoneNumber}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-black/38" htmlFor="superadmin-level">
                  Level akses
                </label>
                <AdminSelect
                  ariaLabel="Level akun superadmin baru"
                  id="superadmin-level"
                  options={levelOptions}
                  value={form.level}
                  onValueChange={(value) => onFormChange((current) => ({ ...current, level: value as "owner" | "operator" }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-black/38" htmlFor="superadmin-password">
                  Password sementara
                </label>
                <Input
                  autoComplete="new-password"
                  className="h-12 rounded-[1.35rem] bg-[#f7faf8] text-sm"
                  id="superadmin-password"
                  minLength={8}
                  onChange={(event) => onFormChange((current) => ({ ...current, temporaryPassword: event.target.value }))}
                  placeholder="Minimal 8 karakter"
                  type="password"
                  value={form.temporaryPassword}
                />
              </div>
              {formError ? (
                <InlineFeedback
                  className="sm:col-span-2"
                  description={formError}
                  title="Periksa data superadmin."
                  variant="error"
                />
              ) : null}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
                <Button className="min-h-10 rounded-[0.95rem]" disabled={formLoading} onClick={onClose} type="button" variant="secondary">
                  Batal
                </Button>
                <Button className="min-h-10 rounded-[0.95rem]" disabled={formLoading} type="submit">
                  {formLoading ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  Simpan Superadmin
                </Button>
              </div>
              </form>
            ) : (
              <InlineFeedback
                description="Form pembuatan akun hanya tersedia untuk Owner Superadmin."
                title="Akses pembuatan dikunci"
                variant="info"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function SuperAdminAccountWorkspace({ data }: SuperAdminAccountWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "owner" | "operator">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    level: "operator" as "owner" | "operator",
    temporaryPassword: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = data.currentUser.canManage;
  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return data.accounts.filter((account) => {
      const matchesQuery =
        !normalized ||
        account.name.toLowerCase().includes(normalized) ||
        account.email.toLowerCase().includes(normalized) ||
        account.phone.toLowerCase().includes(normalized);
      const matchesLevel = levelFilter === "all" || account.level === levelFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && account.isActive) ||
        (statusFilter === "inactive" && !account.isActive);

      return matchesQuery && matchesLevel && matchesStatus;
    });
  }, [data.accounts, levelFilter, query, statusFilter]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      await fetchSuperAdminJson("/api/superadmin/accounts", {
        method: "POST",
        body: JSON.stringify(form)
      });
      toast({
        title: "Akun superadmin berhasil dibuat.",
        description: `${form.name} sudah bisa login memakai password sementara.`,
        variant: "success",
        scope: "superadmin"
      });
      setForm({
        name: "",
        email: "",
        phoneNumber: "",
        level: "operator",
        temporaryPassword: ""
      });
      setIsCreatePanelOpen(false);
      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Akun superadmin gagal dibuat.";
      setFormError(message);
      toast({
        title: "Akun superadmin belum dibuat.",
        description: message,
        variant: "error",
        scope: "superadmin"
      });
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <AdminPageHero
        description="Kelola akses Owner dan Operator Superadmin dengan guardrail, audit, dan alert penting yang tersimpan."
        eyebrow="Superadmin / Manajemen Superadmin"
        icon={UsersRound}
        title="Manajemen Superadmin"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard detail="Seluruh akun berperan super_admin." icon={UsersRound} label="Total Akun" value={data.stats.total} />
        <StatCard detail="Pemilik akses tertinggi dan manajemen akun." icon={Crown} label="Owner Aktif" value={data.stats.activeOwners} />
        <StatCard detail="Monitoring tanpa aksi sensitif." icon={ShieldCheck} label="Operator Aktif" value={data.stats.activeOperators} />
        <StatCard detail="Tersimpan untuk audit, tidak dihapus." icon={Ban} label="Nonaktif" value={data.stats.inactive} />
      </div>

      {!canManage ? (
        <InlineFeedback
          description="Akun Anda berlevel Operator. Data tetap dapat dipantau, tetapi aksi membuat, mengubah level, menonaktifkan, dan reset password hanya tersedia untuk Owner."
          title="Mode read-only aktif"
          variant="info"
        />
      ) : null}

      <div className="grid gap-5">
        <section className="min-w-0 overflow-hidden rounded-[1.35rem] border border-[#dfe8e3] bg-white shadow-[0_28px_80px_-68px_rgba(8,69,50,0.32)]">
          <div className="grid gap-3 border-b border-[#e5eee9] bg-[#fbfcfa] px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center lg:px-5">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35" />
              <Input
                className="h-11 rounded-[1.15rem] bg-white pl-10 text-[0.88rem] font-semibold shadow-[0_16px_34px_-30px_rgba(15,23,42,0.34)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, email, atau nomor..."
                value={query}
              />
            </div>
            <AdminSelect
              ariaLabel="Filter level superadmin"
              className="w-full md:w-40"
              options={[
                { value: "all", label: "Semua Level" },
                { value: "owner", label: "Owner" },
                { value: "operator", label: "Operator" }
              ]}
              size="compact"
              value={levelFilter}
              onValueChange={(value) => setLevelFilter(value as typeof levelFilter)}
            />
            <AdminSelect
              ariaLabel="Filter status superadmin"
              className="w-full md:w-40"
              options={[
                { value: "all", label: "Semua Status" },
                { value: "active", label: "Aktif" },
                { value: "inactive", label: "Nonaktif" }
              ]}
              size="compact"
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            />
            <Button
              className="h-11 rounded-[1.15rem] px-4 text-[0.72rem] font-black uppercase tracking-[0.14em]"
              disabled={!canManage}
              onClick={() => setIsCreatePanelOpen(true)}
              type="button"
            >
              <UserPlus className="size-4" />
              Tambah Akses
            </Button>
          </div>

          <div className="hidden grid-cols-[minmax(18rem,1.25fr)_minmax(13rem,0.78fr)_minmax(12rem,0.7fr)_10rem] gap-4 border-b border-[#edf2ee] px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.16em] text-black/38 lg:grid">
            <span>Akun</span>
            <span>Level & status</span>
            <span>Akses terakhir</span>
            <span className="text-right">Aksi</span>
          </div>

          {filteredAccounts.length === 0 ? (
            <EmptyState
              className="m-5 p-6"
              description="Coba kata kunci atau filter lain. Akun baru akan muncul setelah Owner membuatnya."
              icon={Search}
              title="Tidak ada akun superadmin yang sesuai"
            />
          ) : (
            <div className="divide-y divide-[#edf2ee]">
              {filteredAccounts.map((account) => (
                <article
                  className="grid gap-4 px-4 py-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] lg:grid-cols-[minmax(18rem,1.25fr)_minmax(13rem,0.78fr)_minmax(12rem,0.7fr)_10rem] lg:items-center lg:px-5"
                  key={account.id}
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[1.05rem] border border-[#d9e8df] bg-[linear-gradient(180deg,#fdfcf8,#edf7ef)] font-headline text-[0.74rem] font-black text-[#006747] shadow-[0_18px_34px_-28px_rgba(10,106,73,0.42),inset_0_1px_0_rgba(255,255,255,0.9)]">
                      {getInitials(account.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="truncate font-headline text-[0.98rem] font-black leading-tight tracking-[-0.02em] text-[#13211c]">
                          {account.name}
                        </h3>
                        {account.isCurrentUser ? (
                          <span className="rounded-full bg-[#eef6f1] px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.13em] text-[#006747]">
                            Anda
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[0.76rem] font-semibold text-black/48">
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{account.email}</span>
                      </p>
                      <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[0.76rem] font-semibold text-black/40">
                        <Phone className="size-3.5 shrink-0" />
                        <span className="truncate">{account.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <LevelBadge level={account.level} />
                    <StatusBadge active={account.isActive} />
                  </div>

                  <div className="text-[0.78rem] font-semibold leading-5 text-[#13211c]">
                    {account.lastLogin}
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    <DetailActionLink
                      className="min-h-10 w-full sm:w-auto"
                      href={`/superadmin/manajemen-superadmin/${account.id}`}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[1.35rem] border border-[#dfe8e3] bg-white p-4 shadow-[0_24px_70px_-62px_rgba(8,69,50,0.32)]">
          <div className="flex items-start justify-between gap-3 border-b border-[#edf2ee] pb-3">
            <div>
              <p className="page-heading-eyebrow">Audit Terbaru</p>
              <h3 className="mt-1 font-headline text-[1.05rem] font-black tracking-[-0.02em] text-[#13211c]">
                Aktivitas sensitif
              </h3>
            </div>
            <span className="grid size-10 place-items-center rounded-[1rem] bg-[#fff8e5] text-[#9a6a00]">
              <History className="size-5" />
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.audit.length === 0 ? (
              <EmptyState
                className="p-5 md:col-span-2 xl:col-span-3"
                description="Audit akan muncul setelah ada aksi pada akun superadmin."
                icon={ShieldAlert}
                title="Belum ada audit"
              />
            ) : (
              data.audit.slice(0, 8).map((item) => (
                <div className="rounded-[1.05rem] border border-[#edf2ee] bg-[#fbfcfa] px-3 py-3" key={item.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.13em] text-[#006747] shadow-sm">
                      {actionLabel(item.action)}
                    </span>
                    <span className="text-[0.68rem] font-bold text-black/38">{item.createdAtLabel}</span>
                  </div>
                  <p className="mt-2 text-[0.78rem] font-semibold leading-5 text-[#13211c]">{item.note}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <CreateSuperAdminPanel
        canManage={canManage}
        form={form}
        formError={formError}
        formLoading={formLoading}
        onClose={() => setIsCreatePanelOpen(false)}
        onFormChange={setForm}
        onSubmit={handleCreate}
        open={isCreatePanelOpen}
      />
    </div>
  );
}

export function SuperAdminAccountDetailWorkspace({
  account,
  audit,
  currentUser
}: {
  account: SuperAdminAccount;
  audit: SuperAdminAudit[];
  currentUser: SuperAdminAccountWorkspaceProps["data"]["currentUser"];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const canManage = currentUser.canManage;
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [resetTarget, setResetTarget] = useState<SuperAdminAccount | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const initials = getInitials(account.name);
  const relatedAudit = audit.filter(
    (item) => item.targetUserId === account.id || item.actorUserId === account.id
  );

  async function applyAccountPatch(patch: Record<string, unknown>) {
    await fetchSuperAdminJson(`/api/superadmin/accounts/${account.id}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
    router.refresh();
  }

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    setActionLoading(true);
    try {
      if (pendingAction.type === "status") {
        await applyAccountPatch({ isActive: pendingAction.nextIsActive });
        toast({
          title: pendingAction.nextIsActive ? "Akun superadmin diaktifkan." : "Akun superadmin dinonaktifkan.",
          description: `${pendingAction.account.name} sudah diperbarui.`,
          variant: "success",
          scope: "superadmin"
        });
      } else {
        await applyAccountPatch({ level: pendingAction.nextLevel });
        toast({
          title: "Level superadmin diperbarui.",
          description: `${pendingAction.account.name} sekarang menjadi ${pendingAction.nextLevel === "owner" ? "Owner" : "Operator"}.`,
          variant: "success",
          scope: "superadmin"
        });
      }
      setPendingAction(null);
    } catch (caughtError) {
      toast({
        title: "Aksi superadmin ditolak.",
        description: caughtError instanceof Error ? caughtError.message : "Perubahan belum bisa diproses.",
        variant: "error",
        scope: "superadmin"
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(target: SuperAdminAccount, temporaryPassword: string) {
    await fetchSuperAdminJson(`/api/superadmin/accounts/${target.id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ temporaryPassword })
    });
    toast({
      title: "Password sementara diperbarui.",
      description: `Password ${target.name} sudah direset dan session aktif diputus.`,
      variant: "success",
      scope: "superadmin"
    });
    router.refresh();
  }

  return (
    <div className="relative -my-6 min-h-[calc(100dvh-4rem)] w-full overflow-hidden rounded-[2rem] bg-[#f5f8f5] py-6 sm:-my-8 sm:py-8 md:-my-10 md:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(10,106,73,0.13),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,248,245,0.96))]" />
        <div className="absolute right-[-10rem] top-12 size-[26rem] rounded-full border border-[#d8ad38]/18" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] space-y-5 px-4 sm:px-5 md:space-y-6 lg:px-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-heading-eyebrow">Superadmin / Detail Akun</p>
            <h1 className="mt-2 font-headline text-3xl font-black tracking-[-0.04em] text-[#122018] md:text-4xl">
              Detail Akun Superadmin
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/56 md:text-base">
              Informasi lengkap akun, status akses, level kewenangan, dan aksi keamanan dikelola dari halaman ini.
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: "secondary" }), "h-11 rounded-2xl")}
            href="/superadmin/manajemen-superadmin"
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </section>

        <section className="rounded-[2.25rem] border border-white/75 bg-white/70 p-2 shadow-[0_34px_110px_-72px_rgba(6,66,46,0.68)]">
          <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] border border-[#0a6a49]/18 bg-[#023d31] p-5 text-white md:p-7">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,61,49,0.96),rgba(3,86,63,0.78)_52%,rgba(2,61,49,0.64))]" />
            <div className="absolute -right-20 -top-24 size-64 rounded-full border border-[#d8ad38]/45" />
            <div className="absolute bottom-0 right-8 h-px w-1/2 bg-gradient-to-r from-transparent via-[#d8ad38]/70 to-transparent" />

            <div className="relative grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_16rem] lg:items-center">
              <div className="relative grid size-28 shrink-0 place-items-center rounded-[2rem] border-4 border-white/88 bg-white text-3xl font-black text-[#0a6a49] shadow-[0_24px_62px_-38px_rgba(0,0,0,0.8)] md:size-32">
                <span>{initials}</span>
                <span className={cn("absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-[3px] border-white text-white", account.isActive ? "bg-[#0a6a49]" : "bg-[#b4233a]")}>
                  {account.isActive ? <BadgeCheck className="size-4" /> : <Ban className="size-4" />}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-headline text-2xl font-black tracking-[-0.03em] md:text-3xl">{account.name}</h2>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#d8ad38]/45 bg-[#d8ad38]/12 px-3 py-1.5 text-xs font-bold text-[#f4d675]">
                    {account.level === "owner" ? <Crown className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                    {account.levelLabel}
                  </span>
                  {account.isCurrentUser ? (
                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/82">
                      Akun Anda
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-3 text-sm text-white/88 sm:grid-cols-2">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Mail className="size-4 shrink-0 text-white/72" />
                    <span className="truncate">{account.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-white/72" />
                    {account.phone}
                  </span>
                  <span className="inline-flex items-center gap-2 sm:col-span-2">
                    <CalendarDays className="size-4 shrink-0 text-white/72" />
                    Dibuat {formatIsoDateTime(account.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 lg:border-l lg:border-white/15 lg:pl-5">
                <Button
                  className="h-12 justify-center rounded-2xl bg-white text-[#0a6a49] shadow-[0_18px_42px_-28px_rgba(0,0,0,0.7)] hover:bg-[#f3fbf6]"
                  disabled={!canManage}
                  onClick={() =>
                    setPendingAction({
                      type: "status",
                      account,
                      nextIsActive: !account.isActive
                    })
                  }
                  type="button"
                >
                  {account.isActive ? <Ban className="size-4" /> : <BadgeCheck className="size-4" />}
                  {account.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button
                  className="h-12 justify-center rounded-2xl border-white/25 bg-white/12 text-white hover:bg-white/18"
                  disabled={!canManage}
                  onClick={() => setResetTarget(account)}
                  type="button"
                  variant="ghost"
                >
                  <KeyRound className="size-4" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </section>

        {!canManage ? (
          <InlineFeedback
            description="Akun Anda berlevel Operator. Detail akun tetap dapat dipantau, tetapi perubahan level, status, dan reset password hanya tersedia untuk Owner."
            title="Mode read-only aktif"
            variant="info"
          />
        ) : null}

        <section className="grid overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/86 shadow-[0_22px_68px_-56px_rgba(8,69,50,0.5)] md:grid-cols-4">
          <InfoTile icon={<UsersRound className="size-5" />} label="Level" value={account.levelLabel} />
          <InfoTile icon={<BadgeCheck className="size-5" />} label="Status" value={account.status} />
          <InfoTile icon={<ClockIcon />} label="Login Terakhir" value={account.lastLogin} />
          <InfoTile icon={<CalendarDays className="size-5" />} label="Terakhir Ubah" value={formatIsoDateTime(account.updatedAt)} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ProfileCard icon={<UsersRound className="size-5" />} title="Informasi Akun">
            <div className="space-y-5">
              <DetailRow label="Nama Lengkap" value={account.name} />
              <DetailRow label="Email" value={account.email} />
              <DetailRow label="Nomor Telepon" value={account.phone} />
              <DetailRow accent label="ID Akun" value={account.id} />
            </div>
          </ProfileCard>

          <ProfileCard icon={<ShieldCheck className="size-5" />} title="Keamanan & Akses">
            <div className="space-y-4">
              <div className="rounded-[1.35rem] border border-[#0a6a49]/10 bg-[linear-gradient(180deg,#ffffff,#f8fbf8)] p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem] md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-[#122018]">Level akses</p>
                    <p className="mt-1 text-sm leading-6 text-black/54">
                      Owner dapat mengelola akun sensitif, Operator hanya memantau data superadmin.
                    </p>
                  </div>
                  {canManage ? (
                    <AdminSelect
                      ariaLabel={`Ubah level ${account.name}`}
                      options={levelOptions}
                      value={account.level}
                      onValueChange={(value) =>
                        value !== account.level
                          ? setPendingAction({
                              type: "level",
                              account,
                              nextLevel: value as "owner" | "operator"
                            })
                          : undefined
                      }
                    />
                  ) : (
                    <div className="inline-flex h-12 items-center rounded-[1.2rem] border border-[#e5eee9] bg-[#f8faf9] px-4 text-sm font-black uppercase tracking-[0.12em] text-black/48">
                      {account.levelLabel}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-[#0a6a49]/10 bg-[linear-gradient(180deg,#ffffff,#f8fbf8)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#0a6a49]/8 text-[#0a6a49]">
                      <LockKeyhole className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#122018]">Password</p>
                      <p className="mt-1 text-xs font-medium text-black/48">Reset password akan memutus session aktif akun ini.</p>
                    </div>
                  </div>
                  <Button disabled={!canManage} onClick={() => setResetTarget(account)} type="button" variant="secondary">
                    <KeyRound className="size-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </ProfileCard>
        </section>

        <ProfileCard icon={<History className="size-5" />} title="Audit Akun">
          {relatedAudit.length === 0 ? (
            <EmptyState
              className="p-5"
              description="Belum ada audit yang langsung terkait akun ini."
              icon={ShieldAlert}
              title="Audit akun belum tersedia"
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {relatedAudit.map((item) => (
                <div className="rounded-[1.05rem] border border-[#edf2ee] bg-[#fbfcfa] px-3 py-3" key={item.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.13em] text-[#006747] shadow-sm">
                      {actionLabel(item.action)}
                    </span>
                    <span className="text-[0.68rem] font-bold text-black/38">{item.createdAtLabel}</span>
                  </div>
                  <p className="mt-2 text-[0.78rem] font-semibold leading-5 text-[#13211c]">{item.note}</p>
                </div>
              ))}
            </div>
          )}
        </ProfileCard>
      </div>

      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel={
          pendingAction?.type === "level"
            ? "Ya, ubah level"
            : pendingAction?.nextIsActive
              ? "Ya, aktifkan"
              : "Ya, nonaktifkan"
        }
        description={
          pendingAction?.type === "level"
            ? "Perubahan level Owner/Operator akan dicatat ke audit dan masuk ke alert Owner."
            : pendingAction?.nextIsActive
              ? "Akun akan dapat login kembali setelah aktif."
              : "Akun akan kehilangan akses login dan session aktifnya akan diputus."
        }
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        open={Boolean(pendingAction)}
        title={
          pendingAction?.type === "level"
            ? "Ubah level superadmin?"
            : pendingAction?.nextIsActive
              ? "Aktifkan akun superadmin?"
              : "Nonaktifkan akun superadmin?"
        }
        variant={pendingAction?.type === "status" && pendingAction.nextIsActive === false ? "destructive" : "default"}
      />
      <ResetPasswordDialog account={resetTarget} onClose={() => setResetTarget(null)} onReset={handleResetPassword} />
    </div>
  );
}

function ClockIcon() {
  return <History className="size-5" />;
}
