import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RekeningForm } from "@/components/superadmin/rekening-form";

const router = {
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

describe("RekeningForm", () => {
  it("uses the shared bank dropdown options for superadmin unit accounts", () => {
    render(<RekeningForm showTitle={false} unitId="unit-1" />);

    fireEvent.click(screen.getByRole("button", { name: /pilih bank/i }));

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "Bank Central Asia (BCA)" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Mandiri" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Rakyat Indonesia (BRI)" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Negara Indonesia (BNI)" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Syariah Indonesia (BSI)" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank CIMB Niaga" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Permata" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Danamon" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Tabungan Negara (BTN)" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Bank Mega" })).toBeInTheDocument();

    fireEvent.click(within(listbox).getByRole("option", { name: "Bank Mandiri" }));
    expect(screen.getByRole("button", { name: /bank mandiri/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama bank/i)).toHaveValue("Mandiri");
  });
});
