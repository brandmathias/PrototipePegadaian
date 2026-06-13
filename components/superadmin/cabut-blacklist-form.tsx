"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DIRECT_REVOKE_REASON_OPTIONS } from "@/lib/blacklist/revoke";
import { useToast } from "@/components/ui/toast";
import { fetchSuperAdminJson } from "@/lib/superadmin/client";

type CabutBlacklistFormProps = {
  userId: string;
  disabled?: boolean;
};

export function CabutBlacklistForm({ userId, disabled }: CabutBlacklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reasonCode, setReasonCode] = useState<string>(DIRECT_REVOKE_REASON_OPTIONS[0].code);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await fetchSuperAdminJson(`/api/superadmin/blacklist/${userId}/cabut`, {
        method: "POST",
        body: JSON.stringify({ reasonCode, note })
      });
      setNote("");
      setMessage("Blacklist berhasil dicabut.");
      toast({
        title: "Blacklist berhasil dicabut.",
        description: "Akun terkait bisa kembali mengikuti alur yang diizinkan sesuai kebijakan sistem.",
        variant: "success"
      });
      router.refresh();
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Blacklist gagal dicabut.";
      setError(errorMessage);
      toast({
        title: "Blacklist belum bisa dicabut.",
        description: errorMessage,
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Alasan pencabutan
        </p>
        <select
          className="h-11 w-full rounded-xl border border-border/70 bg-white px-4 text-sm font-semibold text-foreground outline-none disabled:opacity-60"
          disabled={disabled || loading}
          onChange={(event) => setReasonCode(event.target.value)}
          value={reasonCode}
        >
          {DIRECT_REVOKE_REASON_OPTIONS.map((reason) => (
            <option key={reason.code} value={reason.code}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        disabled={disabled || loading}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Catatan tambahan opsional..."
        value={note}
      />
      {error ? (
        <InlineFeedback className="feedback-pop" description={error} title="Lengkapi alasan pencabutan." variant="error" />
      ) : null}
      {!error && message ? (
        <InlineFeedback
          className="feedback-pop"
          description="Jejak tindakan superadmin tetap tersimpan di riwayat blacklist."
          title={message}
          variant="success"
        />
      ) : null}
      <Button disabled={disabled || loading} type="submit">
        {loading ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Memproses...
          </>
        ) : (
          "Cabut Blacklist"
        )}
      </Button>
    </form>
  );
}
