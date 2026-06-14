"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

type UserPagesModule = typeof import("@/components/pages/user-pages");
type ComponentObjectProps<T> = T extends (props: infer Props, ...args: any[]) => any
  ? Props extends object
    ? Props
    : Record<string, never>
  : T extends ComponentType<infer Props>
    ? Props extends object
      ? Props
      : Record<string, never>
    : Record<string, never>;
type UserPageProps<T extends keyof UserPagesModule> = ComponentObjectProps<UserPagesModule[T]>;

function UserPageFallback() {
  return <PageLoadingSkeleton />;
}

const LazyUserDashboardPage = dynamic<UserPageProps<"UserDashboardPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.UserDashboardPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyTransactionsPage = dynamic<UserPageProps<"TransactionsPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.TransactionsPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyAuctionWinnerPage = dynamic<UserPageProps<"AuctionWinnerPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.AuctionWinnerPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyAuctionLoserPage = dynamic<UserPageProps<"AuctionLoserPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.AuctionLoserPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyTransactionDetailPage = dynamic<UserPageProps<"TransactionDetailPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.TransactionDetailPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyTransactionReceiptPage = dynamic<UserPageProps<"TransactionReceiptPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.TransactionReceiptPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyBidHistoryPage = dynamic<UserPageProps<"BidHistoryPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.BidHistoryPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyBidVerificationPage = dynamic<UserPageProps<"BidVerificationPage">>(
  () => import("@/components/pages/user-pages").then((module) => module.BidVerificationPage),
  { loading: UserPageFallback, ssr: false }
);

const LazyProfilePage = dynamic<UserPageProps<"ProfilePage">>(
  () => import("@/components/pages/user-pages").then((module) => module.ProfilePage),
  { loading: UserPageFallback, ssr: false }
);

export function UserDashboardPage(props: UserPageProps<"UserDashboardPage">) {
  return <LazyUserDashboardPage {...props} />;
}

export function TransactionsPage(props: UserPageProps<"TransactionsPage">) {
  return <LazyTransactionsPage {...props} />;
}

export function AuctionWinnerPage(props: UserPageProps<"AuctionWinnerPage">) {
  return <LazyAuctionWinnerPage {...props} />;
}

export function AuctionLoserPage(props: UserPageProps<"AuctionLoserPage">) {
  return <LazyAuctionLoserPage {...props} />;
}

export function TransactionDetailPage(props: UserPageProps<"TransactionDetailPage">) {
  return <LazyTransactionDetailPage {...props} />;
}

export function TransactionReceiptPage(props: UserPageProps<"TransactionReceiptPage">) {
  return <LazyTransactionReceiptPage {...props} />;
}

export function BidHistoryPage(props: UserPageProps<"BidHistoryPage">) {
  return <LazyBidHistoryPage {...props} />;
}

export function BidVerificationPage(props: UserPageProps<"BidVerificationPage">) {
  return <LazyBidVerificationPage {...props} />;
}

export function ProfilePage(props: UserPageProps<"ProfilePage">) {
  return <LazyProfilePage {...props} />;
}
