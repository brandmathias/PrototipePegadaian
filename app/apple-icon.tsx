import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180
};

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#004A23",
          borderRadius: "40px",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <svg fill="none" height="96" viewBox="0 0 512 512" width="96" xmlns="http://www.w3.org/2000/svg">
          <path d="M309.943 133.987L377.655 201.699" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          <path d="M268.286 175.645L336 243.36" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          <path d="M136.489 343.998L298.249 182.238L361.415 245.404L199.655 407.164H136.489V343.998Z" stroke="white" strokeLinejoin="round" strokeWidth="32" />
          <path d="M136.489 407.164H267.367" stroke="white" strokeLinecap="round" strokeWidth="32" />
        </svg>
      </div>
    ),
    size
  );
}
