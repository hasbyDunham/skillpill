/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Check, Type, Eye, AlignLeft, Grid } from 'lucide-react';
import { Language } from '../../lib/translations';

export type LearningTheme = 'light' | 'dark' | 'sepia' | 'paper';
export type ReadingDensity = 'comfort' | 'balanced' | 'compact';
export type ReadingFontSize = 'small' | 'medium' | 'large';
export type ReadingFontFamily = 'modern' | 'book';

export interface PersonalizationConfig {
  theme: LearningTheme;
  density: ReadingDensity;
  fontSize: ReadingFontSize;
  fontFamily: ReadingFontFamily;
}

interface PersonalizationPanelProps {
  config: PersonalizationConfig;
  onChange: (updates: Partial<PersonalizationConfig>) => void;
  onClose?: () => void;
  lang?: Language;
}

export default function PersonalizationPanel({ config, onChange, onClose, lang = 'ID' }: PersonalizationPanelProps) {
  const isID = lang === 'ID';
  
  const themes: Array<{ id: LearningTheme; label: string; bg: string; text: string; border: string }> = [
    { id: 'light', label: isID ? 'Terang Bersih' : 'Clean Light', bg: 'bg-[#f8fbff]', text: 'text-stone-900', border: 'border-stone-200' },
    { id: 'sepia', label: isID ? 'Sepia Vintage' : 'Vintage Sepia', bg: 'bg-[#f4ecd8]', text: 'text-[#433e30]', border: 'border-[#e4dcbf]' },
    { id: 'paper', label: isID ? 'Kertas Matte' : 'Matte Paper', bg: 'bg-[#e9e6df]', text: 'text-stone-800', border: 'border-stone-300' },
    { id: 'dark', label: isID ? 'Gelap Malam' : 'Midnight Slate', bg: 'bg-[#0c0a09]', text: 'text-stone-100', border: 'border-stone-800' },
  ];

  const fontSizes: Array<{ id: ReadingFontSize; label: string; desc: string }> = [
    { id: 'small', label: isID ? 'Kecil' : 'Small', desc: '14px' },
    { id: 'medium', label: isID ? 'Sedang' : 'Medium', desc: '16px' },
    { id: 'large', label: isID ? 'Besar' : 'Large', desc: '18px' },
  ];

  const densities: Array<{ id: ReadingDensity; label: string; desc: string }> = [
    { id: 'comfort', label: isID ? 'Nyaman' : 'Comfortable', desc: isID ? 'Jarak lega' : 'Roomy spacing' },
    { id: 'balanced', label: isID ? 'Seimbang' : 'Balanced', desc: isID ? 'Tata letak standar' : 'Standard layout' },
    { id: 'compact', label: isID ? 'Ringkas' : 'Compact', desc: isID ? 'Padat' : 'High density' },
  ];

  const fonts: Array<{ id: ReadingFontFamily; label: string; desc: string }> = [
    { id: 'modern', label: isID ? 'Sans Modern' : 'Modern Sans', desc: 'Plus Jakarta' },
    { id: 'book', label: isID ? 'Serif Buku' : 'Book Serif', desc: 'Playfair Classic' },
  ];

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-lg space-y-5 sm:space-y-6 max-w-sm w-full font-sans max-h-[calc(100dvh-5rem)] overflow-y-auto">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4.5 w-4.5 text-brand-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900">{isID ? 'Personalisasi' : 'Personalization'}</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {isID ? 'Selesai' : 'Done'}
          </button>
        )}
      </div>

      {/* Visual Theme Selection */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 block flex items-center gap-1">
          <Eye className="h-3 w-3" /> {isID ? 'Tema Visual' : 'Visual Theme'}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onChange({ theme: t.id })}
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${t.bg} ${t.text} ${config.theme === t.id ? 'ring-2 ring-brand-500 ring-offset-1 border-transparent font-extrabold shadow-sm' : t.border}`}
            >
              <span>{t.label}</span>
              {config.theme === t.id && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Typography settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Reading Font */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 block flex items-center gap-1">
            <Type className="h-3 w-3" /> {isID ? 'Jenis Font' : 'Font Family'}
          </span>
          <div className="flex flex-col gap-1.5">
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => onChange({ fontFamily: f.id })}
                className={`w-full text-left p-2 rounded-lg border text-xs cursor-pointer transition-all ${config.fontFamily === f.id ? 'border-stone-900 bg-stone-50 font-bold' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50/50'}`}
              >
                <div className="font-semibold">{f.label}</div>
                <div className="text-[9px] text-stone-400 leading-none">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 block flex items-center gap-1">
            <AlignLeft className="h-3 w-3" /> {isID ? 'Ukuran Font' : 'Font Size'}
          </span>
          <div className="flex flex-col gap-1.5">
            {fontSizes.map((s) => (
              <button
                key={s.id}
                onClick={() => onChange({ fontSize: s.id })}
                className={`w-full text-left p-2 rounded-lg border text-xs cursor-pointer transition-all ${config.fontSize === s.id ? 'border-stone-900 bg-stone-50 font-bold' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50/50'}`}
              >
                <div className="font-semibold">{s.label}</div>
                <div className="text-[9px] text-stone-400 leading-none">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Layout Density */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 block flex items-center gap-1">
          <Grid className="h-3 w-3" /> {isID ? 'Kepadatan Tata Letak' : 'Layout Density'}
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {densities.map((d) => (
            <button
              key={d.id}
              onClick={() => onChange({ density: d.id })}
              className={`p-2 rounded-lg border text-center text-[10px] cursor-pointer transition-all ${config.density === d.id ? 'border-stone-900 bg-stone-50 font-bold text-stone-900' : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50/50'}`}
            >
              <div className="font-bold">{d.label}</div>
              <div className="text-[8px] text-stone-400 leading-none mt-0.5">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
