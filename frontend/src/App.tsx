/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { 
  Compass, BookOpen, Shield, Clock,
  ArrowRight, Star, AlertCircle, RefreshCw, MessageSquare,
  Sun, Moon, Globe, Search, CheckCircle2, Sparkles, Home, LogOut, ChevronRight, TrendingUp, Trophy
} from 'lucide-react';
import { LeaderboardEntry, SkillPill, SkillPillPlan, UserProfile, UserProgress } from './types';
import PublicDirectory from './components/PublicDirectory';
import LandingPage from './components/LandingPage';
import LearningPlayer from './components/LearningPlayer';
import AuthPage from './components/AuthPage';
import ProfileModal from './components/ProfileModal';

import FeedbackModal from './components/FeedbackModal';
import { convertDollarTextDeep, formatRupiah, localizeCategory, localizeDuration } from './lib/localization';
import TermsDisclaimerModal from './components/TermsDisclaimerModal';
import AccountDropdown from './components/AccountDropdown';
import PlanBadgeToggle from './components/PlanBadgeToggle';
import ProPlanModal from './components/ProPlanModal';
import { Language } from './lib/translations';
import { setCurrentUser, logoutUser } from './lib/userStore';
import { apiFetch, clearToken, getToken } from './lib/api';
import { normalizeSkills } from './lib/learningData';

const SITE_URL = 'https://skillpill.kembangin.online';
const DEFAULT_SEO_TITLE = 'SkillPill — Belajar Skill Praktis dalam 30 Menit';
const DEFAULT_SEO_DESCRIPTION = 'Pelajari skill praktis melalui materi mikro yang terarah, interaktif, dan dapat langsung diterapkan bersama SkillPill.';

type LearnPageWrapperProps = {
  skills: SkillPill[];
  ownedSkillIds?: string[];
  progressStore: Record<string, UserProgress>;
  lang: Language;
  onBack: () => void;
  onUpdateProgress: (skillId: string, data: Partial<UserProgress>) => Promise<boolean>;
  onLanguageChange: (lang: Language) => void;
  onOpenFeedback: () => void;
  onGoToMySkills: () => void;
};

function LearnPageWrapper({
  skills,
  ownedSkillIds = [],
  progressStore,
  lang,
  onBack,
  onUpdateProgress,
  onLanguageChange,
  onOpenFeedback,
  onGoToMySkills,
}: LearnPageWrapperProps) {
  const { skillId } = useParams<{ skillId: string }>();
  const [searchParams] = useSearchParams();
  const skill = skills.find((item) => item.id === skillId);

  if (!skill) {
    return (
      <div className="min-h-screen bg-[#f8fbff] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-brand-500" />
        <h2 className="text-xl font-bold font-heading">{lang === 'ID' ? 'Materi Belajar Tidak Ditemukan' : 'Learning Content Not Found'}</h2>
        <p className="text-xs text-stone-500 max-w-xs">{lang === 'ID' ? 'Modul pembelajaran tidak ditemukan.' : 'The learning module could not be found.'}</p>
        <button onClick={onGoToMySkills} className="px-4 py-2 bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md">
          {lang === 'ID' ? 'Ke Skill Saya' : 'Go to My Skills'}
        </button>
      </div>
    );
  }

  if (!ownedSkillIds.includes(skill.id)) {
    return <Navigate to={`/skill/${skill.id}`} replace />;
  }

  const progress = progressStore[skill.id] || {
    skillId: skill.id,
    completedLessons: [],
    isCompleted: false,
    practiceAnswers: {},
    reflectionAnswers: {},
    notes: {},
  };

  return (
    <LearningPlayer
      skill={skill}
      progress={progress}
      onBack={onBack}
      onUpdateProgress={(data) => onUpdateProgress(skill.id, data)}
      lang={lang}
      onLanguageChange={onLanguageChange}
      onOpenFeedback={onOpenFeedback}
      resumeFromProgress={searchParams.get('resume') === '1'}
    />
  );
}

