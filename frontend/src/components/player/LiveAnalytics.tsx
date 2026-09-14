import React from 'react';
import { Clock } from 'lucide-react';
import { Language } from '../../lib/translations';

interface LiveAnalyticsProps {
  learningSeconds: number;
  onClose?: () => void;
  lang?: Language;
}

const formatLearningTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function LiveAnalytics({ learningSeconds, onClose, lang = 'ID' }: LiveAnalyticsProps) {
  const isID = lang === 'ID';

  return (
    <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-4 font-sans text-stone-800 shadow-lg sm:p-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-brand-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900">{isID ? 'Waktu Belajar' : 'Learning Time'}</h3>
        </div>
        {onClose && <button onClick={onClose} className="cursor-pointer text-xs font-bold text-stone-400 hover:text-stone-700">{isID ? 'Tutup' : 'Close'}</button>}
      </div>

      <div className="mt-4 rounded-xl border border-brand-500/15 bg-brand-50/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{isID ? 'Total waktu pada Skill ini' : 'Total time for this Skill'}</p>
        <p className="mt-2 font-mono text-3xl font-bold text-stone-900">{formatLearningTime(learningSeconds)}</p>
      </div>
    </div>
  );
}
