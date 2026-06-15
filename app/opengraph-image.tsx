/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

const FALLBACK_SITE_URL = "https://app.tugasprototype.cloud";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const HERO_IMAGE_PATH = "/uploads/Hero%20Section%20Katalog%20Buyer.png";

function resolvePublicSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.BETTER_AUTH_URL,
    FALLBACK_SITE_URL
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const parsedUrl = new URL(candidate);

      if (LOCAL_HOSTNAMES.has(parsedUrl.hostname)) {
        continue;
      }

      return parsedUrl.origin;
    } catch {
      continue;
    }
  }

  return FALLBACK_SITE_URL;
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.4" />
      <path d="M8.6 12.2L10.8 14.4L15.7 9.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg fill="none" height="42" viewBox="0 0 24 24" width="42" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 7V5.8C9 4.8 9.8 4 10.8 4H13.2C14.2 4 15 4.8 15 5.8V7" stroke="#006b4b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5.5 8.5H18.5V18C18.5 19.1 17.6 20 16.5 20H7.5C6.4 20 5.5 19.1 5.5 18V8.5Z" stroke="#006b4b" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5.7 12.2C7.6 13.3 9.8 13.9 12 13.9C14.2 13.9 16.4 13.3 18.3 12.2" stroke="#006b4b" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M12 12.6V15" stroke="#006b4b" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function GavelIcon() {
  return (
    <svg fill="none" height="42" viewBox="0 0 24 24" width="42" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 12.5L6.5 20.5C5.7 21.3 4.3 21.3 3.5 20.5C2.7 19.7 2.7 18.3 3.5 17.5L11.5 9.5" stroke="#9f6f00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
      <path d="M16 16L22 10" stroke="#9f6f00" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M8 8L14 2" stroke="#9f6f00" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M9 7L17 15" stroke="#9f6f00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
      <path d="M21 11L13 3" stroke="#9f6f00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
    </svg>
  );
}

function FeatureRow({ children, color }: { children: string; color: string }) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: "10px"
      }}
    >
      <CheckIcon color={color} />
      <div
        style={{
          color: "#42554d",
          fontSize: "17px",
          fontWeight: 700,
          lineHeight: 1.2
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModeCard({
  accent,
  children,
  description,
  icon,
  tint,
  title
}: {
  accent: string;
  children: ReactNode;
  description: string;
  icon: ReactNode;
  tint: string;
  title: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.74)",
        border: "1px solid rgba(8,69,50,0.12)",
        borderRadius: "24px",
        boxShadow: "0 24px 60px rgba(8,69,50,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minHeight: "320px",
        padding: "28px",
        position: "relative",
        width: "296px"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "14px"
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: tint,
            borderRadius: "999px",
            display: "flex",
            height: "70px",
            justifyContent: "center",
            width: "70px"
          }}
        >
          {icon}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div
            style={{
              color: "#005b3f",
              fontSize: "26px",
              fontWeight: 800,
              lineHeight: 1
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "#1f2d28",
              fontSize: "15px",
              lineHeight: 1.35
            }}
          >
            {description}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        {children}
      </div>
      <div
        style={{
          alignItems: "center",
          background: accent,
          borderRadius: "999px",
          display: "flex",
          height: "24px",
          justifyContent: "center",
          position: "absolute",
          right: "18px",
          top: "18px",
          width: "24px"
        }}
      >
        <svg fill="none" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 12.2L10.8 14.5L15.8 9.5" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      </div>
    </div>
  );
}

export const alt = "Pratinjau Prototipe Platform Lelang Barang Tugas Akhir";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

export default function OpenGraphImage() {
  const heroImageUrl = `${resolvePublicSiteUrl()}${HERO_IMAGE_PATH}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          color: "#005b3f",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%"
        }}
      >
        <img
          alt=""
          height={630}
          src={heroImageUrl}
          style={{
            height: "100%",
            inset: 0,
            objectFit: "cover",
            opacity: 0.96,
            position: "absolute",
            width: "100%"
          }}
          width={1200}
        />
        <div
          style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.82) 48%, rgba(255,255,255,0.68) 100%)",
            inset: 0,
            position: "absolute"
          }}
        />
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "28px",
            height: "100%",
            padding: "68px 50px 60px",
            position: "relative",
            width: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              width: "414px"
            }}
          >
            <div
              style={{
                color: "#b78300",
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "0.38em",
                textTransform: "uppercase"
              }}
            >
              Katalog Premium
            </div>
            <div
              style={{
                color: "#00623f",
                display: "flex",
                flexDirection: "column",
                fontSize: "52px",
                fontWeight: 800,
                letterSpacing: "0",
                lineHeight: 1.04
              }}
            >
              <div>Pilih cara pembelian</div>
              <div>yang tepat</div>
              <div>untuk Anda</div>
            </div>
            <div
              style={{
                color: "#4b5c55",
                display: "flex",
                flexDirection: "column",
                fontSize: "23px",
                lineHeight: 1.5
              }}
            >
              <div>Dua cara aman dan transparan</div>
              <div>untuk mendapatkan barang berkualitas</div>
              <div>dalam prototipe digital.</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px"
            }}
          >
            <ModeCard
              accent="#007a55"
              description="Beli sekarang dengan harga pasti."
              icon={<BriefcaseIcon />}
              tint="#dff3ea"
              title="Harga Tetap"
            >
              <FeatureRow color="#007a55">Pembayaran instan</FeatureRow>
              <FeatureRow color="#007a55">Harga pasti dan transparan</FeatureRow>
              <FeatureRow color="#007a55">Proses cepat dan aman</FeatureRow>
              <FeatureRow color="#007a55">Pembayaran aman terjamin</FeatureRow>
            </ModeCard>

            <ModeCard
              accent="#b78300"
              description="Penawaran tertutup, pemenang ditetapkan secara adil."
              icon={<GavelIcon />}
              tint="#fff0c7"
              title="Lelang Tertutup"
            >
              <FeatureRow color="#b78300">Penawaran tertutup</FeatureRow>
              <FeatureRow color="#b78300">Pemenang dengan harga terbaik</FeatureRow>
              <FeatureRow color="#b78300">Aturan jelas dan transparan</FeatureRow>
              <FeatureRow color="#b78300">Peluang menang lebih besar</FeatureRow>
            </ModeCard>
          </div>
        </div>
      </div>
    ),
    size
  );
}
