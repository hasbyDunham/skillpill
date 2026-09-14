/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, BookOpen, Clock, Award, Star, Compass, Shield, ArrowRight, CheckCircle2, HelpCircle, 
  Mail, Phone, MapPin, Lock, Sun, Moon, Globe, Settings, User, LogOut, Play, AlertCircle, MessageSquare,
  ExternalLink, Monitor, Smartphone, Zap, Check, X, Sparkles, TrendingUp, ThumbsUp, Quote, Layers, Menu
} from 'lucide-react';
import { SkillPill, SkillPillPlan, UserProfile } from '../types';
import { Language, translations } from '../lib/translations';
import AccountDropdown from './AccountDropdown';
import PlanBadgeToggle from './PlanBadgeToggle';
import ProPlanModal from './ProPlanModal';
import { formatRupiah, localizeCategory, localizeDifficulty, localizeDuration } from '../lib/localization';
import { apiFetch } from '../lib/api';
import { getSkillCover } from '../lib/skillImage';

interface PublicDirectoryProps {
  skills: SkillPill[];
  onSelectSkill: (skill: SkillPill) => void;
  profile: UserProfile | null;
  onNavigateToDashboard: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenProfile: () => void;

  onOpenFeedback: (toolName?: string) => void;
  onOpenTerms: (initialTab?: 'privacy' | 'terms' | 'disclaimer') => void;
  onLogout: () => void;
  currentPlan?: 'free' | 'pro';
  onTogglePlan?: (newPlan: 'free' | 'pro') => void;
  plans?: SkillPillPlan[];
}

