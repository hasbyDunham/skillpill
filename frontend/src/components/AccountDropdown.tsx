import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';
import { Language } from '../lib/translations';

interface AccountDropdownProps {
  profile: UserProfile;
  lang: Language;
  darkMode: boolean;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function AccountDropdown({
  profile,
  lang,
  darkMode,
  onOpenProfile,
  onOpenSettings,
  onLogout
}: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const avatar = (profile as any)?.avatarUrl || (profile as any)?.photoUrl;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Account Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-2 cursor-pointer select-none ${
          darkMode 
            ? 'border-stone-800 bg-stone-900 text-stone-200 hover:bg-stone-800 hover:border-brand-500/40' 
            : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-100 hover:border-brand-500/40 shadow-sm'
        }`}
      >
        {avatar ? (
          <img src={avatar} alt={profile.name} className="h-6 w-6 rounded-lg object-cover border border-brand-500/50" />
        ) : (
          <div className="h-6 w-6 rounded-lg bg-brand-500/10 text-brand-500 font-extrabold flex items-center justify-center text-xs">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:inline max-w-[140px] truncate">{profile.name}</span>
        <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            darkMode 
              ? 'bg-stone-900 border-stone-800 text-stone-200' 
              : 'bg-white border-stone-200 text-stone-800 shadow-brand-500/5'
          }`}
        >
          {/* User Info Header inside Dropdown */}
          <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800/80 flex items-center space-x-3">
            {avatar ? (
              <img src={avatar} alt={profile.name} className="h-9 w-9 rounded-xl object-cover border border-brand-500/50 flex-shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-500 font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-stone-900 dark:text-white">{profile.name}</p>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">{profile.email}</p>
            </div>
          </div>

          {/* Menu Options */}
          <div className="py-1">
            {/* 1. Profile */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-brand-500/10 hover:text-brand-500 dark:hover:bg-stone-800 transition-colors flex items-center space-x-2.5 cursor-pointer"
            >
              <User className="h-4 w-4 text-brand-500" />
              <span>{lang === 'ID' ? 'Profil Saya' : 'My Profile'}</span>
            </button>

            {/* 2. Settings */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-brand-500/10 hover:text-brand-500 dark:hover:bg-stone-800 transition-colors flex items-center space-x-2.5 cursor-pointer"
            >
              <Settings className="h-4 w-4 text-brand-500" />
              <span>{lang === 'ID' ? 'Pengaturan' : 'Settings'}</span>
            </button>
          </div>

          <div className="border-t border-stone-100 dark:border-stone-800/80 my-1"></div>

          {/* 3. Logout */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center space-x-2.5 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            <span>{lang === 'ID' ? 'Keluar (Logout)' : 'Logout'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
