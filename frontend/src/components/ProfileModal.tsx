/**
 * ProfileModal Component
 * Standardized features:
 * - Ganti nama
 * - Ganti foto (Upload file, bukan link URL)
 * - Ganti email
 * - Ganti password (3 input: Password Lama, Password Baru, Konfirmasi Password Baru)
 */

import React, { useState } from 'react';
import { X, User, Mail, Lock, Camera, CheckCircle2, AlertCircle, Upload, ShieldCheck } from 'lucide-react';
import { Language } from '../lib/translations';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile> & { password?: string }) => void;
}

export default function ProfileModal({ isOpen, onClose, lang, profile, onUpdateProfile }: ProfileModalProps) {
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(
    (profile as any)?.avatarUrl || (profile as any)?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
  );
  
  // 3 Kolom Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle Foto Upload File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(lang === 'ID' ? 'Berkas harus berupa gambar (JPG, PNG, WEBP).' : 'File must be an image (JPG, PNG, WEBP).');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Pre-validation for password change
    let updatedPasswordValue: string | undefined = undefined;

    if (oldPassword || newPassword || confirmPassword) {
      const actualCurrentPassword = (profile as any)?.password || 'password123';
      
      // Validation 1: Check if old password matches actual password
      if (oldPassword !== actualCurrentPassword) {
        setErrorMsg(
          lang === 'ID' 
            ? 'Password lama yang Anda masukkan tidak sesuai/salah. Harap masukkan password lama yang benar!' 
            : 'Incorrect old password. Please enter your correct current password!'
        );
        return;
      }

      // Validation 2: Check if new password is empty
      if (!newPassword.trim()) {
        setErrorMsg(
          lang === 'ID' 
            ? 'Password baru tidak boleh kosong.' 
            : 'New password cannot be empty.'
        );
        return;
      }

      // Validation 3: Check if new password and confirmation match
      if (newPassword !== confirmPassword) {
        setErrorMsg(
          lang === 'ID' 
            ? 'Password baru dan konfirmasi password baru tidak cocok!' 
            : 'New password and confirm password do not match!'
        );
        return;
      }

      updatedPasswordValue = newPassword;
    }

    // Prepare profile payload
    const payload: Partial<UserProfile> & { avatarUrl?: string; photoUrl?: string; password?: string } = {
      name,
      email,
      avatarUrl,
      photoUrl: avatarUrl
    };

    if (updatedPasswordValue) {
      payload.password = updatedPasswordValue;
    }

    onUpdateProfile(payload);

    setSuccessMsg(lang === 'ID' ? 'Profil dan data berhasil diperbarui!' : 'Profile updated successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      onClose();
      setSuccessMsg('');
    }, 1200);
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

          {/* Ganti Foto (FILE UPLOAD ONLY - TANPA LINK) */}
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

          {/* Ganti Email */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              {lang === 'ID' ? 'Ganti Alamat Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Ganti Password (3 Kolom Input Mandatori) */}
          <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700 pb-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {lang === 'ID' ? 'Ganti Kata Sandi (Isi Ketiga Kolom)' : 'Change Password (3 Fields Required)'}
              </label>
              <ShieldCheck className="h-4 w-4 text-brand-500" />
            </div>

            <div className="space-y-2.5">
              {/* Kolom 1: Password Lama */}
              <div>
                <span className="block text-[10px] font-bold text-stone-400 mb-1">
                  1. {lang === 'ID' ? 'Kata Sandi Lama' : 'Current Password'}
                </span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
                  <input 
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={lang === 'ID' ? 'Masukkan kata sandi lama...' : 'Enter current password...'}
                    className="w-full pl-10 pr-3.5 py-2 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kolom 2: Password Baru */}
              <div>
                <span className="block text-[10px] font-bold text-stone-400 mb-1">
                  2. {lang === 'ID' ? 'Kata Sandi Baru' : 'New Password'}
                </span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={lang === 'ID' ? 'Masukkan kata sandi baru...' : 'Enter new password...'}
                    className="w-full pl-10 pr-3.5 py-2 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kolom 3: Konfirmasi Password Baru */}
              <div>
                <span className="block text-[10px] font-bold text-stone-400 mb-1">
                  3. {lang === 'ID' ? 'Konfirmasi Kata Sandi Baru' : 'Confirm New Password'}
                </span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={lang === 'ID' ? 'Ulangi kata sandi baru...' : 'Re-enter new password...'}
                    className="w-full pl-10 pr-3.5 py-2 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            {lang === 'ID' ? 'Simpan Perubahan Profil' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
