/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, BookOpen, Layers, CheckCircle2, Volume2, Sliders, ChevronLeft, ChevronRight, 
  Sparkles, HelpCircle, Send, Play, Pause, Bookmark, Heart, FileText, Award, RefreshCw, AlertCircle,
  Minimize2, Maximize2, MousePointer, Flame, Check, BookmarkCheck, Calendar, Bell, ExternalLink, Activity, Info,
  Compass, Map, Lock, Target, Brain, Zap, FileCheck, BookMarked, GraduationCap, Clock, Sun, Moon, Globe, Star, Menu, X
} from 'lucide-react';
import { SkillPill, Lesson, UserProgress } from '../types';
import { Language } from '../lib/translations';
import { getSkillCover } from '../lib/skillImage';
import { localizeCategory, localizeDifficulty, localizeDuration } from '../lib/localization';
import { motion, AnimatePresence } from 'motion/react';

// Modular Sub-components
import LearningContract from './player/LearningContract';
import PersonalizationPanel, { PersonalizationConfig } from './player/PersonalizationPanel';
import LiveAnalytics from './player/LiveAnalytics';
import LessonComponentsPlayground from './player/LessonComponentsPlayground';
import ReferenceCenter from './player/ReferenceCenter';

interface LearningPlayerProps {
  skill: SkillPill;
  progress: UserProgress;
  onBack: () => void;
  onUpdateProgress: (data: Partial<UserProgress>) => Promise<void>;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
  onOpenFeedback?: () => void;
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

type ContentMode = 'card' | 'presentation' | 'reading' | 'listen';

const bentoToneClasses = {
  default: 'bg-white border-stone-200 text-stone-800 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100',
  accent: 'bg-brand-50 border-brand-500/25 text-stone-900 dark:bg-brand-950/30 dark:text-stone-100',
  dark: 'bg-stone-950 border-stone-800 text-white',
  success: 'bg-emerald-50 border-emerald-500/25 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100',
  warning: 'bg-amber-50 border-amber-500/25 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100',
};

function createSafeLessons(skill: SkillPill): Lesson[] {
  const lessonDefaults = (index: number, title?: string): Lesson => ({
    id: `${skill.id}-lesson-${index + 1}`,
    title: title || `Modul ${index + 1}: ${skill.title}`,
    learningObjective: skill.transformation || `Memahami dasar ${skill.title} dan menerapkannya secara praktis.`,
    bigPicture: skill.shortDescription || `Gambaran utama tentang ${skill.title}.`,
    definition: skill.problem || skill.shortDescription || `${skill.title} adalah keterampilan praktis yang dapat langsung diterapkan.`,
    whyItMatters: skill.transformation || `Keterampilan ini membantu pembelajar memperoleh hasil yang lebih terarah.`,
    analogy: `Pelajari ${skill.title} seperti menyusun peta: pahami arah, ikuti langkahnya, lalu praktikkan.`,
    howItWorks: [
      'Pahami konsep dan tujuan utamanya.',
      'Ikuti langkah penerapan secara berurutan.',
      'Praktikkan pada situasi nyata dan evaluasi hasilnya.',
    ],
    visualType: 'workflow',
    visualData: {
      title: 'Alur Penerapan',
      steps: [
        { label: 'Pahami', desc: 'Kenali konsep inti dan hasil yang dituju.' },
        { label: 'Terapkan', desc: 'Gunakan langkah praktis pada situasi nyata.' },
        { label: 'Evaluasi', desc: 'Tinjau hasil dan perbaiki pendekatan.' },
      ],
    },
    realExample: `Gunakan kerangka ${skill.title} pada satu situasi kerja atau aktivitas harian Anda.`,
    commonMistakes: ['Melewati konsep dasar', 'Mencoba semua langkah sekaligus tanpa evaluasi'],
    keyTakeaway: skill.transformation || `Mulai dari satu langkah kecil untuk menguasai ${skill.title}.`,
    checklist: ['Pahami tujuan', 'Pilih situasi praktik', 'Terapkan langkah', 'Evaluasi hasil'],
    practiceChallenge: {
      title: 'Praktik singkat',
      instruction: `Tuliskan bagaimana Anda akan menerapkan ${skill.title} pada situasi nyata.`,
      sampleAnswer: 'Saya akan memilih satu situasi, mengikuti langkahnya, lalu mencatat hasilnya.',
    },
    reflectionPrompt: `Apa satu hal dari ${skill.title} yang paling relevan untuk Anda?`,
    summary: skill.summary || skill.shortDescription || `Ringkasan ${skill.title}.`,
  });

  if (Array.isArray(skill.lessons) && skill.lessons.length > 0) {
    return skill.lessons.map((lesson, index) => ({
      ...lessonDefaults(index, lesson?.title),
      ...lesson,
      visualData: lesson?.visualData || {},
      howItWorks: lesson?.howItWorks || [],
      commonMistakes: lesson?.commonMistakes || [],
      checklist: lesson?.checklist || [],
      practiceChallenge: lesson?.practiceChallenge || lessonDefaults(index).practiceChallenge,
    }));
  }

  const modules = Array.isArray(skill.curriculum) && skill.curriculum.length > 0
    ? skill.curriculum
    : [{ id: `${skill.id}-module-1`, title: skill.title, duration: skill.estimatedTime || '15 mins' }];
  return modules.map((module, index) => ({ ...lessonDefaults(index, module.title), id: module.id || `${skill.id}-lesson-${index + 1}` }));
}

export default function LearningPlayer({ 
  skill, 
  progress, 
  onBack, 
  onUpdateProgress,
  darkMode = false,
  onToggleDarkMode,
  lang = 'ID',
  onLanguageChange,
  onOpenFeedback
}: LearningPlayerProps) {
  const lessons = createSafeLessons(skill);
  const practices = skill.practice || [];
  const learningBenefits = skill.whyLearnThis?.length
    ? skill.whyLearnThis
    : [skill.transformation || `Kuasai dasar ${skill.title} dan terapkan pada situasi nyata.`];
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
  const [contentMode, setContentMode] = useState<ContentMode>('card');
  const [isContractCommitted, setIsContractCommitted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeTab]);

  // Floating Overlays toggles
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
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

  // Lesson Sandbox states
  const [checklistChecked, setChecklistChecked] = useState<Record<string, boolean>>({});
  const [miniPracticeAnswers, setMiniPracticeAnswers] = useState<Record<string, string>>({});
  const [miniPracticeFeedback, setMiniPracticeFeedback] = useState<Record<string, string>>({});
  const [lessonReflectionAnswers, setLessonReflectionAnswers] = useState<Record<string, string>>({});

  // Practice Challenges & Personal Evaluations
  const [userPracticeAnswers, setUserPracticeAnswers] = useState<Record<string, string>>(progress.practiceAnswers || {});
  const [userReflectionAnswers, setUserReflectionAnswers] = useState<Record<string, string>>(progress.reflectionAnswers || {});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, string>>({});
  const [isFeedbackLoading, setIsFeedbackLoading] = useState<Record<string, boolean>>({});

  // Matching game interactive state (Practice Module)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  // Flashcards state (Practice Module)
  const [flashcardFlipped, setFlashcardFlipped] = useState<Record<string, boolean>>({});

  // Action Plan interactive triggers
  const [actionPlanCheck, setActionPlanCheck] = useState<Record<string, boolean>>({});
  const [isReminderSet, setIsReminderSet] = useState<Record<string, boolean>>({});

