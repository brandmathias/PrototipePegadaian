"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Handshake,
  HelpCircle,
  Search
} from "lucide-react";

import { cn } from "@/lib/utils";

const faqItems = [
  {
    question: "Kenapa fitur penawaran (bidding) saya terkunci dan bagaimana memulihkannya?",
    answer:
      "Fitur penawaran dapat terkunci karena dua kondisi: masih ada bid aktif pada Lelang Tertutup lain, atau akun sedang berada dalam masa pembatasan akibat pelanggaran pembayaran. Jika penyebabnya bid aktif, tunggu hasil lelang tersebut; setelah kalah, Anda dapat mengikuti lelang lain. Jika Anda menang, selesaikan pembayaran sampai diverifikasi admin unit. Jika penyebabnya pembatasan akun, fitur akan aktif otomatis setelah hitung mundur di halaman Pelanggaran selesai."
  },
  {
    question: "Bagaimana mekanisme Lelang Tertutup dari awal sampai akhir?",
    answer:
      "Pilih barang berlabel Lelang Tertutup, baca detail barang, media, harga dasar, unit pelaksana, dan batas akhir lelang. Kirim nominal bid minimal sama dengan harga dasar. Selama lelang berjalan, bid disimpan tertutup dan tidak terlihat oleh peserta lain. Setelah deadline, sistem membuka escrow untuk menghitung hasil: bid tertinggi menjadi pemenang, sedangkan harga akhir mengikuti penawaran tertinggi kedua; jika hanya ada satu penawar, pembayaran mengikuti harga dasar. Pemenang wajib menyelesaikan pembayaran langsung di unit maksimal 24 jam, lalu admin unit memverifikasi pembayaran sebelum proses serah terima barang selesai."
  },
  {
    question: "Apakah saya boleh mengikuti lebih dari satu Lelang Tertutup sekaligus?",
    answer:
      "Tidak untuk bid aktif. Sistem membatasi satu bid aktif agar tidak terjadi bentrok kewajiban pembayaran. Jika Anda kalah pada lelang tersebut, kunci dilepas dan Anda dapat mengikuti lelang lain. Jika Anda menang, kunci tetap berjalan sampai pembayaran diselesaikan dan diverifikasi admin unit. Jika pemenang tidak membayar dalam 24 jam, transaksi dapat gagal dan akun menerima pelanggaran."
  },
  {
    question: "Bagaimana alur pembelian barang Harga Tetap?",
    answer:
      "Pilih barang berlabel Harga Tetap, lanjutkan ke pembayaran, transfer sesuai nominal ke rekening unit yang tertera, lalu unggah bukti pembayaran dan nomor referensi jika tersedia. Transaksi dicatat setelah bukti terkirim dan menunggu verifikasi admin unit. Setelah admin memverifikasi pembayaran, status transaksi berubah menjadi lunas atau siap dilanjutkan ke proses serah terima sesuai arahan unit."
  },
  {
    question: "Apakah saya tetap bisa mengambil fisik barang yang sudah saya lunasi?",
    answer:
      "Bisa. Pembatasan akun tidak membatalkan transaksi yang sudah lunas atau selesai. Anda tetap dapat melihat riwayat transaksi, mengunduh bukti transaksi lama, dan melanjutkan proses serah terima fisik barang sesuai arahan unit pelaksana terkait."
  },
  {
    question: "Akun saya dibatasi Level 2, apakah saya masih bisa membeli barang Harga Tetap?",
    answer:
      "Tidak. Pada Level 2, sistem membatasi transaksi baru, termasuk Lelang Tertutup dan pembelian Harga Tetap. Pada Level 1, pembelian Harga Tetap masih dapat tersedia, tetapi fitur Lelang Tertutup dan beberapa penyelesaian transaksi tetap mengikuti status pembatasan yang aktif."
  },
  {
    question: "Berapa lama masa pembatasan fitur bidding berlangsung?",
    answer:
      "Durasi mengikuti level akumulasi pelanggaran pembayaran. Aturan sistem saat ini menetapkan Level 1 selama 7 hari, Level 2 selama 30 hari, dan Level 3 selama 365 hari dengan evaluasi manual. Tanggal pemulihan otomatis ditampilkan pada halaman Pelanggaran akun Anda."
  },
  {
    question: "Bagaimana cara mengetahui level sanksi pada akun saya?",
    answer:
      "Buka menu Pelanggaran. Halaman tersebut menampilkan level pembatasan aktif, waktu pemulihan, fitur yang sedang dibatasi, fitur yang tetap tersedia, serta riwayat pelanggaran pembayaran yang dihitung sebagai akumulasi level sanksi."
  },
  {
    question: "Apa saja disclaimer penting sebelum mengikuti lelang atau membeli Harga Tetap?",
    answer:
      "Pastikan detail barang, foto, deskripsi, unit pelaksana, harga dasar atau harga tetap, rekening tujuan, dan batas waktu pembayaran sudah sesuai sebelum mengirim bid atau bukti bayar. Penawaran Lelang Tertutup bersifat final setelah dikirim. Pembayaran harus dilakukan ke rekening unit yang ditampilkan sistem. Simpan bukti pembayaran untuk verifikasi. Jika ada perbedaan status, hubungi admin unit terkait dengan nomor transaksi dan bukti pendukung."
  }
];

