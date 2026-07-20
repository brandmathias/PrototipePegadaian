"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, MailOpen, UnlockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getRoleHomePath, getSafeBuyerNextPath, getSafeRoleNextPath, isAuthRole } from "@/lib/auth/guards";
import { validateBuyerLoginPayload } from "@/lib/auth/buyer-auth-validation";
import { isLevelThreeLoginSuspensionMessage } from "@/lib/auth/login-suspension";
import { LoginSuccessTransition } from "@/components/auth/login-success-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const rawNext = searchParams.get("next");
  const nextPath = getSafeBuyerNextPath(rawNext);
  const registerHref = rawNext ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSuccess(false);

    let payload;
    try {
      const formData = new FormData(event.currentTarget);
      payload = validateBuyerLoginPayload({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      });
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : "Periksa lagi email dan kata sandi.";
      setError(message);
      toast({
        description: message,
        duration: 5200,
        scope: "global",
        title: "Data masuk belum lengkap",
        variant: "error"
      });
      return;
    }

    setIsPending(true);

    try {
      const result = await authClient.signIn.email(payload);

      if (result.error) {
        const message = result.error.message ?? "Masuk belum berhasil. Coba lagi.";
        const isLevelThreeSuspension = isLevelThreeLoginSuspensionMessage(message);
        setError(message);
        toast({
          description: message,
          duration: isLevelThreeSuspension ? 7600 : 5200,
          scope: "global",
          title: isLevelThreeSuspension ? "Akun ditangguhkan Level 3" : "Masuk belum berhasil",
          variant: "error"
        });
        return;
      }

      const meResponse = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include"
      });

      if (!meResponse.ok) {
        throw new Error("Profil akun belum bisa diverifikasi.");
      }

      const me = (await meResponse.json()) as {
        user: {
          role?: string | null;
        } | null;
      };
      const role = isAuthRole(me.user?.role) ? me.user.role : "buyer";
      const destinationPath = rawNext ? getSafeRoleNextPath(role, rawNext) : getRoleHomePath(role);

      setIsSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push(destinationPath);
      router.refresh();
    } catch {
      const message = "Proses masuk belum berhasil. Pastikan koneksi stabil, lalu coba lagi.";
      setError(message);
      toast({
        description: message,
        duration: 5200,
        scope: "global",
        title: "Masuk belum berhasil",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      {isSuccess ? <LoginSuccessTransition /> : null}
      <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-50/68"
          htmlFor="buyer-login-email"
        >
          Email akun
        </label>
        <div className="auth-input-group relative">
          {focusedField === "email" ? (
            <MailOpen className="auth-input-icon pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
          ) : (
            <Mail className="auth-input-icon pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
          )}
          <Input
            autoComplete="email"
            className="auth-input-field h-14 rounded-2xl border-white/10 bg-white/[0.09] pl-12 text-base text-white placeholder:text-emerald-50/38 focus-visible:border-emerald-200/40 focus-visible:ring-emerald-200/20"
            disabled={isPending || isSuccess}
            id="buyer-login-email"
            name="email"
            onBlur={() => setFocusedField(null)}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
            onFocus={() => setFocusedField("email")}
            placeholder="nama@email.com"
            type="email"
            value={email}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label
          className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-50/68"
          htmlFor="buyer-login-password"
        >
          Kata sandi
        </label>
        <div className="auth-input-group relative">
          {focusedField === "password" ? (
            <UnlockKeyhole className="auth-input-icon pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
          ) : (
            <LockKeyhole className="auth-input-icon pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
          )}
          <Input
            autoComplete="current-password"
            className="auth-input-field h-14 rounded-2xl border-white/10 bg-white/[0.09] pl-12 pr-12 text-base text-white placeholder:text-emerald-50/38 focus-visible:border-emerald-200/40 focus-visible:ring-emerald-200/20"
            disabled={isPending || isSuccess}
            id="buyer-login-password"
            name="password"
            onBlur={() => setFocusedField(null)}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            onFocus={() => setFocusedField("password")}
            placeholder="Masukkan kata sandi"
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showPassword}
            className="absolute right-4 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-xl text-emerald-50/52 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            disabled={isPending || isSuccess}
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Button
        aria-busy={isPending}
        className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[#1fb36d] text-base text-white shadow-[0_18px_42px_rgba(31,179,109,0.28)] hover:bg-[#24c27a] disabled:opacity-75"
        disabled={!isHydrated || isPending || isSuccess}
        type="submit"
      >
        {isPending ? (
          <span className="absolute inset-0 translate-x-[-55%] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.28)_48%,transparent_68%)] motion-safe:animate-[toast-sheen_1.15s_ease-in-out_infinite]" />
        ) : null}
        <span className="relative inline-flex items-center gap-2" aria-live="polite">
          {isSuccess ? (
            <>
              <CheckCircle2 className="size-4" />
              Login berhasil
            </>
          ) : !isHydrated ? (
            "Menyiapkan..."
          ) : isPending ? (
            <>
              <Loader2 className="button-spinner size-4" />
              Memverifikasi akun...
            </>
          ) : (
            <>
              Masuk
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </Button>
      <div className="text-center text-sm text-emerald-50/62">
        Belum punya akun?{" "}
        <Link className="font-semibold text-amber-100 hover:text-white" href={registerHref}>
          Daftar sekarang
        </Link>
      </div>
      </form>
    </>
  );
}
