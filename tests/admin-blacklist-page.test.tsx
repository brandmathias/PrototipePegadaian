import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import {
  AdminBlacklistDetailPage,
  AdminBlacklistPage,
} from "@/components/pages/admin-pages";

function makeBlacklistEntry(index: number) {
  return {
    activeAuctionRestriction: "Tidak dapat mengikuti lelang aktif.",
    blockedUntilAt: "2026-06-25T23:59:59.000Z",
    email: `pengguna${index}@example.com`,
    history: [
      {
        action: "blokir_otomatis",
        actionLabel: "Blokir otomatis",
        actorLabel: "Sistem otomatis",
        actorType: "system",
        date: "18 Mei 2026",
        note: "Pemenang Vickrey tidak membayar dalam 24 jam.",
      },
    ],
    lastIncident: "18 Mei 2026",
    latestUnpaidAuction: {
      amount: 200000000,
      auctionMode: "VICKREY_AUCTION",
      basePrice: 150000000,
      imageUrl: "/uploads/barang/motor-racing.jpg",
      itemAppraisalValue: 220000000,
      itemCategory: "kendaraan",
      itemCondition: "baik",
      itemDescription: "Motor racing dengan dokumen lengkap.",
      itemName: `Motor Racing ${index}`,
      lotCode: `LOT-2026-00${index}`,
      lotLabel: `BRG-4426266${index}`,
      occurredAt: "2026-05-18T10:00:00.000Z",
      occurredAtLabel: "18 Mei 2026, 10.00 WIB",
      paymentDeadlineLabel: "19 Mei 2026, 10.00 WIB",
      transactionId: `trx-${index}`,
      transactionStatus: "menunggu_pembayaran",
    },
    level: Math.min(index, 3),
    levelLabel: `Level ${Math.min(index, 3)}: Vickrey dibatasi`,
    name: `Pengguna ${index}`,
    phone: "081234567890",
    reason: "Tidak menyelesaikan pembayaran lelang dalam batas waktu.",
    status: "AKTIF",
    unit: "Ranotana",
    until: "2026-06-25",
    unpaidAuctionCount: 1,
    unpaidAuctionTraces: [
      {
        amount: 200000000,
        auctionMode: "VICKREY_AUCTION",
        basePrice: 150000000,
        imageUrl: "/uploads/barang/motor-racing.jpg",
        id: `violation-${index}`,
        itemAppraisalValue: 220000000,
        itemCategory: "kendaraan",
        itemCondition: "baik",
        itemDescription: "Motor racing dengan dokumen lengkap.",
        itemName: `Motor Racing ${index}`,
        occurredAt: "2026-05-18T10:00:00.000Z",
        occurredAtLabel: "18 Mei 2026, 10.00 WIB",
        lotCode: `LOT-2026-00${index}`,
        lotLabel: `BRG-4426266${index}`,
        note: "Pemenang lelang tidak menyelesaikan pembayaran sampai batas waktu.",
        paymentDeadlineLabel: "19 Mei 2026, 10.00 WIB",
        transactionId: `trx-${index}`,
        transactionStatus: "menunggu_pembayaran",
      },
      {
        amount: 90000000,
        auctionMode: "FIXED_PRICE",
        basePrice: 85000000,
        imageUrl: "/uploads/barang/kalung-emas.jpg",
        id: `violation-${index}-older`,
        itemAppraisalValue: 100000000,
        itemCategory: "emas",
        itemCondition: "baik",
        itemDescription: "Kalung emas dengan surat unit.",
        itemName: `Kalung Emas ${index}`,
        occurredAt: "2026-04-28T10:00:00.000Z",
        occurredAtLabel: "28 April 2026, 10.00 WIB",
        lotCode: `LOT-2026-OLD-${index}`,
        lotLabel: `BRG-3280770${index}`,
        note: "Pemenang lelang sebelumnya tidak menyelesaikan pembayaran.",
        paymentDeadlineLabel: "29 April 2026, 10.00 WIB",
        transactionId: `trx-${index}-older`,
        transactionStatus: "gagal_bayar",
      },
    ],
    userId: `user-${index}`,
    violations: index,
  };
}

describe("AdminBlacklistPage", () => {
  it("paginates blacklist entries with shared row options", () => {
    render(
      <AdminBlacklistPage
        entries={Array.from({ length: 11 }, (_, index) =>
          makeBlacklistEntry(index + 1),
        )}
      />,
    );

    expect(screen.getByText("Pengguna 1")).toBeInTheDocument();
    expect(screen.getByText("Pengajuan review dari buyer")).toBeInTheDocument();
    expect(screen.queryByText("Pengguna 11")).not.toBeInTheDocument();
    expect(screen.getByText("Total Blacklist")).toBeInTheDocument();
    expect(screen.getByText("Pelanggaran 7 Hari Terakhir")).toBeInTheDocument();
    expect(screen.getAllByText("Blacklist Permanen").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /lihat detail/i })).toHaveLength(
      10,
    );
    expect(
      screen.queryByRole("link", { name: /perpanjang/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("Pengguna 11")).toBeInTheDocument();
  });

  it("shows local blacklist review intake cases for admin unit", () => {
    render(
      <AdminBlacklistPage
        entries={[makeBlacklistEntry(1)]}
        reviewCases={[
          {
            id: "case-1",
            buyerName: "Raras Mahesa",
            buyerEmail: "raras@example.com",
            itemName: "Kalung Emas",
            unitName: "UPC Ranotana",
            status: "TERKIRIM",
            submittedAt: "2026-05-30T00:00:00.000Z",
            hasRecommendation: false,
            crossUnitSignal: "Riwayat lintas unit tersedia untuk superadmin",
          },
        ]}
      />,
    );

    expect(screen.getByText("Raras Mahesa")).toBeInTheDocument();
    expect(screen.getByText("Kalung Emas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /beri rekomendasi/i }),
    ).toBeInTheDocument();
  });

  it("shows violation detail with level, countdown context, and unpaid auction traces", () => {
    render(
      <AdminBlacklistDetailPage
        entry={makeBlacklistEntry(2)}
        userId="user-2"
      />,
    );

    expect(screen.getByText("Detail Kasus Nasabah")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Pelanggaran")).toBeInTheDocument();
    expect(
      screen.getByText("Barang Tidak Dibayar"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Level 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("BRG-44262662").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Motor Racing 2").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("img", { name: /foto barang motor racing 2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Harga Dasar")).toBeInTheDocument();
    expect(screen.getByText("Rp 150.000.000")).toBeInTheDocument();
    expect(screen.getByText("Nilai Taksiran")).toBeInTheDocument();
    expect(screen.getByText("Rp 220.000.000")).toBeInTheDocument();
    expect(screen.getByText(/30 hari/i)).toBeInTheDocument();
    expect(screen.getByText(/Vickrey Auction/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Pemenang lelang tidak menyelesaikan pembayaran/i)
        .length,
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: /pilih riwayat pelanggaran level 1 kalung emas 2/i,
      }),
    );

    expect(screen.getByText(/7 hari/i)).toBeInTheDocument();
    expect(screen.getAllByText("Kalung Emas 2").length).toBeGreaterThan(0);
    expect(screen.getByText("Rp 85.000.000")).toBeInTheDocument();
    expect(screen.getAllByText(/Fixed Price/i).length).toBeGreaterThan(0);
  });
});
