"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export type {
  SuperAdminAdminItem,
  SuperAdminBlacklistItem,
  SuperAdminMetric,
  SuperAdminMonitoringData,
  SuperAdminMonitoringItem,
  SuperAdminSpotlight,
  SuperAdminSummary,
  SuperAdminUnitAccount,
  SuperAdminUnitBarangDetail,
  SuperAdminUnitBarangItem,
  SuperAdminUnitDetail,
  SuperAdminUnitListItem,
} from "@/components/pages/superadmin-pages";

type SuperAdminPagesModule = typeof import("@/components/pages/superadmin-pages");
type ComponentObjectProps<T> = T extends (props: infer Props, ...args: any[]) => any
  ? Props extends object
    ? Props
    : Record<string, never>
  : T extends ComponentType<infer Props>
    ? Props extends object
      ? Props
      : Record<string, never>
    : Record<string, never>;
type SuperAdminProps<T extends keyof SuperAdminPagesModule> = ComponentObjectProps<SuperAdminPagesModule[T]>;

function SuperAdminFallback() {
  return <PageLoadingSkeleton />;
}

const LazySuperAdminDashboardPage = dynamic<SuperAdminProps<"SuperAdminDashboardPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminDashboardPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminUnitsPage = dynamic<SuperAdminProps<"SuperAdminUnitsPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminUnitsPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminUnitDetailPage = dynamic<SuperAdminProps<"SuperAdminUnitDetailPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminUnitDetailPage),
  { loading: SuperAdminFallback }
);

const LazySuperAdminManagementUnitDetailPage = dynamic<
  SuperAdminProps<"SuperAdminManagementUnitDetailPage">
>(
  () =>
    import("@/components/pages/superadmin-pages").then(
      (module) => module.SuperAdminManagementUnitDetailPage,
    ),
  { loading: SuperAdminFallback, ssr: false },
);

const LazySuperAdminUnitBarangDetailPage = dynamic<SuperAdminProps<"SuperAdminUnitBarangDetailPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminUnitBarangDetailPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminUnitAccountsPage = dynamic<SuperAdminProps<"SuperAdminUnitAccountsPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminUnitAccountsPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminAdminsPage = dynamic<SuperAdminProps<"SuperAdminAdminsPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminAdminsPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminManagementPage = dynamic<SuperAdminProps<"SuperAdminManagementPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminManagementPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminCreateUnitPage = dynamic<SuperAdminProps<"SuperAdminCreateUnitPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminCreateUnitPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminPolicyPage = dynamic<SuperAdminProps<"SuperAdminPolicyPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminPolicyPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminMonitoringPage = dynamic<SuperAdminProps<"SuperAdminMonitoringPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminMonitoringPage),
  { loading: SuperAdminFallback, ssr: false }
);

const LazySuperAdminBlacklistPage = dynamic<SuperAdminProps<"SuperAdminBlacklistPage">>(
  () => import("@/components/pages/superadmin-pages").then((module) => module.SuperAdminBlacklistPage),
  { loading: SuperAdminFallback, ssr: false }
);

export function SuperAdminDashboardPage(props: SuperAdminProps<"SuperAdminDashboardPage">) {
  return <LazySuperAdminDashboardPage {...props} />;
}

export function SuperAdminUnitsPage(props: SuperAdminProps<"SuperAdminUnitsPage">) {
  return <LazySuperAdminUnitsPage {...props} />;
}

export function SuperAdminUnitDetailPage(props: SuperAdminProps<"SuperAdminUnitDetailPage">) {
  return <LazySuperAdminUnitDetailPage {...props} />;
}

export function SuperAdminManagementUnitDetailPage(
  props: SuperAdminProps<"SuperAdminManagementUnitDetailPage">,
) {
  return <LazySuperAdminManagementUnitDetailPage {...props} />;
}

export function SuperAdminUnitBarangDetailPage(props: SuperAdminProps<"SuperAdminUnitBarangDetailPage">) {
  return <LazySuperAdminUnitBarangDetailPage {...props} />;
}

export function SuperAdminUnitAccountsPage(props: SuperAdminProps<"SuperAdminUnitAccountsPage">) {
  return <LazySuperAdminUnitAccountsPage {...props} />;
}

export function SuperAdminAdminsPage(props: SuperAdminProps<"SuperAdminAdminsPage">) {
  return <LazySuperAdminAdminsPage {...props} />;
}

export function SuperAdminManagementPage(props: SuperAdminProps<"SuperAdminManagementPage">) {
  return <LazySuperAdminManagementPage {...props} />;
}

export function SuperAdminCreateUnitPage(props: SuperAdminProps<"SuperAdminCreateUnitPage">) {
  return <LazySuperAdminCreateUnitPage {...props} />;
}

export function SuperAdminPolicyPage(props: SuperAdminProps<"SuperAdminPolicyPage">) {
  return <LazySuperAdminPolicyPage {...props} />;
}

export function SuperAdminMonitoringPage(props: SuperAdminProps<"SuperAdminMonitoringPage">) {
  return <LazySuperAdminMonitoringPage {...props} />;
}

export function SuperAdminBlacklistPage(props: SuperAdminProps<"SuperAdminBlacklistPage">) {
  return <LazySuperAdminBlacklistPage {...props} />;
}
