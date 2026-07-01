import Image from "next/image";

import { cn } from "@/lib/utils";

type BankLogoAsset = {
  code: string;
  height: number;
  label: string;
  patterns: string[];
  src: string;
  width: number;
};

const BANK_LOGO_ASSETS: BankLogoAsset[] = [
  {
    code: "BNI",
    height: 69,
    label: "BNI",
    patterns: ["bni", "negara indonesia"],
    src: "/uploads/bank-logos/bni.png",
    width: 240
  },
  {
    code: "BCA",
    height: 73,
    label: "BCA",
    patterns: ["bca", "central asia"],
    src: "/uploads/bank-logos/bca.png",
    width: 240
  },
  {
    code: "BRI",
    height: 91,
    label: "BRI",
    patterns: ["bri", "rakyat indonesia"],
    src: "/uploads/bank-logos/bri.png",
    width: 240
  },
  {
    code: "Mandiri",
    height: 70,
    label: "Bank Mandiri",
    patterns: ["mandiri"],
    src: "/uploads/bank-logos/mandiri.png",
    width: 240
  },
  {
    code: "BSI",
    height: 120,
    label: "Bank Syariah Indonesia",
    patterns: ["bsi", "syariah"],
    src: "/uploads/bank-logos/bsi.png",
    width: 137
  },
  {
    code: "CIMB",
    height: 35,
    label: "CIMB Niaga",
    patterns: ["cimb"],
    src: "/uploads/bank-logos/cimb-niaga.png",
    width: 240
  },
  {
    code: "Permata",
    height: 59,
    label: "Bank Permata",
    patterns: ["permata"],
    src: "/uploads/bank-logos/permata.png",
    width: 240
  },
  {
    code: "Danamon",
    height: 60,
    label: "Bank Danamon",
    patterns: ["danamon"],
    src: "/uploads/bank-logos/danamon.png",
    width: 240
  },
  {
    code: "BTN",
    height: 50,
    label: "BTN",
    patterns: ["btn", "tabungan negara"],
    src: "/uploads/bank-logos/btn.png",
    width: 240
  },
  {
    code: "Mega",
    height: 120,
    label: "Bank Mega",
    patterns: ["mega"],
    src: "/uploads/bank-logos/mega.png",
    width: 211
  },
  {
    code: "Maybank",
    height: 120,
    label: "Maybank",
    patterns: ["maybank"],
    src: "/uploads/bank-logos/maybank.png",
    width: 216
  },
  {
    code: "Muamalat",
    height: 72,
    label: "Bank Muamalat",
    patterns: ["muamalat"],
    src: "/uploads/bank-logos/muamalat.png",
    width: 240
  }
];

export function getBankLogoAsset(bankName: string) {
  const normalized = bankName.toLowerCase();

  return BANK_LOGO_ASSETS.find((asset) => asset.patterns.some((pattern) => normalized.includes(pattern)));
}

export function getBankDisplayName(bankName: string) {
  return getBankLogoAsset(bankName)?.code ?? bankName;
}

export function BankLogoMark({
  bankName,
  className,
  fallbackClassName,
  imageClassName,
  loading = "eager",
  sizes = "44px"
}: {
  bankName: string;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  sizes?: string;
}) {
  const asset = getBankLogoAsset(bankName);
  const label = (asset?.label ?? bankName) || "Bank";

  return (
    <span
      aria-label={asset ? undefined : `Logo ${label}`}
      className={cn("flex h-9 w-11 shrink-0 items-center justify-center rounded-[0.45rem] bg-white", className)}
      role={asset ? undefined : "img"}
    >
      {asset ? (
        <Image
          alt={`Logo ${label}`}
          className={cn("h-auto max-h-7 w-auto max-w-[2.65rem] object-contain", imageClassName)}
          height={asset.height}
          loading={loading}
          sizes={sizes}
          src={asset.src}
          width={asset.width}
        />
      ) : (
        <span className={cn("text-[0.55rem] font-black uppercase tracking-[0.08em] text-primary", fallbackClassName)}>
          Bank
        </span>
      )}
    </span>
  );
}
