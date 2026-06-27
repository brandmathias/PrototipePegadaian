"use client";

import { usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-transition">
      {children}
    </div>
  );
}

export function GlobalScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const selectors = [
      "section",
      "article",
      ".dashboard-card",
      ".stats-grid > div",
      ".chart-container",
      ".admin-hero"
    ];

    const elements = document.querySelectorAll(selectors.join(", "));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    elements.forEach((el) => {
      if (!el.classList.contains("scroll-reveal")) {
        el.classList.add("scroll-reveal");
      }
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
