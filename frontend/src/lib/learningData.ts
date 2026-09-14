import type {
  DifficultyLevel,
  Lesson,
  LessonAudio,
  LessonFlashcard,
  LessonSlide,
  PracticeChallenge,
  ReflectionPrompt,
  ReferenceItem,
  SkillPill,
} from '../types';

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};

const text = (value: unknown) => typeof value === 'string' ? value : '';
const list = (value: unknown) => Array.isArray(value) ? value : [];

function normalizeAudio(value: unknown): LessonAudio | undefined {
  const source = record(value);
  const audio = {
    title: text(source.title) || undefined,
    url: text(source.url) || undefined,
    transcript: text(source.transcript) || undefined,
    duration: text(source.duration) || undefined,
  };
  return audio.url || audio.transcript ? audio : undefined;
}

function normalizeSlides(value: unknown): LessonSlide[] | undefined {
  const slides = list(value).map((item, index) => {
    const source = record(item);
    return {
      id: text(source.id) || `slide-${index + 1}`,
      title: text(source.title),
      body: text(source.body),
      bullets: list(source.bullets).map(text).filter(Boolean),
      speakerNotes: text(source.speakerNotes) || undefined,
      imageUrl: text(source.imageUrl) || undefined,
    };
  }).filter((slide) => slide.title || slide.body || slide.bullets?.length || slide.imageUrl);
  return slides.length ? slides : undefined;
}

function normalizeFlashcards(value: unknown): LessonFlashcard[] | undefined {
  const flashcards = list(value).map((item, index) => {
    const source = record(item);
    return {
      id: text(source.id) || `flashcard-${index + 1}`,
      question: text(source.question),
      answer: text(source.answer),
    };
  }).filter((card) => card.question && card.answer);
  return flashcards.length ? flashcards : undefined;
}

function normalizePractice(value: unknown): PracticeChallenge[] {
  return list(value).map((item, index) => {
    const source = record(item);
    const interactiveType = text(source.interactiveType);
    return {
      id: text(source.id) || `practice-${index + 1}`,
      title: text(source.title),
      instruction: text(source.instruction),
      scenario: text(source.scenario),
      interactiveType: ['input', 'multiple-choice', 'checklist'].includes(interactiveType)
        ? interactiveType as PracticeChallenge['interactiveType']
        : 'input',
      options: list(source.options).map(text).filter(Boolean),
      correctOption: text(source.correctOption) || undefined,
      checklistItems: list(source.checklistItems).map(text).filter(Boolean),
      sampleAnswer: text(source.sampleAnswer) || undefined,
    };
  }).filter((practice) => practice.title && practice.instruction);
}

function normalizeReflections(value: unknown): ReflectionPrompt[] {
  return list(value).map((item, index) => {
    const source = record(item);
    return {
      id: text(source.id) || `reflection-${index + 1}`,
      question: text(source.question),
      context: text(source.context),
      helperPrompt: text(source.helperPrompt),
    };
  }).filter((reflection) => reflection.question);
}

export function normalizeLesson(value: unknown, index: number): Lesson {
  const source = record(value);
  const articleSource = record(source.article);
  const articleBody = text(articleSource.body);
  return {
    id: text(source.id) || `lesson-${index + 1}`,
    title: text(source.title),
    learningObjective: text(source.learningObjective) || undefined,
    article: articleBody ? { title: text(articleSource.title) || undefined, body: articleBody } : undefined,
    audio: normalizeAudio(source.audio),
    slides: normalizeSlides(source.slides),
    flashcards: normalizeFlashcards(source.flashcards),
  };
}

export function normalizeSkill(value: unknown): SkillPill {
  const source = record(value);
  const overview = record(source.overview);
  const summary = record(source.summary);
  const difficulty = text(source.difficulty);

  return {
    id: text(source.id),
    title: text(source.title),
    category: text(source.category),
    estimatedTime: text(source.estimatedTime),
    difficulty: (['Beginner', 'Intermediate', 'Advanced'].includes(difficulty) ? difficulty : 'Beginner') as DifficultyLevel,
    price: typeof source.price === 'number' ? source.price : Number(source.price) || 0,
    coverUrl: text(source.coverUrl),
    accessLevel: source.accessLevel === 'pro' ? 'pro' : 'all',
    isCustom: Boolean(source.isCustom),
    overview: {
      headline: text(overview.headline) || text(source.shortDescription),
      description: text(overview.description) || text(source.landingDescription) || text(source.transformation),
      author: text(overview.author) || text(source.author),
      problem: text(overview.problem) || text(source.problem) || undefined,
      transformation: text(overview.transformation) || text(source.transformation) || undefined,
      benefits: list(overview.benefits ?? source.whyLearnThis).map(text).filter(Boolean),
      evidence: text(overview.evidence) || text(source.evidence) || undefined,
      testimonials: list(overview.testimonials ?? source.testimonials) as SkillPill['overview']['testimonials'],
      references: list(overview.references ?? source.references) as ReferenceItem[],
      faq: list(overview.faq ?? source.faq) as SkillPill['overview']['faq'],
    },
    lessons: list(source.lessons).map(normalizeLesson),
    practice: normalizePractice(source.practice),
    summary: {
      content: text(summary.content) || (typeof source.summary === 'string' ? source.summary : ''),
      reflection: normalizeReflections(summary.reflection ?? source.reflection),
      actionPlan: list(summary.actionPlan ?? source.actionPlan) as SkillPill['summary']['actionPlan'],
      relatedSkills: list(summary.relatedSkills ?? source.relatedSkills).map(text).filter(Boolean),
    },
  };
}

export const normalizeSkills = (value: unknown): SkillPill[] =>
  list(value).map(normalizeSkill);