function HelpOrnament() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[29%] overflow-hidden md:block">
      <div className="absolute -right-24 top-[-4.5rem] h-72 w-72 rounded-full border border-amber-400/55" />
      <div className="absolute -right-12 top-16 h-80 w-80 rounded-full border border-emerald-900/10" />
      <div className="absolute bottom-0 right-0 h-28 w-64 skew-x-[-22deg] bg-emerald-100/42" />
      <div className="absolute bottom-0 right-16 h-40 w-px rotate-[38deg] bg-emerald-900/10" />
    </div>
  );
}

export function BuyerHelpCenterPage() {
  const [openIndex, setOpenIndex] = useState(0);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) {
      return faqItems.map((item, index) => ({ ...item, index }));
    }

    return faqItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) => {
        const haystack = `${item.question} ${item.answer}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [normalizedQuery]);

  return (
    <div className="full-bleed-safe -my-8 min-h-[calc(100dvh-4rem)] bg-white py-5 md:-my-10 md:py-6">
      <div className="container space-y-4 md:space-y-5">
        <section className="relative overflow-hidden rounded-[1.45rem] border border-black/5 bg-white p-6 shadow-[0_20px_64px_-54px_rgba(10,31,25,0.35)] md:p-8">
          <HelpOrnament />
          <div className="relative z-[1] grid gap-6 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="mx-auto grid size-28 place-items-center rounded-full border border-emerald-900/10 bg-emerald-50/60 text-primary shadow-[inset_0_1px_8px_rgba(0,74,35,0.08)] md:size-32">
              <Image
                alt="Ilustrasi pusat bantuan Ruang Agunan"
                className="size-24 object-contain drop-shadow-[0_18px_24px_rgba(0,74,35,0.18)] md:size-28"
                height={512}
                priority
                sizes="(min-width: 768px) 7rem, 6rem"
                src="/brand/buyer-help-headset.png"
                width={512}
              />
            </div>

            <div className="max-w-5xl space-y-4">
              <div>
                <h1 className="font-headline text-3xl font-black leading-tight tracking-tight text-[#101923] md:text-5xl">
                  Pusat Bantuan Ruang Agunan
                </h1>
                <p className="mt-2 text-sm leading-7 text-[#24365f] md:text-base">
                  Temukan jawaban, panduan, dan informasi penting untuk pengalaman lelang yang aman dan lancar.
                </p>
              </div>

              <label className="relative block max-w-4xl" htmlFor="buyer-help-search">
                <span className="sr-only">Cari solusi pusat bantuan</span>
                <Search className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-[#101923]" />
                <input
                  className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-14 pr-5 text-base font-medium text-[#24365f] shadow-[0_12px_34px_-28px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.92)] outline-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#697796] focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                  id="buyer-help-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari solusi, panduan lelang, atau aturan pembatasan..."
                  type="search"
                  value={query}
                />
              </label>
            </div>
          </div>
        </section>

        <section aria-label="Pertanyaan umum pusat bantuan" className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item) => {
              const expanded = openIndex === item.index;

              return (
                <article
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    expanded
                      ? "border-[#d6eadf] border-t-amber-400 shadow-[0_20px_52px_-46px_rgba(0,74,35,0.42)]"
                      : "border-black/5 shadow-[0_12px_32px_-30px_rgba(15,23,42,0.32)]"
                  )}
                  data-help-card={expanded ? "active" : "idle"}
                  key={item.question}
                >
                  {expanded ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-2 bg-primary"
                      data-help-rail="active"
                    />
                  ) : null}
                  <button
                    aria-expanded={expanded}
                    className={cn(
                      "relative z-[1] flex w-full items-center justify-between gap-4 text-left transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      expanded ? "px-5 pb-3 pt-4 md:px-7 md:pt-5" : "px-5 py-3 md:px-7"
                    )}
                    onClick={() => setOpenIndex(expanded ? -1 : item.index)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full",
                          expanded
                            ? "bg-[radial-gradient(circle_at_36%_30%,#0c8b57_0%,#004a23_68%)] text-white shadow-[0_14px_22px_-14px_rgba(0,74,35,0.8)]"
                            : "border border-emerald-900/8 bg-emerald-50/70 text-[#101923]"
                        )}
                      >
                        <HelpCircle className="size-5" />
                      </span>
                      <span className="font-headline text-base font-black leading-snug text-[#111827] md:text-lg">
                        {item.question}
                      </span>
                    </span>
                    <span className="grid size-8 shrink-0 place-items-center text-amber-500">
                      <ChevronDown
                        className={cn(
                          "size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                          expanded ? "rotate-180" : "rotate-0"
                        )}
                      />
                    </span>
                  </button>

                  <div
                    aria-hidden={!expanded}
                    className={cn(
                      "relative z-[1] grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                      expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p
                        className={cn(
                          "max-w-5xl px-5 pb-6 pt-1 text-sm font-medium leading-7 text-[#24365f] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:px-7 md:pl-14 md:text-base",
                          expanded ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                        )}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
              <HelpCircle className="mx-auto size-10 text-primary" />
              <p className="mt-3 font-headline text-lg font-black text-[#101923]">Tidak ada hasil bantuan</p>
              <p className="mt-1 text-sm leading-6 text-[#506079]">
                Coba kata kunci lain seperti pembayaran, Level 2, bidding, atau transaksi.
              </p>
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-[1rem] bg-[#004a23] px-6 py-5 text-white shadow-[0_24px_54px_-42px_rgba(0,74,35,0.66)]">
          <div aria-hidden="true" className="absolute right-0 top-0 h-full w-1/3 opacity-20">
            <div className="absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:14px_14px]" />
            <div className="absolute bottom-[-2rem] right-24 h-32 w-32 rotate-45 border border-white/25" />
            <div className="absolute bottom-5 right-52 h-24 w-24 rotate-45 border border-white/15" />
          </div>
          <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-5">
              <Handshake className="size-14 shrink-0 stroke-[1.7] text-amber-400" />
              <div className="hidden h-14 w-px bg-white/28 sm:block" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-black">Masih butuh konfirmasi lanjutan?</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-emerald-50">
                Siapkan bukti pembayaran, nomor transaksi, dan hubungi admin unit terkait untuk pengecekan manual.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
