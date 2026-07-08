import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SuperAdminUnitBarangDetailPage } from "@/components/pages/superadmin-unit-barang-detail-page";

describe("route-real superadmin unit barang detail page", () => {
  it("places asset chronology below the item detail card as a compact full-width table", () => {
    render(
      <SuperAdminUnitBarangDetailPage
        detail={
          {
            unit: {
              id: "unit-wanea",
              code: "UPC-WANEA",
              name: "UPC Wanea",
              address: "Wanea",
              status: "Aktif",
            },
            item: {
              id: "barang-fixed-rejected",
              code: "SBG-117870000000024",
              name: "Kalung Salib Emas 17K",
              category: "perhiasan",
              condition: "baik",
              status: "dipasarkan",
              appraisalValue: 15_000_000,
              specifications: {
                jenisEmas: "Kalung Emas Dengan Liontin Salib",
                kadarEmas: "70,8% / 17K",
                berat: "8,53 gram",
              },
              media: [],
              pawnedAt: "2026-05-26",
              dueDate: "2026-06-25",
              ownerName: "Andi Wijaya",
              customerNumber: "0899000000009",
              description: "Kalung salib emas 17K dengan kondisi baik.",
            },
            operationalStatus: "Sedang Dipasarkan",
            operationalTone: "blue",
            marketing: null,
            history: [
              {
                id: "hist-gagal",
                barangId: "barang-fixed-rejected",
                actionKey: "gagal",
                actionLabel: "Gagal",
                note: "Verifikasi bukti pembayaran harga tetap ditolak admin unit.",
                actorName: "Maria Supit",
                createdAtLabel: "6 Jul 2026, 15.36 WIB",
              },
              {
                id: "hist-dipasarkan",
                barangId: "barang-fixed-rejected",
                actionKey: "dipasarkan",
                actionLabel: "Dipasarkan",
                note: "Barang dipublikasikan ke katalog.",
                actorName: "Admin Unit Ranotana",
                createdAtLabel: "23 Jun 2026, 05.00 WIB",
              },
            ],
          } as any
        }
      />,
    );

    const stack = screen.getByTestId("route-real-superadmin-item-audit-stack");
    const detailCard = screen.getByTestId("route-real-superadmin-item-detail-main-card");
    const priceFrame = screen.getByTestId("route-real-superadmin-item-price-frame");
    const timeline = screen.getByTestId("route-real-superadmin-asset-timeline");

    expect(stack).toHaveClass("grid", "gap-4");
    expect(stack).not.toHaveClass("xl:grid-cols-[minmax(0,1.7fr)_21.5rem]");
    expect(stack).toContainElement(detailCard);
    expect(stack).toContainElement(timeline);
    expect(detailCard.compareDocumentPosition(timeline) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(priceFrame).toHaveTextContent("Nilai Taksiran");
    expect(priceFrame).toHaveTextContent("Rp 15.000.000");
    expect(timeline.querySelector("table")).not.toBeNull();
    expect(timeline).toHaveTextContent("Status");
    expect(timeline).toHaveTextContent("Tanggal & Jam");
    expect(timeline).toHaveTextContent("Deskripsi");
    expect(timeline).toHaveTextContent("Aktor / Sumber");
    expect(timeline).toHaveTextContent("Aktor Internal: Maria Supit");
    expect(timeline.querySelector(".lucide-megaphone")).not.toBeNull();
    expect(timeline.querySelector(".lucide-ban")).not.toBeNull();
  });
});
