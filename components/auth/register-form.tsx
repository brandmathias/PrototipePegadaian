"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getSafeBuyerNextPath } from "@/lib/auth/guards";
import { validateBuyerRegisterPayload } from "@/lib/auth/buyer-auth-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const rawNext = searchParams.get("next");
  const nextPath = getSafeBuyerNextPath(rawNext);
  const loginHref = rawNext ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
      setError(validationError instanceof Error ? validationError.message : "Periksa lagi data registrasi.");
      return;
    }

    setIsPending(true);
    const result = await authClient.signUp.email(payload);
    setIsPending(false);

    if (result.error) {
      setError(result.error.message ?? "Registrasi belum berhasil. Coba lagi.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
            htmlFor="buyer-register-name"
          >
            Nama lengkap
          </label>
          <Input
            autoComplete="name"
            id="buyer-register-name"
            name="name"
            onChange={(event) => updateField("name", event.target.value)}
            value={form.name}
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
            htmlFor="buyer-register-email"
          >
            Email
          </label>
          <Input
            autoComplete="email"
            id="buyer-register-email"
            name="email"
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            value={form.email}
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
            htmlFor="buyer-register-phone"
          >
            Nomor telepon
          </label>
          <Input
            autoComplete="tel"
            id="buyer-register-phone"
            name="phoneNumber"
            onChange={(event) => updateField("phoneNumber", event.target.value)}
            value={form.phoneNumber}
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
            htmlFor="buyer-register-national-id"
          >
            Nomor KTP
          </label>
          <Input
            id="buyer-register-national-id"
            inputMode="numeric"
            name="nationalId"
            onChange={(event) => updateField("nationalId", event.target.value)}
            value={form.nationalId}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
            htmlFor="buyer-register-password"
          >
            Password
          </label>
          <Input
            autoComplete="new-password"
            id="buyer-register-password"
            name="password"
            onChange={(event) => updateField("password", event.target.value)}
            type="password"
            value={form.password}
          />
        </div>
      </div>
      {error ? (
        <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex items-start gap-3 text-sm text-muted-foreground">
          <FileText className="mt-0.5 size-4 text-primary" />
          Setelah registrasi, akun bisa langsung dipakai untuk melihat katalog, mengirim
          bid, dan mengikuti alur pembayaran transaksi.
        </div>
        <div className="flex flex-col items-stretch gap-3 md:items-end">
          <Button disabled={!isHydrated || isPending} type="submit">
            {!isHydrated ? "Menyiapkan\u2026" : isPending ? "Memproses\u2026" : "Daftar Sekarang"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link className="font-semibold text-primary" href={loginHref}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
