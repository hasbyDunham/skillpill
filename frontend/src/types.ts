/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ReferenceItem {
  id: string;
  type: 'Book' | 'Scientific Journal' | 'Research Paper' | 'Article' | 'Official Website' | 'YouTube' | 'Podcast';
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
  interactiveType: 'input' | 'multiple-choice' | 'checklist' | 'roleplay';
  options?: string[]; // For multiple choice
  correctOption?: string; // For validation
  checklistItems?: string[]; // For checklist practice
  sampleAnswer?: string;
}

export interface ReflectionPrompt {
  id: string;
  question: string;
  context: string;
  helperPrompt: string;
}

export interface Lesson {
  id: string;
  title: string;
  learningObjective: string;
  bigPicture: string;
  definition: string;
  whyItMatters: string;
  analogy: string;
  howItWorks: string[];
  visualType: 'diagram' | 'workflow' | 'formula' | 'comparison' | 'timeline';
  visualData: {
    title?: string;
    nodes?: Array<{ label: string; sub: string; color?: string }>;
    connections?: string[];
    leftTitle?: string;
    leftItems?: string[];
    rightTitle?: string;
    rightItems?: string[];
    steps?: Array<{ label: string; desc: string }>;
  };
  realExample: string;
  commonMistakes: string[];
  keyTakeaway: string;
  checklist: string[];
  practiceChallenge: {
    title: string;
    instruction: string;
    sampleAnswer?: string;
  };
  reflectionPrompt: string;
  summary: string;
  article?: {
    title?: string;
    body: string;
  };
  audio?: {
    title?: string;
    url?: string;
    transcript?: string;
    duration?: string;
  };
  slides?: Array<{
    id: string;
    title: string;
    body: string;
    bullets?: string[];
    speakerNotes?: string;
    imageUrl?: string;
  }>;
  bentoCards?: Array<{
    id: string;
    label: string;
    title?: string;
    content: string;
    tone?: 'default' | 'accent' | 'dark' | 'success' | 'warning';
    wide?: boolean;
  }>;
}

export interface SkillPill {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  estimatedTime: string; // e.g., "30 mins"
  difficulty: DifficultyLevel;
  price: number; // e.g., 1.00
  coverUrl: string;
  isCustom?: boolean;
  author: string;
  problem: string;
  transformation: string;
  whyLearnThis: string[];
  evidence: string;
  testimonials: Array<{
    name: string;
    role: string;
    quote: string;
    rating: number;
    avatar?: string;
  }>;
  references: ReferenceItem[];
  faq: Array<{ question: string; answer: string }>;
  curriculum: Array<{ id: string; title: string; duration: string }>;
  lessons: Lesson[];
  practice: PracticeChallenge[];
  reflection: ReflectionPrompt[];
  summary: string;
  actionPlan: Array<{ step: string; description: string; timeline: string }>;
  relatedSkills: string[]; // IDs of related SkillPills
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
  status: 'paid' | 'pending' | 'refunded';
  createdAt: string;
  couponCode?: string;
}

// User Profile types
export interface UserProgress {
  skillId: string;
  completedLessons: string[]; // Lesson IDs
  isCompleted: boolean;
  completedAt?: string;
  practiceAnswers: Record<string, string>; // PracticeId -> answer
  reflectionAnswers: Record<string, string>; // ReflectionId -> answer
  bookmarked: boolean;
  favorite: boolean;
  notes?: Record<string, string>; // LessonId -> notes
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  plan?: 'free' | 'pro';
  joinedAt: string;
  purchasedSkillPills: string[]; // SkillPill IDs
  wishlist: string[]; // SkillPill IDs
  collections: Array<{
    id: string;
    title: string;
    description: string;
    skills: string[]; // SkillPill IDs
  }>;
  learningHours: number;
  completedSkillCount: number;
  streakDays: number;
}
