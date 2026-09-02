import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Banknote, BookOpen, Clock3, PackageOpen, Pencil, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/skillpill-data";
import { useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/katalog_/$skillId")({
  head: () => ({ meta: [{ title: "Detail Skill — SkillPill Admin" }] }),
  component: SkillDetailPage,
});

function SkillDetailPage() {
  const { skillId } = Route.useParams();
  const { skills, isLoading } = useSkillpill();
  const skill = skills.find((item) => item.id === skillId);

  if (isLoading) {
    return <AdminShell eyebrow="(02) Katalog / Detail" title="Detail Skill" description="Memuat data katalog…"><div className="panel p-6 text-sm text-muted-foreground">Mengambil data skill dari API.</div></AdminShell>;
  }

  if (!skill) {
    return <AdminShell eyebrow="(02) Katalog / Detail" title="Skill Tidak Ditemukan" description="Data katalog yang dipilih tidak tersedia."><Button asChild><Link to="/katalog">Kembali ke Katalog</Link></Button></AdminShell>;
  }

  return (
    <AdminShell
      eyebrow="(02) Katalog / Detail"
      title="Detail Katalog Skill"
      description="Pratinjau lengkap data produk yang digunakan oleh frontend SkillPill."
      action={<Button asChild><Link to="/katalog/$skillId/edit" params={{ skillId }}><Pencil /> Edit Skill</Link></Button>}
    >
      <div className="mb-5">
        <Button asChild variant="ghost"><Link to="/katalog"><ArrowLeft /> Kembali ke Katalog</Link></Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="panel overflow-hidden">
          <div className="aspect-[16/7] bg-surface-2">
            {skill.image ? <img src={skill.image} alt={skill.title} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-sm text-muted-foreground">Tanpa gambar cover</div>}
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">{skill.label}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><BookOpen className="size-3" />{skill.category}</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">{skill.title}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{skill.landingHeadline}</p>
            <div className="mt-7 border-t border-border pt-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em]">Deskripsi landing page</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{skill.landingDescription || "Belum ada deskripsi."}</p>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h3 className="text-sm font-semibold">Informasi Produk</h3>
            <dl className="mt-4 space-y-4">
              <Info icon={PackageOpen} label="Isi produk" value={skill.digitalContent || "Belum diatur"} />
              <Info icon={Banknote} label="Harga" value={rupiah(skill.price)} />
              <Info icon={ShoppingBag} label="Total order" value={String(skill.orders)} />
              <Info icon={Clock3} label="Status katalog" value={skill.label === "Draft" ? "Draft" : "Tayang di frontend"} />
            </dl>
          </div>
          <div className="panel p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Sinkronisasi</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Data detail ini berasal dari API Laravel yang sama dengan katalog frontend.</p>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return <div className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><span><dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></span></div>;
}
