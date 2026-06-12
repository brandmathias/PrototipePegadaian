"use client";

import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { LogoutSuccessTransition } from "@/components/auth/login-success-transition";

type LogoutButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  redirectTo?: string;
};

export function LogoutButton({
  children,
  className,
  redirectTo = "/login",
  type = "button",
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } finally {
      setIsSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 1050));
      router.push(redirectTo);
      router.refresh();
      setIsPending(false);
    }
  }

  const successTransition =
    isSuccess && typeof document !== "undefined"
      ? createPortal(<LogoutSuccessTransition />, document.body)
      : null;

  return (
    <>
      {successTransition}
      <button
        {...props}
        className={className}
        disabled={isPending || props.disabled}
        onClick={handleLogout}
        type={type}
      >
        {isPending ? "Memproses..." : children}
      </button>
    </>
  );
}
