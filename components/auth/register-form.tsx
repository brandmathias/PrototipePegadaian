"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { FormEvent, useState } from "react";

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
  const [isPending, setIsPending] = useState(false);
  const rawNext = searchParams.get("next");
  const nextPath = getSafeBuyerNextPath(rawNext);
  const loginHref = rawNext ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

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
      payload = validateBuyerRegisterPayload(form);
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
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Nama lengkap
          </label>
          <Input
            autoComplete="name"
            onChange={(event) => updateField("name", event.target.value)}
            value={form.name}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Email
          </label>
          <Input
            autoComplete="email"
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            value={form.email}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Nomor telepon
          </label>
          <Input
            autoComplete="tel"
            onChange={(event) => updateField("phoneNumber", event.target.value)}
            value={form.phoneNumber}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Nomor KTP
          </label>
          <Input
            inputMode="numeric"
            onChange={(event) => updateField("nationalId", event.target.value)}
            value={form.nationalId}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Password
          </label>
          <Input
            autoComplete="new-password"
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
          <Button disabled={isPending} type="submit">
            {isPending ? "Memproses..." : "Daftar Sekarang"}
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
