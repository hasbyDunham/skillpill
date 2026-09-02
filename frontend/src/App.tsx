/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { 
  Compass, BookOpen, Shield, User, Clock,
  ArrowRight, Star, AlertCircle, RefreshCw, MessageSquare,
  Sun, Moon, Globe, Search, CheckCircle2, Sparkles
} from 'lucide-react';
import { SkillPill, UserProfile, UserProgress, Order } from './types';
import PublicDirectory from './components/PublicDirectory';
import LandingPage from './components/LandingPage';
import LearningPlayer from './components/LearningPlayer';
import AuthPage from './components/AuthPage';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import FeedbackModal from './components/FeedbackModal';
import { convertDollarTextDeep, formatRupiah, localizeCategory, localizeDuration } from './lib/localization';
import TermsDisclaimerModal from './components/TermsDisclaimerModal';
import AccountDropdown from './components/AccountDropdown';
import PlanBadgeToggle from './components/PlanBadgeToggle';
import ProPlanModal from './components/ProPlanModal';
import { Language } from './lib/translations';
import { setCurrentUser, logoutUser } from './lib/userStore';
import { apiFetch, clearToken, getToken } from './lib/api';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [skills, setSkills] = useState<SkillPill[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressStore, setProgressStore] = useState<Record<string, UserProgress>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Deploy Standards State
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<Language>('ID');

  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackToolName, setFeedbackToolName] = useState('SkillPill Platform');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Active user plan ('free' or 'pro')
  const currentPlan = profile?.plan || 'pro';

  const handleTogglePlan = (newPlan: 'free' | 'pro') => {
    if (!profile) return;
    const updated = { ...profile, plan: newPlan };
    setProfile(updated);
    setCurrentUser(updated);
  };

  // Load all initial state on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        // Load skills
        const skillsRes = await apiFetch('/api/skills');
        const skillsData = await skillsRes.json();
        setSkills(convertDollarTextDeep(skillsData));

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
            setOrders(profileData.orders || []);
          } catch {
            logoutUser();
            setProfile(null);
            setProgressStore({});
            setOrders([]);
          }
        } else {
          logoutUser();
          setProfile(null);
          setProgressStore({});
          setOrders([]);
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

  const handlePurchase = async (skillId: string, paymentMethod: string, couponCode?: string) => {
    try {
      const res = await apiFetch('/api/profile/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, paymentMethod, couponCode })
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update local states
      setProfile(data.profile);
      setProgressStore(data.progress);
      setOrders(prev => [data.order, ...prev]);
      
      // Refetch skills to capture updated values
      const skillsRes = await apiFetch('/api/skills');
      const skillsData = await skillsRes.json();
      setSkills(convertDollarTextDeep(skillsData));
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
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
      setProgressStore(prev => ({ ...prev, [skillId]: data.progress }));
      setProfile(data.profile);
    } catch (err) {
      console.error('Failed to update progress on server:', err);
    }
  };

  // Reset, Backup, and Restore handlers
  const handleResetData = async () => {
    setSkills([]);
    setOrders([]);
    setProgressStore({});

    if (profile) {
      const resetProfile = {
        ...profile,
        purchasedSkillPills: [],
        wishlist: [],
        collections: [],
        learningHours: 0,
        completedSkillCount: 0,
        streakDays: 0
      };
      setProfile(resetProfile);
      setCurrentUser(resetProfile);
    }
  };

  const handleBackupData = () => {
    const backupObj = {
      profile,
      progressStore,
      orders,
      skills,
      exportedAt: new Date().toISOString()
    };
    const jsonString = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skillpill-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreData = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    logoutUser();
    clearToken();
    setProfile(null);
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
    let related = skills.filter(s => skill.relatedSkills?.includes(s.id) && s.id !== skill.id);
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
          if (profile) {
            navigate('/catalog');
          } else {
            navigate('/');
          }
        }}
        onPurchase={handlePurchase}
        ownedSkills={profile?.purchasedSkillPills || []}
        onStartLearning={(learnedSkill) => navigate(`/learn/${learnedSkill.id}`)}
        relatedSkills={getRelatedSkills(skill)}
        onSelectRelated={(relSkill) => navigate(`/skill/${relSkill.id}`)}
        darkMode={darkMode}
        profile={profile}
        lang={lang}
        onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')}
        onOpenFeedback={(tool) => { setFeedbackToolName(tool || skill.title || 'SkillPill'); setIsFeedbackOpen(true); }}
      />
    );
  }

  function LearnPageWrapper() {
    const { skillId } = useParams<{ skillId: string }>();
    const skill = skills.find(s => s.id === skillId);

    if (!skill) {
      return (
        <div className="min-h-screen bg-[#f8fbff] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-brand-500" />
          <h2 className="text-xl font-bold font-heading">{lang === 'ID' ? 'Materi Belajar Tidak Ditemukan' : 'Learning Content Not Found'}</h2>
          <p className="text-xs text-stone-500 max-w-xs">{lang === 'ID' ? 'Modul pembelajaran tidak ditemukan.' : 'The learning module could not be found.'}</p>
          <button 
            onClick={() => navigate('/my-skills')}
            className="px-4 py-2 bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Ke Skill Saya
          </button>
        </div>
      );
    }

    const prog = progressStore[skill.id] || {
      skillId: skill.id,
      completedLessons: [],
      isCompleted: false,
      practiceAnswers: {},
      reflectionAnswers: {},
      notes: {}
    };

    return (
      <LearningPlayer 
        skill={skill}
        progress={prog}
        onBack={() => {
          apiFetch('/api/profile')
            .then(r => r.json())
            .then(data => {
              setProfile(data.profile);
              setProgressStore(data.progress);
            });
          navigate('/my-skills');
        }}
        onUpdateProgress={(updatedData) => handleUpdateProgressForSkill(skill.id, updatedData)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        lang={lang}
        onLanguageChange={setLang}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />
    );
  }

  function LearnerPortalWrapper({ activeTab }: { activeTab: 'my-skills' | 'catalog' }) {
    return (
      <div className={`w-full max-w-7xl mx-auto px-3 py-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 ${darkMode ? 'text-white' : ''}`}>
        
        {/* LEARNER PORTAL TOP UTILITY BAR (Language, Dark Mode, Profile) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                darkMode 
                  ? 'border-stone-800 bg-stone-900 text-stone-300 hover:text-white' 
                  : 'border-stone-200 bg-white text-stone-700 hover:text-brand-600 shadow-sm'
              }`}
            >
              ← {lang === 'ID' ? 'Kembali Ke Home' : 'Back to Home'}
            </button>

            {/* LEARNER PORTAL MENU TABS */}
            <div className="flex min-w-0 flex-1 sm:flex-none bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800">
              <button
                onClick={() => navigate('/my-skills')}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'my-skills' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{lang === 'ID' ? 'Skill Saya' : 'My SkillPills'}</span>
              </button>
              <button
                onClick={() => navigate('/catalog')}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'catalog' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>{lang === 'ID' ? 'Katalog Skill' : 'Skill Catalog'}</span>
              </button>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center justify-end gap-2 overflow-x-auto no-scrollbar">
            {/* Free/Pro Badge & Toggle - ONLY VISIBLE WHEN LOGGED IN */}
            {profile && (
              <PlanBadgeToggle 
                currentPlan={currentPlan}
                onTogglePlan={handleTogglePlan}
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
                onOpenSettings={() => setIsSettingsOpen(true)}
                onLogout={() => { handleLogout(); navigate('/'); }}
              />
            )}
          </div>
        </div>

        {/* TAB 1: MY SKILLS */}
        {activeTab === 'my-skills' ? (
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
                      const pct = Math.round((prog.completedLessons.length / skill.lessons.length) * 100);

                      return (
                        <div 
                          key={skill.id}
                          onClick={() => navigate(`/learn/${skill.id}`)}
                          className={`group min-w-0 rounded-2xl border p-3 sm:p-5 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col h-full ${darkMode ? 'bg-stone-900 border-stone-800 hover:border-brand-500/50' : 'bg-white border-stone-200 hover:border-brand-500/50'}`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                              {localizeCategory(skill.category, lang)}
                            </span>
                            <span className="text-xs font-semibold text-stone-400">{localizeDuration(skill.estimatedTime, lang)}</span>
                          </div>

                          <h4 className="text-base font-bold group-hover:text-brand-500 transition-colors">{skill.title}</h4>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1.5 leading-relaxed">{skill.shortDescription}</p>

                          <div className="mt-auto pt-6 space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-stone-500 font-semibold">
                              <span>{lang === 'ID' ? 'Progres' : 'Progress'}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div className="bg-brand-500 h-full transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-brand-500 flex items-center space-x-1 justify-end pt-2">
                              <span>{lang === 'ID' ? 'Lanjutkan' : 'Resume'}</span>
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
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['ALL', ...Array.from(new Set(skills.map(s => s.category)))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
                                        skill.shortDescription.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                                        skill.category.toLowerCase().includes(catalogSearch.toLowerCase());
                  const matchesCategory = catalogCategory === 'ALL' || skill.category === catalogCategory;
                  return matchesSearch && matchesCategory;
                })
                .map((skill, index) => {
                  const isOwned = (profile?.purchasedSkillPills || []).includes(skill.id);
                  const isLockedInFree = currentPlan === 'free' && index > 0;

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
                          ) : index === 0 && currentPlan === 'free' ? (
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
                          <h3 className="text-base font-bold leading-snug">{skill.title}</h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 mt-1.5 leading-relaxed">
                            {skill.shortDescription}
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
                        {isLockedInFree ? (
                          <button
                            onClick={() => setIsProModalOpen(true)}
                            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                          >
                            <span>{lang === 'ID' ? 'Buka Akses Pro' : 'Unlock Pro Access'}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        ) : isOwned ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-lg flex items-center space-x-1 flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{lang === 'ID' ? 'Terdaftar' : 'Owned'}</span>
                            </span>
                            <button
                              onClick={() => navigate(`/learn/${skill.id}`)}
                              className="flex-grow py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1 shadow-sm"
                            >
                              <span>{lang === 'ID' ? 'Mulai Belajar' : 'Start Learning'}</span>
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

      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-200 ${darkMode ? 'dark bg-stone-950 text-stone-100' : 'bg-[#f8fbff] text-stone-800'}`}>
      
      {/* CORE ROUTING ENGINE */}
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicDirectory 
                skills={skills}
                onSelectSkill={(skill) => navigate(`/skill/${skill.id}`)}
                profile={profile}
                onNavigateToDashboard={() => navigate('/my-skills')}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                lang={lang}
                onChangeLang={setLang}
                onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenFeedback={(tool) => { setFeedbackToolName(tool || 'SkillPill'); setIsFeedbackOpen(true); }}
                onOpenTerms={() => setIsTermsOpen(true)}
                onLogout={() => { handleLogout(); navigate('/'); }}
                currentPlan={currentPlan}
                onTogglePlan={handleTogglePlan}
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
                  navigate('/my-skills');
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
                  navigate('/my-skills');
                }}
              />
            } 
          />

          <Route path="/skill/:skillId" element={<SkillPageWrapper />} />

          <Route path="/my-skills" element={<LearnerPortalWrapper activeTab="my-skills" />} />

          <Route path="/catalog" element={<LearnerPortalWrapper activeTab="catalog" />} />

          <Route path="/learn/:skillId" element={<LearnPageWrapper />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* FLOATING FEEDBACK BUTTON */}
      <button
        onClick={() => { setFeedbackToolName('SkillPill Applet'); setIsFeedbackOpen(true); }}
        className="fixed bottom-6 right-6 z-40 bg-brand-500 hover:bg-brand-600 text-white p-3 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-bold transition-all hover:scale-105"
        title={lang === 'ID' ? 'Beri masukan' : 'Give feedback'}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">{lang === 'ID' ? 'Masukan' : 'Feedback'}</span>
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

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onResetData={handleResetData}
        onBackupData={handleBackupData}
        onRestoreData={handleRestoreData}
      />

      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        lang={lang}
        toolName={feedbackToolName}
      />

      <TermsDisclaimerModal 
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        lang={lang}
      />

      <ProPlanModal 
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        lang={lang}
        currentPlan={currentPlan}
        onTogglePlan={handleTogglePlan}
      />

    </div>
  );
}
