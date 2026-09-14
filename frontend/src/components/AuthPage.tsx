import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, Globe, Sun, Moon, 
  CheckCircle2, AlertCircle, Sparkles, Star, Award, Zap, BookOpen, ShieldCheck
} from 'lucide-react';
import { Language } from '../lib/translations';
import { setCurrentUser } from '../lib/userStore';
import { UserProfile } from '../types';
import TermsDisclaimerModal from './TermsDisclaimerModal';
import { apiFetch, clearToken, setToken } from '../lib/api';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  lang: Language;
  onChangeLang: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onBack: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onOpenTerms?: () => void;
}

export default function AuthPage({
  initialMode = 'login',
  lang,
  onChangeLang,
  darkMode,
  onToggleDarkMode,
  onBack,
  onLoginSuccess,
  onOpenTerms
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Modal terms state inside AuthPage
  const [isModalTermsOpen, setIsModalTermsOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Alert State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOpenTermsClick = () => {
    setIsModalTermsOpen(true);
    if (onOpenTerms) {
      onOpenTerms();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!acceptedTerms) {
      setError(
        lang === 'ID'
          ? 'Anda wajib menyetujui Disclaimer serta Syarat & Ketentuan sebelum melanjutkan.'
          : 'You must agree to the Disclaimer and Terms & Conditions before proceeding.'
      );
      return;
    }

    try {
      const emailValue = email.trim().toLowerCase();
      if (mode === 'register' && password.length < 8) {
        setError(lang === 'ID' ? 'Kata sandi minimal 8 karakter.' : 'Password must be at least 8 characters.');
        return;
      }
      if (mode === 'register' && password !== confirmPassword) {
        setError(lang === 'ID' ? 'Konfirmasi kata sandi tidak cocok.' : 'Password confirmation does not match.');
        return;
      }
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(mode === 'register'
          ? { name: name.trim(), email: emailValue, password, phone: phone.trim() }
          : { email: emailValue, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        const firstError = body?.errors ? Object.values(body.errors)[0]?.[0] : null;
        setError(firstError || body?.error || (lang === 'ID' ? 'Autentikasi gagal.' : 'Authentication failed.'));
        return;
      }
      if (body.user?.role === 'admin') {
        clearToken();
        setError(lang === 'ID' ? 'Akun admin hanya dapat masuk melalui Dashboard Admin.' : 'Admin accounts must sign in through the Admin Dashboard.');
        return;
      }
      setToken(body.token);
      setCurrentUser(body.user);
      setSuccess(lang === 'ID' ? 'Login berhasil. Menghubungkan akun ke SkillPill…' : 'Login successful. Connecting your SkillPill account…');
      setTimeout(() => onLoginSuccess(body.user), 500);
      return;
    } catch {
      setError(lang === 'ID' ? 'Layanan belum dapat dihubungi. Silakan coba lagi.' : 'The service is unavailable. Please try again.');
      return;
    }

  };

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col justify-between transition-colors duration-200 ${
      darkMode ? 'bg-stone-950 text-stone-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* TOP HEADER BAR */}
      <header className={`min-h-16 flex-shrink-0 px-2.5 py-2 sm:px-8 sm:py-0 flex items-center justify-between gap-2 border-b z-20 ${
        darkMode ? 'bg-stone-900/90 border-stone-800 text-stone-100' : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            darkMode 
              ? 'border-stone-800 bg-stone-900 text-stone-300 hover:text-white hover:border-stone-700' 
              : 'border-slate-200 bg-white text-slate-700 hover:text-brand-600 hover:border-slate-300 shadow-sm'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{lang === 'ID' ? 'Kembali ke Landing Page' : 'Back to Landing Page'}</span>
          <span className="sm:hidden">{lang === 'ID' ? 'Kembali' : 'Back'}</span>
        </button>

        {/* Brand Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
          <img src="/logo.png" alt="SkillPill" className="h-8 w-8 object-contain" />
          <div className="hidden sm:block">
            <span className={`text-base sm:text-lg font-bold font-heading tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Skill<span className="text-brand-500 font-serif">Pill</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-stone-400 ml-2 uppercase tracking-widest font-semibold">
              Micro Commerce
            </span>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Language Toggle */}
          <button
            onClick={() => onChangeLang(lang === 'EN' ? 'ID' : 'EN')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
              darkMode 
                ? 'border-stone-800 bg-stone-900 text-stone-200 hover:bg-stone-800' 
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title={lang === 'ID' ? 'Ganti bahasa' : 'Switch language'}
          >
            <Globe className="h-3.5 w-3.5 text-brand-500" />
            <span>{lang}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl border text-xs flex items-center transition-colors cursor-pointer ${
              darkMode 
                ? 'border-stone-800 bg-stone-900 text-brand-400 hover:bg-stone-800' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
            }`}
            title={lang === 'ID' ? 'Ganti mode warna' : 'Toggle color mode'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT FRAME */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-3 py-4 sm:px-8 sm:py-8 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:items-center">
        
        {/* LEFT COLUMN: HERO VISUAL & VALUE PROPOSITIONS (5 COLS / 6 COLS) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-full p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-brand-600/20 border border-brand-500/20 shadow-xl">
          
          {/* Ambient Background Glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Badge */}
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-brand-500 text-white shadow-md shadow-brand-500/20 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === 'ID' ? 'Ekosistem Micro Skill' : 'Micro Skill Ecosystem'}</span>
            </span>

            <h1 className="text-3xl xl:text-4xl font-extrabold font-heading tracking-tight leading-tight text-slate-900 dark:text-white">
              {lang === 'ID' ? (
                <>Kuasai Keahlian <span className="text-brand-500 font-serif italic">Berpenghasilan Tinggi</span> dalam 30 Menit.</>
              ) : (
                <>Master <span className="text-brand-500 font-serif italic">High-Income</span> Skills in 30 Minutes.</>
              )}
            </h1>

            <p className="text-sm text-slate-600 dark:text-stone-300 font-light leading-relaxed">
              {lang === 'ID' 
                ? 'Akses materi pembelajaran terstruktur Blinkist-style yang membedah konsep rumit menjadi formula praktis tanpa membuang waktu puluhan jam.' 
                : 'Access structured Blinkist-style learning modules that condense complex ideas into actionable frameworks without wasting hours.'}
            </p>
          </div>

          {/* Middle Feature Cards */}
          <div className="relative z-10 grid grid-cols-2 gap-3 my-4">
            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white/90 border-slate-200'} shadow-sm flex items-start space-x-3`}>
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{lang === 'ID' ? 'Kuasai dalam 30 Menit' : '30-Min Mastery'}</h4>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 leading-tight mt-0.5">{lang === 'ID' ? 'Format modular tanpa teori bertele-tele' : 'Modular format without fluff'}</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-stone-900/80 border-stone-800' : 'bg-white/90 border-slate-200'} shadow-sm flex items-start space-x-3`}>
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{lang === 'ID' ? 'Akses Selamanya' : 'Lifetime Access'}</h4>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 leading-tight mt-0.5">{lang === 'ID' ? 'Sekali beli untuk dipakai seumur hidup' : 'Pay once, own forever'}</p>
              </div>
            </div>
          </div>

          {/* Learner Testimonial Badge */}
          <div className={`relative z-10 p-4 rounded-2xl border ${darkMode ? 'bg-stone-900/90 border-stone-800' : 'bg-white border-slate-200'} shadow-md flex items-center space-x-4`}>
            <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-brand-500" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-brand-500" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-brand-500" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="" />
            </div>
            <div>
              <div className="flex items-center space-x-1 text-brand-500 text-xs">
                <Star className="h-3.5 w-3.5 fill-brand-400" />
                <Star className="h-3.5 w-3.5 fill-brand-400" />
                <Star className="h-3.5 w-3.5 fill-brand-400" />
                <Star className="h-3.5 w-3.5 fill-brand-400" />
                <Star className="h-3.5 w-3.5 fill-brand-400" />
                <span className="text-slate-900 dark:text-white font-extrabold ml-1">5.0</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-stone-300 font-medium">
                {lang === 'ID' ? 'Dipercaya oleh 12,500+ profesional & learner' : 'Trusted by 12,500+ professionals & learners'}
              </p>
            </div>
          </div>

          {/* Footer branding */}
          <div className="relative z-10 pt-2 border-t border-brand-500/20 flex justify-between items-center text-[11px] text-slate-500 dark:text-stone-400">
            <span>{lang === 'ID' ? 'Platform Autentikasi SkillPill' : 'SkillPill Authentication Platform'}</span>
            <span>{lang === 'ID' ? 'Dibuat oleh' : 'Built by'} <a href="https://optibis.id" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-500 hover:underline">Optibis</a></span>
          </div>
        </div>

        {/* RIGHT COLUMN: MODERN AUTH FORM CARD (6 COLS) */}
        <div className="lg:col-span-6 w-full max-w-xl mx-auto flex flex-col justify-center">
          <div className={`p-4 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-2xl transition-all ${
            darkMode 
              ? 'bg-stone-900/95 border-stone-800 text-white shadow-stone-950/80' 
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/80'
          }`}>
            
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 dark:bg-stone-800 p-1 rounded-2xl mb-6 border border-slate-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'ID' ? 'Masuk (User)' : 'User Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'ID' ? 'Daftar (User)' : 'User Sign Up'}
              </button>
            </div>

            {/* Header Text */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                {mode === 'login' ? (
                  <span>{lang === 'ID' ? 'Selamat Datang Kembali' : 'Welcome Back'}</span>
                ) : (
                  <span>{lang === 'ID' ? 'Buat Akun SkillPill Baru' : 'Create New SkillPill Account'}</span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-stone-400 mt-1">
                {mode === 'login'
                  ? (lang === 'ID' ? 'Masukkan email dan password terdaftar Anda' : 'Enter your registered email and password')
                  : (lang === 'ID' ? 'Lengkapi data pendaftaran di bawah ini' : 'Fill in the details below to complete registration')}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-150">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* REGISTER FIELD 1: NAMA LENGKAP */}
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1">
                    {lang === 'ID' ? 'Nama Lengkap' : 'Full Name'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-stone-500" />
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'ID' ? 'contoh: Budi Santoso' : 'e.g. John Doe'}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-stone-700 bg-slate-50/50 dark:bg-stone-800/80 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* REGISTER FIELD 2: NO HP */}
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1">
                    {lang === 'ID' ? 'No. HP / WhatsApp' : 'Phone Number'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-stone-500" />
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={lang === 'ID' ? 'contoh: 081234567890' : 'e.g. 081234567890'}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-stone-700 bg-slate-50/50 dark:bg-stone-800/80 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL FIELD (LOGIN & REGISTER) */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-stone-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-stone-700 bg-slate-50/50 dark:bg-stone-800/80 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD WITH EYE TOGGLE */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1">
                  {lang === 'ID' ? 'Kata Sandi' : 'Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-stone-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-stone-700 bg-slate-50/50 dark:bg-stone-800/80 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 focus:outline-none"
                    title={showPassword ? (lang === 'ID' ? 'Sembunyikan kata sandi' : 'Hide password') : (lang === 'ID' ? 'Tampilkan kata sandi' : 'Show password')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* REGISTER FIELD 5: KONFIRMASI PASSWORD WITH EYE TOGGLE */}
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1">
                    {lang === 'ID' ? 'Konfirmasi Kata Sandi' : 'Confirm Password'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-stone-500" />
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-stone-700 bg-slate-50/50 dark:bg-stone-800/80 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 focus:outline-none"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* MANDATORY DISCLAIMER & TERMS CHECKBOX */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/50 flex items-start space-x-3 my-3">
                <input 
                  type="checkbox"
                  id="auth-terms-checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked && error.includes('Disclaimer')) {
                      setError('');
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-stone-700 text-brand-500 focus:ring-brand-500/30 cursor-pointer accent-brand-500"
                />
                <label htmlFor="auth-terms-checkbox" className="text-xs text-slate-700 dark:text-stone-300 leading-snug cursor-pointer select-none">
                  {lang === 'ID' ? (
                    <>
                      Saya menyetujui <button type="button" onClick={handleOpenTermsClick} className="text-brand-500 font-extrabold underline hover:text-brand-600 cursor-pointer">Sanggahan serta Syarat & Ketentuan</button> yang berlaku di SkillPill. <span className="text-red-500 font-bold">*</span>
                    </>
                  ) : (
                    <>
                      I agree to the <button type="button" onClick={handleOpenTermsClick} className="text-brand-500 font-extrabold underline hover:text-brand-600 cursor-pointer">Disclaimer and Terms & Conditions</button> of SkillPill. <span className="text-red-500 font-bold">*</span>
                    </>
                  )}
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={!acceptedTerms}
                className={`w-full py-3 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2 ${
                  acceptedTerms 
                    ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20 active:scale-[0.99] cursor-pointer' 
                    : 'bg-slate-200 dark:bg-stone-800 text-slate-400 dark:text-stone-600 shadow-none cursor-not-allowed opacity-70'
                }`}
              >
                <span>
                  {mode === 'login' 
                    ? (lang === 'ID' ? 'Masuk ke Akun User' : 'User Log In') 
                    : (lang === 'ID' ? 'Daftar Akun Baru' : 'Register Account')}
                </span>
              </button>

              {/* SWITCH MODE LINK */}
              <div className="text-center pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-xs text-slate-600 dark:text-stone-400 hover:text-brand-500 font-bold transition-colors cursor-pointer"
                >
                  {mode === 'login'
                    ? (lang === 'ID' ? 'Belum punya akun? Daftar gratis di sini' : "Don't have an account? Sign up free")
                    : (lang === 'ID' ? 'Sudah punya akun? Masuk di sini' : 'Already have an account? Log in')}
                </button>
              </div>

            </form>
          </div>
        </div>

      </main>

      {/* COMPACT FOOTER */}
      <footer className={`min-h-10 flex-shrink-0 px-4 py-2 text-center text-[10px] leading-relaxed flex items-center justify-center border-t ${
        darkMode ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <span>© {new Date().getFullYear()} SkillPill. {lang === 'ID' ? 'Dibuat oleh' : 'Built by'} <a href="https://optibis.id" target="_blank" rel="noopener noreferrer" className="text-brand-500 font-bold hover:underline">Optibis</a>. {lang === 'ID' ? 'Hak cipta dilindungi.' : 'All rights reserved.'}</span>
      </footer>

      {/* POPUP DISCLAIMER & TERMS MODAL */}
      <TermsDisclaimerModal
        isOpen={isModalTermsOpen}
        onClose={() => setIsModalTermsOpen(false)}
        lang={lang}
      />

    </div>
  );
}
