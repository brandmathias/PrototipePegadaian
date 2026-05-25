"use client";

import Link from "next/link";
import { ChevronDown, CircleHelp, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

type AdminProfileMenuProps = {
  name: string;
  image?: string | null;
  profileHref?: string;
  helpHref?: string;
  className?: string;
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "AU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AdminProfileMenu({
  name,
  image,
  profileHref = "/admin/profil",
  helpHref = "/admin/profil#panduan",
  className
}: AdminProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={cn("relative shrink-0", className)} ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-2.5 py-2 text-sm font-bold text-[#085a41] shadow-[0_16px_34px_-26px_rgba(8,69,50,0.45)] ring-1 ring-white transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#0a6a49]/20 hover:bg-[#f7fbf7]",
          isOpen ? "border-[#0a6a49]/20 bg-[#f4faf5]" : ""
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="relative grid size-8 place-items-center overflow-hidden rounded-full bg-[#0a6a49] text-[0.68rem] font-black tracking-[-0.03em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="absolute inset-0 h-full w-full object-cover" src={image} />
          ) : null}
          <span className={cn(image ? "opacity-0" : "opacity-100")}>{getInitials(name)}</span>
        </span>
        <span className="hidden max-w-[10rem] truncate md:inline">{name}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 text-[#0a6a49]/60 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#0a6a49]",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 mt-3 w-60 overflow-hidden rounded-[1.35rem] border border-black/8 bg-white p-2 text-sm shadow-[0_24px_70px_-35px_rgba(8,69,50,0.44)] ring-1 ring-white/80"
          role="menu"
        >
          <div className="px-3 pb-2 pt-2">
            <div className="flex items-center gap-3">
              <span className="relative grid size-11 place-items-center overflow-hidden rounded-full bg-[#0a6a49] text-xs font-black tracking-[-0.04em] text-white">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="absolute inset-0 h-full w-full object-cover" src={image} />
                ) : null}
                <span className={cn(image ? "opacity-0" : "opacity-100")}>{getInitials(name)}</span>
              </span>
              <div className="min-w-0">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-[#0a6a49]/45">
                  Admin Unit
                </p>
                <p className="mt-1 truncate font-bold text-foreground">{name}</p>
              </div>
            </div>
          </div>
          <div className="my-1 h-px bg-border/70" />
          <Link
            className="flex items-center gap-3 rounded-[1rem] px-3 py-2.5 font-semibold text-foreground transition duration-300 hover:bg-[#f3faf5] hover:text-[#0a6a49]"
            href={profileHref}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <span className="grid size-8 place-items-center rounded-full bg-[#edf7ef] text-[#0a6a49]">
              <UserRound className="size-4" />
            </span>
            Profil
          </Link>
          <Link
            className="flex items-center gap-3 rounded-[1rem] px-3 py-2.5 font-semibold text-foreground transition duration-300 hover:bg-[#f7f7f3] hover:text-[#0a6a49]"
            href={helpHref}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <span className="grid size-8 place-items-center rounded-full bg-[#f5f3ed] text-[#0a6a49]">
              <CircleHelp className="size-4" />
            </span>
            Bantuan
          </Link>
          <LogoutButton
            className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left font-semibold text-red-700 transition duration-300 hover:bg-red-50 disabled:opacity-60"
            redirectTo="/login"
            role="menuitem"
          >
            <span className="grid size-8 place-items-center rounded-full bg-red-50 text-red-700">
              <LogOut className="size-4" />
            </span>
            Keluar
          </LogoutButton>
        </div>
      ) : null}
    </div>
  );
}
