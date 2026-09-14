import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { SkillEditorForm } from "@/components/skill-editor-form";
import { Button } from "@/components/ui/button";
import { useSkillpill } from "@/lib/skillpill-store";
import { toast } from "sonner";

export const Route = createFileRoute("/katalog_/new")({
  head: () => ({ meta: [{ title: "Tambah Skill — SkillPill Admin" }] }),
  component: CreateSkillPage,
});

function CreateSkillPage() {
  const { createSkill } = useSkillpill();
  const navigate = useNavigate();

  return (
    <AdminShell
      eyebrow="(02) Katalog / Tambah"
      title="Tambah Skill Baru"
      description="Lengkapi data produk yang akan diterbitkan ke katalog SkillPill."
    >
      <div className="mb-5">
        <Button asChild variant="ghost">
          <Link to="/katalog">
            <ArrowLeft />
            Kembali ke Katalog
          </Link>
        </Button>
      </div>

      <SkillEditorForm
        submitLabel="Tambah Skill"
        onSubmit={async (payload) => {
          await createSkill(payload);
          toast.success(`“${payload.title}” ditambahkan ke katalog.`);
          await navigate({ to: "/katalog" });
        }}
      />
    </AdminShell>
  );
}
