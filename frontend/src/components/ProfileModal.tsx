/**
 * ProfileModal Component
 * Fitur lengkap:
 * - Ganti foto profil (Upload file)
 * - Ganti nama
 * - Menampilkan email akun (readonly)
 * - Ganti password (terhubung ke API: POST /api/profile/change-password)
 */

import React, { useEffect, useState } from 'react';
import { X, User, Mail, Lock, KeyRound, Eye, EyeOff, Camera, CheckCircle2, AlertCircle, AlertTriangle, Upload, Loader2 } from 'lucide-react';
import { Language } from '../lib/translations';
import { UserProfile } from '../types';
import { apiFetch } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export default function ProfileModal({ isOpen, onClose, lang, profile, onUpdateProfile }: ProfileModalProps) {
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatarUrl || (profile as any)?.photoUrl || defaultAvatar
  );

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setName(profile?.name || '');
    setAvatarUrl(profile?.avatarUrl || (profile as any)?.photoUrl || defaultAvatar);
    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // Handle Foto Upload File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(lang === 'ID' ? 'Berkas harus berupa gambar (JPG, PNG, WEBP).' : 'File must be an image (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrorMsg(lang === 'ID' ? 'Ukuran foto maksimal 1 MB.' : 'Profile photo must be 1 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        setErrorMsg('');
        setSuccessMsg(lang === 'ID' ? 'Foto profil berhasil diunggah!' : 'Profile photo uploaded!');
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(lang === 'ID' ? 'Nama lengkap wajib diisi.' : 'Full name is required.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatarUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || (lang === 'ID' ? 'Gagal memperbarui profil.' : 'Failed to update profile.'));
      }

      onUpdateProfile(data.profile);
      setSuccessMsg(lang === 'ID' ? 'Profil berhasil diperbarui!' : 'Profile updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'ID' ? 'Terjadi kesalahan sistem.' : 'A system error occurred.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle password change via API
  const handleChangePassword = async () => {
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg(lang === 'ID' ? 'Password lama wajib diisi.' : 'Current password is required.');
      return;
    }
    if (!newPassword) {
      setPasswordErrorMsg(lang === 'ID' ? 'Password baru wajib diisi.' : 'New password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordErrorMsg(lang === 'ID' ? 'Password baru minimal 8 karakter.' : 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg(lang === 'ID' ? 'Konfirmasi password tidak cocok dengan password baru.' : 'Password confirmation does not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await apiFetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      setPasswordSuccessMsg(data.message || (lang === 'ID' ? 'Password berhasil diubah!' : 'Password changed successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordErrorMsg(err.message || (lang === 'ID' ? 'Terjadi kesalahan sistem.' : 'A system error occurred.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#f8fbff] dark:bg-stone-900 dark:text-white w-full max-w-lg max-h-[92dvh] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-y-auto sm:my-8">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 flex justify-between items-center border-b border-stone-800">
          <div>
            <h3 className="font-bold text-lg font-heading flex items-center space-x-2">
              <User className="h-5 w-5 text-brand-500" />
              <span>{lang === 'ID' ? 'Pengaturan Profil Pengguna' : 'User Profile Settings'}</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">{lang === 'ID' ? 'Akun Pembelajar SkillPill' : 'SkillPill Learner Account'}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Ganti Foto (FILE UPLOAD ONLY) */}
          <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-3">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {lang === 'ID' ? 'Ganti Foto Profil (Unggah Berkas Gambar)' : 'Change Profile Photo (Upload File)'}
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group flex-shrink-0">
                <img 
                  src={avatarUrl} 
                  alt="Profile Avatar" 
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500 shadow-md"
                />
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold text-xs rounded-xl cursor-pointer transition-all">
                  <Upload className="h-4 w-4" />
                  <span>{lang === 'ID' ? 'Unggah Berkas Foto Baru' : 'Upload New Photo File'}</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                </label>
                <p className="text-[10px] text-stone-400 text-center sm:text-left">
                  Format yang didukung: JPG, PNG, WEBP.
                </p>
              </div>
            </div>
          </div>

          {/* Ganti Nama */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              {lang === 'ID' ? 'Ganti Nama Lengkap' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Email akun */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              {lang === 'ID' ? 'Email Akun' : 'Account Email'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input 
                type="email"
                value={profile?.email || ''}
                readOnly
                aria-readonly="true"
                className="w-full pl-10 pr-3.5 py-2.5 border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900/70 rounded-xl text-xs font-semibold text-stone-500 dark:text-stone-400 cursor-not-allowed focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
              {lang === 'ID' ? 'Email digunakan sebagai identitas dan login akun, sehingga tidak dapat diubah.' : 'Email is used as your account identity and login, so it cannot be changed.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            {isSavingProfile ? (lang === 'ID' ? 'Menyimpan...' : 'Saving...') : (lang === 'ID' ? 'Simpan Perubahan Profil' : 'Save Profile Changes')}
          </button>
        </form>

        {/* Ganti Password Section (terpisah, terhubung ke API) */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-700 pb-3">
              <KeyRound className="h-4 w-4 text-brand-500" />
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {lang === 'ID' ? 'Ganti Password' : 'Change Password'}
              </label>
            </div>

            {passwordSuccessMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{passwordErrorMsg}</span>
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
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
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
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
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
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
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

            {/* Tombol Ganti Password */}
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full py-2.5 bg-stone-900 dark:bg-brand-500 hover:bg-stone-800 dark:hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{lang === 'ID' ? 'Menyimpan...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>{lang === 'ID' ? 'Ganti Password' : 'Update Password'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
