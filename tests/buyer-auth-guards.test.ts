import { describe, expect, it } from "vitest";

import {
  getAuthenticatedLoginRedirectPath,
  getRoleHomePath,
  getSafeAdminNextPath,
  getSafeBuyerNextPath,
  getSafeSuperAdminNextPath
} from "@/lib/auth/guards";

describe("buyer auth guards", () => {
  it("allows only internal buyer-safe paths", () => {
    expect(getSafeBuyerNextPath("/dashboard")).toBe("/dashboard");
    expect(getSafeBuyerNextPath("/katalog/lot-1")).toBe("/katalog/lot-1");
    expect(getSafeBuyerNextPath("/katalog/buyer-demo-fixed-pemasaran/beli")).toBe(
      "/katalog/buyer-demo-fixed-pemasaran/beli"
    );
    expect(getSafeBuyerNextPath("/katalog/buyer-demo-vickrey-pemasaran/bid")).toBe(
      "/katalog/buyer-demo-vickrey-pemasaran/bid"
    );
    expect(getSafeBuyerNextPath("/transaksi/TRX-2026-0033")).toBe("/transaksi/TRX-2026-0033");
    expect(getSafeBuyerNextPath("/profil")).toBe("/profil");
  });

  it("falls back when next path is missing or external", () => {
    expect(getSafeBuyerNextPath()).toBe("/dashboard");
    expect(getSafeBuyerNextPath("http://evil.com")).toBe("/dashboard");
    expect(getSafeBuyerNextPath("//evil.com")).toBe("/dashboard");
    expect(getSafeBuyerNextPath("/admin")).toBe("/dashboard");
  });

  it("keeps admin and superadmin paths inside their own area", () => {
    expect(getSafeAdminNextPath("/admin")).toBe("/admin");
    expect(getSafeAdminNextPath("/admin/transaksi/TRX-MND-00421")).toBe(
      "/admin/transaksi/TRX-MND-00421"
    );
    expect(getSafeAdminNextPath("/superadmin")).toBe(getRoleHomePath("admin_unit"));

    expect(getSafeSuperAdminNextPath("/superadmin")).toBe("/superadmin");
    expect(getSafeSuperAdminNextPath("/superadmin/unit/unit-alpha-central")).toBe(
      "/superadmin/unit/unit-alpha-central"
    );
    expect(getSafeSuperAdminNextPath("/admin")).toBe(getRoleHomePath("super_admin"));
  });

  it("redirects authenticated users away from the login page", () => {
    expect(getAuthenticatedLoginRedirectPath({ role: "buyer", isActive: true }, "/katalog/lot-1/bid")).toBe(
      "/katalog/lot-1/bid"
    );
    expect(getAuthenticatedLoginRedirectPath({ role: "buyer", isActive: true })).toBe("/dashboard");
    expect(getAuthenticatedLoginRedirectPath({ role: "admin_unit", isActive: true }, "/katalog/lot-1/bid")).toBe(
      "/admin"
    );
    expect(getAuthenticatedLoginRedirectPath({ role: "buyer", isActive: false }, "/dashboard")).toBeNull();
    expect(getAuthenticatedLoginRedirectPath(null, "/dashboard")).toBeNull();
  });
});
