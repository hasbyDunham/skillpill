import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Clock3, Eye, PackageOpen, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rupiah, type SkillLabel } from "@/lib/skillpill-data";
import { useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/katalog")({
  head: () => ({
    meta: [
      { title: "Katalog Skill — SkillPill Admin" },
      { name: "description", content: "Kelola katalog SkillPill yang tampil pada frontend." },
    ],
  }),
  component: KatalogPage,
});

function labelClass(label: SkillLabel) {
  if (label === "Bestseller") return "bg-primary text-primary-foreground";
  if (label === "Baru") return "bg-lime text-primary-foreground";
  if (label === "Bundle") return "bg-gold text-primary-foreground";
  return "bg-surface text-foreground";
}

function KatalogPage() {
  const { skills, deleteSkill } = useSkillpill();
  const [query, setQuery] = useState("");
  const filtered = skills.filter((skill) =>
    `${skill.title} ${skill.category} ${skill.label}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function removeSkill(id: string, title: string) {
    if (!window.confirm(`Hapus skill “${title}”? Data ini tidak dapat dipulihkan.`)) return;
    try {
      await deleteSkill(id);
      toast.success(`“${title}” dihapus.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus skill.");
    }
  }

  return (
    <AdminShell
      eyebrow="(02) Katalog"
      title="Katalog Skill"
      description="Lihat dan kelola seluruh produk belajar yang tampil pada frontend SkillPill."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari skill…"
            className="h-10 w-48 bg-surface-2"
          />
          <Button asChild><Link to="/katalog/new">+ Tambah Skill</Link></Button>
        </div>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((skill) => (
          <article key={skill.id} className="group panel flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_-24px_oklch(0.55_0.23_260_/_0.55)]">
            <Link to="/katalog/$skillId" params={{ skillId: skill.id }} className="relative block aspect-[16/9] overflow-hidden bg-surface-2">
              {skill.image ? (
                <img src={skill.image} alt={skill.title} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="grid size-full place-items-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tanpa gambar</div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-foreground/45 to-transparent" />
              <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm ${labelClass(skill.label)}`}>{skill.label}</span>
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-white"><BookOpen className="size-3" />{skill.category || "Umum"}</span>
            </Link>

            <div className="flex flex-1 flex-col p-5">
              <Link to="/katalog/$skillId" params={{ skillId: skill.id }} className="line-clamp-2 min-h-11 text-lg font-semibold leading-snug transition-colors hover:text-primary">{skill.title}</Link>
              <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">{skill.landingHeadline}</p>
              <div className="mt-4 rounded-xl border border-border bg-surface-2/70 p-3">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><PackageOpen className="size-3 text-primary" /> Format belajar</span>
                <p className="mt-1 line-clamp-1 text-xs font-medium">{skill.digitalContent || "Belum diatur"}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div><span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Harga</span><p className="stat-num mt-1 text-base text-primary">{rupiah(skill.price)}</p></div>
                <div className="border-l border-border pl-3"><span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><Clock3 className="size-3" /> Order</span><p className="mt-1 font-display text-base font-semibold">{skill.orders}</p></div>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2">
                <Button asChild variant="secondary" size="sm"><Link to="/katalog/$skillId" params={{ skillId: skill.id }}><Eye /> Detail</Link></Button>
                <Button asChild variant="secondary" size="sm"><Link to="/katalog/$skillId/edit" params={{ skillId: skill.id }}><Pencil /> Edit</Link></Button>
                <Button variant="ghost" size="sm" className="px-2.5 text-destructive hover:bg-destructive/10" onClick={() => void removeSkill(skill.id, skill.title)} aria-label={`Hapus ${skill.title}`}><Trash2 /></Button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="panel p-8 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">Tidak ada skill yang cocok dengan pencarian.</p>
        )}
      </div>
    </AdminShell>
  );
}
