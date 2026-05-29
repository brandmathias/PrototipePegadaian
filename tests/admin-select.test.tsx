import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
});
