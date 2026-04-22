"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CreditCard,
  Landmark,
  Shield,
  ShieldAlert,
  UserCog,
  WalletCards
} from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getSuperAdminAdminsByUnitId,
  getSuperAdminUnitById,
  superAdminAdmins,
  superAdminBlacklist,
  superAdminMonitoring,
  superAdminSummary,
  superAdminUnits
} from "@/lib/mock-data";

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  if (normalized.includes("aktif") || normalized.includes("normal") || normalized.includes("selesai")) {
    return <Badge variant="default">{value}</Badge>;
  }

  if (normalized.includes("review") || normalized.includes("tindak")) {
    return <Badge variant="accent">{value}</Badge>;
  }

  return <Badge variant="danger">{value}</Badge>;
}

export function SuperAdminDashboardPage() {
  const unitsNeedAttention = superAdminUnits.filter((unit) => unit.status !== "Aktif");
  const pendingMonitoring = superAdminMonitoring.filter(
    (item) => item.status !== "Normal" && item.status !== "Selesai"
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <Card className="overflow-hidden border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(8,90,65,0.12),transparent_42%),linear-gradient(135deg,#ffffff_0%,#f4f2ed_100%)]">
        <CardContent className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="default">Control Center Nasional</Badge>
              <Badge variant="muted">Pusat kendali lintas unit</Badge>
            </div>
            <div className="space-y-3">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-5xl">
                Superadmin Nasional
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {superAdminSummary.headline}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/superadmin/unit">
                <Button>
                  <Building2 className="size-4" />
                  Kelola Unit
                </Button>
              </Link>
              <Link href="/superadmin/monitoring">
                <Button variant="secondary">
                  <Shield className="size-4" />
                  Buka Monitoring
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {superAdminSummary.spotlight.map((item) => (
              <div className="rounded-[1.5rem] border border-border/70 bg-white/88 p-5" key={item.label}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-4 text-2xl font-extrabold text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {superAdminSummary.metrics.map((metric) => (
          <Card className="border border-border/70 bg-white p-5" key={metric.label}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-4 text-3xl font-extrabold text-primary">{metric.value}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{metric.detail}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Prioritas superadmin hari ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {superAdminSummary.priorities.map((item) => (
              <div className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5" key={item.title}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>
                  <Link href={item.href}>
                    <Button variant="secondary">
                      {item.action}
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Unit yang perlu perhatian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unitsNeedAttention.map((unit) => (
                <div className="rounded-[1.5rem] border border-border/70 p-5" key={unit.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{unit.name}</p>
                      <p className="text-sm text-muted-foreground">{unit.city}</p>
                    </div>
                    <StatusBadge value={unit.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {unit.pendingTransactions} transaksi pending | {unit.blacklistCount} akun
                    blacklist | {unit.activeAuctions} lelang aktif
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Antrean review global</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMonitoring.map((item) => (
                <div className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5" key={item.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{item.unit}</p>
                      <p className="text-sm text-muted-foreground">{item.activity}</p>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminUnitsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const units = useMemo(() => {
    return superAdminUnits.filter((unit) => {
      const matchesQuery =
        query.length === 0 ||
        unit.name.toLowerCase().includes(query.toLowerCase()) ||
        unit.code.toLowerCase().includes(query.toLowerCase()) ||
        unit.city.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = statusFilter === "Semua" || unit.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Kelola Unit"
        title="Direktori unit Pegadaian"
        description="Kelola data unit, cek status operasional, dan pastikan setiap unit memiliki rekening pembayaran yang aktif serta valid."
        action={
          <Button>
            <Building2 className="size-4" />
            Tambah Unit
          </Button>
        }
      />

      <Card className="border border-border/70 bg-white">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
          <Input
            name="unitSearch"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari unit, kota, atau kode unit..."
            value={query}
          />
          <select
            aria-label="Filter status unit"
            className="h-11 rounded-xl border border-border/70 bg-white px-4 text-sm outline-none"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="Semua">Semua status</option>
            <option value="Aktif">Aktif</option>
            <option value="Perlu Review">Perlu Review</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        {units.map((unit) => {
          const activeAccount = unit.accounts.find((account) => account.id === unit.activeBankId);

          return (
            <Card className="border border-border/70 bg-white" key={unit.id}>
              <CardContent className="grid gap-5 p-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xl font-bold text-foreground">{unit.name}</p>
                    <StatusBadge value={unit.status} />
                    <Badge variant="muted">{unit.code}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {unit.address} | {unit.city}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-surface-low p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Admin
                      </p>
                      <p className="mt-2 font-semibold text-foreground">{unit.adminCount}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-low p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Barang
                      </p>
                      <p className="mt-2 font-semibold text-foreground">{unit.inventoryCount}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-low p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Pending
                      </p>
                      <p className="mt-2 font-semibold text-foreground">{unit.pendingTransactions}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-low p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Lelang Aktif
                      </p>
                      <p className="mt-2 font-semibold text-foreground">{unit.activeAuctions}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                  <div className="flex items-center gap-3">
                    <WalletCards className="size-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Rekening aktif unit</p>
                      <p className="text-sm text-muted-foreground">
                        Pastikan data rekening valid untuk workflow pembayaran.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="font-semibold text-foreground">{activeAccount?.bankName}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{activeAccount?.accountNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{activeAccount?.accountHolder}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/superadmin/unit/${unit.id}`}>
                      <Button variant="secondary">Detail Unit</Button>
                    </Link>
                    <Link href={`/superadmin/unit/${unit.id}/rekening`}>
                      <Button>
                        <CreditCard className="size-4" />
                        Kelola Rekening
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function SuperAdminUnitDetailPage({ unitId }: { unitId: string }) {
  const unit = getSuperAdminUnitById(unitId);

  if (!unit) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Unit tidak ditemukan.</p>
      </Card>
    );
  }

  const assignedAdmins = getSuperAdminAdminsByUnitId(unit.id);
  const activeAccount = unit.accounts.find((account) => account.id === unit.activeBankId);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Detail Unit"
        title={unit.name}
        description="Halaman ini membantu superadmin melihat identitas unit, admin yang bertugas, rekening aktif, dan kesehatan operasional unit dalam satu tempat."
        action={
          <Link href={`/superadmin/unit/${unit.id}/rekening`}>
            <Button>
              <WalletCards className="size-4" />
              Kelola Rekening
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Kode Unit", value: unit.code },
          { label: "Admin Aktif", value: String(unit.adminCount) },
          { label: "Barang", value: String(unit.inventoryCount) },
          { label: "Transaksi Pending", value: String(unit.pendingTransactions) },
          { label: "Lelang Aktif", value: String(unit.activeAuctions) }
        ].map((item) => (
          <Card className="border border-border/70 bg-white p-5" key={item.label}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-4 text-2xl font-extrabold text-primary">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Informasi umum unit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-surface-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Nama unit
              </p>
              <p className="mt-2 font-semibold text-foreground">{unit.name}</p>
            </div>
            <div className="rounded-2xl bg-surface-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Status operasional
              </p>
              <div className="mt-2">
                <StatusBadge value={unit.status} />
              </div>
            </div>
            <div className="rounded-2xl bg-surface-low p-4 md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Alamat unit
              </p>
              <p className="mt-2 font-semibold text-foreground">{unit.address}</p>
            </div>
            <div className="rounded-2xl bg-surface-low p-4 md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Rekening aktif
              </p>
              <p className="mt-2 font-semibold text-foreground">{activeAccount?.bankName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{activeAccount?.accountNumber}</p>
              <p className="mt-1 text-sm text-muted-foreground">{activeAccount?.accountHolder}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Admin yang ditugaskan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedAdmins.map((admin) => (
              <div className="rounded-[1.5rem] border border-border/70 p-5" key={admin.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-sm text-muted-foreground">{admin.phone}</p>
                  </div>
                  <StatusBadge value={admin.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Login terakhir: {admin.lastLogin}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminUnitAccountsPage({ unitId }: { unitId: string }) {
  const unit = getSuperAdminUnitById(unitId);

  if (!unit) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Unit tidak ditemukan.</p>
      </Card>
    );
  }

  const activeAccount = unit.accounts.find((account) => account.id === unit.activeBankId);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Rekening Unit"
        title={`Kelola rekening ${unit.name}`}
        description="Setiap rekening memuat nama bank, nomor rekening, dan nama pemilik rekening. Superadmin menentukan rekening aktif yang dipakai unit untuk workflow pembayaran."
      />

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Rekening aktif saat ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
              <div className="flex items-start gap-3">
                <Landmark className="mt-1 size-5 text-primary" />
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{activeAccount?.bankName}</p>
                  <p className="text-sm text-muted-foreground">{activeAccount?.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">{activeAccount?.accountHolder}</p>
                  <p className="text-sm text-muted-foreground">{activeAccount?.branch}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {unit.accounts.map((account) => (
                <div className="rounded-[1.5rem] border border-border/70 p-5" key={account.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{account.bankName}</p>
                      <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                    </div>
                    <StatusBadge value={account.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{account.accountHolder}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{account.branch}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Tambah atau ganti rekening unit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Nama bank
                </label>
                <Input name="bankName" placeholder="Contoh: Bank Mandiri" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Nomor rekening
                </label>
                <Input name="accountNumber" placeholder="Masukkan nomor rekening..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Nama pemilik rekening
                </label>
                <Input name="accountHolder" placeholder="Nama pemilik rekening..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Cabang bank
                </label>
                <Input name="branchName" placeholder="Contoh: Jakarta Sudirman" />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-surface-low p-5 text-sm leading-relaxed text-muted-foreground">
              Rekening yang diaktifkan pada halaman ini akan menjadi rekening tujuan pembayaran
              untuk seluruh transaksi unit terkait, termasuk fixed price dan hasil lelang Vickrey.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button>
                <WalletCards className="size-4" />
                Simpan & Aktifkan Rekening
              </Button>
              <Button variant="secondary">Simpan sebagai Cadangan</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminAdminsPage() {
  const [query, setQuery] = useState("");

  const admins = useMemo(() => {
    return superAdminAdmins.filter((admin) => {
      return (
        query.length === 0 ||
        admin.name.toLowerCase().includes(query.toLowerCase()) ||
        admin.email.toLowerCase().includes(query.toLowerCase()) ||
        admin.unit.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [query]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Kelola Admin Unit"
        title="Akun admin unit"
        description="Buat akun admin baru, tempatkan ke unit yang tepat, dan nonaktifkan akun yang sudah tidak bertugas."
        action={
          <Button>
            <UserCog className="size-4" />
            Tambah Admin Unit
          </Button>
        }
      />

      <Card className="border border-border/70 bg-white">
        <CardContent className="p-5">
          <Input
            name="adminSearch"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari admin, email, atau unit..."
            value={query}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {admins.map((admin) => (
          <Card className="border border-border/70 bg-white" key={admin.id}>
            <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-semibold text-foreground">{admin.name}</p>
                  <StatusBadge value={admin.status} />
                </div>
                <p className="text-sm text-muted-foreground">{admin.email}</p>
                <p className="text-sm text-muted-foreground">{admin.phone}</p>
                <p className="text-sm text-muted-foreground">{admin.unit}</p>
              </div>
              <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                <p className="text-sm text-muted-foreground">Login terakhir: {admin.lastLogin}</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary">Atur Ulang Penempatan</Button>
                  <Button>Nonaktifkan Akun</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminMonitoringPage() {
  const [scopeFilter, setScopeFilter] = useState("Semua");

  const items = useMemo(() => {
    return superAdminMonitoring.filter((item) => {
      return scopeFilter === "Semua" || item.scope === scopeFilter;
    });
  }, [scopeFilter]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Monitoring Nasional"
        title="Pantau barang, transaksi, lelang, dan blacklist"
        description="Halaman ini bersifat read-only dan membantu superadmin memantau kondisi global lintas unit tanpa masuk ke operasional detail tiap cabang."
      />

      <Card className="border border-border/70 bg-white">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
          <div className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-4 text-sm leading-relaxed text-muted-foreground">
            Fokuskan monitoring ke area yang sedang membutuhkan perhatian cepat, lalu lanjutkan ke halaman unit atau blacklist bila perlu tindak lanjut administratif.
          </div>
          <select
            aria-label="Filter monitoring"
            className="h-11 rounded-xl border border-border/70 bg-white px-4 text-sm outline-none"
            onChange={(event) => setScopeFilter(event.target.value)}
            value={scopeFilter}
          >
            <option value="Semua">Semua area</option>
            <option value="Barang">Barang</option>
            <option value="Transaksi">Transaksi</option>
            <option value="Lelang">Lelang</option>
            <option value="Blacklist">Blacklist</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card className="border border-border/70 bg-white" key={item.id}>
            <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">{item.scope}</Badge>
                  <StatusBadge value={item.status} />
                </div>
                <p className="text-lg font-bold text-foreground">{item.unit}</p>
                <p className="text-sm text-muted-foreground">{item.activity}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
              <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                <p className="text-sm text-muted-foreground">Update terakhir: {item.time}</p>
                <Link href={`/superadmin/unit/${item.unitId}`}>
                  <Button variant="secondary">Buka Unit Terkait</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminBlacklistPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Blacklist Global"
        title="Kelola akun dengan pelanggaran lintas unit"
        description="Superadmin dapat meninjau riwayat pelanggaran, mempertahankan blokir, atau mencabut blacklist lebih awal bila syaratnya sudah terpenuhi."
      />

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Daftar blacklist nasional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {superAdminBlacklist.map((item) => (
              <div className="rounded-[1.5rem] border border-border/70 p-5" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.unit}</p>
                    <p className="text-sm text-muted-foreground">{item.ktpMasked}</p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {item.total} pelanggaran | Berlaku sampai {item.until}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Tindakan cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 size-5 text-tertiary-container" />
                  <div>
                    <p className="font-semibold text-foreground">Cabut blacklist lebih awal</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Gunakan opsi ini saat hasil review menunjukkan akun layak diaktifkan
                      kembali sebelum masa blokir berakhir.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 size-5 text-accent-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">Perpanjang masa blokir</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Pilih bila pelanggaran berulang atau hasil tindak lanjut unit masih belum
                      memenuhi syarat pencabutan.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <BadgeCheck className="size-4" />
                  Cabut Blacklist
                </Button>
                <Button variant="secondary">
                  <Shield className="size-4" />
                  Tinjau Riwayat
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Pengingat kebijakan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>Blacklist global memengaruhi akses user untuk mengikuti lelang Vickrey.</p>
              <p>User yang sedang diblokir tetap dapat melihat katalog dan membeli fixed price.</p>
              <p>Pastikan keputusan pencabutan mempertimbangkan riwayat pelanggaran lintas unit.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
