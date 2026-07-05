import type { ReactNode } from "react";
import { preload } from "react-dom";

export default function CatalogTemplate({ children }: { children: ReactNode }) {
  preload("/uploads/Hero%20Section%20Katalog%20Buyer.avif", {
    as: "image",
    fetchPriority: "high",
    media: "(min-width: 768px)",
    type: "image/avif"
  });

  return <div className="buyer-route-transition print:contents">{children}</div>;
}
