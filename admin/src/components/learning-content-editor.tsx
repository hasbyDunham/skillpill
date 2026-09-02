import { BookOpen, Headphones, LayoutGrid, Plus, Presentation, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
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
import {
  type LearningBentoCard,
  type LearningLessonContent,
  type LearningSlide,
} from "@/lib/skillpill-data";

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function createEmptyLearningLesson(index: number, skillTitle = ""): LearningLessonContent {
  const title = skillTitle ? `${skillTitle} — Modul ${index + 1}` : `Modul ${index + 1}`;
  return {
    id: `module-${index + 1}`,
    title,
    learningObjective: "",
    article: { title, body: "" },
    audio: { title: `Audio ${title}`, url: "", transcript: "", duration: "" },
    slides: [{ id: `slide-${index + 1}-1`, title, body: "", bullets: [], speakerNotes: "", imageUrl: "" }],
    bentoCards: [{ id: `bento-${index + 1}-1`, label: "Konsep Utama", title: "", content: "", tone: "accent", wide: false }],
  };
}

export function resizeLearningLessons(
  lessons: LearningLessonContent[],
  count: number,
  skillTitle = "",
): LearningLessonContent[] {
  const safeCount = Math.max(1, count);
  if (lessons.length >= safeCount) return lessons.slice(0, safeCount);
  return [
    ...lessons,
    ...Array.from({ length: safeCount - lessons.length }, (_, index) =>
      createEmptyLearningLesson(lessons.length + index, skillTitle),
    ),
  ];
}

export function LearningContentEditor({
  value,
  onChange,
  skillTitle,
}: {
  value: LearningLessonContent[];
  onChange: (value: LearningLessonContent[]) => void;
  skillTitle: string;
}) {
  const updateLesson = (index: number, patch: Partial<LearningLessonContent>) => {
    onChange(value.map((lesson, lessonIndex) => lessonIndex === index ? { ...lesson, ...patch } : lesson));
  };

  const addLesson = () => onChange([...value, createEmptyLearningLesson(value.length, skillTitle)]);
  const removeLesson = (index: number) => {
    if (value.length === 1) return;
    onChange(value.filter((_, lessonIndex) => lessonIndex !== index));
  };

  const addSlide = (lessonIndex: number) => {
    const slide: LearningSlide = { id: createId("slide"), title: `Slide ${value[lessonIndex].slides.length + 1}`, body: "", bullets: [], speakerNotes: "", imageUrl: "" };
    updateLesson(lessonIndex, { slides: [...value[lessonIndex].slides, slide] });
  };

  const addBentoCard = (lessonIndex: number) => {
    const card: LearningBentoCard = { id: createId("bento"), label: "Poin Penting", title: "", content: "", tone: "default", wide: false };
    updateLesson(lessonIndex, { bentoCards: [...value[lessonIndex].bentoCards, card] });
  };

  return (
    <div className="mt-7 border-t border-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><BookOpen className="size-4 text-primary" /><h2 className="text-lg font-semibold">Konten Pembelajaran Dinamis</h2></div>
          <p className="mt-1 text-xs text-muted-foreground">Kelola artikel, audio, slide presentasi, dan Bento Card untuk setiap modul.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addLesson}><Plus />Tambah Modul</Button>
      </div>

      <div className="mt-5 space-y-4">
        {value.map((lesson, lessonIndex) => (
          <details key={lesson.id} className="rounded-2xl border border-border bg-surface-2/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
              <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Modul {lessonIndex + 1}</span><span className="block truncate text-sm font-semibold">{lesson.title || `Modul ${lessonIndex + 1}`}</span></span>
              <Button type="button" variant="ghost" size="icon" disabled={value.length === 1} onClick={(event) => { event.preventDefault(); removeLesson(lessonIndex); }} aria-label="Hapus modul"><Trash2 /></Button>
            </summary>

            <div className="space-y-6 border-t border-border p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Judul modul"><Input value={lesson.title} onChange={(event) => updateLesson(lessonIndex, { title: event.target.value })} /></Field>
                <Field label="Tujuan belajar"><Input value={lesson.learningObjective} onChange={(event) => updateLesson(lessonIndex, { learningObjective: event.target.value })} /></Field>
              </div>

              <ContentBlock icon={BookOpen} title="Artikel Pembelajaran">
                <Field label="Judul artikel"><Input value={lesson.article.title} onChange={(event) => updateLesson(lessonIndex, { article: { ...lesson.article, title: event.target.value } })} /></Field>
                <Field label="Isi artikel"><Textarea rows={8} value={lesson.article.body} onChange={(event) => updateLesson(lessonIndex, { article: { ...lesson.article, body: event.target.value } })} placeholder="Tulis artikel lengkap. Pisahkan paragraf dengan baris kosong." /></Field>
              </ContentBlock>

              <ContentBlock icon={Headphones} title="Audio Penjelasan">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Judul audio"><Input value={lesson.audio.title} onChange={(event) => updateLesson(lessonIndex, { audio: { ...lesson.audio, title: event.target.value } })} /></Field>
                  <Field label="Durasi"><Input value={lesson.audio.duration} onChange={(event) => updateLesson(lessonIndex, { audio: { ...lesson.audio, duration: event.target.value } })} placeholder="08:30" /></Field>
                </div>
                <Field label="URL audio"><Input type="url" value={lesson.audio.url} onChange={(event) => updateLesson(lessonIndex, { audio: { ...lesson.audio, url: event.target.value } })} placeholder="https://.../audio.mp3" /></Field>
                <Field label="Transkrip audio"><Textarea rows={5} value={lesson.audio.transcript} onChange={(event) => updateLesson(lessonIndex, { audio: { ...lesson.audio, transcript: event.target.value } })} placeholder="Dipakai sebagai transkrip dan cadangan pembaca suara." /></Field>
              </ContentBlock>

              <ContentBlock icon={Presentation} title="Slider Presentasi">
                <div className="space-y-4">
                  {lesson.slides.map((slide, slideIndex) => (
                    <div key={slide.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-primary">Slide {slideIndex + 1}</span><Button type="button" variant="ghost" size="icon" disabled={lesson.slides.length === 1} onClick={() => updateLesson(lessonIndex, { slides: lesson.slides.filter((_, index) => index !== slideIndex) })}><Trash2 /></Button></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Judul"><Input value={slide.title} onChange={(event) => updateLesson(lessonIndex, { slides: lesson.slides.map((item, index) => index === slideIndex ? { ...item, title: event.target.value } : item) })} /></Field>
                        <Field label="URL gambar"><Input value={slide.imageUrl} onChange={(event) => updateLesson(lessonIndex, { slides: lesson.slides.map((item, index) => index === slideIndex ? { ...item, imageUrl: event.target.value } : item) })} /></Field>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Isi slide"><Textarea rows={4} value={slide.body} onChange={(event) => updateLesson(lessonIndex, { slides: lesson.slides.map((item, index) => index === slideIndex ? { ...item, body: event.target.value } : item) })} /></Field>
                        <Field label="Poin-poin (satu per baris)"><Textarea rows={4} value={slide.bullets.join("\n")} onChange={(event) => updateLesson(lessonIndex, { slides: lesson.slides.map((item, index) => index === slideIndex ? { ...item, bullets: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) } : item) })} /></Field>
                      </div>
                      <div className="mt-3"><Field label="Catatan presenter"><Textarea rows={2} value={slide.speakerNotes} onChange={(event) => updateLesson(lessonIndex, { slides: lesson.slides.map((item, index) => index === slideIndex ? { ...item, speakerNotes: event.target.value } : item) })} /></Field></div>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" size="sm" onClick={() => addSlide(lessonIndex)}><Plus />Tambah Slide</Button>
                </div>
              </ContentBlock>

              <ContentBlock icon={LayoutGrid} title="Bento Card">
                <div className="grid gap-4 lg:grid-cols-2">
                  {lesson.bentoCards.map((card, cardIndex) => (
                    <div key={card.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-primary">Kartu {cardIndex + 1}</span><Button type="button" variant="ghost" size="icon" disabled={lesson.bentoCards.length === 1} onClick={() => updateLesson(lessonIndex, { bentoCards: lesson.bentoCards.filter((_, index) => index !== cardIndex) })}><Trash2 /></Button></div>
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2"><Field label="Label"><Input value={card.label} onChange={(event) => updateLesson(lessonIndex, { bentoCards: lesson.bentoCards.map((item, index) => index === cardIndex ? { ...item, label: event.target.value } : item) })} /></Field><Field label="Judul"><Input value={card.title} onChange={(event) => updateLesson(lessonIndex, { bentoCards: lesson.bentoCards.map((item, index) => index === cardIndex ? { ...item, title: event.target.value } : item) })} /></Field></div>
                        <Field label="Isi kartu"><Textarea rows={4} value={card.content} onChange={(event) => updateLesson(lessonIndex, { bentoCards: lesson.bentoCards.map((item, index) => index === cardIndex ? { ...item, content: event.target.value } : item) })} /></Field>
                        <div className="grid gap-3 sm:grid-cols-2"><Field label="Warna"><Select value={card.tone} onValueChange={(tone) => updateLesson(lessonIndex, { bentoCards: lesson.bentoCards.map((item, index) => index === cardIndex ? { ...item, tone: tone as LearningBentoCard["tone"] } : item) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Default</SelectItem><SelectItem value="accent">Brand</SelectItem><SelectItem value="dark">Gelap</SelectItem><SelectItem value="success">Hijau</SelectItem><SelectItem value="warning">Peringatan</SelectItem></SelectContent></Select></Field><label className="flex items-center gap-2 self-end pb-2 text-xs"><input type="checkbox" checked={card.wide} onChange={(event) => updateLesson(lessonIndex, { bentoCards: lesson.bentoCards.map((item, index) => index === cardIndex ? { ...item, wide: event.target.checked } : item) })} />Lebar penuh</label></div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => addBentoCard(lessonIndex)}><Plus />Tambah Bento Card</Button>
              </ContentBlock>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function ContentBlock({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: ReactNode }) {
  return <section className="space-y-4 rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-2"><Icon className="size-4 text-primary" /><h3 className="text-sm font-semibold">{title}</h3></div>{children}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
