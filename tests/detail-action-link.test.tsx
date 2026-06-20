import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailActionLink } from "@/components/shared/detail-action-link";

describe("DetailActionLink", () => {
  it("uses the shared outlined detail style with a green hover state", () => {
    render(<DetailActionLink href="/detail/demo" />);

    const link = screen.getByRole("link", { name: /lihat detail/i });

    expect(link).toHaveAttribute("href", "/detail/demo");
    expect(link).toHaveClass(
      "rounded-[0.95rem]",
      "border-[#d8e4de]",
      "bg-white",
      "text-[#075b3f]",
      "hover:border-[#006747]",
      "hover:bg-[#006747]",
      "hover:text-white"
    );
    expect(link.querySelector("svg")).toHaveClass("size-3.5", "group-hover:translate-x-0.5");
  });
});
