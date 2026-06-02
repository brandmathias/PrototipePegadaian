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
    status: "JAMINAN"
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

  it("does not render marketed or finished goods in the inventory table", () => {
    render(
      <AdminInventoryWorkspace
        items={[
          makeItem(1),
          { ...makeItem(2), id: "barang-failed", code: "BRG-FAILED", name: "Barang Gagal Lelang", status: "GAGAL" },
          { ...makeItem(2), id: "barang-marketed", code: "BRG-MARKET", name: "Barang Sudah Dipasarkan", status: "DIPASARKAN" },
          { ...makeItem(3), id: "barang-waiting", code: "BRG-WAIT", name: "Barang Menunggu Pembayaran", status: "MENUNGGU_PEMBAYARAN" },
          { ...makeItem(4), id: "barang-sold", code: "BRG-SOLD", name: "Barang Terjual", status: "TERJUAL" }
        ]}
      />
    );

    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.queryByText("BRG-FAILED")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-MARKET")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-WAIT")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-SOLD")).not.toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent?.replace(/\s+/g, " ").trim() === "Menampilkan 1 dari 1 barang.")).toBeInTheDocument();
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
    render(
      <AdminInventoryWorkspace
        items={[
          makeItem(1),
          makeItem(2),
          { ...makeItem(3), status: "GAGAL" },
          makeItem(4)
        ]}
      />
    );

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

  it("opens the timeline calendar popover with shortcut and calendar panels", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-calendar",
            barangId: "barang-calendar",
            barangCode: "BRG-CAL",
            barangName: "Ipad Terbaru",
            category: "elektronik",
            condition: "baik",
            description: "Tablet Apple iPad Pro 11-inch.",
            specifications: { jenis: "tablet", merek: "Apple" },
            ownerName: "Budi Santoso",
            customerNumber: "0812-3456-7890",
            actionKey: "input_baru",
            actionLabel: "Input Baru",
            actionTone: "default",
            note: "Barang masuk dari unit.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-31T01:12:33.000Z",
            createdAtLabel: "31 Mei 2026, 09:12:33 WIB"
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /linimasa/i }));

    expect(screen.getByText("Shortcut Periode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bulan sebelumnya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bulan berikutnya" })).toBeInTheDocument();
  });

  it("sorts history rows by process time from the header control", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-old",
            barangId: "barang-old",
            barangCode: "BRG-OLD",
            barangName: "Barang Lama",
            category: "elektronik",
            condition: "baik",
            description: "Riwayat lama.",
            specifications: { jenis: "tablet" },
            ownerName: "Budi Santoso",
            customerNumber: "0812-1111-1111",
            actionKey: "input_baru",
            actionLabel: "Input Baru",
            actionTone: "default",
            note: "Barang masuk lebih awal.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-25T01:00:00.000Z",
            createdAtLabel: "25 Mei 2026"
          },
          {
            id: "hist-new",
            barangId: "barang-new",
            barangCode: "BRG-NEW",
            barangName: "Barang Baru",
            category: "elektronik",
            condition: "baik",
            description: "Riwayat baru.",
            specifications: { jenis: "tablet" },
            ownerName: "Siti Rahmawati",
            customerNumber: "0812-2222-2222",
            actionKey: "dipasarkan",
            actionLabel: "Dipasarkan",
            actionTone: "success",
            note: "Barang dipasarkan belakangan.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-31T01:00:00.000Z",
            createdAtLabel: "31 Mei 2026"
          }
        ]}
      />
    );

    const oldRow = screen.getByText("Barang Lama");
    const newRow = screen.getByText("Barang Baru");
    expect(newRow.compareDocumentPosition(oldRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /urutkan waktu proses/i }));

    expect(oldRow.compareDocumentPosition(newRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("filters history by synced item categories", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-logam",
            barangId: "barang-logam",
            barangCode: "BRG-LGM",
            barangName: "Koin Antam",
            category: "logam_mulia",
            condition: "baik",
            description: "Barang logam mulia masuk ke unit.",
            specifications: { jenis: "emas batangan", berat: "10 gram" },
            ownerName: "Rizki",
            customerNumber: "9018",
            actionKey: "input_baru",
            actionLabel: "Input Baru",
            actionTone: "default",
            note: "Barang masuk dari unit.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-25T00:00:00.000Z",
            createdAtLabel: "25 Mei 2026"
          },
          {
            id: "hist-elektronik",
            barangId: "barang-elektronik",
            barangCode: "BRG-ELK",
            barangName: "Laptop Kerja",
            category: "elektronik",
            condition: "baik",
            description: "Barang elektronik dipasarkan.",
            specifications: { merek: "Lenovo", model: "ThinkPad" },
            ownerName: "Brando",
            customerNumber: "56789",
            actionKey: "dipasarkan",
            actionLabel: "Dipasarkan",
            actionTone: "success",
            note: "Barang masuk katalog.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-26T00:00:00.000Z",
            createdAtLabel: "26 Mei 2026"
          }
        ]}
      />
    );

    const categorySelect = screen.getByLabelText("Filter kategori riwayat barang");
    expect(screen.getByRole("option", { name: "Logam Mulia" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Elektronik" })).toBeInTheDocument();

    fireEvent.change(categorySelect, { target: { value: "elektronik" } });

    expect(screen.getByText("Laptop Kerja")).toBeInTheDocument();
    expect(screen.queryByText("Koin Antam")).not.toBeInTheDocument();
  });
});
