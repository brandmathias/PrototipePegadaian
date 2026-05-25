import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  AdminInventoryHistoryWorkspace,
  AdminInventoryWorkspace
} from "@/components/admin/admin-inventory-workspace";

function expectPaginationCopy(text: string) {
  expect(
    screen.getByText((_, node) => {
      const normalized = node?.textContent?.replace(/\s+/g, " ").trim().toLowerCase();

      return node?.tagName.toLowerCase() === "p" && normalized === text.toLowerCase();
    })
  ).toBeInTheDocument();
}

function makeItem(index: number) {
  return {
    id: `barang-${index}`,
    code: `BRG-${String(index).padStart(3, "0")}`,
    name: `Barang Demo ${index}`,
    category: index % 2 === 0 ? "emas" : "kendaraan",
    condition: "baik",
    ownerName: `Nasabah ${index}`,
    customerNumber: `NSB-${String(index).padStart(4, "0")}`,
    pawnedAt: "2026-05-01",
    dueDate: "2026-06-01",
    appraisalValue: 10_000_000 + index,
    status: index % 3 === 0 ? "GAGAL" : "JAMINAN"
  };
}

describe("AdminInventoryWorkspace", () => {
  it("keeps process status out of the inventory table", () => {
    render(<AdminInventoryWorkspace items={Array.from({ length: 3 }, (_, index) => makeItem(index + 1))} />);

    expect(screen.queryByText("Semua Status")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /status/i })).not.toBeInTheDocument();
    expect(screen.queryByText("JAMINAN")).not.toBeInTheDocument();
    expect(screen.queryByText("GAGAL")).not.toBeInTheDocument();
    expect(screen.queryByText(/pencarian langsung/i)).not.toBeInTheDocument();
  });

  it("paginates inventory rows without rendering every item at once", () => {
    render(<AdminInventoryWorkspace items={Array.from({ length: 11 }, (_, index) => makeItem(index + 1))} />);

    expectPaginationCopy("Menampilkan 1 sampai 10 dari 11 barang");
    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.queryByText("BRG-011")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expectPaginationCopy("Menampilkan 11 sampai 11 dari 11 barang");
    expect(screen.getByText("BRG-011")).toBeInTheDocument();
  });

  it("filters inventory by ready-for-marketing items", () => {
    render(<AdminInventoryWorkspace items={Array.from({ length: 4 }, (_, index) => makeItem(index + 1))} />);

    fireEvent.click(screen.getByRole("button", { name: /siap dipasarkan/i }));

    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.queryByText("BRG-003")).not.toBeInTheDocument();
  });
});

describe("AdminInventoryHistoryWorkspace", () => {
  it("filters history by operational process", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-1",
            barangId: "barang-1",
            barangCode: "BRG-001",
            barangName: "Motor Racing",
            ownerName: "Rizki",
            customerNumber: "9018",
            actionKey: "input_baru",
            actionLabel: "Input Baru",
            actionTone: "default",
            note: "Barang masuk dari unit.",
            actorName: "Admin Unit",
            createdAt: "2026-05-25T00:00:00.000Z",
            createdAtLabel: "25 Mei 2026"
          },
          {
            id: "hist-2",
            barangId: "barang-2",
            barangCode: "BRG-002",
            barangName: "Kalung Emas",
            ownerName: "Brando",
            customerNumber: "56789",
            actionKey: "ditebus",
            actionLabel: "Ditebus",
            actionTone: "warning",
            note: "Nasabah menebus barang.",
            actorName: "Admin Unit",
            createdAt: "2026-05-26T00:00:00.000Z",
            createdAtLabel: "26 Mei 2026"
          }
        ]}
      />
    );

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "ditebus" } });

    expect(screen.getByText("Kalung Emas")).toBeInTheDocument();
    expect(screen.queryByText("Motor Racing")).not.toBeInTheDocument();
  });
});
