import Image from "next/image";
import Link from "next/link";

import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FrownIcon,
  HeartIcon,
  InfoIcon,
  PartyIcon,
} from "@/components/buyer/auction-loser-icons";
import { AuctionLoserHeroStage } from "@/components/buyer/auction-loser-hero-stage";
import { AuctionLoserRecommendationCountdown } from "@/components/buyer/auction-loser-recommendation-countdown";
import type { BuyerBid } from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";
import { formatAppDateTime } from "@/lib/timezone";

const LOSER_ASSET_BASE =
  "/uploads/Design%20Halaman%20Bukan%20Pemenang%20Lelang";
const LOSER_GAVEL_ASSET = `${LOSER_ASSET_BASE}/Gambar%20Palu%20Hero%20Section%20Bukan%20Pemenang%20Lelang.png`;
const LOSER_X_ASSET = `${LOSER_ASSET_BASE}/Tanda%20X%20Bukan%20Pemenang%20Lelang%20Hero%20Section.png`;

function ProductImage({
  imageUrl,
  title,
}: {
  imageUrl?: string;
  title: string;
}) {
  if (!imageUrl) {
    return (
      <div className="grid h-full w-full place-items-center rounded-[1.1rem] bg-[radial-gradient(circle_at_32%_20%,#ffffff,#eef2ef_44%,#dfe7e1_100%)] text-[#0b6847]">
        <span className="text-xs font-black uppercase tracking-[0.18em]">Lelang</span>
      </div>
    );
  }

  return (
    <Image
      alt={`Foto barang ${title}`}
      className="object-cover object-center transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
      fill
      sizes="(max-width: 768px) 80vw, 260px"
      src={imageUrl}
      unoptimized
    />
  );
}