  const referencesList = skill.references || [];

  // Speech Synthesis Narration (Listen Mode)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedNarrator, setSelectedNarrator] = useState<'aria' | 'marcus'>('aria');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [audioUsageCount, setAudioUsageCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const activeLesson: Lesson = lessons[activeLessonIdx] || lessons[0];
  const lessonSlides = activeLesson.slides?.length
    ? activeLesson.slides
    : [{
        id: `${activeLesson.id}-slide-1`,
        title: activeLesson.title,
        body: activeLesson.bigPicture,
        bullets: activeLesson.howItWorks,
        speakerNotes: activeLesson.summary,
        imageUrl: '',
      }];
  const activeSlide = lessonSlides[Math.min(activeSlideIdx, lessonSlides.length - 1)];
  const articleTitle = activeLesson.article?.title || activeLesson.title;
  const articleParagraphs = (activeLesson.article?.body || [activeLesson.bigPicture, activeLesson.definition, activeLesson.whyItMatters, activeLesson.analogy].filter(Boolean).join('\n\n'))
    .split(/\n\s*\n/)
    .filter(Boolean);
  const hasVisualContent = Boolean(
    activeLesson.visualData && (
      (activeLesson.visualType === 'comparison' && (
        activeLesson.visualData.leftItems?.length || activeLesson.visualData.rightItems?.length
      )) ||
      (activeLesson.visualType === 'diagram' && activeLesson.visualData.nodes?.length) ||
      (activeLesson.visualType === 'workflow' && activeLesson.visualData.steps?.length)
    )
  );

  const isCompleted100 = lessons.length > 0 && progress.completedLessons.length >= lessons.length;
  const isUnlocked = isContractCommitted || isCompleted100;
  const completedLessonIds = new Set(progress.completedLessons || []);
  const firstIncompleteLessonIdx = lessons.findIndex((lesson) => !completedLessonIds.has(lesson.id));
  const nextLessonIdx = firstIncompleteLessonIdx === -1 ? 0 : firstIncompleteLessonIdx;
  const isLessonAvailable = (index: number) =>
    index >= 0 &&
    index < lessons.length &&
    isUnlocked &&
    lessons.slice(0, index).every((lesson) => completedLessonIds.has(lesson.id));

  const openLesson = (index: number) => {
    if (!isUnlocked) {
      setActiveTab('contract');
      return;
    }
    if (!isLessonAvailable(index)) return;
    setActiveLessonIdx(index);
    setActiveTab('lessons');
  };

  const beginNextLesson = () => openLesson(nextLessonIdx);

  useEffect(() => {
    if (isCompleted100) {
      setIsContractCommitted(true);
    }
  }, [isCompleted100]);

