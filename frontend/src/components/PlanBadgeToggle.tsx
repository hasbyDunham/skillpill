/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Crown, Zap, Sparkles, Check, Lock, ChevronDown } from 'lucide-react';
import { Language } from '../lib/translations';
import ProPlanModal from './ProPlanModal';
import { SkillPillPlan } from '../types';

interface PlanBadgeToggleProps {
  currentPlan?: 'free' | 'pro';
  onTogglePlan: (newPlan: 'free' | 'pro') => void;
  onOpenPlanModal?: () => void;
  lang: Language;
  darkMode?: boolean;
  plans?: SkillPillPlan[];
}

export default function PlanBadgeToggle({
  currentPlan = 'free',
  onTogglePlan,
  onOpenPlanModal,
  lang,
  darkMode,
  plans = []
}: PlanBadgeToggleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isPro = currentPlan === 'pro';
  const openPlanModal = onOpenPlanModal ?? (() => setIsModalOpen(true));

  return (
    <>
      <div className="flex items-center space-x-1.5">
        <button
          onClick={openPlanModal}
          className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center space-x-2 transition-all shadow-sm ${
            isPro
              ? 'bg-gradient-to-r from-brand-500/20 via-brand-500/10 to-emerald-500/20 border-brand-500/40 text-brand-800 dark:text-brand-300 hover:border-brand-500'
              : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-brand-500/50'
          }`}
          title={lang === 'ID' ? 'Buka pengaturan Paket Gratis/Pro' : 'Open Free/Pro plan settings'}
        >
          {/* Status Indicator Icon */}
          <div className="flex items-center space-x-1">
            {isPro ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-brand-500"></span>
            )}
            
            {isPro ? (
              <Crown className="h-3.5 w-3.5 text-brand-500 fill-brand-500/20" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-stone-400" />
            )}
          </div>

          {/* Badge Text */}
          <span className="tracking-tight text-[11px]">
            {isPro ? (
              <span className="flex items-center space-x-1">
                <span>PRO</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-black uppercase">
                  {lang === 'ID' ? 'Aktif' : 'Active'}
                </span>
              </span>
            ) : (
              <span className="flex items-center space-x-1">
                <span>{lang === 'ID' ? 'GRATIS' : 'FREE'}</span>
                <span className="text-[9px] bg-brand-500/20 text-brand-700 dark:text-brand-300 px-1.5 py-0.2 rounded font-bold uppercase">
                  {lang === 'ID' ? 'Nonaktif' : 'Inactive'}
                </span>
              </span>
            )}
          </span>

          <ChevronDown className="h-3 w-3 text-stone-400" />
        </button>

        {/* Quick Upgrade CTA Button when Free */}
        {!isPro && (
          <button
            onClick={openPlanModal}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] rounded-xl shadow-sm transition-all"
          >
            <Zap className="h-3 w-3 fill-stone-950" />
            <span>{lang === 'ID' ? 'Tingkatkan ke Pro' : 'Upgrade to Pro'}</span>
          </button>
        )}
      </div>

      {/* Plan Details & Switch Modal */}
      {!onOpenPlanModal && (
        <ProPlanModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lang={lang}
          currentPlan={currentPlan}
          onTogglePlan={onTogglePlan}
          plans={plans}
        />
      )}
    </>
  );
}
