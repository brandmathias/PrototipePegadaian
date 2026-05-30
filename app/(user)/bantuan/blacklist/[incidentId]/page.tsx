import { BlacklistHelpCaseForm } from "@/components/buyer/blacklist-help-case-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { getBuyerSessionUser } from "@/lib/auth/session";

export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  await getBuyerSessionUser("/bantuan/blacklist");
  const { incidentId } = await params;

  return (
    <div className="container max-w-5xl space-y-8 py-8 md:py-10">
      <SectionHeading
        eyebrow="Review Insiden Pelanggaran"
        title="Ajukan review insiden pelanggaran"
        description="Gunakan halaman ini hanya jika seluruh bukti sudah siap. Pengajuan hanya dapat dilakukan satu kali untuk insiden yang sama."
      />
      <BlacklistHelpCaseForm incidentId={incidentId} />
    </div>
  );
}
