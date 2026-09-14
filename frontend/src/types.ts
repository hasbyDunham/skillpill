/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ReferenceItem {
  id: string;
  type:
    | 'Book'
    | 'Scientific Journal'
    | 'Research Paper'
    | 'Article'
    | 'Official Website'
    | 'YouTube'
    | 'Podcast';
  title: string;
  author?: string;
  url?: string;
  description?: string;
}

export interface PracticeChallenge {
  id: string;
  title: string;
  instruction: string;
  scenario: string;
  interactiveType:
    | 'input'
    | 'multiple-choice'
    | 'checklist';
  options?: string[];
  correctOption?: string;
  checklistItems?: string[];
  sampleAnswer?: string;
}

export interface ReflectionPrompt {
  id: string;
  question: string;
  context: string;
  helperPrompt: string;
}

export interface LessonArticle {
  title?: string;
  body: string;
}

export interface LessonAudio {
  title?: string;
  url?: string;
  transcript?: string;
  duration?: string;
}

export interface LessonSlide {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  speakerNotes?: string;
  imageUrl?: string;
}

export interface LessonFlashcard {
  id: string;
  question: string;
  answer: string;
}

export interface Lesson {
  id: string;
  title: string;
  learningObjective?: string;

  article?: LessonArticle;
  audio?: LessonAudio;
  slides?: LessonSlide[];
  flashcards?: LessonFlashcard[];
}

export interface SkillOverview {
  headline: string;
  description: string;
  author: string;

  problem?: string;
  transformation?: string;

  benefits: string[];

  evidence?: string;

  testimonials: Array<{
    name: string;
    role: string;
    quote: string;
    rating: number;
    avatar?: string;
  }>;

  references: ReferenceItem[];

  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export interface SkillSummary {
  content: string;

  /**
   * Personal Reflection tetap menjadi bagian dari data skill.
   * Nanti ditampilkan sebagai section tersendiri di learner flow.
   */
  reflection: ReflectionPrompt[];

  /**
   * Dipertahankan untuk compatibility dengan data lama.
   * Tidak menjadi bagian wajib dari flow utama versi baru.
   */
  actionPlan: Array<{
    step: string;
    description: string;
    timeline: string;
  }>;

  relatedSkills: string[];
}

export interface SkillPill {
  id: string;
  title: string;
  category: string;

  estimatedTime: string;
  difficulty: DifficultyLevel;

  price: number;
  coverUrl: string;
  accessLevel: 'all' | 'pro';

  isCustom?: boolean;

  overview: SkillOverview;

  /**
   * Lesson dibuat dinamis.
   * Setiap lesson boleh memiliki content yang berbeda-beda.
   */
  lessons: Lesson[];

  /**
   * Practice bersifat optional.
   */
  practice: PracticeChallenge[];

  /**
   * Summary tetap tersedia.
   * Personal Reflection berada di dalam summary.reflection.
   */
  summary: SkillSummary;
}

export interface SkillPillPlan {
  key: 'free' | 'pro';
  name: string;
  price: number;
  benefits: string[];
  isActive: boolean;
}

// Commerce types

export interface CartItem {
  skillId: string;
  title: string;
  price: number;
  coverUrl: string;
}

export interface Order {
  id: string;
  userId: string;

  items: Array<{
    skillId: string;
    title: string;
    price: number;
  }>;

  total: number;
  discount: number;

  paymentMethod: string;

  status: 'paid' | 'pending' | 'failed' | 'expired' | 'refunded';

  orderType?: 'skill' | 'plan';

  planKey?: 'free' | 'pro' | null;

  createdAt: string;

  couponCode?: string;
}

// User Progress types

export interface UserProgress {
  skillId: string;

  /**
   * Hanya lesson yang benar-benar dibuat admin yang dihitung.
   */
  completedLessons: string[];

  isCompleted: boolean;

  completedAt?: string;

  practiceAnswers: Record<string, string | string[]>;

  practiceResults?: Record<string, { isCorrect?: boolean; savedAt?: string }>;

  reflectionAnswers: Record<string, string>;

  bookmarked: boolean;

  favorite: boolean;

  notes?: Record<string, string>;

  learningSeconds?: number;

  lastStudiedAt?: string | null;

  xpEarned?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;

  phone?: string;

  role: 'user' | 'admin';

  plan?: 'free' | 'pro';

  proExpiresAt?: string | null;

  joinedAt: string;

  purchasedSkillPills: string[];

  wishlist: string[];

  collections: Array<{
    id: string;
    title: string;
    description: string;
    skills: string[];
  }>;

  learningHours: number;

  completedSkillCount: number;

  totalXp: number;

  streakDays: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  plan: 'free' | 'pro';
  xp: number;
  completedSkills: number;
  user: UserProfile;
}
