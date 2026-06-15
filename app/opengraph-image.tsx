/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

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
          alignItems: "stretch",
          background: "#0b3824",
          color: "#ffffff",
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
            position: "absolute",
            width: "100%"
          }}
          width={1200}
        />
        <div
          style={{
            background:
              "linear-gradient(90deg, rgba(6,35,23,0.90) 0%, rgba(8,48,31,0.72) 40%, rgba(8,48,31,0.28) 100%)",
            inset: 0,
            position: "absolute"
          }}
        />
        <div
          style={{
            background: "linear-gradient(180deg, rgba(255,214,102,0.18), transparent 38%)",
            inset: 0,
            position: "absolute"
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 48px",
            position: "relative"
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "18px"
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "rgba(255,255,255,0.96)",
                borderRadius: "26px",
                display: "flex",
                height: "78px",
                justifyContent: "center",
                width: "78px"
              }}
            >
              <svg fill="none" height="40" viewBox="0 0 512 512" width="40" xmlns="http://www.w3.org/2000/svg">
                <path d="M309.943 133.987L377.655 201.699" stroke="#0b4f2f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
                <path d="M268.286 175.645L336 243.36" stroke="#0b4f2f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
                <path d="M136.489 343.998L298.249 182.238L361.415 245.404L199.655 407.164H136.489V343.998Z" stroke="#0b4f2f" strokeLinejoin="round" strokeWidth="32" />
                <path d="M136.489 407.164H267.367" stroke="#0b4f2f" strokeLinecap="round" strokeWidth="32" />
              </svg>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div
                style={{
                  color: "#f5cf7c",
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase"
                }}
              >
                Tugas Prototype Cloud
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: "28px",
                  fontWeight: 700
                }}
              >
                Hero katalog buyer
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              maxWidth: "700px"
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: "72px",
                fontWeight: 800,
                letterSpacing: "0",
                lineHeight: 0.98
              }}
            >
              <div>Jelajahi katalog</div>
              <div>dengan preview yang</div>
              <div>lebih kuat saat dibagikan.</div>
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: "31px",
                lineHeight: 1.28,
                maxWidth: "640px"
              }}
            >
              Menggunakan hero section katalog sebagai gambar utama untuk link share.
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "16px"
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "rgba(255,255,255,0.94)",
                borderRadius: "999px",
                color: "#0b4f2f",
                display: "flex",
                fontSize: "26px",
                fontWeight: 800,
                padding: "15px 24px"
              }}
            >
              app.tugasprototype.cloud
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.74)",
                fontSize: "24px",
                fontWeight: 600
              }}
            >
              Preview hero katalog untuk kartu share
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
