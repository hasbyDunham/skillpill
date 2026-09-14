/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Target, Clock, ShieldCheck, ClipboardList, Lightbulb, Compass, Award, FileSpreadsheet, Check } from 'lucide-react';
import { SkillPill } from '../../types';
import { Language } from '../../lib/translations';
import { motion } from 'motion/react';

interface LearningContractProps {
  skill: SkillPill;
  onCommit: (learnerName: string) => void;
  isCommitted: boolean;
  lang?: Language;
}

export default function LearningContract({ skill, onCommit, isCommitted, lang = 'ID' }: LearningContractProps) {
  const isID = lang === 'ID';
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isID ? 'Ketik nama atau inisial Anda untuk menyelesaikan tanda tangan.' : 'Please type your name or initials to finalize your signature.');
      return;
    }
    setError('');
    onCommit(name);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Title Block */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
          {isID ? 'Modul 2: Komitmen' : 'Module 2: Commitment'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-stone-900 dark:text-white tracking-tight leading-tight">
          {isID ? 'Kontrak Belajar' : 'The Learning Contract'}
        </h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          {isID ? 'Sebelum memulai pembelajaran, tetapkan niat belajar Anda. Penguasaan yang dapat diterapkan dimulai dari fokus dan komitmen.' : 'Before entering the skill pipeline, solidify your learning intention. Actionable mastery begins with a committed focus.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        {/* Today's Mission & Expectations */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-950 dark:text-white flex items-center gap-2">
              <Target className="h-4.5 w-4.5 text-brand-500" />
              <span>{isID ? 'Misi Hari Ini' : "Today's Mission"}</span>
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed font-sans">
              {isID ? 'Pelajari materi dengan estimasi waktu' : 'Study the material with an estimated time of'} <span className="font-bold text-stone-900 dark:text-white">{skill.estimatedTime || (isID ? '30 menit' : '30 minutes')}</span> {isID ? 'untuk' : 'for'} <span className="font-bold text-stone-900 dark:text-white">"{skill.title}"</span>. {isID ? 'Ini hanya perkiraan dan tidak membatasi waktu belajar Anda.' : 'This is only an estimate and does not limit your learning time.'}
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div className="space-y-0.5">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">{isID ? 'Estimasi Waktu Belajar' : 'Estimated Learning Time'}</span>
                <span className="text-xs font-semibold text-stone-900 dark:text-white flex items-center gap-1">
                  <Clock className="h-3 w-3 text-stone-500" />
                  {skill.estimatedTime || (isID ? '30 Menit' : '30 Minutes')}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">{isID ? 'Hasil yang Diharapkan' : 'Expected Outcome'}</span>
                <span className="text-xs font-semibold text-stone-900 dark:text-white flex items-center gap-1">
                  <Award className="h-3 w-3 text-stone-500" />
                  {isID ? 'Terapkan dalam 24 jam' : 'Apply in next 24 hours'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-stone-950 dark:text-white flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-stone-600" />
              <span>{isID ? 'Daftar Persiapan Anda' : 'Your Preparation Checklist'}</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✓</span>
                <span>{isID ? 'Siapkan tempat yang tenang selama 15–20 menit. Matikan notifikasi browser jika memungkinkan.' : 'Prepare a quiet workspace for the next 15–20 minutes. Disable browser notifications if possible.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✓</span>
                <span>{isID ? 'Buka catatan di pemutar untuk menuliskan poin penting dan rencana tindakan.' : 'Keep your Knowledge Vault notes open in the player to capture key points and action prompts.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-4 w-4 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✓</span>
                <span>{isID ? 'Siapkan satu situasi nyata untuk digunakan saat mengerjakan latihan interaktif.' : 'Bring a real-world scenario to mind for the interactive practice exercises.'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Methodology & Commitment Action */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-stone-300 p-6 rounded-2xl border border-stone-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="h-4.5 w-4.5 text-brand-400" />
              <span>{isID ? 'Metode Pembelajaran' : 'The Learning Methodology'}</span>
            </h3>
            <div className="space-y-3 text-xs leading-relaxed">
              <p>
                {isID ? 'SkillPill ini menggunakan alur terstruktur yang membantu Anda beralih dari pembaca pasif menjadi praktisi aktif.' : 'This SkillPill follows a structured path designed to move you from a passive learner to an active practitioner.'}
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <span className="font-mono text-brand-400 text-xs font-bold block">1. {isID ? 'Pemetaan Konsep:' : 'Concept Mapping:'}</span>
                  <span>{isID ? 'Pahami tujuan, pemicu, definisi, dan analogi.' : 'Analyze objectives, triggers, definitions, and analogies.'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-brand-400 text-xs font-bold block">2. {isID ? 'Latihan Praktik:' : 'Sandbox Practice:'}</span>
                  <span>{isID ? 'Susun jawaban dan selesaikan latihan interaktif.' : 'Compose answers and complete interactive exercises.'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-brand-400 text-xs font-bold block">3. {isID ? 'Tindakan Nyata:' : 'Field Action:'}</span>
                  <span>{isID ? 'Susun target konkret untuk hari ini, minggu ini, dan bulan ini.' : 'Set concrete milestones for today, this week, and this month.'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Signature / Seal */}
          <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${isCommitted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-950 dark:text-emerald-100' : 'bg-white dark:bg-stone-900 border-brand-500/30 border-2 shadow-md shadow-brand-500/5'}`}>
            <h3 className="text-sm font-bold text-stone-950 dark:text-white flex items-center gap-2 mb-2">
              <ShieldCheck className={`h-5 w-5 ${isCommitted ? 'text-emerald-600' : 'text-brand-500 animate-pulse'}`} />
              <span>{isCommitted ? (isID ? 'Kontrak Disahkan' : 'Contract Sealed') : (isID ? 'Tandatangani Komitmen' : 'Sign & Seal Commitment')}</span>
            </h3>

            {isCommitted ? (
              <div className="space-y-3 py-2 text-xs">
                <p className="leading-relaxed font-sans font-medium text-emerald-800">
                  {isID ? 'Komitmen Anda sudah tercatat. Seluruh alur pembelajaran kini terbuka.' : 'Your commitment has been recorded. The full learning journey is now unlocked.'}
                </p>
                <div className="h-10 border border-emerald-200 border-dashed rounded-lg flex items-center justify-between px-3 bg-white">
                  <span className="font-serif italic text-stone-500 tracking-wider">{isID ? 'Ditandatangani secara elektronik' : 'Signed electronically'}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="h-3 w-3" /> {isID ? 'TERVERIFIKASI' : 'SECURE SEAL'}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSign} className="space-y-3 pt-1">
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {isID ? 'Masukkan nama lengkap atau inisial untuk mengaktifkan target pembelajaran Anda.' : 'Enter your full name or initials to activate your learning goals.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder={isID ? 'Contoh: Budi Santoso' : 'E.g., John Doe'}
                    className="flex-grow px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-[#f8fbff]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-950 hover:bg-stone-850 text-[#f8fbff] text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                  >
                    {isID ? 'Setujui & Mulai' : 'Commit & Start'}
                  </button>
                </div>
                {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
