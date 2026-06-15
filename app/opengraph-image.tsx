import { ImageResponse } from "next/og";

export const alt = "Pratinjau Prototipe Platform Lelang Barang Tugas Akhir";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #f7f2e8 0%, #fdfbf7 42%, #e7f2ea 100%)",
          color: "#143b2a",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px",
          position: "relative",
          width: "100%"
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at top right, rgba(212,175,55,0.22), transparent 30%)",
            inset: 0,
            position: "absolute"
          }}
        />
        <div style={{ alignItems: "center", display: "flex", gap: "20px", position: "relative" }}>
          <div
            style={{
              alignItems: "center",
              background: "#004A23",
              borderRadius: "999px",
              display: "flex",
              height: "72px",
              justifyContent: "center",
              width: "72px"
            }}
          >
            <svg fill="none" height="38" viewBox="0 0 512 512" width="38" xmlns="http://www.w3.org/2000/svg">
              <path d="M309.943 133.987L377.655 201.699" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
              <path d="M268.286 175.645L336 243.36" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
              <path d="M136.489 343.998L298.249 182.238L361.415 245.404L199.655 407.164H136.489V343.998Z" stroke="white" strokeLinejoin="round" strokeWidth="32" />
              <path d="M136.489 407.164H267.367" stroke="white" strokeLinecap="round" strokeWidth="32" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ color: "#9b6f22", fontSize: "24px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Tugas Prototype Cloud
            </div>
            <div style={{ fontSize: "30px", fontWeight: 700 }}>
              Prototipe Platform Lelang Barang
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "920px", position: "relative" }}>
          <div style={{ fontSize: "68px", fontWeight: 800, lineHeight: 1.02 }}>
            Katalog, wishlist, dan simulasi transaksi digital dalam satu pengalaman web.
          </div>
          <div style={{ color: "#426357", fontSize: "30px", lineHeight: 1.4 }}>
            Dibuat sebagai prototipe tugas akhir untuk mengeksplorasi alur harga tetap, penawaran tertutup,
            dan detail barang yang lebih mudah dipahami saat dibagikan.
          </div>
        </div>

        <div style={{ alignItems: "center", display: "flex", gap: "16px", position: "relative" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(20,59,42,0.12)",
              borderRadius: "999px",
              color: "#004A23",
              display: "flex",
              fontSize: "24px",
              fontWeight: 700,
              padding: "14px 24px"
            }}
          >
            app.tugasprototype.cloud
          </div>
          <div style={{ color: "#6b7f76", fontSize: "24px" }}>
            Preview halaman publik dan pengalaman katalog
          </div>
        </div>
      </div>
    ),
    size
  );
}
