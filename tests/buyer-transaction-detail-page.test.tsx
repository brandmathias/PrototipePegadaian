import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

import { TransactionDetailPage } from "@/components/pages/user-pages";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import type { BuyerTransaction } from "@/lib/contracts/buyer";

const buyer: BuyerSessionUser = {
  id: "buyer-1",
  name: "Budi Santoso",
  email: "budi@example.com",
  phoneNumber: "+62 812 3456 7890",
  role: "buyer",
  isActive: true
};

beforeEach(() => {
  router.refresh.mockClear();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const transaction: BuyerTransaction = {
  id: "trx-fixed-1",
  lotId: "barang-1",
  kind: "FIXED_PRICE",
  title: "Kalung Emas 18K",
  amount: 12450000,
  status: "MENUNGGU_PEMBAYARAN",
  method: "TRANSFER_BANK",
  unit: "UPC Ranotana",
  unitAddress: "Jl. Sam Ratulangi, Manado",
  createdAt: "4 Mei 2026 10.30 WIB",
  deadline: "5 Mei 2026 10.30 WIB",
  deadlineAt: "2026-05-05T02:30:00.000Z",
  reference: "-",
  applicationNumber: "ORD-2026-0001",
  paymentLabel: "Transfer Bank",
  paymentNotes: ["Transfer sesuai nominal transaksi.", "Unggah bukti pembayaran setelah transfer."],
  imageUrl: "/uploads/barang/kalung-emas.jpg",
  bankName: "Bank Rakyat Indonesia (BRI)",
  bankAccountNumber: "0123-4567-8901-234",
  bankAccountHolder: "PT Pegadaian (Persero)",
  bankBranch: "Manado",
  bankAccounts: [
    {
      id: "rek-bni",
      bankName: "BNI",
      accountNumber: "0115489623",
      accountHolder: "Hendra Wijaya",
      isActive: true
    },
    {
      id: "rek-bca",
      bankName: "BCA",
      accountNumber: "1234567890",
      accountHolder: "Hendra Wijaya",
      isActive: false
    },
    {
      id: "rek-bri",
      bankName: "BRI",
      accountNumber: "98765432109876",
      accountHolder: "Hendra Wijaya",
      isActive: false
    }
  ]
};

const transactionWithSpecifications = {
  ...transaction,
  category: "Perhiasan",
  condition: "Baik",
  specs: [
    { label: "Jenis Emas", value: "Kalung" },
    { label: "Kadar Emas", value: "22K / 91,6%" },
    { label: "Berat", value: "8,52 gram" },
    { label: "Bentuk", value: "Perhiasan kalung" },
    { label: "Sertifikat", value: "Appraisal unit Pegadaian" }
  ]
} as BuyerTransaction & {
  category: string;
  condition: string;
  specs: Array<{ label: string; value: string }>;
};

describe("buyer transaction detail page", () => {
  it("renders the pending Vickrey winner payment layout with truthful audit data and handover documentation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T13:54:00+08:00"));
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transactionWithSpecifications,
          id: "ea96f2f7-b131-413a-ac4a-6fa3c67d65ac",
          lotId: "pm-vickrey-pending",
          kind: "VICKREY_WIN",
          title: "Kalung Emas Rantai Cuban 22K 6,7 Gram",
          amount: 31000000,
          status: "MENUNGGU_KONFIRMASI_LANGSUNG",
          method: "BAYAR_LANGSUNG",
          unit: "UPC Wanea",
          unitAddress: "Jl. Sam Ratulangi No.54, Tanjung Batu, Wanea",
          createdAt: "17 Agu 2026, 13.54 WIB",
          deadline: "18 Agu 2026, 13.54 WIB",
          deadlineAt: "2026-08-18T05:53:12.000Z",
          applicationNumber: "PGJ-VIC-EA96F2F7",
          imageUrl: "/uploads/barang/kalung-cuban.jpg"
        }}
        transactionId="ea96f2f7-b131-413a-ac4a-6fa3c67d65ac"
      />
    );

    expect(screen.getByRole("heading", { name: /detail pembayaran/i })).toBeInTheDocument();
    expect(screen.getByText(/^segera bayar$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /segera lakukan pembayaran dalam batas waktu 24 jam/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/^rp 31\.000\.000$/i)).toBeInTheDocument();
    const urgentPaymentCard = screen.getByRole("region", { name: /status segera bayar/i });
    expect(urgentPaymentCard).toHaveClass("lg:grid-cols-[200px_minmax(0,1fr)]");
    expect(urgentPaymentCard).not.toHaveTextContent(/harga akhir mengikuti mekanisme lelang/i);
    expect(urgentPaymentCard).not.toHaveTextContent(/batas pembayaran 24 jam/i);
    expect(screen.getAllByText(/^upc wanea$/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/sisa waktu pembayaran/i)).toHaveTextContent("23:59:12");
    expect(screen.getByRole("heading", { name: /informasi barang & pemenang/i })).toBeInTheDocument();
    expect(screen.queryByText(/id pengajuan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^pgj-vic-ea96f2f7$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^budi santoso$/i)).toBeInTheDocument();
    expect(screen.getByText(/^budi@example\.com$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/bayar langsung di unit terkait/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /log audit sistem/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /informasi barang & pemenang/i }).closest("section")).toHaveClass("h-full");
    expect(screen.getByRole("heading", { name: /log audit sistem/i }).closest("section")).toHaveClass("h-full");
    expect(screen.getByText(/^system \(auto\)$/i)).toBeInTheDocument();
    expect(screen.getByText(/^ea96f2f7-b131-413a-ac4a-6fa3c67d65ac$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^menunggu pembayaran$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bawa nomor|loket unit/i)).not.toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /cetak ringkasan/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cetak nota/i })).toBeDisabled();

    expect(
      screen.getByRole("heading", { name: /dokumentasi serah terima barang fisik/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/belum ada bukti serah-terima/i)).toBeInTheDocument();
    expect(screen.getByText(/^lokasi unit terkait$/i)).toBeInTheDocument();
    expect(screen.getByText(/^belum diunggah$/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /rincian transaksi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /status konfirmasi/i })).not.toBeInTheDocument();
  });

  it("renders the harga tetap payment flow as transaction details, destination account, and proof upload", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={transactionWithSpecifications}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("heading", { name: /detail pembayaran/i })).toBeInTheDocument();
    expect(screen.getByText(/melakukan pembayaran/i)).toBeInTheDocument();
    expect(screen.getByText(/^verifikasi$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/selesai/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/bukti diunggah/i)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /foto barang kalung emas 18k/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rincian transaksi/i })).toBeInTheDocument();
    expect(screen.getByText(/^spesifikasi barang$/i)).toBeInTheDocument();
    expect(screen.getByText(/^perhiasan$/i)).toBeInTheDocument();
    expect(screen.getByText(/22k \/ 91,6%/i)).toBeInTheDocument();
    expect(screen.getByText(/8,52 gram/i)).toBeInTheDocument();
    expect(screen.getByText(/appraisal unit pegadaian/i)).toBeInTheDocument();
    expect(screen.getByText(/nota diterbitkan setelah pembayaran diverifikasi admin unit/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rekening tujuan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /unggah bukti/i })).toBeInTheDocument();
    const transferDetailCard = screen.getByRole("heading", { name: /rincian transaksi/i }).parentElement?.parentElement;
    expect(transferDetailCard?.parentElement).toHaveClass(
      "lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.28fr)_minmax(0,0.92fr)]"
    );
    const accountList = screen.getByLabelText(/daftar rekening tujuan/i);
    expect(accountList).toHaveClass(
      "grid",
      "min-h-[27.75rem]",
      "flex-1",
      "overflow-y-auto",
      "[grid-auto-rows:calc((100%_-_1.5rem)/3)]"
    );
    const firstAccount = screen.getByLabelText(/rekening tujuan bni/i);
    expect(firstAccount).toHaveClass(
      "relative",
      "overflow-hidden",
      "border-[#d8b24c]",
      "shadow-[0_16px_30px_-22px_rgba(73,54,8,0.38)]"
    );
    expect(firstAccount).not.toHaveClass("hover:-translate-y-0.5", "transition-[border-color,background-color,box-shadow,transform]");
    expect(firstAccount.querySelector("[data-account-accent]")).toHaveClass(
      "bg-[linear-gradient(90deg,#087642_0%,#087642_64%,#e2ad19_73%,transparent_73%)]"
    );
    expect(screen.getByLabelText(/rekening tujuan bca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rekening tujuan bri/i)).toBeInTheDocument();
    expect(decodeURIComponent(screen.getByRole("img", { name: /logo bni/i }).getAttribute("src") ?? "")).toContain(
      "/uploads/bank-logos/bni.png"
    );
    expect(decodeURIComponent(screen.getByRole("img", { name: /logo bca/i }).getAttribute("src") ?? "")).toContain(
      "/uploads/bank-logos/bca.png"
    );
    expect(decodeURIComponent(screen.getByRole("img", { name: /logo bri/i }).getAttribute("src") ?? "")).toContain(
      "/uploads/bank-logos/bri.png"
    );
    expect(screen.getByText(/0115489623/i)).toBeInTheDocument();
    expect(screen.getByText(/0115489623/i)).toHaveClass("text-[1.24rem]");
    expect(screen.getByText(/0115489623/i)).toHaveClass("whitespace-nowrap");
    expect(screen.getByText(/0115489623/i)).not.toHaveClass("whitespace-normal", "break-words");
    expect(screen.getByText(/0115489623/i)).not.toHaveClass("truncate");
    expect(screen.getByText(/1234567890/i)).toBeInTheDocument();
    expect(screen.getByText(/98765432109876/i)).toBeInTheDocument();
    const accountCopyButtons = screen.getAllByRole("button", { name: /salin nomor rekening/i });
    expect(accountCopyButtons).toHaveLength(3);
    expect(accountCopyButtons[0]).toHaveClass("size-10", "border-[#e4c66f]");
    expect(screen.getByRole("button", { name: /kembali ke detail barang/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kirim bukti pembayaran/i })).toBeDisabled();
  });

  it("renders a fixed-price payment deadline failure without stale transfer actions", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          id: "trx-fixed-failed",
          status: "GAGAL",
          createdAt: "3 Sep 2026 19.54 WIB",
          deadline: "4 Sep 2026 19.54 WIB",
          deadlineAt: "2026-09-04T11:54:00.000Z",
          paymentNotes: []
        }}
        transactionId="trx-fixed-failed"
      />
    );

    expect(screen.getByRole("heading", { name: /detail pembayaran/i })).toBeInTheDocument();
    expect(
      screen.getAllByText(/Batas waktu pembayaran telah berakhir\. Transaksi ditutup\./i).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /pembayaran harga tetap gagal/i, level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText(/transaksi ditutup/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/daftar rekening tujuan/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim bukti pembayaran/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/unggah bukti transfer maksimal 24 jam/i)).not.toBeInTheDocument();
  });

  it("renders the harga tetap Midtrans flow with a resumable checkout and automatic status", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transactionWithSpecifications,
          id: "trx-fixed-midtrans",
          method: "MIDTRANS",
          paymentLabel: "Pembayaran Midtrans",
          paymentNotes: ["Selesaikan pembayaran melalui checkout Midtrans."],
          deadline: "Menunggu pembayaran Midtrans",
          deadlineAt: "2099-05-05T02:30:00.000Z"
        }}
        transactionId="trx-fixed-midtrans"
      />
    );

    const workflow = screen.getByText("Alur Pembayaran").closest("section");
    expect(workflow).not.toBeNull();
    expect(within(workflow!).getByRole("heading", { name: /bayar melalui transfer/i })).toBeInTheDocument();
    expect(within(workflow!).getByText(/status diperbarui setelah dana diterima/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pembayaran transfer/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^transfer$/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: /status pembayaran/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /perlindungan transaksi/i })).toBeInTheDocument();
    expect(screen.getByText(/kami menjaga transaksi anda tetap aman/i)).toBeInTheDocument();
    expect(screen.getByText(/kanal pembayaran resmi/i)).toBeInTheDocument();
    expect(screen.getByText(/verifikasi otomatis/i)).toBeInTheDocument();
    expect(screen.getByText(/hindari transfer di luar platform/i)).toBeInTheDocument();
    const protectionCard = screen.getByTestId("transaction-protection-card");
    expect(protectionCard).toHaveClass("h-fit", "min-h-0", "self-start");
    expect(protectionCard).not.toHaveClass("min-h-[31rem]");
    expect(screen.getByTestId("transaction-protection-list")).not.toHaveClass("flex-1");
    expect(screen.getAllByTestId("transaction-protection-item")).toHaveLength(3);
    expect(screen.getAllByTestId("transaction-protection-item").every((item) => !item.classList.contains("flex-1"))).toBe(true);
    expect(screen.getByText(/menyiapkan pembayaran/i)).toBeInTheDocument();
    expect(screen.queryByText(/status pembayaran dikonfirmasi otomatis oleh midtrans/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checkout midtrans/i)).not.toBeInTheDocument();
    const detailCard = screen.getByRole("heading", { name: /rincian transaksi/i }).parentElement?.parentElement;
    const paymentCard = screen.getByRole("heading", { name: /pembayaran transfer/i }).parentElement?.parentElement;
    expect(detailCard?.parentElement).toHaveClass(
      "lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.28fr)_minmax(0,0.92fr)]"
    );
    expect(detailCard).toHaveClass("h-full");
    expect(paymentCard).toHaveClass("h-full");
    expect(detailCard).toHaveClass("min-h-[31rem]");
    expect(paymentCard).toHaveClass("min-h-[31rem]");
    expect(screen.getAllByText(/^rp 12\.450\.000$/i)).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /buka checkout midtrans/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /unggah bukti/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti pembayaran/i)).not.toBeInTheDocument();
    expect(screen.getByText(/tidak perlu mengunggah bukti pembayaran manual/i)).toBeInTheDocument();
  });

  it("shows a verified Midtrans payment without manual proof upload", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transactionWithSpecifications,
          id: "trx-fixed-midtrans-paid",
          status: "LUNAS",
          method: "MIDTRANS",
          paymentLabel: "Pembayaran Midtrans",
          verifiedAt: "5 Mei 2026, 11.15 WIB"
        }}
        transactionId="trx-fixed-midtrans-paid"
      />
    );

    expect(screen.getByText(/^pembayaran terverifikasi$/i)).toBeInTheDocument();
    expect(screen.getByText(/pembayaran telah dikonfirmasi sistem sebelum transaksi dinyatakan lunas/i)).toBeInTheDocument();
    expect(screen.getByText(/tidak perlu mengunggah bukti transfer manual/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /status pembayaran/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lanjutkan ke checkout midtrans/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti pembayaran/i)).not.toBeInTheDocument();
  });

  it("renders failed auction winner payment as a dedicated 24 hour failure detail", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        buyerStatus={{
          blacklist: {
            active: true,
            until: new Date("2026-06-04T00:00:00.000Z"),
            totalViolations: 2
          }
        }}
        transaction={{
          ...transaction,
          id: "trx-vickrey-failed",
          lotId: "pm-vickrey-failed",
          kind: "VICKREY_WIN",
          title: "Kalung Emas 2",
          amount: 16000000,
          status: "GAGAL",
          method: "BAYAR_LANGSUNG",
          unit: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi, Manado",
          createdAt: "28 Mei 2026, 19.20 WIB",
          deadline: "29 Mei 2026, 19.20 WIB",
          deadlineAt: "2026-05-29T11:20:00.000Z",
          reference: "CASH-FAILED",
          applicationNumber: "PGJ-VIC-FAILED",
          paymentLabel: "Bayar langsung di unit",
          paymentNotes: [],
          imageUrl: "/uploads/barang/kalung-lelang.jpg",
          violationLevel: 1
        }}
        transactionId="trx-vickrey-failed"
      />
    );

    expect(screen.getByRole("heading", { name: /detail transaksi lelang gagal/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cetak nota|cetak ringkasan/i })).not.toBeInTheDocument();
    expect(screen.getByText(/^alur pembayaran$/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /alur pembayaran gagal/i })).toBeInTheDocument();
    expect(screen.getAllByText(/pembayaran gagal/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/melewati 24 jam/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/pemenang lelang tidak menyelesaikan pembayaran dalam waktu 24 jam/i).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /batas waktu pelunasan habis/i })).toBeInTheDocument();
    expect(screen.getByText(/transaksi ini dinyatakan gagal secara otomatis oleh sistem/i)).toBeInTheDocument();
    expect(screen.getByText(/nominal lelang/i)).toBeInTheDocument();
    expect(screen.getByText(/rp 16\.000\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/unit pelaksana/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal sesi/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /informasi barang & pemenang/i })).toBeInTheDocument();
    expect(screen.queryByText(/id pengajuan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^pgj-vic-failed$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nama pembeli/i)).toBeInTheDocument();
    expect(screen.getAllByText(/budi santoso/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/budi@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/bayar langsung di unit/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /log audit sistem/i })).toBeInTheDocument();
    expect(screen.getByText(/dibuat pada/i)).toBeInTheDocument();
    expect(screen.getByText(/system \(auto\)/i)).toBeInTheDocument();
    expect(screen.getByText(/trx-fail-pgj-vic-failed/i)).toBeInTheDocument();
    expect(screen.getByText(/^status pelanggaran$/i)).toBeInTheDocument();
    expect(screen.getByText(/level 1 — pelanggaran pembayaran/i)).toBeInTheDocument();
    expect(
      screen.getByText(/selama 7 hari, anda tidak dapat mengikuti lelang tertutup/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/anda tetap dapat membeli barang harga tetap seperti biasa/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/status restriksi aktif|bidding suspension/i)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /foto barang kalung emas 2/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kembali ke transaksi/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /detail pembayaran/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /status konfirmasi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /unggah bukti/i })).not.toBeInTheDocument();
  });

  it("explains a level 2 violation in the failed-payment audit log", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        buyerStatus={{
          blacklist: {
            active: true,
            until: new Date("2026-06-27T00:00:00.000Z"),
            totalViolations: 1
          }
        }}
        transaction={{
          ...transaction,
          id: "trx-vickrey-failed-level-2",
          lotId: "pm-vickrey-failed-level-2",
          kind: "VICKREY_WIN",
          status: "GAGAL",
          applicationNumber: "PGJ-VIC-FAILED-L2",
          violationLevel: 2
        }}
        transactionId="trx-vickrey-failed-level-2"
      />
    );

    expect(screen.getByText(/^status pelanggaran$/i)).toBeInTheDocument();
    expect(screen.getByText(/level 2 — pelanggaran pembayaran/i)).toBeInTheDocument();
    expect(
      screen.getByText(/akun dibatasi 30 hari untuk mengikuti lelang tertutup dan membeli barang harga tetap/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/status restriksi aktif|bidding suspension/i)).not.toBeInTheDocument();
  });

  it("asks buyer to finish the purchase after handover proof is available and keeps the receipt locked before completion", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "LUNAS",
          paymentProof: "/uploads/bukti/transfer-lunas.jpg",
          handoverProof: {
            fileUrl: "/uploads/serah-terima/trx-fixed-1.jpg",
            uploadedAt: "4 Mei 2026 22.30 WIB",
            uploadedBy: "Hendra Wijaya",
            location: "UPC Ranotana"
          },
          verifiedAt: "4 Mei 2026 22.11 WIB",
          completedAt: "4 Mei 2026 22.40 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/menunggu konfirmasi selesai dari buyer/i)).toBeInTheDocument();
    const workflow = screen.getByText("Alur Pembayaran").closest("section");
    expect(workflow).not.toBeNull();
    expect(within(workflow!).queryByText(/alur selesai/i)).not.toBeInTheDocument();
    expect(within(workflow!).getByText(/posisi sekarang\s*\|\s*tahap 2 dari 3/i)).toBeInTheDocument();
    expect(within(workflow!).getByRole("heading", { name: /menunggu konfirmasi buyer/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /dokumentasi serah terima barang fisik/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /bukti serah-terima barang kalung emas 18k/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-lunas.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tekan untuk membuka tampilan penuh/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^pilih file$/i)).not.toBeInTheDocument();
    const handoverPanel = screen.getByLabelText(/panel bukti serah-terima barang/i);
    const completeButton = screen.getByRole("button", { name: /pembelian selesai/i });
    const receiptButton = screen.getByRole("button", { name: /cetak nota/i });
    expect(completeButton).toBeInTheDocument();
    expect(receiptButton).toBeInTheDocument();
    expect(within(handoverPanel).queryByRole("button", { name: /pembelian selesai/i })).not.toBeInTheDocument();
    expect(within(handoverPanel).queryByRole("button", { name: /cetak nota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /buka nota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /nota transaksi/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /cetak nota/i })).toHaveLength(1);
    expect(completeButton).toBeEnabled();
    expect(receiptButton).toBeDisabled();

    fireEvent.click(receiptButton);
    expect(printSpy).not.toHaveBeenCalled();

    printSpy.mockRestore();
  });

  it("waits for the admin unit to upload handover proof before asking the buyer to finish", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "LUNAS",
          paymentProof: "/uploads/bukti/transfer-lunas.jpg",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    const workflow = screen.getByText("Alur Pembayaran").closest("section");

    expect(workflow).not.toBeNull();
    expect(within(workflow!).getByText(/posisi sekarang\s*\|\s*tahap 2 dari 3/i)).toBeInTheDocument();
    expect(
      within(workflow!).getByRole("heading", { name: /menunggu bukti serah-terima dari admin unit/i })
    ).toBeInTheDocument();
    expect(within(workflow!).queryByText(/menunggu konfirmasi buyer/i)).not.toBeInTheDocument();
  });

  it("prints the receipt inline after buyer completes the fixed-price purchase", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "SELESAI",
          paymentProof: "/uploads/bukti/transfer-selesai.jpg",
          handoverProof: {
            fileUrl: "/uploads/serah-terima/trx-fixed-1.jpg",
            uploadedAt: "4 Mei 2026 22.30 WIB",
            uploadedBy: "Hendra Wijaya",
            location: "UPC Ranotana"
          },
          verifiedAt: "4 Mei 2026 22.11 WIB",
          completedAt: "4 Mei 2026 22.40 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    const completeButton = screen.getByRole("button", { name: /pembelian selesai/i });
    const receiptButton = screen.getByRole("button", { name: /cetak nota/i });
    expect(completeButton).toBeDisabled();
    expect(completeButton).toHaveClass(
      "disabled:bg-[#dce8e1]",
      "disabled:text-[#71867b]",
      "disabled:shadow-none"
    );
    expect(completeButton).not.toHaveClass("disabled:bg-[#006747]");
    expect(receiptButton).toBeEnabled();

    fireEvent.click(receiptButton);
    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1), { timeout: 3000 });

    const receiptPrintRoot = document.getElementById("buyer-receipt-print-root-trx-fixed-1-status");

    expect(receiptPrintRoot).not.toBeNull();
    expect(receiptPrintRoot!).toHaveClass("transaction-receipt-print-document", "hidden", "print:block");
    expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    expect(receiptPrintRoot!).toHaveTextContent("Harga Tetap");
    expect(receiptPrintRoot!.querySelector('img[src*="/uploads/barang/kalung-emas.jpg"]')).not.toBeNull();

    printSpy.mockRestore();
  });

  it("keeps the finish button enabled for legacy selesai transactions missing completion metadata", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "SELESAI",
          paymentProof: "/uploads/bukti/transfer-selesai.jpg",
          handoverProof: {
            fileUrl: "/uploads/serah-terima/trx-fixed-legacy.jpg",
            uploadedAt: "4 Mei 2026 22.30 WIB",
            uploadedBy: "Hendra Wijaya",
            location: "UPC Ranotana"
          },
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByText(/selesaikan pengambilan dan nota/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /cetak nota/i })).toBeDisabled();
  });

  it("keeps the finish action visible but disabled until admin uploads handover proof", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "LUNAS",
          paymentProof: "/uploads/bukti/transfer-lunas.jpg",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("heading", { name: /dokumentasi serah terima barang fisik/i })).toBeInTheDocument();
    expect(screen.getAllByText(/menunggu admin unit mengunggah bukti serah-terima barang/i).length).toBeGreaterThan(0);
    const handoverPanel = screen.getByLabelText(/panel bukti serah-terima barang/i);
    const completeButton = screen.getByRole("button", { name: /pembelian selesai/i });
    expect(completeButton).toBeDisabled();
    expect(completeButton).toHaveClass("h-12", "min-h-12", "text-sm");
    expect(completeButton).toHaveClass("disabled:bg-[#dce8e1]", "disabled:text-[#71867b]", "disabled:shadow-none");
    expect(within(handoverPanel).queryByRole("button", { name: /pembelian selesai/i })).not.toBeInTheDocument();
    const receiptButton = screen.getByRole("button", { name: /cetak nota/i });
    expect(receiptButton).toBeDisabled();
    expect(receiptButton).toHaveClass("h-12", "min-h-12", "text-sm");
    expect(receiptButton).not.toHaveClass("blur-[0.65px]");
    expect(within(handoverPanel).queryByRole("button", { name: /cetak nota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /nota transaksi/i })).not.toBeInTheDocument();
  });

  it("shows the completed action as disabled when handover proof is still missing", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "SELESAI",
          paymentProof: "/uploads/bukti/transfer-selesai.jpg",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          completedAt: "4 Mei 2026 22.40 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    const completeButton = screen.getByRole("button", { name: /pembelian selesai/i });
    expect(completeButton).toBeDisabled();
    expect(completeButton).toHaveClass("disabled:bg-[#dce8e1]", "disabled:text-[#71867b]", "disabled:shadow-none");
  });

  it("prints the prepared receipt in place on mobile without opening the receipt route", async () => {
    const originalUserAgent = window.navigator.userAgent;
    const openSpy = vi.spyOn(window, "open").mockReturnValue({ focus: vi.fn() } as unknown as Window);
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
    });

    try {
      render(
        <TransactionDetailPage
          buyer={buyer}
          transaction={{
            ...transaction,
            status: "SELESAI",
            paymentProof: "/uploads/bukti/transfer-lunas.jpg",
            handoverProof: {
              fileUrl: "/uploads/serah-terima/trx-fixed-1-mobile.jpg",
              uploadedAt: "4 Mei 2026 22.30 WIB",
              uploadedBy: "Hendra Wijaya",
              location: "UPC Ranotana"
            },
            verifiedAt: "4 Mei 2026 22.11 WIB",
            completedAt: "4 Mei 2026 22.40 WIB",
            receiptNumber: "INV/TRXFIXED"
          }}
          transactionId={transaction.id}
        />
      );

      const receiptPrintRoot = document.getElementById("buyer-receipt-print-root-trx-fixed-1-status");
      expect(receiptPrintRoot).not.toBeNull();
      expect(receiptPrintRoot!.querySelector("style")?.textContent).toContain(
        "body.transaction-receipt-printing > :not(#buyer-receipt-print-root-trx-fixed-1-status)"
      );

      fireEvent.click(screen.getAllByRole("button", { name: /cetak nota/i })[0]);

      const printFrame = await waitFor(() => {
        const frame = document.querySelector(
          'iframe[data-receipt-print-frame="true"][data-receipt-root-id="buyer-receipt-print-root-trx-fixed-1-status"]'
        ) as HTMLIFrameElement | null;
        expect(frame).not.toBeNull();
        return frame!;
      }, { timeout: 3000 });

      expect(openSpy).not.toHaveBeenCalled();
      expect(printSpy).not.toHaveBeenCalled();
      const isolatedReceipt = printFrame.contentDocument?.getElementById("buyer-receipt-print-root-trx-fixed-1-status");
      expect(isolatedReceipt).not.toBeNull();
      expect(isolatedReceipt?.textContent).toContain("Nota Pengambilan Barang");
      expect(isolatedReceipt?.textContent).not.toContain("Detail Pembayaran");
      expect(isolatedReceipt!.querySelector(".receipt-output-header-grid")).not.toBeNull();
      expect(isolatedReceipt!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    } finally {
      document.body.classList.remove("transaction-receipt-printing");
      Object.defineProperty(window.navigator, "userAgent", {
        configurable: true,
        value: originalUserAgent
      });
      openSpy.mockRestore();
      printSpy.mockRestore();
    }
  });

  it("prints the paid auction winner receipt with the same official lelang layout as admin unit", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          id: "trx-vickrey-paid",
          lotId: "pm-vickrey-1",
          kind: "VICKREY_WIN",
          title: "Cincin Emas Berlian",
          amount: 10000000,
          status: "LUNAS",
          method: "BAYAR_LANGSUNG",
          unit: "UPC Ranotana",
          unitAddress: "Jl. Sam Ratulangi, Manado",
          reference: "CASH-OCE8A1",
          applicationNumber: "PGJ-VIC-TRXVICK",
          paymentLabel: "Bayar langsung di unit",
          paymentNotes: ["Pembayaran hasil lelang sudah diverifikasi admin unit."],
          imageUrl: "/uploads/barang/cincin-lelang.jpg",
          handoverProof: {
            fileUrl: "/uploads/serah-terima/trx-vickrey-paid.jpg",
            uploadedAt: "3 Jun 2026, 08.15 WIB",
            uploadedBy: "Hendra Wijaya",
            location: "UPC Ranotana"
          },
          verifiedAt: "3 Jun 2026, 07.39 WIB",
          receiptNumber: "CASH-OCE8A1"
        }}
        transactionId="trx-vickrey-paid"
      />
    );

    expect(screen.getByRole("heading", { name: /detail transaksi lelang berhasil/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cetak nota/i })).toBeInTheDocument();
    expect(screen.getByText(/^alur pembayaran$/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /menunggu konfirmasi buyer/i })).toBeInTheDocument();
    const verifiedBanner = screen.getByRole("region", { name: /status pembayaran terverifikasi/i });
    expect(verifiedBanner).toHaveClass("lg:grid-cols-[200px_minmax(0,1fr)]");
    expect(
      within(verifiedBanner).getByRole("heading", { name: /pembayaran telah diverifikasi admin unit/i })
    ).toBeInTheDocument();
    expect(
      within(verifiedBanner).getByText(/pembayaran anda telah diverifikasi oleh admin unit/i)
    ).toBeInTheDocument();
    expect(within(verifiedBanner).getByText(/tanggal verifikasi/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /pelunasan berhasil dalam batas waktu 24 jam/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/transaksi ini berhasil diproses karena pemenang menyelesaikan pelunasan/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nominal lelang/i)).toBeInTheDocument();
    expect(screen.getByText(/rp 10\.000\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/unit pelaksana/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal verifikasi/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /informasi barang & pemenang/i })).toBeInTheDocument();
    expect(screen.queryByText(/id pengajuan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^pgj-vic-trxvick$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nama pembeli/i)).toBeInTheDocument();
    expect(screen.getAllByText(/budi santoso/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/budi@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/bayar langsung di unit/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /log audit sistem/i })).toBeInTheDocument();
    expect(screen.getByText(/dibuat pada/i)).toBeInTheDocument();
    expect(screen.getByText(/system \(auto\)/i)).toBeInTheDocument();
    expect(screen.getByText(/trx-suk-pgj-vic-trxvick/i)).toBeInTheDocument();
    expect(screen.queryByText(/^pembayaran diverifikasi$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tidak memiliki kendala verifikasi/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /dokumentasi serah terima barang fisik/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /foto barang cincin emas berlian/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /cetak nota/i })[0]);
    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1), { timeout: 3000 });

    const receiptPrintRoot = document.getElementById("buyer-receipt-print-root-trx-vickrey-paid-status");

    expect(screen.queryByRole("heading", { name: /nota transaksi/i })).not.toBeInTheDocument();
    expect(receiptPrintRoot).not.toBeNull();
    expect(receiptPrintRoot!).toHaveClass("vickrey-receipt-print-document", "hidden", "print:block");
    expect(receiptPrintRoot!.querySelector("style")?.textContent).toContain("width: 210mm");
    expect(receiptPrintRoot!.querySelector("style")?.textContent).toContain("min-height: 297mm");
    expect(receiptPrintRoot!.querySelector(".receipt-output-header-grid")).not.toBeNull();
    expect(receiptPrintRoot!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    expect(receiptPrintRoot!).toHaveTextContent("Lelang");
    expect(receiptPrintRoot!).not.toHaveTextContent("Lelang Tertutup");
    expect(receiptPrintRoot!).toHaveTextContent("Langsung di unit");
    expect(receiptPrintRoot!).toHaveTextContent("Pembayaran hasil lelang sudah diverifikasi admin unit");
    expect(receiptPrintRoot!).toHaveTextContent("Dokumen ini diterbitkan oleh admin unit Ruang Agunan.");
    expect(receiptPrintRoot!.querySelector('img[src*="/uploads/barang/cincin-lelang.jpg"]')).not.toBeNull();

    printSpy.mockRestore();
  });

  it("keeps the Vickrey payment workflow pending until buyer completes the purchase", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          id: "trx-vickrey-verified",
          lotId: "pm-vickrey-verified",
          kind: "VICKREY_WIN",
          title: "Cincin Emas Terverifikasi",
          amount: 16000000,
          status: "LUNAS",
          method: "BAYAR_LANGSUNG",
          unit: "UPC Wanea",
          unitAddress: "Jl. Sam Ratulangi, Manado",
          reference: "CASH-VERIFIED",
          applicationNumber: "PGJ-VIC-VERIFIED",
          paymentLabel: "Bayar langsung di unit",
          paymentNotes: ["Pembayaran hasil lelang sudah diverifikasi admin unit."],
          imageUrl: "/uploads/barang/cincin-terverifikasi.jpg",
          verifiedAt: "16 Agu 2026, 09.53 WIB"
        }}
        transactionId="trx-vickrey-verified"
      />
    );

    const workflow = screen.getByText("Alur Pembayaran").closest("section");
    expect(workflow).not.toBeNull();
    expect(within(workflow!).queryByText(/alur selesai/i)).not.toBeInTheDocument();
    expect(within(workflow!).getByText(/posisi sekarang\s*\|\s*tahap 2 dari 3/i)).toBeInTheDocument();
    expect(within(workflow!).getByRole("heading", { name: /menunggu bukti serah-terima dari admin unit/i })).toBeInTheDocument();
    expect(within(workflow!).getByText(/^berjalan$/i)).toBeInTheDocument();
    expect(
      within(workflow!).getAllByText(
        /pembayaran sudah diverifikasi\. admin unit perlu mengunggah bukti serah-terima barang\./i
      )
    ).toHaveLength(2);
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeDisabled();
  });

  it("uses the completed auction summary instead of the verified-payment summary for a finished Vickrey winner", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          id: "trx-vickrey-completed",
          lotId: "pm-vickrey-completed",
          kind: "VICKREY_WIN",
          title: "Cincin Emas Berlian Selesai",
          amount: 10000000,
          status: "SELESAI",
          method: "BAYAR_LANGSUNG",
          unit: "UPC Ranotana",
          applicationNumber: "PGJ-VIC-COMPLETED",
          handoverProof: {
            fileUrl: "/uploads/serah-terima/trx-vickrey-completed.jpg",
            uploadedAt: "3 Jun 2026, 08.15 WIB",
            uploadedBy: "Hendra Wijaya",
            location: "UPC Ranotana"
          },
          verifiedAt: "3 Jun 2026, 07.39 WIB"
        }}
        transactionId="trx-vickrey-completed"
      />
    );

    const completedSummary = screen.getByRole("region", { name: /status transaksi selesai/i });
    expect(within(completedSummary).getByRole("heading", { name: /pelunasan berhasil dalam batas waktu 24 jam/i })).toBeInTheDocument();
    expect(within(completedSummary).getByText(/tanggal pelunasan/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /status pembayaran terverifikasi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /pembayaran telah diverifikasi admin unit/i })).not.toBeInTheDocument();
  });

  it("prints the paid auction winner receipt in place on mobile without opening the receipt route", async () => {
    const originalUserAgent = window.navigator.userAgent;
    const openSpy = vi.spyOn(window, "open").mockReturnValue({ focus: vi.fn() } as unknown as Window);
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
    });

    try {
      render(
        <TransactionDetailPage
          buyer={buyer}
          transaction={{
            ...transaction,
            id: "trx-vickrey-paid",
            lotId: "pm-vickrey-1",
            kind: "VICKREY_WIN",
            title: "Cincin Emas Berlian",
            amount: 10000000,
            status: "SELESAI",
            method: "BAYAR_LANGSUNG",
            unit: "UPC Ranotana",
            unitAddress: "Jl. Sam Ratulangi, Manado",
            reference: "CASH-OCE8A1",
            applicationNumber: "PGJ-VIC-TRXVICK",
            paymentLabel: "Bayar langsung di unit",
            paymentNotes: ["Pembayaran hasil lelang sudah diverifikasi admin unit."],
            imageUrl: "/uploads/barang/cincin-lelang.jpg",
            handoverProof: {
              fileUrl: "/uploads/serah-terima/trx-vickrey-paid-mobile.jpg",
              uploadedAt: "3 Jun 2026, 08.15 WIB",
              uploadedBy: "Hendra Wijaya",
              location: "UPC Ranotana"
            },
            verifiedAt: "3 Jun 2026, 07.39 WIB",
            completedAt: "13 Jun 2026, 23.39 WIB",
            receiptNumber: "CASH-OCE8A1"
          }}
          transactionId="trx-vickrey-paid"
        />
      );

      expect(screen.getByRole("heading", { name: /detail transaksi lelang berhasil/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /cetak nota/i }));

      const printFrame = await waitFor(() => {
        const frame = document.querySelector(
          'iframe[data-receipt-print-frame="true"][data-receipt-root-id="buyer-receipt-print-root-trx-vickrey-paid-status"]'
        ) as HTMLIFrameElement | null;
        expect(frame).not.toBeNull();
        return frame!;
      }, { timeout: 3000 });

      expect(openSpy).not.toHaveBeenCalled();
      expect(printSpy).not.toHaveBeenCalled();
      const isolatedReceipt = printFrame.contentDocument?.getElementById(
        "buyer-receipt-print-root-trx-vickrey-paid-status"
      );
      expect(isolatedReceipt).not.toBeNull();
      expect(isolatedReceipt?.textContent).toContain("Nota Pengambilan Barang");
      expect(isolatedReceipt?.textContent).not.toContain("Detail Transaksi Lelang Berhasil");
      expect(isolatedReceipt!.querySelector(".receipt-output-header-grid")).not.toBeNull();
      expect(isolatedReceipt!.querySelector(".receipt-output-main-grid")).not.toBeNull();
    } finally {
      Object.defineProperty(window.navigator, "userAgent", {
        configurable: true,
        value: originalUserAgent
      });
      openSpy.mockRestore();
      printSpy.mockRestore();
    }
  });

  it("shows uploaded proof as read-only review state after the buyer sends payment proof", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "BUKTI_DIUNGGAH",
          paymentProof: "/uploads/bukti/transfer-budi.jpg",
          reference: "BRI-2026-001"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("heading", { name: /review bukti/i })).toBeInTheDocument();
    expect(screen.queryByText(/bukti pembayaran sedang direview/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/terkirim dan terkunci sampai admin/i)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-budi.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tekan untuk membuka tampilan penuh/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^pilih file$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /bukti sedang direview admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^kirim bukti pembayaran$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kembali ke detail barang/i })).not.toBeInTheDocument();
  });

  it("auto-refreshes detail transaksi while payment is waiting for admin verification", () => {
    vi.useFakeTimers();

    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          id: "trx-fixed-review",
          status: "BUKTI_DIUNGGAH",
          paymentProof: "/uploads/bukti/transfer-budi.jpg",
          reference: "BRI-2026-009"
        }}
        transactionId="trx-fixed-review"
      />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the uploaded proof preview visible after the transaction is completed", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "SELESAI",
          paymentProof: "/uploads/bukti/transfer-selesai.jpg",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getAllByText(/pembelian sudah ditutup buyer/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-selesai.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim bukti pembayaran/i })).not.toBeInTheDocument();
  });

  it("surfaces rejection reason as a canceled transaction while keeping the submitted proof visible", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        transaction={{
          ...transaction,
          status: "DITOLAK_BUKTI",
          paymentProof: "/uploads/bukti/transfer-budi-buram.jpg",
          rejectionReason: "Nominal uang yang dikirim tidak sesuai harga barang.",
          verifiedBy: "Maria Supit",
          verifiedAt: "5 Jul 2026, 15.36 WIB"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.getByRole("heading", { name: /alur verifikasi gagal/i })).toBeInTheDocument();
    expect(screen.getAllByText(/bukti pembayaran ditolak/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/nominal uang yang dikirim tidak sesuai harga barang/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/transaksi dibatalkan dan barang kembali tersedia di katalog/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/barang dapat dibeli kembali dari katalog jika masih tersedia/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /review bukti/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/transfer-budi-buram\.jpg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/upload kembali bukti pembayaran/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tekan untuk membuka tampilan penuh/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/file bukti transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim ulang bukti pembayaran/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kirim bukti pembayaran/i })).not.toBeInTheDocument();
    const workflow = screen.getByText("Alur Pembayaran").closest("section");
    expect(workflow).not.toBeNull();
    expect(within(workflow!).getByText(/Admin: Maria Supit/i)).toBeInTheDocument();
    expect(within(workflow!).getAllByText(new RegExp(`Buyer: ${buyer.name}`, "i"))).toHaveLength(1);
  });

  it("keeps the handover proof requirement while the buyer has an active blacklist", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        buyerStatus={{ blacklist: { active: true, until: new Date("2026-05-28T00:00:00.000Z"), totalViolations: 1 } }}
        transaction={{
          ...transaction,
          status: "LUNAS",
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.queryByText(/transaksi baru dan upload pembayaran ditahan/i)).not.toBeInTheDocument();
    const handoverPanel = screen.getByLabelText(/panel bukti serah-terima barang/i);
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeDisabled();
    expect(within(handoverPanel).queryByRole("button", { name: /pembelian selesai/i })).not.toBeInTheDocument();
  });

  it("allows a blacklisted buyer to finish a verified transaction after handover proof exists", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        buyerStatus={{ blacklist: { active: true, until: new Date("2026-05-28T00:00:00.000Z"), totalViolations: 1 } }}
        transaction={{
          ...transaction,
          status: "LUNAS",
          paymentProof: "/uploads/bukti/transfer-lunas.jpg",
          handoverProof: {
            fileUrl: "/uploads/serah-terima/trx-fixed-1.jpg",
            uploadedAt: "4 Mei 2026 22.30 WIB",
            uploadedBy: "Hendra Wijaya",
            location: "UPC Ranotana"
          },
          verifiedAt: "4 Mei 2026 22.11 WIB",
          receiptNumber: "INV/TRXFIXED"
        }}
        transactionId={transaction.id}
      />
    );

    expect(screen.queryByText(/transaksi baru dan upload pembayaran ditahan/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pembelian selesai/i })).toBeEnabled();
  });

  it("allows proof upload for an existing transaction while the buyer has an active blacklist", () => {
    render(
      <TransactionDetailPage
        buyer={buyer}
        buyerStatus={{ blacklist: { active: true, until: new Date("2026-05-28T00:00:00.000Z"), totalViolations: 1 } }}
        transaction={transaction}
        transactionId={transaction.id}
      />
    );

    expect(screen.queryByText(/transaksi baru dan upload pembayaran ditahan/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kirim bukti pembayaran/i })).toBeInTheDocument();
  });
});
