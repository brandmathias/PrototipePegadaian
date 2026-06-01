import type { ReactNode } from "react";

export default function CatalogTemplate({ children }: { children: ReactNode }) {
  return <div className="buyer-route-transition print:contents">{children}</div>;
}
