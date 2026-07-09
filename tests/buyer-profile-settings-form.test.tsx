import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BuyerProfileSettingsForm } from "@/components/buyer/profile-settings-form";

const router = {
  refresh: vi.fn()
};

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

describe("BuyerProfileSettingsForm", () => {
  beforeEach(() => {
    router.refresh.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { name: "Buyer Baru" } })
      })
    );
  });

  it("only lets buyer change username while keeping violation identity fields locked", async () => {
    const user = userEvent.setup();

    render(
      <BuyerProfileSettingsForm
        email="buyer.lama@example.com"
        hasRestriction={false}
        initialImage={null}
        initialName="Buyer Demo"
        initialNationalId="7371123052600002"
        initialPhone="6281234567890"
        memberSince="13 Juni 2026"
        restrictionLabel="Aktif"
      />
    );

    await user.click(screen.getByRole("button", { name: /edit profil/i }));

    const usernameInput = screen.getByLabelText(/^username$/i, { selector: "input" });
    const emailInput = screen.getByLabelText(/^email$/i, { selector: "input" });
    const phoneInput = screen.getByLabelText(/nomor telepon/i, { selector: "input" });
    const nationalIdInput = screen.getByLabelText(/nomor ktp/i, { selector: "input" });

    expect(usernameInput).not.toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(phoneInput).toBeDisabled();
    expect(nationalIdInput).toBeDisabled();

    await user.clear(usernameInput);
    await user.type(usernameInput, "Buyer Baru");
    await user.click(screen.getByRole("button", { name: /simpan perubahan/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/user/profil",
        expect.objectContaining({
          method: "PUT",
          body: expect.any(String)
        })
      );
    });

    const [, requestInit] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(requestInit?.body))).toEqual({ name: "Buyer Baru" });
    expect(router.refresh).toHaveBeenCalled();
  });
});