function RecommendationCard({
  lot,
  serverNow,
}: {
  lot: Lot;
  serverNow: string;
}) {
  const imageUrl = lot.media.find((item) => item.type === "foto")?.url;

  return (
    <Link
      className="group grid min-h-[7.6rem] grid-cols-[7.25rem_minmax(0,1fr)] gap-4 rounded-[1.15rem] border border-[#edf0eb] bg-white p-3.5 shadow-[0_14px_34px_-30px_rgba(16,24,40,0.18)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#cfe5d8] hover:shadow-[0_20px_44px_-32px_rgba(16,24,40,0.24)]"
      href={`/katalog/${lot.id}`}
    >
      <div className="relative min-h-[6.3rem] overflow-hidden rounded-[1rem] bg-[#f8faf9]">
        <ProductImage imageUrl={imageUrl} title={lot.name} />
      </div>

      <div className="flex min-w-0 flex-col justify-between py-1">
        <div className="min-w-0">
          <span className="inline-flex rounded-md bg-[#eaf7ef] px-2 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#006747]">
            Sedang Berlangsung
          </span>
          <h3 className="mt-2 line-clamp-2 text-[0.95rem] font-black leading-[1.18] tracking-[-0.025em] text-[#17211d] transition-colors duration-500 group-hover:text-[#006747]">
            {lot.name}
          </h3>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-[#f0f2ef] pt-2.5">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-bold text-[#8a938f]">Harga Mulai</p>
            <p className="mt-1 truncate text-[0.95rem] font-black tracking-[-0.02em] text-[#101828]">
              {currency.format(lot.price)}
            </p>
          </div>
          <div className="text-right">
            <p className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-[#8a938f]">
              <ClockIcon className="size-3 text-[#b5bfba]" strokeWidth={1.8} />
              Sisa Waktu
            </p>
            <AuctionLoserRecommendationCountdown
              className="mt-1 block rounded-md bg-[#fff3f3] px-2 py-1 font-mono text-[0.78rem] font-black text-[#e02020]"
              fallbackLabel={lot.countdown}
              serverNow={serverNow}
              targetAt={lot.endsAt}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function isOngoingVickreyRecommendation(lot: Lot, serverNow: string) {
  if (lot.mode !== "vickrey" || !lot.endsAt) {
    return false;
  }

  const endsAt = Date.parse(lot.endsAt);
  const now = Date.parse(serverNow);

  return Number.isFinite(endsAt) && Number.isFinite(now) && endsAt > now;
}

export function AuctionLoserPageContent({
  bid,
  recommendations,
}: {
  bid: BuyerBid;
  recommendations: Lot[];
}) {
  const serverNow = new Date().toISOString();
  const imageUrl = bid.imageUrl;
  const displayedRecommendations = recommendations
    .filter((lot) => isOngoingVickreyRecommendation(lot, serverNow))
    .slice(0, 3);

  return (
    <div className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 bg-[#fafafa] pb-8">
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#09111b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,145,156,0.18),transparent_28%),radial-gradient(circle_at_72%_22%,rgba(209,219,230,0.12),transparent_24%),linear-gradient(120deg,#09111b_0%,#111c28_48%,#0c1520_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,rgba(0,0,0,0.18)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.16))]" />

        <div className="container relative py-7 md:py-8 xl:py-10">
          <div className="grid min-h-[21rem] items-center gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(23rem,0.98fr)]">
            <div className="section-reveal relative z-10 max-w-[46rem] rounded-[2rem] border border-[#ff9aa2]/30 bg-[linear-gradient(145deg,rgba(17,27,39,0.92),rgba(12,18,28,0.86))] p-3 shadow-[0_34px_80px_-46px_rgba(0,0,0,0.72)]">
              <div className="relative overflow-hidden rounded-[calc(2rem-0.75rem)] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(20,31,44,0.9),rgba(10,16,24,0.88))] px-6 py-6 md:px-8 md:py-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_top,rgba(255,255,255,0.08),transparent_30%),linear-gradient(90deg,transparent,rgba(255,143,149,0.08),transparent)]" />
                <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="relative shrink-0">
                    <span className="absolute inset-2 rounded-full bg-[#ff9da3]/[0.22] blur-2xl" />
                    <div className="relative grid size-[6.2rem] place-items-center rounded-full border border-[#f4b8bd]/50 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_52%,rgba(0,0,0,0.12)_100%)] shadow-[0_0_0_1px_rgba(255,195,201,0.14),0_22px_46px_-34px_rgba(255,143,149,0.36)]">
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="h-[4.4rem] w-[4.4rem] object-contain"
                        height={1254}
                        priority
                        src={LOSER_X_ASSET}
                        unoptimized
                        width={1254}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#ffd3d7]/[0.72]">
                      Pengumuman hasil lelang
                    </p>
                    <h1 className="mt-3 font-headline text-[2.35rem] font-black leading-[1.02] tracking-[-0.055em] text-white md:text-[3rem]">
                      Terima kasih,
                      <span className="mt-2 block text-[#ffb7bc]">
                        Anda Belum Menang Lelang Ini
                      </span>
                    </h1>
                    <p className="mt-4 max-w-[34rem] text-base leading-8 text-white/[0.82]">
                      Tetap tenang dan terus ikuti sesi berikutnya.
                      <span className="font-semibold text-[#f9dee2]"> Kesempatan terbaik bisa datang di lelang berikutnya.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AuctionLoserHeroStage
              gavelSrc={LOSER_GAVEL_ASSET}
            />
          </div>
        </div>
      </section>

      <div className="container relative -mt-3 space-y-6 md:-mt-5 md:space-y-7">
        <section className="section-reveal rounded-[1.4rem] border border-[#e7e9e7] bg-white p-5 shadow-[0_20px_55px_-38px_rgba(16,24,40,0.28)] md:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(14rem,0.58fr)_minmax(0,1.1fr)_minmax(18rem,0.72fr)] lg:items-center">
            <div className="relative min-h-[13.5rem] overflow-hidden rounded-[1.15rem] bg-[#f8faf9]">
              <ProductImage imageUrl={imageUrl} title={bid.lot} />
            </div>

            <div className="min-w-0">
              <span className="inline-flex rounded-md bg-[#eaf7ef] px-3 py-1.5 text-[0.74rem] font-black uppercase tracking-[0.14em] text-[#006747]">
                Lelang Victory
              </span>
              <h2 className="mt-4 font-headline text-[1.55rem] font-black leading-[1.1] tracking-[-0.035em] text-[#101828] md:text-[1.8rem]">
                {bid.lot}
              </h2>

              <dl className="mt-5 grid gap-0 text-[0.95rem]">
                <div className="grid grid-cols-[minmax(8rem,0.48fr)_minmax(0,1fr)] items-center border-b border-dashed border-[#dde4df] py-3">
                  <dt className="font-semibold text-[#667085]">No. Transaksi</dt>
                  <dd className="font-black tracking-[-0.015em] text-[#101828]">
                    {bid.bidHash ? `BID-${bid.lotId.slice(0, 8).toUpperCase()}` : bid.lotId}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(8rem,0.48fr)_minmax(0,1fr)] items-center border-b border-dashed border-[#dde4df] py-3">
                  <dt className="font-semibold text-[#667085]">Unit</dt>
                  <dd className="font-black tracking-[-0.015em] text-[#101828]">{bid.unit}</dd>
                </div>
                <div className="grid grid-cols-[minmax(8rem,0.48fr)_minmax(0,1fr)] items-center py-3">
                  <dt className="inline-flex items-center gap-2 font-semibold text-[#667085]">
                    <CalendarIcon className="size-4" strokeWidth={1.75} />
                    Tanggal Lelang Selesai
                  </dt>
                  <dd className="font-black tracking-[-0.015em] text-[#101828]">
                    {bid.closingAt ? formatAppDateTime(bid.closingAt) : bid.closing}
                  </dd>
                </div>
              </dl>
            </div>

            <aside className="rounded-[1rem] border border-[#e9ece8] bg-[#f8faf9] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="text-[0.8rem] font-semibold text-[#667085]">Status Lelang</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-[0.9rem] bg-[#fff0f0] text-[#e02020] shadow-[0_12px_24px_-18px_rgba(224,32,32,0.5)]">
                  <FrownIcon className="size-6" strokeWidth={2.3} />
                </span>
                <div>
                  <p className="text-[1.5rem] font-black tracking-[-0.04em] text-[#e02020]">
                    Tidak Menang
                  </p>
                </div>
              </div>
              <div className="mt-5 h-px w-full bg-[#e1e5e2]" />
              <p className="mt-4 text-[0.95rem] font-medium leading-7 text-[#34423c]">
                Terus semangat, masih banyak lelang menarik lainnya.
              </p>
            </aside>
          </div>
        </section>

        <section className="rounded-[1.15rem] border border-[#f2dada] bg-[#fffafa] p-4 shadow-[0_12px_30px_-28px_rgba(224,32,32,0.2)]">
          <div className="flex items-center gap-5">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#fff0f0] text-[#e02020]">
              <PartyIcon className="size-8" strokeWidth={1.85} />
            </span>
            <div>
              <h2 className="text-[1.05rem] font-black tracking-[-0.02em] text-[#101828]">
                Informasi Pemenang
              </h2>
              <p className="mt-1 text-[0.95rem] leading-6 text-[#344054]">
                Pemenang lelang ini telah ditentukan dan akan dihubungi oleh pihak unit.
              </p>
              <p className="text-[0.95rem] leading-6 text-[#667085]">
                Terima kasih telah berpartisipasi.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-headline text-[1.25rem] font-black tracking-[-0.03em] text-[#101828]">
              Lelang Lainnya untuk Anda
            </h2>
            <div className="flex items-center gap-4">
              <Link
                className="group inline-flex items-center gap-2 text-sm font-black text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#004e2e]"
                href="/katalog"
              >
                Lihat Semua Lelang
                <ArrowRightIcon className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <div className="hidden items-center gap-2 md:flex">
                <span className="grid size-9 place-items-center rounded-full border border-[#eef1ee] bg-white text-[#8b9690] shadow-[0_10px_24px_-20px_rgba(16,24,40,0.24)]">
                  <ChevronLeftIcon className="size-4" />
                </span>
                <span className="grid size-9 place-items-center rounded-full border border-[#eef1ee] bg-white text-[#006747] shadow-[0_10px_24px_-20px_rgba(16,24,40,0.24)]">
                  <ChevronRightIcon className="size-4" />
                </span>
              </div>
            </div>
          </div>

          {displayedRecommendations.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {displayedRecommendations.map((lot) => (
                <RecommendationCard key={lot.id} lot={lot} serverNow={serverNow} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.15rem] border border-[#edf0eb] bg-white px-5 py-8 text-center shadow-[0_14px_34px_-30px_rgba(16,24,40,0.18)]">
              <InfoIcon className="mx-auto size-8 text-[#006747]" strokeWidth={1.8} />
              <p className="mt-3 font-black tracking-[-0.02em] text-[#101828]">
                Belum ada lelang yang sedang berlangsung saat ini.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Silakan cek kembali katalog saat admin unit membuka sesi lelang baru.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[1.15rem] border border-[#f2dada] bg-[#fffafa] p-4 shadow-[0_12px_30px_-28px_rgba(224,32,32,0.18)]">
          <div className="flex items-center gap-5">
            <span className="auction-loser-heart grid size-16 shrink-0 place-items-center rounded-full bg-[#fff0f0] text-[#e02020]">
              <HeartIcon className="size-8" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-[1.08rem] font-black tracking-[-0.025em] text-[#344054]">
                Jangan menyerah! Kesempatan besar berikutnya bisa jadi milik Anda.
              </h2>
              <p className="mt-1 text-[0.95rem] leading-6 text-[#667085]">
                Terus ikut dan menangkan lelang impian Anda!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
