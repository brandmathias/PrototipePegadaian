import Image from "next/image";
import type { ReactNode } from "react";
import { BadgeCheck, FileText, Landmark, UserRound } from "lucide-react";

import { currency } from "@/lib/formatters/currency";

type ReceiptMetaItem = {
  label: string;
  value: string;
};

function ReceiptSectionHeading({
  icon,
  title,
  outputLayout
}: {
  icon: ReactNode;
  title: string;
  outputLayout?: boolean;
}) {
  return (
    <div className={`flex items-center ${outputLayout ? "gap-2" : "gap-2.5"}`}>
      <div
        className={`grid ${outputLayout ? "size-7" : "size-8"} shrink-0 place-items-center rounded-full bg-[#eaf3ea] text-[#0b6a46] ${
          outputLayout ? "shadow-none" : ""
        }`}
      >
        {icon}
      </div>
      <p
        className={`text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#0f5136] ${
          outputLayout ? "leading-none translate-y-px" : ""
        }`}
      >
        {title}
      </p>
    </div>
  );
}

export function TransactionReceiptDocument({
  buyerEmail,
  buyerName,
  buyerPhone,
  extraMeta,
  footerText,
  imageUrl,
  itemSubtitle,
  itemTitle,
  noteNumber,
  paymentMethodLabel,
  handoverByName,
  receiverName,
  statusLabel,
  subtotal,
  terms,
  title = "Nota Pengambilan Barang",
  total,
  transactionId,
  unitAddress,
  unitName,
  verifiedByName,
  verifiedAt,
  outputLayout = false
}: {
  buyerEmail?: string;
  buyerName: string;
  buyerPhone?: string;
  extraMeta?: ReceiptMetaItem[];
  footerText?: string;
  imageUrl?: string;
  itemSubtitle?: string;
  itemTitle: string;
  noteNumber: string;
  paymentMethodLabel: string;
  handoverByName?: string;
  receiverName?: string;
  statusLabel: string;
  subtotal: number;
  terms: string[];
  title?: string;
  total: number;
  transactionId: string;
  unitAddress: string;
  unitName: string;
  verifiedByName?: string;
  verifiedAt?: string;
  outputLayout?: boolean;
}) {
  const paymentVerifierName = verifiedByName?.trim() || "Admin Unit";
  const handoverOfficerName = handoverByName?.trim() || paymentVerifierName;
  const receiverDisplayName = receiverName?.trim() || buyerName;
  const paymentVerifierLabel = `${paymentVerifierName} - ${unitName}`;
  const handoverOfficerLabel = `${handoverOfficerName} - ${unitName}`;
  const headerClassName = outputLayout
    ? "receipt-output-header relative overflow-hidden rounded-t-[1.35rem] bg-[linear-gradient(135deg,#0a4a33_0%,#0b6a46_58%,#b88c1a_100%)] px-5 py-4 text-white print:break-inside-avoid print:rounded-t-[1.35rem] print:px-5 print:py-4"
    : "receipt-output-header relative overflow-hidden rounded-t-[1.65rem] bg-[linear-gradient(135deg,#0a4a33_0%,#0b6a46_58%,#b88c1a_100%)] px-4 py-4 text-white md:px-6 md:py-5 print:break-inside-avoid print:rounded-t-[1.35rem] print:px-5 print:py-4";
  const headerGridClassName = outputLayout
    ? "receipt-output-header-grid relative flex flex-row items-center justify-between gap-4"
    : "receipt-output-header-grid relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:flex-row print:items-center print:justify-between print:gap-4";
  const receiptCardClassName = outputLayout
    ? "rounded-[1.4rem] border border-[#dbe4da] bg-white px-3 py-3 shadow-[0_18px_34px_-28px_rgba(8,63,39,0.2)] print:px-3 print:py-3"
    : "rounded-[1.4rem] border border-[#dbe4da] bg-white px-4 py-4 shadow-[0_18px_34px_-28px_rgba(8,63,39,0.2)] print:px-3 print:py-3";
  const receiptSectionClassName = outputLayout ? "space-y-3" : "space-y-4 print:space-y-3";
  const receiptAuditGridClassName = outputLayout
    ? "receipt-output-audit-grid grid grid-cols-[0.95fr_1.05fr] gap-3"
    : "receipt-output-audit-grid grid gap-4 md:grid-cols-[0.95fr_1.05fr] print:grid-cols-[0.95fr_1.05fr] print:gap-3";

  return (
    <article
      className={`receipt-sheet receipt-output-sheet mx-auto w-full max-w-[920px] rounded-[2rem] border border-[#cbd9cc] bg-[#f4f7f2] shadow-[0_20px_50px_-36px_rgba(8,63,39,0.28)] print:max-w-none print:break-inside-avoid print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none ${
        outputLayout ? "flex flex-col overflow-visible" : "overflow-hidden"
      }`}
      id="transaction-receipt-document"
      style={
        outputLayout
          ? {
              aspectRatio: "210 / 297",
              boxSizing: "border-box",
              minHeight: "297mm",
              width: "210mm"
            }
          : undefined
      }
    >
      <header className={headerClassName}>
        {!outputLayout ? (
          <>
            <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/8 blur-2xl" />
            <div className="absolute right-4 top-4 size-24 rounded-full bg-[#d9b65a]/10 blur-xl" />
          </>
        ) : null}

        <div className={headerGridClassName}>
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-[#0b6a46] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              <Landmark className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/72">
                Ruang Agunan
              </p>
              <h1 className="mt-1 max-w-3xl text-[1.45rem] font-black leading-tight tracking-tight text-white md:text-[1.75rem] print:text-[1.48rem] print:leading-tight print:text-white">
                {title}
              </h1>
              <p className="mt-1 text-sm text-white/78 print:text-white/80">
                Lembaga lelang negara terpercaya
              </p>
            </div>
          </div>

          <div
            className={`receipt-output-meta-card rounded-[1.15rem] border px-4 py-3 print:shrink-0 print:px-3 print:py-2.5 ${
              outputLayout
                ? "shrink-0 border-[#d7b458]/35 bg-[linear-gradient(135deg,rgba(8,74,51,0.76)_0%,rgba(11,106,70,0.62)_55%,rgba(184,140,26,0.48)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "border-white/12 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
            }`}
          >
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-white/68">
              Nota Transaksi Resmi
            </p>
            <div className={`mt-2 ${outputLayout ? "grid gap-1.5 text-[0.72rem]" : "space-y-1 text-sm"} text-white`}>
              <div className="grid grid-cols-[auto_1fr] items-start gap-4">
                <span className="text-white/66">ID Transaksi</span>
                <span className="max-w-[18rem] justify-self-end break-all text-right font-semibold leading-tight">{transactionId}</span>
              </div>
              <div className="grid grid-cols-[auto_1fr] items-start gap-4">
                <span className="text-white/66">Tanggal</span>
                <span className="justify-self-end text-right font-semibold leading-tight">{verifiedAt || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={
          outputLayout
            ? "receipt-output-body flex flex-1 flex-col gap-3 px-4 py-4 print:gap-3 print:px-4 print:py-4"
            : "space-y-4 px-4 py-4 md:px-6 md:py-5 print:space-y-3 print:px-3 print:py-3"
        }
      >
        <div
          className={
            outputLayout
              ? "receipt-output-main-grid grid grid-cols-[1.38fr_0.86fr] gap-3"
              : "receipt-output-main-grid grid gap-4 md:grid-cols-[1.42fr_0.88fr] print:grid-cols-[1.38fr_0.86fr] print:gap-3"
          }
        >
          <section className={receiptSectionClassName}>
            <div className={receiptCardClassName}>
              <ReceiptSectionHeading icon={<FileText className="size-4" />} outputLayout={outputLayout} title="Rincian Barang" />
              <div className="mt-4 border-t border-[#edf2ec] pt-4">
                <div
                  className={
                    outputLayout
                      ? "receipt-output-item-grid grid grid-cols-[3.75rem_minmax(0,1fr)_7.2rem] items-center gap-3"
                      : "flex gap-3"
                  }
                >
                  <div
                    className={`shrink-0 overflow-hidden rounded-2xl border border-[#dbe4da] bg-[#eef5ec] ${
                      outputLayout ? "h-16 w-16 print:h-14 print:w-14" : "h-20 w-20"
                    }`}
                  >
                    {imageUrl ? (
                      <Image
                        alt={`Foto barang ${itemTitle}`}
                        className="size-full object-cover"
                        decoding="sync"
                        height={160}
                        loading="eager"
                        src={imageUrl}
                        unoptimized
                        width={160}
                      />
                  ) : (
                    <div className="flex size-full items-center justify-center px-2 text-center text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#7c8d80]">
                      Tanpa Foto
                    </div>
                    )}
                  </div>
                  <div className={outputLayout ? "min-w-0 space-y-2" : "min-w-0 flex-1"}>
                    <p
                      className={`font-black tracking-tight text-[#143325] ${
                        outputLayout ? "text-[1rem] leading-tight" : "text-[1.02rem] md:text-[1.08rem]"
                      }`}
                    >
                      {itemTitle}
                    </p>
                    <p
                      className={`text-[#5a715d] ${
                        outputLayout ? "max-w-[30ch] text-[0.72rem] leading-4" : "mt-1 text-sm leading-5"
                      }`}
                    >
                      {itemSubtitle}
                    </p>
                    {extraMeta?.length ? (
                      <div className={outputLayout ? "flex flex-wrap gap-1.5" : "mt-3 flex flex-wrap gap-2"}>
                        {extraMeta.slice(0, 2).map((item) => (
                          <span
                            className={`inline-flex items-center rounded-full border border-[#dbe4da] bg-[#f7f8f4] font-semibold uppercase tracking-[0.16em] text-[#5f6f62] ${
                              outputLayout ? "px-2.5 py-1 text-[0.58rem] leading-none" : "px-3 py-1 text-[0.66rem]"
                            }`}
                            key={item.label}
                          >
                            {item.value}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={`shrink-0 text-right ${
                      outputLayout
                        ? "rounded-2xl border border-[#d7b458]/24 bg-[#f8f5eb] px-3 py-3"
                        : ""
                    }`}
                  >
                    <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#6f865f]">
                      Total
                    </p>
                    <p
                      className={`mt-1 font-black tracking-tight text-[#0b6a46] ${
                        outputLayout ? "whitespace-nowrap text-[0.95rem] leading-none" : "text-[1.2rem] md:text-[1.35rem]"
                      }`}
                    >
                      {currency.format(total)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={receiptCardClassName}>
              <ReceiptSectionHeading icon={<UserRound className="size-4" />} outputLayout={outputLayout} title="Informasi Pembeli" />
              <div className="mt-4 border-t border-[#edf2ec] pt-4">
                <div
                  className={
                    outputLayout
                      ? "receipt-output-buyer-grid grid grid-cols-2 gap-3"
                      : "receipt-output-buyer-grid grid gap-3 sm:grid-cols-2 print:grid-cols-2"
                  }
                >
                  <div>
                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#6e836f]">
                      Nama Lengkap
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#143325]">{buyerName}</p>
                  </div>
                  <div>
                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#6e836f]">
                      Nomor Telepon
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#143325]">{buyerPhone || "-"}</p>
                  </div>
                  <div className={outputLayout ? "col-span-2" : "sm:col-span-2"}>
                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#6e836f]">
                      Email
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold leading-6 text-[#143325]">
                      {buyerEmail || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={receiptSectionClassName}>
            <div className="rounded-[1.4rem] border border-[#dbe4da] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf7_100%)] px-4 py-4 shadow-[0_18px_34px_-28px_rgba(8,63,39,0.2)] print:px-3 print:py-3">
              <ReceiptSectionHeading icon={<BadgeCheck className="size-4" />} outputLayout={outputLayout} title="Total Pembayaran" />
              <div className="mt-4 border-t border-[#edf2ec] pt-4">
                <p className="text-sm leading-6 text-[#5a715d]">Total Harga Lelang Terbayar</p>
                <p
                  className={`mt-2 font-black tracking-tight text-[#0b6a46] ${
                    outputLayout ? "text-[1.75rem] leading-none" : "text-[1.95rem] md:text-[2.15rem]"
                  }`}
                >
                  {currency.format(total)}
                </p>
                <div
                  className={`receipt-status-pill mt-3 flex w-full items-center border ${
                    outputLayout
                      ? "h-[1.45rem] justify-start gap-1.5 overflow-hidden rounded-[0.72rem] border-[#c9d9ca] bg-[#edf5ef] px-2.5 text-[0.62rem] leading-none text-[#0b6a46]"
                      : "gap-2 rounded-2xl border-[#dbe4da] bg-white px-3 py-2 text-sm text-[#49624d]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`receipt-status-pill-icon grid shrink-0 place-items-center rounded-full ${
                      outputLayout
                        ? "size-3 border border-[#0b6a46]/55 bg-white/40"
                        : "size-4 border border-[#b88c1a]/55 bg-[#fff8e8]"
                    }`}
                  >
                    <span className={`rounded-full ${outputLayout ? "size-[0.28rem] bg-[#0b6a46]" : "size-1.5 bg-[#b88c1a]"}`} />
                  </span>
                  <span className="receipt-status-pill-label block min-w-0 flex-1 truncate whitespace-nowrap text-left font-bold leading-none">
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className={receiptCardClassName}>
              <ReceiptSectionHeading icon={<Landmark className="size-4" />} outputLayout={outputLayout} title="Metode Pembayaran" />
              <div className="mt-4 border-t border-[#edf2ec] pt-4 space-y-3 text-sm leading-6 text-[#143325]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#5a715d]">Metode</span>
                  <span className="font-semibold">{paymentMethodLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#5a715d]">Referensi</span>
                  <span className="font-semibold">{noteNumber}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#5a715d]">Unit</span>
                  <span className="text-right font-semibold">{unitName}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#5a715d]">Verifikasi</span>
                  <span className="text-right font-semibold">{verifiedAt || "-"}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div
          className={
            outputLayout
              ? "receipt-output-summary-grid grid grid-cols-[1.2fr_0.8fr] gap-3"
              : "receipt-output-summary-grid grid gap-4 md:grid-cols-[1.2fr_0.8fr] print:grid-cols-[1.2fr_0.8fr] print:gap-3"
          }
        >
          <div className="rounded-[1.25rem] border border-[#dbe4da] bg-white px-4 py-3 shadow-[0_18px_34px_-28px_rgba(8,63,39,0.2)] print:px-3 print:py-3">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[#0f5136]">
              Syarat & Ketentuan
            </p>
            <div className="mt-2 grid gap-1 text-[0.72rem] leading-5 text-[#4c5f50] print:text-[0.68rem]">
              {terms.slice(0, 3).map((term) => (
                <div className="rounded-xl bg-[#f8faf7] px-3 py-1.5" key={term}>
                  {term}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[#dbe4da] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbf8_100%)] px-4 py-3 shadow-[0_18px_34px_-28px_rgba(8,63,39,0.2)] print:px-3 print:py-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[#5a715d]">Subtotal</span>
              <span className="font-semibold text-[#143325]">{currency.format(subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 text-sm">
              <span className="text-[#5a715d]">Biaya Admin</span>
              <span className="font-semibold text-[#143325]">{currency.format(0)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#dbe4da] pt-3 text-[1rem] font-black text-[#0b6a46]">
              <span>Total</span>
              <span>{currency.format(total)}</span>
            </div>
          </div>
        </div>

        <div className={receiptAuditGridClassName}>
          <div className="rounded-[1.25rem] border border-[#dbe4da] bg-white px-4 py-3 shadow-[0_18px_34px_-28px_rgba(8,63,39,0.18)] print:px-3 print:py-3">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[#0f5136]">
              Audit Petugas
            </p>
            <div className="mt-3 grid gap-2 text-[0.72rem] leading-5 text-[#4c5f50] print:text-[0.68rem]">
              <div className="rounded-xl bg-[#f8faf7] px-3 py-2">
                <p className="font-bold uppercase tracking-[0.14em] text-[#6e836f]">
                  Pembayaran diverifikasi oleh
                </p>
                <p className="mt-1 font-semibold text-[#143325]">{paymentVerifierLabel}</p>
              </div>
              <div className="rounded-xl bg-[#f8faf7] px-3 py-2">
                <p className="font-bold uppercase tracking-[0.14em] text-[#6e836f]">
                  Barang diserahkan oleh
                </p>
                <p className="mt-1 font-semibold text-[#143325]">{handoverOfficerLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[#dbe4da] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbf8_100%)] px-4 py-3 shadow-[0_18px_34px_-28px_rgba(8,63,39,0.18)] print:px-3 print:py-3">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[#0f5136]">
              Tanda Tangan
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { label: "Petugas Unit", name: handoverOfficerName },
                { label: "Penerima Barang", name: receiverDisplayName }
              ].map((entry) => (
                <div className="rounded-xl border border-[#edf2ec] bg-white px-3 py-3 text-center" key={entry.label}>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#6e836f]">
                    {entry.label}
                  </p>
                  <div className="mx-auto mt-8 h-px w-full max-w-[9rem] bg-[#aab8ab]" />
                  <p className="mt-2 truncate text-[0.74rem] font-black text-[#143325]">{entry.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#dbe4da] px-1 pt-2 text-[0.68rem] leading-5 text-[#6a7b6d]">
          {footerText || "Dokumen ini dibuat oleh sistem Ruang Agunan."}
        </div>
      </div>
    </article>
  );
}
