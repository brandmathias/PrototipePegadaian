import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

import { BidPage, LotDetailPage } from "@/components/pages/public-pages";
import { BidHistoryPage, BidVerificationPage, TransactionDetailPage } from "@/components/pages/user-pages";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";

const buyer: BuyerSessionUser = {
  id: "buyer-1",
  name: "Raras Maheswari",
  email: "raras@example.com",
  phoneNumber: "081200009999",
  role: "buyer",
  isActive: true
};

const vickreyLot: Lot = {
  id: "pm-vickrey-1",
  code: "BRG-VIC-001",
  name: "Cincin Emas",
  category: "Perhiasan",
  mode: "vickrey",
  price: 90000000,
  location: "Jl. Sam Ratulangi, Manado",
  unitName: "UPC Ranotana",
  city: "UPC Ranotana",
  condition: "Sangat Baik",
  status: "Lelang aktif",
  description: "Lelang tertutup dengan hasil dibuka setelah deadline.",
  countdown: "2 hari lagi",
  endsAt: "2099-05-05T14:07:00.000Z",
  media: [],
  specs: [{ label: "Harga dasar", value: "Rp 90.000.000" }]
};

const winningBid: BuyerBid = {
  lotId: "pm-vickrey-1",
  lot: "Cincin Emas",
  unit: "UPC Ranotana",
  status: "MENANG",
  closing: "4 Mei 2026, 22.07",
  bidAmount: 150000000,
  basePrice: 90000000,
  note: "Anda menang. Harga bayar Vickrey adalah Rp 100.000.000.",
  linkedTransactionId: "trx-vickrey-1",
  finalPrice: 100000000,
  paymentAmount: 100000000,
  transactionStatus: "MENUNGGU_KONFIRMASI_LANGSUNG",
  paymentDeadline: "5 Mei 2026, 22.07",
  paymentDeadlineAt: "2099-05-05T14:07:00.000Z"
} as BuyerBid;

