import { render, screen } from "@testing-library/react";
import { CheckCircle2, ShieldCheck, WalletCards } from "lucide-react";

import { CompactTransactionProgress } from "@/components/shared/compact-transaction-progress";

describe("CompactTransactionProgress", () => {
  it("wraps long actor names instead of truncating them", () => {
    render(
      <CompactTransactionProgress
        steps={[
          {
            label: "Pembayaran",
            status: "Bukti dikirim",
            actor: "Buyer: Brando Mathias Alexander Putra Ranotana",
            occurredAt: "13 Jul 2026, 09.05 WIB",
            icon: WalletCards,
            tone: "done"
          },
          {
            label: "Verifikasi",
            status: "Ditolak",
            actor: "Admin: Andika Pratama Mahendra Kusuma",
            occurredAt: "13 Jul 2026, 09.05 WIB",
            icon: ShieldCheck,
            tone: "failed"
          },
          {
            label: "Selesai",
            status: "Transaksi dibatalkan",
            icon: CheckCircle2,
            tone: "pending"
          }
        ]}
        title="Progress Penyelesaian"
      />
    );

    const adminActor = screen.getByText("Admin: Andika Pratama Mahendra Kusuma");
    expect(adminActor.className).toContain("whitespace-normal");
    expect(adminActor.className).toContain("break-words");
    expect(adminActor.className).not.toContain("truncate");
    expect(adminActor.className).not.toContain("line-clamp");
  });
});
