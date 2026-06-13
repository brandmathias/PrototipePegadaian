import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AuctionWinnerHeroStage } from "@/components/buyer/auction-winner-hero-stage";
import { AuctionWinnerCountdown } from "@/components/buyer/auction-winner-countdown";
import {
  ArrowRightIcon,
  AwardIcon,
  BellIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  TagIcon,
} from "@/components/buyer/auction-winner-icons";
import type { BuyerTransaction } from "@/lib/contracts/buyer";
import { currency } from "@/lib/formatters/currency";

const WINNER_ASSET_BASE =
  "/uploads/Assets%20Pengumuman%20Pemenang%20Lelang";
const WINNER_TROPHY_ASSET = `${WINNER_ASSET_BASE}/Piala%20Pemenang%20Lelang.png`;
const WINNER_CHECK_ASSET = `${WINNER_ASSET_BASE}/Tanda%20Centang%20Pemenang%20Lelang%20Hero%20Section.png`;

function WinnerPrimaryAction({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      className="group inline-flex h-14 w-full items-center justify-center rounded-full bg-[#006747] px-4 text-base font-black tracking-[-0.02em] text-white shadow-[0_24px_48px_-28px_rgba(0,103,71,0.34)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#00573b] active:scale-[0.99]"
      href={href}
    >
      <span>{label}</span>
      <span className="ml-3 inline-flex size-8 items-center justify-center rounded-full bg-white/[0.14] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
        <ArrowRightIcon className="size-4" strokeWidth={1.85} />
      </span>
    </Link>
  );
}

function WinnerSummaryMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 md:px-6">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#f0f7f3] text-[#0f6d4c] ring-1 ring-[#dce9e0]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#5f6f68]">{label}</p>
        <p className="mt-1 truncate text-xl font-black tracking-[-0.03em] text-[#15211b]">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProductVisual({
  imageUrl,
  title,
}: {
  imageUrl?: string;
  title: string;
}) {
  if (imageUrl) {
    return (
      <div className="relative aspect-[1.08/0.88] overflow-hidden rounded-[1.6rem] bg-white ring-1 ring-[#edf0eb] shadow-[0_22px_44px_-36px_rgba(15,23,42,0.18)]">
        <Image
          alt={`Foto barang ${title}`}
          className="object-cover object-center"
          fill
          sizes="(max-width: 1024px) 100vw, 500px"
          src={imageUrl}
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[1.08/0.9] overflow-hidden rounded-[1.6rem] bg-[radial-gradient(circle_at_30%_18%,#f5fbf7,#dcefe4_38%,#9ac0ac_68%,#46755e_100%)] shadow-[0_28px_48px_-38px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.24),transparent_34%,rgba(0,0,0,0.08)_100%)]" />
      <div className="relative flex h-full items-center justify-center text-[#0f4735]">
        <BriefcaseIcon className="size-20 opacity-80" strokeWidth={1.55} />
      </div>
    </div>
  );
}

export function AuctionWinnerPageContent({
  transaction,
}: {
  transaction: BuyerTransaction;
}) {
  const detailHref = `/transaksi/${transaction.id}`;
  const serverNow = new Date().toISOString();
  const summaryCode = transaction.applicationNumber || transaction.id;
  const winnerContext =
    transaction.winnerContext ??
    "Harga akhir mengikuti mekanisme lelang yang berlaku di sistem.";

  return (
    <div className="full-bleed-safe min-h-dvh bg-white">
      <div className="space-y-8 bg-white pb-10 md:space-y-10 md:pb-14">
      <section className="relative overflow-hidden bg-[#032f22]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(34,158,105,0.26),transparent_28%),radial-gradient(circle_at_72%_24%,rgba(212,175,55,0.18),transparent_20%),linear-gradient(120deg,#042f22_0%,#063d2c_46%,#03281d_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,rgba(0,0,0,0.14)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]" />

        <div className="container relative py-7 md:py-8 xl:py-10">
          <div className="grid min-h-[21rem] items-center gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)]">
            <div className="section-reveal relative z-10 max-w-[46rem] rounded-[2rem] border border-[#d4af37]/45 bg-[linear-gradient(145deg,rgba(6,63,46,0.9),rgba(5,48,36,0.82))] p-3 shadow-[0_34px_80px_-46px_rgba(0,0,0,0.7)]">
              <div className="relative overflow-hidden rounded-[calc(2rem-0.75rem)] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(7,68,50,0.88),rgba(4,49,36,0.84))] px-6 py-6 md:px-8 md:py-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_top,rgba(255,255,255,0.08),transparent_32%),linear-gradient(90deg,transparent,rgba(212,175,55,0.06),transparent)]" />
                <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="relative shrink-0">
                    <span className="absolute inset-2 rounded-full bg-[#f0c75a]/[0.32] blur-2xl" />
                    <div className="relative grid size-[6.2rem] place-items-center rounded-full border border-[#f2ca66]/65 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_52%,rgba(0,0,0,0.12)_100%)] shadow-[0_0_0_1px_rgba(255,216,122,0.18),0_22px_46px_-34px_rgba(242,202,102,0.6)]">
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="h-[4.4rem] w-[4.4rem] object-contain"
                        height={1254}
                        priority
                        src={WINNER_CHECK_ASSET}
                        width={1254}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#f0d99c]/[0.72]">
                      Pengumuman pemenang lelang
                    </p>
                    <h1 className="mt-3 font-headline text-[2.35rem] font-black leading-[1.02] tracking-[-0.055em] text-white md:text-[3rem]">
                      Selamat,
                      <span className="mt-2 block text-[#f0c75a]">
                        Anda Memenangkan Lelang
                      </span>
                    </h1>
                    <p className="mt-4 max-w-[34rem] text-base leading-8 text-white/[0.82]">
                      Penawaran terbaik Anda berhasil menjadi pemenang. Terima kasih telah
                      mengikuti lelang di
                      <span className="font-semibold text-[#b9e7ce]"> Pegadaian Lelang</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AuctionWinnerHeroStage
              trophySrc={WINNER_TROPHY_ASSET}
            />
          </div>
        </div>
      </section>

      <div className="container relative -mt-3 space-y-6 md:-mt-5 md:space-y-7">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.34fr)_minmax(20rem,0.66fr)] xl:items-start">
          <article className="interactive-card rounded-[2rem] border border-black/[0.05] bg-white p-2 shadow-[0_28px_72px_-52px_rgba(15,23,42,0.16)]">
            <div className="rounded-[calc(2rem-0.5rem)] border border-[#eaeeea] bg-white px-5 py-5 md:px-7 md:py-6">
              <div className="grid gap-7 xl:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1fr)] xl:items-center">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7f0] px-4 py-2 text-sm font-bold text-[#0f6d4c] ring-1 ring-[#d9eadf]">
                    <AwardIcon className="size-4" strokeWidth={1.8} />
                    Lelang Berhasil
                  </span>
                  <div className="mt-5">
                    <ProductVisual imageUrl={transaction.imageUrl} title={transaction.title} />
                  </div>
                  <div className="mt-5 space-y-2">
                    <p className="text-sm font-medium text-[#5f6f68]">{transaction.unit}</p>
                    <h2 className="font-headline text-[2rem] font-black leading-[1.02] tracking-[-0.05em] text-[#15211b] md:text-[2.35rem]">
                      {transaction.title}
                    </h2>
                    <span className="inline-flex rounded-full bg-[#eff6f1] px-4 py-1.5 text-sm font-bold text-[#0f6d4c] ring-1 ring-[#dce9e0]">
                      {summaryCode}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[0.82rem] font-bold uppercase tracking-[0.2em] text-[#7b857d]">
                      Harga Akhir (Harga Menang)
                    </p>
                    <p className="mt-3 break-words font-headline text-[clamp(2rem,10vw,3rem)] font-black leading-none tracking-[-0.04em] text-[#0f4735] md:text-[3.55rem] md:tracking-[-0.07em]">
                      {currency.format(transaction.amount)}
                    </p>
                  </div>

                  <div className="rounded-[1.4rem] border border-[#edf0eb] bg-white px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-[#49564f]">
                        <span className="grid size-11 place-items-center rounded-full bg-[#f4f7f3] text-[#0f6d4c] ring-1 ring-[#dce9e0]">
                          <ClockIcon className="size-5" strokeWidth={1.75} />
                        </span>
                        <span className="text-[1.02rem] font-medium tracking-[-0.01em]">
                          Lelang berakhir pada
                        </span>
                      </div>
                      <p className="text-[1.05rem] font-semibold tracking-[-0.015em] text-[#15211b]">
                        {transaction.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-[#e7ece8] bg-white p-5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.1)]">
                    <div className="flex gap-4">
                      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#f3f8f5] text-[#0f6d4c] ring-1 ring-[#dce9e0] shadow-[0_18px_34px_-30px_rgba(15,23,42,0.16)]">
                        <BellIcon className="size-6" strokeWidth={1.8} />
                      </span>
                      <div>
                        <p className="text-[1.28rem] font-black tracking-[-0.03em] text-[#1e2c24]">
                          Langkah Selanjutnya: Lihat Detail Transaksi
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[#54574b]">
                          Buka detail transaksi untuk melihat instruksi pembayaran dan
                          memastikan proses penyelesaian dilakukan sebelum batas waktu
                          berakhir.
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[#54574b]">
                          {winnerContext}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <aside className="interactive-card rounded-[2rem] border border-black/[0.05] bg-white p-2 shadow-[0_28px_72px_-52px_rgba(15,23,42,0.16)]">
            <div className="rounded-[calc(2rem-0.5rem)] border border-[#eaeeea] bg-white px-5 py-5 md:px-6 md:py-6">
              <div className="flex items-start gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#f2f7f4] text-[#0f6d4c] ring-1 ring-[#dce9e0]">
                  <ClockIcon className="size-8" strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="max-w-[14rem] text-[1.9rem] font-black leading-[1.08] tracking-[-0.045em] text-[#15211b]">
                    Batas Waktu Pembayaran
                  </p>
                  <div className="mt-5">
                    <AuctionWinnerCountdown
                      serverNow={serverNow}
                      targetAt={transaction.deadlineAt}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.65rem] border border-[#ecefe9] bg-white p-5 shadow-[0_18px_42px_-38px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-3 text-[#0f4735]">
                  <BriefcaseIcon className="size-5" strokeWidth={1.85} />
                  <p className="text-[1.45rem] font-black tracking-[-0.03em] text-[#15211b]">
                    Informasi Pembayaran
                  </p>
                </div>
                <div className="mt-5 rounded-[1.35rem] bg-[#fafafa] px-5 py-5 ring-1 ring-[#edf0eb]">
                  <p className="text-sm font-medium text-[#5f6f68]">
                    Total yang Harus Dibayarkan
                  </p>
                  <p className="mt-3 break-words font-headline text-[clamp(2rem,10vw,3rem)] font-black leading-none tracking-[-0.04em] text-[#0f4735] md:tracking-[-0.06em]">
                    {currency.format(transaction.amount)}
                  </p>
                </div>

                <div className="mt-5">
                  <WinnerPrimaryAction href={detailHref} label="Lihat Detail Transaksi" />
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[1.8rem] border border-black/[0.05] bg-white p-2 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.14)]">
          <div className="rounded-[calc(1.8rem-0.5rem)] border border-[#eaeeea] bg-white">
            <div className="border-b border-[#edf0eb] px-5 py-4 md:px-6">
              <div className="flex items-center gap-3 text-[#0f4735]">
                <FileTextIcon className="size-5" strokeWidth={1.85} />
                <p className="text-[1.65rem] font-black tracking-[-0.035em] text-[#15211b]">
                  Ringkasan Lelang Anda
                </p>
              </div>
            </div>

            <div className="grid divide-y divide-[#edf0eb] md:grid-cols-3 md:divide-x md:divide-y-0">
              <WinnerSummaryMetric
                icon={<FileTextIcon className="size-5" strokeWidth={1.8} />}
                label="Kode Transaksi"
                value={summaryCode}
              />
              <WinnerSummaryMetric
                icon={<CalendarIcon className="size-5" strokeWidth={1.8} />}
                label="Tanggal Lelang"
                value={transaction.createdAt}
              />
              <WinnerSummaryMetric
                icon={<TagIcon className="size-5" strokeWidth={1.8} />}
                label="Harga Akhir (Harga Menang)"
                value={currency.format(transaction.amount)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
    </div>
  );
}