  useEffect(() => {
    if (activeLesson) {
      setNotesText(progress.notes?.[activeLesson.id] || '');
      setActiveSlideIdx(0);
      if (synth) synth.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.load();
      }
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [activeLessonIdx]);

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

  // Tracking metrics
  const practiceAnswersCount = Object.keys(userPracticeAnswers).length;
  const reflectionAnswersCount = Object.keys(userReflectionAnswers).length;
  const notesCount = Object.keys(progress.notes || {}).length;
  const bookmarksCount = bookmarkedLessons.length + (progress.bookmarked ? 1 : 0);

  // Speech synthesis play logic
  const handleSpeak = () => {
    if (!activeLesson) return;

    if (activeLesson.audio?.url && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.playbackRate = playbackSpeed;
        void audioRef.current.play().catch(() => {
          setIsSpeaking(false);
          setIsPaused(false);
        });
      } else {
        audioRef.current.pause();
      }
      return;
    }

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

    const textToRead = activeLesson.audio?.transcript || activeLesson.article?.body || `
      Lesson: ${activeLesson.title}.
      Learning Objective: ${activeLesson.learningObjective}.
      Big Picture: ${activeLesson.bigPicture}.
      Definition: ${activeLesson.definition}.
      Why It Matters: ${activeLesson.whyItMatters}.
      Analogy: ${activeLesson.analogy}.
      Key Takeaway: ${activeLesson.keyTakeaway}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = playbackSpeed;
    utterance.pitch = selectedNarrator === 'aria' ? 1.1 : 0.9;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    setIsPaused(false);
    setAudioUsageCount((prev) => prev + 1);
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
  };

  // Theme variable map
  const getThemeClass = () => {
    switch (personalization.theme) {
      case 'dark':
        return 'bg-stone-950 text-stone-100 border-stone-850';
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
    switch (personalization.theme) {
      case 'dark':
        return 'bg-stone-900 border-stone-800 text-stone-100';
      case 'sepia':
        return 'bg-[#ebdcb9] border-[#e4dcbf] text-[#433e30]';
      case 'paper':
        return 'bg-[#e4dfcd] border-[#dfdac0] text-stone-800';
      case 'light':
      default:
        return 'bg-white border-stone-200 text-stone-900 shadow-sm';
    }
  };

  const getSomaticAnalogyClass = () => {
    switch (personalization.theme) {
      case 'dark':
        return 'bg-[#3b2d18] border-brand-900 text-brand-100';
      case 'sepia':
        return 'bg-[#dfceaa] border-brand-950 text-[#3d240e]';
      case 'paper':
        return 'bg-[#dfdab5] border-brand-950 text-stone-900';
      case 'light':
      default:
        return 'bg-stone-900 border-stone-800 text-stone-100';
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

  // AI evaluations for practices
  const handlePracticeSubmit = async (pId: string) => {
    const ans = userPracticeAnswers[pId] || '';
    if (!ans) return;

    const answers = { ...progress.practiceAnswers, [pId]: ans };
    await onUpdateProgress({ practiceAnswers: answers });

    setIsFeedbackLoading(prev => ({ ...prev, [pId]: true }));
    try {
      const challenge = practices.find(p => p.id === pId);
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'partner',
          lessonContext: {
            title: challenge?.title || 'Practice Challenge',
            objective: challenge?.instruction || '',
            details: challenge?.scenario || ''
          },
          userMessage: ans
        })
      });
      const data = await res.json();
      setPracticeFeedback(prev => ({ ...prev, [pId]: data.reply || 'Great work!' }));
    } catch (err) {
      setPracticeFeedback(prev => ({ ...prev, [pId]: 'Your answer has been verified & registered! Keep practicing to secure retention.' }));
    } finally {
      setIsFeedbackLoading(prev => ({ ...prev, [pId]: false }));
    }
  };

  // Evaluates mini practice in the lesson card
  const handleEvaluateMiniPractice = async (lessonId: string) => {
    const ans = miniPracticeAnswers[lessonId];
    if (!ans) return;

    setMiniPracticeFeedback(prev => ({ ...prev, [lessonId]: 'Checking...' }));
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'simplify',
          lessonContext: {
            title: activeLesson.title,
            objective: activeLesson.learningObjective,
            details: activeLesson.definition
          },
          userMessage: `Check this mini practice: "${ans}"`
        })
      });
      const data = await res.json();
      setMiniPracticeFeedback(prev => ({ ...prev, [lessonId]: data.reply || 'Superb execution!' }));
    } catch {
      setMiniPracticeFeedback(prev => ({ ...prev, [lessonId]: 'Excellent focus! Your response has been logged.' }));
    }
  };

  // Reflection saving
  const handleReflectionSubmit = async (rId: string) => {
    const ans = userReflectionAnswers[rId] || '';
    if (!ans) return;

    const answers = { ...progress.reflectionAnswers, [rId]: ans };
    await onUpdateProgress({ reflectionAnswers: answers });
    alert(lang === 'ID' ? 'Refleksi berhasil disimpan ke jurnal profil Anda.' : 'Reflection saved to your profile journal.');
  };

  const handleLessonReflectionSubmit = (lessId: string) => {
    const ans = lessonReflectionAnswers[lessId];
    if (!ans) return;
    alert(lang === 'ID' ? 'Refleksi pelajaran berhasil disimpan.' : 'Lesson reflection saved.');
  };

  const handleCompleteLesson = async () => {
    const currentCompleted = [...(progress.completedLessons || [])];
    if (!currentCompleted.includes(activeLesson.id)) {
      currentCompleted.push(activeLesson.id);
    }

    const isAllLessonsCompleted = currentCompleted.length === lessons.length;
    
    await onUpdateProgress({
      completedLessons: currentCompleted,
      isCompleted: isAllLessonsCompleted || progress.isCompleted
    });

    if (activeLessonIdx < lessons.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
    } else {
      setActiveTab('practice');
    }
  };

  // Interactive AI Coach Drawer
  const handleAskAICoach = async (mode: 'explain' | 'simplify' | 'analogy' | 'custom') => {
    const context = {
      title: activeLesson.title,
      objective: activeLesson.learningObjective,
      details: `${activeLesson.definition} ${activeLesson.bigPicture} ${activeLesson.analogy}`
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

  const handleSaveNotes = () => {
    const updatedNotes = { ...(progress.notes || {}) };
    updatedNotes[activeLesson.id] = notesText;
    onUpdateProgress({ notes: updatedNotes });
    alert(lang === 'ID' ? 'Catatan berhasil disimpan.' : 'Notes saved successfully.');
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 font-sans ${getThemeClass()}`}>
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label={lang === 'ID' ? 'Tutup menu pembelajaran' : 'Close learning menu'}
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-[2px] md:hidden"
        />
      )}
      <audio
        ref={audioRef}
        src={activeLesson.audio?.url || undefined}
        preload="metadata"
        onPlay={() => { setIsSpeaking(true); setIsPaused(false); setAudioUsageCount((count) => count + 1); }}
        onPause={() => { if (audioRef.current && audioRef.current.currentTime > 0) setIsPaused(true); }}
        onEnded={() => { setIsSpeaking(false); setIsPaused(false); }}
        onError={() => { setIsSpeaking(false); setIsPaused(false); }}
        className="hidden"
      />
      
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
                {Math.round((progress.completedLessons.length / lessons.length) * 100)}%
              </span>
            </div>
            <div className="bg-stone-800/90 h-1.5 w-full rounded-full overflow-hidden p-0.5 border border-stone-700/40">
              <div 
                className="bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 h-full rounded-full transition-all duration-500 shadow-sm shadow-brand-500/30"
                style={{ width: `${(progress.completedLessons.length / lessons.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-stone-500 mt-1.5">
              <span>{lang === 'ID' ? 'Modul Selesai' : 'Lessons Completed'}</span>
              <span className="font-bold text-stone-300 font-mono">{progress.completedLessons.length} / {lessons.length}</span>
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

          {/* Step 2: Contract */}
          <button
            onClick={() => setActiveTab('contract')}
            className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
              activeTab === 'contract' 
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm shadow-brand-500/5' 
                : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'contract' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">2. {lang === 'ID' ? 'Kontrak Belajar' : 'Learning Contract'}</span>
            </div>
            {isUnlocked ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <span className="text-[9px] font-extrabold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded animate-pulse">{lang === 'ID' ? 'TTD' : 'SIGN'}</span>
            )}
          </button>

          {/* Step 3: Roadmap */}
          <button
            onClick={() => {
              if (!isUnlocked) {
                alert(lang === 'ID' ? 'Tandatangani Kontrak Belajar terlebih dahulu untuk menetapkan target hari ini!' : 'Sign the Learning Contract first to commit to today\'s goal!');
                return;
              }
              setActiveTab('journey');
            }}
            className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
              activeTab === 'journey' 
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm shadow-brand-500/5' 
                : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
            } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'journey' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                <Map className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">3. {lang === 'ID' ? 'Peta Pembelajaran' : 'Skill Roadmap'}</span>
            </div>
            {!isUnlocked ? (
              <Lock className="h-3.5 w-3.5 text-stone-500" />
            ) : (
              <span className="text-[9px] font-bold text-stone-500 uppercase px-1.5 py-0.5 rounded bg-stone-800/50">{lang === 'ID' ? 'Peta' : 'Map'}</span>
            )}
          </button>

          {/* Step 4: Core Lessons Section */}
          <div className="pt-3 pb-1 border-t border-stone-800/60 my-2">
            <div className="px-2 mb-2 flex items-center justify-between text-[9px] font-extrabold text-stone-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 text-brand-500" />
                4. {lang === 'ID' ? 'Materi Inti' : 'Core Lessons'}
              </span>
              <span className="text-[9px] font-mono text-stone-500">{lessons.length} {lang === 'ID' ? 'Modul' : 'Modules'}</span>
            </div>

            <div className="space-y-1 pl-1">
              {lessons.map((less, index) => {
                const isCompleted = progress.completedLessons.includes(less.id);
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
                <span className="truncate">5. {lang === 'ID' ? 'Latihan Praktik' : 'Sandbox Practice'}</span>
              </div>
              {!isUnlocked ? (
                <Lock className="h-3.5 w-3.5 text-stone-500" />
              ) : (
                <span className="text-[8px] bg-brand-500/10 border border-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded font-extrabold">{lang === 'ID' ? 'AKTIF' : 'ACTIVE'}</span>
              )}
            </button>

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
                <span className="truncate">6. {lang === 'ID' ? 'Refleksi Pribadi' : 'Personal Reflection'}</span>
              </div>
              {!isUnlocked && <Lock className="h-3.5 w-3.5 text-stone-500" />}
            </button>

            <button
              disabled={!isUnlocked}
              onClick={() => setActiveTab('actionPlan')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
                activeTab === 'actionPlan' 
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm' 
                  : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
              } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'actionPlan' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">7. {lang === 'ID' ? 'Rencana Tindakan' : 'Field Action Plan'}</span>
              </div>
              {!isUnlocked && <Lock className="h-3.5 w-3.5 text-stone-500" />}
            </button>

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
                <span className="truncate">8. {lang === 'ID' ? 'Ringkasan Eksekutif' : 'Executive Summary'}</span>
              </div>
              {!isUnlocked && <Lock className="h-3.5 w-3.5 text-stone-500" />}
            </button>

            <button
              disabled={!isUnlocked}
              onClick={() => setActiveTab('references')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between cursor-pointer group ${
                activeTab === 'references' 
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold shadow-sm' 
                  : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 border border-transparent'
              } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'references' ? 'bg-brand-500 text-white font-bold' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'}`}>
                  <BookMarked className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">9. {lang === 'ID' ? 'Pusat Referensi' : 'Reference Center'}</span>
              </div>
              {!isUnlocked && <Lock className="h-3.5 w-3.5 text-stone-500" />}
            </button>

          </div>
        </nav>

        {/* Bottom Quick Card / Footer */}
        <div className="p-3 border-t border-stone-800/80 bg-stone-950/60">
          <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-2 text-stone-400">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              <span>{lang === 'ID' ? 'Estimasi' : 'Est. Time'}: <strong className="text-stone-200 font-bold">{localizeDuration(skill.estimatedTime, lang)}</strong></span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {localizeDifficulty(skill.difficulty, lang)}
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className={`sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-3 md:hidden ${darkMode || personalization.theme === 'dark' ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
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
            {onToggleDarkMode && (
              <button onClick={onToggleDarkMode} className="rounded-lg border border-stone-200 p-1.5 dark:border-stone-700" aria-label={lang === 'ID' ? 'Ganti mode warna' : 'Toggle color mode'}>
                {darkMode || personalization.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
        </header>

        {activeTab === 'lessons' && (
          <nav className={`sticky top-14 z-20 flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden ${darkMode || personalization.theme === 'dark' ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`} aria-label={lang === 'ID' ? 'Mode pembelajaran' : 'Learning modes'}>
            {([
              ['card', lang === 'ID' ? 'Bento Card' : 'Bento Cards'],
              ['presentation', lang === 'ID' ? 'Slide' : 'Slides'],
              ['reading', lang === 'ID' ? 'Artikel' : 'Article'],
              ['listen', lang === 'ID' ? 'Audio' : 'Audio'],
            ] as Array<[ContentMode, string]>).map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => setContentMode(mode)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold ${contentMode === mode ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>{label}</button>
            ))}
          </nav>
        )}
        
        {/* HEADER TOOLBAR: MODE SWITCHERS & FLOATING TRIGGERS */}
        <header className={`hidden h-14 border-b px-4 sm:px-6 md:flex items-center justify-between flex-shrink-0 z-10 font-sans transition-colors ${
          darkMode || personalization.theme === 'dark'
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
                darkMode || personalization.theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200'
              }`}>
                <button
                  onClick={() => setContentMode('card')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                    contentMode === 'card' 
                      ? (darkMode || personalization.theme === 'dark' ? 'bg-stone-700 text-stone-100 shadow-sm' : 'bg-white shadow-sm text-stone-900') 
                      : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  {lang === 'ID' ? 'Bento Card' : 'Bento Cards'}
                </button>
                <button
                  onClick={() => setContentMode('presentation')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                    contentMode === 'presentation' 
                      ? (darkMode || personalization.theme === 'dark' ? 'bg-stone-700 text-stone-100 shadow-sm' : 'bg-white shadow-sm text-stone-900') 
                      : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  {lang === 'ID' ? 'Slide' : 'Slides'}
                </button>
                <button
                  onClick={() => setContentMode('reading')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                    contentMode === 'reading' 
                      ? (darkMode || personalization.theme === 'dark' ? 'bg-stone-700 text-stone-100 shadow-sm' : 'bg-white shadow-sm text-stone-900') 
                      : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  {lang === 'ID' ? 'Artikel' : 'Article'}
                </button>
                <button
                  onClick={() => setContentMode('listen')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                    contentMode === 'listen' 
                      ? (darkMode || personalization.theme === 'dark' ? 'bg-stone-700 text-stone-100 shadow-sm' : 'bg-white shadow-sm text-stone-900') 
                      : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  Audio
                </button>
              </div>
            )}

            {/* Quick action triggers */}
            <div className="flex items-center gap-1.5">
              
              {/* Language Switcher */}
              {onLanguageChange && (
                <button
                  onClick={() => onLanguageChange(lang === 'EN' ? 'ID' : 'EN')}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    darkMode || personalization.theme === 'dark'
                      ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700' 
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                  title={lang === 'ID' ? 'Ganti Bahasa (English / Indonesia)' : 'Switch Language'}
                >
                  <Globe className="h-3.5 w-3.5 text-brand-500" />
                  <span>{lang}</span>
                </button>
              )}

              {/* Light / Dark Mode Toggle */}
              {onToggleDarkMode && (
                <button
                  onClick={onToggleDarkMode}
                  className={`p-1.5 rounded-lg border text-xs flex items-center transition-all cursor-pointer ${
                    darkMode || personalization.theme === 'dark'
                      ? 'border-stone-700 bg-stone-800 text-brand-400 hover:bg-stone-700' 
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                  title={lang === 'ID' ? 'Ganti Mode Gelap / Terang' : 'Toggle Dark Mode'}
                >
                  {darkMode || personalization.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}

              {/* Personalization Toggle */}
              <button
                onClick={() => { setPersonalizationOpen(!personalizationOpen); setAnalyticsOpen(false); }}
                title={lang === 'ID' ? 'Pengaturan tampilan' : 'Visual settings'}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  personalizationOpen 
                    ? 'bg-brand-500/20 text-brand-500' 
                    : (darkMode || personalization.theme === 'dark' ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-500 hover:bg-stone-100')
                }`}
              >
                <Sliders className="h-4.5 w-4.5" />
              </button>

              {/* Analytics Toggle */}
              <button
                onClick={() => { setAnalyticsOpen(!analyticsOpen); setPersonalizationOpen(false); }}
                title={lang === 'ID' ? 'Statistik fokus' : 'Focus stats'}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${analyticsOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                <Activity className="h-4.5 w-4.5" />
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

        {isSpeaking && activeTab === 'lessons' && (
          <div className="sticky top-[6.75rem] z-20 flex items-center gap-3 border-b border-brand-500/20 bg-stone-950 px-3 py-2 text-white shadow-sm md:top-0 md:px-6">
            <Volume2 className="h-4 w-4 flex-shrink-0 text-brand-400" />
            <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold">{activeLesson.audio?.title || activeLesson.title}</p><p className="text-[9px] text-stone-400">{lang === 'ID' ? 'Audio tetap diputar saat berpindah tampilan' : 'Audio continues while switching views'}</p></div>
            <button type="button" onClick={handleSpeak} className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white">{isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>
            <button type="button" onClick={handleStopSpeak} className="rounded-lg bg-stone-800 px-2 py-1 text-[9px] font-bold">{lang === 'ID' ? 'Hentikan' : 'Stop'}</button>
          </div>
        )}

        {/* PERSISTENT CONTENT CONTAINER */}
        <div className="flex-grow overflow-y-auto relative w-full max-w-5xl mx-auto px-3 py-5 sm:p-6 md:p-10">
          
          {/* FLOATING ACTION BOXES (PERSONALIZATION & ANALYTICS OVERLAYS) */}
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

            {analyticsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed inset-x-3 top-16 z-40 sm:absolute sm:inset-x-auto sm:top-4 sm:right-6 sm:z-20"
              >
                <LiveAnalytics 
                  completedLessonsCount={progress.completedLessons.length}
                  totalLessonsCount={lessons.length}
                  practiceAnswersCount={practiceAnswersCount}
                  reflectionAnswersCount={reflectionAnswersCount}
                  notesCount={notesCount}
                  bookmarksCount={bookmarksCount}
                  audioUsageCount={isSpeaking ? audioUsageCount + 1 : audioUsageCount}
                  isCompleted={progress.isCompleted}
                  onClose={() => setAnalyticsOpen(false)}
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
                  darkMode || personalization.theme === 'dark'
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
                          {skill.shortDescription}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-stone-950/80 backdrop-blur-md p-2 rounded-2xl border border-stone-800 flex-shrink-0">
                        <div className="text-center px-2.5 border-r border-stone-800">
                          <span className="text-brand-400 font-extrabold text-xs block leading-none">{localizeDuration(skill.estimatedTime, lang)}</span>
                          <span className="text-[8px] text-stone-400 uppercase font-semibold">{lang === 'ID' ? 'Durasi' : 'Duration'}</span>
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

                  {/* Author & Reviewer Bar */}
                  <div className="p-4 sm:p-5 border-t border-stone-200/60 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-brand-500/20 text-brand-500 border border-brand-500/30 flex items-center justify-center font-bold text-sm">
                        {(skill.author || 'S')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100">{skill.author || 'Senior Domain Architect'}</p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                          {lang === 'ID' ? 'Ditinjau oleh Dr. Harrison Sterling • Diperbarui 2 minggu lalu' : 'Reviewed by Dr. Harrison Sterling • Updated 2 weeks ago'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400">
                      <Star className="h-4 w-4 fill-brand-400 text-brand-400" />
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">4.9 / 5.0</span>
                      <span>(150+ {lang === 'ID' ? 'ulasan positif' : 'verified learners'})</span>
                    </div>
                  </div>
                </div>

                {/* Key KPI Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    darkMode || personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Estimasi Waktu' : 'Est. Time'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{localizeDuration(skill.estimatedTime, lang)}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    darkMode || personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <Target className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Tingkat Kesulitan' : 'Difficulty'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{localizeDifficulty(skill.difficulty, lang)}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    darkMode || personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Materi Modul' : 'Lessons'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{lessons.length} {lang === 'ID' ? 'Pelajaran' : 'Lessons'}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    darkMode || personalization.theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-brand-500 mb-1.5">
                      <Brain className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{lang === 'ID' ? 'Tantangan Praktik' : 'Challenges'}</span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{practices.length} {lang === 'ID' ? 'Sandbox' : 'Practices'}</p>
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
                        {skill.problem}
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
                        {skill.transformation}
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
                          darkMode || personalization.theme === 'dark'
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
                  darkMode || personalization.theme === 'dark'
                    ? 'bg-brand-500/5 border-brand-500/20 text-stone-200' 
                    : 'bg-gradient-to-r from-brand-50/80 to-stone-50 border-brand-500/20 text-stone-800 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 text-brand-500 font-extrabold text-[10px] uppercase tracking-widest">
                    <Award className="h-4 w-4" />
                    <span>{lang === 'ID' ? 'Validasi Ilmiah & Bukti Pembelajaran' : 'Evidence-Backed Validation'}</span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-serif italic">
                    "{skill.evidence}"
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
                      const isCompleted = progress.completedLessons.includes(less.id);

                      return (
                        <div
                          key={less.id}
                          onClick={() => openLesson(index)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                            darkMode || personalization.theme === 'dark'
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
                    onClick={() => setActiveTab('contract')}
                    className="w-full sm:w-auto px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-brand-500/20 group"
                  >
                    <span>{lang === 'ID' ? 'Lanjutkan ke Kontrak Belajar' : 'Proceed to Learning Contract'}</span>
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
                    Module 3: Map
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    The Learning Journey
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    View the visual skill pipelines. Progress step-by-step from conceptual theory to active practical mastery.
                  </p>
                </div>

                <div className="relative border-l-2 border-stone-200 pl-6 space-y-8 py-4 max-w-lg mx-auto">
                  
                  {/* Step 1: Why This Skill Matters */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-emerald-500 border-emerald-500 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase">1. Why This Matters</h4>
                      <p className="text-[11px] text-stone-500 leading-normal mt-0.5">{lang === 'ID' ? 'Pahami materi secara berurutan, kuasai konsep, lalu terapkan pada situasi nyata.' : 'Follow the lessons in order, master each concept, and apply it to a real situation.'}</p>
                    </div>
                  </div>

                  {/* Step 2: Core Concept Lessons */}
                  {lessons.map((less, idx) => {
                    const isCompleted = progress.completedLessons.includes(less.id);
                    return (
                      <div key={less.id} className="relative">
                        <div className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500 flex items-center justify-center' : 'bg-white border-stone-300'}`}>
                          {isCompleted && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-stone-900 uppercase">2. Lesson: {less.title}</h4>
                            {isCompleted && <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{lang === 'ID' ? 'DIKUASAI' : 'MASTERED'}</span>}
                          </div>
                          <p className="text-[11px] text-stone-500 leading-normal mt-0.5">Goal: {less.learningObjective}</p>
                          <button
                            disabled={!isLessonAvailable(idx)}
                            onClick={() => openLesson(idx)}
                            className="text-[10px] text-brand-600 hover:text-brand-700 font-extrabold mt-1.5 cursor-pointer block disabled:cursor-not-allowed disabled:text-stone-400"
                          >
                            {isLessonAvailable(idx) ? 'Launch Lesson Card →' : 'Complete previous lesson first'}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Step 3: Sandbox practicing */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-white border-stone-300" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase">3. Practicing Sandbox</h4>
                      <p className="text-[11px] text-stone-500 leading-normal mt-0.5">{lang === 'ID' ? 'Uji pemahaman melalui latihan interaktif dengan dukungan AI.' : 'Test your understanding through interactive exercises with AI support.'}</p>
                    </div>
                  </div>

                  {/* Step 4: Field Action Plan */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-white border-stone-300" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase">4. Action Plan</h4>
                      <p className="text-[11px] text-stone-500 leading-normal mt-0.5">{lang === 'ID' ? 'Susun target untuk hari ini, minggu ini, dan bulan ini.' : 'Set targets for today, this week, and this month.'}</p>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={beginNextLesson}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Enter Core Lessons
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 4: CORE LESSON WORKSPACE */}
            {activeTab === 'lessons' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                
                {/* 4A. BENTO CARD MODE */}
                {contentMode === 'card' && (
                  <article className="mx-auto max-w-5xl space-y-5">
                    
                    {/* Lesson header and reading prompt */}
                    <header className={`${getSubCardClass()} rounded-3xl border p-6 sm:p-8`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                          <BookOpen className="h-3.5 w-3.5" />
                          {lang === 'ID' ? 'Pelajaran' : 'Lesson'} {String(activeLessonIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400">{lang === 'ID' ? 'Pelajaran inti' : 'Core lesson'}</span>
                      </div>
                      <h2 className="mt-5 text-3xl font-extrabold font-heading tracking-tight leading-tight text-stone-950 dark:text-white sm:text-4xl">
                        {activeLesson.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-500 dark:text-stone-300">
                        <span className="font-bold text-stone-800 dark:text-stone-100">{lang === 'ID' ? 'Tujuan belajar:' : 'Learning objective:'}</span> {activeLesson.learningObjective}
                      </p>
                      <div className="mt-6 border-t border-brand-500/15 pt-5">
                        <div className="rounded-2xl border border-brand-500/20 bg-brand-50/60 px-5 py-4 dark:bg-brand-950/25">
                          <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-brand-700 dark:text-brand-300">{lang === 'ID' ? 'Renungkan sebelum melanjutkan' : 'Reflect before you continue'}</span>
                          <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-900 dark:text-stone-100 italic font-serif">
                            "{activeLesson.reflectionPrompt || activeLesson.learningObjective}"
                          </p>
                        </div>
                      </div>
                    </header>

                    {activeLesson.bentoCards?.length ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {activeLesson.bentoCards.map((card) => (
                          <section key={card.id} className={`min-h-36 rounded-2xl border p-5 sm:p-6 ${card.wide ? 'sm:col-span-2' : ''} ${bentoToneClasses[card.tone || 'default']}`}>
                            <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand-500">{card.label}</span>
                            {card.title && <h3 className="mt-2 text-lg font-bold font-heading">{card.title}</h3>}
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{card.content}</p>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Big Picture & Definition */}
                      <div className={`${getSubCardClass()} min-h-36 rounded-2xl border p-5 sm:p-6 space-y-2`}>
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase block">{lang === 'ID' ? 'Gambaran Besar' : 'The Big Picture'}</span>
                        <p className="text-sm leading-relaxed font-sans">{activeLesson.bigPicture}</p>
                      </div>
                      <div className={`${getSubCardClass()} min-h-36 rounded-2xl border border-brand-500/20 p-5 sm:p-6 space-y-2 bg-brand-500/[0.02]`}>
                        <span className="text-[9px] font-extrabold text-brand-600 dark:text-brand-300 uppercase block">{lang === 'ID' ? 'Definisi Inti' : 'The Core Definition'}</span>
                        <p className="text-sm leading-relaxed font-semibold font-sans">{activeLesson.definition}</p>
                      </div>
                    </div>

                    {/* Why It Matters & Somatic Analogy */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={`${getSubCardClass()} min-h-36 rounded-2xl border p-5 sm:p-6 space-y-2`}>
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase block">{lang === 'ID' ? 'Mengapa Penting' : 'Why It Matters'}</span>
                        <p className="text-sm leading-relaxed font-sans">{activeLesson.whyItMatters}</p>
                      </div>
                      <div className={`${getSomaticAnalogyClass()} min-h-36 rounded-2xl border p-5 sm:p-6 space-y-2`}>
                        <span className="text-[9px] font-extrabold text-brand-400 uppercase block">{lang === 'ID' ? 'Analogi Praktis' : 'Practical Analogy'}</span>
                        <p className="text-sm leading-relaxed italic font-serif">"{activeLesson.analogy}"</p>
                      </div>
                    </div>

                    {/* Visual Diagram Display */}
                    {hasVisualContent && activeLesson.visualData && (
                      <div className={`${getSubCardClass()} rounded-2xl border p-5 sm:p-6 space-y-4`}>
                        <h3 className="text-xs font-extrabold text-stone-950 uppercase border-b border-stone-100 pb-2">
                          {activeLesson.visualData.title}
                        </h3>

                        {/* Comparison Split */}
                        {activeLesson.visualType === 'comparison' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                            <div className="p-4 bg-red-500/[0.03] border border-red-500/10 rounded-xl space-y-2">
                              <span className="font-extrabold text-red-700 block uppercase text-[9px]">{activeLesson.visualData.leftTitle}</span>
                              <ul className="space-y-1 list-disc list-inside text-stone-600 text-[11px]">
                                {activeLesson.visualData.leftItems?.map((it, idx) => <li key={idx}>{it}</li>)}
                              </ul>
                            </div>
                            <div className="p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl space-y-2">
                              <span className="font-extrabold text-emerald-700 block uppercase text-[9px]">{activeLesson.visualData.rightTitle}</span>
                              <ul className="space-y-1 list-disc list-inside text-stone-600 text-[11px]">
                                {activeLesson.visualData.rightItems?.map((it, idx) => <li key={idx}>{it}</li>)}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Node Flowchart Diagram */}
                        {activeLesson.visualType === 'diagram' && (
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            {activeLesson.visualData.nodes?.map((node, i) => (
                              <div key={i} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-0.5">
                                <span className="font-bold text-stone-900 block truncate">{node.label}</span>
                                <span className="text-[9px] text-stone-400 block truncate">{node.sub}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Workflow list */}
                        {activeLesson.visualType === 'workflow' && (
                          <div className="space-y-3 font-sans">
                            {activeLesson.visualData.steps?.map((st, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <span className="h-5 w-5 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                                <div className="space-y-0.5">
                                  <span className="font-bold text-xs text-stone-900">{st.label}</span>
                                  <p className="text-[11px] text-stone-500">{st.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* How It Works & Real Example */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={`${getSubCardClass()} rounded-2xl border p-5 sm:p-6 space-y-3`}>
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase block">{lang === 'ID' ? 'Cara Kerja (Langkah)' : 'How It Works (Steps)'}</span>
                        <ol className="list-decimal list-inside text-xs text-stone-700 space-y-1.5 font-sans">
                          {activeLesson.howItWorks?.map((step, idx) => (
                            <li key={idx} className="leading-relaxed"><span className="font-semibold text-stone-900">{step}</span></li>
                          ))}
                        </ol>
                      </div>
                      <div className={`${getSubCardClass()} rounded-2xl border p-5 sm:p-6 space-y-2 bg-stone-50/50`}>
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase block">{lang === 'ID' ? 'Studi Kasus Nyata' : 'Real-World Case Study'}</span>
                        <p className="text-xs leading-relaxed font-serif italic text-stone-700">
                          "{activeLesson.realExample}"
                        </p>
                      </div>
                    </div>

                    {/* Common Mistakes */}
                    <div className="rounded-2xl border border-red-200/50 bg-red-50/30 p-5 sm:p-6 space-y-2">
                      <span className="text-[9px] font-extrabold text-red-600 uppercase block">{lang === 'ID' ? 'Kesalahan Umum' : 'Common Pitfalls'}</span>
                      <ul className="space-y-1 list-disc list-inside text-xs text-stone-700 font-sans">
                        {activeLesson.commonMistakes?.map((mist, idx) => <li key={idx}>{mist}</li>)}
                      </ul>
                    </div>

                    {/* Ultimate Takeaway & Immediate Action Checklist */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 sm:p-6 space-y-2">
                        <span className="text-[9px] font-extrabold text-emerald-600 uppercase block">{lang === 'ID' ? 'Inti Pelajaran' : 'The Core Takeaway'}</span>
                        <p className="text-xs font-bold text-emerald-950 font-sans leading-relaxed">{activeLesson.keyTakeaway}</p>
                      </div>

                      <div className={`${getSubCardClass()} rounded-2xl border p-5 sm:p-6 space-y-2`}>
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase block">{lang === 'ID' ? 'Daftar Penguasaan Materi' : 'Lesson Mastery Checklist'}</span>
                        <div className="space-y-2">
                          {activeLesson.checklist?.map((item, idx) => (
                            <label key={idx} className="flex items-center gap-2 text-xs font-sans cursor-pointer text-stone-700 select-none">
                              <input 
                                type="checkbox" 
                                checked={checklistChecked[`${activeLesson.id}-${idx}`] || false}
                                onChange={() => setChecklistChecked(prev => ({ ...prev, [`${activeLesson.id}-${idx}`]: !prev[`${activeLesson.id}-${idx}`] }))}
                                className="rounded border-stone-300 text-brand-500 focus:ring-brand-500/20"
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mini Practice Sandbox (Lesson specific) */}
                    <div className={`${getSubCardClass()} rounded-2xl border p-5 sm:p-6 space-y-3`}>
                      <span className="text-[9px] font-extrabold text-brand-600 uppercase tracking-wider block">{lang === 'ID' ? 'Simulasi Latihan Singkat' : 'Mini Lesson Practice Simulator'}</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-stone-900">{activeLesson.practiceChallenge?.title}</h4>
                        <p className="text-[11px] text-stone-500 leading-normal font-sans">{activeLesson.practiceChallenge?.instruction}</p>
                      </div>
                      <textarea
                        rows={2}
                        value={miniPracticeAnswers[activeLesson.id] || ''}
                        onChange={(e) => setMiniPracticeAnswers(prev => ({ ...prev, [activeLesson.id]: e.target.value }))}
                        placeholder={lang === 'ID' ? 'Tulis jawaban latihan Anda...' : 'Type your practice response...'}
                        className="w-full p-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff]"
                      />
                      <button
                        onClick={() => handleEvaluateMiniPractice(activeLesson.id)}
                        className="px-3 py-1 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Submit Response
                      </button>
                      {miniPracticeFeedback[activeLesson.id] && (
                        <div className="p-3 bg-stone-50 border rounded-lg text-[11px] text-stone-600 leading-normal font-sans italic">
                          {miniPracticeFeedback[activeLesson.id]}
                        </div>
                      )}
                    </div>

                    {/* Interactive Component Playground */}
                    <LessonComponentsPlayground lang={lang} />

                      </>
                    )}

                  </article>
                )}

                {/* 4B. PRESENTATION MODE */}
                {contentMode === 'presentation' && (
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
                {contentMode === 'reading' && (
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
                {contentMode === 'listen' && (
                  <div className="bg-stone-900 text-stone-200 p-5 sm:p-8 rounded-2xl border border-stone-800 space-y-6 max-w-xl mx-auto font-sans">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-brand-400" />
                        <div>
                          <h4 className="text-xs font-bold text-white">{activeLesson.audio?.title || (lang === 'ID' ? `Audio ${activeLesson.title}` : `${activeLesson.title} Audio`)}</h4>
                          <span className="text-[9px] text-stone-500">{activeLesson.audio?.url ? (lang === 'ID' ? 'Audio rekaman materi' : 'Recorded lesson audio') : (lang === 'ID' ? 'Pembaca suara otomatis' : 'Automatic voice reader')}{activeLesson.audio?.duration ? ` · ${activeLesson.audio.duration}` : ''}</span>
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

                    {activeLesson.audio?.transcript && (
                      <details className="rounded-xl border border-stone-800 bg-stone-950/40 p-3">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase text-brand-400">{lang === 'ID' ? 'Lihat transkrip' : 'View transcript'}</summary>
                        <p className="mt-3 max-h-44 overflow-y-auto whitespace-pre-line text-xs leading-6 text-stone-400">{activeLesson.audio.transcript}</p>
                      </details>
                    )}

                    {/* Audio Customization Parameters */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      
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
                      onClick={handleSaveNotes}
                      className="px-3 py-1 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Commit Notes
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder={lang === 'ID' ? 'Tulis ringkasan dan poin penting Anda...' : 'Write your summary and key takeaways...'}
                    className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff] text-stone-800"
                  />
                </div>

                {/* Footer Next button controls */}
                <div className="pt-6 border-t border-stone-250/30 flex justify-between items-center">
                  <button
                    disabled={activeLessonIdx === 0}
                    onClick={() => setActiveLessonIdx(activeLessonIdx - 1)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-stone-700 font-bold cursor-pointer disabled:opacity-40"
                  >
                    Previous Lesson
                  </button>
                  <button
                    onClick={handleCompleteLesson}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>{activeLessonIdx === lessons.length - 1 ? 'Go to Sandbox Practice' : 'Complete & Continue'}</span>
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
                    Module 5: Active sandbox
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    Practicing Sandbox
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Work through dynamic client scenarios, flashcard memory flips, and matching exercises. Get AI coaching.
                  </p>
                </div>

                {/* Subsections: Quizzes & flashcards */}
                <div className="space-y-6">
                  
                  {/* Matching terms game */}
                  <div className={`${getSubCardClass()} p-5 rounded-2xl border space-y-4`}>
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold text-stone-400 block uppercase">{lang === 'ID' ? 'Latihan Mencocokkan' : 'Matching Sandbox'}</span>
                      <h4 className="text-xs font-bold text-stone-950">{lang === 'ID' ? 'Cocokkan istilah dengan definisinya' : 'Match each term with its definition'}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Left list: terms */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">{lang === 'ID' ? 'Istilah' : 'Vocabulary Term'}</span>
                        {['An Anchor Value', 'Decoy dominance', 'Reactance limit'].map((term) => (
                          <button
                            key={term}
                            onClick={() => handleTermClick(term)}
                            className={`w-full text-left p-3 border rounded-xl text-xs font-bold transition-all ${selectedTerm === term ? 'border-brand-500 bg-brand-50 text-brand-800' : matchedPairs[term] ? 'border-emerald-200 bg-emerald-500/10 text-emerald-900 line-through' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
                          >
                            {term}
                          </button>
                        ))}
                      </div>

                      {/* Right list: definitions */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase">{lang === 'ID' ? 'Definisi' : 'Definition'}</span>
                        {['Rejection urge caused by force', 'Aspirational starting tier', 'Tier pricing highlighting standard deals'].map((def) => (
                          <button
                            key={def}
                            onClick={() => handleTermClick(def)}
                            className={`w-full text-left p-3 border rounded-xl text-xs font-semibold transition-all ${selectedTerm === def ? 'border-brand-500 bg-brand-50 text-brand-800' : Object.values(matchedPairs).includes(def) ? 'border-emerald-200 bg-emerald-500/10 text-emerald-900' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
                          >
                            {def}
                          </button>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Flashcards flip sandbox */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'fc1', front: 'What is Jack Brehms Theory of Reactance?', back: 'Reactance is the psychological pushback that happens when a prospect feels forced into a Yes/No pricing box.' },
                      { id: 'fc2', front: 'How does the Decoy effect steer choices?', back: 'By making the target middle option look vastly superior in features/price ratio compared to standard tiers.' }
                    ].map((card) => {
                      const isFlipped = flashcardFlipped[card.id] || false;
                      return (
                        <div 
                          key={card.id}
                          onClick={() => setFlashcardFlipped(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                          className="aspect-video border border-stone-200/80 rounded-2xl bg-white flex flex-col items-center justify-center text-center p-6 cursor-pointer select-none relative overflow-hidden shadow-sm"
                        >
                          <span className="text-[9px] font-extrabold text-stone-400 uppercase absolute top-4 block">{lang === 'ID' ? 'Ketuk kartu untuk membalik' : 'Tap card to flip'}</span>
                          <p className="text-xs font-bold text-stone-900 leading-relaxed">
                            {isFlipped ? card.back : card.front}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Practice Challenge Simulator with AI Coach Feedback */}
                  {practices.map((prac) => {
                    const feedback = practiceFeedback[prac.id];
                    const loading = isFeedbackLoading[prac.id];
                    return (
                      <div key={prac.id} className={`${getSubCardClass()} p-5 rounded-2xl border space-y-4`}>
                        <div>
                          <span className="text-[9px] font-extrabold text-stone-400 block uppercase">{lang === 'ID' ? 'Simulasi Skenario Interaktif' : 'Interactive Scenario Roleplay'}</span>
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
                                onClick={() => setUserPracticeAnswers(prev => ({ ...prev, [prac.id]: opt }))}
                                className={`w-full text-left p-3 border rounded-xl text-xs cursor-pointer transition-all ${userPracticeAnswers[prac.id] === opt ? 'border-brand-500 bg-brand-50 text-brand-800 font-bold' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            rows={3}
                            value={userPracticeAnswers[prac.id] || ''}
                            onChange={(e) => setUserPracticeAnswers(prev => ({ ...prev, [prac.id]: e.target.value }))}
                            placeholder={lang === 'ID' ? 'Tulis jawaban Anda di sini...' : 'Draft your response here...'}
                            className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff] text-stone-800"
                          />
                        )}

                        <button
                          onClick={() => handlePracticeSubmit(prac.id)}
                          className="px-4 py-2 bg-stone-950 hover:bg-stone-850 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Submit Draft to AI Coach
                        </button>

                        {loading && (
                          <div className="flex items-center space-x-2 text-xs text-stone-500">
                            <RefreshCw className="h-4 w-4 animate-spin text-brand-500" />
                            <span>{lang === 'ID' ? 'AI Coach sedang menganalisis jawaban Anda...' : 'AI Coach is analyzing your answer...'}</span>
                          </div>
                        )}

                        {feedback && (
                          <div className="p-4 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl space-y-1.5 text-xs font-sans">
                            <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">{lang === 'ID' ? 'Saran dari AI' : 'AI feedback suggestions'}</span>
                            <p className="text-stone-700 leading-normal">{feedback}</p>
                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={() => setActiveTab('reflection')}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Go to Personal Reflection
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 6: PERSONAL REFLECTION */}
            {activeTab === 'reflection' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    Module 6: Reflection
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    Active Evaluations
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Reflect on your previous pricing structures, and write deep answers to cement today's learning objectives.
                  </p>
                </div>

                <div className="space-y-5 max-w-2xl mx-auto">
                  {skill.reflection?.map((ref) => (
                    <div key={ref.id} className={`${getSubCardClass()} p-5 rounded-2xl border space-y-3`}>
                      <div>
                        <h4 className="text-xs font-bold text-stone-950">{ref.question}</h4>
                        <span className="text-[9px] text-stone-400 block mt-0.5">{ref.context}</span>
                      </div>
                      <textarea
                        rows={2}
                        value={userReflectionAnswers[ref.id] || ''}
                        onChange={(e) => setUserReflectionAnswers(prev => ({ ...prev, [ref.id]: e.target.value }))}
                        placeholder={ref.helperPrompt}
                        className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff] text-stone-800"
                      />
                      <button
                        onClick={() => handleReflectionSubmit(ref.id)}
                        className="px-3.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded cursor-pointer"
                      >
                        Save Evaluation
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={() => setActiveTab('actionPlan')}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Build Field Action Plan
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 7: FIELD ACTION PLAN */}
            {activeTab === 'actionPlan' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    Module 7: Field tasks
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    Post-Course Action Plan
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Formulate exact operational tasks for Today, This Week, and This Month. Schedule calendar alerts for commitment.
                  </p>
                </div>

                <div className="space-y-4 max-w-2xl mx-auto font-sans">
                  {skill.actionPlan?.map((plan, idx) => (
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
                    View Executive Summary
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 8: EXECUTIVE SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2 text-center max-w-xl mx-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                    Module 8: Summary
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading text-stone-950 tracking-tight leading-tight">
                    Executive Summary
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Review mental frameworks, high-density cheat sheets, and download the executive PDF workbook.
                  </p>
                </div>

                <div className="space-y-5 max-w-2xl mx-auto">
                  
                  {/* Summary Core Block */}
                  <div className={`${getSubCardClass()} p-6 rounded-2xl border space-y-3`}>
                    <span className="text-[9px] font-extrabold text-brand-600 block uppercase">{lang === 'ID' ? 'Ringkasan Inti' : 'The Core Summary'}</span>
                    <p className="text-xs leading-relaxed font-serif italic text-stone-700">
                      "{skill.summary}"
                    </p>
                  </div>

                  {/* Cheat sheet key rules */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-stone-900 text-stone-300 p-5 rounded-2xl border border-stone-800 space-y-2 text-xs">
                      <span className="text-[9px] font-extrabold text-brand-400 block uppercase font-mono">{lang === 'ID' ? 'Kerangka Mental 01' : 'Mental Framework 01'}</span>
                      <h4 className="font-bold text-white text-sm">{lang === 'ID' ? 'Dominasi pilihan pembanding' : 'Decoy dominance'}</h4>
                      <p className="leading-relaxed text-stone-400 font-sans">{lang === 'ID' ? 'Tempatkan proposal utama di dekat pilihan pembanding agar keputusan terasa lebih mudah.' : 'Place the main proposal next to an asymmetric decoy to make the choice easier.'}</p>
                    </div>

                    <div className="bg-stone-900 text-stone-300 p-5 rounded-2xl border border-stone-800 space-y-2 text-xs">
                      <span className="text-[9px] font-extrabold text-brand-400 block uppercase font-mono">{lang === 'ID' ? 'Kerangka Mental 02' : 'Mental Framework 02'}</span>
                      <h4 className="font-bold text-white text-sm">{lang === 'ID' ? 'Mengurangi resistensi' : 'Reactance mitigation'}</h4>
                      <p className="leading-relaxed text-stone-400 font-sans">{lang === 'ID' ? 'Ganti pertanyaan Ya/Tidak dengan pilihan yang jelas. Tanyakan “bagaimana”, bukan “apakah”.' : 'Replace hard Yes/No questions with clear choices. Ask “how” instead of “if”.'}</p>
                    </div>
                  </div>

                  {/* Download Summary PDF mock */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex justify-between items-center flex-wrap gap-2 text-xs">
                    <div>
                      <h4 className="font-bold text-stone-900">{lang === 'ID' ? 'Paket PDF Ringkasan Eksekutif' : 'Executive Summary PDF Pack'}</h4>
                      <span className="text-[9px] text-stone-500 font-sans">{lang === 'ID' ? 'Ringkasan visual, kartu belajar, dan rumus' : 'Visual summaries, flashcards, and formulas'}</span>
                    </div>
                    <button
                      onClick={() => alert(lang === 'ID' ? 'Unduhan dimulai. Periksa folder unduhan browser.' : 'Download started. Check your browser downloads folder.')}
                      className="px-4 py-2 bg-stone-950 hover:bg-stone-850 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Download PDF Book
                    </button>
                  </div>

                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={() => setActiveTab('references')}
                    className="px-6 py-3 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Read References & Citations
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

                {/* Actions & Next steps */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={onBack}
                    className="px-5 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {lang === 'ID' ? 'Kembali ke Skill Saya' : 'Return to My Library'}
                  </button>
                  <button
                    onClick={() => {
                      alert(lang === 'ID' ? 'Tautan berhasil disalin!' : 'Sharing link copied!');
                    }}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {lang === 'ID' ? 'Bagikan Sertifikat' : 'Share Certificate'}
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
          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-[#f8fbff]">
            {aiMessages.length === 0 && (
              <div className="text-center py-10 text-stone-400 space-y-2">
                <HelpCircle className="h-7 w-7 mx-auto text-stone-300" />
                <p className="text-[10px] leading-relaxed max-w-xs mx-auto">
                  {lang === 'ID' ? 'Tulis pertanyaan atau pilih pertanyaan cepat di atas untuk meminta bantuan Mentor AI.' : 'Type a question or choose a quick prompt above to get help from your AI Mentor.'}
                </p>
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
