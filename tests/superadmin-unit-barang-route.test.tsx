import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDetail: vi.fn()
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn
}));

vi.mock("@/lib/services/unit.service", () => ({
  getSuperAdminUnitBarangDetail: mocks.getDetail
}));

vi.mock("@/components/pages/superadmin-unit-barang-detail-page", () => ({
  SuperAdminUnitBarangDetailPage: ({
    initialMarketingIterationId
  }: {
    initialMarketingIterationId?: string;
  }) => <div data-testid="selected-iteration">{initialMarketingIterationId ?? "none"}</div>
}));

import Page from "@/app/superadmin/unit/[id]/barang/[barangId]/page";

describe("superadmin unit barang route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDetail.mockResolvedValue({ item: { id: "barang-1" } });
  });

  it("passes the notification iteration query to the read-only detail page", async () => {
    const page = await Page({
      params: Promise.resolve({ id: "unit-1", barangId: "barang-1" }),
      searchParams: Promise.resolve({ iteration: "pm-1" })
    });

    render(page);

    expect(screen.getByTestId("selected-iteration")).toHaveTextContent("pm-1");
  });
});
