/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Activity, Clock, Award, BookOpen, Volume2, Bookmark, FileText, BarChart3, Star, AlertCircle } from 'lucide-react';
import { Language } from '../../lib/translations';

interface LiveAnalyticsProps {
  completedLessonsCount: number;
  totalLessonsCount: number;
  practiceAnswersCount: number;
  reflectionAnswersCount: number;
  notesCount: number;
  bookmarksCount: number;
  audioUsageCount: number;
  isCompleted: boolean;
  onClose?: () => void;
  lang?: Language;
}

export default function LiveAnalytics({
  completedLessonsCount,
  totalLessonsCount,
  practiceAnswersCount,
  reflectionAnswersCount,
  notesCount,
  bookmarksCount,
  audioUsageCount,
  isCompleted,
  onClose,
  lang = 'ID',
}: LiveAnalyticsProps) {
  const isID = lang === 'ID';
  const [seconds, setSeconds] = useState(0);

  // Focus Timer active in session
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dynamic engagement quotient (EQ) out of 100
  const engagementQuotient = Math.min(
    100,
    Math.round(
      (completedLessonsCount / (totalLessonsCount || 1)) * 30 +
        practiceAnswersCount * 15 +
        reflectionAnswersCount * 15 +
        notesCount * 10 +
        bookmarksCount * 5 +
        (audioUsageCount > 0 ? 10 : 0)
    )
  );

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-lg space-y-5 sm:space-y-6 max-w-sm w-full max-h-[calc(100dvh-5rem)] overflow-y-auto font-sans text-stone-800">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900">{isID ? 'Analitik Fokus Langsung' : 'Live Focus Analytics'}</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
          >
            {isID ? 'Tutup' : 'Close'}
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/50 space-y-1">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="h-3 w-3 text-stone-500" /> {isID ? 'Waktu Sesi' : 'Session Time'}
          </span>
          <span className="text-lg font-mono font-bold text-stone-900">
            {formatTime(seconds)}
          </span>
          <span className="text-[8px] text-stone-400 block leading-none">{isID ? 'Mode fokus aktif' : 'Focus mode active'}</span>
        </div>

        <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-500/10 space-y-1">
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <Star className="h-3 w-3 text-emerald-500" /> {isID ? 'Keterlibatan' : 'Engagement'} (EQ)
          </span>
          <span className="text-lg font-bold text-emerald-900">
            {engagementQuotient}%
          </span>
          <span className="text-[8px] text-emerald-600 block leading-none">{isID ? 'Faktor retensi' : 'Retention factor'}</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3.5">
        <h4 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5 text-stone-500" /> {isID ? 'Rasio Penyelesaian' : 'Completion Ratios'}
        </h4>

        {/* Lessons Ratio */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-stone-600 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-stone-500" /> {isID ? 'Materi Pelajaran' : 'Lesson Content'}
            </span>
            <span className="text-stone-900">{completedLessonsCount}/{totalLessonsCount}</span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="bg-stone-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedLessonsCount / (totalLessonsCount || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Other stats split */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="border-r border-stone-100 last:border-0">
            <span className="text-[10px] font-bold text-stone-900 block">{practiceAnswersCount}</span>
            <span className="text-[8px] text-stone-400 uppercase font-semibold">{isID ? 'Latihan' : 'Practices'}</span>
          </div>
          <div className="border-r border-stone-100 last:border-0">
            <span className="text-[10px] font-bold text-stone-900 block">{reflectionAnswersCount}</span>
            <span className="text-[8px] text-stone-400 uppercase font-semibold">{isID ? 'Refleksi' : 'Reflections'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-900 block">{notesCount}</span>
            <span className="text-[8px] text-stone-400 uppercase font-semibold">{isID ? 'Catatan' : 'Saved Notes'}</span>
          </div>
        </div>
      </div>

      {/* System Drops & Difficulty checks */}
      <div className="border-t border-stone-100 pt-4 space-y-3">
        <h4 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 text-brand-500" /> {isID ? 'Titik Sulit & Pemeriksaan' : 'Drops & Checkpoints'}
        </h4>
        
        <div className="space-y-2 text-[10px] text-stone-600">
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-semibold text-stone-500">
              <span>{isID ? 'Teori Awal (Pelajaran 1)' : 'Intro Theory (Lesson 1)'}</span>
              <span>{isID ? '12% tingkat berhenti' : '12% drop rate'}</span>
            </div>
            <div className="h-1 w-full bg-stone-100 rounded">
              <div className="bg-brand-400 h-full rounded" style={{ width: '12%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-semibold text-stone-500">
              <span>{isID ? 'Alur Struktur (Pelajaran 2)' : 'Structural Flow (Lesson 2)'}</span>
              <span>{isID ? '38% berhenti (Kritis)' : '38% drop rate (Critical)'}</span>
            </div>
            <div className="h-1 w-full bg-stone-100 rounded">
              <div className="bg-red-400 h-full rounded" style={{ width: '38%' }} />
            </div>
          </div>
        </div>

        <p className="text-[9px] text-stone-400 leading-normal pt-1 italic">
          {isID ? '*Pelajaran 2 berisi definisi yang cukup padat. Gunakan mode analogi dan narasi audio untuk mengurangi kelelahan.' : '*Lesson 2 contains dense definitions. Use analogy mode and audio narration to reduce fatigue.'}
        </p>
      </div>

    </div>
  );
}
