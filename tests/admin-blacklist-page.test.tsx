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
        note: "Pemenang Lelang Tertutup tidak membayar dalam 24 jam.",
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
    levelLabel: `Level ${Math.min(index, 3)}: Lelang Tertutup dibatasi`,
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
    expect(screen.queryByRole("button", { name: /tinjau sekarang/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Pengguna 11")).not.toBeInTheDocument();
    expect(screen.getByText("Pembatasan Aktif")).toBeInTheDocument();
    expect(screen.getByText(/ledger blacklist buyer di unit ini/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Cari nama, email, level, atau alasan..."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Unit")).not.toBeInTheDocument();
    expect(screen.queryByText("Ranotana")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /level 3/i })).toBeInTheDocument();
    expect(screen.queryByText(/insiden 7 hari/i)).not.toBeInTheDocument();
    expect(screen.getByText("Tingkat Pelanggaran")).toBeInTheDocument();
    const detailLinks = screen.getAllByRole("link", { name: /lihat detail/i });
    expect(detailLinks).toHaveLength(10);
    expect(detailLinks[0]).toHaveClass("hover:bg-[#006747]", "hover:text-white");
    expect(
      screen.queryByRole("link", { name: /perpanjang/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("Pengguna 11")).toBeInTheDocument();
  });

  it("filters the historical list using the true ended restriction state", () => {
    render(
      <AdminBlacklistPage
        entries={[
          makeBlacklistEntry(1),
          {
            ...makeBlacklistEntry(2),
            name: "Riwayat Pembatasan",
            status: "BERAKHIR",
            userId: "ended-user",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /berakhir 1/i }));

    expect(screen.getByText("Riwayat Pembatasan")).toBeInTheDocument();
    expect(screen.queryByText("Pengguna 1")).not.toBeInTheDocument();
  });

  it("shows violation detail with level, countdown context, and unpaid auction traces", () => {
    render(
      <AdminBlacklistDetailPage
        entry={makeBlacklistEntry(2)}
        serverNow="2026-06-16T05:15:00.000Z"
        userId="user-2"
      />,
    );

    expect(screen.getByText("Detail Pelanggaran Pengguna")).toBeInTheDocument();
    expect(screen.queryByText("Detail Kasus Nasabah")).not.toBeInTheDocument();
    expect(screen.getByText("Kasus Terakhir")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Pelanggaran (Timeline)")).toBeInTheDocument();
    expect(screen.getByText("Pelanggaran Tercatat")).toBeInTheDocument();
    expect(screen.getByText("Di Unit Terkait")).toBeInTheDocument();
    expect(screen.getByText("Di Luar Unit")).toBeInTheDocument();
    expect(screen.getByText("Keterangan Level Pelanggaran")).toBeInTheDocument();
    expect(screen.getByText(/Selama 7 hari, buyer tidak bisa menawar pada Lelang Tertutup/i)).toBeInTheDocument();
    expect(screen.getByText(/Pembelian barang Harga Tetap tetap tersedia/i)).toBeInTheDocument();
    expect(screen.getByText(/Selama 30 hari, buyer tidak bisa menawar pada Lelang Tertutup/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak bisa membeli barang Harga Tetap/i)).toBeInTheDocument();
    expect(screen.getByText(/Selama 365 hari, akun buyer ditangguhkan/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak bisa login masuk ke sistem/i)).toBeInTheDocument();
    expect(screen.getByText("Masa Berlaku Hukuman")).toBeInTheDocument();
    expect(screen.queryByText(/Sisa waktu/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Log Keputusan Sistem")).not.toBeInTheDocument();
    expect(screen.queryByText("Ketetapan Level")).not.toBeInTheDocument();
    expect(screen.queryByText("Konteks Lintas Unit")).not.toBeInTheDocument();
    expect(screen.getByText(/Dossier unit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/barang lelang unit ini/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Dossier nasional/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lintas unit/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Pelanggaran$/i })).toHaveAttribute("href", "/admin/blacklist");
    expect(screen.getAllByText(/Level 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Motor Racing 2").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("img", { name: /foto barang motor racing 2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nilai Tagihan")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 200.000.000").length).toBeGreaterThan(0);
    expect(screen.getByText("Nama Barang")).toBeInTheDocument();
    expect(screen.getByText("Batas Waktu Bayar")).toBeInTheDocument();
    expect(screen.getByText("Winning Bid")).toBeInTheDocument();
    expect(screen.getAllByText(/30 hari/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Pemenang lelang tidak melakukan pembayaran/i)
        .length,
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Pelanggaran Level 1/i,
      }),
    );

    expect(screen.getAllByText(/Level 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kalung Emas 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 90.000.000").length).toBeGreaterThan(0);
  });

  it("derives admin violation levels from sequential unit traces when stored totals are stale", () => {
    const staleEntry = {
      ...makeBlacklistEntry(2),
      level: 2,
      unpaidAuctionCount: 3,
      unpaidAuctionTraces: [
        ...makeBlacklistEntry(2).unpaidAuctionTraces,
        {
          amount: 45000000,
          auctionMode: "VICKREY_AUCTION",
          basePrice: 40000000,
          id: "violation-extra",
          itemName: "Jam Tangan",
          occurredAt: "2026-03-20T10:00:00.000Z",
          occurredAtLabel: "20 Maret 2026, 10.00 WIB",
          lotCode: "LOT-EXTRA",
          lotLabel: "BRG-EXTRA",
          note: "Pelanggaran pembayaran sebelumnya.",
          paymentDeadlineLabel: "21 Maret 2026, 10.00 WIB",
          transactionId: "trx-extra",
          transactionStatus: "gagal_bayar",
        },
      ],
      violations: 2,
    };

    render(
      <AdminBlacklistDetailPage
        entry={staleEntry}
        userId="user-2"
      />,
    );

    expect(screen.queryByRole("button", { name: /Pelanggaran Level 3/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Level 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Level 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/30 hari/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Pelanggaran Level 3/i })).not.toBeInTheDocument();
  });

  it("shows safe cross-unit context without exposing other unit violation details", () => {
    render(
      <AdminBlacklistDetailPage
        entry={{
          ...makeBlacklistEntry(2),
          crossUnitViolationSummary: {
            currentUnitViolationCount: 1,
            effectiveViolationTotal: 2,
            externalUnitCount: 1,
            externalViolationCount: 1,
            hasExternalViolations: true,
          },
          latestUnpaidAuction: {
            ...makeBlacklistEntry(2).latestUnpaidAuction,
            restrictionLevel: 2,
          },
          unpaidAuctionCount: 1,
          unpaidAuctionTraces: [
            {
              ...makeBlacklistEntry(2).unpaidAuctionTraces[0],
              restrictionLevel: 2,
            },
          ],
          violations: 2,
        }}
        userId="user-2"
      />,
    );

    expect(screen.getByText("Pelanggaran Tercatat")).toBeInTheDocument();
    expect(screen.getByText("Di Unit Terkait")).toBeInTheDocument();
    expect(screen.getByText("Di Luar Unit")).toBeInTheDocument();
    expect(screen.getAllByText("1 kasus").length).toBeGreaterThan(0);
    expect(screen.queryByText("Konteks Lintas Unit")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pelanggaran Level 2/i })).toBeInTheDocument();
    expect(screen.queryByText("UPC Unit Lain")).not.toBeInTheDocument();
    expect(screen.queryByText("Barang Unit Lain")).not.toBeInTheDocument();
  });
});
