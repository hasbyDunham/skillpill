/**
 * LandingPage Component (Detail Skill Page)
 * High-converting, rich, vibrant, and comprehensive detail view for SkillPill modules.
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, Clock, Award, Star, BookOpen, Quote, Shield, HelpCircle, 
  Check, Play, ArrowRight, Gift, BadgePercent, Lock, RefreshCw,
  Sparkles, CheckCircle2, MessageSquare, ShieldCheck, Zap, Laptop, FileText,
  Bot, Layers, FileSpreadsheet, UserCheck, HeartHandshake, AlertCircle
} from 'lucide-react';
import { SkillPill, UserProfile } from '../types';
import { Language } from '../lib/translations';
import { getSkillCover } from '../lib/skillImage';
import { formatRupiah, localizeCategory, localizeDifficulty, localizeDuration } from '../lib/localization';

interface LandingPageProps {
  skill: SkillPill;
  onBack: () => void;
  onPurchase: (skillId: string, paymentMethod: string, couponCode?: string) => Promise<void>;
  ownedSkills: string[];
  onStartLearning: (skill: SkillPill) => void;
  relatedSkills: SkillPill[];
  onSelectRelated: (skill: SkillPill) => void;
  darkMode?: boolean;
  profile?: UserProfile | null;
  lang?: Language;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenFeedback?: (toolName?: string) => void;
}

export default function LandingPage({ 
  skill, 
  onBack, 
  onPurchase, 
  ownedSkills, 
  onStartLearning, 
  relatedSkills, 
  onSelectRelated, 
  darkMode = false,
  profile, 
  lang = 'ID',
  onOpenAuth,
  onOpenFeedback
}: LandingPageProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('QRIS / E-Wallet');
  const [couponCode, setCouponCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOwned = ownedSkills.includes(skill.id);
  const finalPrice = isCouponApplied ? 0.00 : skill.price;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'PILLFREE') {
      setIsCouponApplied(true);
      setErrorMsg('');
    } else {
      setErrorMsg(lang === 'ID' ? 'Kupon tidak valid. Gunakan "PILLFREE" untuk gratis.' : 'Invalid coupon. Try "PILLFREE" for free checkout.');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await onPurchase(skill.id, `${paymentMethod} (Simulated)`, isCouponApplied ? 'PILLFREE' : undefined);
      setShowCheckout(false);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'ID' ? 'Gagal memproses transaksi.' : 'Failed to process purchase'));
    } finally {
      setIsProcessing(false);
    }
  };

  const isID = lang === 'ID';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-stone-950 text-stone-100' : 'bg-[#fcfbf9] text-stone-900'} pb-24`}>
      
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${darkMode ? 'bg-stone-900/90 border-stone-800 text-stone-100' : 'bg-white/90 border-stone-200 text-stone-900 shadow-sm'}`}>
        <div className="page-container min-h-16 py-2 flex items-center justify-between gap-2">
          <button 
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-stone-600 dark:text-stone-300 hover:text-brand-500 font-bold text-xs py-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{isID ? 'Kembali ke Katalog' : 'Back to Directory'}</span>
          </button>
          
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-[10px] font-extrabold uppercase tracking-wider">
              {localizeCategory(skill.category, lang)}
            </span>
            
            {/* Feedback Button in Header */}
            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => onOpenFeedback(skill.title)}
                className="inline-flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-brand-500 hover:border-brand-500/40 transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                <span className="hidden md:inline">{isID ? 'Beri Feedback' : 'Feedback'}</span>
              </button>
            )}

            {/* Quick Action Button Header */}
            {isOwned ? (
              <button
                onClick={() => onStartLearning(skill)}
                className="px-2.5 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isID ? 'Mulai Belajar' : 'Start Learning'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!profile) {
                    if (onOpenAuth) onOpenAuth('login');
                  } else {
                    setShowCheckout(true);
                  }
                }}
                className="px-2.5 sm:px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] sm:text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <span className="sm:hidden">{isID ? 'Beli' : 'Buy'}</span>
                <span className="hidden sm:inline">{isID ? 'Beli Solusi' : 'Get Solution'} ({formatRupiah(skill.price)})</span>
                <ArrowRight className="hidden sm:block h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="page-container py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Skill Information */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-brand-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                <Sparkles className="h-3 w-3" />
                <span>Micro Commerce SkillPill</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[10px] uppercase tracking-wider border border-stone-300 dark:border-stone-700">
                {localizeCategory(skill.category, lang)}
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                <span>{isID ? '100% Modul Terverifikasi' : '100% Verified Skill'}</span>
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-stone-900 dark:text-white tracking-tight leading-tight">
              {skill.title}
            </h1>

            {/* Subtitle / Short Description */}
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-sans font-light">
              {skill.shortDescription}
            </p>

            {/* Author Credit & Ratings */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-b border-stone-200 dark:border-stone-800/80 py-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-xs">
                  {skill.author.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">{isID ? 'Disusun Oleh' : 'Authored By'}</p>
                  <p className="font-bold text-stone-900 dark:text-white">{skill.author}</p>
                </div>
              </div>

              <div className="h-8 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block"></div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-0.5 text-brand-500">
                  <Star className="h-4 w-4 fill-brand-400" />
                  <Star className="h-4 w-4 fill-brand-400" />
                  <Star className="h-4 w-4 fill-brand-400" />
                  <Star className="h-4 w-4 fill-brand-400" />
                  <Star className="h-4 w-4 fill-brand-400" />
                </div>
                <div>
                  <span className="font-extrabold text-stone-900 dark:text-white">5.0 / 5.0</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 ml-1">(120+ {isID ? 'ulasan' : 'reviews'})</span>
                </div>
              </div>
            </div>

            {/* SPECS GRID (6 RICH METRIC CARDS) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} flex items-center space-x-3`}>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isID ? 'Durasi' : 'Duration'}</p>
                  <p className="text-xs font-bold text-stone-900 dark:text-white">{localizeDuration(skill.estimatedTime, lang)}</p>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} flex items-center space-x-3`}>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isID ? 'Level' : 'Difficulty'}</p>
                  <p className="text-xs font-bold text-stone-900 dark:text-white">{localizeDifficulty(skill.difficulty, lang)}</p>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} flex items-center space-x-3`}>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isID ? 'Fitur AI' : 'AI Feature'}</p>
                  <p className="text-xs font-bold text-stone-900 dark:text-white">AI Coach 24/7</p>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} flex items-center space-x-3`}>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isID ? 'Perangkat' : 'Devices'}</p>
                  <p className="text-xs font-bold text-stone-900 dark:text-white">{isID ? 'HP, Tablet & PC' : 'Phone, Tablet & PC'}</p>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} flex items-center space-x-3`}>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isID ? 'Akses' : 'Access'}</p>
                  <p className="text-xs font-bold text-stone-900 dark:text-white">{isID ? 'Seumur Hidup' : 'Lifetime'}</p>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} flex items-center space-x-3`}>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isID ? 'Materi' : 'Content'}</p>
                  <p className="text-xs font-bold text-stone-900 dark:text-white">{skill.curriculum.length} {isID ? 'Modul Bab' : 'Modules'}</p>
                </div>
              </div>
            </div>

            {/* ACTION CTA BLOCK */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {isOwned ? (
                <button 
                  onClick={() => onStartLearning(skill)}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>{isID ? 'Mulai Pembelajaran (Milik Anda)' : 'Start Learning (Owned)'}</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (!profile) {
                      if (onOpenAuth) onOpenAuth('login');
                    } else {
                      setShowCheckout(true);
                    }
                  }}
                  className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95"
                >
                  <span>{isID ? `Buka Solusi Praktis (${formatRupiah(skill.price)})` : `Unlock Solution (${formatRupiah(skill.price)})`}</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}

              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400">
                <HeartHandshake className="h-4 w-4 text-brand-500 flex-shrink-0" />
                <span className="text-[11px] font-medium leading-tight">
                  {isID ? 'Garansi Kepuasan 100% Akses Langsung Tanpa Batas' : '100% Satisfaction Lifetime Guarantee'}
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Cover & Interactive Badge */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border-2 border-stone-200 dark:border-stone-800 shadow-2xl bg-stone-900 aspect-[4/3] group">
              <img 
                src={getSkillCover(skill)} 
                alt={skill.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent"></div>
              
              {/* Floating Badge Over Cover */}
              <div className="absolute top-4 right-4 bg-brand-500 text-white px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-lg flex items-center space-x-1">
                <span>{formatRupiah(skill.price)}</span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-stone-950/80 backdrop-blur-md border border-stone-800/80 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{skill.title}</h4>
                    <p className="text-[10px] text-stone-400">{isID ? 'Modul Interaktif & AI Coach' : 'Interactive Module & AI Coach'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded">
                    Blinkist Format
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. PROBLEM VS TRANSFORMATION SECTION (MERAH vs HIJAU CONTRAST) */}
      <section className="py-12 sm:py-16 border-y border-stone-200 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'MASALAH VS SOLUSI' : 'PROBLEM VS TRANSFORMATION'}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-stone-900 dark:text-white mt-1">
              {isID ? 'Transformasi Hasil Nyata Setelah Mempelajari Modul Ini' : 'Real World Transformation After Learning'}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-xl mx-auto">
              {isID ? 'Perbandingan mendasar antara hambatan yang sering dialami dengan terobosan yang akan Anda dapatkan.' : 'Comparison between the common obstacle and your breakthroughs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PROBLEM CARD (STYLE MERAH) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-red-50/90 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/60 shadow-md space-y-4 relative overflow-hidden">
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 font-bold">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block text-red-500">{isID ? 'KONDISI SEBELUMNYA' : 'THE FRICTION'}</span>
                  <h3 className="text-lg font-bold font-heading text-stone-900 dark:text-white">{isID ? 'Masalah Utama Yang Dihadapi' : 'Primary Obstacle'}</h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-red-950 dark:text-red-200 leading-relaxed font-medium italic">
                "{skill.problem}"
              </p>
              <div className="pt-2 border-t border-red-200 dark:border-red-900/40 text-[11px] text-red-700 dark:text-red-300 flex items-center space-x-2 font-medium">
                <span>⚠️ {isID ? 'Menyebabkan pemborosan waktu dan eksekusi yang kurang maksimal.' : 'Causes wasted time and suboptimal execution.'}</span>
              </div>
            </div>

            {/* TRANSFORMATION CARD (STYLE HIJAU) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-900/60 shadow-md space-y-4 relative overflow-hidden">
              <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block text-emerald-500">{isID ? 'HASIL SETELAH BELAJAR' : 'THE TRANSFORMATION'}</span>
                  <h3 className="text-lg font-bold font-heading text-stone-900 dark:text-white">{isID ? 'Solusi & Terobosan Konkret' : 'Concrete Breakthrough'}</h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium italic">
                "{skill.transformation}"
              </p>
              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center space-x-2 font-medium">
                <span>🚀 {isID ? 'Siap diaplikasikan secara instan dalam skenario kerja nyata.' : 'Ready for instant application in real scenarios.'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT YOU WILL MASTER (KEY LEARNING OUTCOMES) */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'KOMPETENSI UTAMA' : 'KEY OUTCOMES'}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-stone-900 dark:text-white">
            {isID ? 'Apa Yang Akan Anda Kuasai Dalam 30 Menit' : 'What You Will Master in 30 Minutes'}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
            {isID ? 'Poin-poin kemampuan praktis yang dibangun secara bertahap melalui modul Blinkist-style ini.' : 'Practical capability shifts built step by step.'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {skill.whyLearnThis.map((benefit, idx) => (
            <div 
              key={idx} 
              className={`p-3 sm:p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                darkMode ? 'bg-stone-900 border-stone-800 hover:border-brand-500/50' : 'bg-white border-stone-200 hover:border-brand-500/50 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-extrabold text-sm border border-brand-500/20">
                  0{idx + 1}
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white leading-snug">{benefit}</h4>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center text-[10px] font-semibold text-brand-500">
                <Check className="h-3.5 w-3.5 mr-1" />
                <span>{isID ? 'Latihan Skenario Siap Pakai' : 'Practical Scenario Included'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CURRICULUM ROADMAP & LESSONS MAP */}
      <section className="py-16 bg-stone-100/60 dark:bg-stone-900/40 border-y border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'PETA STRUKTUR MATERI' : 'CURRICULUM ROADMAP'}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-stone-900 dark:text-white">
              {isID ? 'Alur Kurikulum Pembelajaran Mikro' : 'Micro Learning Curriculum Map'}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
              {isID ? 'Disusun ringkas, sistematis, dan langsung pada inti pembahasan.' : 'Structured concisely and directly focused on execution.'}
            </p>
          </div>

          <div className="space-y-4">
            {skill.curriculum.map((curr, idx) => (
              <div 
                key={curr.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  darkMode ? 'bg-stone-900 border-stone-800 hover:border-brand-500/40' : 'bg-white border-stone-200 hover:border-brand-500/40 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-2xl bg-stone-900 dark:bg-brand-500 text-white dark:text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold text-brand-500 uppercase tracking-wider">{isID ? `MODUL BAB ${idx + 1}` : `MODULE ${idx + 1}`}</span>
                      <span className="text-[10px] text-stone-400">•</span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{isID ? 'Ringkasan Cepat' : 'Quick Summary'}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white mt-0.5">{curr.title}</h4>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                    <Clock className="h-3.5 w-3.5 text-brand-500" />
                    <span>{localizeDuration(curr.duration, lang)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EXCLUSIVE BONUSES & FACILITIES INCLUDED */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'FASILITAS EKSKLUSIF' : 'INCLUDED FACILITIES'}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-stone-900 dark:text-white">
            {isID ? 'Fasilitas & Fitur Pendukung Lengkap' : 'Complete Supporting Learning Tools'}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
            {isID ? 'Setiap pembelian SkillPill mendapatkan akses ke 4 fitur pendukung ini tanpa biaya tambahan.' : 'Every SkillPill purchase unlocks these 4 core supporting features.'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className={`p-3 sm:p-6 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} space-y-3`}>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500 w-fit">
              <Bot className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white">{isID ? 'Personal AI Coach 24/7' : 'Personal AI Coach 24/7'}</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {isID ? 'Asisten AI interaktif yang siap menjawab pertanyaan dan mensimulasikan studi kasus Anda.' : 'Interactive AI assistant to answer questions and simulate case studies.'}
            </p>
          </div>

          <div className={`p-3 sm:p-6 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} space-y-3`}>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500 w-fit">
              <Layers className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white">{isID ? 'Diagram Konsep Visual' : 'Visual Concept Diagrams'}</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {isID ? 'Infografis & flowchart skematik untuk mempermudah pemahaman konsep rumit.' : 'Schematic infographics & flowcharts for quick visual comprehension.'}
            </p>
          </div>

          <div className={`p-3 sm:p-6 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} space-y-3`}>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500 w-fit">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white">{isID ? 'Checklist Aksi Siap Pakai' : 'Actionable Checklist'}</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {isID ? 'Daftar periksa eksekusi harian agar hasil pembelajaran langsung terwujud.' : 'Step-by-step checklist to apply techniques in daily work.'}
            </p>
          </div>

          <div className={`p-3 sm:p-6 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'} space-y-3`}>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500 w-fit">
              <UserCheck className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white">{isID ? 'Jurnal Refleksi Mandiri' : 'Self Reflection Journal'}</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {isID ? 'Fitur jurnal pencatatan progres untuk mengevaluasi pemahaman modul Anda.' : 'Journaling tool to track progress and evaluate module retention.'}
            </p>
          </div>
        </div>
      </section>

      {/* 7. EVIDENCE & RESEARCH FOUNDATION */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border border-brand-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start gap-6">
          <div className="p-3 rounded-2xl bg-brand-500 text-white font-bold text-2xl flex-shrink-0 shadow-md">
            🔬
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'LANDASAN METODE' : 'EVIDENCE BASED'}</span>
            <h3 className="text-lg font-bold font-heading text-stone-900 dark:text-white">
              {isID ? 'Didasarkan Pada Metodologi & Framework Teruji' : 'Grounded in Proven Frameworks & Methodology'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {skill.evidence}
            </p>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS & REVIEWS */}
      <section className="py-16 bg-stone-100/60 dark:bg-stone-900/40 border-y border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'TESTIMONI PENGGUNA' : 'LEARNER REVIEWS'}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-stone-900 dark:text-white">
              {isID ? 'Ulasan dari Profesional & Pembelajar' : 'Feedback From Real Learners'}
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {skill.testimonials.map((test, idx) => (
              <div 
                key={idx} 
                className={`p-3 sm:p-8 rounded-2xl sm:rounded-3xl border relative flex flex-col justify-between ${
                  darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                }`}
              >
                <Quote className="h-8 w-8 text-brand-500/20 absolute top-6 right-6" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-1 text-brand-500">
                    {Array.from({ length: test.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-brand-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 italic leading-relaxed">
                    "{test.quote}"
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-brand-500/20 text-brand-500 font-bold flex items-center justify-center text-xs">
                    {test.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">{test.name}</h4>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'PERTANYAAN UMUM' : 'FREQUENTLY ASKED QUESTIONS'}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-stone-900 dark:text-white">
            {isID ? 'Pertanyaan Yang Sering Diajukan' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-4">
          {skill.faq.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl border ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'}`}
            >
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white flex items-center space-x-2.5">
                <HelpCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                <span>{item.question}</span>
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 pl-6 leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FEEDBACK SECTION (Standard requirement #13) */}
      {onOpenFeedback && (
        <section className="py-8 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                  {isID ? 'Ada Saran Atau Masukan Untuk SkillPill Ini?' : 'Have Suggestions for this SkillPill?'}
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isID ? 'Bantu kami meningkatkan kualitas materi dan fitur pembelajaran mikro.' : 'Help us improve our micro learning content.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenFeedback(skill.title)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer whitespace-nowrap"
            >
              {isID ? 'Kirim Feedback' : 'Submit Feedback'}
            </button>
          </div>
        </section>
      )}

      {/* 11. HIGH IMPACT CTA BOX */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl border border-stone-800">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400">
              {isID ? 'SIAP MENGUASAI KETERAMPILAN INI?' : 'READY TO MASTER THIS SKILL?'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight leading-none text-white">
              {skill.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
              {isID 
                ? 'Dapatkan modul Blinkist-style lengkap, AI Coach companion, serta lembar kerja checklist aksi hanya dengan sekali bayar.' 
                : 'Get the complete Blinkist-style module, AI Coach companion, and action checklist.'}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
              {isOwned ? (
                <button 
                  onClick={() => onStartLearning(skill)}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-lg"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>{isID ? 'Mulai Belajar (Milik Anda)' : 'Start Learning (Owned)'}</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (!profile) {
                      if (onOpenAuth) onOpenAuth('login');
                    } else {
                      setShowCheckout(true);
                    }
                  }}
                  className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg cursor-pointer"
                >
                  {isID ? `Buka SkillPill (${formatRupiah(skill.price)})` : `Unlock SkillPill (${formatRupiah(skill.price)})`}
                </button>
              )}
              <button onClick={onBack} className="text-stone-400 hover:text-white text-xs font-semibold cursor-pointer">
                {isID ? 'Kembali ke Katalog' : 'Back to Directory'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. RELATED SKILLPILLS */}
      {relatedSkills.length > 0 && (
        <section className="page-container py-12 sm:py-16 border-t border-stone-200 dark:border-stone-800">
          <div className="mb-8">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-500">{isID ? 'MODUL TERKAIT' : 'RELATED MODULES'}</span>
            <h3 className="text-xl font-bold font-heading text-stone-900 dark:text-white mt-1">
              {isID ? 'SkillPill Terkait Lainnya' : 'Related SkillPill Modules'}
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {relatedSkills.map((rel) => (
              <div 
                key={rel.id} 
                onClick={() => onSelectRelated(rel)}
                className={`group min-w-0 rounded-2xl border p-3 sm:p-4 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-1 ${
                  darkMode ? 'bg-stone-900 border-stone-800 hover:border-brand-500/50' : 'bg-white border-stone-200 hover:border-brand-500/50 shadow-sm'
                }`}
              >
                <img 
                  src={getSkillCover(rel)} 
                  alt={rel.title} 
                  className="w-full aspect-video sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-brand-500 transition-colors line-clamp-1">{rel.title}</h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">{rel.shortDescription}</p>
                  <span className="text-[10px] font-extrabold text-brand-500 mt-1 block">{formatRupiah(rel.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 13. CHECKOUT MODAL / DRAWER */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-stone-900 text-white px-6 py-4 flex justify-between items-center border-b border-stone-800">
              <div>
                <h3 className="font-bold text-sm font-heading">{isID ? 'Pembayaran Aman' : 'Secure Checkout'}</h3>
                <p className="text-[10px] text-stone-400">{isID ? 'Platform Perdagangan Micro Skill' : 'Micro Skill Commerce Platform'}</p>
              </div>
              <button 
                onClick={() => setShowCheckout(false)}
                className="text-stone-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Product overview */}
              <div className="bg-stone-100 dark:bg-stone-800/80 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 flex space-x-3">
                <img src={getSkillCover(skill)} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white">{skill.title}</h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">{isID ? '1x Lisensi SkillPill Seumur Hidup' : '1x SkillPill Lifetime License'}</p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  {isID ? 'Metode Pembayaran' : 'Payment Gateway'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS / E-Wallet')}
                    className={`p-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${paymentMethod === 'QRIS / E-Wallet' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-300' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'}`}
                  >
                    QRIS / E-Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Credit Card')}
                    className={`p-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${paymentMethod === 'Credit Card' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-300' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'}`}
                  >
                    {isID ? 'Kartu Kredit' : 'Credit Card'}
                  </button>
                </div>
              </div>

              {/* Coupon Codes */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  {isID ? 'Kode Promo / Kupon' : 'Promo Code'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={isID ? 'contoh: PILLFREE' : 'e.g. PILLFREE'}
                    className="flex-grow px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-2 bg-stone-900 dark:bg-stone-700 text-white rounded-xl text-xs font-bold hover:bg-stone-800 cursor-pointer"
                  >
                    {isID ? 'Gunakan' : 'Apply'}
                  </button>
                </div>
                {isCouponApplied && (
                  <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>{isID ? 'Kupon PILLFREE aktif! Harga Rp0.' : 'PILLFREE coupon applied! Price is Rp0.'}</span>
                  </p>
                )}
                {errorMsg && (
                  <p className="text-red-500 text-[10px] font-semibold">{errorMsg}</p>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="border-t border-stone-200 dark:border-stone-800 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-stone-500 dark:text-stone-400">
                  <span>{isID ? 'Subtotal' : 'Subtotal'}</span>
                  <span>{formatRupiah(skill.price)}</span>
                </div>
                {isCouponApplied && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>{isID ? 'Diskon (PILLFREE)' : 'Discount (PILLFREE)'}</span>
                    <span>-{formatRupiah(skill.price)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-stone-900 dark:text-white border-t border-stone-100 dark:border-stone-800 pt-2 text-sm">
                  <span>{isID ? 'Total' : 'Total'}</span>
                  <span>{formatRupiah(finalPrice)}</span>
                </div>
              </div>

              {/* Submit Checkout */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/10 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{isID ? 'Memproses Transaksi...' : 'Processing Payment...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>{isID ? `Otorisasi & Buka (${formatRupiah(finalPrice)})` : `Authorize & Unlock (${formatRupiah(finalPrice)})`}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
