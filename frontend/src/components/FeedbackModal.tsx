/**
 * FeedbackModal Component
 * Standardized feature: Feedback tool on every page/tool
 */

import React, { useState } from 'react';
import { X, Star, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Language } from '../lib/translations';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  toolName?: string;
}

export default function FeedbackModal({ isOpen, onClose, lang, toolName = 'SkillPill Micro Skill Platform' }: FeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#f8fbff] dark:bg-stone-900 dark:text-white w-full max-w-md max-h-[92dvh] rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 flex justify-between items-center border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-brand-500" />
            <div>
              <h3 className="font-bold text-sm font-heading">{lang === 'ID' ? 'Kirim Masukan & Ulasan' : 'Tool Feedback & Rating'}</h3>
              <p className="text-[10px] text-stone-400">{toolName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-bold text-lg font-heading">{lang === 'ID' ? 'Terima Kasih!' : 'Thank You!'}</h4>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {lang === 'ID' ? 'Masukan Anda sangat berharga untuk pengembangan tools ini.' : 'Your feedback helps us continuously improve this tool.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                {lang === 'ID' ? 'Beri Rating Tool Ini' : 'Rate Your Experience'}
              </label>
              <div className="flex items-center space-x-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star className={`h-7 w-7 ${star <= rating ? 'fill-brand-400 text-brand-400' : 'text-stone-300 dark:text-stone-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                {lang === 'ID' ? 'Masukan / Saran Pengembangan' : 'Comments & Suggestions'}
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={lang === 'ID' ? 'Tulis tanggapan, kendala, atau ide fitur baru...' : 'Write your suggestions, feedback, or feature ideas...'}
                className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow shadow-brand-500/10"
            >
              {lang === 'ID' ? 'Kirim Masukan' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
