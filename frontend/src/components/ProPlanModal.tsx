/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check, ShieldAlert, Sparkles, Crown, Zap, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language } from '../lib/translations';
import { UserProfile } from '../types';

interface ProPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentPlan: 'free' | 'pro';
  onTogglePlan: (newPlan: 'free' | 'pro') => void;
}

export default function ProPlanModal({
  isOpen,
  onClose,
  lang,
  currentPlan,
  onTogglePlan
}: ProPlanModalProps) {
  if (!isOpen) return null;

  const isPro = currentPlan === 'pro';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-t-3xl sm:rounded-3xl max-w-2xl max-h-[92dvh] w-full p-5 sm:p-8 shadow-2xl relative overflow-y-auto text-stone-900 dark:text-stone-100">
        
        {/* Background Accent Gradient */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Crown className="h-3.5 w-3.5" />
            <span>{lang === 'ID' ? 'Fitur & Standarisasi Keanggotaan' : 'Membership Features'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
            {lang === 'ID' ? 'Pilih Paket Layanan SkillPill' : 'Choose Your SkillPill Plan'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            {lang === 'ID'
              ? 'Status keanggotaan menentukan tingkat akses fitur, katalog mikro skill, dan generator AI kustom Anda.'
              : 'Your membership tier determines your access level to micro skills, features, and custom AI generators.'}
          </p>

          {/* Current Status Pill */}
          <div className="pt-2">
            <span className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
              isPro 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400'
            }`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${isPro ? 'bg-emerald-500' : 'bg-brand-500'}`} />
              <span>
                {lang === 'ID' 
                  ? `Status Saat Ini: ${isPro ? 'PRO AKTIF' : 'FREE / NONAKTIF PRO'}`
                  : `Current Status: ${isPro ? 'PRO ACTIVE' : 'FREE / PRO INACTIVE'}`}
              </span>
            </span>
          </div>
        </div>

        {/* Plan Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          {/* FREE PLAN CARD */}
          <div className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
            !isPro 
              ? 'border-brand-500 bg-brand-500/5 shadow-md ring-2 ring-brand-500/20' 
              : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
                  {lang === 'ID' ? 'Paket Gratis' : 'Free Plan'}
                </span>
                {!isPro && (
                  <span className="text-[10px] font-bold bg-brand-500 text-white px-2 py-0.5 rounded-full">
                    {lang === 'ID' ? 'Aktif' : 'Active'}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black mb-1 font-heading">
                Rp 0 <span className="text-xs font-normal text-stone-500">/ {lang === 'ID' ? 'selamanya' : 'forever'}</span>
              </div>
              <p className="text-[11px] text-stone-500 mb-4">
                {lang === 'ID' ? 'Akses pratinjau dasar untuk pembelajar baru.' : 'Basic preview access for new learners.'}
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-700 dark:text-stone-300 font-medium">
                    1. {lang === 'ID' ? 'Akses Katalog Publik' : 'Access the Public Catalog'}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-700 dark:text-stone-300 font-medium">
                    2. {lang === 'ID' ? 'Gratis 1 Pratinjau Micro Skill' : 'One Free Micro Skill Preview'}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-700 dark:text-stone-300 font-medium">
                    3. {lang === 'ID' ? 'Dukungan Komunitas Pembelajar' : 'Learner Community Support'}
                  </span>
                </div>

                {/* Locked in Free */}
                <div className="flex items-start space-x-2 opacity-50">
                  <Lock className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-500 line-through">
                    {lang === 'ID' ? 'Akses tak terbatas seluruh SkillPill' : 'Unlimited access to every SkillPill'}
                  </span>
                </div>
                <div className="flex items-start space-x-2 opacity-50">
                  <Lock className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-500 line-through">
                    {lang === 'ID' ? 'AI Generator untuk membuat skill khusus' : 'AI generator for custom skills'}
                  </span>
                </div>
              </div>
            </div>

            {isPro && (
              <button
                onClick={() => {
                  onTogglePlan('free');
                  onClose();
                }}
                className="mt-6 w-full py-2.5 px-4 border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-all"
              >
                {lang === 'ID' ? 'Beralih ke Gratis' : 'Switch to Free'}
              </button>
            )}
          </div>

          {/* PRO PLAN CARD */}
          <div className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
            isPro 
              ? 'border-emerald-500 bg-emerald-500/5 shadow-md ring-2 ring-emerald-500/20' 
              : 'border-brand-500/40 bg-gradient-to-b from-brand-500/10 to-transparent shadow-lg'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-brand-500 flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{lang === 'ID' ? 'Paket Pro' : 'Pro Plan'}</span>
                </span>
                {isPro ? (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    {lang === 'ID' ? 'Aktif' : 'Active'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-brand-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {lang === 'ID' ? 'Rekomendasi' : 'Recommended'}
                  </span>
                )}
              </div>

              <div className="text-2xl font-black mb-1 font-heading text-brand-500">
                PRO <span className="text-xs font-normal text-stone-500">/ {lang === 'ID' ? 'Akses Penuh' : 'Full Access'}</span>
              </div>
              <p className="text-[11px] text-stone-500 mb-4">
                {lang === 'ID' ? 'Akses tak terbatas seluruh platform & generator AI.' : 'Unlimited access to all skills & AI tools.'}
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-800 dark:text-stone-200 font-bold">
                    1. {lang === 'ID' ? 'Akses tak terbatas seluruh SkillPill' : 'Unlimited access to every SkillPill'}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-800 dark:text-stone-200 font-bold">
                    2. {lang === 'ID' ? 'AI Generator untuk membuat skill khusus' : 'AI generator for custom skills'}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-800 dark:text-stone-200 font-bold">
                    3. {lang === 'ID' ? 'Prioritas Dukungan Perusahaan' : 'Priority enterprise support'}
                  </span>
                </div>
                <div className="flex items-start space-x-2 text-stone-500">
                  <CheckCircle2 className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
                  <span>{lang === 'ID' ? 'Akses Katalog Publik' : 'Access the Public Catalog'}</span>
                </div>
                <div className="flex items-start space-x-2 text-stone-500">
                  <CheckCircle2 className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
                  <span>{lang === 'ID' ? 'Dukungan Komunitas Pembelajar' : 'Learner Community Support'}</span>
                </div>
              </div>
            </div>

            {!isPro ? (
              <button
                onClick={() => {
                  onTogglePlan('pro');
                  onClose();
                }}
                className="mt-6 w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5"
              >
                <Zap className="h-4 w-4 fill-stone-950" />
                <span>{lang === 'ID' ? 'Aktifkan Mode Pro Sekarang' : 'Activate Pro Mode Now'}</span>
              </button>
            ) : (
              <div className="mt-6 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                ✓ {lang === 'ID' ? 'Fitur Pro Aktif Sepenuhnya' : 'Pro Features Fully Active'}
              </div>
            )}
          </div>

        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-stone-100 dark:border-stone-800">
          <p className="text-[10px] text-stone-400">
            {lang === 'ID'
              ? 'Catatan: Anda dapat mengaktifkan atau menonaktifkan status Free/Pro kapan saja secara instan melalui tombol header.'
              : 'Note: You can activate or deactivate your Free/Pro status at any time instantly via the header control.'}
          </p>
        </div>

      </div>
    </div>
  );
}
