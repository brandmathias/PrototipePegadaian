import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/katalog/pm-fixed-1",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(""),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  }
}));

import { LotDetailPage } from "@/components/public/lot-detail-page";
import { BidPage, PurchasePage } from "@/components/pages/public-pages";
import { AuctionLoserRecommendationCountdown } from "@/components/buyer/auction-loser-recommendation-countdown";
import { AuctionLoserPage, AuctionWinnerPage, BidHistoryPage, BidVerificationPage, TransactionDetailPage } from "@/components/pages/user-pages";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";

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

const fixedPriceLot: Lot = {
  id: "pm-fixed-1",
  code: "BRG-FIX-001",
  name: "Gelang Emas",
  category: "Perhiasan",
  mode: "fixed_price",
  price: 45000000,
  location: "Jl. Boulevard, Manado",
  unitName: "UPC Boulevard",
  domicile: "Sulawesi Utara",
  city: "Manado",
  condition: "Baik",
  status: "Tersedia",
  description: "Barang harga tetap siap dibeli.",
  media: [
    {
      id: "fixed-media-1",
      type: "foto",
      url: "/uploads/barang/gelang.jpg",
      fileName: "gelang.jpg"
    }
  ],
  specs: [
    { label: "Jenis Perhiasan", value: "Gelang" },
    { label: "Material", value: "Emas Kuning 24K" },
    { label: "Berat", value: "12 gram" }
  ],
  updatedAt: "2026-05-22T03:30:00.000Z"
};

const winningBid: BuyerBid = {
  lotId: "pm-vickrey-1",
  lot: "Cincin Emas",
  unit: "UPC Ranotana",
  status: "MENANG",
  closing: "4 Mei 2026, 22.07",
  bidAmount: 150000000,
  basePrice: 90000000,
  note: "Anda memenangkan Lelang Tertutup. Harga akhir mengikuti mekanisme lelang: Rp 100.000.000.",
  linkedTransactionId: "trx-vickrey-1",
  finalPrice: 100000000,
  paymentAmount: 100000000,
  transactionStatus: "MENUNGGU_KONFIRMASI_LANGSUNG",
  paymentDeadline: "5 Mei 2026, 22.07",
  paymentDeadlineAt: "2099-05-05T14:07:00.000Z"
} as BuyerBid;

