import { BlacklistHelpCaseForm } from "@/components/buyer/blacklist-help-case-form";
import { SectionHeading } from "@/components/shared/section-heading";

export default function Page() {
  return (
    <main className="container max-w-5xl space-y-8 py-10 md:py-14">
      <SectionHeading
        eyebrow="Review Insiden Pelanggaran"
        title="Cek status dan ajukan review insiden"
        description="Masukkan NIK serta email atau nomor HP yang terdaftar untuk melihat insiden aktif dan mengirim pengajuan review tanpa login."
      />
      <BlacklistHelpCaseForm mode="public" />
    </main>
  );
}
