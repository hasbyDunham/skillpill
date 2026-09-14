import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { SkillEditorForm } from "@/components/skill-editor-form";
import { Button } from "@/components/ui/button";
import { useSkillpill } from "@/lib/skillpill-store";
import { toast } from "sonner";

export const Route = createFileRoute("/katalog_/$skillId_/edit")({
  head: () => ({ meta: [{ title: "Edit Skill — SkillPill Admin" }] }),
  component: EditSkillPage,
});

function EditSkillPage() {
  const { skillId } = Route.useParams();
  const { skills, updateSkill, isLoading } = useSkillpill();
  const navigate = useNavigate();
  const skill = skills.find((item) => item.id === skillId);

  if (isLoading) {
    return <AdminShell eyebrow="(02) Katalog / Edit" title="Edit Skill" description="Memuat data katalog…"><div className="panel p-6 text-sm text-muted-foreground">Menyiapkan data skill…</div></AdminShell>;
  }

  if (!skill) {
    return <AdminShell eyebrow="(02) Katalog / Edit" title="Skill Tidak Ditemukan" description="Data katalog yang dipilih tidak tersedia."><Button onClick={() => void navigate({ to: "/katalog" })}>Kembali ke Katalog</Button></AdminShell>;
  }

  return (
    <AdminShell
      eyebrow="(02) Katalog / Edit"
      title={`Edit ${skill.title}`}
      description="Perbarui data produk untuk katalog SkillPill."
    >
      <div className="mb-5">
        <Button asChild variant="ghost">
          <Link
            to="/katalog/$skillId"
            params={{ skillId }}
          >
            <ArrowLeft />
            Kembali ke Detail Skill
          </Link>
        </Button>
      </div>

      <SkillEditorForm
        skill={skill}
        submitLabel="Simpan Perubahan"
        onSubmit={async (payload) => {
          await updateSkill(skill.id, payload);
          toast.success(`“${payload.title}” diperbarui.`);
          await navigate({ to: "/katalog/$skillId", params: { skillId: skill.id } });
        }}
      />
    </AdminShell>
  );
}
