import {
  BookOpen,
  Layers3,
  Plus,
  Presentation,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  LearningFlashcard,
  LearningLessonContent,
  LearningSlide,
} from "@/lib/skillpill-data";

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function createEmptyLearningLesson(
  _index: number,
): LearningLessonContent {
  return {
    id: createId("lesson"),
    title: "",
    learningObjective: "",
  };
}

export function LearningContentEditor({
  value,
  onChange,
  skillTitle: _skillTitle,
}: {
  value: LearningLessonContent[];
  onChange: (value: LearningLessonContent[]) => void;
  skillTitle: string;
}) {
  const updateLesson = (
    index: number,
    patch: Partial<LearningLessonContent>,
  ) => {
    onChange(
      value.map((lesson, lessonIndex) =>
        lessonIndex === index
          ? {
              ...lesson,
              ...patch,
            }
          : lesson,
      ),
    );
  };

  const addLesson = () => {
    onChange([
      ...value,
      createEmptyLearningLesson(value.length),
    ]);
  };

  const removeLesson = (index: number) => {
    onChange(
      value.filter(
        (_, lessonIndex) => lessonIndex !== index,
      ),
    );
  };

  const removeArticle = (lessonIndex: number) => {
    const lesson = value[lessonIndex];
    if (!lesson) return;

    const {
      article: _article,
      ...lessonWithoutArticle
    } = lesson;

    onChange(
      value.map((item, index) =>
        index === lessonIndex
          ? lessonWithoutArticle
          : item,
      ),
    );
  };

  const addSlide = (lessonIndex: number) => {
    const lesson = value[lessonIndex];
    if (!lesson) return;

    const slide: LearningSlide = {
      id: createId("slide"),
      title: "",
      body: "",
      bullets: [],
      speakerNotes: "",
      imageUrl: "",
    };

    updateLesson(lessonIndex, {
      slides: [
        ...(lesson.slides ?? []),
        slide,
      ],
    });
  };

  const addFlashcard = (lessonIndex: number) => {
    const lesson = value[lessonIndex];
    if (!lesson) return;

    const flashcard: LearningFlashcard = {
      id: createId("flashcard"),
      question: "",
      answer: "",
    };

    updateLesson(lessonIndex, {
      flashcards: [
        ...(lesson.flashcards ?? []),
        flashcard,
      ],
    });
  };

  return (
    <div className="mt-7 border-t border-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />

            <h2 className="text-lg font-semibold">
              Konten Pembelajaran Dinamis
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Tambahkan lesson satu per satu. Artikel, slide, dan flashcard bersifat opsional. Isi artikel dapat dibacakan otomatis oleh Text-to-Speech di halaman user.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addLesson}
        >
          <Plus />
          Tambah Lesson
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {value.map((lesson, lessonIndex) => (
          <details
            key={lesson.id}
            className="rounded-2xl border border-border bg-surface-2/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Lesson {lessonIndex + 1}
                </span>

                <span className="block truncate text-sm font-semibold">
                  {lesson.title ||
                    `Lesson ${lessonIndex + 1}`}
                </span>
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.preventDefault();
                  removeLesson(lessonIndex);
                }}
                aria-label="Hapus lesson"
              >
                <Trash2 />
              </Button>
            </summary>

            <div className="space-y-6 border-t border-border p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Judul lesson">
                  <Input
                    value={lesson.title}
                    onChange={(event) =>
                      updateLesson(lessonIndex, {
                        title:
                          event.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Tujuan belajar">
                  <Input
                    value={
                      lesson.learningObjective ??
                      ""
                    }
                    onChange={(event) =>
                      updateLesson(lessonIndex, {
                        learningObjective:
                          event.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              <ContentBlock
                icon={BookOpen}
                title="Artikel Pembelajaran"
                {...(lesson.article
                  ? {
                      onRemove: () =>
                        removeArticle(
                          lessonIndex,
                        ),
                    }
                  : {})}
              >
                {lesson.article ? (
                  <>
                    <Field label="Judul artikel">
                      <Input
                        value={
                          lesson.article.title
                        }
                        onChange={(event) =>
                          updateLesson(
                            lessonIndex,
                            {
                              article: {
                                ...lesson.article!,
                                title:
                                  event.target
                                    .value,
                              },
                            },
                          )
                        }
                      />
                    </Field>

                    <Field label="Isi artikel">
                      <Textarea
                        rows={8}
                        value={
                          lesson.article.body
                        }
                        onChange={(event) =>
                          updateLesson(
                            lessonIndex,
                            {
                              article: {
                                ...lesson.article!,
                                body:
                                  event.target.value,
                              },
                            },
                          )
                        }
                        placeholder="Tulis artikel lengkap. Pisahkan paragraf dengan baris kosong."
                      />
                    </Field>
                    <p className="text-xs text-muted-foreground">Audio akan otomatis membacakan isi artikel ini melalui fitur Text-to-Speech.</p>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateLesson(
                        lessonIndex,
                        {
                          article: {
                            title: "",
                            body: "",
                          },
                        },
                      )
                    }
                  >
                    <Plus />
                    Tambah Artikel
                  </Button>
                )}
              </ContentBlock>

              <ContentBlock
                icon={Presentation}
                title="Slider Presentasi"
              >
                <div className="space-y-4">
                  {(lesson.slides ?? []).map(
                    (slide, slideIndex) => (
                      <div
                        key={slide.id}
                        className="rounded-xl border border-border bg-surface p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">
                            Slide {slideIndex + 1}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const nextSlides = (
                                lesson.slides ?? []
                              ).filter(
                                (_, index) =>
                                  index !==
                                  slideIndex,
                              );

                              updateLesson(
                                lessonIndex,
                                {
                                  slides:
                                    nextSlides,
                                },
                              );
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Judul">
                            <Input
                              value={
                                slide.title
                              }
                              onChange={(event) => {
                                const nextSlides =
                                  (
                                    lesson.slides ??
                                    []
                                  ).map(
                                    (
                                      item,
                                      index,
                                    ) =>
                                      index ===
                                      slideIndex
                                        ? {
                                            ...item,
                                            title:
                                              event
                                                .target
                                                .value,
                                          }
                                        : item,
                                  );

                                updateLesson(
                                  lessonIndex,
                                  {
                                    slides:
                                      nextSlides,
                                  },
                                );
                              }}
                            />
                          </Field>

                          <Field label="URL gambar">
                            <Input
                              value={
                                slide.imageUrl
                              }
                              onChange={(event) => {
                                const nextSlides =
                                  (
                                    lesson.slides ??
                                    []
                                  ).map(
                                    (
                                      item,
                                      index,
                                    ) =>
                                      index ===
                                      slideIndex
                                        ? {
                                            ...item,
                                            imageUrl:
                                              event
                                                .target
                                                .value,
                                          }
                                        : item,
                                  );

                                updateLesson(
                                  lessonIndex,
                                  {
                                    slides:
                                      nextSlides,
                                  },
                                );
                              }}
                            />
                          </Field>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Field label="Isi slide">
                            <Textarea
                              rows={4}
                              value={
                                slide.body
                              }
                              onChange={(event) => {
                                const nextSlides =
                                  (
                                    lesson.slides ??
                                    []
                                  ).map(
                                    (
                                      item,
                                      index,
                                    ) =>
                                      index ===
                                      slideIndex
                                        ? {
                                            ...item,
                                            body:
                                              event
                                                .target
                                                .value,
                                          }
                                        : item,
                                  );

                                updateLesson(
                                  lessonIndex,
                                  {
                                    slides:
                                      nextSlides,
                                  },
                                );
                              }}
                            />
                          </Field>

                          <Field label="Poin-poin (satu per baris)">
                            <Textarea
                              rows={4}
                              value={slide.bullets.join(
                                "\n",
                              )}
                              onChange={(event) => {
                                const nextSlides =
                                  (
                                    lesson.slides ??
                                    []
                                  ).map(
                                    (
                                      item,
                                      index,
                                    ) =>
                                      index ===
                                      slideIndex
                                        ? {
                                            ...item,
                                            bullets:
                                              event.target.value.split(
                                                "\n",
                                              ),
                                          }
                                        : item,
                                  );

                                updateLesson(
                                  lessonIndex,
                                  {
                                    slides:
                                      nextSlides,
                                  },
                                );
                              }}
                            />
                          </Field>
                        </div>

                        <div className="mt-3">
                          <Field label="Catatan presenter">
                            <Textarea
                              rows={2}
                              value={
                                slide.speakerNotes
                              }
                              onChange={(event) => {
                                const nextSlides =
                                  (
                                    lesson.slides ??
                                    []
                                  ).map(
                                    (
                                      item,
                                      index,
                                    ) =>
                                      index ===
                                      slideIndex
                                        ? {
                                            ...item,
                                            speakerNotes:
                                              event
                                                .target
                                                .value,
                                          }
                                        : item,
                                  );

                                updateLesson(
                                  lessonIndex,
                                  {
                                    slides:
                                      nextSlides,
                                  },
                                );
                              }}
                            />
                          </Field>
                        </div>
                      </div>
                    ),
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      addSlide(lessonIndex)
                    }
                  >
                    <Plus />
                    Tambah Slide
                  </Button>
                </div>
              </ContentBlock>

              <ContentBlock
                icon={Layers3}
                title="Flashcards"
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  {(lesson.flashcards ?? []).map(
                    (card, cardIndex) => (
                      <div
                        key={card.id}
                        className="rounded-xl border border-border bg-surface p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">
                            Flashcard{" "}
                            {cardIndex + 1}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const nextFlashcards =
                                (
                                  lesson.flashcards ??
                                  []
                                ).filter(
                                  (_, index) =>
                                    index !==
                                    cardIndex,
                                );

                              updateLesson(
                                lessonIndex,
                                {
                                  flashcards:
                                    nextFlashcards,
                                },
                              );
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <Field label="Pertanyaan">
                            <Textarea
                              rows={3}
                              value={
                                card.question
                              }
                              onChange={(event) => {
                                const nextFlashcards =
                                  (
                                    lesson.flashcards ??
                                    []
                                  ).map(
                                    (
                                      item,
                                      index,
                                    ) =>
                                      index ===
                                      cardIndex
                                        ? {
                                            ...item,
                                            question:
                                              event
                                                .target
                                                .value,
                                          }
                                        : item,
                                  );

                                updateLesson(
                                  lessonIndex,
                                  {
                                    flashcards:
                                      nextFlashcards,
                                  },
                                );
                              }}
                            />
                          </Field>

                          <Field label="Jawaban">
                            <Textarea
                              rows={4}
                              value={card.answer}
                              onChange={(event) => {
                                const nextFlashcards =
                                  (
                                    lesson.flashcards ??
                                    []
                                  ).map(
                                    (
                                      item,
                                      index,
                                    ) =>
                                      index ===
                                      cardIndex
                                        ? {
                                            ...item,
                                            answer:
                                              event
                                                .target
                                                .value,
                                          }
                                        : item,
                                  );

                                updateLesson(
                                  lessonIndex,
                                  {
                                    flashcards:
                                      nextFlashcards,
                                  },
                                );
                              }}
                            />
                          </Field>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    addFlashcard(lessonIndex)
                  }
                >
                  <Plus />
                  Tambah Flashcard
                </Button>
              </ContentBlock>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function ContentBlock({
  icon: Icon,
  title,
  children,
  onRemove,
}: {
  icon: typeof BookOpen;
  title: string;
  children: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />

          <h3 className="text-sm font-semibold">
            {title}
          </h3>
        </div>

        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Hapus ${title}`}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
