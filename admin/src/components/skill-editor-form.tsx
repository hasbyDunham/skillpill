import { useState, type FormEvent, type ReactNode } from "react";
import { BookOpen, ImageIcon, Save } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Skill, type SkillLabel } from "@/lib/skillpill-data";
import {
  createEmptyLearningLesson,
  LearningContentEditor,
  resizeLearningLessons,
} from "@/components/learning-content-editor";

const labels: SkillLabel[] = ["Bestseller", "Baru", "Bundle", "Draft"];

export type SkillPayload = Omit<Skill, "id" | "orders" | "revenue">;

type SkillForm = {
  title: string;
  image: string;
  landingHeadline: string;
  landingDescription: string;
  price: number;
  label: SkillLabel;
  category: string;
  moduleCount: string;
  estimatedTime: string;
  difficulty: string;
  lessons: Skill["lessons"];
};

const emptyForm: SkillForm = {
  title: "",
  image: "",
  landingHeadline: "",
  landingDescription: "",
  price: 0,
  label: "Baru",
  category: "",
  moduleCount: "1",
  estimatedTime: "15 mins",
  difficulty: "Beginner",
  lessons: [createEmptyLearningLesson(0)],
};

function splitProductDetails(value: string) {
  const items = value.split(/\s*(?:•|·|,|\n)\s*/).map((item) => item.trim()).filter(Boolean);
  return {
    moduleCount: items[0]?.match(/\d+/)?.[0] ?? "1",
    estimatedTime: items[1] ?? "15 mins",
    difficulty: items.slice(2).join(", ") || "Beginner",
  };
}

function initialForm(skill?: Skill): SkillForm {
  if (!skill) return emptyForm;
  const productDetails = splitProductDetails(skill.digitalContent);
  return {
    title: skill.title,
    image: skill.image,
    landingHeadline: skill.landingHeadline,
    landingDescription: skill.landingDescription,
    price: skill.price,
    label: skill.label,
    category: skill.category,
    ...productDetails,
    lessons: skill.lessons.length
      ? skill.lessons
      : resizeLearningLessons([], Number(productDetails.moduleCount) || 1, skill.title),
  };
}

export function SkillEditorForm({
  skill,
  submitLabel,
  onSubmit,
}: {
  skill?: Skill;
  submitLabel: string;
  onSubmit: (payload: SkillPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<SkillForm>(() => initialForm(skill));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.category.trim()) {
      setError("Judul dan kategori wajib diisi.");
      return;
    }

    const { moduleCount, estimatedTime, difficulty, ...productFields } = form;
    setSaving(true);
    try {
      await onSubmit({
        ...productFields,
        digitalContent: `${moduleCount || "1"} modul • ${estimatedTime || "15 mins"} • ${difficulty || "Beginner"}`,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Data skill gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="panel p-6 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Judul" htmlFor="title">
            <Input id="title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="AI Prompt Mastery" />
          </Field>
          <Field label="Kategori" htmlFor="category">
            <Input id="category" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="AI, Desain, Marketing…" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="URL Gambar" htmlFor="image">
              <Input id="image" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://…" />
            </Field>
          </div>
          <Field label="Harga (Rupiah)" htmlFor="price">
            <Input id="price" type="number" min={0} step="1000" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} placeholder="15000" />
          </Field>
          <Field label="Label">
            <Select value={form.label} onValueChange={(value) => setForm({ ...form, label: value as SkillLabel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{labels.map((label) => <SelectItem key={label} value={label}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Tampilan Landing Page — Headline" htmlFor="headline">
              <Input id="headline" value={form.landingHeadline} onChange={(event) => setForm({ ...form, landingHeadline: event.target.value })} placeholder="Kuasai prompt AI dalam 30 menit" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Tampilan Landing Page — Deskripsi" htmlFor="description">
              <Textarea id="description" rows={5} value={form.landingDescription} onChange={(event) => setForm({ ...form, landingDescription: event.target.value })} placeholder="Jelaskan hasil belajar dan manfaat produk untuk user." />
            </Field>
          </div>
        </div>

        <div className="mt-7 border-t border-border pt-6">
          <div className="flex items-center gap-2"><BookOpen className="size-4 text-primary" /><h2 className="text-lg font-semibold">Isian Produk</h2></div>
          <p className="mt-1 text-xs text-muted-foreground">Atur jumlah modul, durasi belajar, dan tingkat kesulitan secara terpisah.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Jumlah modul" htmlFor="module-count">
              <Input id="module-count" type="number" min={1} value={form.moduleCount} onChange={(event) => {
                const moduleCount = event.target.value;
                setForm({ ...form, moduleCount, lessons: resizeLearningLessons(form.lessons, Number(moduleCount) || 1, form.title) });
              }} />
            </Field>
            <Field label="Durasi" htmlFor="duration">
              <Input id="duration" value={form.estimatedTime} onChange={(event) => setForm({ ...form, estimatedTime: event.target.value })} placeholder="15 mins" />
            </Field>
            <Field label="Level">
              <Select value={form.difficulty} onValueChange={(value) => setForm({ ...form, difficulty: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <LearningContentEditor
          value={form.lessons}
          skillTitle={form.title}
          onChange={(lessons) => setForm({ ...form, lessons, moduleCount: String(lessons.length) })}
        />

        {error && <p className="mt-5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          <Button asChild type="button" variant="ghost"><Link to="/katalog">Batal</Link></Button>
          <Button type="submit" disabled={saving}><Save />{saving ? "Menyimpan…" : submitLabel}</Button>
        </div>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="panel overflow-hidden">
          <div className="aspect-[16/10] bg-surface-2">
            {form.image ? <img src={form.image} alt="Preview cover" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-10" /></div>}
          </div>
          <div className="p-5">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">Preview frontend</span>
            <h2 className="mt-2 text-xl font-semibold leading-tight">{form.title || "Judul SkillPill"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.landingHeadline || "Headline produk akan tampil di sini."}</p>
            <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3 text-xs">
              {form.moduleCount || "1"} modul • {form.estimatedTime || "15 mins"} • {form.difficulty}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-xs leading-5 text-muted-foreground">
          Perubahan tersimpan ke API Laravel dan digunakan oleh katalog frontend yang sama.
        </div>
      </aside>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