function RequireLearnerAuth({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: React.ReactElement;
}) {
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [skills, setSkills] = useState<SkillPill[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressStore, setProgressStore] = useState<Record<string, UserProgress>>({});
  const [plans, setPlans] = useState<SkillPillPlan[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Deploy Standards State
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<Language>('ID');

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsInitialTab, setTermsInitialTab] = useState<'privacy' | 'terms' | 'disclaimer'>('disclaimer');
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Active user plan ('free' or 'pro')
  const currentPlan = profile?.plan || 'free';
  const requestedPath = (location.state as { from?: unknown } | null)?.from;
  const postLoginPath =
    typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/dashboard';
  const learnerIsAuthenticated = Boolean(profile && getToken());

  const navigateToLearnerPortal = () => {
    navigate(profile ? '/dashboard' : '/login');
  };

  const openPlatformFeedback = () => {
    if (!profile) {
      navigate('/login');
      return;
    }
    setIsFeedbackOpen(true);
  };

  const handleTogglePlan = (newPlan: 'free' | 'pro') => {
    if (!profile || newPlan !== 'pro' || profile.plan === 'pro') return;
    void (async () => {
      try {
        const response = await apiFetch('/api/payments/midtrans/plan/snap', { method: 'POST' });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || 'Upgrade ke Pro gagal.');

        await loadMidtransSnap(data.snapUrl, data.clientKey);
        const snap = (window as typeof window & {
          snap?: { pay: (token: string, callbacks: Record<string, () => void>) => void };
        }).snap;
        if (!snap) throw new Error('Pembayaran belum siap.');

        snap.pay(data.snapToken, {
          onSuccess: () => {
            void apiFetch(`/api/payments/midtrans/${data.order.id}/sync`, { method: 'POST' })
              .then((syncResponse) => syncResponse.json().then((result) => ({ syncResponse, result })))
              .then(({ syncResponse, result }) => {
                if (!syncResponse.ok) throw new Error(result.error || 'Status pembayaran tidak dapat diperbarui.');
                if (result.profile) {
                  setProfile(result.profile);
                  setCurrentUser(result.profile);
                }
                if (result.progress) setProgressStore(result.progress);
                if (result.order.status !== 'paid') window.alert('Pembayaran sedang dikonfirmasi. Paket Pro akan aktif setelah pembayaran berhasil.');
              })
              .catch((error) => window.alert(error instanceof Error ? error.message : 'Status pembayaran tidak dapat diperbarui.'));
          },
          onPending: () => window.alert('Pembayaran masih menunggu. Paket Pro aktif setelah pembayaran berhasil.'),
          onError: () => window.alert('Pembayaran tidak berhasil. Silakan coba lagi.'),
          onClose: () => undefined,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Upgrade ke Pro gagal.');
      }
    })();
  };

  const refreshSkills = async () => {
    const response = await apiFetch('/api/skills');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Katalog Skill tidak dapat dimuat.');
    setSkills(normalizeSkills(convertDollarTextDeep(data)));
  };

  const refreshLeaderboard = async () => {
    const response = await apiFetch('/api/leaderboard');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Leaderboard tidak dapat dimuat.');
    setLeaderboard(Array.isArray(data) ? data : []);
  };

  // Load all initial state on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [, plansRes] = await Promise.all([refreshSkills(), apiFetch('/api/plans')]);
        if (plansRes.ok) setPlans(await plansRes.json());

        // Route profil hanya dipanggil ketika sesi JWT memang tersedia.
        if (getToken()) {
          try {
            const profileRes = await apiFetch('/api/profile');
            if (!profileRes.ok) throw new Error('Belum login');
            const profileData = await profileRes.json();
            if (profileData.profile?.role === 'admin') {
              clearToken();
              logoutUser();
              setProfile(null);
              return;
            }
            setProfile(profileData.profile);
            setProgressStore(profileData.progress || {});
            try {
              await refreshLeaderboard();
            } catch {
              setLeaderboard([]);
            }
          } catch {
            logoutUser();
            setProfile(null);
            setProgressStore({});
            setLeaderboard([]);
          }
        } else {
          logoutUser();
          setProfile(null);
          setProgressStore({});
          setLeaderboard([]);
        }

      } catch (err) {
        console.error('Failed to load full-stack initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Scroll to top automatically when navigating route
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    const privateRoute = /^(\/dashboard|\/my-skills|\/catalog|\/leaderboard|\/learn(?:\/|$)|\/login|\/register)/.test(location.pathname);
    const skillId = location.pathname.match(/^\/skill\/([^/]+)\/?$/)?.[1];
    const skill = skillId ? skills.find((item) => item.id === decodeURIComponent(skillId)) : undefined;
    const title = skill ? `${skill.title} | SkillPill` : DEFAULT_SEO_TITLE;
    const description = skill?.overview.headline || DEFAULT_SEO_DESCRIPTION;
    const canonicalUrl = skill ? `${SITE_URL}/skill/${encodeURIComponent(skill.id)}` : `${SITE_URL}/`;

    document.title = title;

    const setMeta = (selector: string, content: string) => {
      document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content);
    };

    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', privateRoute ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('meta[name="googlebot"]', privateRoute ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
  }, [location.pathname, skills]);

  const loadMidtransSnap = (snapUrl: string, clientKey: string) => new Promise<void>((resolve, reject) => {
    const isReady = () => Boolean((window as typeof window & { snap?: unknown }).snap);
    if (isReady()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-snap';
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => isReady() ? resolve() : reject(new Error('Pembayaran belum siap.'));
    script.onerror = () => reject(new Error('Layanan pembayaran tidak dapat dimuat.'));
    document.head.appendChild(script);
  });

  const handlePurchase = async (skillId: string) => {
    try {
      const res = await apiFetch('/api/payments/midtrans/snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Pembayaran tidak dapat dimulai.');
      }

      await loadMidtransSnap(data.snapUrl, data.clientKey);

      await new Promise<void>((resolve, reject) => {
        const snap = (window as typeof window & {
          snap?: { pay: (token: string, callbacks: Record<string, () => void>) => void };
        }).snap;
        if (!snap) {
          reject(new Error('Pembayaran belum siap.'));
          return;
        }

        const syncPayment = async () => {
          const response = await apiFetch(`/api/payments/midtrans/${data.order.id}/sync`, { method: 'POST' });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Status pembayaran tidak dapat diperbarui.');
          if (result.profile) setProfile(result.profile);
          if (result.progress) setProgressStore(result.progress);
          if (result.order.status === 'paid') await refreshSkills();
          return result.order.status;
        };

        snap.pay(data.snapToken, {
          onSuccess: () => void syncPayment().then((status) => {
            if (status !== 'paid') window.alert('Pembayaran sedang dikonfirmasi. Akses Skill akan terbuka setelah pembayaran berhasil.');
            resolve();
          }).catch(reject),
          onPending: () => {
            window.alert('Pembayaran masih menunggu. Selesaikan pembayaran untuk membuka akses Skill.');
            resolve();
          },
          onError: () => reject(new Error('Pembayaran tidak berhasil. Silakan coba lagi.')),
          onClose: () => resolve(),
        });
      });
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateProgressForSkill = async (skillId: string, updatedData: Partial<UserProgress>) => {
    try {
      const res = await apiFetch('/api/profile/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          ...updatedData
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Progress tidak dapat disimpan.');
      }
      setProgressStore(prev => ({ ...prev, [skillId]: data.progress }));
      setProfile(data.profile);
      try {
        await refreshLeaderboard();
      } catch (error) {
        console.error('Failed to refresh leaderboard:', error);
      }
      return true;
    } catch (err) {
      console.error('Failed to update progress on server:', err);
      return false;
    }
  };

  const handleLogout = () => {
    logoutUser();
    clearToken();
    setProfile(null);
    setLeaderboard([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm font-semibold text-stone-600 font-heading">{lang === 'ID' ? 'Menyiapkan SkillPill...' : 'Initializing SkillPill...'}</p>
      </div>
    );
  }

  // Related skills generator helper (Ensures exactly 3 related skills are returned)
  const getRelatedSkills = (skill: SkillPill): SkillPill[] => {
    if (!skill) return [];
    let related = skills.filter(s => skill.summary.relatedSkills.includes(s.id) && s.id !== skill.id);
    if (related.length < 3) {
      const additional = skills.filter(s => s.id !== skill.id && !related.some(r => r.id === s.id));
      related = [...related, ...additional];
    }
    return related.slice(0, 3);
  };

  // Route Wrappers
  function SkillPageWrapper() {
    const { skillId } = useParams<{ skillId: string }>();
    const skill = skills.find(s => s.id === skillId);

    if (!skill) {
      return (
        <div className="min-h-screen bg-[#f8fbff] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-brand-500" />
          <h2 className="text-xl font-bold font-heading">{lang === 'ID' ? 'SkillPill Tidak Ditemukan' : 'SkillPill Not Found'}</h2>
          <p className="text-xs text-stone-500 max-w-xs">SkillPill dengan ID "{skillId}" tidak ditemukan dalam katalog.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Kembali ke Home
          </button>
        </div>
      );
    }

    return (
      <LandingPage 
        skill={skill}
        onBack={() => {
          if ((profile?.purchasedSkillPills || []).includes(skill.id)) {
            navigate('/my-skills');
          } else if (profile) {
            navigate('/catalog');
          } else {
            navigate('/');
          }
        }}
        onPurchase={handlePurchase}
        ownedSkills={profile?.purchasedSkillPills || []}
        progress={progressStore[skill.id]}
        onStartLearning={(learnedSkill, mode) => navigate(`/learn/${learnedSkill.id}${mode === 'resume' ? '?resume=1' : ''}`)}
        relatedSkills={getRelatedSkills(skill)}
        onSelectRelated={(relSkill) => navigate(`/skill/${relSkill.id}`)}
        darkMode={darkMode}
        profile={profile}
        lang={lang}
        onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')}
        onOpenFeedback={openPlatformFeedback}
        onUpgradePlan={() => handleTogglePlan('pro')}
      />
    );
  }

  function LearnerPortalWrapper({ activeTab }: { activeTab: 'home' | 'my-skills' | 'catalog' | 'leaderboard' }) {
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogCategory, setCatalogCategory] = useState('ALL');
    const ownedSkills = skills.filter((skill) => (profile?.purchasedSkillPills || []).includes(skill.id));
    const progressFor = (skill: SkillPill) => {
      const progress = progressStore[skill.id] || { completedLessons: [] };
      if (progress.isCompleted) return 100;
      const completed = (progress.completedLessons || []).filter((lessonId) => skill.lessons.some((lesson) => lesson.id === lessonId)).length;
      return skill.lessons.length ? Math.round((completed / skill.lessons.length) * 100) : 0;
    };
    const continueSkill = ownedSkills.find((skill) => progressFor(skill) < 100) || ownedSkills[0];
    const recommendedSkills = skills.filter((skill) => !ownedSkills.some((owned) => owned.id === skill.id)).slice(0, 3);
    const topLeaderboard = leaderboard.slice(0, 3);
    const currentLeaderboardEntry = leaderboard.find((entry) => entry.user.id === profile?.id);
    const navItems = [
      { id: 'home' as const, label: lang === 'ID' ? 'Beranda' : 'Home', icon: Home, path: '/dashboard' },
      { id: 'my-skills' as const, label: lang === 'ID' ? 'Skill Saya' : 'My Skills', icon: BookOpen, path: '/my-skills' },
      { id: 'catalog' as const, label: lang === 'ID' ? 'Katalog Skill' : 'Skill Catalog', icon: Compass, path: '/catalog' },
      { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    ];

    return (
      <div className={`h-dvh w-full overflow-hidden p-3 sm:p-5 lg:p-6 ${darkMode ? 'text-white' : ''}`}>
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1480px] gap-5 lg:grid-cols-[252px_minmax(0,1fr)]">
          <aside className={`hidden h-full self-start flex-col overflow-hidden rounded-[28px] border p-4 shadow-sm lg:flex ${darkMode ? 'border-stone-800 bg-stone-900/90' : 'border-stone-200 bg-white'}`}>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-2 py-2 text-left">
              <img src="/logo.png" alt="SkillPill" className="size-9 object-contain" />
              <span><strong className="block font-heading text-base leading-none">SkillPill</strong><small className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">{lang === 'ID' ? 'Ruang belajar' : 'Learning space'}</small></span>
            </button>
            <p className="mt-8 px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">{lang === 'ID' ? 'Ruang belajar' : 'Learning space'}</p>
            <nav className="mt-3 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return <button key={item.id} onClick={() => navigate(item.path)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all ${isActive ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-stone-600 hover:bg-brand-500/10 hover:text-brand-600 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white'}`}>
                  <Icon className="size-4" /><span>{item.label}</span>
                </button>;
              })}
            </nav>
            <div className={`mt-6 rounded-2xl border p-3 ${darkMode ? 'border-stone-800 bg-stone-950/40' : 'border-brand-100 bg-brand-50/50'}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-500">{lang === 'ID' ? 'Paket Anda' : 'Your plan'}</p>
              <div className="mt-2 flex items-center justify-between gap-2"><strong className="text-sm uppercase">{currentPlan}</strong><button onClick={() => currentPlan === 'free' && setIsProModalOpen(true)} className="text-[10px] font-bold text-brand-600 hover:underline">{currentPlan === 'free' ? (lang === 'ID' ? 'Upgrade Pro' : 'Upgrade Pro') : (lang === 'ID' ? 'Aktif' : 'Active')}</button></div>
            </div>
            <div className="mt-auto border-t border-stone-100 pt-4 dark:border-stone-800">
              <button onClick={() => setIsProfileOpen(true)} className="flex w-full items-center gap-2.5 rounded-2xl p-2 text-left hover:bg-stone-50 dark:hover:bg-stone-800">
                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} className="size-9 rounded-xl object-cover" /> : <span className="grid size-9 place-items-center rounded-xl bg-brand-500/10 text-xs font-black text-brand-600">{(profile?.name || 'U').charAt(0).toUpperCase()}</span>}
                <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{profile?.name || (lang === 'ID' ? 'Pengguna' : 'User')}</strong><small className="block truncate text-[10px] text-stone-400">{profile?.email || ''}</small></span>
              </button>
              <button onClick={() => { handleLogout(); navigate('/'); }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"><LogOut className="size-4" />{lang === 'ID' ? 'Keluar' : 'Logout'}</button>
            </div>
          </aside>

          <main className="h-full min-h-0 min-w-0 space-y-6 overflow-y-auto pr-0.5 sm:space-y-7">
            <div className={`sticky top-0 z-30 flex flex-col gap-3 rounded-[24px] border px-3 py-3 shadow-sm sm:px-5 lg:flex-row lg:items-center lg:justify-between ${darkMode ? 'border-stone-800 bg-stone-900/95' : 'border-stone-200 bg-white/95 backdrop-blur'}`}>
              <div className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:hidden">
                {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.path)} className={`flex min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-bold sm:text-xs ${activeTab === item.id ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}><Icon className="size-3" /><span className="truncate">{item.label}</span></button>; })}
              </div>
              <div className="relative z-20 flex w-full flex-wrap items-center justify-between gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
            {/* Free/Pro Badge & Toggle - ONLY VISIBLE WHEN LOGGED IN */}
            {profile && (
              <PlanBadgeToggle 
                currentPlan={currentPlan}
                onTogglePlan={handleTogglePlan}
                onOpenPlanModal={() => setIsProModalOpen(true)}
                plans={plans}
                lang={lang}
                darkMode={darkMode}
              />
            )}

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'EN' ? 'ID' : 'EN')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                darkMode 
                  ? 'border-stone-800 bg-stone-900 text-stone-200 hover:bg-stone-800' 
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 shadow-sm'
              }`}
                title={lang === 'ID' ? 'Ganti bahasa' : 'Switch language'}
            >
              <Globe className="h-3.5 w-3.5 text-brand-500" />
              <span>{lang}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border text-xs flex items-center transition-colors ${
                darkMode 
                  ? 'border-stone-800 bg-stone-900 text-brand-400 hover:bg-stone-800' 
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 shadow-sm'
              }`}
              title={lang === 'ID' ? 'Ganti mode warna' : 'Toggle color mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Account Dropdown */}
            {profile && (
              <AccountDropdown 
                profile={profile}
                lang={lang}
                darkMode={darkMode}
                onOpenProfile={() => setIsProfileOpen(true)}

                onLogout={() => { handleLogout(); navigate('/'); }}
              />
            )}
              </div>
            </div>

        {activeTab === 'home' ? (
          <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-200">
            <section className={`relative overflow-hidden rounded-[28px] border p-6 sm:p-8 ${darkMode ? 'border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950' : 'border-brand-100 bg-gradient-to-br from-brand-500/10 via-white to-cyan-50'}`}>
              <div className="relative z-10 max-w-2xl"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-500">{lang === 'ID' ? 'Ruang belajar pribadi' : 'Your learning space'}</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{lang === 'ID' ? `Halo, ${profile?.name?.split(' ')[0] || 'Pembelajar'}!` : `Welcome back, ${profile?.name?.split(' ')[0] || 'Learner'}!`}</h1><p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{lang === 'ID' ? 'Lanjutkan langkah kecil hari ini untuk membangun kemampuan yang lebih besar.' : 'Continue with a small step today to build stronger skills.'}</p></div>
              <Sparkles className="absolute -right-6 -bottom-8 size-44 text-brand-500/15" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
              <div className={`rounded-3xl border p-5 sm:p-6 ${darkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white shadow-sm'}`}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500">{lang === 'ID' ? 'Lanjutkan pembelajaran' : 'Continue learning'}</p><h2 className="mt-1 text-xl font-bold">{continueSkill ? continueSkill.title : (lang === 'ID' ? 'Mulai perjalanan belajar Anda' : 'Start your learning journey')}</h2></div>{continueSkill && <span className="rounded-xl bg-brand-500/10 px-2.5 py-1 text-xs font-extrabold text-brand-600">{progressFor(continueSkill)}%</span>}</div>
                {continueSkill ? <><p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{continueSkill.overview.headline}</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full rounded-full bg-brand-500" style={{ width: `${progressFor(continueSkill)}%` }} /></div><button onClick={() => navigate(`/learn/${continueSkill.id}`)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600">{lang === 'ID' ? 'Lanjutkan Belajar' : 'Continue Learning'}<ChevronRight className="size-4" /></button></> : <button onClick={() => navigate('/catalog')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white">{lang === 'ID' ? 'Jelajahi Katalog' : 'Explore Catalog'}<ChevronRight className="size-4" /></button>}
              </div>
              <div className={`rounded-3xl border p-5 ${darkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white shadow-sm'}`}><p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500">{lang === 'ID' ? 'Progress Anda' : 'Your progress'}</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-brand-500/10 p-3"><Clock className="size-4 text-brand-500" /><strong className="mt-3 block text-xl">{(profile?.learningHours || 0).toFixed(1)}h</strong><span className="text-[10px] text-stone-500">{lang === 'ID' ? 'Jam belajar' : 'Learning hours'}</span></div><div className="rounded-2xl bg-emerald-500/10 p-3"><BookOpen className="size-4 text-emerald-600" /><strong className="mt-3 block text-xl">{profile?.completedSkillCount || 0}</strong><span className="text-[10px] text-stone-500">{lang === 'ID' ? 'Skill selesai' : 'Completed skills'}</span></div></div><p className="mt-4 text-xs text-stone-500 dark:text-stone-400">{ownedSkills.length} {lang === 'ID' ? 'skill ada di ruang belajar Anda.' : 'skills in your learning space.'}</p></div>
            </section>

            <section><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500">{lang === 'ID' ? 'Untuk Anda' : 'For you'}</p><h2 className="mt-1 text-xl font-bold">{lang === 'ID' ? 'Rekomendasi Skill' : 'Recommended skills'}</h2></div><button onClick={() => navigate('/catalog')} className="text-xs font-bold text-brand-600 hover:underline">{lang === 'ID' ? 'Lihat semua' : 'See all'}</button></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{recommendedSkills.map((skill) => <button key={skill.id} onClick={() => navigate(`/skill/${skill.id}`)} className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/50 ${darkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white shadow-sm'}`}><span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-500">{localizeCategory(skill.category, lang)}</span><h3 className="mt-2 line-clamp-2 text-sm font-bold">{skill.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500 dark:text-stone-400">{skill.overview.headline}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-600">{lang === 'ID' ? 'Lihat Skill' : 'View skill'}<ChevronRight className="size-3.5" /></span></button>)}</div></section>

            <section className={`rounded-3xl border p-5 sm:p-6 ${darkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white shadow-sm'}`}>
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500">{lang === 'ID' ? 'Peringkat pembelajar' : 'Learner rankings'}</p><h2 className="mt-1 text-xl font-bold">Leaderboard</h2></div>
                <button onClick={() => navigate('/leaderboard')} className="text-xs font-bold text-brand-600 hover:underline">{lang === 'ID' ? 'Lihat lengkap' : 'View all'}</button>
              </div>
              {topLeaderboard.length > 0 ? <div className="mt-5 grid gap-3 sm:grid-cols-3">{topLeaderboard.map((entry) => <div key={entry.user.id} className={`rounded-2xl border p-4 ${darkMode ? 'border-stone-800 bg-stone-950/40' : 'border-stone-100 bg-stone-50/70'}`}><div className="flex items-center justify-between gap-2"><span className="text-lg font-black text-brand-500">#{entry.rank}</span>{entry.plan === 'pro' && <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-extrabold text-brand-600">PRO</span>}</div><p className="mt-3 truncate text-sm font-bold">{entry.name}</p><p className="mt-1 text-xs font-bold text-brand-600">{entry.xp.toLocaleString('id-ID')} XP</p><p className="mt-1 text-[10px] text-stone-500 dark:text-stone-400">{entry.completedSkills} {lang === 'ID' ? 'skill selesai' : 'skills completed'}</p></div>)}</div> : <p className="mt-5 text-sm text-stone-500 dark:text-stone-400">{lang === 'ID' ? 'Selesaikan lesson untuk mulai masuk leaderboard.' : 'Complete lessons to enter the leaderboard.'}</p>}
              {currentLeaderboardEntry && <div className={`mt-4 flex items-center justify-between rounded-2xl px-4 py-3 text-xs ${darkMode ? 'bg-brand-500/10' : 'bg-brand-50'}`}><span className="font-bold">{lang === 'ID' ? 'Posisi Anda' : 'Your rank'}: #{currentLeaderboardEntry.rank}</span><span className="font-extrabold text-brand-600">{currentLeaderboardEntry.xp.toLocaleString('id-ID')} XP</span></div>}
            </section>

            <section className={`flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between ${darkMode ? 'border-stone-800 bg-stone-900' : 'border-brand-100 bg-brand-50/50'}`}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-brand-500 text-white"><Shield className="size-5" /></span><div><p className="text-sm font-bold">{currentPlan === 'pro' ? 'SkillPill Pro' : 'SkillPill Free'}</p><p className="text-xs text-stone-500 dark:text-stone-400">{currentPlan === 'pro' ? (profile?.proExpiresAt ? (lang === 'ID' ? `Akses Pro aktif hingga ${new Date(profile.proExpiresAt).toLocaleDateString('id-ID')}.` : `Pro access is active until ${new Date(profile.proExpiresAt).toLocaleDateString('en-US')}.`) : (lang === 'ID' ? 'Akses Pro Anda aktif.' : 'Your Pro access is active.')) : (lang === 'ID' ? 'Naikkan paket untuk membuka Skill khusus Pro.' : 'Upgrade to unlock Pro-only skills.')}</p></div></div>{currentPlan === 'free' && <button onClick={() => setIsProModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white"><TrendingUp className="size-4" />{lang === 'ID' ? 'Tingkatkan ke Pro' : 'Upgrade to Pro'}</button>}</section>
          </div>
        ) : activeTab === 'leaderboard' ? (
          <section className="animate-in fade-in duration-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500">{lang === 'ID' ? 'Peringkat pembelajar' : 'Learner rankings'}</p><h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">Leaderboard</h1><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{lang === 'ID' ? 'Peringkat ditentukan oleh total XP dari lesson dan Skill yang selesai.' : 'Rankings are based on XP earned from completed lessons and skills.'}</p></div></div>
            {currentLeaderboardEntry && <div className={`mt-6 flex items-center justify-between rounded-3xl border p-5 ${darkMode ? 'border-brand-500/20 bg-brand-500/10' : 'border-brand-100 bg-brand-50'}`}><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500">{lang === 'ID' ? 'Posisi Anda' : 'Your position'}</p><p className="mt-1 text-2xl font-black">#{currentLeaderboardEntry.rank}</p></div><p className="text-xl font-black text-brand-600">{currentLeaderboardEntry.xp.toLocaleString('id-ID')} XP</p></div>}
            <div className={`mt-6 overflow-hidden rounded-3xl border ${darkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white shadow-sm'}`}>
              {leaderboard.length > 0 ? leaderboard.map((entry) => <div key={entry.user.id} className={`flex items-center gap-4 border-b p-4 last:border-b-0 sm:p-5 ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}><span className="w-8 text-center text-lg font-black text-brand-500">#{entry.rank}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{entry.name}</p>{entry.plan === 'pro' && <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-extrabold text-brand-600">PRO</span>}</div><p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{entry.completedSkills} {lang === 'ID' ? 'skill selesai' : 'skills completed'}</p></div><strong className="shrink-0 text-sm text-brand-600">{entry.xp.toLocaleString('id-ID')} XP</strong></div>) : <p className="p-6 text-sm text-stone-500 dark:text-stone-400">{lang === 'ID' ? 'Belum ada XP pembelajaran.' : 'No learning XP yet.'}</p>}
            </div>
          </section>
        ) : activeTab === 'my-skills' ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500">{lang === 'ID' ? 'Ruang Pembelajar' : 'Learner Vault'}</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">{lang === 'ID' ? 'SkillPill Saya' : 'My SkillPills'}</h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {lang === 'ID' ? 'Pembelajar' : 'Learner'}: <span className="font-semibold text-stone-800 dark:text-stone-200">{profile?.name || (lang === 'ID' ? 'Pengguna Tamu' : 'Guest User')}</span> ({profile?.email || '-'})
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:gap-4">
                <div className={`px-3 sm:px-4 py-3 rounded-xl border shadow-sm flex items-center space-x-2 sm:space-x-3 ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
                  <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[9px] text-stone-400 uppercase tracking-wider font-semibold">{lang === 'ID' ? 'Jam Belajar' : 'Learning Hours'}</p>
                    <h4 className="text-sm font-extrabold">{(profile?.learningHours || 0).toFixed(1)} h</h4>
                  </div>
                </div>

                <div className={`px-3 sm:px-4 py-3 rounded-xl border shadow-sm flex items-center space-x-2 sm:space-x-3 ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[9px] text-stone-400 uppercase tracking-wider font-semibold">{lang === 'ID' ? 'Skill Selesai' : 'Completed Skills'}</p>
                    <h4 className="text-sm font-extrabold">{profile?.completedSkillCount || 0} {lang === 'ID' ? 'skill' : 'skills'}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid lists of purchased pills */}
            <div className="space-y-6">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold font-heading">{lang === 'ID' ? 'Skill Terdaftar & Aktif' : 'Purchased & Active Mastery'}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{lang === 'ID' ? 'Lanjutkan pembelajaran interaktif 30 menit Anda.' : 'Pick up exactly where you left off in under 30 minutes.'}</p>
                </div>
                <button
                  onClick={() => navigate('/catalog')}
                  className="text-xs font-bold text-brand-500 hover:underline flex items-center space-x-1"
                >
                  <span>{lang === 'ID' ? '+ Tambah Skill Baru' : '+ Explore Skill Catalog'}</span>
                </button>
              </div>

              {skills.filter(s => (profile?.purchasedSkillPills || []).includes(s.id)).length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center space-y-4 ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
                  <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                    <Compass className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold">{lang === 'ID' ? 'Belum Ada Skill Terdaftar' : 'No Purchased Skills Yet'}</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    {lang === 'ID' 
                      ? 'Anda belum memiliki modul SkillPill. Jelajahi katalog skill kami dan mulai belajar dalam 30 menit.' 
                      : 'You do not have any active SkillPill modules yet. Browse our catalog and start learning today.'}
                  </p>
                  <button
                    onClick={() => navigate('/catalog')}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    {lang === 'ID' ? 'Buka Katalog Skill' : 'Open Skill Catalog'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                  {skills
                    .filter(s => (profile?.purchasedSkillPills || []).includes(s.id))
                    .map((skill) => {
                      const prog = progressStore[skill.id] || { completedLessons: [] };
                      const completedLessonCount = (prog.completedLessons || []).filter((lessonId) =>
                        skill.lessons.some((lesson) => lesson.id === lessonId),
                      ).length;
                      const pct = skill.lessons.length
                        ? Math.round((completedLessonCount / skill.lessons.length) * 100)
                        : 0;

                      return (
                        <div 
                          key={skill.id}
                          onClick={() => navigate(`/skill/${skill.id}`)}
                          className={`group min-w-0 rounded-2xl border p-3 sm:p-5 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col h-full ${darkMode ? 'bg-stone-900 border-stone-800 hover:border-brand-500/50' : 'bg-white border-stone-200 hover:border-brand-500/50'}`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                              {localizeCategory(skill.category, lang)}
                            </span>
                            <span className="text-xs font-semibold text-stone-400">{localizeDuration(skill.estimatedTime, lang)}</span>
                          </div>

                          <h4 className="text-base font-bold group-hover:text-brand-500 transition-colors">{skill.title}</h4>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1.5 leading-relaxed">{skill.overview.headline}</p>

                          <div className="mt-auto pt-6 space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-stone-500 font-semibold">
                              <span>{lang === 'ID' ? 'Progres' : 'Progress'}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div className="bg-brand-500 h-full transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-brand-500 flex items-center space-x-1 justify-end pt-2">
                            <span>{lang === 'ID' ? 'Lihat Detail Skill' : 'View Skill Details'}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* TAB 2: DEDICATED MODERN KATALOG SKILL VIEW */
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Catalog Hero Banner */}
            <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden ${
              darkMode 
                ? 'bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border-stone-800' 
                : 'bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-brand-600/10 border-brand-500/20 shadow-sm'
            }`}>
              <div className="relative z-10 space-y-2 max-w-2xl">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-500 text-white">
                  <Sparkles className="h-3 w-3" />
                  <span>{lang === 'ID' ? 'Katalog Micro Skill' : 'Micro Skill Library'}</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
                  {lang === 'ID' ? 'Katalog SkillPill' : 'SkillPills Catalog'}
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {lang === 'ID' 
                    ? 'Jelajahi seluruh mikro skill interaktif 30 menit. Pilih skill baru untuk meningkatkan karir & kompetensi Anda secara praktis.' 
                    : 'Explore our full library of interactive 30-minute micro skills. Acquire new practical capabilities to accelerate your career.'}
                </p>
              </div>
            </div>

            {/* Search and Category Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              {/* Search Bar */}
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input 
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={lang === 'ID' ? 'Cari judul skill, topik, atau kata kunci...' : 'Search skill title, topic, or keyword...'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all ${
                    darkMode 
                      ? 'bg-stone-900 border-stone-800 text-white' 
                      : 'bg-white border-stone-200 text-stone-900 shadow-sm'
                  }`}
                />
              </div>

              {/* Category Filter Chips */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                {['ALL', ...Array.from(new Set<string>(skills.map((skill) => skill.category)))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`min-h-10 w-full rounded-xl px-2 py-1.5 text-[10px] font-bold leading-tight transition-all sm:min-h-0 sm:w-auto sm:px-3 sm:text-xs sm:whitespace-nowrap ${
                      catalogCategory === cat 
                        ? 'bg-brand-500 text-white shadow-sm' 
                        : darkMode
                          ? 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 shadow-sm'
                    }`}
                  >
                    {cat === 'ALL' ? (lang === 'ID' ? 'Semua Kategori' : 'All Categories') : localizeCategory(cat, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {skills
                .filter(skill => {
                  const matchesSearch = skill.title.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                                        skill.overview.headline.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                                        skill.category.toLowerCase().includes(catalogSearch.toLowerCase());
                  const matchesCategory = catalogCategory === 'ALL' || skill.category === catalogCategory;
                  return matchesSearch && matchesCategory;
                })
                .map((skill) => {
                  const isOwned = (profile?.purchasedSkillPills || []).includes(skill.id);
                  const isLockedInFree = !isOwned && currentPlan === 'free' && skill.accessLevel === 'pro';

                  return (
                    <div 
                      key={skill.id}
                      className={`min-w-0 rounded-2xl border p-3 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative ${
                        darkMode ? 'bg-stone-900 border-stone-800 hover:border-brand-500/50' : 'bg-white border-stone-200 hover:border-brand-500/50'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Bar inside card */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-lg">
                            {localizeCategory(skill.category, lang)}
                          </span>
                          
                          {isLockedInFree ? (
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-500 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Shield className="h-3 w-3 text-brand-500" />
                              <span>{lang === 'ID' ? 'PRO TERKUNCI' : 'PRO LOCKED'}</span>
                            </span>
                          ) : skill.accessLevel === 'all' && currentPlan === 'free' ? (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{lang === 'ID' ? 'GRATIS PRATINJAU' : 'FREE PREVIEW'}</span>
                            </span>
                          ) : (
                            <div className="flex items-center space-x-1 text-xs text-stone-400 font-semibold">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{localizeDuration(skill.estimatedTime, lang)}</span>
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <button
                            type="button"
                            onClick={() => navigate(`/skill/${skill.id}`)}
                            className="text-left text-base font-bold leading-snug hover:text-brand-600 transition-colors"
                          >
                            {skill.title}
                          </button>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 mt-1.5 leading-relaxed">
                            {skill.overview.headline}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-5 mt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                        {/* Rating & Price */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center space-x-1 text-xs font-bold text-brand-500">
                            <Star className="h-3.5 w-3.5 fill-brand-400 text-brand-400" />
                            <span>4.9</span>
                            <span className="hidden sm:inline text-[10px] text-stone-400 font-normal">(120+ {lang === 'ID' ? 'pembelajar' : 'learners'})</span>
                          </div>
                          <div className="text-xs font-extrabold text-stone-900 dark:text-white">
                            {formatRupiah(skill.price || 0)}
                          </div>
                        </div>

                        {/* Action Button */}
                        {isOwned ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-lg flex items-center space-x-1 flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{lang === 'ID' ? 'Terdaftar' : 'Owned'}</span>
                            </span>
                            <button
                              onClick={() => navigate(`/skill/${skill.id}`)}
                              className="flex-grow py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1 shadow-sm"
                            >
                              <span>{lang === 'ID' ? 'Lihat Detail Skill' : 'View Skill Details'}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/skill/${skill.id}`)}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                              darkMode 
                                ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700' 
                                : 'border-brand-500/30 bg-brand-50 hover:bg-brand-100 text-brand-800 shadow-sm'
                            }`}
                          >
                            <span>{lang === 'ID' ? 'Lihat Detail Skill' : 'View Skill Details'}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-200 ${darkMode && !location.pathname.startsWith('/learn/') ? 'dark bg-stone-950 text-stone-100' : 'bg-[#f8fbff] text-stone-800'}`}>
      
      {/* CORE ROUTING ENGINE */}
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicDirectory 
                skills={skills}
                ownedSkillIds={profile?.purchasedSkillPills || []}
                onSelectSkill={(skill) => navigate(`/skill/${skill.id}`)}
                profile={profile}
                onNavigateToDashboard={navigateToLearnerPortal}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                lang={lang}
                onChangeLang={setLang}
                onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')}
                onOpenProfile={() => setIsProfileOpen(true)}

                onOpenFeedback={openPlatformFeedback}
                onOpenTerms={(initialTab = 'disclaimer') => {
                  setTermsInitialTab(initialTab);
                  setIsTermsOpen(true);
                }}
                onLogout={() => { handleLogout(); navigate('/'); }}
                currentPlan={currentPlan}
                onTogglePlan={handleTogglePlan}
                plans={plans}
              />
            } 
          />

          <Route 
            path="/login" 
            element={
              <AuthPage 
                initialMode="login"
                lang={lang}
                onChangeLang={setLang}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onBack={() => navigate('/')}
                onOpenTerms={() => setIsTermsOpen(true)}
                onLoginSuccess={(user) => {
                  setProfile(user);
                  void Promise.all([refreshSkills(), refreshLeaderboard()]).finally(() => navigate(postLoginPath, { replace: true }));
                }}
              />
            } 
          />

          <Route 
            path="/register" 
            element={
              <AuthPage 
                initialMode="register"
                lang={lang}
                onChangeLang={setLang}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onBack={() => navigate('/')}
                onOpenTerms={() => setIsTermsOpen(true)}
                onLoginSuccess={(user) => {
                  setProfile(user);
                  void Promise.all([refreshSkills(), refreshLeaderboard()]).finally(() => navigate('/dashboard'));
                }}
              />
            } 
          />

          <Route path="/skill/:skillId" element={<SkillPageWrapper />} />

          <Route
            path="/dashboard"
            element={
              <RequireLearnerAuth isAuthenticated={learnerIsAuthenticated}>
                <LearnerPortalWrapper activeTab="home" />
              </RequireLearnerAuth>
            }
          />

          <Route
            path="/my-skills"
            element={
              <RequireLearnerAuth isAuthenticated={learnerIsAuthenticated}>
                <LearnerPortalWrapper activeTab="my-skills" />
              </RequireLearnerAuth>
            }
          />

          <Route
            path="/catalog"
            element={
              <RequireLearnerAuth isAuthenticated={learnerIsAuthenticated}>
                <LearnerPortalWrapper activeTab="catalog" />
              </RequireLearnerAuth>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <RequireLearnerAuth isAuthenticated={learnerIsAuthenticated}>
                <LearnerPortalWrapper activeTab="leaderboard" />
              </RequireLearnerAuth>
            }
          />

          <Route
            path="/learn/:skillId"
            element={
              <RequireLearnerAuth isAuthenticated={learnerIsAuthenticated}>
                <LearnPageWrapper
                  skills={skills}
                  ownedSkillIds={profile?.purchasedSkillPills || []}
                  progressStore={progressStore}
                  lang={lang}
                  onBack={() => {
                    apiFetch('/api/profile')
                      .then((response) => response.json())
                      .then((data) => {
                        setProfile(data.profile);
                        setProgressStore(data.progress);
                      });
                    navigate('/my-skills');
                  }}
                  onUpdateProgress={handleUpdateProgressForSkill}
                  onLanguageChange={setLang}
                  onOpenFeedback={openPlatformFeedback}
                  onGoToMySkills={() => navigate('/my-skills')}
                />
              </RequireLearnerAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* FLOATING FEEDBACK BUTTON */}
      <button
        onClick={openPlatformFeedback}
        className="fixed bottom-3 right-3 z-40 bg-brand-500 hover:bg-brand-600 text-white p-3 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-bold transition-all hover:scale-105 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6"
        title={lang === 'ID' ? 'Beri masukan' : 'Give feedback'}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden lg:inline">{lang === 'ID' ? 'Masukan' : 'Feedback'}</span>
      </button>

      {/* MODALS */}
      {profile && (
        <ProfileModal 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          lang={lang}
          profile={profile}
          onUpdateProfile={(updated) => {
            setProfile(prev => {
              if (!prev) return prev;
              const newProf = { ...prev, ...updated };
              setCurrentUser(newProf);
              return newProf;
            });
          }}
        />
      )}



      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        lang={lang}
        onUnauthorized={() => {
          setProfile(null);
          navigate('/login');
        }}
      />

      <TermsDisclaimerModal 
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        lang={lang}
        initialTab={termsInitialTab}
      />

      <ProPlanModal 
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        lang={lang}
        currentPlan={currentPlan}
        onTogglePlan={handleTogglePlan}
        plans={plans}
      />

    </div>
  );
}
