import React from "react";
import { render, screen } from "@testing-library/react";

import { AdminInventoryDetailPage } from "@/components/pages/admin-pages";

const baseItem = {
  id: "barang-demo",
  code: "BRG-001",
  name: "Kalung Emas",
  category: "emas",
  appraisalValue: 10000000,
  loanValue: 7000000,
  pawnedAt: "2026-04-01",
  dueDate: "2026-05-01",
  mediaSummary: "2 media",
  status: "JAMINAN",
  description: "Lengkap",
  ownerName: "Nasabah Demo",
  customerNumber: "NAS-001",
  media: []
};

describe("AdminInventoryDetailPage", () => {
  it("keeps extension, redemption, marketing, and edit actions available before publishing", () => {
    render(<AdminInventoryDetailPage item={baseItem} />);

    expect(screen.getByRole("heading", { name: /catat perpanjangan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /catat penebusan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pasarkan barang tidak ditebus/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /edit data barang/i })).toBeInTheDocument();
  });

  it("keeps failed auction barang editable before it is auctioned again", () => {
    render(
      <AdminInventoryDetailPage
        item={{
          ...baseItem,
          status: "GAGAL",
          marketingMode: "vickrey",
          marketingIteration: 2,
          nextAction: "Evaluasi harga dasar dan tayangkan ulang sebagai lelang."
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /edit data barang/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /lelang lagi/i })).toBeInTheDocument();
  });
});
