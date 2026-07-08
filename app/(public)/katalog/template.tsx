import type { ReactNode } from "react";
import { preload } from "react-dom";

export default function CatalogTemplate({ children }: { children: ReactNode }) {
  preload("/assets/catalog-hero-buyer.webp", {
    as: "image",
    fetchPriority: "high",
    media: "(min-width: 768px)",
    type: "image/webp"
  });

  return <div className="buyer-route-transition print:contents">{children}</div>;
}
