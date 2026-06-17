import { render, screen } from "@testing-library/react";

import { BuyerViolationPage } from "@/components/buyer/buyer-violation-page";
import type { BuyerViolationPageData } from "@/lib/services/buyer.service";

const activeLevelTwoData: BuyerViolationPageData = {
  summary: {
    name: "Buyer Demo 13 B",
    email: "buyer.20260513.02@example.com",
    image: null,
    wishlistCount: 0,
    phone: "08123456789",
    nationalId: "7171000000000001",
    memberSince: "13 Mei 2026",
    security: {
      passwordUpdatedAt: "13 Mei 2026",
      activeSessionCount: 1,
      sessionHistory: []
    },
    blacklist: {
      active: true,
      incidentId: "violation-2",
      until: "12 Juli 2026",
      reason: "Akun sedang dibatasi untuk membuat transaksi baru dan menyelesaikan transaksi berjalan sampai masa pembatasan berakhir.",
      violations: 2
    }
  },
  blacklistUntilAt: "2026-07-12T16:00:00.000Z",
  violations: [
    {
      id: "violation-2",
      amount: 16000000,
      auctionMode: "vickrey",
      escalationEligible: true,
      imageUrl: "/uploads/kalung.jpg",
      itemCode: "BRG-55291335",
      itemName: "Kalung Emas 2",
      note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.",
      occurredAt: "2026-06-12T05:33:00.000Z",
      occurredAtLabel: "12 Juni 2026, 13.33 WITA",
      paymentDeadline: "2026-06-13T05:33:00.000Z",
      paymentDeadlineLabel: "13 Juni 2026, 13.33 WITA",
      status: "gagal",
      transactionId: "trx-2",
      unitName: "UPC Ranotana",
      violationLevel: 2
    },
    {
      id: "violation-1",
      amount: 25000000,
      auctionMode: "fixed",
      escalationEligible: true,
      imageUrl: null,
      itemCode: "BRG-34145928",
      itemName: "Laptop",
      note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.",
      occurredAt: "2026-03-20T07:00:00.000Z",
      occurredAtLabel: "20 Maret 2026, 15.00 WITA",
      paymentDeadline: "2026-03-21T07:00:00.000Z",
      paymentDeadlineLabel: "21 Maret 2026, 15.00 WITA",
      status: "gagal",
      transactionId: "trx-1",
      unitName: "UPC Ranotana",
      violationLevel: 1
    }
  ]
};

describe("BuyerViolationPage", () => {
  it("renders active restriction details from real buyer blacklist data", () => {
    render(<BuyerViolationPage data={activeLevelTwoData} serverNow="2026-06-17T06:02:00.000Z" />);

    expect(screen.getByRole("heading", { name: /status penawaran anda/i })).toBeInTheDocument();
    expect(screen.getByText(/sedang dibatasi sementara/i)).toBeInTheDocument();
    expect(screen.getAllByText(/level 2 pembatasan/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/12 juli 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/pengajuan bid lelang baru/i)).toBeInTheDocument();
    expect(screen.getByText(/pembelian harga tetap baru/i)).toBeInTheDocument();
    expect(screen.getByText(/unduh bukti transaksi lama/i)).toBeInTheDocument();
    expect(screen.getByText(/kalung emas 2/i)).toBeInTheDocument();
    expect(screen.getByText(/rp 16.000.000/i)).toBeInTheDocument();
    expect(screen.getAllByText(/upc ranotana/i).length).toBeGreaterThan(0);
  });

  it("shows a healthy account state when the buyer has no active restriction", () => {
    render(
      <BuyerViolationPage
        data={{
          ...activeLevelTwoData,
          blacklistUntilAt: null,
          summary: {
            ...activeLevelTwoData.summary,
            blacklist: {
              active: false,
              incidentId: null,
              reason: "Tidak ada pembatasan aktif. Akun dapat mengikuti harga tetap dan lelang.",
              until: "-",
              violations: 0
            }
          },
          violations: []
        }}
        serverNow="2026-06-17T06:02:00.000Z"
      />
    );

    expect(screen.getAllByText(/akun dalam kondisi baik/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/tidak ada riwayat pelanggaran pembayaran/i)).toBeInTheDocument();
  });
});
