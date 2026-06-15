import { ImageResponse } from "next/og";

import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export const alt = `Logo ${BRAND_NAME}`;
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

function RuangAgunanMark({ size = 244 }: { size?: number }) {
  return (
    <svg fill="none" height={size} viewBox="0 0 128 128" width={size} xmlns="http://www.w3.org/2000/svg">
      <path d="M63.6 8.2L69.2 24.9L85.9 30.5L69.2 36.1L63.6 52.8L58 36.1L41.3 30.5L58 24.9L63.6 8.2Z" fill="#d49a21" />
      <path d="M22 47H49.4L57.1 37.2H70.8L78.6 47H106" stroke="#006747" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
      <path d="M51.2 47H76.8V59.2H68.9V97.8H59.1V59.2H51.2V47Z" fill="#006747" />
      <path d="M41.7 51.4L23.7 86.9M41.7 51.4L59.7 86.9M86.3 51.4L68.3 86.9M86.3 51.4L104.3 86.9" stroke="#006747" strokeLinecap="round" strokeWidth="4.6" />
      <path d="M18 87.2H64C62.1 97.5 53.6 104.8 41 104.8C28.4 104.8 19.9 97.5 18 87.2Z" fill="#006747" />
      <path d="M64 87.2H110C108.1 97.5 99.6 104.8 87 104.8C74.4 104.8 65.9 97.5 64 87.2Z" fill="#006747" />
      <path d="M19.8 87.2H62.2M65.8 87.2H108.2" stroke="#d49a21" strokeLinecap="round" strokeWidth="4.6" />
      <path d="M43.4 34.9H84.6" stroke="#006747" strokeLinecap="round" strokeWidth="6.6" />
      <path d="M47.5 114.2H80.5" stroke="#006747" strokeLinecap="round" strokeWidth="8" />
      <path d="M35.7 121H92.3" stroke="#006747" strokeLinecap="round" strokeWidth="6.6" />
      <path d="M50.5 112H77.5" stroke="#d49a21" strokeLinecap="round" strokeWidth="3.8" />
      <path d="M46.1 64.5L59.5 51.1L77.3 68.9L63.9 82.3L46.1 64.5Z" fill="#d49a21" stroke="#fff9ea" strokeLinejoin="round" strokeWidth="2.8" />
      <path d="M37 74.4L45.7 65.7L60.1 80.1L51.4 88.8L37 74.4Z" fill="#006747" stroke="#fff9ea" strokeLinejoin="round" strokeWidth="2.6" />
      <path d="M34.7 76.5L27.9 83.3" stroke="#006747" strokeLinecap="round" strokeWidth="5.4" />
      <path d="M80.3 65.5L86.9 58.9" stroke="#d49a21" strokeLinecap="round" strokeWidth="5.4" />
      <circle cx="22" cy="47" fill="#d49a21" r="5.5" stroke="#fff9ea" strokeWidth="2.4" />
      <circle cx="106" cy="47" fill="#d49a21" r="5.5" stroke="#fff9ea" strokeWidth="2.4" />
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          backgroundColor: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 13% 18%, rgba(212,154,33,0.16), transparent 28%), radial-gradient(circle at 88% 78%, rgba(0,103,71,0.13), transparent 30%)",
          color: "#06402b",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "100%"
        }}
      >
        <div
          style={{
            border: "1px solid rgba(0,103,71,0.10)",
            borderRadius: "44px",
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            height: "510px",
            justifyContent: "center",
            padding: "58px 72px",
            width: "1040px"
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "48px"
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#fffaf0",
                border: "1px solid rgba(212,154,33,0.26)",
                borderRadius: "42px",
                display: "flex",
                height: "284px",
                justifyContent: "center",
                width: "284px"
              }}
            >
              <RuangAgunanMark />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}
            >
              <div
                style={{
                  color: "#d49a21",
                  display: "flex",
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "0.34em",
                  textTransform: "uppercase"
                }}
              >
                Prototipe Tugas Akhir
              </div>
              <div
                style={{
                  color: "#06402b",
                  display: "flex",
                  flexDirection: "column",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "104px",
                  fontWeight: 700,
                  letterSpacing: "-0.055em",
                  lineHeight: 0.9
                }}
              >
                <div>Ruang</div>
                <div>Agunan</div>
              </div>
              <div
                style={{
                  color: "#4e6358",
                  display: "flex",
                  flexDirection: "column",
                  fontSize: "24px",
                  fontWeight: 600,
                  lineHeight: 1.32
                }}
              >
                <div>{BRAND_TAGLINE}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(90deg, transparent, rgba(212,154,33,0.48), transparent)",
              display: "flex",
              height: "2px",
              width: "100%"
            }}
          />
          <div
            style={{
              alignItems: "center",
              color: "#617568",
              display: "flex",
              fontSize: "21px",
              fontWeight: 700,
              justifyContent: "space-between"
            }}
          >
            <span>{BRAND_NAME}</span>
            <span>app.tugasprototype.cloud</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
