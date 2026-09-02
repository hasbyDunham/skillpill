export type SkillLabel = "Bestseller" | "Baru" | "Bundle" | "Draft";

export type LearningSlide = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  speakerNotes: string;
  imageUrl: string;
};

export type LearningBentoCard = {
  id: string;
  label: string;
  title: string;
  content: string;
  tone: "default" | "accent" | "dark" | "success" | "warning";
  wide: boolean;
};

export type LearningLessonContent = {
  id: string;
  title: string;
  learningObjective: string;
  article: { title: string; body: string };
  audio: { title: string; url: string; transcript: string; duration: string };
  slides: LearningSlide[];
  bentoCards: LearningBentoCard[];
};

export type Skill = {
  id: string;
  title: string;
  image: string;
  landingHeadline: string;
  landingDescription: string;
  price: number;
  label: SkillLabel;
  category: string;
  digitalContent: string;
  lessons: LearningLessonContent[];
  orders: number;
  revenue: number;
};

const normalizeRupiah = (value: number) =>
  value > 0 && value <= 1_000 ? Math.round(value * 15_000) : Math.round(value);

export const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normalizeRupiah(value));

export const compactRupiah = (value: number) => {
  const amount = normalizeRupiah(value);
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb`;
  return rupiah(amount);
};
