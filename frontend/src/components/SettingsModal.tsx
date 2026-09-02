/**
 * SettingsModal Component (Reset, Backup, Restore)
 * Standardized features:
 * - Backup: auto download JSON file WITH confirmation popup
 * - Restore: direct restore to 20 default skills WITHOUT selecting JSON file WITH confirmation popup
 * - Reset: wipes all skill/order/progress data to 0 WITHOUT deleting profile WITH confirmation popup
 */

import React, { useState } from 'react';
import { X, RefreshCw, Download, RotateCcw, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Language } from '../lib/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onResetData: () => void;
  onBackupData: () => void;
  onRestoreData: () => void;
}

export default function SettingsModal({
  isOpen, onClose, lang, onResetData, onBackupData, onRestoreData
}: SettingsModalProps) {
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Confirmation modal state
  const [confirmType, setConfirmType] = useState<'reset' | 'backup' | 'restore' | null>(null);

  if (!isOpen) return null;

  const handleConfirmAction = () => {
    if (confirmType === 'reset') {
      onResetData();
      setStatusMsg(lang === 'ID' 
        ? 'Semua data telah di-reset menjadi 0. Data profil Anda tetap tersimpan aman.' 
        : 'All data has been reset to 0. Your profile data remains intact.'
      );
    } else if (confirmType === 'backup') {
      onBackupData();
      setStatusMsg(lang === 'ID' 
        ? 'File backup JSON berhasil diunduh secara otomatis!' 
        : 'JSON backup file downloaded successfully!'
      );
    } else if (confirmType === 'restore') {
      onRestoreData();
      setStatusMsg(lang === 'ID' 
        ? 'Data berhasil dipulihkan ke 10 SkillPill bawaan!' 
        : 'Data restored successfully to 10 default SkillPills!'
      );
    }
    setConfirmType(null);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#f8fbff] dark:bg-stone-900 dark:text-white w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-y-auto sm:my-8">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 flex justify-between items-center border-b border-stone-800">
          <div>
            <h3 className="font-bold text-lg font-heading flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-brand-500" />
              <span>{lang === 'ID' ? 'Pengaturan Sistem & Data' : 'System & Data Settings'}</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">{lang === 'ID' ? 'Pencadangan, Pemulihan & Atur Ulang Data' : 'Backup, Restore & Reset Data'}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {statusMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold">{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* 1. Backup Option */}
          <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                <Download className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold font-heading">{lang === 'ID' ? 'Pencadangan Data (JSON)' : 'Data Backup (JSON)'}</h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {lang === 'ID' ? 'Unduh otomatis salinan seluruh data profil & materi ke file JSON.' : 'Auto download JSON snapshot of all profile & skill data.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmType('backup')}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{lang === 'ID' ? 'Unduh Cadangan JSON' : 'Download Backup JSON'}</span>
            </button>
          </div>

          {/* 2. Restore Option */}
          <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold font-heading">{lang === 'ID' ? 'Pemulihan Data Skill' : 'Restore Skill Data'}</h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {lang === 'ID' ? 'Mengembalikan katalog materi ke 10 SkillPill bawaan.' : 'Restore the catalog to the 10 default SkillPills.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmType('restore')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{lang === 'ID' ? 'Pulihkan 10 Skill Bawaan' : 'Restore 10 Default Skills'}</span>
            </button>
          </div>

          {/* 3. Reset Option */}
          <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/60 space-y-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold font-heading text-red-700 dark:text-red-400">{lang === 'ID' ? 'Atur Ulang Semua Data' : 'Reset All Data'}</h4>
                <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-0.5">
                  {lang === 'ID' ? 'Kosongkan semua data skill, pesanan, dan progres. Data profil tetap aman.' : 'Clear all skill, order, and progress data. Profile data remains intact.' }
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmType('reset')}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{lang === 'ID' ? 'Atur Ulang Semua Data' : 'Reset All Data'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {confirmType && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-3xl max-w-sm w-full p-6 space-y-5 border border-stone-200 dark:border-stone-800 shadow-2xl text-center">
            
            <div className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center ${
              confirmType === 'reset' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
              confirmType === 'restore' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
              'bg-brand-100 text-brand-600 dark:bg-brand-900/30'
            }`}>
              {confirmType === 'reset' && <AlertTriangle className="h-7 w-7" />}
              {confirmType === 'restore' && <RotateCcw className="h-7 w-7" />}
              {confirmType === 'backup' && <Download className="h-7 w-7" />}
            </div>

            <div>
              <h4 className="font-bold text-base font-heading">
                {confirmType === 'reset' && (lang === 'ID' ? 'Konfirmasi Atur Ulang Data' : 'Confirm Reset All Data')}
                {confirmType === 'restore' && (lang === 'ID' ? 'Konfirmasi Pemulihan Data Skill' : 'Confirm Restore Skill Data')}
                {confirmType === 'backup' && (lang === 'ID' ? 'Konfirmasi Unduh Cadangan Data' : 'Confirm Download Backup')}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                {confirmType === 'reset' && (
                  lang === 'ID' 
                    ? 'Apakah Anda yakin ingin mereset SEMUA data? Seluruh data skill, pesanan, dan progres belajar akan menjadi 0. Data profil Anda tidak akan terhapus.' 
                    : 'Are you sure you want to reset ALL data? Skill, order, and progress data will become 0. Your profile data will not be deleted.'
                )}
                {confirmType === 'restore' && (
                  lang === 'ID' 
                    ? 'Apakah Anda yakin ingin memulihkan katalog ke 10 SkillPill bawaan?' 
                    : 'Are you sure you want to restore the catalog to the 10 default SkillPills?'
                )}
                {confirmType === 'backup' && (
                  lang === 'ID' 
                    ? 'Apakah Anda yakin ingin mengunduh berkas cadangan data dalam format JSON sekarang?' 
                    : 'Are you sure you want to download the application backup JSON file now?'
                )}
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmType(null)}
                className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                {lang === 'ID' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition-all cursor-pointer text-white shadow-md ${
                  confirmType === 'reset' ? 'bg-red-600 hover:bg-red-700' :
                  confirmType === 'restore' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-brand-500 hover:bg-brand-600 text-white'
                }`}
              >
                {confirmType === 'reset' ? (lang === 'ID' ? 'Ya, Atur Ulang' : 'Yes, Reset') :
                 confirmType === 'restore' ? (lang === 'ID' ? 'Ya, Pulihkan' : 'Yes, Restore') :
                 (lang === 'ID' ? 'Ya, Unduh' : 'Yes, Download')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
