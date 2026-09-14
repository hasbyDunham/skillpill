/**
 * SettingsModal Component (Khusus Ganti Password)
 * Form untuk mengubah password akun penggunna:
 * - Password Lama
 * - Password Baru
 * - Konfirmasi Password Baru
 * Terhubung ke backend Laravel API: POST /api/profile/change-password
 */

import React, { useState } from 'react';
import { X, Lock, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Language } from '../lib/translations';
import { apiFetch } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onResetData?: () => void;
  onBackupData?: () => void;
  onRestoreData?: () => void;
}

export default function SettingsModal({
  isOpen, onClose, lang
}: SettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMsg('');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    // Front-end validations
    if (!currentPassword) {
      setErrorMsg(lang === 'ID' ? 'Password lama wajib diisi.' : 'Current password is required.');
      return;
    }

    if (!newPassword) {
      setErrorMsg(lang === 'ID' ? 'Password baru wajib diisi.' : 'New password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg(lang === 'ID' ? 'Password baru minimal 8 karakter.' : 'New password must be at least 8 characters.');
      return;
    }

    if (!confirmPassword) {
      setErrorMsg(lang === 'ID' ? 'Konfirmasi password baru wajib diisi.' : 'Confirm new password is required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(lang === 'ID' ? 'Konfirmasi password tidak cocok dengan password baru.' : 'Password confirmation does not match new password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || (lang === 'ID' ? 'Gagal mengubah password.' : 'Failed to change password.'));
      }

      setStatusMsg(data.message || (lang === 'ID' ? 'Password berhasil diubah!' : 'Password changed successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'ID' ? 'Terjadi kesalahan sistem.' : 'A system error occurred.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#f8fbff] dark:bg-stone-900 dark:text-white w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-y-auto sm:my-8">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 flex justify-between items-center border-b border-stone-800">
          <div>
            <h3 className="font-bold text-lg font-heading flex items-center space-x-2">
              <KeyRound className="h-5 w-5 text-brand-500" />
              <span>{lang === 'ID' ? 'Pengaturan - Ganti Password' : 'Settings - Change Password'}</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {lang === 'ID' ? 'Perbarui kata sandi akun Anda demi keamanan' : 'Update your account password for security'}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {statusMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Password Lama */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              {lang === 'ID' ? 'Password Lama' : 'Current Password'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={lang === 'ID' ? 'Masukkan password saat ini' : 'Enter current password'}
                className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              {lang === 'ID' ? 'Password Baru' : 'New Password'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={lang === 'ID' ? 'Minimal 8 karakter' : 'At least 8 characters'}
                className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password Baru */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              {lang === 'ID' ? 'Konfirmasi Password Baru' : 'Confirm New Password'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={lang === 'ID' ? 'Ulangi password baru Anda' : 'Repeat your new password'}
                className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              {lang === 'ID' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{lang === 'ID' ? 'Menyimpan...' : 'Saving...'}</span>
                </>
              ) : (
                <span>{lang === 'ID' ? 'Ganti Password' : 'Update Password'}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
