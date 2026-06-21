import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminSelect } from "@/components/admin/admin-select";

describe("AdminSelect", () => {
  it("renders the options menu through a portal so it is not clipped by parent overflow", () => {
    const onValueChange = vi.fn();

    render(
      <div style={{ overflow: "hidden", width: 120 }}>
        <AdminSelect
          ariaLabel="Baris per halaman"
          options={[
            { value: 10, label: "10" },
            { value: 50, label: "50" },
            { value: 100, label: "100" }
          ]}
          size="compact"
          value={10}
          onValueChange={onValueChange}
        />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: /10/i }));

    const listbox = screen.getByRole("listbox");
    expect(document.body).toContainElement(listbox);
    expect(within(listbox).getByRole("option", { name: "50" })).toBeInTheDocument();

    fireEvent.click(within(listbox).getByRole("option", { name: "50" }));
    expect(onValueChange).toHaveBeenCalledWith("50");
  });

  it("sizes the menu from the widest option so compact pagination labels stay fully visible", async () => {
    const onValueChange = vi.fn();
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
    const scrollBySpy = vi.spyOn(window, "scrollBy").mockImplementation(() => undefined);

    try {
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: function getBoundingClientRect() {
          if (this.classList.contains("admin-select-trigger")) {
            return {
              bottom: 40,
              height: 36,
              left: 24,
              right: 120,
              top: 4,
              width: 96,
              x: 24,
              y: 4,
              toJSON() {
                return {};
              }
            } as DOMRect;
          }

          return {
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON() {
              return {};
            }
          } as DOMRect;
        }
      });

      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get() {
          if (this.classList.contains("admin-select-option")) {
            return 128;
          }

          if (this.classList.contains("admin-select-menu")) {
            return 72;
          }

          return 0;
        }
      });

      render(
        <AdminSelect
          ariaLabel="Baris per halaman"
          className="min-w-[6.9rem]"
          options={[
            { value: 10, label: "10" },
            { value: 50, label: "50" },
            { value: 100, label: "100" }
          ]}
          size="compact"
          value={10}
          onValueChange={onValueChange}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /10/i }));

      const listbox = screen.getByRole("listbox");

      await waitFor(() => {
        expect(listbox).toHaveStyle({ width: "128px" });
      });

      expect(within(listbox).getByText("100")).toHaveClass("whitespace-nowrap");
      expect(within(listbox).getByText("100")).not.toHaveClass("truncate");
    } finally {
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: originalGetBoundingClientRect
      });

      if (originalScrollWidth) {
        Object.defineProperty(HTMLElement.prototype, "scrollWidth", originalScrollWidth);
      } else {
        delete (HTMLElement.prototype as { scrollWidth?: number }).scrollWidth;
      }

      scrollBySpy.mockRestore();
    }
  });

  it("anchors a forced dropup directly above the trigger using the rendered menu height", async () => {
    const onValueChange = vi.fn();
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    const originalScrollY = window.scrollY;

    try {
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: 480
      });

      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: function getBoundingClientRect() {
          if (this.classList.contains("admin-select-trigger")) {
            return {
              bottom: 736,
              height: 36,
              left: 820,
              right: 930,
              top: 700,
              width: 110,
              x: 820,
              y: 700,
              toJSON() {
                return {};
              }
            } as DOMRect;
          }

          return {
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON() {
              return {};
            }
          } as DOMRect;
        }
      });

      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        get() {
          return this.classList.contains("admin-select-menu") ? 132 : 0;
        }
      });

      render(
        <AdminSelect
          ariaLabel="Baris per halaman"
          options={[
            { value: 10, label: "10" },
            { value: 50, label: "50" },
            { value: 100, label: "100" }
          ]}
          placement="top"
          size="compact"
          value={10}
          onValueChange={onValueChange}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /10/i }));

      const listbox = screen.getByRole("listbox");
      await waitFor(() => {
        expect(listbox).toHaveAttribute("data-placement", "top");
        expect(listbox).toHaveStyle({ top: "562px" });
      });
    } finally {
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: originalScrollY
      });
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: originalGetBoundingClientRect
      });

      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      } else {
        delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
      }
    }
  });
});
