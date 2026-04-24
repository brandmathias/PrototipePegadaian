"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Pencil,
  Building2,
  Inbox,
  CreditCard,
  Landmark,
  SearchX,
  Shield,
  ShieldBan,
  UserCog,
  WalletCards
} from "lucide-react";

import { AdminUnitForm, DeactivateAdminButton } from "@/components/superadmin/admin-form";
import { CabutBlacklistForm } from "@/components/superadmin/cabut-blacklist-form";
import { ActivateRekeningButton, RekeningForm } from "@/components/superadmin/rekening-form";
import { DeactivateUnitButton, UnitForm } from "@/components/superadmin/unit-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export type SuperAdminMetric = {
  label: string;
  value: string;
  detail: string;
};

export type SuperAdminSpotlight = {
  label: string;
  value: string;
};

export type SuperAdminPriority = {
  title: string;
  detail: string;
  href: string;
  action: string;
};

export type SuperAdminSummary = {
  headline: string;
  metrics: SuperAdminMetric[];
  spotlight: SuperAdminSpotlight[];
  priorities: SuperAdminPriority[];
};

export type SuperAdminUnitAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  status: string;
};

export type SuperAdminUnitListItem = {
  id: string;
  code: string;
  name: string;
  address: string;
  status: string;
  adminCount: number;
  accountCount: number;
  activeAccount: SuperAdminUnitAccount | null;
};

export type SuperAdminUnitDetail = {
  id: string;
  code: string;
  name: string;
  address: string;
  status: string;
  isActive: boolean;
  adminCount: number;
  accountCount: number;
  activeAccount: SuperAdminUnitAccount | null;
  accounts: SuperAdminUnitAccount[];
  admins: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
  }>;
};

export type SuperAdminAdminItem = {
  id: string;
  name: string;
  unitId: string | null;
  unit: string;
  email: string;
  phone: string;
  status: string;
  lastLogin: string;
};

export type SuperAdminMonitoringItem = {
  id: string;
  unitId: string;
  unit: string;
  scope: string;
  status: string;
  activity: string;
  detail: string;
};

export type SuperAdminMonitoringData = {
  summary: SuperAdminSummary;
  unitsNeedAttention: SuperAdminMonitoringItem[];
  pendingMonitoring: SuperAdminMonitoringItem[];
};

export type SuperAdminBlacklistItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  unit: string;
  total: number;
  until: string;
  reason: string;
  status: string;
};

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

function EditableAccountCard({
  unitId,
  account
}: {
  unitId: string;
  account: SuperAdminUnitAccount;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-[1.5rem] border border-border/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{account.bankName}</p>
          <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
        </div>
        <StatusBadge value={account.status} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{account.accountHolder}</p>
      <p className="mt-1 text-sm text-muted-foreground">{account.branch}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ActivateRekeningButton account={account} unitId={unitId} />
        <Button onClick={() => setEditing((value) => !value)} type="button" variant="secondary">
          <Pencil className="size-4" />
          {editing ? "Tutup Edit" : "Edit Rekening"}
        </Button>
      </div>
      {editing ? (
        <div className="mt-4">
          <RekeningForm
            accountId={account.id}
            initialValue={{
              bankName: account.bankName,
              accountNumber: account.accountNumber,
              accountHolderName: account.accountHolder,
              branchName: account.branch,
              isActive: account.status === "AKTIF"
            }}
            mode="update"
            unitId={unitId}
          />
        </div>
      ) : null}
    </div>
  );
}

