/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, BookOpen, Layers, CheckCircle2, Volume2, Sliders, ChevronLeft, ChevronRight, 
  Sparkles, HelpCircle, Send, Play, Pause, Bookmark, Heart, FileText, Award, RefreshCw, AlertCircle,
  Minimize2, Maximize2, MousePointer, Flame, Check, BookmarkCheck, Calendar, Bell, ExternalLink, Info,
  Compass, Map, Lock, Target, Brain, Zap, FileCheck, BookMarked, GraduationCap, Clock, Globe, Star, Menu, X, Loader2
} from 'lucide-react';
import { SkillPill, Lesson, UserProgress } from '../types';
import { Language } from '../lib/translations';
import { getSkillCover } from '../lib/skillImage';
import { localizeCategory, localizeDifficulty, localizeDuration } from '../lib/localization';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

// Modular Sub-components
import LearningContract from './player/LearningContract';
import PersonalizationPanel, { PersonalizationConfig } from './player/PersonalizationPanel';
import LiveAnalytics from './player/LiveAnalytics';
import ReferenceCenter from './player/ReferenceCenter';

interface LearningPlayerProps {
  skill: SkillPill;
  progress: UserProgress;
  onBack: () => void;
  onUpdateProgress: (data: Partial<UserProgress>) => Promise<boolean>;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
  onOpenFeedback?: () => void;
  resumeFromProgress?: boolean;
}

type LearningTab = 
  | 'overview' 
  | 'contract' 
  | 'journey' 
  | 'lessons' 
  | 'practice' 
  | 'reflection' 
  | 'actionPlan' 
  | 'summary' 
  | 'references' 
  | 'completed';

type ContentMode = 'flashcards' | 'presentation' | 'reading' | 'listen';
type InlineSaveStatus = { tone: 'success' | 'error'; message: string };

