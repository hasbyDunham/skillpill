/**
 * AuthModal Component (Login & Register)
 * Standardized fields:
 * - Register: Nama, Email, No. HP, Password
 * - Login: Email, Password
 */

import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLoginSuccess: (userData: { name: string; email: string; phone?: string }) => void;
}

export default function AuthModal({ isOpen, onClose, lang, onLoginSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError(lang === 'ID' ? 'Email dan kata sandi wajib diisi.' : 'Email and Password are required.');
      return;
    }

    if (isRegister && (!name || !phone)) {
      setError(lang === 'ID' ? 'Nama dan No. HP wajib diisi saat pendaftaran.' : 'Name and Phone number are required for registration.');
      return;
    }

    // Simulate auth success
    const finalName = isRegister ? name : (email.split('@')[0] || 'Learner');
    onLoginSuccess({ name: finalName, email, phone });
    setSuccessMsg(isRegister ? (lang === 'ID' ? 'Pendaftaran berhasil! Selamat datang.' : 'Registration successful! Welcome.') : (lang === 'ID' ? 'Login berhasil!' : 'Login successful!'));
    
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#f8fbff] dark:bg-stone-900 dark:text-white w-full max-w-md max-h-[92dvh] rounded-t-2xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 flex justify-between items-center border-b border-stone-800">
          <div>
            <h3 className="font-bold text-lg font-heading">
              {isRegister ? (lang === 'ID' ? 'Daftar Akun Baru' : 'Create New Account') : (lang === 'ID' ? 'Masuk ke Akun' : 'Account Login')}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">{lang === 'ID' ? 'Perdagangan Micro Skill SkillPill' : 'SkillPill Micro Skill Commerce'}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                {lang === 'ID' ? 'Nama Lengkap' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ID' ? 'contoh: Budi Santoso' : 'e.g. John Doe'}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@gmail.com"
                className="w-full pl-9 pr-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                {lang === 'ID' ? 'No. HP / WhatsApp' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={lang === 'ID' ? 'contoh: 081234567890' : 'e.g. 081234567890'}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow shadow-brand-500/10 mt-2"
          >
            {isRegister ? (lang === 'ID' ? 'Daftar Sekarang' : 'Register Account') : (lang === 'ID' ? 'Masuk' : 'Log In')}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccessMsg(''); }}
              className="text-xs text-stone-600 dark:text-stone-400 hover:text-brand-500 font-semibold"
            >
              {isRegister 
                ? (lang === 'ID' ? 'Sudah punya akun? Masuk di sini' : 'Already have an account? Log in')
                : (lang === 'ID' ? 'Belum punya akun? Daftar gratis di sini' : "Don't have an account? Register here")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
