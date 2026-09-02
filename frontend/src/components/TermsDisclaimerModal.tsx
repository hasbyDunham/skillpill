/**
 * TermsDisclaimerModal Component
 * Standardized feature: Disclaimer, Terms & Conditions, and Privacy Policy
 */

import React, { useState } from 'react';
import { X, ShieldAlert, FileText, Lock, ShieldCheck } from 'lucide-react';
import { Language } from '../lib/translations';

interface TermsDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialTab?: 'privacy' | 'terms' | 'disclaimer';
}

export default function TermsDisclaimerModal({ isOpen, onClose, lang, initialTab = 'disclaimer' }: TermsDisclaimerModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'disclaimer'>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#f8fbff] dark:bg-stone-900 dark:text-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92dvh] flex flex-col">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 flex justify-between items-center border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-brand-500" />
            <div>
              <h3 className="font-bold text-base font-heading">
                {lang === 'ID' ? 'Kebijakan & Syarat Ketentuan' : 'Policies & Terms of Service'}
              </h3>
              <p className="text-[10px] text-stone-400">{lang === 'ID' ? 'Standar Platform Contech.id' : 'Contech.id Platform Standard'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 px-3 sm:px-6 pt-3 gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'disclaimer' 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{lang === 'ID' ? 'Sanggahan' : 'Disclaimer'}</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'terms' 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{lang === 'ID' ? 'Syarat & Ketentuan' : 'Terms'}</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'privacy' 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{lang === 'ID' ? 'Kebijakan Privasi' : 'Privacy Policy'}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-stone-600 dark:text-stone-300 leading-relaxed flex-grow">
          
          {activeTab === 'disclaimer' && (
            <div className="bg-brand-50/60 dark:bg-brand-950/20 p-5 rounded-xl border border-brand-200 dark:border-brand-900 space-y-3">
              <h4 className="font-bold text-brand-900 dark:text-brand-400 font-heading text-sm flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-brand-600" />
                <span>{lang === 'ID' ? 'Sanggahan Pendidikan' : 'Educational Disclaimer'}</span>
              </h4>
              <p>
                {lang === 'ID' 
                  ? 'Seluruh konten, modul pembelajaran mikro (SkillPill), serta fitur simulasi AI Coach yang disediakan dalam aplikasi ini ditujukan murni untuk keperluan edukasi dan pengembangan profesional diri. Materi ini tidak menggantikan saran medis, hukum, atau finansial profesional.'
                  : 'All contents, micro learning modules (SkillPill), and AI Coach simulation features provided in this application are strictly for educational and professional self-improvement purposes. They do not constitute official medical, legal, or financial advice.'}
              </p>
              <p>
                {lang === 'ID'
                  ? 'Pengguna bertanggung jawab penuh atas penerapan metode yang dipelajari dalam konteks kehidupan nyata masing-masing.'
                  : 'Users bear full responsibility for applying the methods learned within their own real-world contexts.'}
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-stone-900 dark:text-white font-heading text-sm flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-brand-500" />
                <span>{lang === 'ID' ? 'Syarat dan Ketentuan Layanan' : 'Terms of Service'}</span>
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {lang === 'ID'
                    ? 'Pengguna memiliki hak akses penuh seumur hidup atas setiap unit SkillPill yang berhasil dibeli.'
                    : 'Users are granted full lifetime access to each successfully purchased SkillPill module.'}
                </li>
                <li>
                  {lang === 'ID'
                    ? 'Pengguna dilarang mendistribusikan ulang, menjual kembali, atau menyalin ulang materi berhak cipta tanpa izin tertulis dari Contech.id.'
                    : 'Redistribution, reselling, or unauthorized reproduction of copyrighted materials without written permission from Contech.id is strictly prohibited.'}
                </li>
                <li>
                  {lang === 'ID'
                    ? 'Seluruh data pengguna disimpan secara aman dan dapat dikelola atau dihapus melalui fitur pengaturan aplikasi.'
                    : 'All user data is stored securely and can be managed or wiped via the application settings panel.'}
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-stone-900 dark:text-white font-heading text-sm flex items-center space-x-2">
                <Lock className="h-4 w-4 text-brand-500" />
                <span>{lang === 'ID' ? 'Kebijakan Privasi & Keamanan Data' : 'Privacy & Data Protection Policy'}</span>
              </h4>
              <p>
                {lang === 'ID'
                  ? 'Kami di SkillPill dan Contech.id sangat menghormati privasi Anda. Kami menjamin data pribadi seperti nama, email, dan histori pembelajaran Anda tidak akan dijual ke pihak ketiga mana pun.'
                  : 'At SkillPill and Contech.id, we hold your privacy in the highest regard. We guarantee that your personal data including name, email, and learning progress will never be sold to third parties.'}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {lang === 'ID'
                    ? 'Data akun digunakan secara eksklusif untuk otentikasi dan menyimpan progres belajar.'
                    : 'Account data is used exclusively for authentication and saving progress.'}
                </li>
                <li>
                  {lang === 'ID'
                    ? 'Anda dapat mengunduh backup data (JSON) atau menghapus seluruh catatan lokal kapan pun melalui Pengaturan.'
                    : 'You can download a backup (JSON) or reset local state at any time via Settings.'}
                </li>
              </ul>
            </div>
          )}

          <div className="border-t border-stone-200 dark:border-stone-800 pt-4 text-[11px] text-stone-400">
            {lang === 'ID' ? 'Dibuat dan dikembangkan oleh Contech.id (contech.id)' : 'Developed & Powered by Contech.id (contech.id)'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            {lang === 'ID' ? 'Saya Mengerti & Setuju' : 'I Understand & Agree'}
          </button>
        </div>
      </div>
    </div>
  );
}