export default function LearningPlayer({ 
  skill, 
  progress, 
  onBack, 
  onUpdateProgress,
  lang = 'ID',
  onLanguageChange,
  onOpenFeedback,
  resumeFromProgress = false,
}: LearningPlayerProps) {
  const lessons = skill.lessons;
  const practices = skill.practice || [];
  const learningBenefits = skill.overview.benefits;
  // Toast state for like & save feedback
  const [likeToast, setLikeToast] = useState<string | null>(null);

  const handleToggleFavorite = async () => {
    const newFav = !progress.favorite;
    await onUpdateProgress({ favorite: newFav });
    setLikeToast(
      newFav 
        ? (lang === 'ID' ? 'Skill ditambahkan ke Favorit! ❤️' : 'Added to Favorites! ❤️') 
        : (lang === 'ID' ? 'Skill dihapus dari Favorit' : 'Removed from Favorites')
    );
    setTimeout(() => setLikeToast(null), 2500);
  };

  const handleToggleBookmark = async () => {
    const newBM = !progress.bookmarked;
    await onUpdateProgress({ bookmarked: newBM });
    setLikeToast(
      newBM 
        ? (lang === 'ID' ? 'Skill berhasil Disimpan! 🔖' : 'Skill Bookmarked! 🔖') 
        : (lang === 'ID' ? 'Simpanan Skill dihapus' : 'Bookmark Removed')
    );
    setTimeout(() => setLikeToast(null), 2500);
  };

  // Navigation
  const [activeTab, setActiveTab] = useState<LearningTab>('overview');
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [contentMode, setContentMode] = useState<ContentMode>('flashcards');
  const [isContractCommitted, setIsContractCommitted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!resumeFromProgress) return;
    const nextLessonIndex = lessons.findIndex((lesson) => !(progress.completedLessons || []).includes(lesson.id));
    setActiveLessonIdx(nextLessonIndex >= 0 ? nextLessonIndex : 0);
    setActiveTab('lessons');
  }, [skill.id, resumeFromProgress]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeTab]);

  // Floating Overlays toggles
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [learningTimeOpen, setLearningTimeOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Personalization Config
  const [personalization, setPersonalization] = useState<PersonalizationConfig>({
    theme: 'light',
    density: 'balanced',
    fontSize: 'medium',
    fontFamily: 'modern',
  });

  // Notes & AI Coaching
  const [notesText, setNotesText] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'model', text: string}>>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Practice answers are saved and evaluated by the backend.
  const [userPracticeAnswers, setUserPracticeAnswers] = useState<Record<string, string | string[]>>(progress.practiceAnswers || {});
  const [userReflectionAnswers, setUserReflectionAnswers] = useState<Record<string, string>>(progress.reflectionAnswers || {});
  const [noteSaveStatus, setNoteSaveStatus] = useState<InlineSaveStatus | null>(null);
  const [practiceSaveStatus, setPracticeSaveStatus] = useState<Record<string, InlineSaveStatus | undefined>>({});
  const [practiceSectionStatus, setPracticeSectionStatus] = useState<InlineSaveStatus | null>(null);
  const [reflectionSaveStatus, setReflectionSaveStatus] = useState<Record<string, InlineSaveStatus | undefined>>({});

  useEffect(() => {
    setUserPracticeAnswers(progress.practiceAnswers || {});
    setUserReflectionAnswers(progress.reflectionAnswers || {});
  }, [skill.id]);

  // Matching game interactive state (Practice Module)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  // Flashcards state (Practice Module)
  const [flashcardFlipped, setFlashcardFlipped] = useState<Record<string, boolean>>({});

  // Action Plan interactive triggers
  const [actionPlanCheck, setActionPlanCheck] = useState<Record<string, boolean>>({});
  const [isReminderSet, setIsReminderSet] = useState<Record<string, boolean>>({});

  const referencesList = skill.overview.references;

  // Rating & Testimonial State (Post-completion)
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userTestimonial, setUserTestimonial] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string>('');
  const [hasSubmittedReview, setHasSubmittedReview] = useState<boolean>(false);

  // Fetch existing review if any
  useEffect(() => {
    if (!progress.isCompleted) {
      return;
    }

    let isMounted = true;
    async function loadMyReview() {
      try {
        const res = await apiFetch(`/api/skills/${skill.id}/my-review`);
        if (res.ok) {
          const data = await res.json();
          if (data.review && isMounted) {
            setUserRating(data.review.rating || 5);
            setUserTestimonial(data.review.review || '');
            setHasSubmittedReview(true);
          }
        }
      } catch (e) {
        // silent
      }
    }
    loadMyReview();
    return () => { isMounted = false; };
  }, [progress.isCompleted, skill.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSuccessMsg('');
    setReviewErrorMsg('');

    if (!progress.isCompleted) {
      setReviewErrorMsg(
        lang === 'ID'
          ? 'Selesaikan pembelajaran sebelum memberikan rating dan testimoni.'
          : 'Please complete the learning journey before submitting a rating and testimonial.',
      );
      return;
    }

    if (!userRating || userRating < 1 || userRating > 5) {
      setReviewErrorMsg(lang === 'ID' ? 'Silakan pilih rating 1-5 bintang.' : 'Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!userTestimonial.trim()) {
      setReviewErrorMsg(lang === 'ID' ? 'Silakan tulis testimoni ulasan Anda.' : 'Please write your review / testimonial.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/skills/${skill.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          review: userTestimonial.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || (lang === 'ID' ? 'Gagal mengirim ulasan.' : 'Failed to submit review.'));
      }
      setHasSubmittedReview(true);
      setReviewSuccessMsg(data.message || (lang === 'ID' ? 'Rating & testimoni berhasil disimpan!' : 'Rating & testimonial saved successfully!'));
      setTimeout(() => setReviewSuccessMsg(''), 4000);
    } catch (err: any) {
      setReviewErrorMsg(err.message || (lang === 'ID' ? 'Terjadi kesalahan sistem.' : 'A system error occurred.'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Speech Synthesis Narration (Listen Mode)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [voiceLanguage, setVoiceLanguage] = useState<'id-ID' | 'en-US'>('id-ID');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [speechElapsed, setSpeechElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [learningSeconds, setLearningSeconds] = useState(progress.learningSeconds || 0);
  const pendingLearningSeconds = useRef(0);

  useEffect(() => {
    pendingLearningSeconds.current = 0;
    setLearningSeconds(progress.learningSeconds || 0);
  }, [skill.id]);

  useEffect(() => {
    setLearningSeconds(progress.learningSeconds || 0);
  }, [progress.learningSeconds]);

  useEffect(() => {
    let lastTick = Date.now();

    const recordElapsedTime = (includeJustHiddenTime = false) => {
      if (!includeJustHiddenTime && document.visibilityState !== 'visible') return;
      const now = Date.now();
      const elapsed = Math.floor((now - lastTick) / 1000);
      lastTick = now;
      if (elapsed <= 0) return;

      pendingLearningSeconds.current += elapsed;
      setLearningSeconds((current) => current + elapsed);
    };

    const saveElapsedTime = () => {
      const seconds = Math.min(pendingLearningSeconds.current, 60);
      if (seconds <= 0) return;
      pendingLearningSeconds.current -= seconds;
      void onUpdateProgress({ learningSeconds: seconds });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordElapsedTime(true);
        saveElapsedTime();
      }
      lastTick = Date.now();
    };

    const interval = window.setInterval(() => {
      recordElapsedTime();
      if (pendingLearningSeconds.current >= 30) saveElapsedTime();
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      recordElapsedTime();
      saveElapsedTime();
    };
  }, [skill.id, onUpdateProgress]);

  // Reading Mode state
  const [bookmarkedLessons, setBookmarkedLessons] = useState<string[]>([]);
  const [activeHighlights, setActiveHighlights] = useState<Record<string, boolean>>({});

  // Presentation Mode state
  const [isFullscreenSimulated, setIsFullscreenSimulated] = useState(false);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [presenterNotesOpen, setPresenterNotesOpen] = useState(false);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  // Sync state
  const activeLesson: Lesson | undefined = lessons[activeLessonIdx];
  const lessonSlides = activeLesson?.slides ?? [];
  const activeSlide = lessonSlides[Math.min(activeSlideIdx, Math.max(0, lessonSlides.length - 1))];
  const lessonContentModes: Array<{ mode: ContentMode; label: string }> = [
    ...(activeLesson?.flashcards?.length ? [{ mode: 'flashcards' as const, label: 'Bento' }] : []),
    ...(lessonSlides.length ? [{ mode: 'presentation' as const, label: lang === 'ID' ? 'Slide' : 'Slides' }] : []),
    ...(activeLesson?.article ? [{ mode: 'reading' as const, label: lang === 'ID' ? 'Artikel' : 'Reading' }] : []),
    ...(activeLesson?.article ? [{ mode: 'listen' as const, label: 'Audio' }] : []),
  ];
  const activeContentMode = lessonContentModes.some(({ mode }) => mode === contentMode)
    ? contentMode
    : lessonContentModes[0]?.mode;
  const articleTitle = activeLesson?.article?.title || activeLesson?.title || '';
  const articleParagraphs = (activeLesson?.article?.body || '')
    .split(/\n\s*\n/)
    .filter(Boolean);
  const speechDuration = Math.max(1, Math.ceil(((activeLesson?.article?.body || '').trim().split(/\s+/).filter(Boolean).length / 150) * 60 / playbackSpeed));
  const formatSpeechTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

  const completedLessons = Array.from(new Set(
    (progress.completedLessons || []).filter((lessonId) => lessons.some((lesson) => lesson.id === lessonId)),
  ));
  const reflections = skill.summary.reflection || [];
  const hasPractice = practices.length > 0;
  const hasReflections = reflections.length > 0;
  const hasSummary = Boolean(skill.summary.content?.trim());
  const practiceComplete = hasPractice && practices.every((practice) => {
    const answer = progress.practiceAnswers?.[practice.id];

    if (practice.interactiveType === 'multiple-choice') {
      return progress.practiceResults?.[practice.id]?.isCorrect === true;
    }

    if (practice.interactiveType === 'checklist') {
      const items = practice.checklistItems || [];
      return items.length > 0
        && Array.isArray(answer)
        && items.every((item) => answer.includes(item));
    }

    return typeof answer === 'string' && answer.trim() !== '';
  });
  const reflectionsComplete = hasReflections && reflections.every((reflection) => Boolean(progress.reflectionAnswers?.[reflection.id]));
  const totalProgressItems = lessons.length + Number(hasPractice) + Number(hasReflections) + Number(hasSummary);
  const completedProgressItems = completedLessons.length
    + Number(practiceComplete)
    + Number(reflectionsComplete)
    + Number(Boolean(progress.isCompleted && hasSummary));
  const progressPercentage = totalProgressItems
    ? Math.round((completedProgressItems / totalProgressItems) * 100)
    : 0;
  const isCompleted100 = lessons.length > 0 && completedLessons.length >= lessons.length;
  const isUnlocked = true;
  const completedLessonIds = new Set(completedLessons);
  const firstIncompleteLessonIdx = lessons.findIndex((lesson) => !completedLessonIds.has(lesson.id));
  const isLessonAvailable = (index: number) =>
    index >= 0 &&
    index < lessons.length &&
    isUnlocked &&
    lessons.slice(0, index).every((lesson) => completedLessonIds.has(lesson.id));

  const openLesson = (index: number) => {
    if (!isLessonAvailable(index)) return;
    setActiveLessonIdx(index);
    setActiveTab('lessons');
  };

  const beginNextLesson = () => {
    if (firstIncompleteLessonIdx !== -1) {
      openLesson(firstIncompleteLessonIdx);
    } else if (hasPractice) {
      setActiveTab('practice');
    } else if (hasReflections) {
      setActiveTab('reflection');
    } else if (hasSummary) {
      setActiveTab('summary');
    }
  };

  useEffect(() => {
    if (isCompleted100) {
      setIsContractCommitted(true);
    }
  }, [isCompleted100]);

  useEffect(() => {
    if (activeLesson) {
      const firstAvailableMode = lessonContentModes[0]?.mode;
      if (firstAvailableMode) setContentMode(firstAvailableMode);
      setNotesText(progress.notes?.[activeLesson.id] || '');
      setActiveSlideIdx(0);
      setSpeechElapsed(0);
      if (synth) synth.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.load();
      }
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [skill.id, activeLesson?.id]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
      audioRef.current?.pause();
    };
  }, [synth]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Sleep timer ticker
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      if (synth) synth.cancel();
      audioRef.current?.pause();
      setIsSpeaking(false);
      setSleepTimer(null);
      return;
    }
    const interval = setInterval(() => {
      setSleepTimer((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer]);

  useEffect(() => {
    if (!isSpeaking || isPaused) return;
    const interval = window.setInterval(() => {
      setSpeechElapsed((elapsed) => Math.min(speechDuration, elapsed + 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPaused, isSpeaking, speechDuration]);

  // Speech synthesis play logic
  const handleSpeak = () => {
    if (!activeLesson) return;

    if (!synth) return;

    if (isSpeaking) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
      return;
    }

    synth.cancel();

    const textToRead = activeLesson.article?.body;
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = playbackSpeed;
    utterance.lang = voiceLanguage;
    const preferredVoice = synth.getVoices().find((voice) =>
      voice.lang.toLowerCase().startsWith(voiceLanguage.slice(0, 2)),
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechElapsed(speechDuration);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    setSpeechElapsed(0);
    setIsSpeaking(true);
    setIsPaused(false);
    synth.speak(utterance);
  };

  const handleStopSpeak = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synth) {
      synth.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeechElapsed(0);
  };

  const handleDownloadCertificate = () => {
    const escapeHtml = (value: string) => {
      const entities: Record<string, string> = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      };
      return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
    };
    const completedAt = new Date().toLocaleDateString(lang === 'ID' ? 'id-ID' : 'en-US');
    const certificateHtml = `<!doctype html><html lang="${lang === 'ID' ? 'id' : 'en'}"><head><meta charset="utf-8"><title>Certificate - ${escapeHtml(skill.title)}</title><style>body{font-family:Arial,sans-serif;background:#f8fbff;padding:48px;color:#172033}.certificate{max-width:760px;margin:auto;border:8px double #2563eb;padding:56px;text-align:center;background:white}.label{letter-spacing:2px;font-size:12px;color:#2563eb;font-weight:bold}.title{font-family:Georgia,serif;font-size:36px;margin:24px 0}.skill{font-size:26px;font-weight:bold}.date{margin-top:36px;color:#64748b}</style></head><body><main class="certificate"><div class="label">SKILLPILL • OFFICIAL CREDENTIAL</div><h1 class="title">${lang === 'ID' ? 'Sertifikat Penguasaan Skill' : 'Certificate of Skill Mastery'}</h1><p>${lang === 'ID' ? 'Dokumen ini menyatakan bahwa Pembelajar telah menyelesaikan pembelajaran' : 'This certifies that the Learner has completed the learning program'}</p><p class="skill">${escapeHtml(skill.title)}</p><p class="date">${lang === 'ID' ? 'Tanggal selesai' : 'Completion date'}: ${completedAt}</p></main></body></html>`;
    const url = URL.createObjectURL(new Blob([certificateHtml], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sertifikat-${skill.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Theme variable map
  const getThemeClass = () => {
    if (personalization.theme === 'dark') {
      return 'bg-stone-950 text-stone-100 border-stone-850';
    }

    switch (personalization.theme) {
      case 'sepia':
        return 'bg-[#f4ecd8] text-[#433e30] border-[#e4dcbf]';
      case 'paper':
        return 'bg-[#f0ebd4] text-stone-800 border-[#dfdac0]';
      case 'light':
      default:
        return 'bg-[#f8fbff] text-stone-900 border-stone-200';
    }
  };

  const getSubCardClass = () => {
    if (personalization.theme === 'dark') {
      return 'bg-stone-900 border-stone-800 text-stone-100';
    }

    switch (personalization.theme) {
      case 'sepia':
        return 'bg-[#ebdcb9] border-[#e4dcbf] text-[#433e30]';
      case 'paper':
        return 'bg-[#e4dfcd] border-[#dfdac0] text-stone-800';
      case 'light':
      default:
        return 'bg-white border-stone-200 text-stone-900 shadow-sm';
    }
  };

  const getTypographyClass = () => {
    return personalization.fontFamily === 'book' ? 'font-serif' : 'font-sans';
  };

  const getFontSizeClass = () => {
    switch (personalization.fontSize) {
      case 'small': return 'text-xs leading-relaxed';
      case 'large': return 'text-base md:text-lg leading-loose';
      case 'medium':
      default:
        return 'text-sm leading-relaxed';
    }
  };

  // Bookmark and Highlighting
  const handleToggleBookmarkLesson = (lessonId: string) => {
    setBookmarkedLessons(prev => 
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleToggleHighlight = (paraId: string) => {
    setActiveHighlights(prev => ({ ...prev, [paraId]: !prev[paraId] }));
  };

  // Interactive Match Handler
  const handleTermClick = (term: string) => {
    if (selectedTerm === term) {
      setSelectedTerm(null);
      return;
    }
    if (selectedTerm) {
      // Create a pair match mock
      setMatchedPairs(prev => ({ ...prev, [selectedTerm]: term }));
      setSelectedTerm(null);
    } else {
      setSelectedTerm(term);
    }
  };

  const handlePracticeSubmit = async (pId: string) => {
    const answer = userPracticeAnswers[pId];
    const hasAnswer = Array.isArray(answer)
      ? answer.length > 0
      : typeof answer === 'string' && answer.trim() !== '';
    if (!hasAnswer) {
      setPracticeSaveStatus((previous) => ({
        ...previous,
        [pId]: { tone: 'error', message: lang === 'ID' ? 'Lengkapi jawaban terlebih dahulu.' : 'Complete your answer first.' },
      }));
      return;
    }

    const answers = { ...(progress.practiceAnswers || {}), [pId]: answer };
    const saved = await onUpdateProgress({ practiceAnswers: answers });
    if (!saved) {
      setPracticeSaveStatus((previous) => ({
        ...previous,
        [pId]: { tone: 'error', message: lang === 'ID' ? 'Jawaban gagal disimpan. Silakan coba lagi.' : 'Your answer could not be saved. Please try again.' },
      }));
      return;
    }
    setPracticeSaveStatus((previous) => ({ ...previous, [pId]: undefined }));
  };

  // Reflection saving
  const handleReflectionSubmit = async (rId: string) => {
    const ans = userReflectionAnswers[rId] || '';
    if (!ans) return;

    const answers = { ...progress.reflectionAnswers, [rId]: ans };
    const saved = await onUpdateProgress({ reflectionAnswers: answers });
    setReflectionSaveStatus((previous) => ({
      ...previous,
      [rId]: saved
        ? { tone: 'success', message: lang === 'ID' ? 'Refleksi berhasil disimpan.' : 'Reflection saved.' }
        : { tone: 'error', message: lang === 'ID' ? 'Refleksi gagal disimpan. Silakan coba lagi.' : 'Your reflection could not be saved. Please try again.' },
    }));
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    const currentCompleted = [...completedLessons];
    if (!currentCompleted.includes(activeLesson.id)) {
      currentCompleted.push(activeLesson.id);
    }

    const isAllLessonsCompleted = currentCompleted.length === lessons.length;

    await onUpdateProgress({
      completedLessons: currentCompleted,
      isCompleted: progress.isCompleted || (isAllLessonsCompleted && !hasPractice && !hasReflections && !hasSummary),
    });

    if (activeLessonIdx < lessons.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
      setActiveTab('lessons');
    } else if (hasPractice) {
      setActiveTab('practice');
    } else if (hasReflections) {
      setActiveTab('reflection');
    } else if (hasSummary) {
      setActiveTab('summary');
    } else {
      setActiveTab('completed');
    }
  };

  const completeLearning = async () => {
    await onUpdateProgress({
      completedLessons,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });
    setActiveTab('completed');
  };

  // Interactive AI Coach Drawer
  const handleAskAICoach = async (mode: 'explain' | 'simplify' | 'analogy' | 'custom') => {
    if (!activeLesson) return;
    const context = {
      title: activeLesson.title,
      objective: activeLesson.learningObjective,
      details: activeLesson.article?.body || ''
    };

    let msg = '';
    if (mode === 'simplify') {
      msg = 'Explain this concept to me as if I am 12 years old.';
    } else if (mode === 'analogy') {
      msg = 'Give me another memorable metaphor to visualize this.';
    } else if (mode === 'explain') {
      msg = 'Can you describe a real-world case study where this was utilized?';
    } else {
      msg = userInput;
      setUserInput('');
    }

    if (!msg.trim()) return;

    setAiMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          lessonContext: context,
          userMessage: msg
        })
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'model', text: data.reply || 'No response from Coach.' }]);
    } catch (err: any) {
      setAiMessages(prev => [...prev, { role: 'model', text: 'Error connecting to the AI Mentor pipeline.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeLesson) return;
    const lessonIndex = activeLessonIdx;
    const updatedNotes = { ...(progress.notes || {}) };
    updatedNotes[activeLesson.id] = notesText;
    const saved = await onUpdateProgress({ notes: updatedNotes });
    if (!saved) {
      setNoteSaveStatus({ tone: 'error', message: lang === 'ID' ? 'Catatan gagal disimpan. Silakan coba lagi.' : 'Your notes could not be saved. Please try again.' });
      return;
    }
    setActiveLessonIdx(lessonIndex);
    setActiveTab('lessons');
    setNoteSaveStatus({ tone: 'success', message: lang === 'ID' ? 'Catatan berhasil disimpan.' : 'Notes saved successfully.' });
  };

  return (
    <div className={`skillpill-learning-player min-h-screen flex flex-col md:flex-row transition-colors duration-300 font-sans ${personalization.theme === 'dark' ? 'dark' : ''} ${getThemeClass()}`}>
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label={lang === 'ID' ? 'Tutup menu pembelajaran' : 'Close learning menu'}
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-[2px] md:hidden"
        />
      )}
      
      {/* 1. LEFT SIDE NAVIGATION DRAWER - ELEGANT MODERN SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(88vw,20rem)] flex-shrink-0 flex-col overflow-hidden border-r border-stone-800/80 bg-gradient-to-b from-stone-900 via-stone-925 to-stone-950 font-sans text-stone-300 shadow-xl transition-transform duration-300 md:sticky md:top-0 md:z-20 md:h-screen md:w-72 md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Header & Quick Actions */}
        <div className="p-4 border-b border-stone-800/60 bg-stone-950/40 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <button 
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-stone-800/60 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-stone-700/50 hover:border-stone-600 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-brand-500" />
            <span>{lang === 'ID' ? 'Kembali' : 'Library'}</span>
          </button>
          
          <div className="flex items-center space-x-1.5 bg-stone-900/80 p-1 rounded-lg border border-stone-800">
            <button
              onClick={handleToggleFavorite} 
              title={lang === 'ID' ? 'Sukai Skill Ini' : 'Add to Favorites'}
              className="p-1.5 rounded-md hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Heart className={`h-3.5 w-3.5 transition-all ${progress.favorite ? 'fill-red-500 text-red-500 scale-110' : 'text-stone-400 hover:text-stone-200'}`} />
            </button>
            <button 
              onClick={handleToggleBookmark} 
              title={lang === 'ID' ? 'Simpan Skill Ini' : 'Bookmark Skill'}
              className="p-1.5 rounded-md hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Bookmark className={`h-3.5 w-3.5 transition-all ${progress.bookmarked ? 'fill-brand-500 text-brand-500 scale-110' : 'text-stone-400 hover:text-stone-200'}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-md text-stone-400 hover:bg-stone-800 hover:text-white md:hidden"
              aria-label={lang === 'ID' ? 'Tutup menu' : 'Close menu'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Like/Save Feedback Toast */}
        <AnimatePresence>
          {likeToast && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-1.5 bg-brand-500/20 border-b border-brand-500/30 text-brand-300 text-[10px] font-bold text-center flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <Sparkles className="h-3 w-3 text-brand-400" />
              <span>{likeToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill Card Preview Header */}
        <div className="p-4 border-b border-stone-800/60 bg-gradient-to-br from-stone-900/90 to-stone-950/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl overflow-hidden border border-stone-700/60 shadow-md flex-shrink-0 relative group">
              <img src={getSkillCover(skill)} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-stone-900/20" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-md mb-1">
                {localizeCategory(skill.category, lang)}
              </span>
              <h3 className="text-stone-100 font-bold text-xs font-heading leading-tight truncate" title={skill.title}>
                {skill.title}
              </h3>
            </div>
          </div>
          
          {/* Enhanced Progress Indicator */}
          <div className="mt-3.5 pt-3 border-t border-stone-800/50">
            <div className="flex justify-between items-center text-[10px] mb-1.5 font-medium">
              <span className="text-stone-400 flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-brand-400" />
                {lang === 'ID' ? 'Progres' : 'Progress'}
              </span>
              <span className="font-extrabold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-[9px]">
                {progressPercentage}%
              </span>
            </div>
            <div className="bg-stone-800/90 h-1.5 w-full rounded-full overflow-hidden p-0.5 border border-stone-700/40">
              <div 
                className="bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 h-full rounded-full transition-all duration-500 shadow-sm shadow-brand-500/30"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-stone-500 mt-1.5">
              <span>{lang === 'ID' ? 'Modul Selesai' : 'Lessons Completed'}</span>
              <span className="font-bold text-stone-300 font-mono">{completedProgressItems} / {totalProgressItems}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-stone-800 bg-stone-950/50 px-3 py-2">
                <span className="block text-[9px] text-stone-500">{lang === 'ID' ? 'Pelajaran' : 'Lessons'}</span>
                <span className="mt-0.5 block font-mono text-xs font-extrabold text-stone-100">{completedLessons.length}/{lessons.length}</span>
              </div>
              <div className="rounded-xl border border-stone-800 bg-stone-950/50 px-3 py-2">
                <span className="block text-[9px] text-stone-500">{lang === 'ID' ? 'Milestone' : 'Milestones'}</span>
                <span className="mt-0.5 block font-mono text-xs font-extrabold text-stone-100">{completedProgressItems}/{totalProgressItems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Itinerary Links with Hidden Scrollbar */}
        <nav className="flex-grow p-3 space-y-1.5 text-xs overflow-y-auto no-scrollbar">
          
          {/* Step 1: Overview */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
              activeTab === 'overview' 
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm shadow-brand-500/5' 
                : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                <Compass className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">1. {lang === 'ID' ? 'Ikhtisar' : 'Overview'}</span>
            </div>
            <span className="text-[9px] font-bold text-stone-500 uppercase px-1.5 py-0.5 rounded bg-stone-800/50">{lang === 'ID' ? 'Awal' : 'Intro'}</span>
          </button>

          {/* Core Lessons Section */}
          <div className="pt-3 pb-1 border-t border-stone-800/60 my-2">
            <div className="px-2 mb-2 flex items-center justify-between text-[9px] font-extrabold text-stone-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 text-brand-500" />
                2. {lang === 'ID' ? 'Materi Inti' : 'Core Lessons'}
              </span>
              <span className="text-[9px] font-mono text-stone-500">{lessons.length} {lang === 'ID' ? 'Modul' : 'Modules'}</span>
            </div>

            <div className="space-y-1 pl-1">
              {lessons.map((less, index) => {
                const isCompleted = completedLessonIds.has(less.id);
                const isActive = activeTab === 'lessons' && activeLessonIdx === index;
                return (
                  <button
                    key={less.id}
                    disabled={!isLessonAvailable(index)}
                    onClick={() => openLesson(index)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer text-[11px] ${
                      isActive 
                        ? 'bg-brand-500/20 text-brand-200 border border-brand-500/30 font-bold shadow-sm' 
                        : 'hover:bg-stone-800/50 text-stone-400 hover:text-stone-200 border border-transparent'
                    } ${!isLessonAvailable(index) ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className={`text-[10px] font-mono font-bold w-4 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-stone-500'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate">{less.title}</span>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-700 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remaining Practice & Output Modules */}
          <div className="pt-2 border-t border-stone-800/60 space-y-1.5">
            <span className="px-2 text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block mb-1">
              {lang === 'ID' ? 'Penerapan & Hasil' : 'Application & Output'}
            </span>
            
            {hasPractice && (
            <button
              disabled={!isUnlocked}
              onClick={() => setActiveTab('practice')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
                activeTab === 'practice' 
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm' 
                  : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
              } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'practice' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                  <Target className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">3. {lang === 'ID' ? 'Latihan Praktik' : 'Practice'}</span>
              </div>
              {!isUnlocked ? (
                <Lock className="h-3.5 w-3.5 text-stone-500" />
              ) : (
                <span className="text-[8px] bg-brand-500/10 border border-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded font-extrabold">{lang === 'ID' ? 'AKTIF' : 'ACTIVE'}</span>
              )}
            </button>
            )}

            {hasReflections && (
            <button
              disabled={!isUnlocked}
              onClick={() => setActiveTab('reflection')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
                activeTab === 'reflection' 
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm' 
                  : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
              } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'reflection' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">{3 + (hasPractice ? 1 : 0)}. {lang === 'ID' ? 'Refleksi Pribadi' : 'Personal Reflection'}</span>
              </div>
              {!isUnlocked && <Lock className="h-3.5 w-3.5 text-stone-500" />}
            </button>
            )}

            {hasSummary && (
            <button
              disabled={!isUnlocked}
              onClick={() => setActiveTab('summary')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
                activeTab === 'summary' 
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm' 
                  : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
              } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'summary' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                  <FileCheck className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">{3 + (hasPractice ? 1 : 0) + (hasReflections ? 1 : 0)}. {lang === 'ID' ? 'Ringkasan Eksekutif' : 'Executive Summary'}</span>
              </div>
              {!isUnlocked && <Lock className="h-3.5 w-3.5 text-stone-500" />}
            </button>
            )}

          </div>
        </nav>

        {/* Bottom Quick Card / Footer */}
        <div className="p-3 border-t border-stone-800/80 bg-stone-950/60">
          <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-2 text-stone-400">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              <span>{lang === 'ID' ? 'Estimasi Waktu Belajar' : 'Estimated Learning Time'}: <strong className="text-stone-200 font-bold">{localizeDuration(skill.estimatedTime, lang)}</strong></span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {localizeDifficulty(skill.difficulty, lang)}
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className={`sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-3 md:hidden ${personalization.theme === 'dark' ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-700 dark:border-stone-700 dark:text-stone-200"
            aria-label={lang === 'ID' ? 'Buka menu pembelajaran' : 'Open learning menu'}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-brand-500">{activeTab === 'lessons' ? `${lang === 'ID' ? 'Pelajaran' : 'Lesson'} ${activeLessonIdx + 1}/${lessons.length}` : skill.category}</p>
            <p className="truncate text-xs font-bold">{skill.title}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            {onLanguageChange && (
              <button onClick={() => onLanguageChange(lang === 'EN' ? 'ID' : 'EN')} className="rounded-lg border border-stone-200 px-2 py-1.5 text-[10px] font-bold dark:border-stone-700">{lang}</button>
            )}
          </div>
        </header>

        {activeTab === 'lessons' && (
          <nav className={`sticky top-14 z-20 flex flex-wrap gap-1 border-b px-3 py-2 md:hidden ${personalization.theme === 'dark' ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`} aria-label={lang === 'ID' ? 'Mode pembelajaran' : 'Learning modes'}>
            {lessonContentModes.map(({ mode, label }) => (
              <button key={mode} type="button" onClick={() => setContentMode(mode)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold ${activeContentMode === mode ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>{label}</button>
            ))}
          </nav>
        )}
        
        {/* HEADER TOOLBAR: MODE SWITCHERS & FLOATING TRIGGERS */}
        <header className={`hidden h-14 border-b px-4 sm:px-6 md:flex items-center justify-between flex-shrink-0 z-10 font-sans transition-colors ${
          personalization.theme === 'dark'
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
              {activeTab === 'lessons' 
                ? `${lang === 'ID' ? 'Pelajaran' : 'Lesson'} ${activeLessonIdx + 1} / ${lessons.length}` 
                : activeTab.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Display Modes (Only on lessons tab) */}
            {activeTab === 'lessons' && (
              <div className={`hidden sm:flex items-center p-0.5 rounded-lg border ${
                personalization.theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200'
              }`}>
                {lessonContentModes.map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => setContentMode(mode)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                      activeContentMode === mode
                        ? (personalization.theme === 'dark' ? 'bg-stone-700 text-stone-100 shadow-sm' : 'bg-white shadow-sm text-stone-900')
                        : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Quick action triggers */}
            <div className="flex items-center gap-1.5">
              
              {/* Language Switcher */}
              {onLanguageChange && (
                <button
                  onClick={() => onLanguageChange(lang === 'EN' ? 'ID' : 'EN')}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    personalization.theme === 'dark'
                      ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700' 
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                  title={lang === 'ID' ? 'Ganti Bahasa (English / Indonesia)' : 'Switch Language'}
                >
                  <Globe className="h-3.5 w-3.5 text-brand-500" />
                  <span>{lang}</span>
                </button>
              )}

              {/* Personalization Toggle */}
              <button
                onClick={() => { setPersonalizationOpen(!personalizationOpen); setLearningTimeOpen(false); }}
                title={lang === 'ID' ? 'Pengaturan tampilan' : 'Visual settings'}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  personalizationOpen 
                    ? 'bg-brand-500/20 text-brand-500' 
                    : (personalization.theme === 'dark' ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-500 hover:bg-stone-100')
                }`}
              >
                <Sliders className="h-4.5 w-4.5" />
              </button>

              {/* Learning Time Toggle */}
              <button
                onClick={() => { setLearningTimeOpen(!learningTimeOpen); setPersonalizationOpen(false); }}
                title={lang === 'ID' ? 'Waktu belajar' : 'Learning time'}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${learningTimeOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                <Clock className="h-4.5 w-4.5" />
              </button>

              {/* AI Coach Sidebar toggle */}
              <button
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow shadow-brand-500/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Coach</span>
              </button>
            </div>

          </div>
        </header>

        {isSpeaking && activeTab === 'lessons' && activeLesson && (
          <div className="sticky top-[6.75rem] z-20 flex items-center gap-3 border-b border-brand-500/20 bg-stone-950 px-3 py-2 text-white shadow-sm md:top-0 md:px-6">
            <Volume2 className="h-4 w-4 flex-shrink-0 text-brand-400" />
            <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold">{activeLesson.title}</p><p className="text-[9px] text-stone-400">{lang === 'ID' ? 'Membacakan materi Reading saat berpindah tampilan' : 'Reading material continues while switching views'}</p></div>
            <button type="button" onClick={handleSpeak} className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white">{isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>
            <button type="button" onClick={handleStopSpeak} className="rounded-lg bg-stone-800 px-2 py-1 text-[9px] font-bold">{lang === 'ID' ? 'Hentikan' : 'Stop'}</button>
          </div>
        )}

        {/* PERSISTENT CONTENT CONTAINER */}
        <div className="flex-grow overflow-y-auto relative w-full max-w-5xl mx-auto px-3 py-5 sm:p-6 md:p-10">
          
          {/* FLOATING ACTION BOXES */}
          <AnimatePresence>
            {personalizationOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed inset-x-3 top-16 z-40 sm:absolute sm:inset-x-auto sm:top-4 sm:right-6 sm:z-20"
              >
                <PersonalizationPanel 
                  config={personalization} 
                  onChange={(up) => setPersonalization(prev => ({ ...prev, ...up }))} 
                  onClose={() => setPersonalizationOpen(false)}
                  lang={lang}
                />
              </motion.div>
            )}

            {learningTimeOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed inset-x-3 top-16 z-40 sm:absolute sm:inset-x-auto sm:top-4 sm:right-6 sm:z-20"
              >
                <LiveAnalytics 
                  learningSeconds={learningSeconds}
                  onClose={() => setLearningTimeOpen(false)}
                  lang={lang}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* DYNAMIC LEARNING PHASES */}
          <div className={`${getTypographyClass()} ${getFontSizeClass()}`}>
            
            {/* PHASE 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                
                {/* Top Header Badge & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 border border-brand-500/20">
                      <Sparkles className="h-3 w-3" />
                      <span>{lang === 'ID' ? 'Ikhtisar Skill' : 'Skill Overview'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
                      {localizeCategory(skill.category, lang)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleToggleFavorite}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        progress.favorite
                          ? 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${progress.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{progress.favorite ? (lang === 'ID' ? 'Disukai' : 'Liked') : (lang === 'ID' ? 'Sukai' : 'Like')}</span>
                    </button>

                    <button
                      onClick={handleToggleBookmark}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        progress.bookmarked
                          ? 'bg-brand-500/10 border-brand-500/30 text-brand-500 dark:text-brand-400'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${progress.bookmarked ? 'fill-brand-500 text-brand-500' : ''}`} />
                      <span>{progress.bookmarked ? (lang === 'ID' ? 'Tersimpan' : 'Saved') : (lang === 'ID' ? 'Simpan' : 'Save')}</span>
                    </button>
                  </div>
                </div>

                {/* Hero Card with Cover Image & Overview Banner */}
                <div className={`rounded-3xl border overflow-hidden shadow-lg transition-all ${
                  personalization.theme === 'dark'
                    ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border-stone-800'
                    : 'bg-gradient-to-br from-white via-brand-50/20 to-stone-50 border-stone-200/90'
                }`}>
                  <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full overflow-hidden group">
                    <img 
                      src={getSkillCover(skill)} 
                      alt={skill.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
                    
                    {/* Floating Overlay Badge on Hero Image */}
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 z-10">
                      <div className="space-y-1 max-w-xl">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400 bg-stone-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-brand-500/30 inline-block mb-1">
                          {lang === 'ID' ? 'Mikro Skill 30 Menit' : '30-Minute Micro Skill'}
                        </span>
                        <h1 className="text-xl sm:text-3xl font-extrabold font-heading text-white tracking-tight leading-tight">
                          {skill.title}
                        </h1>
                        <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                          {skill.overview.headline}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-stone-950/80 backdrop-blur-md p-2 rounded-2xl border border-stone-800 flex-shrink-0">
                        <div className="text-center px-2.5 border-r border-stone-800">
                          <span className="text-brand-400 font-extrabold text-xs block leading-none">{localizeDuration(skill.estimatedTime, lang)}</span>
                          <span className="text-[8px] text-stone-400 uppercase font-semibold">{lang === 'ID' ? 'Estimasi Waktu' : 'Est. Time'}</span>
                        </div>
                        <div className="text-center px-2.5 border-r border-stone-800">
                          <span className="text-stone-200 font-extrabold text-xs block leading-none">{lessons.length}</span>
                          <span className="text-[8px] text-stone-400 uppercase font-semibold">{lang === 'ID' ? 'Modul' : 'Lessons'}</span>
                        </div>
                        <div className="text-center px-2.5">
                          <span className="text-emerald-400 font-extrabold text-xs block leading-none">{localizeDifficulty(skill.difficulty, lang)}</span>
                          <span className="text-[8px] text-stone-400 uppercase font-semibold">{lang === 'ID' ? 'Level' : 'Level'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key KPI Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Estimasi Waktu Belajar' : 'Estimated Learning Time'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{localizeDuration(skill.estimatedTime, lang)}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <Target className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Tingkat Kesulitan' : 'Difficulty'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{localizeDifficulty(skill.difficulty, lang)}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Materi Modul' : 'Lessons'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{lessons.length} {lang === 'ID' ? 'Pelajaran' : 'Lessons'}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <Brain className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Tantangan Praktik' : 'Challenges'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{practices.length} {lang === 'ID' ? 'Latihan' : 'Practices'}</p>
                  </div>
                </div>

                {/* Section: Problem vs Solution (Crimson vs Emerald Split Cards) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-brand-500" />
                    <span>{lang === 'ID' ? 'Masalah & Transformasi Penguasaan' : 'The Friction & Master Transformation'}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* The Friction Problem Card */}
                    <div className="bg-red-500/5 dark:bg-red-950/20 p-5 rounded-2xl border border-red-500/20 space-y-2.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>{lang === 'ID' ? 'Masalah Kunci (The Problem)' : 'The Friction Problem'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-bold">{lang === 'ID' ? 'MASALAH' : 'PAIN POINT'}</span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                        {skill.overview.problem}
                      </p>
                    </div>

                    {/* The Solution / Transformation Card */}
                    <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20 space-y-2.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          <span>{lang === 'ID' ? 'Transformasi Hasil' : 'The Master Transformation'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">{lang === 'ID' ? 'HASIL' : 'OUTCOME'}</span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                        {skill.overview.transformation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Out-of-the-Box Value & Benefits */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-500" />
                      <span>{lang === 'ID' ? 'Nilai & Manfaat yang Akan Anda Dapatkan' : 'Benefits & Out-of-the-Box Value'}</span>
                    </h3>
                    <span className="text-[10px] text-stone-500 font-mono">30-Min ROI</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {learningBenefits.map((benefit, i) => (
                      <div 
                        key={i} 
                        className={`p-5 rounded-2xl border space-y-2 transition-all hover:scale-[1.01] ${
                          personalization.theme === 'dark'
                            ? 'bg-stone-900/80 border-stone-800 text-stone-200' 
                            : 'bg-white border-stone-200 text-stone-800 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-brand-500 text-xs font-mono bg-brand-500/10 px-2 py-0.5 rounded-md">
                            0{i+1}.
                          </span>
                          <Sparkles className="h-3.5 w-3.5 text-brand-400/60" />
                        </div>
                        <p className="text-xs font-medium leading-relaxed font-sans">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Research Evidence Citation Box */}
                <div className={`p-5 rounded-2xl border space-y-2 relative overflow-hidden ${
                  personalization.theme === 'dark'
                    ? 'bg-brand-500/5 border-brand-500/20 text-stone-200' 
                    : 'bg-gradient-to-r from-brand-50/80 to-stone-50 border-brand-500/20 text-stone-800 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 text-brand-500 font-extrabold text-[10px] uppercase tracking-widest">
                    <Award className="h-4 w-4" />
                    <span>{lang === 'ID' ? 'Validasi Ilmiah & Bukti Pembelajaran' : 'Evidence-Backed Validation'}</span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-serif italic">
                    "{skill.overview.evidence}"
                  </p>
                </div>

                {/* Section: Curriculum Syllabus Preview */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-brand-500" />
                        <span>{lang === 'ID' ? 'Silabus Kurikulum Skill' : 'Curriculum Syllabus'}</span>
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {lang === 'ID' ? 'Ringkasan materi langkah demi langkah yang siap Anda pelajari.' : 'Step-by-step micro lessons ready for immediate mastery.'}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-lg">
                      {lessons.length} {lang === 'ID' ? 'Modul Interaktif' : 'Interactive Modules'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {lessons.map((less, index) => {
                      const isCompleted = completedLessonIds.has(less.id);

                      return (
                        <div
                          key={less.id}
                          onClick={() => openLesson(index)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                            personalization.theme === 'dark'
                              ? 'bg-stone-900/60 border-stone-800 hover:border-brand-500/40'
                              : 'bg-white border-stone-200 hover:border-brand-500/40 shadow-sm'
                          } ${!isLessonAvailable(index) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start space-x-3.5 min-w-0">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-mono font-extrabold text-xs flex-shrink-0 mt-0.5 ${
                              isCompleted 
                                ? 'bg-emerald-500 text-stone-950' 
                                : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                            }`}>
                              {isCompleted ? <Check className="h-4 w-4" /> : String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-brand-500 transition-colors">
                                {less.title}
                              </h4>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                                <span className="font-semibold">{lang === 'ID' ? 'Tujuan:' : 'Objective:'}</span> {less.learningObjective}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 text-xs flex-shrink-0 self-end sm:self-center">
                            {isCompleted ? (
                              <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{lang === 'ID' ? 'SELESAI' : 'MASTERED'}</span>
                              </span>
                            ) : isLessonAvailable(index) ? (
                              <span className="text-[10px] font-extrabold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>{lang === 'ID' ? 'Mulai Modul' : 'Start Lesson'}</span>
                                <ChevronRight className="h-3 w-3" />
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                <span>{lang === 'ID' ? 'Selesaikan modul sebelumnya' : 'Complete the previous lesson'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Primary Call To Action Bar */}
                <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    <p className="font-bold text-stone-900 dark:text-stone-200">
                      {lang === 'ID' ? 'Siap Menguasai Skill Ini dalam 30 Menit?' : 'Ready to Master This Skill in 30 Minutes?'}
                    </p>
                    <p className="text-[11px]">
                      {lang === 'ID' ? 'Tandatangani kontrak belajar untuk memulai perjalanan interaktif.' : 'Sign the learning contract to unlock step-by-step interactive modules.'}
                    </p>
                  </div>

                  <button
                    onClick={beginNextLesson}
                    className="w-full sm:w-auto px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-brand-500/20 group"
                  >
                    <span>{lang === 'ID' ? 'Mulai Lesson' : 'Start Lessons'}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

              </div>
            )}

            {/* PHASE 2: LEARNING CONTRACT */}
            {activeTab === 'contract' && (
              <LearningContract 
                skill={skill} 
                isCommitted={isContractCommitted} 
                lang={lang}
                onCommit={(name) => {
                  setIsContractCommitted(true);
                  setActiveTab('journey');
                }} 
              />
            )}

            {/* PHASE 3: LEARNING JOURNEY ROADMAP */}
            {activeTab === 'journey' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    {lang === 'ID' ? 'Modul 3: Peta Pembelajaran' : 'Module 3: Map'}
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    {lang === 'ID' ? 'Alur Pembelajaran' : 'The Learning Journey'}
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {lang === 'ID' ? 'Ikuti alur pembelajaran secara bertahap, dari konsep hingga penerapan nyata.' : 'View the visual skill pipelines. Progress step-by-step from conceptual theory to active practical mastery.'}
                  </p>
                </div>

                <div className="relative border-l-2 border-stone-200 pl-6 space-y-8 py-4 max-w-lg mx-auto">
                  
                  {/* Step 1: Why This Skill Matters */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-emerald-500 border-emerald-500 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase">1. {lang === 'ID' ? 'Mengapa Ini Penting' : 'Why This Matters'}</h4>
                      <p className="text-[11px] text-stone-500 leading-normal mt-0.5">{lang === 'ID' ? 'Pahami materi secara berurutan, kuasai konsep, lalu terapkan pada situasi nyata.' : 'Follow the lessons in order, master each concept, and apply it to a real situation.'}</p>
                    </div>
                  </div>

                  {/* Step 2: Core Concept Lessons */}
                  {lessons.map((less, idx) => {
                    const isCompleted = completedLessonIds.has(less.id);
                    return (
                      <div key={less.id} className="relative">
                        <div className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500 flex items-center justify-center' : 'bg-white border-stone-300'}`}>
                          {isCompleted && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-stone-900 uppercase">2. {lang === 'ID' ? 'Pelajaran' : 'Lesson'}: {less.title}</h4>
                            {isCompleted && <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{lang === 'ID' ? 'DIKUASAI' : 'MASTERED'}</span>}
                          </div>
                          <p className="text-[11px] text-stone-500 leading-normal mt-0.5">{lang === 'ID' ? 'Tujuan' : 'Goal'}: {less.learningObjective}</p>
                          <button
                            disabled={!isLessonAvailable(idx)}
                            onClick={() => openLesson(idx)}
                            className="text-[10px] text-brand-600 hover:text-brand-700 font-extrabold mt-1.5 cursor-pointer block disabled:cursor-not-allowed disabled:text-stone-400"
                          >
                            {isLessonAvailable(idx) ? (lang === 'ID' ? 'Buka Pelajaran →' : 'Launch Lesson Card →') : (lang === 'ID' ? 'Selesaikan pelajaran sebelumnya terlebih dahulu' : 'Complete previous lesson first')}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Step 3: Sandbox practicing */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-white border-stone-300" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase">3. {lang === 'ID' ? 'Latihan Praktik' : 'Practice Sandbox'}</h4>
                      <p className="text-[11px] text-stone-500 leading-normal mt-0.5">{lang === 'ID' ? 'Uji pemahaman melalui latihan interaktif dengan dukungan AI.' : 'Test your understanding through interactive exercises with AI support.'}</p>
                    </div>
                  </div>

                  {/* Step 4: Field Action Plan */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-white border-stone-300" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase">4. {lang === 'ID' ? 'Rencana Tindakan' : 'Action Plan'}</h4>
                      <p className="text-[11px] text-stone-500 leading-normal mt-0.5">{lang === 'ID' ? 'Susun target untuk hari ini, minggu ini, dan bulan ini.' : 'Set targets for today, this week, and this month.'}</p>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={beginNextLesson}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {lang === 'ID' ? 'Masuk ke Materi Inti' : 'Enter Core Lessons'}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 4: CORE LESSON WORKSPACE */}
            {activeTab === 'lessons' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {!activeLesson && (
                  <div className={`${getSubCardClass()} rounded-2xl border p-6 text-sm text-stone-500`}>
                    {lang === 'ID' ? 'Belum ada lesson untuk skill ini.' : 'This skill has no lessons yet.'}
                  </div>
                )}
                
                {/* 4A. FLASHCARD MODE */}
                {activeLesson?.flashcards?.length && activeContentMode === 'flashcards' && (
                  <article className="mx-auto max-w-5xl space-y-5">
                    <header className={`${getSubCardClass()} rounded-3xl border p-6 sm:p-8`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                          <BookOpen className="h-3.5 w-3.5" />
                          {lang === 'ID' ? 'Pelajaran' : 'Lesson'} {String(activeLessonIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400">{lang === 'ID' ? 'Kartu Belajar' : 'Flashcards'}</span>
                      </div>
                      <h2 className="mt-5 text-3xl font-extrabold font-heading tracking-tight leading-tight text-stone-950 dark:text-white sm:text-4xl">
                        {activeLesson.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-500 dark:text-stone-300">
                        <span className="font-bold text-stone-800 dark:text-stone-100">{lang === 'ID' ? 'Tujuan belajar:' : 'Learning objective:'}</span> {activeLesson.learningObjective}
                      </p>
                    </header>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {activeLesson.flashcards.map((card, index) => (
                          <button
                            type="button"
                            key={card.id}
                            onClick={() => setFlashcardFlipped((current) => ({ ...current, [card.id]: !current[card.id] }))}
                            className={`${getSubCardClass()} min-h-40 rounded-2xl border p-5 text-left sm:p-6`}
                          >
                            <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand-500">Flashcard {index + 1}</span>
                            <p className="mt-3 text-sm font-semibold leading-relaxed">
                              {flashcardFlipped[card.id] ? card.answer : card.question}
                            </p>
                            <span className="mt-5 block text-[9px] font-bold uppercase text-stone-400">
                              {flashcardFlipped[card.id]
                                ? (lang === 'ID' ? 'Jawaban · ketuk untuk melihat pertanyaan' : 'Answer · tap to view question')
                                : (lang === 'ID' ? 'Pertanyaan · ketuk untuk melihat jawaban' : 'Question · tap to view answer')}
                            </span>
                          </button>
                      ))}
                    </div>

                  </article>
                )}

                {/* 4B. PRESENTATION MODE */}
                {activeLesson && activeSlide && activeContentMode === 'presentation' && (
                  <div 
                    onMouseMove={(e) => {
                      if (!isLaserActive) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setLaserPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }}
                    className={`relative ${isFullscreenSimulated ? 'fixed inset-0 z-50 bg-stone-950 text-stone-100 p-4 sm:p-10 flex flex-col justify-between' : 'bg-stone-900 border border-stone-800 p-4 sm:p-8 rounded-2xl text-stone-200 space-y-6 min-h-[350px] flex flex-col justify-between'}`}
                  >
                    
                    {/* Floating simulated laser pointer dot */}
                    {isLaserActive && (
                      <div 
                        className="absolute w-3.5 h-3.5 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] pointer-events-none z-30 animate-pulse transition-all duration-75"
                        style={{ left: laserPos.x, top: laserPos.y }}
                      />
                    )}

                    {/* Slide Top bar */}
                    <div className="flex justify-between items-center border-b border-stone-800 pb-3 flex-wrap gap-2 text-stone-400">
                      <span className="text-[9px] font-mono tracking-widest uppercase">{lang === 'ID' ? `Presentasi · Modul ${activeLessonIdx + 1}` : `Presentation · Module ${activeLessonIdx + 1}`} · {activeSlideIdx + 1}/{lessonSlides.length}</span>
                      <div className="flex items-center gap-3">
                        
                        {/* Laser pointer trigger */}
                        <button
                          onClick={() => setIsLaserActive(!isLaserActive)}
                          className={`px-2.5 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition-all ${isLaserActive ? 'bg-red-500 text-white shadow shadow-red-500/20' : 'bg-stone-800 hover:bg-stone-700 text-stone-300'}`}
                        >
                          🔴 {lang === 'ID' ? 'Penunjuk Laser' : 'Laser Pointer'}
                        </button>

                        {/* Fullscreen simulated trigger */}
                        <button
                          onClick={() => setIsFullscreenSimulated(!isFullscreenSimulated)}
                          className="p-1 hover:bg-stone-800 rounded cursor-pointer"
                        >
                          {isFullscreenSimulated ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Slide Core Content */}
                    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6">
                      {activeSlide.imageUrl && <img src={activeSlide.imageUrl} alt="" className="mb-5 max-h-64 w-full rounded-xl object-cover" />}
                      <h2 className="text-center text-2xl font-extrabold font-heading text-white">{activeSlide.title}</h2>
                      {activeSlide.body && <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-center text-sm leading-relaxed text-stone-300">{activeSlide.body}</p>}
                      {activeSlide.bullets?.length ? (
                        <ul className="mx-auto mt-5 max-w-xl space-y-2 text-left text-xs text-stone-300">
                          {activeSlide.bullets.map((bullet, index) => <li key={index} className="flex gap-3 rounded-lg bg-stone-950/40 p-3"><span className="font-bold text-brand-400">{String(index + 1).padStart(2, '0')}</span><span>{bullet}</span></li>)}
                        </ul>
                      ) : null}
                    </div>

                    {/* Presenter Speaker Notes Drawer */}
                    <div className="border-t border-stone-800 pt-3">
                      <button
                        onClick={() => setPresenterNotesOpen(!presenterNotesOpen)}
                        className="text-[10px] font-mono uppercase font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                      >
                        {lang === 'ID' ? 'Catatan Presenter' : 'Presenter Notes'} {presenterNotesOpen ? '−' : '+'}
                      </button>
                      {presenterNotesOpen && activeSlide.speakerNotes && (
                        <p className="mt-2 text-[11px] text-stone-400 font-sans leading-relaxed bg-stone-950/20 p-3 rounded-lg border border-stone-800 italic">
                          {activeSlide.speakerNotes}
                        </p>
                      )}
                    </div>

                    {/* Slide Navigation footer */}
                    <div className="flex justify-between items-center text-xs text-stone-400 pt-3 border-t border-stone-800">
                      <div className="flex gap-1.5">{lessonSlides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveSlideIdx(index)} aria-label={`Slide ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === activeSlideIdx ? 'w-6 bg-brand-500' : 'w-1.5 bg-stone-700'}`} />)}</div>
                      <div className="flex gap-2">
                        <button
                          disabled={activeSlideIdx === 0}
                          onClick={() => setActiveSlideIdx((index) => Math.max(0, index - 1))}
                          className="px-2.5 py-1 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded disabled:opacity-50"
                        >
                          {lang === 'ID' ? 'Sebelumnya' : 'Previous'}
                        </button>
                        <button
                          disabled={activeSlideIdx >= lessonSlides.length - 1}
                          onClick={() => setActiveSlideIdx((index) => Math.min(lessonSlides.length - 1, index + 1))}
                          className="px-2.5 py-1 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded disabled:opacity-50"
                        >
                          {lang === 'ID' ? 'Berikutnya' : 'Next'}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* 4C. IMMERSIVE READING MODE */}
                {activeLesson?.article && activeContentMode === 'reading' && (
                  <article className="prose max-w-2xl mx-auto space-y-6 font-sans">
                    <div className="flex justify-between items-center border-b border-stone-200/50 pb-3">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">{lang === 'ID' ? 'Pembaca Buku Interaktif' : 'Interactive Book Reader'}</span>
                      <div className="flex gap-2">
                        {/* Highlights highlight key */}
                        <button
                          onClick={() => handleToggleBookmarkLesson(activeLesson.id)}
                          className="text-xs text-stone-500 hover:text-stone-900 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Bookmark className={`h-4 w-4 ${bookmarkedLessons.includes(activeLesson.id) ? 'fill-brand-500 text-brand-500' : ''}`} />
                          <span>{lang === 'ID' ? 'Simpan halaman' : 'Bookmark page'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs leading-relaxed text-stone-700">
                      <h1 className="font-heading text-3xl font-extrabold text-stone-950 tracking-tight leading-tight sm:text-4xl">{articleTitle}</h1>
                      {articleParagraphs.map((paragraph, index) => {
                        const highlightKey = `${activeLesson.id}-article-${index}`;
                        return (
                          <p
                            key={highlightKey}
                            onClick={() => handleToggleHighlight(highlightKey)}
                            className={`whitespace-pre-line rounded p-1.5 text-sm leading-7 cursor-pointer transition-colors ${activeHighlights[highlightKey] ? 'bg-yellow-150 text-stone-900 border-l-2 border-yellow-500 pl-3 font-semibold' : 'hover:bg-stone-100/50'}`}
                            title={lang === 'ID' ? 'Klik untuk menandai' : 'Click to highlight'}
                          >
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>
                  </article>
                )}

                {/* 4D. SYNTHETIC LISTEN MODE */}
                {activeLesson?.article && activeContentMode === 'listen' && (
                  <div className="bg-stone-900 text-stone-200 p-5 sm:p-8 rounded-2xl border border-stone-800 space-y-6 max-w-2xl mx-auto font-sans">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-brand-400" />
                        <div>
                          <h4 className="text-base font-bold text-white">{activeLesson.title}</h4>
                          <span className="text-[10px] text-stone-500">{lang === 'ID' ? 'Text-to-Speech otomatis dari materi Artikel' : 'Automatic Text-to-Speech from the Reading material'}</span>
                        </div>
                      </div>

                      {/* Sleep Timer Display */}
                      {sleepTimer !== null && (
                        <div className="text-[9px] font-mono text-brand-500 bg-brand-500/10 px-2.5 py-0.5 rounded">
                          {lang === 'ID' ? 'Timer' : 'Sleep Timer'}: {Math.floor(sleepTimer / 60)}:{(sleepTimer % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Animated Waveform Visualizer (CSS wave flexbars) */}
                    <div className="h-12 bg-stone-950/60 rounded-xl flex gap-1 items-end justify-center py-3 px-6 shadow-inner">
                      {[1.2, 2.5, 1.8, 3.2, 0.8, 1.5, 2.8, 2.1, 1.1, 2.9, 0.5, 1.8].map((mul, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1 rounded bg-brand-400 transition-all duration-300 ${isSpeaking && !isPaused ? 'animate-pulse' : ''}`}
                          style={{ 
                            height: isSpeaking && !isPaused ? `${Math.min(100, Math.round(30 * mul))}%` : '20%',
                            animationDelay: `${idx * 100}ms`
                          }}
                        />
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400">
                        <span>{lang === 'ID' ? 'Progres pembacaan' : 'Reading progress'}</span>
                        <span>{formatSpeechTime(speechElapsed)} / {formatSpeechTime(speechDuration)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-800">
                        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-1000" style={{ width: `${Math.min(100, (speechElapsed / speechDuration) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Audio Customization Parameters */}
                    <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-stone-500 uppercase">{lang === 'ID' ? 'Pilihan Voice' : 'Voice language'}</span>
                        <select
                          value={voiceLanguage}
                          onChange={(e) => {
                            handleStopSpeak();
                            setVoiceLanguage(e.target.value as 'id-ID' | 'en-US');
                          }}
                          className="w-full p-2 border border-stone-800 bg-stone-950 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-500 text-stone-300"
                        >
                          <option value="id-ID">Bahasa Indonesia</option>
                          <option value="en-US">English</option>
                        </select>
                      </div>
                      
                      {/* Voice speed selector */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-stone-500 uppercase">{lang === 'ID' ? 'Kecepatan Suara' : 'Speech Rate'}</span>
                        <select
                          value={playbackSpeed}
                          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                          className="w-full p-2 border border-stone-800 bg-stone-950 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-500 text-stone-300"
                        >
                          <option value="0.75">0.75x {lang === 'ID' ? 'Lambat' : 'Slow'}</option>
                          <option value="1.0">1.0x Normal</option>
                          <option value="1.25">1.25x {lang === 'ID' ? 'Sedang' : 'Fluid'}</option>
                          <option value="1.5">1.5x {lang === 'ID' ? 'Cepat' : 'Rapid'}</option>
                          <option value="2.0">2.0x {lang === 'ID' ? 'Sangat cepat' : 'Fast'}</option>
                        </select>
                      </div>

                      {/* Sleep Timer setup */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-stone-500 uppercase">{lang === 'ID' ? 'Pengatur Waktu' : 'Sleep Timer'}</span>
                        <select
                          value={sleepTimer === null ? 'off' : sleepTimer.toString()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSleepTimer(val === 'off' ? null : Number(val));
                          }}
                          className="w-full p-2 border border-stone-800 bg-stone-950 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-500 text-stone-300"
                        >
                          <option value="off">{lang === 'ID' ? 'Tanpa Pengatur Waktu' : 'No Timer'}</option>
                          <option value="300">5 {lang === 'ID' ? 'Menit' : 'Minutes'}</option>
                          <option value="600">10 {lang === 'ID' ? 'Menit' : 'Minutes'}</option>
                          <option value="900">15 {lang === 'ID' ? 'Menit' : 'Minutes'}</option>
                          <option value="1800">30 {lang === 'ID' ? 'Menit' : 'Minutes'}</option>
                        </select>
                      </div>

                    </div>

                    {/* Play / pause buttons */}
                    <div className="flex justify-center items-center gap-4 pt-2">
                      <button
                        onClick={handleSpeak}
                        className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full cursor-pointer shadow shadow-brand-500/10 flex items-center justify-center"
                      >
                        {isSpeaking && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      {isSpeaking && (
                        <button
                          onClick={handleStopSpeak}
                          className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs rounded-lg cursor-pointer"
                        >
                          {lang === 'ID' ? 'Hentikan Pemutaran' : 'Stop Playback'}
                        </button>
                      )}
                    </div>

                  </div>
                )}

                {/* PERSISTENT KNOWLEDGE VAULT: DRAWER NOTES WRITER */}
                <div className={`${getSubCardClass()} p-5 rounded-2xl border space-y-3`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-stone-950 uppercase">{lang === 'ID' ? 'Catatan Pengetahuan Saya' : 'My Knowledge Vault'}</h4>
                      <p className="text-[9px] text-stone-500 leading-none">{lang === 'ID' ? 'Tulis ringkasan agar lebih mudah diingat' : 'Draft a summary for long-term retention'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="px-3 py-1 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      {lang === 'ID' ? 'Simpan Catatan' : 'Commit Notes'}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={notesText}
                    onChange={(e) => {
                      setNotesText(e.target.value);
                      setNoteSaveStatus(null);
                    }}
                    placeholder={lang === 'ID' ? 'Tulis ringkasan dan poin penting Anda...' : 'Write your summary and key takeaways...'}
                    className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff] text-stone-800"
                  />
                  {noteSaveStatus && (
                    <div className={`p-3 rounded-xl border text-xs font-sans ${noteSaveStatus.tone === 'success' ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      {noteSaveStatus.message}
                    </div>
                  )}
                </div>

                {/* Footer Next button controls */}
                <div className="pt-6 border-t border-stone-250/30 flex justify-between items-center">
                  <button
                    disabled={activeLessonIdx === 0}
                    onClick={() => setActiveLessonIdx(activeLessonIdx - 1)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-stone-700 font-bold cursor-pointer disabled:opacity-40"
                  >
                    {lang === 'ID' ? 'Pelajaran Sebelumnya' : 'Previous Lesson'}
                  </button>
                  <button
                    onClick={handleCompleteLesson}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>{activeLessonIdx === lessons.length - 1 ? (hasPractice ? (lang === 'ID' ? 'Lanjut ke Latihan' : 'Continue to Practice') : hasReflections ? (lang === 'ID' ? 'Lanjut ke Refleksi' : 'Continue to Reflection') : (lang === 'ID' ? 'Lanjut ke Ringkasan' : 'Continue to Summary')) : (lang === 'ID' ? 'Selesaikan & Lanjutkan' : 'Complete & Continue')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

              </div>
            )}

            {/* PHASE 5: ACTIVE PRACTICE SANDBOX */}
            {activeTab === 'practice' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    {lang === 'ID' ? 'Modul 5: Latihan Praktik' : 'Module 5: Active Practice'}
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    {lang === 'ID' ? 'Latihan Praktik' : 'Practice Sandbox'}
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {lang === 'ID' ? 'Kerjakan latihan yang tersedia untuk menerapkan materi pembelajaran.' : 'Complete the available practice to apply this learning material.'}
                  </p>
                </div>

                <div className="space-y-6">
                  {practices.map((prac) => {
                    const answer = userPracticeAnswers[prac.id];
                    const checklistAnswer = Array.isArray(answer) ? answer : [];
                    const practiceResult = progress.practiceResults?.[prac.id];
                    return (
                      <div key={prac.id} className={`${getSubCardClass()} p-5 rounded-2xl border space-y-4`}>
                        <div>
                          <span className="text-[9px] font-extrabold text-stone-400 block uppercase">{lang === 'ID' ? 'Skenario latihan' : 'Practice scenario'}</span>
                          <h3 className="text-sm font-bold text-stone-950 mt-1">{prac.title}</h3>
                          <p className="text-xs text-stone-500 leading-normal font-sans pt-1">{prac.scenario}</p>
                        </div>

                        <div className="p-4 bg-brand-50/40 border border-brand-500/10 rounded-xl space-y-1 text-xs">
                          <span className="text-[9px] font-bold text-brand-700 block uppercase">{lang === 'ID' ? 'Instruksi latihan:' : 'Practice instruction:'}</span>
                          <p className="text-stone-800 font-sans leading-relaxed">{prac.instruction}</p>
                        </div>

                        {prac.interactiveType === 'multiple-choice' ? (
                          <div className="space-y-2">
                            {prac.options?.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setUserPracticeAnswers(prev => ({ ...prev, [prac.id]: opt }));
                                  setPracticeSaveStatus((previous) => ({ ...previous, [prac.id]: undefined }));
                                }}
                                className={`w-full text-left p-3 border rounded-xl text-xs cursor-pointer transition-all ${answer === opt ? 'border-brand-500 bg-brand-50 text-brand-800 font-bold' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : prac.interactiveType === 'checklist' ? (
                          <div className="space-y-2">
                            {(prac.checklistItems || []).map((item) => {
                              const checked = checklistAnswer.includes(item);
                              return (
                                <label key={item} className="flex items-center gap-3 p-3 border border-stone-200 bg-white rounded-xl text-xs text-stone-800 cursor-pointer hover:bg-stone-50">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setUserPracticeAnswers((previous) => {
                                        const selected = Array.isArray(previous[prac.id]) ? previous[prac.id] : [];
                                        return {
                                          ...previous,
                                          [prac.id]: checked
                                            ? selected.filter((selectedItem) => selectedItem !== item)
                                            : [...selected, item],
                                        };
                                      });
                                      setPracticeSaveStatus((statuses) => ({ ...statuses, [prac.id]: undefined }));
                                    }}
                                    className="h-4 w-4 accent-brand-600"
                                  />
                                  <span>{item}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <textarea
                            rows={3}
                            value={typeof answer === 'string' ? answer : ''}
                            onChange={(e) => {
                              setUserPracticeAnswers(prev => ({ ...prev, [prac.id]: e.target.value }));
                              setPracticeSaveStatus((previous) => ({ ...previous, [prac.id]: undefined }));
                            }}
                            placeholder={lang === 'ID' ? 'Tulis jawaban Anda di sini...' : 'Write your answer here...'}
                            className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff] text-stone-800"
                          />
                        )}

                        <button
                          onClick={() => handlePracticeSubmit(prac.id)}
                          className="px-4 py-2 bg-stone-950 hover:bg-stone-850 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          {lang === 'ID' ? 'Simpan Jawaban' : 'Save Answer'}
                        </button>

                        {practiceSaveStatus[prac.id] && (
                          <div className="p-3 rounded-xl border text-xs font-sans bg-red-50 border-red-200 text-red-700">
                            {practiceSaveStatus[prac.id]?.message}
                          </div>
                        )}

                        {practiceResult?.savedAt && (
                          <div className={`p-3 rounded-xl border text-xs font-sans ${prac.interactiveType === 'multiple-choice' && !practiceResult.isCorrect ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-700'}`}>
                            {prac.interactiveType === 'multiple-choice'
                              ? practiceResult.isCorrect
                                ? (lang === 'ID' ? 'Jawaban benar.' : 'Correct answer.')
                                : (lang === 'ID' ? 'Jawaban belum tepat. Silakan coba lagi.' : 'That answer is not correct yet. Please try again.')
                              : (lang === 'ID' ? 'Jawaban berhasil disimpan.' : 'Your answer has been saved.')}
                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  {practiceSectionStatus && (
                    <div className="mr-auto p-3 rounded-xl border text-xs font-sans bg-red-50 border-red-200 text-red-700">
                      {practiceSectionStatus.message}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!practiceComplete) {
                        setPracticeSectionStatus({
                          tone: 'error',
                          message: lang === 'ID' ? 'Simpan semua latihan terlebih dahulu.' : 'Save and complete every practice first.',
                        });
                        return;
                      }
                      setPracticeSectionStatus(null);
                      if (hasReflections) setActiveTab('reflection');
                      else if (hasSummary) setActiveTab('summary');
                      else void completeLearning();
                    }}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {hasReflections ? (lang === 'ID' ? 'Lanjut ke Refleksi' : 'Continue to Reflection') : hasSummary ? (lang === 'ID' ? 'Lihat Ringkasan' : 'View Summary') : (lang === 'ID' ? 'Selesaikan Pembelajaran' : 'Complete Learning')}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 6: PERSONAL REFLECTION */}
            {activeTab === 'reflection' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    {lang === 'ID' ? 'Modul 6: Refleksi' : 'Module 6: Reflection'}
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    {lang === 'ID' ? 'Refleksi Pribadi' : 'Personal Reflection'}
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {lang === 'ID' ? 'Tuliskan refleksi Anda berdasarkan pertanyaan yang tersedia.' : 'Write your reflection using the available prompts.'}
                  </p>
                </div>

                <div className="space-y-5 max-w-2xl mx-auto">
                  {reflections.map((ref) => (
                    <div key={ref.id} className={`${getSubCardClass()} p-5 rounded-2xl border space-y-3`}>
                      <div>
                        <h4 className="text-xs font-bold text-stone-950">{ref.question}</h4>
                        <span className="text-[9px] text-stone-400 block mt-0.5">{ref.context}</span>
                      </div>
                      <textarea
                        rows={2}
                        value={userReflectionAnswers[ref.id] || ''}
                        onChange={(e) => {
                          setUserReflectionAnswers(prev => ({ ...prev, [ref.id]: e.target.value }));
                          setReflectionSaveStatus((previous) => ({ ...previous, [ref.id]: undefined }));
                        }}
                        placeholder={ref.helperPrompt}
                        className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff] text-stone-800"
                      />
                      <button
                        onClick={() => handleReflectionSubmit(ref.id)}
                        className="px-3.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded cursor-pointer"
                      >
                        {lang === 'ID' ? 'Simpan Refleksi' : 'Save Reflection'}
                      </button>
                      {reflectionSaveStatus[ref.id] && (
                        <div className={`p-3 rounded-xl border text-xs font-sans ${reflectionSaveStatus[ref.id]?.tone === 'success' ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {reflectionSaveStatus[ref.id]?.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={() => {
                      if (hasSummary) setActiveTab('summary');
                      else void completeLearning();
                    }}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {hasSummary ? (lang === 'ID' ? 'Lihat Ringkasan' : 'View Summary') : (lang === 'ID' ? 'Selesaikan Pembelajaran' : 'Complete Learning')}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 7: FIELD ACTION PLAN */}
            {activeTab === 'actionPlan' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    {lang === 'ID' ? 'Modul 7: Rencana Tindakan' : 'Module 7: Field Tasks'}
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    {lang === 'ID' ? 'Rencana Tindakan Setelah Belajar' : 'Post-Course Action Plan'}
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Formulate exact operational tasks for Today, This Week, and This Month. Schedule calendar alerts for commitment.
                  </p>
                </div>

                <div className="space-y-4 max-w-2xl mx-auto font-sans">
                  {skill.summary.actionPlan.map((plan, idx) => (
                    <div key={idx} className={`${getSubCardClass()} p-5 rounded-2xl border flex items-start gap-4 shadow-sm`}>
                      <input 
                        type="checkbox" 
                        checked={actionPlanCheck[`plan-${idx}`] || false}
                        onChange={() => setActionPlanCheck(prev => ({ ...prev, [`plan-${idx}`]: !prev[`plan-${idx}`] }))}
                        className="rounded border-stone-300 text-brand-500 focus:ring-brand-500/20 mt-1 cursor-pointer h-4 w-4"
                      />
                      
                      <div className="flex-grow space-y-1 text-xs">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <h4 className="font-bold text-stone-950 text-sm">{plan.step}</h4>
                          <span className="text-[9px] font-extrabold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
                            {plan.timeline}
                          </span>
                        </div>
                        <p className="text-stone-500 leading-normal">{plan.description}</p>
                        
                        {/* Simulated Reminders */}
                        <div className="pt-2">
                          <button
                            onClick={() => setIsReminderSet(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase transition-all cursor-pointer ${isReminderSet[idx] ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-700'}`}
                          >
                            <Bell className="h-3.5 w-3.5" />
                            <span>{isReminderSet[idx] ? 'Google Calendar Alert Active' : 'Schedule Daily Google Calendar alert'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {lang === 'ID' ? 'Lihat Ringkasan Eksekutif' : 'View Executive Summary'}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 8: EXECUTIVE SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    {lang === 'ID' ? 'Modul 8: Ringkasan' : 'Module 8: Summary'}
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    {lang === 'ID' ? 'Ringkasan Eksekutif' : 'Executive Summary'}
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {lang === 'ID' ? 'Tinjau ringkasan akhir dari pembelajaran ini.' : 'Review the final summary for this learning experience.'}
                  </p>
                </div>

                <div className="space-y-5 max-w-2xl mx-auto">
                  
                  {/* Summary Core Block */}
                  <div className={`${getSubCardClass()} p-6 rounded-2xl border space-y-3`}>
                    <span className="text-[9px] font-extrabold text-brand-600 block uppercase">{lang === 'ID' ? 'Ringkasan Inti' : 'The Core Summary'}</span>
                    <p className="text-xs leading-relaxed font-serif italic text-stone-700">
                      "{skill.summary.content}"
                    </p>
                  </div>

                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={completeLearning}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {lang === 'ID' ? 'Selesaikan Pembelajaran' : 'Complete Learning'}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 9: REFERENCE CENTER */}
            {activeTab === 'references' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <ReferenceCenter references={referencesList} lang={lang} />

                <div className="pt-6 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={async () => {
                      const currentCompleted = [...(progress.completedLessons || [])];
                      await onUpdateProgress({
                        completedLessons: currentCompleted,
                        isCompleted: true,
                        completedAt: new Date().toISOString()
                      });
                      setActiveTab('completed');
                    }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow shadow-emerald-500/10"
                  >
                    {lang === 'ID' ? 'Ambil Sertifikat Penyelesaian' : 'Claim Completion Certificate'}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 10: COMPLETION CELEBRATION */}
            {activeTab === 'completed' && (
              <div className="text-center py-10 space-y-8 max-w-xl mx-auto font-sans">
                
                {/* Visual celebration banner */}
                <div className="space-y-3">
                  <div className="h-20 w-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/15">
                    🎓
                  </div>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    {lang === 'ID' ? 'Pembelajaran Selesai!' : 'Course Fully Completed!'}
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
                    {lang === 'ID' ? 'Selamat! Anda telah menyelesaikan pembelajaran terpandu untuk' : 'Congratulations! You have completed the guided learning experience for'} <span className="font-bold text-stone-800">"{skill.title}"</span>.
                  </p>
                </div>

                {/* Secure Signed Certificate Frame */}
                <div className="border-4 border-double border-stone-300 p-6 rounded-2xl bg-white shadow-md relative overflow-hidden text-stone-900 space-y-4 max-w-md mx-auto">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-brand-500/10 rounded-bl-full flex items-center justify-center font-bold text-brand-600 text-xs">
                    {lang === 'ID' ? 'SAH' : 'SEAL'}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-extrabold uppercase text-stone-400 tracking-widest block">{lang === 'ID' ? 'Kredensial Resmi' : 'Official Credential'}</span>
                    <h3 className="text-lg font-serif italic text-stone-900">{lang === 'ID' ? 'Sertifikat Penguasaan Skill' : 'Certificate of Skill Mastery'}</h3>
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {lang === 'ID' ? 'Dokumen ini menyatakan bahwa' : 'This document certifies that'} <span className="font-bold text-stone-950">{lang === 'ID' ? 'Pembelajar' : 'Learner'}</span> {lang === 'ID' ? 'telah menyelesaikan seluruh pelajaran, latihan, dan refleksi untuk' : 'has completed all lessons, practice challenges, and reflections for'} <span className="font-bold text-stone-950">"{skill.title}"</span>.
                  </p>

                  <div className="flex justify-between items-end border-t border-stone-100 pt-3 text-[10px] text-stone-400 font-medium">
                    <div className="text-left">
                      <span>{lang === 'ID' ? 'Tanggal selesai:' : 'Date completed:'}</span>
                      <p className="font-bold text-stone-700">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span>{lang === 'ID' ? 'Direktur Program:' : 'Course Director:'}</span>
                      <p className="font-serif italic text-stone-700">Elena Rostova</p>
                    </div>
                  </div>
                </div>

                {/* Rating & Testimoni Section */}
                <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-md max-w-md mx-auto text-left space-y-4">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <Star className="h-5 w-5 fill-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-stone-900 dark:text-white">
                        {lang === 'ID' ? 'Beri Rating & Testimoni' : 'Rate & Review This Skill'}
                      </h4>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        {hasSubmittedReview
                          ? (lang === 'ID' ? 'Anda sudah memberikan testimoni (dapat diperbarui).' : 'You have reviewed this skill (editable).')
                          : (lang === 'ID' ? 'Bagikan pengalaman belajar Anda untuk landing page.' : 'Share your learning experience for the landing page.')}
                      </p>
                    </div>
                  </div>

                  {reviewSuccessMsg && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold">{reviewSuccessMsg}</span>
                    </div>
                  )}

                  {reviewErrorMsg && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold">{reviewErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Star selector */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                        {lang === 'ID' ? 'Rating Bintang (1–5)' : 'Star Rating (1–5)'} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = (hoverRating || userRating) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 text-stone-300 dark:text-stone-600 hover:scale-110 transition-all cursor-pointer focus:outline-none"
                              aria-label={`${star} star`}
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  isFilled ? 'text-amber-400 fill-amber-400' : 'text-stone-300 dark:text-stone-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="ml-2 text-xs font-bold text-stone-700 dark:text-stone-300">
                          {userRating === 5 && (lang === 'ID' ? '5.0 — Luar Biasa! ⭐' : '5.0 — Excellent! ⭐')}
                          {userRating === 4 && (lang === 'ID' ? '4.0 — Sangat Bagus 👍' : '4.0 — Very Good 👍')}
                          {userRating === 3 && (lang === 'ID' ? '3.0 — Cukup Baik 👌' : '3.0 — Good 👌')}
                          {userRating === 2 && (lang === 'ID' ? '2.0 — Perlu Ditingkatkan' : '2.0 — Needs Improvement')}
                          {userRating === 1 && (lang === 'ID' ? '1.0 — Kurang Memuaskan' : '1.0 — Poor')}
                        </span>
                      </div>
                    </div>

                    {/* Testimonial Textarea */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                        {lang === 'ID' ? 'Tulis Testimoni Anda' : 'Write Your Testimonial'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={userTestimonial}
                        onChange={(e) => setUserTestimonial(e.target.value)}
                        placeholder={
                          lang === 'ID'
                            ? 'Contoh: Materinya sangat aplikatif dan terstruktur rapi. Latihan interaktifnya langsung bisa saya terapkan di tempat kerja.'
                            : 'Example: The lessons were concise and directly actionable. The interactive practice helped me apply the framework immediately.'
                        }
                        className="w-full p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
                    >
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{lang === 'ID' ? 'Menyimpan Testimoni...' : 'Saving Review...'}</span>
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>
                            {hasSubmittedReview
                              ? (lang === 'ID' ? 'Perbarui Rating & Testimoni' : 'Update Review')
                              : (lang === 'ID' ? 'Kirim Rating & Testimoni' : 'Submit Review')}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Actions & Next steps */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={onBack}
                    className="px-5 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {lang === 'ID' ? 'Kembali ke Skill Saya' : 'Return to My Library'}
                  </button>
                  <button
                    onClick={handleDownloadCertificate}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {lang === 'ID' ? 'Download Sertifikat' : 'Download Certificate'}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      </main>

      {/* 3. FLOATING RIGHT SIDEBAR: CHAT COACH AI PANEL */}
      {aiPanelOpen && (
        <>
        <button
          type="button"
          onClick={() => setAiPanelOpen(false)}
          className="fixed inset-0 z-40 bg-stone-950/60 md:hidden"
          aria-label={lang === 'ID' ? 'Tutup Mentor AI' : 'Close AI Mentor'}
        />
        <aside className="fixed inset-x-0 bottom-0 z-50 h-[78dvh] w-full rounded-t-3xl bg-white border-t border-stone-200 flex flex-col flex-shrink-0 animate-in slide-in-from-bottom duration-200 font-sans text-stone-800 md:static md:z-20 md:h-auto md:w-80 md:rounded-none md:border-t-0 md:border-l md:slide-in-from-right">
          <div className="p-4 bg-stone-900 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-brand-400 animate-pulse" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest">{lang === 'ID' ? 'Mentor AI' : 'AI Mentor'}</h3>
            </div>
            <button 
              onClick={() => setAiPanelOpen(false)} 
              className="text-stone-400 hover:text-white font-bold cursor-pointer text-lg"
            >
              &times;
            </button>
          </div>

          {/* Quick Triggers */}
          <div className="p-4 bg-brand-500/[0.02] border-b border-stone-250/20 text-center space-y-2">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-bold">{lang === 'ID' ? 'Pertanyaan Cepat' : 'Quick Mentoring Prompts'}</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                onClick={() => handleAskAICoach('simplify')}
                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded text-[9px] font-bold text-stone-700 cursor-pointer"
              >
                {lang === 'ID' ? 'Sederhanakan Konsep' : 'Simplify Concept'}
              </button>
              <button
                onClick={() => handleAskAICoach('analogy')}
                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded text-[9px] font-bold text-stone-700 cursor-pointer"
              >
                {lang === 'ID' ? 'Buat Analogi' : 'Memorable Analogy'}
              </button>
              <button
                onClick={() => handleAskAICoach('explain')}
                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded text-[9px] font-bold text-stone-700 cursor-pointer"
              >
                {lang === 'ID' ? 'Contoh Kasus Nyata' : 'Real Case Study'}
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-4">
            {aiMessages.length === 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-3 text-center text-[11px] leading-relaxed text-stone-500">
                {lang === 'ID'
                  ? 'Pilih pertanyaan cepat atau tulis pertanyaan Anda untuk memulai percakapan.'
                  : 'Choose a quick prompt or write your question to start the conversation.'}
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-brand-100 text-brand-950 ml-auto border border-brand-200/50' : 'bg-white border border-stone-200 text-stone-800'}`}
              >
                {msg.text}
              </div>
            ))}
            {isAiLoading && (
              <div className="flex items-center space-x-2 text-[10px] text-stone-400 bg-white p-2 rounded-lg border">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />
                <span>{lang === 'ID' ? 'AI Coach sedang memproses...' : 'Coach is thinking...'}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAskAICoach('custom'); }} 
            className="p-3 border-t border-stone-200 flex gap-2 bg-white"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={lang === 'ID' ? 'Tanya Mentor AI...' : 'Ask AI Mentor...'}
              className="flex-grow px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-stone-900 hover:bg-stone-850 text-white rounded-lg cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </aside>
        </>
      )}

    </div>
  );
}
