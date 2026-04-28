"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getRoleHomePath, getSafeBuyerNextPath, getSafeRoleNextPath, isAuthRole } from "@/lib/auth/guards";
import { validateBuyerLoginPayload } from "@/lib/auth/buyer-auth-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const rawNext = searchParams.get("next");
  const nextPath = getSafeBuyerNextPath(rawNext);
  const registerHref = rawNext ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let payload;
    try {
      const formData = new FormData(event.currentTarget);
      payload = validateBuyerLoginPayload({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      });
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Periksa lagi email dan kata sandi.");
      return;
    }

    setIsPending(true);
    const result = await authClient.signIn.email(payload);
    setIsPending(false);

    if (result.error) {
      setError(result.error.message ?? "Masuk belum berhasil. Coba lagi.");
      return;
    }

    const meResponse = await fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "include"
    });
    const me = (await meResponse.json()) as {
      user: {
        role?: string | null;
      } | null;
    };
    const role = isAuthRole(me.user?.role) ? me.user.role : "buyer";

    router.push(rawNext ? getSafeRoleNextPath(role, rawNext) : getRoleHomePath(role));
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
          htmlFor="buyer-login-email"
        >
          Email
        </label>
        <Input
          autoComplete="email"
          id="buyer-login-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Masukkan email"
          type="email"
          value={email}
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
          htmlFor="buyer-login-password"
        >
          Password
        </label>
        <Input
          autoComplete="current-password"
          id="buyer-login-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Masukkan kata sandi"
          type="password"
          value={password}
        />
      </div>
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Button className="w-full" disabled={!isHydrated || isPending} type="submit">
        {!isHydrated ? "Menyiapkan\u2026" : isPending ? "Memproses\u2026" : "Masuk"}
      </Button>
      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface-low p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 text-primary" />
        Akun pembeli yang lolos registrasi dapat langsung mengakses workflow transaksi
        fixed price dan lelang.
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link className="font-semibold text-primary" href={registerHref}>
          Daftar sebagai pembeli
        </Link>
      </div>
    </form>
  );
}
