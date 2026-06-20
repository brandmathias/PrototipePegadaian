import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SuperAdminAccountDetailWorkspace,
  SuperAdminAccountWorkspace
} from "@/components/superadmin/superadmin-account-workspace";
import { ToastProvider } from "@/components/ui/toast";

const routerMock = vi.hoisted(() => ({
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock
}));

function makeData(canManage = true) {
  return {
    accounts: [
      {
        id: "owner-1",
        name: "Owner Nasional",
        email: "owner@pegadaian.test",
        phone: "081234567890",
        phoneNumber: "081234567890",
        level: "owner" as const,
        levelLabel: "Owner",
        isActive: true,
        status: "Aktif",
        lastLogin: "9 Jun 2026, 10.00",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
        isCurrentUser: true
      },
      {
        id: "operator-1",
        name: "Operator Nasional",
        email: "operator@pegadaian.test",
        phone: "-",
        phoneNumber: "",
        level: "operator" as const,
        levelLabel: "Operator",
        isActive: true,
        status: "Aktif",
        lastLogin: "Belum pernah login",
        createdAt: "2026-06-02T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
        isCurrentUser: false
      }
    ],
    audit: [
      {
        id: "audit-1",
        action: "create",
        note: "Owner Nasional membuat akun Operator Nasional sebagai Operator.",
        actorUserId: "owner-1",
        actorName: "Owner Nasional",
        targetUserId: "operator-1",
        targetName: "Operator Nasional",
        createdAt: "2026-06-02T00:00:00.000Z",
        createdAtLabel: "2 Jun 2026, 08.00"
      }
    ],
    stats: {
      total: 2,
      activeOwners: 1,
      activeOperators: 1,
      inactive: 0,
      recentAudit: 1
    },
    currentUser: {
      id: canManage ? "owner-1" : "operator-1",
      level: canManage ? ("owner" as const) : ("operator" as const),
      canManage
    }
  };
}

function renderWorkspace(canManage = true) {
  return render(
    <ToastProvider>
      <SuperAdminAccountWorkspace data={makeData(canManage)} />
    </ToastProvider>
  );
}

describe("SuperAdminAccountWorkspace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders owner management controls and submits a new superadmin account", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { id: "operator-2" } }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
          })
        )
      )
    );

    renderWorkspace(true);

    expect(screen.getByRole("heading", { name: /manajemen superadmin/i })).toBeInTheDocument();
    expect(screen.getAllByText(/owner nasional/i).length).toBeGreaterThan(0);
    const detailLink = screen.getAllByRole("link", { name: /lihat detail/i })[0];
    expect(detailLink).toHaveAttribute(
      "href",
      "/superadmin/manajemen-superadmin/owner-1"
    );
    expect(detailLink).toHaveClass("hover:bg-[#006747]", "hover:text-white");

    fireEvent.click(screen.getByRole("button", { name: /tambah akses/i }));

    expect(screen.getByRole("dialog", { name: /akun superadmin baru/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /simpan superadmin/i })).toBeEnabled();

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), { target: { value: "Auditor Nasional" } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "auditor@pegadaian.test" } });
    fireEvent.change(screen.getByLabelText(/nomor telepon/i), { target: { value: "081299998888" } });
    fireEvent.change(screen.getByLabelText(/password sementara/i), { target: { value: "rahasia-123" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan superadmin/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/superadmin/accounts",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("auditor@pegadaian.test")
        })
      );
    });
    expect(routerMock.refresh).toHaveBeenCalled();
  });

  it("renders operator accounts in read-only mode", () => {
    renderWorkspace(false);

    expect(screen.getByText(/mode read-only aktif/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah akses/i })).toBeDisabled();
    expect(screen.getAllByRole("link", { name: /lihat detail/i }).length).toBe(2);
    expect(screen.queryByRole("button", { name: /simpan superadmin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reset$/i })).not.toBeInTheDocument();
  });

  it("renders profile-style detail page with sensitive actions", () => {
    const data = makeData(true);

    render(
      <ToastProvider>
        <SuperAdminAccountDetailWorkspace
          account={data.accounts[1]}
          audit={data.audit}
          currentUser={data.currentUser}
        />
      </ToastProvider>
    );

    expect(screen.getByRole("heading", { name: /detail akun superadmin/i })).toBeInTheDocument();
    expect(screen.getAllByText(/operator nasional/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /nonaktifkan/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /reset password/i })).toBeEnabled();
    expect(screen.getByText(/owner nasional membuat akun operator nasional/i)).toBeInTheDocument();
  });
});