function EditableAdminCard({
  admin,
  units
}: {
  admin: SuperAdminAdminItem;
  units: Array<{ id: string; name: string; code: string }>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card className="border border-border/70 bg-white" key={admin.id}>
      <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold text-foreground">{admin.name}</p>
            <StatusBadge value={admin.status} />
          </div>
          <p className="text-sm text-muted-foreground">{admin.email}</p>
          <p className="text-sm text-muted-foreground">{admin.phone}</p>
          <p className="text-sm text-muted-foreground">{admin.unit}</p>
          {editing ? (
            <AdminUnitForm
              adminId={admin.id}
              initialValue={{
                name: admin.name,
                email: admin.email,
                phoneNumber: admin.phone === "-" ? "" : admin.phone,
                unitId: admin.unitId ?? units[0]?.id ?? "",
                isActive: admin.status === "Aktif"
              }}
              mode="update"
              units={units}
            />
          ) : null}
        </div>
        <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
          <p className="text-sm text-muted-foreground">Login terakhir: {admin.lastLogin}</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setEditing((value) => !value)} type="button" variant="secondary">
              <Pencil className="size-4" />
              {editing ? "Tutup Edit" : "Edit Admin"}
            </Button>
            <DeactivateAdminButton adminId={admin.id} disabled={admin.status !== "Aktif"} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SuperAdminDashboardPage({
  summary,
  unitsNeedAttention,
  pendingMonitoring
}: SuperAdminMonitoringData) {
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
                {summary.headline}
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
            {summary.spotlight.map((item) => (
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
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
            {summary.priorities.length === 0 ? (
              <EmptyState
                description="Semua unit utama saat ini berjalan stabil. Anda bisa lanjut memantau dashboard atau membuka detail unit bila ingin audit manual."
                icon={Shield}
                title="Belum ada prioritas mendesak"
              />
            ) : (
              summary.priorities.map((item) => (
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
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Unit yang perlu perhatian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unitsNeedAttention.length === 0 ? (
                <EmptyState
                  className="p-6"
                  description="Saat ini tidak ada unit yang masuk daftar perhatian cepat. Sistem global terlihat cukup stabil."
                  icon={Building2}
                  title="Belum ada unit yang perlu ditinjau"
                />
              ) : (
                unitsNeedAttention.map((unit) => (
                  <div className="rounded-[1.5rem] border border-border/70 p-5" key={unit.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">{unit.unit}</p>
                        <p className="text-sm text-muted-foreground">{unit.scope}</p>
                      </div>
                      <StatusBadge value={unit.status} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{unit.activity}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{unit.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Antrean review global</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMonitoring.length === 0 ? (
                <EmptyState
                  className="p-6"
                  description="Tidak ada antrean review aktif untuk saat ini. Item yang memerlukan perhatian akan muncul otomatis di area ini."
                  icon={Inbox}
                  title="Antrean review masih kosong"
                />
              ) : (
                pendingMonitoring.map((item) => (
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
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminUnitsPage({ units }: { units: SuperAdminUnitListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesQuery =
        query.length === 0 ||
        unit.name.toLowerCase().includes(query.toLowerCase()) ||
        unit.code.toLowerCase().includes(query.toLowerCase()) ||
        unit.address.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = statusFilter === "Semua" || unit.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, units]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Kelola Unit"
        title="Direktori unit Pegadaian"
        description="Kelola data unit, cek status kesiapan operasional, dan pastikan setiap unit memiliki rekening aktif serta admin yang terhubung."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
              <Input
                name="unitSearch"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari unit, alamat, atau kode unit..."
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
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {filteredUnits.length === 0 ? (
              <EmptyState
                description="Coba ubah kata kunci atau filter status. Unit yang cocok dengan pencarian Anda akan muncul di sini."
                icon={SearchX}
                title="Belum ada unit yang sesuai"
              />
            ) : (
              filteredUnits.map((unit) => (
                <Card className="border border-border/70 bg-white" key={unit.id}>
                  <CardContent className="grid gap-5 p-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-bold text-foreground">{unit.name}</p>
                        <StatusBadge value={unit.status} />
                        <Badge variant="muted">{unit.code}</Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{unit.address}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-surface-low p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Admin Aktif
                          </p>
                          <p className="mt-2 font-semibold text-foreground">{unit.adminCount}</p>
                        </div>
                        <div className="rounded-2xl bg-surface-low p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Rekening Tersimpan
                          </p>
                          <p className="mt-2 font-semibold text-foreground">{unit.accountCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                      <div className="flex items-center gap-3">
                        <WalletCards className="size-5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Rekening aktif unit</p>
                          <p className="text-sm text-muted-foreground">
                            Dipakai sebagai rekening tujuan pembayaran transaksi.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        {unit.activeAccount ? (
                          <>
                            <p className="font-semibold text-foreground">{unit.activeAccount.bankName}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{unit.activeAccount.accountNumber}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{unit.activeAccount.accountHolder}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Belum ada rekening aktif untuk unit ini.</p>
                        )}
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
              ))
            )}
          </div>
        </div>

        <UnitForm />
      </div>
    </div>
  );
}

export function SuperAdminUnitDetailPage({ unit }: { unit: SuperAdminUnitDetail | null }) {
  if (!unit) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Unit tidak ditemukan.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Detail Unit"
        title={unit.name}
        description="Lihat status unit, admin yang bertugas, dan rekening aktif saat ini dalam satu tempat."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={`/superadmin/unit/${unit.id}/rekening`}>
              <Button>
                <WalletCards className="size-4" />
                Kelola Rekening
              </Button>
            </Link>
            <DeactivateUnitButton disabled={!unit.isActive} unitId={unit.id} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Kode Unit", value: unit.code },
          { label: "Status", value: unit.status },
          { label: "Admin Aktif", value: String(unit.adminCount) },
          { label: "Jumlah Rekening", value: String(unit.accountCount) }
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
        <UnitForm
          initialValue={{
            code: unit.code,
            name: unit.name,
            address: unit.address,
            isActive: unit.isActive
          }}
          mode="update"
          unitId={unit.id}
        />

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Admin yang ditugaskan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unit.admins.length === 0 ? (
              <EmptyState
                className="p-6"
                description="Tambahkan admin unit agar operasional harian, verifikasi transaksi, dan pengelolaan aset bisa mulai berjalan."
                icon={UserCog}
                title="Belum ada admin yang ditugaskan"
              />
            ) : (
              unit.admins.map((admin) => (
                <div className="rounded-[1.5rem] border border-border/70 p-5" key={admin.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{admin.name}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                      <p className="text-sm text-muted-foreground">{admin.phone}</p>
                    </div>
                    <StatusBadge value={admin.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminUnitAccountsPage({ unit }: { unit: SuperAdminUnitDetail | null }) {
  if (!unit) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Unit tidak ditemukan.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Rekening Unit"
        title={`Kelola rekening ${unit.name}`}
        description="Setiap unit boleh memiliki lebih dari satu rekening. Superadmin menentukan rekening aktif yang dipakai untuk pembayaran."
      />

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Rekening aktif saat ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
              {unit.activeAccount ? (
                <div className="flex items-start gap-3">
                  <Landmark className="mt-1 size-5 text-primary" />
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{unit.activeAccount.bankName}</p>
                    <p className="text-sm text-muted-foreground">{unit.activeAccount.accountNumber}</p>
                    <p className="text-sm text-muted-foreground">{unit.activeAccount.accountHolder}</p>
                    <p className="text-sm text-muted-foreground">{unit.activeAccount.branch}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada rekening aktif untuk unit ini.</p>
              )}
            </div>

            <div className="space-y-4">
              {unit.accounts.length === 0 ? (
                <EmptyState
                  className="p-6"
                  description="Tambahkan rekening baru untuk unit ini. Anda tetap bisa menyimpan lebih dari satu rekening dan mengatur salah satunya sebagai rekening aktif."
                  icon={WalletCards}
                  title="Belum ada rekening unit"
                />
              ) : (
                unit.accounts.map((account) => (
                  <EditableAccountCard account={account} key={account.id} unitId={unit.id} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <RekeningForm unitId={unit.id} />
      </div>
    </div>
  );
}

export function SuperAdminAdminsPage({
  admins,
  units
}: {
  admins: SuperAdminAdminItem[];
  units: Array<{ id: string; name: string; code: string }>;
}) {
  const [query, setQuery] = useState("");

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      return (
        query.length === 0 ||
        admin.name.toLowerCase().includes(query.toLowerCase()) ||
        admin.email.toLowerCase().includes(query.toLowerCase()) ||
        admin.unit.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [admins, query]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Kelola Admin Unit"
        title="Akun admin unit"
        description="Buat akun admin baru, tempatkan ke unit yang tepat, dan nonaktifkan akun yang sudah tidak bertugas."
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
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
            {filteredAdmins.length === 0 ? (
              <EmptyState
                description="Coba kata kunci lain atau buat akun admin unit baru agar daftar ini mulai terisi."
                icon={SearchX}
                title="Belum ada admin yang sesuai pencarian"
              />
            ) : (
              filteredAdmins.map((admin) => (
                <EditableAdminCard admin={admin} key={admin.id} units={units} />
              ))
            )}
          </div>
        </div>

        <AdminUnitForm units={units} />
      </div>
    </div>
  );
}

export function SuperAdminMonitoringPage({ data }: { data: SuperAdminMonitoringData }) {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Monitoring Nasional"
        title="Pantau unit, rekening, dan akun admin"
        description="Halaman ini membantu superadmin membaca kondisi global lintas unit tanpa masuk ke operasional detail tiap cabang."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.metrics.map((metric) => (
          <Card className="border border-border/70 bg-white p-5" key={metric.label}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-4 text-3xl font-extrabold text-primary">{metric.value}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{metric.detail}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {data.pendingMonitoring.length === 0 ? (
          <EmptyState
            description="Tidak ada unit, rekening, atau akun admin yang membutuhkan perhatian cepat saat ini."
            icon={Shield}
            title="Monitoring sedang tenang"
          />
        ) : (
          data.pendingMonitoring.map((item) => (
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
                  <p className="text-sm text-muted-foreground">
                    Tinjau unit ini untuk memastikan rekening aktif, admin aktif, dan status operasionalnya tetap sinkron.
                  </p>
                  <Link href={`/superadmin/unit/${item.unitId}`}>
                    <Button variant="secondary">Buka Unit Terkait</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function SuperAdminBlacklistPage({ entries }: { entries: SuperAdminBlacklistItem[] }) {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Blacklist Global"
        title="Kelola akun dengan pelanggaran lintas unit"
        description="Superadmin dapat meninjau status blacklist, mempertahankan blokir, atau mencabutnya lebih awal dengan alasan yang terdokumentasi."
      />

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Daftar blacklist nasional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.length === 0 ? (
              <EmptyState
                className="p-6"
                description="Saat ini belum ada akun dengan blacklist aktif. Daftar ini akan terisi otomatis jika ada pelanggaran lintas unit."
                icon={ShieldBan}
                title="Belum ada blacklist aktif"
              />
            ) : (
              entries.map((item) => (
                <div className="rounded-[1.5rem] border border-border/70 p-5" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.email}</p>
                      <p className="text-sm text-muted-foreground">{item.unit}</p>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {item.total} pelanggaran | Berlaku sampai {item.until}
                  </p>
                </div>
              ))
            )}
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
                  <AlertTriangle className="mt-1 size-5 text-accent-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">Cabut blacklist lebih awal</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Tuliskan alasan pencabutan agar jejak keputusannya tetap tersimpan di sistem.
                    </p>
                  </div>
                </div>
              </div>

              {entries.find((entry) => entry.status === "Aktif") ? (
                <CabutBlacklistForm userId={entries.find((entry) => entry.status === "Aktif")!.userId} />
              ) : (
                <EmptyState
                  className="p-6"
                  description="Tidak ada akun aktif yang perlu dicabut blokirnya. Jika ada kasus baru, formulir tindakan akan muncul di sini."
                  icon={ShieldBan}
                  title="Belum ada aksi blacklist yang perlu diproses"
                />
              )}
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
