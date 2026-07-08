import type { ReactNode } from "react";
import { BriefcaseBusiness, CheckCircle2, Gavel } from "lucide-react";

import { cn } from "@/lib/utils";

const HERO_BACKGROUND_WEBP = "/assets/catalog-hero-buyer.webp";
const HERO_BACKGROUND_FALLBACK = "/assets/catalog-hero-buyer.png";

function HeroInfoCard({
  icon,
  items,
  title,
  tone = "green"
}: {
  icon: ReactNode;
  items: string[];
  title: string;
  tone?: "green" | "gold";
}) {
  return (
    <div className="relative flex h-full flex-col rounded-[1.1rem] border border-black/8 bg-white/86 p-5 shadow-[0_24px_64px_-50px_rgba(9,55,41,0.48)]">
      <span
        className={cn(
          "absolute right-5 top-5 grid size-5 place-items-center rounded-full border",
          tone === "gold"
            ? "border-black/16 bg-white text-transparent"
            : "border-[#075f42] bg-[#075f42] text-white"
        )}
      >
        {tone === "green" ? <CheckCircle2 className="size-3.5" /> : null}
      </span>
      <div className="flex min-h-[4.25rem] items-start gap-4 pr-8">
        <span
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full",
            tone === "gold" ? "bg-[#fff2ca] text-[#a36d00]" : "bg-[#e8f5ee] text-[#075f42]"
          )}
        >
          {icon}
        </span>
        <div>
          <h2 className="font-headline text-xl font-black text-[#075f42]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-black/58">
            {tone === "gold"
              ? "Penawaran tertutup, pemenang ditetapkan secara adil."
              : "Beli sekarang dengan harga pasti."}
          </p>
        </div>
      </div>
      <div className="mt-5 grid flex-1 content-start gap-3">
        {items.map((item) => (
          <p className="flex min-h-5 items-center gap-2 text-xs font-medium text-[#34433c]" key={item}>
            <CheckCircle2 className={cn("size-3.5", tone === "gold" ? "text-[#a36d00]" : "text-[#075f42]")} />
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

export function CatalogHero() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-20 hidden w-[54%] md:block">
        <picture>
          <source srcSet={HERO_BACKGROUND_WEBP} type="image/webp" />
          <img
            alt=""
            className="h-full w-full object-cover object-center"
            data-testid="catalog-hero-image"
            decoding="async"
            fetchPriority="high"
            loading="eager"
            src={HERO_BACKGROUND_FALLBACK}
          />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.16)_14%,rgba(255,255,255,0.54)_44%,rgba(255,255,255,0.88)_100%)]" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.76)_42%,rgba(255,255,255,0.50)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.94)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-14 rounded-t-[2.4rem] border-t border-black/6 bg-white" />
      <div className="container grid gap-8 pb-20 pt-12 lg:grid-cols-[0.82fr_1fr] lg:items-center lg:pb-24 lg:pt-16">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#b98200]">
            Katalog Ruang Agunan
          </p>
          <h1 className="mt-4 max-w-4xl font-headline text-4xl font-black leading-[1.03] text-[#075f42] md:text-5xl lg:text-[2.85rem]">
            Pilih cara pembelian yang tepat untuk Anda
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#2f4038]">
            Dua cara aman dan transparan untuk mendapatkan barang berkualitas melalui alur
            prototipe yang mudah dipahami.
          </p>
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2">
          <HeroInfoCard
            icon={<BriefcaseBusiness className="size-7" />}
            items={[
              "Pembayaran instan",
              "Harga pasti & transparan",
              "Proses cepat & aman",
              "Pembayaran aman terjamin"
            ]}
            title="Harga Tetap"
          />
          <HeroInfoCard
            icon={<Gavel className="size-7" />}
            items={[
              "Penawaran tertutup (sealed-bid)",
              "Pemenang dengan harga terbaik",
              "Aturan jelas & transparan",
              "Peluang menang lebih besar"
            ]}
            title="Lelang Tertutup"
            tone="gold"
          />
        </div>
      </div>
    </section>
  );
}
