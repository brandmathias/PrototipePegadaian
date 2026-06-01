import type { ReactNode } from "react";

export default function UserTemplate({ children }: { children: ReactNode }) {
  return <div className="buyer-route-transition print:contents">{children}</div>;
}
