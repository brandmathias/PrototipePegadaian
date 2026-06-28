"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  IdCard,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  UserRound
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getSafeBuyerNextPath } from "@/lib/auth/guards";
import { validateBuyerRegisterPayload } from "@/lib/auth/buyer-auth-validation";
import { BUYER_REGISTRATION_DUPLICATE_MESSAGE } from "@/lib/auth/buyer-registration-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function getFriendlyRegistrationError(message: string | undefined) {
  const fallback = "Registrasi belum berhasil. Coba lagi.";
  const value = message ?? fallback;
  const normalized = value.toLowerCase();

  if (
    normalized.includes("duplicate") ||
    normalized.includes("unique") ||
    normalized.includes("already exists") ||
    normalized.includes("sudah terdaftar")
  ) {
    return BUYER_REGISTRATION_DUPLICATE_MESSAGE;
  }

  return value;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    nationalId: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const rawNext = searchParams.get("next");
  const nextPath = getSafeBuyerNextPath(rawNext);
  const loginHref = rawNext ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
  const labelClass = "text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-50/68";
  const inputClass = "h-14 rounded-2xl border-white/10 bg-white/[0.09] pl-12 text-base text-white placeholder:text-emerald-50/38 focus-visible:border-emerald-200/40 focus-visible:ring-emerald-200/20";
  const passwordInputClass = `${inputClass} pr-12`;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
    if (error) setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSuccess(false);

    let payload;
    try {
      const formData = new FormData(event.currentTarget);
      payload = validateBuyerRegisterPayload({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phoneNumber: String(formData.get("phoneNumber") ?? ""),
        nationalId: String(formData.get("nationalId") ?? ""),
        password: String(formData.get("password") ?? "")
      });
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : "Periksa lagi data registrasi.";
      setError(message);
      toast({
        description: message,
        duration: 5200,
        scope: "global",
        title: "Data registrasi belum lengkap",
        variant: "error"
      });
      return;
    }

    setIsPending(true);

    try {
      const result = await authClient.signUp.email(payload);

      if (result.error) {
        const message = getFriendlyRegistrationError(result.error.message);
        setError(message);
        toast({
          description: message,
          duration: 6200,
          scope: "global",
          title: "Registrasi belum berhasil",
          variant: "error"
        });
        return;
      }

      setIsSuccess(true);
      toast({
        description: "Akun pembeli valid dan sedang diarahkan ke area katalog.",
        duration: 3800,
        scope: "global",
        title: "Akun berhasil dibuat",
        variant: "success"
      });
      await new Promise((resolve) => setTimeout(resolve, 860));
      router.push(nextPath);
      router.refresh();
    } catch {
      const message = "Registrasi belum dapat diproses. Pastikan koneksi stabil, lalu coba lagi.";
      setError(message);
      toast({
        description: message,
        duration: 5200,
        scope: "global",
        title: "Registrasi belum berhasil",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className={labelClass}
            htmlFor="buyer-register-name"
          >
            Nama lengkap
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
            <Input
              autoComplete="name"
              className={inputClass}
              disabled={isPending || isSuccess}
              id="buyer-register-name"
              name="name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Nama sesuai identitas"
              value={form.name}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            className={labelClass}
            htmlFor="buyer-register-email"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
            <Input
              autoComplete="email"
              className={inputClass}
              disabled={isPending || isSuccess}
              id="buyer-register-email"
              name="email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="nama@email.com"
              type="email"
              value={form.email}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            className={labelClass}
            htmlFor="buyer-register-phone"
          >
            Nomor telepon
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
            <Input
              autoComplete="tel"
              className={inputClass}
              disabled={isPending || isSuccess}
              id="buyer-register-phone"
              name="phoneNumber"
              onChange={(event) => updateField("phoneNumber", event.target.value)}
              placeholder="08 atau 62"
              value={form.phoneNumber}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            className={labelClass}
            htmlFor="buyer-register-national-id"
          >
            Nomor KTP
          </label>
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
            <Input
              className={inputClass}
              disabled={isPending || isSuccess}
              id="buyer-register-national-id"
              inputMode="numeric"
              name="nationalId"
              onChange={(event) => updateField("nationalId", event.target.value)}
              placeholder="16 digit NIK"
              value={form.nationalId}
            />
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label
            className={labelClass}
            htmlFor="buyer-register-password"
          >
            Kata sandi
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-50/42" />
            <Input
              autoComplete="new-password"
              className={passwordInputClass}
              disabled={isPending || isSuccess}
              id="buyer-register-password"
              name="password"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimal 8 karakter"
              type={showPassword ? "text" : "password"}
              value={form.password}
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
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 text-sm leading-7 text-emerald-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 size-4 shrink-0 text-amber-100" />
          <span>
            Data identitas Anda digunakan secara aman untuk memverifikasi akun dan menjaga
            transparansi seluruh aktivitas transaksi Anda.
          </span>
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
              Akun berhasil dibuat
            </>
          ) : !isHydrated ? (
            "Menyiapkan..."
          ) : isPending ? (
            <>
              <Loader2 className="button-spinner size-4" />
              Membuat akun...
            </>
          ) : (
            <>
              Daftar sekarang
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </Button>
      <div className="text-center text-sm text-emerald-50/62">
        Sudah punya akun?{" "}
        <Link className="font-semibold text-amber-100 hover:text-white" href={loginHref}>
          Masuk di sini
        </Link>
      </div>
    </form>
  );
}
