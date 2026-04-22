"use client";

import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState } from "react";

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

  async function handleLogout() {
    setIsPending(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } finally {
      setIsPending(false);
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <button
      {...props}
      className={className}
      disabled={isPending || props.disabled}
      onClick={handleLogout}
      type={type}
    >
      {isPending ? "Memproses..." : children}
    </button>
  );
}