export default function PublicDirectory({ 
  skills, onSelectSkill, profile, onNavigateToDashboard,
  darkMode, onToggleDarkMode, lang, onChangeLang,
  onOpenAuth, onOpenProfile, onOpenFeedback, onOpenTerms, onLogout,
  currentPlan = 'free',
  onTogglePlan = () => {},
  plans = []
}: PublicDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  
  // Interactive Video Demo State: 'desktop' or 'mobile'
  const [demoMode, setDemoMode] = useState<'desktop' | 'mobile'>('desktop');

  // Mobile burger menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navbar hide on scroll down logic
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [contactSettings, setContactSettings] = useState({ email: '', phone: '', address: '' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    apiFetch('/api/contact-settings')
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted) {
          setContactSettings({
            email: typeof data?.email === 'string' ? data.email : '',
            phone: typeof data?.phone === 'string' ? data.phone : '',
            address: typeof data?.address === 'string' ? data.address : '',
          });
        }
      })
      .catch(() => undefined);

    return () => { isMounted = false; };
  }, []);

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactStatus(null);

    const recipient = contactSettings.email.trim();
    if (!recipient) {
      setContactStatus({
        type: 'error',
        message: lang === 'ID' ? 'Email tujuan belum tersedia.' : 'The recipient email is not available yet.',
      });
      return;
    }

    const body = [
      `Nama pengirim: ${contactForm.name}`,
      `Email pengirim: ${contactForm.email}`,
      '',
      'Pesan:',
      contactForm.message,
    ].join('\n');

    const composeUrl = new URL('https://mail.google.com/mail/');
    composeUrl.search = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: recipient,
      su: 'Pesan Baru dari SkillPill',
      body,
    }).toString();

    window.open(composeUrl.toString(), '_blank', 'noopener,noreferrer');
  };
  const staticTestimonials = [
    {
      id: 'static-sarah',
      name: 'Sarah Jenkins',
      role: lang === 'ID' ? 'Kepala Penjualan, TechCorp' : 'Head of Sales, TechCorp',
      quote: lang === 'ID' ? 'Teknik Three-Option Close mengubah cara tim kami menyampaikan penawaran hanya dalam 30 menit.' : 'The Three-Option Close completely transformed our team sales pitch in under 30 minutes.',
      skill: lang === 'ID' ? 'Penutupan Penjualan' : 'Closing Sales',
      rating: 5,
      date: '28 Agu 2026',
    },
    {
      id: 'static-budi',
      name: 'Budi Santoso',
      role: lang === 'ID' ? 'Arsitek Perangkat Lunak Senior' : 'Senior Software Architect',
      quote: lang === 'ID' ? 'Metode belajar visual SkillPill sangat ramah untuk profesional sibuk. Poin tindakannya langsung bisa dipakai.' : 'SkillPill’s visual learning method works perfectly for busy professionals. The action points are immediately useful.',
      skill: lang === 'ID' ? 'Arsitektur Sistem' : 'System Architecture',
      rating: 5,
      date: '25 Agu 2026',
    },
    {
      id: 'static-elena',
      name: 'Elena Rostova',
      role: lang === 'ID' ? 'Pemimpin Desainer UX' : 'Lead UX Designer',
      quote: lang === 'ID' ? 'AI Coach memberikan analogi secara instan dan membantu mengevaluasi refleksi desain saya.' : 'The AI Coach gave me instant analogies and evaluated my design reflection.',
      skill: lang === 'ID' ? 'Desain UI/UX' : 'UI/UX Design',
      rating: 5,
      date: '20 Agu 2026',
    },
    {
      id: 'static-rian',
      name: 'Rian Hidayat',
      role: lang === 'ID' ? 'Pengusaha & Kreator' : 'Entrepreneur & Creator',
      quote: lang === 'ID' ? 'Sangat hemat waktu. Saya mendapat solusi spesifik dalam 30 menit tanpa beban langganan.' : 'It saves so much time. I got a specific solution in 30 minutes without a subscription.',
      skill: lang === 'ID' ? 'Strategi Pertumbuhan' : 'Growth Hacking',
      rating: 5,
      date: '18 Agu 2026',
    },
  ];
  const testimonials = staticTestimonials;
  const testimonialCount = testimonials.length;
  const testimonialAverage = testimonialCount > 0
    ? testimonials.reduce((total, item) => total + item.rating, 0) / testimonialCount
    : 0;
  const freePlan = plans.find((plan) => plan.key === 'free');
  const proPlan = plans.find((plan) => plan.key === 'pro');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsNavVisible(false); // Hide navbar when scrolling down
      } else {
        setIsNavVisible(true);  // Show navbar when scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const t = translations[lang];
  const categories = ['All', ...Array.from(new Set(skills.map(s => s.category)))];

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          skill.overview.headline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-stone-950 text-stone-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Outer Wrapper */}
      <div className="w-full">
        
        {/* NAVBAR - Auto scroll & Auto Hide on Scroll Down - WIDENED FULL CONTAINER */}
        <header className={`sticky top-0 z-40 border-b transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : '-translate-y-full'} ${darkMode ? 'bg-stone-900 border-stone-800 text-stone-100 shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
          <div className="page-container h-16 flex items-center justify-between gap-2">
            
            {/* Brand Logo */}
            <div className="flex min-w-0 items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => scrollToSection('home')}>
              <img src="/logo.png" alt="SkillPill" className="h-9 w-9 sm:h-10 sm:w-10 object-contain flex-shrink-0" />
              <div>
                <span className={`text-xl font-bold font-heading tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Skill<span className="text-brand-500 font-serif">Pill</span>
                </span>
                <p className="hidden sm:block text-[10px] text-slate-500 dark:text-stone-400 uppercase tracking-widest leading-none">Micro Commerce</p>
              </div>
            </div>

            {/* Auto-Scroll Nav Links (Desktop) */}
            <nav className="hidden lg:flex space-x-6 text-xs font-semibold text-slate-700 dark:text-stone-300">
              <button 
                onClick={() => scrollToSection('home')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navHome}
              </button>
              <button 
                onClick={() => scrollToSection('problems-solutions')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navProblems}
              </button>
              <button 
                onClick={() => scrollToSection('demo')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navDemo}
              </button>
              <button 
                onClick={() => scrollToSection('directory')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navDirectory}
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navPricing}
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navTestimonials}
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navFaq}
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-2"
              >
                {t.navContact}
              </button>
            </nav>

            {/* Actions Right (Free/Pro Toggle, Language, Dark Mode, Auth, Mobile Burger) */}
            <div className="flex flex-shrink-0 items-center space-x-1.5 sm:space-x-2.5">
              
              {/* PLAN BADGE & TOGGLE (FREE / PRO) - ONLY VISIBLE WHEN LOGGED IN */}
              {profile && (
                <div className="hidden sm:block">
                  <PlanBadgeToggle 
                    currentPlan={currentPlan}
                    onTogglePlan={onTogglePlan}
                    plans={plans}
                    lang={lang}
                    darkMode={darkMode}
                  />
                </div>
              )}
              
              {/* Language Switcher */}
              <button
                onClick={() => onChangeLang(lang === 'EN' ? 'ID' : 'EN')}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors ${darkMode ? 'border-stone-800 bg-stone-900 text-stone-200 hover:bg-stone-800' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'}`}
                title={lang === 'ID' ? 'Ganti bahasa' : 'Switch language'}
              >
                <Globe className="h-3.5 w-3.5 text-brand-500" />
                <span>{lang}</span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-xl border text-xs flex items-center transition-colors ${darkMode ? 'border-stone-800 bg-stone-900 text-brand-400 hover:bg-stone-800' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'}`}
                title={lang === 'ID' ? 'Ganti mode warna' : 'Toggle color mode'}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* AUTH ACTIONS DESKTOP: CONDITIONAL ON PROFILE */}
              {profile ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onNavigateToDashboard}
                    className="hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 items-center space-x-1.5 cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>{lang === 'ID' ? 'Portal Pembelajar' : 'Learner Portal'}</span>
                  </button>

                  <AccountDropdown 
                    profile={profile}
                    lang={lang}
                    darkMode={darkMode}
                    onOpenProfile={onOpenProfile}

                    onLogout={onLogout}
                  />
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      darkMode ? 'border-stone-700 bg-stone-850 hover:bg-stone-800 text-stone-200' : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    {lang === 'ID' ? 'Masuk' : 'Sign In'}
                  </button>

                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20"
                  >
                    {lang === 'ID' ? 'Daftar' : 'Sign Up'}
                  </button>
                </div>
              )}

              {/* MOBILE BURGER MENU BUTTON */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  darkMode 
                    ? 'border-stone-800 bg-stone-900 text-stone-200 hover:bg-stone-800' 
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
                aria-label={lang === 'ID' ? 'Buka atau tutup menu navigasi' : 'Toggle navigation menu'}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5 text-brand-500" /> : <Menu className="h-5 w-5 text-stone-700 dark:text-stone-200" />}
              </button>
            </div>
          </div>

          {/* MOBILE BURGER NAVIGATION MENU DROPDOWN - NON-TRANSPARENT SOLID BACKGROUND */}
          {isMobileMenuOpen && (
            <div className={`lg:hidden border-t border-b transition-all duration-200 ${
              darkMode ? 'bg-stone-900 border-stone-800 text-stone-100 shadow-2xl' : 'bg-white border-stone-200 text-stone-900 shadow-2xl'
            }`}>
              <div className="page-container py-4 space-y-3">
                
                {/* Navigation Links */}
                <nav className="flex flex-col space-y-1">
                  <button 
                    onClick={() => scrollToSection('home')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navHome}</span>
                  </button>
                  <button 
                    onClick={() => scrollToSection('problems-solutions')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navProblems}</span>
                  </button>
                  <button 
                    onClick={() => scrollToSection('demo')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navDemo}</span>
                  </button>
                  <button 
                    onClick={() => scrollToSection('directory')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navDirectory}</span>
                  </button>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navPricing}</span>
                  </button>
                  <button 
                    onClick={() => scrollToSection('testimonials')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navTestimonials}</span>
                  </button>
                  <button 
                    onClick={() => scrollToSection('faq')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navFaq}</span>
                  </button>
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-left cursor-pointer"
                  >
                    <span>{t.navContact}</span>
                  </button>
                </nav>

                {/* Mobile Auth Actions */}
                <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
                  {!profile ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('login'); }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                          darkMode ? 'border-stone-700 bg-stone-800 text-stone-200' : 'border-stone-300 bg-white text-stone-800 shadow-sm'
                        }`}
                      >
                        {lang === 'ID' ? 'Masuk' : 'Sign In'}
                      </button>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('register'); }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-500 text-white shadow-sm text-center cursor-pointer"
                      >
                        {lang === 'ID' ? 'Daftar' : 'Sign Up'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onNavigateToDashboard(); }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-500 text-white shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>{lang === 'ID' ? 'Portal Pembelajar' : 'Learner Portal'}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </header>

        {/* =========================================================================
            1. HERO SECTION (`#home`) - WIDENED CONTAINER
           ========================================================================= */}
        <section id="home" className="relative overflow-hidden py-16 sm:py-24 border-b border-stone-200 dark:border-stone-800">
          <div className="page-container relative z-10 text-center">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-6">
              {t.heroBadge}
            </span>
            <h1 className="text-3xl sm:text-6xl font-extrabold font-heading tracking-tight leading-tight sm:leading-none max-w-5xl mx-auto text-stone-900 dark:text-white">
              {t.heroTitlePrefix}<br />
              {lang === 'ID' ? 'Kuasai ' : 'Master '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-600 font-serif italic">
                {t.heroTitleSpan}
              </span> {t.heroTitleSuffix}
            </h1>
            <p className="mt-6 text-base sm:text-xl text-stone-600 dark:text-stone-400 max-w-3xl mx-auto font-sans font-light leading-relaxed">
              {t.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => scrollToSection('directory')}
                className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 transition-all flex items-center justify-center space-x-2"
              >
                <span>{t.exploreSkills}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={onNavigateToDashboard}
                className={`px-8 py-4 font-semibold rounded-xl border transition-all ${darkMode ? 'bg-stone-900 border-stone-800 text-stone-200 hover:bg-stone-800' : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100 shadow-sm'}`}
              >
                {t.enterLearner}
              </button>
            </div>

            {/* Trust highlights */}
            <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 pt-6 sm:pt-10 border-t border-stone-200 dark:border-stone-800 max-w-6xl mx-auto text-left">
              <div>
                <h3 className="text-xl font-bold font-heading text-stone-900 dark:text-white">{t.trust1Title}</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{t.trust1Desc}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-stone-900 dark:text-white">{t.trust2Title}</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{t.trust2Desc}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-stone-900 dark:text-white">{t.trust3Title}</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{t.trust3Desc}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-stone-900 dark:text-white">{t.trust4Title}</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{t.trust4Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. SECTION PROBLEMS & SOLUTIONS (`#problems-solutions`) - WIDENED & LIGHT/DARK PERFECT
            STACKED VERTICALLY (PROBLEMS TOP, SOLUTIONS BOTTOM) - MODERN DESIGN
           ========================================================================= */}
        <section id="problems-solutions" className={`py-12 sm:py-20 border-b transition-colors ${darkMode ? 'bg-stone-900/40 border-stone-800' : 'bg-stone-100/70 border-stone-200'}`}>
          <div className="page-container">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                <Layers className="h-3.5 w-3.5" />
                <span>{lang === 'ID' ? 'PERBANDINGAN METODE BELAJAR' : 'LEARNING METHODOLOGY COMPARISON'}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading mt-3 tracking-tight text-stone-900 dark:text-white">
                {lang === 'ID' ? 'Dari Masalah Belajar Hingga Solusi Nyata' : 'From Learning Friction to Instant Mastery'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                {lang === 'ID' 
                  ? 'Lihat bagaimana SkillPill merevolusi cara profesional menguasai kemampuan tanpa membuang waktu puluhan jam.'
                  : 'See how SkillPill revolutionizes professional learning by replacing 20-hour courses with 30-minute masteries.'}
              </p>
            </div>

            {/* STACKED LAYOUT: PROBLEMS ON TOP, SOLUTIONS BELOW */}
            <div className="space-y-12">
              
              {/* TOP CONTAINER: THE PROBLEMS (RED ACCENT STYLE - LIGHT/DARK PERFECT) */}
              <div className={`relative rounded-3xl p-8 sm:p-10 border-2 shadow-xl overflow-hidden ${darkMode ? 'border-red-900/80 bg-gradient-to-b from-red-950/40 via-red-950/20 to-stone-900/60' : 'border-red-200 bg-gradient-to-b from-red-50 via-red-50/60 to-white'}`}>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                {/* Problem Header Badge & Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200/80 dark:border-red-900/50 pb-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-500 text-white rounded-2xl shadow-md flex-shrink-0">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                        {lang === 'ID' ? 'MASALAH METODE TRADISIONAL' : 'THE FRICTION IN TRADITIONAL COURSES'}
                      </span>
                      <h3 className="text-2xl font-bold font-heading text-red-950 dark:text-red-200">
                        {t.problemTitle}
                      </h3>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-full text-xs font-bold border border-red-300 dark:border-red-800 w-fit">
                    {lang === 'ID' ? 'Tingkat Kegagalan 82%' : '82% Drop-off Rate'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-red-900 dark:text-red-200 leading-relaxed font-medium mb-8">
                  {t.problemSubtitle}
                </p>

                {/* 3 Grid Problem Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
                  
                  {/* Problem 1 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                          01
                        </span>
                        <X className="h-5 w-5 text-red-500" />
                      </div>
                      <h4 className="text-base font-bold font-heading text-stone-900 dark:text-white mb-2">
                        {lang === 'ID' ? 'Video Berjam-Jam Tanpa Aksi' : '20+ Hour Theoretical Bloat'}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {lang === 'ID' 
                          ? 'Membeli kursus 20 jam yang penuh teori bertele-tele dan latar belakang akademik yang jarang dibutuhkan.'
                          : 'Buying long courses packed with theoretical fluff and academic context you rarely need in real life.'}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-red-100 dark:border-red-950/50 text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center space-x-1">
                      <span>✕ {lang === 'ID' ? 'Membuang waktu kerja produktif' : 'Wastes productive work hours'}</span>
                    </div>
                  </div>

                  {/* Problem 2 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                          02
                        </span>
                        <X className="h-5 w-5 text-red-500" />
                      </div>
                      <h4 className="text-base font-bold font-heading text-stone-900 dark:text-white mb-2">
                        {lang === 'ID' ? 'Lupa Cepat Dalam 48 Jam' : 'Rapid Concept Decay'}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {lang === 'ID' 
                          ? 'Tanpa diagram visual dan checklist langkah konkret, 90% materi dilupakan saat dihadapkan pada situasi nyata.'
                          : 'Without visual diagrams or concrete checklists, 90% of material is forgotten when facing real situations.'}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-red-100 dark:border-red-950/50 text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center space-x-1">
                      <span>✕ {lang === 'ID' ? 'Sulit dieksekusi saat dibutuhkan' : 'Hard to apply under pressure'}</span>
                    </div>
                  </div>

                  {/* Problem 3 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                          03
                        </span>
                        <X className="h-5 w-5 text-red-500" />
                      </div>
                      <h4 className="text-base font-bold font-heading text-stone-900 dark:text-white mb-2">
                        {lang === 'ID' ? 'Jebakan Langganan Mahal' : 'Subscription Lock Trap'}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {lang === 'ID' 
                          ? 'Dipaksa membayar langganan bulanan mahal secara terus-menerus padahal Anda hanya butuh 1 materi spesifik.'
                          : 'Forced into recurring monthly subscription traps when you only need a single specific solution.'}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-red-100 dark:border-red-950/50 text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center space-x-1">
                      <span>✕ {lang === 'ID' ? 'Menguras anggaran tanpa garansi' : 'Ongoing cost with zero guarantees'}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* CONNECTOR TRANSITION DIVIDER */}
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center space-x-3 px-6 py-2.5 rounded-full bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 uppercase tracking-wider">
                  <Zap className="h-4 w-4 fill-stone-950" />
                  <span>{lang === 'ID' ? 'TRANSFORMASI DENGAN SKILLPILL' : 'THE SKILLPILL TRANSFORMATION'}</span>
                </div>
              </div>

              {/* BOTTOM CONTAINER: THE SOLUTIONS (GREEN ACCENT STYLE - LIGHT/DARK PERFECT) */}
              <div className={`relative rounded-3xl p-8 sm:p-10 border-2 shadow-xl overflow-hidden ${darkMode ? 'border-emerald-800 bg-gradient-to-b from-emerald-950/40 via-emerald-950/20 to-stone-900/60' : 'border-emerald-200 bg-gradient-to-b from-emerald-50 via-emerald-50/60 to-white'}`}>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* Solution Header Badge & Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/80 dark:border-emerald-900/50 pb-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        {lang === 'ID' ? 'SOLUSI PERFORMA TINGGI' : 'THE HIGH-PERFORMANCE SOLUTION'}
                      </span>
                      <h3 className="text-2xl font-bold font-heading text-emerald-950 dark:text-emerald-200">
                        {t.solutionTitle}
                      </h3>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800 w-fit">
                    {lang === 'ID' ? '100% Selesai & Dikuasai' : '100% Completion Rate'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium mb-8">
                  {t.solutionSubtitle}
                </p>

                {/* 3 Grid Solution Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
                  
                  {/* Solution 1 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          01
                        </span>
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                      <h4 className="text-base font-bold font-heading text-stone-900 dark:text-white mb-2">
                        {lang === 'ID' ? '30 Menit Selesai & Paham' : '30-Minute Micro Mastery'}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {lang === 'ID' 
                          ? 'Setiap modul dirancang khusus untuk dituntaskan dalam 1 sesi 30 menit dengan pemahaman utuh.'
                          : 'Every module is precision-crafted to be completed and mastered in a single 30-minute session.'}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-emerald-100 dark:border-emerald-950/50 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <span>✓ {lang === 'ID' ? 'Langsung dipraktikkan hari ini' : 'Actionable in real time'}</span>
                    </div>
                  </div>

                  {/* Solution 2 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          02
                        </span>
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                      <h4 className="text-base font-bold font-heading text-stone-900 dark:text-white mb-2">
                        {lang === 'ID' ? 'Dual-Somatic Diagram & Checklist' : 'Dual-Somatic Visuals'}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {lang === 'ID' 
                          ? 'Infografis visual interaktif dan checklist eksekusi membuat konsep mudah diingat selamanya.'
                          : 'High-density visual diagrams paired with step-by-step action checklists ensure permanent retention.'}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-emerald-100 dark:border-emerald-950/50 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <span>✓ {lang === 'ID' ? 'Sistem retensi visual teruji' : 'Proven visual memory system'}</span>
                    </div>
                  </div>

                  {/* Solution 3 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          03
                        </span>
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                      <h4 className="text-base font-bold font-heading text-stone-900 dark:text-white mb-2">
                        {lang === 'ID' ? 'Hanya Rp15.000 per Skill — Miliki Seumur Hidup' : 'Rp15,000 per Pill — Lifetime Access'}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {lang === 'ID' 
                          ? 'Model Micro Commerce murni. Beli solusi spesifik seharga Rp15.000 dan miliki selamanya.'
                          : 'Pure micro commerce. Buy the exact solution you need for Rp15,000 with no recurring fees.'}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-emerald-100 dark:border-emerald-950/50 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <span>✓ {lang === 'ID' ? 'Tanpa biaya tersembunyi' : 'Zero hidden subscriptions'}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            3. VIDEO DEMO SECTION (`#demo`) - WIDENED & LIGHT/DARK PERFECT
            INCLUDES MODE SWITCH BUTTONS (DESKTOP MODE VS MOBILE MODE)
           ========================================================================= */}
        <section id="demo" className="py-12 sm:py-20 border-b border-stone-200 dark:border-stone-800">
          <div className="page-container">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">
                {lang === 'ID' ? 'DEMO INTERAKTIF' : 'INTERACTIVE DEMO'}
              </span>
              <h2 className="text-3xl font-extrabold font-heading mt-1 text-stone-900 dark:text-white">
                {t.demoTitle}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                {t.demoSubtitle}
              </p>

              {/* DEMO MODE SELECTOR TOGGLE BUTTONS (DESKTOP VS MOBILE) */}
              <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-inner">
                <button
                  onClick={() => setDemoMode('desktop')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    demoMode === 'desktop' 
                      ? 'bg-brand-500 text-white shadow-md' 
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>{lang === 'ID' ? 'Tampilan Komputer' : 'Desktop Mode'}</span>
                </button>
                <button
                  onClick={() => setDemoMode('mobile')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    demoMode === 'mobile' 
                      ? 'bg-brand-500 text-white shadow-md' 
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>{lang === 'ID' ? 'Tampilan Seluler' : 'Mobile Mode'}</span>
                </button>
              </div>
            </div>

            {/* CONDITIONAL DISPLAY BASED ON SELECTED DEMO MODE */}
            <div className="mt-6 flex justify-center">
              
              {demoMode === 'desktop' && (
                /* DESKTOP COMPONENT DEMO - ADAPTS ELEGANTLY TO LIGHT AND DARK MODE */
                <div className={`w-full max-w-6xl rounded-3xl p-4 sm:p-6 border shadow-2xl relative overflow-hidden group transition-colors ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-300'}`}>
                  <div className={`flex items-center justify-between mb-4 px-2 border-b pb-3 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono ml-2 hidden sm:inline">
                        https://app.skillpill.co/player/the-three-option-close
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                      {lang === 'ID' ? 'TAMPILAN DESKTOP' : 'DESKTOP CONSOLE VIEW'}
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-stone-800 bg-stone-950">
                    <img 
                      src={skills[0]?.coverUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200'}
                      alt="Desktop Tool Demo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                    />
                    
                    {/* Floating UI Badges on Desktop Screenshot */}
                    <div className="absolute top-4 left-4 hidden sm:flex space-x-2">
                      <span className="bg-stone-900/90 text-brand-400 text-[10px] font-bold px-3 py-1 rounded-lg border border-stone-700 backdrop-blur-md flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>{lang === 'ID' ? 'Gemini AI Coach Aktif' : 'Gemini AI Coach Active'}</span>
                      </span>
                      <span className="bg-stone-900/90 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-lg border border-stone-700 backdrop-blur-md flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{lang === 'ID' ? 'Diagram Dual-Somatik' : 'Dual-Somatic Diagram'}</span>
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent p-3 sm:p-10 flex flex-col justify-end">
                      <span className="bg-brand-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg w-fit uppercase tracking-wider shadow">
                        {lang === 'ID' ? 'PEMUTAR BELAJAR 30 MENIT' : '30-MINUTE LEARNING PLAYER'}
                      </span>
                      <h3 className="text-xl sm:text-3xl font-extrabold text-white mt-2 font-heading">
                        {skills[0]?.title || 'The Three-Option Close'}
                      </h3>
                      <p className="hidden sm:block text-xs sm:text-sm text-stone-300 max-w-2xl mt-2 leading-relaxed">
                        {skills[0]?.overview.headline || (lang === 'ID' ? 'Pemutar belajar interaktif dengan artikel, audio, slide, dan flashcard.' : 'Interactive lesson player with articles, audio, slides, and flashcards.')}
                      </p>
                      
                      <div className="mt-4 flex items-center space-x-4">
                        <button 
                          onClick={onNavigateToDashboard}
                          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{lang === 'ID' ? 'Uji Coba Pemutar' : 'Test Drive Player'}</span>
                        </button>
                        <span className="hidden sm:inline text-xs text-stone-300 font-mono">3 {lang === 'ID' ? 'Modul • 30 Menit' : 'Modules • 30 Mins'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {demoMode === 'mobile' && (
                /* MOBILE COMPONENT DEMO - ADAPTS ELEGANTLY TO LIGHT AND DARK MODE */
                <div className={`rounded-3xl p-5 border-4 shadow-2xl relative max-w-sm w-full mx-auto transition-colors ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-300'}`}>
                  
                  {/* Smartphone Frame Top Bar */}
                  <div className="flex items-center justify-between mb-3 px-2">
                    <div className="w-16 h-3.5 bg-stone-300 dark:bg-stone-800 rounded-full mx-auto"></div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {lang === 'ID' ? 'ANTARMUKA MOBILE' : 'MOBILE TOUCH UI'}
                    </span>
                  </div>

                  <div className="rounded-2xl overflow-hidden aspect-[9/16] bg-stone-950 relative border border-stone-800">
                    <img 
                      src={skills[1]?.coverUrl || 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800'}
                      alt="Mobile Tool Demo"
                      className="w-full h-full object-cover opacity-80"
                    />

                    {/* Floating Mobile Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-stone-900/90 text-brand-400 text-[9px] font-bold px-2.5 py-1 rounded-md border border-stone-800 backdrop-blur-md">
                        {lang === 'ID' ? 'Optimal untuk Sentuhan' : 'Touch Optimized'}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent p-5 flex flex-col justify-end">
                      <span className="bg-emerald-500 text-stone-950 text-[9px] font-extrabold px-2 py-0.5 rounded w-fit uppercase">
                        {lang === 'ID' ? 'BELAJAR DI MANA SAJA' : 'LEARN ON THE GO'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-2 font-heading">
                        {skills[1]?.title || '10-Sec Breathe Gap'}
                      </h4>
                      <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
                        {lang === 'ID' ? 'Materi ringkas untuk membaca, menggeser kartu, dan mendengarkan audio di mobile.' : 'Pocket-sized lessons designed for mobile reading, swipeable cards, and audio playback.'}
                      </p>

                      <button 
                        onClick={onNavigateToDashboard}
                        className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-extrabold text-xs rounded-xl transition-all shadow text-center"
                      >
                        {lang === 'ID' ? 'Buka Mode Seluler' : 'Launch Mobile Player'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* =========================================================================
            4. SKILL DIRECTORY SECTION (`#directory`) - 4 FEATURED DATA, NO SEARCH/FILTER
           ========================================================================= */}
        <section id="directory" className="py-12 sm:py-20 border-b border-stone-200 dark:border-stone-800">
          <div className="page-container">
            <div className="mb-10 text-center md:text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">
                {lang === 'ID' ? 'KATALOG UNGGULAN' : 'FEATURED CATALOG'}
              </span>
              <h2 className="text-3xl font-extrabold font-heading tracking-tight text-stone-900 dark:text-white">
                {lang === 'ID' ? '4 Skill Micro Commerce Unggulan' : '4 Featured SkillPills'}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                {lang === 'ID' ? 'Modul pembelajaran instan terpopuler siap pakai untuk mempercepat pertumbuhan bisnis Anda.' : 'Top rated instant learning modules ready for immediate deployment.'}
              </p>
            </div>

            {/* Skill Pill Grid - ONLY 4 FEATURED SKILLS (Index 0 is 1 Free Preview in Free Mode, Index 1+ locked in Free Mode) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
              {skills.slice(0, 4).map((skill) => {
                const isLockedInFree = currentPlan === 'free' && skill.accessLevel === 'pro';

                return (
                  <div 
                    key={skill.id} 
                    onClick={() => {
                      if (isLockedInFree) {
                        setIsProModalOpen(true);
                      } else {
                        onSelectSkill(skill);
                      }
                    }}
                    className={`group rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full relative ${
                      darkMode ? 'bg-stone-900 border-stone-800 text-white hover:border-brand-500/50' : 'bg-white border-stone-200 text-stone-900 hover:border-brand-500/50'
                    }`}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img 
                        src={getSkillCover(skill)} 
                        alt={skill.title} 
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isLockedInFree ? 'filter grayscale contrast-125 opacity-70' : ''}`}
                      />
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 max-w-[55%] truncate bg-stone-900/90 text-white text-[8px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2 py-1 rounded font-medium">
                            {localizeCategory(skill.category, lang)}
                      </span>
                      
                      {isLockedInFree ? (
                        <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-brand-500 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider p-1 sm:px-2.5 sm:py-1 rounded-md shadow flex items-center space-x-1">
                          <Lock className="h-3 w-3" />
                          <span className="hidden sm:inline">{lang === 'ID' ? 'Pro Terkunci' : 'Pro Locked'}</span>
                        </span>
                      ) : skill.accessLevel === 'all' && currentPlan === 'free' ? (
                        <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-emerald-500 text-white font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider p-1 sm:px-2 sm:py-1 rounded-md shadow flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="hidden sm:inline">{lang === 'ID' ? 'Gratis Pratinjau' : 'Free Preview'}</span>
                        </span>
                      ) : (
                        <span className="absolute bottom-3 right-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow">
                          {formatRupiah(skill.price)}
                        </span>
                      )}
                    </div>

                    <div className="p-4 sm:p-6 flex flex-col flex-grow">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mb-2">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-brand-500" />
                          <span>{localizeDuration(skill.estimatedTime, lang)}</span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center space-x-1">
                          <Award className="h-3.5 w-3.5 text-brand-500" />
                          <span>{localizeDifficulty(skill.difficulty, lang)}</span>
                        </span>
                      </div>
                      
                      <h3 className="text-sm sm:text-lg font-bold group-hover:text-brand-500 transition-colors text-stone-900 dark:text-white flex items-center justify-between">
                        <span>{skill.title}</span>
                        {isLockedInFree && <Lock className="h-4 w-4 text-brand-500 flex-shrink-0 ml-1" />}
                      </h3>
                      
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                        {skill.overview.headline}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-[9px] sm:text-[10px] font-semibold text-stone-500 dark:text-stone-400">{lang === 'ID' ? 'Oleh' : 'By'} {skill.overview.author.split(',')[0]}</span>
                        
                        {isLockedInFree ? (
                          <span className="text-xs font-extrabold text-brand-500 flex items-center space-x-1">
                            <span>{lang === 'ID' ? 'Upgrade Pro' : 'Upgrade to Pro'}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-brand-500 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                            <span>{lang === 'ID' ? 'Lihat Solusi' : 'Get Solution'}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Callout */}
            {!profile ? (
              <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border border-brand-500/20 text-center space-y-4 shadow-sm">
                <div className="inline-flex p-3 rounded-full bg-brand-500/20 text-brand-500 mb-1">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">
                  {lang === 'ID' ? 'Ingin Akses Seluruh Katalog Skill Lengkap?' : 'Want to Access Full Skill Catalog?'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
                  {lang === 'ID' 
                    ? 'Masuk atau Daftar gratis untuk menjelajahi seluruh katalog skill interaktif, pencarian lengkap, serta akses pembelajaran instan.' 
                    : 'Sign Up or Log In to explore our complete interactive catalog, full search filter, and instant learning modules.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {lang === 'ID' ? 'Masuk (Sign In)' : 'Sign In'}
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className={`px-6 py-2.5 text-xs font-bold rounded-xl border transition-all active:scale-95 cursor-pointer ${
                      darkMode 
                        ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700' 
                        : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 shadow-sm'
                    }`}
                  >
                    {lang === 'ID' ? 'Daftar Gratis' : 'Sign Up Free'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-12 text-center">
                <button
                  onClick={onNavigateToDashboard}
                  className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <span>{lang === 'ID' ? 'Buka Seluruh Katalog di Portal Pembelajar' : 'Explore All Skills in Learner Portal'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            5. PRICING SECTION (`#pricing`) - WIDENED & LIGHT/DARK PERFECT
            MONTHLY ONLY (YEARLY REMOVED) + STRICTLY HORIZONTALLY ALIGNED BUTTONS
           ========================================================================= */}
        <section id="pricing" className={`py-12 sm:py-20 border-b transition-colors ${darkMode ? 'bg-stone-900/30 border-stone-800' : 'bg-stone-100/40 border-stone-200'}`}>
          <div className="page-container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{t.navPricing}</span>
              <h2 className="text-3xl font-extrabold font-heading mt-1 text-stone-900 dark:text-white">{t.pricingTitle}</h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">{t.pricingSubtitle}</p>
            </div>

            {/* Free and Pro Pricing Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8 items-stretch max-w-4xl mx-auto">
              
              {/* Card 1: Free Tier */}
              <div className={`p-4 sm:p-8 rounded-3xl border shadow-sm flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md ${darkMode ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold font-heading text-stone-900 dark:text-white">{freePlan?.name ?? t.freePlan}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      EXPLORER
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{lang === 'ID' ? 'Akses katalog & pratinjau materi.' : 'Access the catalog and preview learning materials.'}</p>
                  
                  <div className="my-6">
                    <span className="text-2xl sm:text-4xl font-extrabold font-heading text-stone-900 dark:text-white">{freePlan ? formatRupiah(freePlan.price) : '—'}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 ml-1">/ {lang === 'ID' ? 'selamanya' : 'forever'}</span>
                  </div>

                  <ul className="space-y-3 text-xs text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800 pt-6 mb-6">
                    {(freePlan?.benefits ?? []).map((benefit) => (
                      <li key={benefit} className="flex items-center space-x-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Aligned Button */}
                <div className="mt-auto pt-4 w-full">
                  <button 
                    onClick={() => scrollToSection('directory')}
                    className="w-full py-3.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold rounded-2xl text-xs transition-all text-center"
                  >
                    {t.getStarted}
                  </button>
                </div>
              </div>

              {/* Card 2: Pro Member (Most Popular) */}
              <div className={`p-4 sm:p-8 rounded-3xl border-2 border-brand-500 shadow-xl relative flex flex-col justify-between h-full transition-all duration-300 ${darkMode ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}`}>
                <div className="absolute -top-3.5 right-6 bg-brand-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md">
                  {t.popular}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold font-heading text-stone-900 dark:text-white">{proPlan?.name ?? t.proPlan}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                      {lang === 'ID' ? 'TAK TERBATAS' : 'UNLIMITED'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{lang === 'ID' ? 'Akses tak terbatas seluruh pustaka.' : 'Unlimited access to the entire library.'}</p>
                  
                  <div className="my-6">
                    <span className="text-2xl sm:text-4xl font-extrabold font-heading text-stone-900 dark:text-white">{proPlan ? formatRupiah(proPlan.price) : '—'}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 ml-1">/ {lang === 'ID' ? 'bulan' : 'month'}</span>
                  </div>

                  <ul className="space-y-3 text-xs text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800 pt-6 mb-6">
                    {(proPlan?.benefits ?? []).map((benefit) => (
                      <li key={benefit} className="flex items-center space-x-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Aligned Button */}
                <div className="mt-auto pt-4 w-full">
                  <button 
                    onClick={() => setIsProModalOpen(true)}
                    className="w-full py-3.5 bg-stone-900 dark:bg-stone-100 hover:opacity-90 text-white dark:text-stone-900 font-bold rounded-2xl text-xs transition-all text-center"
                  >
                    {currentPlan === 'pro'
                      ? (lang === 'ID' ? 'Plan Pro Aktif' : 'Pro Plan Active')
                      : (lang === 'ID' ? 'Upgrade ke Pro' : 'Upgrade to Pro')}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            6. TESTIMONIALS SECTION (`#testimonials`) - WIDENED & LIGHT/DARK PERFECT
            MODERN & ELEGANT LAYOUT WITH VERIFIED BADGES & AVATARS
           ========================================================================= */}
        <section id="testimonials" className={`py-12 sm:py-20 border-b transition-colors ${darkMode ? 'bg-stone-900/40 border-stone-800' : 'bg-stone-100/50 border-stone-200'}`}>
          <div className="page-container">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                <Star className="h-3.5 w-3.5 fill-brand-500" />
                <span>{lang === 'ID' ? 'TESTIMONI PEMBELAJAR' : 'LEARNER TESTIMONIALS'}</span>
              </span>
              <h2 className="text-3xl font-extrabold font-heading mt-3 text-stone-900 dark:text-white">{t.testimonialsTitle}</h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">{t.testimonialsSubtitle}</p>
              
              {/* Rating Summary Pill */}
              <div className="mt-4 inline-flex items-center space-x-2 bg-white dark:bg-stone-850 px-4 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 shadow-sm">
                <div className="flex text-brand-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        testimonialAverage >= star
                          ? 'fill-brand-400'
                          : 'text-stone-300 dark:text-stone-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold font-mono text-stone-900 dark:text-white">
                  {testimonialCount > 0 ? testimonialAverage.toFixed(1) : '—'} / 5.0
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  • {testimonialCount} {lang === 'ID' ? 'Pembelajar Terverifikasi' : 'Verified Learners'}
                </span>
              </div>
            </div>

            {/* Modern Testimonial Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((test, idx) => (
                <div 
                  key={test.id || idx} 
                  className={`relative p-4 sm:p-6 rounded-3xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    darkMode ? 'bg-stone-900 border-stone-800 text-white hover:border-brand-500/40' : 'bg-white border-stone-200 text-stone-900 hover:border-brand-500/40'
                  }`}
                >
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-brand-500/10 pointer-events-none" />

                  <div>
                    {/* Top Row: Stars & Skill Pill Tag */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex text-amber-400">
                        {Array.from({ length: test.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 max-w-[120px] truncate" title={test.skill}>
                        #{test.skill}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-xs leading-relaxed text-stone-700 dark:text-stone-300 italic">
                      "{test.quote}"
                    </p>
                  </div>

                  {/* Bottom User Bar */}
                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0 border border-brand-500/30">
                        {test.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold font-heading truncate text-stone-900 dark:text-white">{test.name}</h4>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{test.role}</p>
                      </div>
                    </div>
                    {test.date && (
                      <span className="text-[9px] text-stone-400 flex-shrink-0 ml-1 font-mono">{test.date}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. FAQS SECTION (`#faq`) - WIDENED & LIGHT/DARK PERFECT
           ========================================================================= */}
        <section id="faq" className="py-12 sm:py-20 border-b border-stone-200 dark:border-stone-800">
          <div className="page-container">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{t.navFaq}</span>
              <h2 className="text-3xl font-extrabold font-heading mt-1 text-stone-900 dark:text-white">{t.faqTitle}</h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">{t.faqSubtitle}</p>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900 shadow-sm'}`}>
                <h3 className="font-bold text-sm flex items-center space-x-2.5 text-stone-900 dark:text-white">
                  <HelpCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                  <span>{lang === 'ID' ? 'Apakah ini sistem langganan bulanan?' : 'Is this a monthly subscription?'}</span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 pl-6 leading-relaxed">
                  {lang === 'ID' ? 'Tidak. Sistem utama SkillPill adalah Micro Commerce. Anda dapat membeli satu modul SkillPill seharga Rp15.000 tanpa langganan bulanan.' : 'No. SkillPill uses a micro-commerce model. You can buy one SkillPill module for Rp15,000 without a recurring subscription.'}
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900 shadow-sm'}`}>
                <h3 className="font-bold text-sm flex items-center space-x-2.5 text-stone-900 dark:text-white">
                  <HelpCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                  <span>{lang === 'ID' ? 'Apa saja yang didapatkan dalam satu SkillPill?' : 'What is included in one SkillPill?'}</span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 pl-6 leading-relaxed">
                  {lang === 'ID' ? 'Setiap SkillPill berisi materi terstruktur 30 menit: modul interaktif, diagram visual, latihan, refleksi, daftar tindakan, dan bantuan AI Coach.' : 'Each SkillPill contains a structured 30-minute experience with interactive lessons, visual diagrams, practice challenges, reflection prompts, action checklists, and AI Coach assistance.'}
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900 shadow-sm'}`}>
                <h3 className="font-bold text-sm flex items-center space-x-2.5 text-stone-900 dark:text-white">
                  <HelpCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                  <span>{lang === 'ID' ? 'Bagaimana cara kerja AI Coach?' : 'How does the AI Coach work?'}</span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 pl-6 leading-relaxed">
                  {lang === 'ID' ? 'AI Coach terhubung dengan Google Gemini. Saat belajar, Anda dapat meminta penjelasan yang lebih sederhana, analogi, atau evaluasi latihan.' : 'The AI Coach is connected to Google Gemini. While learning, you can request simpler explanations, analogies, or feedback on your practice.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            8. CONTACT SECTION (`#contact`) - WIDENED & LIGHT/DARK PERFECT
           ========================================================================= */}
        <section id="contact" className="py-12 sm:py-20 border-b border-stone-200 dark:border-stone-800">
          <div className="page-container">
            <div className={`p-5 sm:p-12 rounded-3xl border shadow-lg max-w-5xl mx-auto ${darkMode ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{t.navContact}</span>
                  <h2 className="text-2xl font-bold font-heading mt-1 text-stone-900 dark:text-white">{t.contactTitle}</h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                    {t.contactSubtitle}
                  </p>

                  <div className="mt-8 space-y-4 text-xs text-stone-600 dark:text-stone-300">
                    {contactSettings.email && <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-brand-500" />
                      <span>{contactSettings.email}</span>
                    </div>}
                    {contactSettings.phone && <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-brand-500" />
                      <span>{contactSettings.phone}</span>
                    </div>}
                    {contactSettings.address && <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-brand-500" />
                      <span>{contactSettings.address}</span>
                    </div>}
                  </div>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">{t.nameLabel}</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.name}
                      onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder={lang === 'ID' ? 'Budi Santoso' : 'John Doe'}
                      className={`w-full px-4 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${darkMode ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">{t.emailLabel}</label>
                    <input 
                      type="email" 
                      required
                      value={contactForm.email}
                      onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="alex@gmail.com"
                      className={`w-full px-4 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${darkMode ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">{t.messageLabel}</label>
                    <textarea 
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                      placeholder={lang === 'ID' ? 'Tuliskan pertanyaan atau kebutuhan tim Anda...' : 'Write your inquiry or team needs...'}
                      className={`w-full px-4 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${darkMode ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'}`}
                    />
                  </div>
                  {contactStatus && (
                    <p className={`rounded-xl border px-3 py-2 text-xs ${contactStatus.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'}`}>
                      {contactStatus.message}
                    </p>
                  )}
                  <button 
                    type="submit"
                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-brand-500/10"
                  >
                    {t.sendMessage}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            9. CALL TO ACTION (CTA) SECTION - WIDENED & STUNNING IN LIGHT/DARK
           ========================================================================= */}
        <section className="py-12 sm:py-20 page-container">
          <div className="relative bg-gradient-to-br from-stone-900 via-stone-900 to-brand-950/90 text-white rounded-3xl p-6 sm:p-16 text-center overflow-hidden shadow-2xl border border-stone-800">
            {/* Ambient Background Glow Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-6">
              
              <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{lang === 'ID' ? 'MULAI BELAJAR HARI INI' : 'START LEARNING TODAY'}</span>
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight leading-tight text-white">
                {t.ctaTitle}
              </h2>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl mx-auto">
                {t.ctaSubtitle}
              </p>

              {/* Guarantees Bar */}
              <div className="flex flex-wrap justify-center gap-6 text-[11px] text-stone-300 pt-2 font-medium">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{lang === 'ID' ? 'Akses Seketika' : 'Instant Access'}</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{lang === 'ID' ? 'Garansi 30 Menit' : '30-Min Guarantee'}</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{lang === 'ID' ? 'Tanpa Biaya Tersembunyi' : 'Zero Hidden Fees'}</span>
                </span>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                  onClick={() => scrollToSection('directory')}
                  className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-brand-500/20 flex items-center space-x-2"
                >
                  <span>{t.exploreSkills}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button 
                  onClick={onNavigateToDashboard}
                  className="px-8 py-4 bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-bold rounded-2xl text-xs transition-all border border-stone-700"
                >
                  {t.enterLearner}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            10. FOOTER WITH NAVIGATION LINKS, COPYRIGHT & SOCIAL MEDIA - WIDENED
           ========================================================================= */}
        <footer className={`pt-16 pb-12 border-t transition-colors ${darkMode ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-stone-900 text-stone-300 border-stone-800'}`}>
          <div className="page-container">
            
            {/* Top Footer Navigation Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800 text-xs">
              
              {/* Col 1: Brand Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('home')}>
                  <img src="/logo.png" alt="SkillPill" className="h-9 w-9 object-contain" />
                  <span className="text-xl font-bold font-heading text-white tracking-tight">
                    Skill<span className="text-brand-500 font-serif">Pill</span>
                  </span>
                </div>
                <p className="text-stone-400 leading-relaxed">
                  {lang === 'ID' 
                    ? 'Platform Micro Commerce global untuk menguasai skill mikro terarah dalam 30 menit seharga Rp15.000.'
                    : 'A global micro-commerce platform for mastering focused skills in 30 minutes for Rp15,000.'}
                </p>
              </div>

              {/* Col 2: Landing Page Section Navigation */}
              <div>
                <h4 className="text-white font-bold font-heading uppercase text-[11px] tracking-wider mb-4">
                  {lang === 'ID' ? 'Navigasi Halaman' : 'Page Navigation'}
                </h4>
                <ul className="space-y-2.5">
                  <li>
                    <button onClick={() => scrollToSection('home')} className="hover:text-brand-400 transition-colors">
                      {t.navHome}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('problems-solutions')} className="hover:text-brand-400 transition-colors">
                      {t.navProblems}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('demo')} className="hover:text-brand-400 transition-colors">
                      {t.navDemo}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('directory')} className="hover:text-brand-400 transition-colors">
                      {t.navDirectory}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('pricing')} className="hover:text-brand-400 transition-colors">
                      {t.navPricing}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('testimonials')} className="hover:text-brand-400 transition-colors">
                      {t.navTestimonials}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('faq')} className="hover:text-brand-400 transition-colors">
                      {t.navFaq}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('contact')} className="hover:text-brand-400 transition-colors">
                      {t.navContact}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Policy & Support */}
              <div>
                <h4 className="text-white font-bold font-heading uppercase text-[11px] tracking-wider mb-4">
                  {lang === 'ID' ? 'Kebijakan & Bantuan' : 'Policies & Support'}
                </h4>
                <ul className="space-y-2.5">
                  <li>
                    <button onClick={() => onOpenTerms('terms')} className="hover:text-brand-400 transition-colors">
                      {t.terms}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => onOpenTerms('privacy')} className="hover:text-brand-400 transition-colors">
                      {t.privacy}
                    </button>
                  </li>
                  <li>
                    <button onClick={onOpenFeedback} className="hover:text-brand-400 transition-colors flex items-center space-x-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                      <span>{t.giveFeedback}</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={onNavigateToDashboard} className="hover:text-brand-400 transition-colors">
                      {lang === 'ID' ? 'Portal Pembelajar' : 'Learner Portal'}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 4: Contact & Hub */}
              <div>
                <h4 className="text-white font-bold font-heading uppercase text-[11px] tracking-wider mb-4">
                  {lang === 'ID' ? 'Hubungi Kami' : 'Contact Us'}
                </h4>
                <div className="space-y-2.5 text-stone-400">
                  {contactSettings.email && <p className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-brand-500" />
                    <span>{contactSettings.email}</span>
                  </p>}
                  {contactSettings.phone && <p className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-brand-500" />
                    <span>{contactSettings.phone}</span>
                  </p>}
                  {contactSettings.address && <p className="flex items-center space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" />
                    <span>{contactSettings.address}</span>
                  </p>}
                </div>
              </div>

            </div>

            {/* Bottom Footer Bar */}
            <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs space-y-4 md:space-y-0">
              
              {/* Copyright & Optibis Attribution */}
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
                <span>© 2026 SkillPill Co. All rights reserved.</span>
                <span className="text-stone-700 hidden sm:inline">•</span>
                <a 
                  href="https://optibis.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-400 font-bold hover:underline flex items-center space-x-1"
                >
                  <span>{lang === 'ID' ? 'Dibuat oleh Optibis' : 'Built by Optibis'}</span>
                  <ExternalLink className="h-3 w-3 inline-block" />
                </a>
              </div>

              {/* Social Media Links */}
              <div className="flex items-center space-x-4">
                <a href="https://optibis.id" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-brand-400 transition-colors p-1" title="Optibis">
                  <Globe className="h-4 w-4" />
                </a>
              </div>

            </div>

          </div>
        </footer>

      </div>

      {/* PRO PLAN MODAL FOR FREE PLAN UPGRADES */}
      <ProPlanModal 
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        lang={lang}
        currentPlan={currentPlan}
        onTogglePlan={onTogglePlan}
        plans={plans}
      />
    </div>
  );
}
