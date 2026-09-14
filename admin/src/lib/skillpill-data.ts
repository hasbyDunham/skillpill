export type SkillLabel =
  | "Bestseller"
  | "Baru"
  | "Bundle"
  | "Draft";

export type LearningSlide = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  speakerNotes: string;
  imageUrl: string;
};

export type LearningFlashcard = {
  id: string;
  question: string;
  answer: string;
};

export type LearningLessonArticle = {
  title: string;
  body: string;
};

export type LearningLessonAudio = {
  title: string;
  url: string;
  transcript: string;
  duration: string;
};

export type LearningLessonContent = {
  /**
   * ID lesson.
   */
  id: string;

  /**
   * Judul lesson.
   */
  title: string;

  /**
   * Tujuan belajar lesson.
   */
  learningObjective?: string;

  /**
   * Semua content bersifat optional.
   *
   * Satu lesson bisa hanya memiliki:
   * - Article
   *
   * atau:
   * - Article + Audio
   *
   * atau:
   * - Audio + Flashcards
   *
   * dst.
   */
  article?: LearningLessonArticle;

  audio?: LearningLessonAudio;

  slides?: LearningSlide[];

  flashcards?: LearningFlashcard[];
};

export type LearningReflection = {
  id: string;
  question: string;
  context: string;
  helperPrompt: string;
};

export type LearningPractice = {
  id: string;
  title: string;
  instruction: string;
  scenario: string;

  interactiveType:
    | "input"
    | "multiple-choice"
    | "checklist";

  options?: string[];

  correctOption?: string;

  checklistItems?: string[];

  sampleAnswer?: string;
};

export type SkillOverview = {
  headline: string;
  description: string;
  author: string;

  problem?: string;

  transformation?: string;

  benefits: string[];

  evidence?: string;

  testimonials: unknown[];

  references: unknown[];

  faq: unknown[];
};

export type SkillSummary = {
  /**
   * Ringkasan materi.
   */
  content: string;

  /**
   * Personal Reflection.
   *
   * Data tetap berada di dalam SkillSummary,
   * tetapi nanti ditampilkan sebagai section tersendiri.
   */
  reflection: LearningReflection[];

  /**
   * Compatibility dengan data lama.
   * Tidak dijadikan tahap wajib dalam flow baru.
   */
  actionPlan: unknown[];

  relatedSkills: string[];
};

export type Skill = {
  id: string;

  title: string;

  image: string;

  price: number;

  label: SkillLabel;

  category: string;

  accessLevel: "all" | "pro";

  /**
   * Contoh:
   * "3 lesson • 20 mins • Beginner"
   *
   * Jumlah lesson harus mengikuti lessons.length.
   */
  digitalContent: string;

  overview: SkillOverview;

  /**
   * Lesson benar-benar dinamis.
   */
  lessons: LearningLessonContent[];

  /**
   * Practice optional.
   */
  practice: LearningPractice[];

  /**
   * Summary + Personal Reflection.
   */
  summary: SkillSummary;

  orders: number;

  revenue: number;
};

const normalizeRupiah = (value: number) =>
  value > 0 && value <= 1_000
    ? Math.round(value * 15_000)
    : Math.round(value);

export const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normalizeRupiah(value));

export const compactRupiah = (value: number) => {
  const amount = normalizeRupiah(value);

  if (amount >= 1_000_000_000) {
    return `Rp${(
      amount / 1_000_000_000
    ).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (amount >= 1_000_000) {
    return `Rp${(
      amount / 1_000_000
    ).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  if (amount >= 1_000) {
    return `Rp${(
      amount / 1_000
    ).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} rb`;
  }

  return rupiah(amount);
};
