"use client";

import { ReactNode, useState } from "react";
import { ShieldEllipsis } from "lucide-react";

import { AdminDatePicker } from "@/components/admin-unit/admin-date-picker";
import { AdminUnitActionButton } from "@/components/admin-unit/admin-unit-action-button";
import { Textarea } from "@/components/ui/textarea";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
      {children}
    </label>
  );
}

export function AdminBlacklistExtendForm({
  defaultBlockedUntil,
  userId
}: {
  defaultBlockedUntil: string;
  userId: string;
}) {
  const [blockedUntil, setBlockedUntil] = useState(defaultBlockedUntil);
  const [reason, setReason] = useState("Masa blokir diperpanjang berdasarkan evaluasi admin unit.");

  return (
    <div className="grid gap-5 p-6">
      <AdminDatePicker
        label="Tanggal blokir selesai baru"
        name="blockedUntil"
        onChange={setBlockedUntil}
        value={blockedUntil}
      />
      <div className="space-y-2">
        <FieldLabel>Alasan perpanjangan</FieldLabel>
        <Textarea
          className="min-h-32"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Tuliskan alasan yang jelas agar tim lain mudah menelusuri keputusan ini."
          value={reason}
        />
      </div>
      <AdminUnitActionButton
        className="h-12 w-full rounded-2xl"
        confirmDescription="Perpanjangan blokir akan langsung memperbarui masa pembatasan pengguna di unit ini."
        confirmLabel="Simpan perpanjangan"
        confirmTitle="Perpanjang masa pembatasan"
        confirmVariant="destructive"
        endpoint={`/api/admin/blacklist/${userId}/perpanjang`}
        pendingDescription="Tanggal berakhir blokir dan catatan alasan sedang diperbarui."
        pendingTitle="Memperpanjang blacklist"
        payload={{
          blockedUntil,
          reason: reason.trim() || "Masa blokir diperpanjang berdasarkan evaluasi admin unit."
        }}
        redirectTo={`/admin/blacklist/${userId}`}
        successDescription="Masa pembatasan akun sudah diperbarui."
        successTitle="Blacklist diperpanjang"
      >
        <ShieldEllipsis className="size-4" />
        Simpan pembaruan blokir
      </AdminUnitActionButton>
    </div>
  );
}
