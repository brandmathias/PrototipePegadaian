import { act, fireEvent, render, screen, within } from "@testing-library/react";

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
      reason: "Akun sedang dibatasi untuk menawar Lelang Tertutup dan membeli barang Harga Tetap sampai masa pembatasan berakhir.",
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
      occurredAt: "2026-06-13T05:33:00.000Z",
      occurredAtLabel: "13 Juni 2026, 13.33 WITA",
      paymentDeadline: "2026-06-13T05:33:00.000Z",
      paymentDeadlineLabel: "13 Juni 2026, 13.33 WITA",
      status: "gagal",
      transactionId: "trx-2",
      unitName: "UPC Ranotana",
      violationLevel: 2,
      wonAt: "2026-06-12T05:33:00.000Z",
      wonAtLabel: "12 Juni 2026, 13.33 WITA"
    } as any,
    {
      id: "violation-1",
      amount: 25000000,
      auctionMode: "fixed",
      escalationEligible: true,
      imageUrl: null,
      itemCode: "BRG-34145928",
      itemName: "Laptop",
      note: "Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.",
      occurredAt: "2026-03-21T07:00:00.000Z",
      occurredAtLabel: "21 Maret 2026, 15.00 WITA",
      paymentDeadline: "2026-03-21T07:00:00.000Z",
      paymentDeadlineLabel: "21 Maret 2026, 15.00 WITA",
      status: "gagal",
      transactionId: "trx-1",
      unitName: "UPC Ranotana",
      violationLevel: 1,
      wonAt: "2026-03-20T07:00:00.000Z",
      wonAtLabel: "20 Maret 2026, 15.00 WITA"
    } as any
  ]
};

describe("BuyerViolationPage", () => {
  it("keeps win time, payment deadline, and violation time separated", () => {
    render(<BuyerViolationPage data={activeLevelTwoData} serverNow="2026-06-17T06:02:00.000Z" />);

    expect(screen.getByText(/waktu menang lelang/i).parentElement).toHaveTextContent(
      "12 Juni 2026, 13.33 WITA"
    );
    expect(screen.getByText(/batas waktu bayar/i).parentElement).toHaveTextContent(
      "13 Juni 2026, 13.33 WITA"
    );

    fireEvent.click(screen.getByRole("button", { name: /tutup detail pelanggaran kalung emas 2/i }));

    expect(screen.getAllByText(/tanggal terjadi/i)[0]?.parentElement).toHaveTextContent(
      "13 Juni 2026, 13.33 WITA"
    );
  });

  it("renders active restriction details from real buyer blacklist data", () => {
    render(<BuyerViolationPage data={activeLevelTwoData} serverNow="2026-06-17T06:02:00.000Z" />);

    const restrictedFeaturesSection = screen.getByTestId("restricted-features-section");
    const violationHistorySection = screen.getByTestId("violation-history-section");

    expect(screen.getByRole("heading", { name: /status penawaran anda/i })).toBeInTheDocument();
    expect(screen.getByText(/sedang dibatasi sementara/i)).toBeInTheDocument();
    expect(screen.getAllByText(/level 2 pembatasan/i).length).toBeGreaterThan(0);
    expect(
      within(restrictedFeaturesSection).getByRole("heading", { name: "Fitur yang Dibatasi Saat Ini" })
    ).toBeInTheDocument();
    expect(screen.getByText(/12 juli 2026/i)).toBeInTheDocument();
    expect(within(restrictedFeaturesSection).getByText(/pengajuan bid lelang baru/i)).toBeInTheDocument();
    expect(within(restrictedFeaturesSection).getByText(/pembelian harga tetap baru/i)).toBeInTheDocument();
    expect(within(restrictedFeaturesSection).queryByText(/penyelesaian transaksi berjalan/i)).not.toBeInTheDocument();
    expect(within(restrictedFeaturesSection).getByText(/2 fitur dibatasi pada level 2/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /fitur yang tetap aktif/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/unduh bukti transaksi lama/i)).not.toBeInTheDocument();
    expect(restrictedFeaturesSection).toHaveClass("min-h-[20rem]");
    expect(violationHistorySection).toHaveClass("min-h-[20rem]");
    expect(screen.getByRole("heading", { name: /riwayat pelanggaran/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /bantuan pembatasan/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/ketentuan sistem/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/kalung emas 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/level 2 pembatasan \(30 hari\)/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/kasus dihitung/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/BRG-55291335/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/BRG-34145928/i)).not.toBeInTheDocument();
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

    const restrictedFeaturesSection = screen.getByTestId("restricted-features-section");

    expect(screen.getAllByText(/akun dalam kondisi baik/i).length).toBeGreaterThan(0);
    expect(
      within(restrictedFeaturesSection).getByText("Tidak Ada Fitur yang Dibatasi Saat Ini")
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /fitur yang tetap aktif/i })).not.toBeInTheDocument();
    expect(screen.getByText(/tidak ada riwayat pelanggaran pembayaran/i)).toBeInTheDocument();
  });

  it("keeps the restriction countdown moving after the page renders", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T06:02:00.000Z"));

    try {
      render(
        <BuyerViolationPage
          data={{
            ...activeLevelTwoData,
            blacklistUntilAt: "2026-06-17T06:02:03.000Z"
          }}
          serverNow="2026-06-17T06:02:00.000Z"
        />
      );

      expect(screen.getByText("03")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText("02")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("lets the latest expanded violation collapse from its own dropdown control", () => {
    render(<BuyerViolationPage data={activeLevelTwoData} serverNow="2026-06-17T06:02:00.000Z" />);

    expect(screen.getByRole("button", { name: /tutup detail pelanggaran kalung emas 2/i })).toBeInTheDocument();
    expect(screen.getByText(/batas waktu bayar/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tutup detail pelanggaran kalung emas 2/i }));

    expect(screen.getByRole("button", { name: /buka detail pelanggaran kalung emas 2/i })).toBeInTheDocument();
    expect(screen.getByText(/^Kalung Emas 2$/i).closest("article")).toHaveClass("border-orange-300");
    expect(screen.getByText(/masa sanksi aktif/i).closest("span")).toHaveClass(
      "border-orange-100",
      "bg-orange-50",
      "text-orange-700"
    );
    expect(screen.queryByText(/batas waktu bayar/i)).not.toBeInTheDocument();
  });
});