describe("buyer vickrey pages", () => {
  it("turns a submitted bid on lot detail into a monitoring state instead of another bid CTA", () => {
    render(<LotDetailPage bidState={winningBid} buyerStatus={null} lot={vickreyLot} />);

    expect(screen.getByText(/bid sudah terkunci/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pantau riwayat bid/i })).toHaveAttribute("href", "/riwayat-bid");
    expect(screen.queryByRole("link", { name: /ikut lelang sekarang/i })).not.toBeInTheDocument();
  });

  it.each([
    ["level 1", 1],
    ["level 2", 2]
  ])("blocks the lot detail auction CTA for active blacklist %s", (_label, totalViolations) => {
    render(
      <LotDetailPage
        bidState={null}
        buyerStatus={{
          blacklist: {
            active: true,
            totalViolations,
            until: new Date("2026-05-31T00:00:00.000Z")
          }
        }}
        lot={vickreyLot}
      />
    );

    expect(screen.getByText(/anda tidak dapat mengirim bid baru/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ikut lelang sekarang/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lelang sedang dibatasi/i })).toBeDisabled();
  });

  it("locks the bid form when buyer already submitted a sealed bid", () => {
    render(<BidPage bidState={winningBid} buyerStatus={null} lot={vickreyLot} />);

    expect(screen.getByText(/bid anda sudah terkunci/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bid sudah terkunci/i })).toBeDisabled();
    expect(screen.getByRole("link", { name: /lihat riwayat bid/i })).toHaveAttribute("href", "/riwayat-bid");
  });

  it("opens bid terms from the main confirmation button before final vickrey submission", async () => {
    const user = userEvent.setup();

    render(
      <BidPage
        bidState={null}
        buyerId="buyer-1"
        buyerStatus={{ blacklist: { active: false, until: null, totalViolations: 0 } }}
        lot={vickreyLot}
      />
    );

    const submitButton = await screen.findByRole("button", { name: /konfirmasi bid tertutup/i });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    expect(screen.queryByRole("button", { name: /baca dan setujui syarat/i })).not.toBeInTheDocument();

    await user.click(submitButton);

    const dialog = screen.getByRole("dialog", { name: /syarat & ketentuan penawaran/i });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/baca dan cermati syarat dan ketentuan di bawah ini/i)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/pembayaran langsung di unit maksimal 24 jam setelah hasil lelang diumumkan/i)
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/konfirmasi lokasi bayar langsung/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Jl\. Sam Ratulangi, Manado/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Sabtu 08\.00-12\.00/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/status pelanggaran anda saat ini:\s*0x/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/level 1/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/7 hari/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/tidak bisa ikut vickrey\./i)).toBeInTheDocument();
    expect(within(dialog).getByText(/level 2/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/30 hari/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/tidak bisa membuat pembelian fixed price baru/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/level 3\+/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/365 hari/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/review admin/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/escrow terenkripsi/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/admin unit tidak dapat melihat nominal bid/i)).not.toBeInTheDocument();

    const modalAction = screen.getByRole("button", { name: /setujui dan kirim bid/i });
    expect(modalAction).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /saya telah membaca dan menyetujui/i }));
    expect(modalAction).toBeEnabled();
  });

  it("shows winner payment context in vickrey bid history", () => {
    render(<BidHistoryPage bids={[winningBid]} buyer={buyer} />);

    expect(screen.getAllByText(/harga bayar vickrey/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/status transaksi/i)).toBeInTheDocument();
    expect(screen.getByText(/menunggu konfirmasi langsung/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lanjutkan pembayaran/i })).toHaveAttribute(
      "href",
      "/transaksi/trx-vickrey-1"
    );
    expect(screen.getByRole("link", { name: /verifikasi bid/i })).toHaveAttribute(
      "href",
      "/riwayat-bid/pm-vickrey-1/verifikasi"
    );
  });

  it("shows bid integrity verification for the buyer", () => {
    render(
      <BidVerificationPage
        buyer={buyer}
        verification={{
          lotId: "pm-vickrey-1",
          lot: "Cincin Emas",
          unit: "UPC Ranotana",
          closing: "4 Mei 2026, 22.07",
          bidAmount: 150000000,
          bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d",
          computedHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d",
          salt: "salt-1",
          algorithm: "SHA-256",
          formula: "sha256(pemasaranId:userId:nominal:salt)",
          isMatch: true,
          canVerify: true,
          canReveal: false,
          isRevealed: true
        }}
      />
    );

    expect(screen.getByText(/bid anda tercatat dengan benar/i)).toBeInTheDocument();
    expect(screen.getByText(/sha-256/i)).toBeInTheDocument();
    expect(screen.getByText(/salt-1/i)).toBeInTheDocument();
    expect(screen.getAllByText(/864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d/i)).toHaveLength(2);
  });

  it("explains vickrey final price in the buyer payment detail", () => {
    const transaction: BuyerTransaction = {
      id: "trx-vickrey-1",
      lotId: "pm-vickrey-1",
      kind: "VICKREY_WIN",
      title: "Cincin Emas",
      amount: 100000000,
      status: "MENUNGGU_KONFIRMASI_LANGSUNG",
      method: "BAYAR_LANGSUNG",
      unit: "UPC Ranotana",
      unitAddress: "Jl. Sam Ratulangi, Manado",
      createdAt: "4 Mei 2026, 22.07",
      deadline: "5 Mei 2026, 22.07",
      deadlineAt: "2099-05-05T14:07:00.000Z",
      reference: "-",
      applicationNumber: "PGJ-VIC-TRXVICKR",
      paymentLabel: "Bayar langsung di unit",
      paymentNotes: ["Anda memenangkan lelang Vickrey dan membayar langsung di unit."],
      winnerContext: "Pemenang Vickrey membayar harga final yang dihitung sistem."
    };

    render(<TransactionDetailPage buyer={buyer} transaction={transaction} transactionId={transaction.id} />);

    expect(screen.getByText(/harga final vickrey/i)).toBeInTheDocument();
    expect(screen.getByText(/bukan nominal bid tertinggi anda/i)).toBeInTheDocument();
    expect(screen.getByText(/batas pembayaran 24 jam/i)).toBeInTheDocument();
    expect(screen.getByText(/bayar langsung di unit/i)).toBeInTheDocument();
  });
});
