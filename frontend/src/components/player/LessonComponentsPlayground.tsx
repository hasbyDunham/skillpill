/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, Download, ExternalLink, Columns, Layers, HelpCircle, 
  Play, Pause, Calculator, Milestone, Image, Sparkles, AlertCircle, Info
} from 'lucide-react';
import { Language } from '../../lib/translations';
import { formatRupiah } from '../../lib/localization';

export default function LessonComponentsPlayground({ lang = 'ID' }: { lang?: Language }) {
  const isID = lang === 'ID';
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'visuals' | 'calculators' | 'embeds' | 'accordions'>('visuals');
  
  // Accordion state
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({
    sc1: true,
    sc2: false,
  });

  // Embed Selector
  const [selectedEmbed, setSelectedEmbed] = useState<'figma' | 'miro' | 'loom' | 'canva'>('figma');

  // Interactive Formula Calculator
  const [anchorVal, setAnchorVal] = useState<number>(15_000_000);

  // Gallery slider
  const [galleryIdx, setGalleryIdx] = useState(0);
  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600', caption: isID ? 'Langkah 1: Menetapkan Nilai Jangkar' : 'Step 1: Establishing the Anchor Value' },
    { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600', caption: isID ? 'Langkah 2: Mengurangi Resistensi' : 'Step 2: Mitigating Reactance' },
    { url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=600', caption: isID ? 'Langkah 3: Mengarahkan Pilihan Target' : 'Step 3: Guiding the Target Choice' }
  ];

  const computedTarget = Math.round(anchorVal * 1.15);
  const computedDecoy = Math.round(computedTarget * 0.95);

  const toggleAccordion = (id: string) => {
    setAccordionOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-3 sm:p-6 space-y-5 sm:space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
        <div>
          <span className="text-[9px] font-extrabold uppercase text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
            {isID ? 'Perangkat Komponen' : 'Component Toolkit'}
          </span>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mt-1">{isID ? 'Media Pelajaran Interaktif' : 'Interactive Lesson Media Playground'}</h3>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex max-w-full overflow-x-auto no-scrollbar bg-stone-100 p-0.5 rounded-lg border border-stone-200">
          <button
            onClick={() => setActivePlaygroundTab('visuals')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${activePlaygroundTab === 'visuals' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {isID ? 'Visual & Tabel' : 'Visuals & Tables'}
          </button>
          <button
            onClick={() => setActivePlaygroundTab('calculators')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${activePlaygroundTab === 'calculators' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {isID ? 'Rumus' : 'Formulas'}
          </button>
          <button
            onClick={() => setActivePlaygroundTab('embeds')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${activePlaygroundTab === 'embeds' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {isID ? 'Sematan' : 'Embeds'}
          </button>
          <button
            onClick={() => setActivePlaygroundTab('accordions')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${activePlaygroundTab === 'accordions' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {isID ? 'Panel Lipat' : 'Collapsible Tabs'}
          </button>
        </div>
      </div>

      {/* Visuals & Tables Tab */}
      {activePlaygroundTab === 'visuals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          
          {/* Gallery Component */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <Image className="h-3.5 w-3.5 text-stone-500" /> {isID ? 'Galeri Interaktif' : 'Interactive Gallery'}
            </span>
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-stone-200 group">
              <img 
                src={galleryImages[galleryIdx].url} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-stone-900/80 p-2 text-[10px] text-white text-center font-medium font-sans">
                {galleryImages[galleryIdx].caption}
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <button 
                onClick={() => setGalleryIdx(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                className="text-stone-600 font-bold hover:text-stone-900"
              >
                ← {isID ? 'Sebelumnya' : 'Previous'}
              </button>
              <span className="text-stone-400 font-semibold">{galleryIdx + 1} {isID ? 'dari' : 'of'} {galleryImages.length}</span>
              <button 
                onClick={() => setGalleryIdx(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                className="text-stone-600 font-bold hover:text-stone-900"
              >
                {isID ? 'Berikutnya' : 'Next'} →
              </button>
            </div>
          </div>

          {/* Table / Layout Component */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <Columns className="h-3.5 w-3.5 text-stone-500" /> {isID ? 'Tabel Perbandingan' : 'Comparison Table'}
            </span>
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-[10px] font-sans border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                    <th className="p-2 text-left">{isID ? 'Tingkat' : 'Level'}</th>
                    <th className="p-2 text-left">{isID ? 'Hambatan Kognitif' : 'Cognitive Friction'}</th>
                    <th className="p-2 text-left">{isID ? 'Konversi' : 'Conversion Rate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  <tr>
                    <td className="p-2 font-bold text-stone-850">{isID ? 'Penawaran Ya/Tidak' : 'Yes/No Pitch'}</td>
                    <td className="p-2 text-red-600 font-semibold">{isID ? 'Tinggi (Resistensi)' : 'High (Reactance)'}</td>
                    <td className="p-2">12% - 15%</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-stone-850">{isID ? 'Dua Pilihan' : 'Two Tiers'}</td>
                    <td className="p-2 text-brand-600 font-semibold">{isID ? 'Sedang (Pertimbangan)' : 'Medium (Tradeoff)'}</td>
                    <td className="p-2">20% - 24%</td>
                  </tr>
                  <tr className="bg-emerald-50/20">
                    <td className="p-2 font-bold text-emerald-800">{isID ? 'Tiga Pilihan (Pembanding)' : 'Three Tiers (Decoy)'}</td>
                    <td className="p-2 text-emerald-600 font-bold">{isID ? 'Rendah (Mudah Dipahami)' : 'Low (Cognitive Ease)'}</td>
                    <td className="p-2 font-semibold">35% - 42%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Formulas Tab */}
      {activePlaygroundTab === 'calculators' && (
        <div className="space-y-4 animate-in fade-in duration-200 max-w-xl mx-auto">
          <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-200/50 flex gap-3 items-start">
            <Calculator className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase">{isID ? 'Rumus Jangkar Kognitif' : 'The Cognitive Anchoring Formula'}</h4>
              <p className="text-[10px] text-stone-600 mt-1 leading-normal">
                {isID ? 'Ubah nilai dasar jangkar untuk melihat perubahan nilai target dan opsi pembanding secara dinamis.' : 'Adjust the anchor base value to see target and decoy values update dynamically.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
            
            {/* Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-stone-500 uppercase">{isID ? 'Nilai Jangkar' : 'Aspirational Anchor'} (Rp)</label>
              <input 
                type="number" 
                value={anchorVal}
                onChange={(e) => setAnchorVal(Number(e.target.value))}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Target Output */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-0.5">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide block">{isID ? 'Target Hasil' : 'Computed Target'} (x1.15)</span>
              <span className="text-sm font-bold text-stone-900">{formatRupiah(computedTarget)}</span>
            </div>

            {/* Decoy Output */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-center rounded-xl space-y-0.5">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide block">{isID ? 'Pembanding Optimal' : 'Optimal Decoy'} (Target * 0.95)</span>
              <span className="text-sm font-bold text-emerald-900">{formatRupiah(computedDecoy)}</span>
            </div>

          </div>
        </div>
      )}

      {/* Embeds Tab */}
      {activePlaygroundTab === 'embeds' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex gap-2">
            {['figma', 'miro', 'loom', 'canva'].map((emb) => (
              <button
                key={emb}
                onClick={() => setSelectedEmbed(emb as any)}
                className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-full cursor-pointer transition-all ${selectedEmbed === emb ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                {emb}
              </button>
            ))}
          </div>

          {/* Simulated Embed Sandbox Container */}
          <div className="aspect-video w-full border border-stone-200 rounded-xl bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-3 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-radial-gradient from-stone-900 to-stone-950 opacity-80" />
            
            <div className="z-10 space-y-2">
              <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono">{isID ? 'Tautan Bingkai Aman Simulasi' : 'Simulated Secure Frame Link'}</span>
              <h4 className="text-xs font-bold text-white uppercase">{selectedEmbed === 'figma' ? '🎨 figma-design-specs.png' : selectedEmbed === 'miro' ? '🗺️ miro-mind-maps-flow' : selectedEmbed === 'loom' ? '🎬 Loom video walk-through' : '✨ Canva Presentation PDF'}</h4>
              <p className="text-[10px] text-stone-400 max-w-sm mx-auto">
                {isID ? 'Integrasi aman siap digunakan dan disesuaikan dengan ukuran layar.' : 'Secure integration is ready and optimized for the current viewport.'}
              </p>
            </div>

            <button 
              onClick={() => alert(isID ? `Membuka tampilan interaktif ${selectedEmbed}.` : `Opening the ${selectedEmbed} interactive view.`)}
              className="px-4 py-1.5 bg-white text-stone-950 hover:bg-stone-100 text-[10px] font-bold rounded-lg z-10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {isID ? 'Buka Sematan Asli' : 'Open Original Embed'}
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Tabs (Accordions & Tabs) */}
      {activePlaygroundTab === 'accordions' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Accordion List */}
          <div className="space-y-2">
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleAccordion('sc1')}
                className="w-full p-3 text-left bg-stone-50 hover:bg-stone-100/50 text-xs font-bold text-stone-900 flex justify-between items-center transition-all cursor-pointer"
              >
                <span>{isID ? 'Ilmu Kognitif: Resistensi Psikologis' : 'Cognitive Science: Psychological Reactance'}</span>
                <span>{accordionOpen.sc1 ? '−' : '+'}</span>
              </button>
              {accordionOpen.sc1 && (
                <div className="p-3.5 text-[11px] text-stone-600 bg-white border-t border-stone-150 leading-relaxed space-y-2 font-sans">
                  <p>
                    {isID ? 'Resistensi psikologis muncul ketika seseorang merasa kebebasan memilihnya terancam.' : 'Psychological reactance occurs when people feel their freedom of choice is threatened.'}
                  </p>
                  <p>
                    {isID ? 'Satu pilihan dapat memicu sikap defensif. Tiga pilihan membantu pengguna merasa tetap memiliki kendali.' : 'A single option can trigger defensiveness. Three options help people retain a sense of control.'}
                  </p>
                </div>
              )}
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleAccordion('sc2')}
                className="w-full p-3 text-left bg-stone-50 hover:bg-stone-100/50 text-xs font-bold text-stone-900 flex justify-between items-center transition-all cursor-pointer"
              >
                <span>{isID ? 'Teori Pilihan Pembanding: Efek Dominasi Asimetris' : 'Decoy Selection Theory: Asymmetric Dominance'}</span>
                <span>{accordionOpen.sc2 ? '−' : '+'}</span>
              </button>
              {accordionOpen.sc2 && (
                <div className="p-3.5 text-[11px] text-stone-600 bg-white border-t border-stone-150 leading-relaxed font-sans">
                  {isID ? 'Pilihan pembanding dirancang agar opsi target terlihat lebih unggul dan lebih mudah dipilih.' : 'A decoy option makes the target option look more valuable and easier to choose.'}
                </div>
              )}
            </div>
          </div>

          {/* Download Center */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-stone-500" />
              <div>
                <h4 className="text-[11px] font-bold text-stone-900">{isID ? 'Pusat Unduhan Materi' : 'Resource Download Center'}</h4>
                <p className="text-[9px] text-stone-500 leading-none">{isID ? 'Ringkasan PDF, workbook ZIP, dan template PowerPoint' : 'PDF cheat sheets, workbook ZIPs, and PowerPoint templates'}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => alert(isID ? 'Unduhan workbook PDF dimulai.' : 'Workbook PDF download started.')}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-[#f8fbff] text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <Download className="h-3 w-3" /> Workbook PDF
              </button>
              <button 
                onClick={() => alert(isID ? 'Unduhan aset ZIP dimulai.' : 'Assets ZIP download started.')}
                className="px-3 py-1.5 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <Download className="h-3 w-3" /> Assets ZIP
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
