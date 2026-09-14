import { useState, type FormEvent, type ReactNode } from "react";
import {
  BookOpen,
  ImageIcon,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
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

import {
  type LearningPractice,
  type Skill,
  type SkillLabel,
} from "@/lib/skillpill-data";

import {
  LearningContentEditor,
} from "@/components/learning-content-editor";

const labels: SkillLabel[] = [
  "Bestseller",
  "Baru",
  "Bundle",
  "Draft",
];

export type SkillPayload = Omit<
  Skill,
  "id" | "orders" | "revenue"
>;

type SkillForm = {
  title: string;
  image: string;
  landingHeadline: string;
  landingDescription: string;
  price: number;
  label: SkillLabel;
  category: string;
  accessLevel: Skill["accessLevel"];
  estimatedTime: string;
  difficulty: string;

  overview: Skill["overview"];

  lessons: Skill["lessons"];

  practice: LearningPractice[];

  summary: Skill["summary"];
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const createPractice = (): LearningPractice => ({
  id: createId("practice"),
  title: "",
  instruction: "",
  scenario: "",
  interactiveType: "input",
  options: [],
  correctOption: "",
  checklistItems: [],
  sampleAnswer: "",
});

const createReflection = () => ({
  id: createId("reflection"),
  question: "",
  context: "",
  helperPrompt: "",
});

const splitLinesForEditing = (value: string) =>
  value.split("\n");

const cleanLinesForSaving = (
  value: string[] | undefined,
) =>
  (value ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

const emptyForm: SkillForm = {
  title: "",
  image: "",
  landingHeadline: "",
  landingDescription: "",
  price: 0,
  label: "Baru",
  category: "",
  accessLevel: "all",
  estimatedTime: "15 menit",
  difficulty: "Beginner",

  overview: {
    headline: "",
    description: "",
    author: "SkillPill Admin",
    benefits: [],
    testimonials: [],
    references: [],
    faq: [],
  },

  lessons: [],

  practice: [],

  summary: {
    content: "",
    reflection: [],
    actionPlan: [],
    relatedSkills: [],
  },
};

function splitProductDetails(value: string) {
  const items = value
    .split(/\s*(?:•|·|,|\n)\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    estimatedTime: items[1] ?? "15 menit",
    difficulty:
      items.slice(2).join(", ") || "Beginner",
  };
}

function initialForm(skill?: Skill): SkillForm {
  if (!skill) {
    return emptyForm;
  }

  const productDetails = splitProductDetails(
    skill.digitalContent,
  );

  return {
    title: skill.title,
    image: skill.image,
    landingHeadline:
      skill.overview.headline,
    landingDescription:
      skill.overview.description,
    price: skill.price,
    label: skill.label,
    category: skill.category,
    accessLevel: skill.accessLevel,
    ...productDetails,

    overview: skill.overview,

    lessons: skill.lessons,

    practice: skill.practice ?? [],

    summary: {
      content: skill.summary?.content ?? "",

      reflection:
        skill.summary?.reflection ?? [],

      actionPlan:
        skill.summary?.actionPlan ?? [],

      relatedSkills:
        skill.summary?.relatedSkills ?? [],
    },
  };
}

export function SkillEditorForm({
  skill,
  submitLabel,
  onSubmit,
}: {
  skill?: Skill;
  submitLabel: string;
  onSubmit: (
    payload: SkillPayload,
  ) => Promise<void>;
}) {
  const [form, setForm] = useState<SkillForm>(
    () => initialForm(skill),
  );

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (
      !form.title.trim() ||
      !form.category.trim()
    ) {
      setError(
        "Judul dan kategori wajib diisi.",
      );
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        title: form.title.trim(),

        image: form.image.trim(),

        price: Number(form.price) || 0,

        accessLevel: form.accessLevel,

        label: form.label,

        category: form.category.trim(),

          overview: {
            ...form.overview,

            headline:
              form.landingHeadline.trim(),

            description:
              form.landingDescription.trim(),

            benefits: cleanLinesForSaving(
              form.overview.benefits,
            ),
          },

        lessons: form.lessons.map((lesson) => {
          const { audio: _audio, ...lessonWithoutAudio } = lesson;
          return {
          ...lessonWithoutAudio,
          ...(lesson.slides
            ? {
                slides: lesson.slides.map(
                  (slide) => ({
                    ...slide,
                    bullets: cleanLinesForSaving(
                      slide.bullets,
                    ),
                  }),
                ),
              }
            : {}),
          };
        }),

        practice: form.practice.map((practice) => ({
          ...practice,
          options: cleanLinesForSaving(
            practice.options,
          ),
          checklistItems: cleanLinesForSaving(
            practice.checklistItems,
          ),
        })),

        summary: form.summary,

        digitalContent:
          `${form.lessons.length} lesson • ` +
          `${form.estimatedTime || "15 menit"} • ` +
          `${form.difficulty || "Beginner"}`,
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Data skill gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  function addPractice() {
    setForm((current) => ({
      ...current,

      practice: [
        ...current.practice,
        createPractice(),
      ],
    }));
  }

  function updatePractice(
    index: number,
    patch: Partial<LearningPractice>,
  ) {
    setForm((current) => ({
      ...current,

      practice: current.practice.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...patch,
              }
            : item,
      ),
    }));
  }

  function removePractice(index: number) {
    setForm((current) => ({
      ...current,

      practice: current.practice.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    }));
  }

  function addReflection() {
    setForm((current) => ({
      ...current,

      summary: {
        ...current.summary,

        reflection: [
          ...current.summary.reflection,
          createReflection(),
        ],
      },
    }));
  }

  function updateReflection(
    index: number,
    patch: Partial<
      Skill["summary"]["reflection"][number]
    >,
  ) {
    setForm((current) => ({
      ...current,

      summary: {
        ...current.summary,

        reflection:
          current.summary.reflection.map(
            (item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    ...patch,
                  }
                : item,
          ),
      },
    }));
  }

  function removeReflection(
    index: number,
  ) {
    setForm((current) => ({
      ...current,

      summary: {
        ...current.summary,

        reflection:
          current.summary.reflection.filter(
            (_, itemIndex) =>
              itemIndex !== index,
          ),
      },
    }));
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
    >
      <section className="panel space-y-6 p-6 sm:p-7">
        <section className="rounded-2xl border border-border bg-surface-2/30 p-5">
          <SectionHeading
            title="Informasi Utama Skill"
            description="Data identitas yang digunakan untuk mengenali Skill di katalog dan halaman detail."
          />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            label="Judul"
            htmlFor="title"
          >
            <Input
              id="title"
              required
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              placeholder="AI Prompt Mastery"
            />
          </Field>

          <Field
            label="Kategori"
            htmlFor="category"
          >
            <Input
              id="category"
              required
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category:
                    event.target.value,
                })
              }
              placeholder="AI, Desain, Marketing…"
            />
          </Field>

          <Field
            label="Disusun Oleh"
            htmlFor="author"
          >
            <Input
              id="author"
              value={form.overview.author}
              onChange={(event) =>
                setForm({
                  ...form,
                  overview: {
                    ...form.overview,
                    author: event.target.value,
                  },
                })
              }
              placeholder="Nama penyusun materi"
            />
          </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-2/30 p-5">
          <SectionHeading
            title="Media & Tampilan"
            description="Gambar cover yang tampil pada katalog, detail Skill, dan materi pembelajaran."
          />
          <div className="mt-5">
            <Field
              label="URL Gambar"
              htmlFor="image"
            >
              <Input
                id="image"
                value={form.image}
                onChange={(event) =>
                  setForm({
                    ...form,
                    image:
                      event.target.value,
                  })
                }
                placeholder="https://…"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-2/30 p-5">
          <SectionHeading
            title="Konten Landing Page"
            description="Informasi penjualan dan detail Skill yang dilihat calon pembelajar sebelum mulai belajar."
          />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Headline Landing Page"
                htmlFor="headline"
              >
                <Input
                  id="headline"
                  value={form.landingHeadline}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      landingHeadline: event.target.value,
                    })
                  }
                  placeholder="Kuasai prompt AI dalam 30 menit"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Deskripsi Landing Page"
                htmlFor="description"
              >
                <Textarea
                  id="description"
                  rows={5}
                  value={form.landingDescription}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      landingDescription: event.target.value,
                    })
                  }
                  placeholder="Jelaskan hasil belajar dan manfaat produk untuk user."
                />
              </Field>
            </div>
            <Field label="Masalah yang Diselesaikan">
              <Textarea
                rows={4}
                value={form.overview.problem ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    overview: { ...form.overview, problem: event.target.value },
                  })
                }
                placeholder="Jelaskan masalah utama yang dialami calon pembelajar."
              />
            </Field>
            <Field label="Transformasi / Hasil">
              <Textarea
                rows={4}
                value={form.overview.transformation ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    overview: { ...form.overview, transformation: event.target.value },
                  })
                }
                placeholder="Jelaskan hasil konkret setelah menyelesaikan Skill ini."
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Manfaat Pembelajaran (satu manfaat per baris)">
                <Textarea
                  rows={5}
                  value={form.overview.benefits.join("\n")}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      overview: {
                        ...form.overview,
                        benefits: splitLinesForEditing(
                          event.target.value,
                        ),
                      },
                    })
                  }
                  placeholder="Memahami konsep inti&#10;Menerapkan langkah praktis"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Metodologi / Framework">
                <Textarea
                  rows={4}
                  value={form.overview.evidence ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      overview: { ...form.overview, evidence: event.target.value },
                    })
                  }
                  placeholder="Jelaskan metodologi atau framework yang menjadi dasar Skill ini."
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-2/30 p-5">
          <SectionHeading
            title="Pengaturan Akses"
            description="Atur harga, akses, dan label yang ditampilkan pada katalog Skill."
          />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
            label="Harga (Rupiah)"
            htmlFor="price"
          >
            <Input
              id="price"
              type="number"
              min={0}
              step="1000"
              value={form.price}
              onChange={(event) =>
                setForm({
                  ...form,
                  price: Number(
                    event.target.value,
                  ),
                })
              }
              placeholder="15000"
            />
            </Field>

            <Field label="Label">
            <Select
              value={form.label}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  label:
                    value as SkillLabel,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {labels.map((label) => (
                  <SelectItem
                    key={label}
                    value={label}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>

            <Field label="Akses pembelian">
              <Select
                value={form.accessLevel}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    accessLevel: value as Skill["accessLevel"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Bisa dibeli semua user</SelectItem>
                  <SelectItem value="pro">Khusus user Pro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-2/30 p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />

            <h2 className="text-lg font-semibold">
              Konten Pembelajaran
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Atur estimasi waktu, level, serta lesson dan aktivitas yang dijalankan pembelajar setelah Skill dibeli.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Jumlah lesson">
              <Input
                readOnly
                value={
                  form.lessons.length
                }
              />
            </Field>

            <Field
              label="Estimasi Waktu Belajar"
              htmlFor="duration"
            >
              <Input
                id="duration"
                value={
                  form.estimatedTime
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    estimatedTime:
                      event.target.value,
                  })
                }
                placeholder="Contoh: 30 menit atau 2 jam"
              />
              <p className="mt-1 text-xs text-muted-foreground">Hanya informasi perkiraan untuk user, bukan timer pembelajaran.</p>
            </Field>

            <Field label="Level">
              <Select
                value={form.difficulty}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    difficulty: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Beginner">
                    Beginner
                  </SelectItem>

                  <SelectItem value="Intermediate">
                    Intermediate
                  </SelectItem>

                  <SelectItem value="Advanced">
                    Advanced
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <LearningContentEditor
          value={form.lessons}
          skillTitle={form.title}
          onChange={(lessons) =>
            setForm({
              ...form,
              lessons,
            })
          }
        />

        <section className="mt-7 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Practice
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Tambahkan latihan yang
                dikerjakan user setelah
                lesson.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addPractice}
            >
              <Plus />
              Tambah Practice
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {form.practice.map(
              (practice, index) => (
                <div
                  key={practice.id}
                  className="rounded-2xl border border-border bg-surface-2/40 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        Practice {index + 1}
                      </p>

                      <h3 className="text-sm font-semibold">
                        {practice.title ||
                          `Practice ${
                            index + 1
                          }`}
                      </h3>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        removePractice(
                          index,
                        )
                      }
                      aria-label={`Hapus Practice ${
                        index + 1
                      }`}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <Field label="Judul">
                      <Input
                        value={
                          practice.title
                        }
                        onChange={(event) =>
                          updatePractice(
                            index,
                            {
                              title:
                                event.target
                                  .value,
                            },
                          )
                        }
                        placeholder="Latihan menawarkan tiga pilihan"
                      />
                    </Field>

                    <Field label="Instruksi">
                      <Textarea
                        rows={4}
                        value={
                          practice.instruction
                        }
                        onChange={(event) =>
                          updatePractice(
                            index,
                            {
                              instruction:
                                event.target
                                  .value,
                            },
                          )
                        }
                        placeholder="Jelaskan apa yang harus dilakukan user."
                      />
                    </Field>

                    <Field label="Skenario">
                      <Textarea
                        rows={4}
                        value={
                          practice.scenario
                        }
                        onChange={(event) =>
                          updatePractice(
                            index,
                            {
                              scenario:
                                event.target
                                  .value,
                            },
                          )
                        }
                        placeholder="Berikan konteks atau situasi latihan."
                      />
                    </Field>

                    <Field label="Jenis latihan">
                      <Select
                        value={
                          practice.interactiveType
                        }
                        onValueChange={(
                          value,
                        ) =>
                          updatePractice(
                            index,
                            {
                              interactiveType:
                                value as LearningPractice["interactiveType"],
                            },
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="input">
                            Input
                          </SelectItem>

                          <SelectItem value="multiple-choice">
                            Multiple Choice
                          </SelectItem>

                          <SelectItem value="checklist">
                            Checklist
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {practice.interactiveType ===
                      "multiple-choice" && (
                      <>
                        <Field label="Pilihan jawaban (satu per baris)">
                          <Textarea
                            rows={5}
                            value={(
                              practice.options ??
                              []
                            ).join("\n")}
                            onChange={(
                              event,
                            ) =>
                              updatePractice(
                                index,
                                {
                                  options:
                                    splitLinesForEditing(
                                      event.target.value,
                                    ),
                                },
                              )
                            }
                          />
                        </Field>

                        <Field label="Jawaban benar">
                          <Input
                            value={
                              practice.correctOption ??
                              ""
                            }
                            onChange={(
                              event,
                            ) =>
                              updatePractice(
                                index,
                                {
                                  correctOption:
                                    event.target
                                      .value,
                                },
                              )
                            }
                            placeholder="Pilihan yang benar"
                          />
                        </Field>
                      </>
                    )}

                    {practice.interactiveType ===
                      "checklist" && (
                      <Field label="Item checklist (satu per baris)">
                        <Textarea
                          rows={5}
                          value={(
                            practice.checklistItems ??
                            []
                          ).join("\n")}
                          onChange={(
                            event,
                          ) =>
                            updatePractice(
                              index,
                              {
                                checklistItems:
                                  splitLinesForEditing(
                                    event.target.value,
                                  ),
                              },
                            )
                          }
                        />
                      </Field>
                    )}

                    <Field label="Contoh jawaban">
                      <Textarea
                        rows={4}
                        value={
                          practice.sampleAnswer ??
                          ""
                        }
                        onChange={(event) =>
                          updatePractice(
                            index,
                            {
                              sampleAnswer:
                                event.target
                                  .value,
                            },
                          )
                        }
                        placeholder="Contoh jawaban yang baik."
                      />
                    </Field>
                  </div>
                </div>
              ),
            )}

            {!form.practice.length && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Belum ada Practice. Bagian ini
                optional.
              </div>
            )}
          </div>
        </section>

        <section className="mt-7 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Personal Reflection
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Pertanyaan refleksi yang akan
                dijawab user setelah
                pembelajaran.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addReflection}
            >
              <Plus />
              Tambah Reflection
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {form.summary.reflection.map(
              (reflection, index) => (
                <div
                  key={reflection.id}
                  className="rounded-2xl border border-border bg-surface-2/40 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        Reflection{" "}
                        {index + 1}
                      </p>

                      <h3 className="text-sm font-semibold">
                        {reflection.question ||
                          `Reflection ${
                            index + 1
                          }`}
                      </h3>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        removeReflection(
                          index,
                        )
                      }
                      aria-label={`Hapus Reflection ${
                        index + 1
                      }`}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <Field label="Pertanyaan">
                      <Textarea
                        rows={4}
                        value={
                          reflection.question
                        }
                        onChange={(event) =>
                          updateReflection(
                            index,
                            {
                              question:
                                event.target
                                  .value,
                            },
                          )
                        }
                        placeholder="Apa hal terpenting yang kamu pelajari dari skill ini?"
                      />
                    </Field>

                    <Field label="Konteks">
                      <Textarea
                        rows={3}
                        value={
                          reflection.context
                        }
                        onChange={(event) =>
                          updateReflection(
                            index,
                            {
                              context:
                                event.target
                                  .value,
                            },
                          )
                        }
                        placeholder="Berikan konteks tambahan untuk membantu user memahami pertanyaan."
                      />
                    </Field>

                    <Field label="Helper Prompt">
                      <Textarea
                        rows={3}
                        value={
                          reflection.helperPrompt
                        }
                        onChange={(event) =>
                          updateReflection(
                            index,
                            {
                              helperPrompt:
                                event.target
                                  .value,
                            },
                          )
                        }
                        placeholder="Contoh: Ingat kembali pengalamanmu saat mempraktikkan teknik ini."
                      />
                    </Field>
                  </div>
                </div>
              ),
            )}

            {!form.summary.reflection.length && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Belum ada Personal Reflection.
                Bagian ini optional.
              </div>
            )}
          </div>
        </section>

        <section className="mt-7 border-t border-border pt-6">
          <div>
            <h2 className="text-lg font-semibold">
              Executive Summary
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Ringkasan yang ditampilkan setelah
              user menyelesaikan pembelajaran.
            </p>
          </div>

          <div className="mt-5">
            <Field label="Ringkasan pembelajaran">
              <Textarea
                rows={8}
                value={form.summary.content}
                onChange={(event) =>
                  setForm({
                    ...form,

                    summary: {
                      ...form.summary,

                      content:
                        event.target.value,
                    },
                  })
                }
                placeholder="Tulis inti pembelajaran, poin penting, dan hal yang harus diingat user."
              />
            </Field>
          </div>
        </section>

        {error && (
          <p className="mt-5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          <Button
            asChild
            type="button"
            variant="ghost"
          >
            <Link to="/katalog">
              Batal
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={saving}
          >
            <Save />
            {saving
              ? "Menyimpan…"
              : submitLabel}
          </Button>
        </div>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="panel overflow-hidden">
          <div className="aspect-[16/10] bg-surface-2">
            {form.image ? (
              <img
                src={form.image}
                alt="Preview cover"
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                <ImageIcon className="size-10" />
              </div>
            )}
          </div>

          <div className="p-5">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
              Pratinjau katalog
            </span>

            <h2 className="mt-2 text-xl font-semibold leading-tight">
              {form.title ||
                "Judul SkillPill"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {form.landingHeadline ||
                "Headline produk akan tampil di sini."}
            </p>

            <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3 text-xs">
              {form.lessons.length} lesson •{" "}
              {form.estimatedTime ||
                "15 menit"}{" "}
              • {form.difficulty}
            </div>

            <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3 text-xs">
              {form.practice.length} practice
            </div>

            <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3 text-xs">
              {form.summary.reflection.length}{" "}
              reflection
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-xs leading-5 text-muted-foreground">
          Perubahan akan tampil pada katalog SkillPill.
        </div>
      </aside>
    </form>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
      </Label>

      {children}
    </div>
  );
}
