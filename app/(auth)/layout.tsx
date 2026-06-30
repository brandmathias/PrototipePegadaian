import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-responsive-shell min-h-dvh bg-[#04150d]">
      {children}
    </div>
  );
}