describe("buyer vickrey pages", () => {
  it("keeps the sale type pill on lot detail while removing condition, trust badges, and flow panels", () => {
    const { container } = render(<LotDetailPage bidState={null} buyerStatus={null} lot={fixedPriceLot} />);
    const purchasePanel = container.querySelector("aside");
    const heroGrid = screen.getByLabelText("Breadcrumb").nextElementSibling;

    expect(purchasePanel).not.toBeNull();
    expect(heroGrid).toHaveClass("xl:items-stretch");
    expect(screen.getByTestId("lot-media-gallery")).toHaveClass("h-full");
    expect(within(purchasePanel as HTMLElement).getByText("Harga Tetap")).toBeInTheDocument();
    expect(within(purchasePanel as HTMLElement).queryByText("Baik")).not.toBeInTheDocument();
    expect(screen.queryByText(/pembayaran aman/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/harga pasti/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/alur harga tetap/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/360\s*view/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buka preview penuh media barang/i })).toBeInTheDocument();
  });

  it("aligns a multi-media gallery with the detail card and clarifies unit information", () => {
    const multiMediaLot: Lot = {
      ...fixedPriceLot,
      description:
        "Barang harga tetap dengan deskripsi panjang yang tetap terbaca rapi pada card informasi katalog.",
      media: [
        ...fixedPriceLot.media,
        {
          id: "fixed-media-2",
          type: "foto",
          url: "/uploads/barang/gelang-detail.jpg",
          fileName: "gelang-detail.jpg"
        }
      ]
    };

    render(<LotDetailPage bidState={null} buyerStatus={null} lot={multiMediaLot} />);

    const heroGrid = screen.getByLabelText("Breadcrumb").nextElementSibling;
    expect(heroGrid).toHaveClass("xl:items-stretch");
    expect(screen.getByTestId("lot-media-gallery")).toHaveClass("h-full");
    expect(screen.getByTestId("lot-media-frame")).toHaveClass("xl:flex-1");

    expect(screen.getByTestId("lot-availability-tags")).toHaveTextContent("Sulawesi Utara");
    const unitName = screen.getByTestId("lot-unit-name");
    expect(unitName).toHaveTextContent("UPC Boulevard");
    expect(unitName).toHaveClass("font-black", "underline");
    expect(unitName).not.toHaveClass("rounded-full", "border", "bg-[#f4faf6]", "shadow-[0_12px_28px_-22px_rgba(8,69,50,0.48)]");
    expect(screen.getByTestId("lot-unit-address")).toHaveTextContent("Jl. Boulevard, Manado");
    expect(screen.getByTestId("lot-unit-location")).not.toHaveTextContent("/");
    expect(screen.getByTestId("lot-description")).toHaveClass("text-justify");
  });

  it("shows the updated transaction context and category-specific specs in separate white cards", () => {
    render(<LotDetailPage bidState={null} buyerStatus={null} lot={fixedPriceLot} />);

    expect(screen.getByText("Konteks Transaksi")).toBeInTheDocument();
    expect(screen.getByText("Metode Penjualan")).toBeInTheDocument();
    expect(screen.getByText("Barang ini dijual dengan harga tetap. Produk tidak melalui proses lelang.")).toBeInTheDocument();
    expect(screen.getByText("Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Pembayaran dilakukan setelah checkout dengan harga tetap. Konfirmasi otomatis setelah transaksi berhasil.")).toBeInTheDocument();
    expect(screen.getByText("Harga dapat berubah")).toBeInTheDocument();
    expect(screen.getByText("Sesuai pergerakan harga emas dan kurs harian.")).toBeInTheDocument();
    expect(screen.queryByText("Stok terbatas")).not.toBeInTheDocument();
    expect(screen.queryByText("Update terakhir")).not.toBeInTheDocument();
    expect(screen.queryByText("Unit penyelenggara")).not.toBeInTheDocument();
    expect(screen.queryByText("Skema pembelian")).not.toBeInTheDocument();
    expect(screen.queryByText("Kondisi barang")).not.toBeInTheDocument();
    expect(screen.getByText("Informasi Lengkap")).toBeInTheDocument();
    expect(screen.getByText("Spesifikasi Produk")).toBeInTheDocument();
    expect(screen.getByText("Jenis Perhiasan")).toBeInTheDocument();
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Emas Kuning 24K")).toBeInTheDocument();
    expect(screen.queryByText("Kategori")).not.toBeInTheDocument();
    expect(screen.queryByText("Lokasi")).not.toBeInTheDocument();
    expect(screen.queryByText("Mode")).not.toBeInTheDocument();
  });

  it("turns a submitted bid on lot detail into a monitoring state instead of another bid CTA", () => {
    render(<LotDetailPage bidState={winningBid} buyerStatus={null} lot={vickreyLot} />);

    expect(screen.getByRole("link", { name: /pantau transaksi/i })).toHaveAttribute(
      "href",
      "/transaksi?tab=bids&lot=pm-vickrey-1"
    );
    expect(screen.queryByRole("link", { name: /ikut lelang sekarang/i })).not.toBeInTheDocument();
  });

  it("hides the blacklist notice on a fixed-price lot when Level 1 still permits purchasing", () => {
    render(
      <LotDetailPage
        bidState={null}
        buyerStatus={{
          blacklist: {
            active: true,
            totalViolations: 1,
            until: new Date("2026-05-31T00:00:00.000Z")
          }
        }}
        lot={fixedPriceLot}
      />
    );

    expect(screen.queryByText(/akun sedang dibatasi sampai/i)).not.toBeInTheDocument();
  });

  it("shows a compact Level 2 restriction notice on a fixed-price lot", () => {
    render(
      <LotDetailPage
        bidState={null}
        buyerStatus={{
          blacklist: {
            active: true,
            totalViolations: 2,
            until: new Date("2026-05-31T00:00:00.000Z")
          }
        }}
        lot={fixedPriceLot}
      />
    );

    const noticeElement = screen.getByText(
      /akun anda dibatasi hingga 31 mei 2026\. pembelian harga tetap belum tersedia\./i
    );
    expect(noticeElement).toBeInTheDocument();
    expect(noticeElement).toHaveClass("xl:whitespace-nowrap");
    expect(screen.getByRole("button", { name: /pembelian sedang dibatasi/i })).toBeDisabled();
  });

  it("opens the sealed bid confirmation popup directly from lot detail with bid amount input", async () => {
    const user = userEvent.setup();

    render(<LotDetailPage bidState={null} buyerId="buyer-1" buyerStatus={null} lot={vickreyLot} />);

    expect(screen.queryByRole("link", { name: /ikut lelang/i })).not.toBeInTheDocument();

    const auctionButton = screen.getByRole("button", { name: /ikut lelang/i });
    await user.click(auctionButton);

    const dialog = screen.getByRole("dialog", { name: /syarat & ketentuan penawaran/i });
    expect(dialog).toBeInTheDocument();

    const bidInput = within(dialog).getByLabelText(/nominal penawaran/i);
    const restrictionHeading = within(dialog).getByText(/level pembatasan jika pembayaran gagal/i);
    const bidInputLabel = within(dialog).getByText("Nominal penawaran", { selector: "label" });
    const formattedBasePrice = currency.format(vickreyLot.price).replace(/\u00a0/g, " ");
    expect(restrictionHeading.compareDocumentPosition(bidInputLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bidInput).toHaveValue("90.000.000");
    expect(
      within(dialog).getByText((text) => text.replace(/\u00a0/g, " ") === `Harga dasar ${formattedBasePrice}`)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText((text) => text.replace(/\u00a0/g, " ") === formattedBasePrice)
    ).toBeInTheDocument();
  });

  it.each([
    ["level 1", 1, /akun anda dibatasi hingga 31 mei 2026\. pengiriman bid lelang tertutup ditangguhkan\./i],
    ["level 2", 2, /akun anda dibatasi hingga 31 mei 2026\. bid lelang tertutup belum tersedia\./i]
  ])("blocks the lot detail auction CTA for active blacklist %s", (_label, totalViolations, notice) => {
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

    const noticeElement = screen.getByText(notice);
    expect(noticeElement).toBeInTheDocument();
    expect(noticeElement).toHaveClass("xl:whitespace-nowrap");
    expect(screen.queryByRole("link", { name: /ikut lelang sekarang/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lelang sedang dibatasi/i })).toBeDisabled();
  });

  it("blocks the lot detail auction CTA while buyer has an active bid on another auction", () => {
    render(
      <LotDetailPage
        bidState={null}
        buyerId="buyer-1"
        buyerStatus={{
          blacklist: {
            active: false,
            totalViolations: 0,
            until: null
          },
          vickreyBidLock: {
            active: true,
            lotId: "pm-other",
            lotName: "Kalung Emas"
          }
        }}
        lot={vickreyLot}
      />
    );

    expect(screen.getByText(/anda masih memiliki bid aktif pada lelang lain/i)).toBeInTheDocument();
    expect(screen.getByText(/kalung emas/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bid lelang lain aktif/i })).toBeDisabled();
  });

  it("locks the bid form when buyer already submitted a sealed bid", () => {
    render(<BidPage bidState={winningBid} buyerStatus={null} lot={vickreyLot} />);

    expect(screen.getByText(/bid anda sudah terkunci/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bid sudah terkunci/i })).toBeDisabled();
    expect(screen.getByRole("link", { name: /lihat transaksi/i })).toHaveAttribute(
      "href",
      "/transaksi?tab=bids&lot=pm-vickrey-1"
    );
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
    const overlay = dialog.closest("[data-vickrey-terms-overlay='true']");
    expect(dialog).toBeInTheDocument();
    expect(overlay?.parentElement).toBe(document.body);
    expect(dialog).toHaveClass("max-w-lg", "rounded-[1.45rem]");
    expect(dialog).not.toHaveClass("max-h-[calc(100dvh-2rem)]");
    expect(dialog.querySelector(".overflow-y-auto")).toBeNull();
    expect(dialog.parentElement).toHaveClass("z-[160]", "items-start", "overflow-y-auto");
    expect(dialog.parentElement).not.toHaveClass("items-center");
    expect(screen.getByText(/ruang agunan/i).parentElement?.parentElement).toHaveClass("gap-3");
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
    expect(within(dialog).getByText(/tidak bisa ikut lelang tertutup\./i)).toBeInTheDocument();
    expect(within(dialog).getByText(/harga tetap tetap bisa dibeli/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/level 2/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/30 hari/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/tidak bisa membeli barang harga tetap/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/level 3\+/i)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/365 hari/i).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/tidak bisa login ke sistem/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/escrow terenkripsi/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/admin unit tidak dapat melihat nominal bid/i)).not.toBeInTheDocument();

    const modalAction = screen.getByRole("button", { name: /setujui dan kirim bid/i });
    expect(modalAction.closest("footer")).not.toHaveClass("shrink-0");
    expect(modalAction).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /saya telah membaca dan menyetujui/i }));
    expect(modalAction).toBeEnabled();
  });

  it("shows winner payment context in vickrey bid history", () => {
    render(<BidHistoryPage bids={[winningBid]} buyer={buyer} />);

    expect(screen.getAllByText(/harga akhir lelang/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("buyer-bid-history-status-MENANG-icon")).toHaveClass("lucide-trophy");
    expect(screen.getByText(/status transaksi/i)).toBeInTheDocument();
    expect(screen.getByText(/menunggu konfirmasi langsung/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lanjutkan pembayaran/i })).toHaveAttribute(
      "href",
      "/transaksi/trx-vickrey-1/pemenang"
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
      paymentNotes: ["Anda memenangkan Lelang Tertutup dan membayar langsung di unit."],
      winnerContext: "Harga akhir mengikuti mekanisme lelang dan dihitung otomatis oleh sistem."
    };

    render(<TransactionDetailPage buyer={buyer} transaction={transaction} transactionId={transaction.id} />);

    expect(screen.getByText(/harga akhir mengikuti mekanisme lelang/i)).toBeInTheDocument();
    expect(screen.getByText(/bukan nominal bid tertinggi anda/i)).toBeInTheDocument();
    expect(screen.getByText(/batas pembayaran 24 jam/i)).toBeInTheDocument();
    expect(screen.getByText(/bayar langsung di unit/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /status konfirmasi/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim bukti pembayaran/i })).not.toBeInTheDocument();
  });

  it("renders a dedicated winner announcement page before direct payment detail", () => {
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
      paymentNotes: ["Anda memenangkan Lelang Tertutup dan membayar langsung di unit."],
      winnerContext: "Harga akhir mengikuti mekanisme lelang dan dihitung otomatis oleh sistem."
    };

    render(<AuctionWinnerPage transaction={transaction} transactionId={transaction.id} />);

    expect(screen.getByText(/anda memenangkan lelang/i)).toBeInTheDocument();
    expect(screen.getByText(/batas waktu pembayaran/i)).toBeInTheDocument();
    expect(screen.getByText(/langkah selanjutnya: lihat detail transaksi/i)).toBeInTheDocument();
    expect(screen.queryByText(/workflow pembayaran/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bayar lelang tertutup di unit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verifikasi admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/selesai & nota/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ringkasan lelang anda/i)).toBeInTheDocument();
    expect(screen.getByText("Jam")).toBeInTheDocument();
    expect(screen.getByText("Menit")).toBeInTheDocument();
    expect(screen.getByText("Detik")).toBeInTheDocument();
    expect(screen.queryByText("Hari")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /lanjutkan ke pembayaran/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat detail transaksi/i })).toHaveAttribute(
      "href",
      "/transaksi/trx-vickrey-1"
    );
  });

  it("explains failed winner payment when the 24 hour deadline is missed", () => {
    const transaction: BuyerTransaction = {
      id: "trx-vickrey-failed",
      lotId: "pm-vickrey-1",
      kind: "VICKREY_WIN",
      title: "Cincin Emas",
      amount: 100000000,
      status: "GAGAL",
      method: "BAYAR_LANGSUNG",
      unit: "UPC Ranotana",
      unitAddress: "Jl. Sam Ratulangi, Manado",
      createdAt: "4 Mei 2026, 22.07",
      deadline: "5 Mei 2026, 22.07",
      deadlineAt: "2026-05-05T14:07:00.000Z",
      reference: "-",
      applicationNumber: "PGJ-VIC-FAILED",
      paymentLabel: "Bayar langsung di unit",
      paymentNotes: ["Pemenang tidak menyelesaikan pembayaran dalam 24 jam."],
      winnerContext: "Harga akhir mengikuti mekanisme lelang dan dihitung otomatis oleh sistem."
    };

    render(<AuctionWinnerPage transaction={transaction} transactionId={transaction.id} />);

    expect(screen.queryByText(/workflow pembayaran gagal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/melewati 24 jam/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/batas waktu berakhir/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /lihat detail transaksi/i })).toHaveAttribute(
      "href",
      "/transaksi/trx-vickrey-failed"
    );
  });

  it("keeps winner hero particle styles deterministic for hydration", () => {
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
      paymentNotes: ["Anda memenangkan Lelang Tertutup dan membayar langsung di unit."],
      winnerContext: "Harga akhir mengikuti mekanisme lelang dan dihitung otomatis oleh sistem."
    };

    const { container } = render(
      <AuctionWinnerPage transaction={transaction} transactionId={transaction.id} />
    );

    const confettiPiece = container.querySelector(".winner-stage-confetti-piece");
    const spark = container.querySelector(".winner-hero-spark");

    expect(confettiPiece).not.toBeNull();
    expect(spark).not.toBeNull();
    expect(confettiPiece?.getAttribute("style")).not.toMatch(/\d+\.\d{5,}(px|%|vw|vh)/);
    expect(spark?.getAttribute("style")).not.toMatch(/\d+\.\d{5,}(px|%|vw|vh)/);
  });

  it("renders a dedicated non-winner auction result page with supportive next actions", () => {
    const losingBid: BuyerBid = {
      lotId: "pm-vickrey-1",
      lot: "Cincin Emas",
      unit: "UPC Ranotana",
      status: "TIDAK_MENANG",
      closing: "4 Mei 2026, 22.07",
      closingAt: "2026-05-04T14:07:00.000Z",
      bidAmount: 95000000,
      basePrice: 90000000,
      note: "Bid tidak menjadi pemenang sesi ini.",
      bidHash: "abc123"
    };
    const recommendations: Lot[] = [
      {
        ...fixedPriceLot,
        id: "pm-vickrey-expired",
        code: "BRG-VIC-OLD",
        mode: "vickrey",
        name: "Cincin Sudah Selesai",
        price: 72000000,
        countdown: "Menunggu hasil",
        endsAt: "2026-05-05T14:07:00.000Z"
      },
      {
        ...fixedPriceLot,
        id: "pm-fixed-recommendation",
        name: "Gelang Harga Tetap",
        endsAt: undefined
      },
      {
        ...fixedPriceLot,
        id: "pm-vickrey-2",
        code: "BRG-VIC-002",
        mode: "vickrey",
        name: "Jam Tangan Rolex Oyster 41",
        price: 95000000,
        countdown: "2 jam 51 menit",
        endsAt: "2099-05-05T14:07:00.000Z"
      },
      {
        ...fixedPriceLot,
        id: "pm-vickrey-3",
        code: "BRG-VIC-003",
        mode: "vickrey",
        name: "Kalung Emas 24K 10 Gram",
        price: 18000000,
        countdown: "1 jam 45 menit",
        endsAt: "2099-05-05T14:07:00.000Z"
      }
    ];

    const { container } = render(<AuctionLoserPage bid={losingBid} recommendations={recommendations} />);

    expect(screen.getByText(/anda belum menang lelang ini/i)).toBeInTheDocument();
    expect(screen.getAllByText(/tidak menang/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/informasi pemenang/i)).toBeInTheDocument();
    expect(screen.getByText(/pemenang lelang ini telah ditentukan/i)).toBeInTheDocument();
    expect(screen.getByText(/lelang lainnya untuk anda/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat semua lelang/i })).toHaveAttribute("href", "/katalog");
    expect(screen.getByText("Jam Tangan Rolex Oyster 41")).toBeInTheDocument();
    expect(screen.getAllByText(/sedang berlangsung/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("Cincin Sudah Selesai")).not.toBeInTheDocument();
    expect(screen.queryByText("Gelang Harga Tetap")).not.toBeInTheDocument();
    expect(screen.queryByText(/menunggu hasil/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/penawaran tertinggi anda/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/selisih/i)).not.toBeInTheDocument();
    expect(container.querySelector(".loser-stage-piece")).not.toBeNull();
    expect(container.querySelector(".loser-hero-spark")).not.toBeNull();
  });

  it("shows clear empty content when no ongoing auctions are available for non-winners", () => {
    const losingBid: BuyerBid = {
      lotId: "pm-vickrey-1",
      lot: "Cincin Emas",
      unit: "UPC Ranotana",
      status: "TIDAK_MENANG",
      closing: "4 Mei 2026, 22.07",
      closingAt: "2026-05-04T14:07:00.000Z",
      bidAmount: 95000000,
      basePrice: 90000000,
      note: "Bid tidak menjadi pemenang sesi ini.",
      bidHash: "abc123"
    };

    render(<AuctionLoserPage bid={losingBid} recommendations={[]} />);

    expect(screen.getByText(/lelang lainnya untuk anda/i)).toBeInTheDocument();
    expect(screen.getByText(/belum ada lelang yang sedang berlangsung saat ini/i)).toBeInTheDocument();
    expect(screen.getByText(/admin unit membuka sesi lelang baru/i)).toBeInTheDocument();
  });

  it("formats loser recommendation countdown labels inside the client wrapper", () => {
    render(
      <AuctionLoserRecommendationCountdown
        serverNow="2026-05-28T00:00:00.000Z"
        targetAt="2026-05-28T02:51:00.000Z"
      />
    );

    expect(screen.getByText(/\d+\s+j\s+\d+\s+m\s+\d+\s+d/i)).toBeInTheDocument();
  });

  it("keeps the fixed-price payment workflow unavailable for vickrey lots", () => {
    expect(() => render(<PurchasePage lot={vickreyLot} />)).toThrow("NEXT_NOT_FOUND");
  });
});
