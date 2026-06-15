import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180
};

function Mark() {
  return (
    <svg fill="none" height="138" viewBox="0 0 128 128" width="138" xmlns="http://www.w3.org/2000/svg">
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

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fffaf0",
          borderRadius: "36px",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <Mark />
      </div>
    ),
    size
  );
}
