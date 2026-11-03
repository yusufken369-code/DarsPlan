import React, { useState } from 'react';
import { ChevronDown, GraduationCap, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getLessonsForDate } from '../utils/dateUtils';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { lessons } = useData();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Aziza');

  const firstName = fullName.trim().split(' ')[0] || 'Aziza';
  const avatarLetter = (firstName[0] || 'A').toUpperCase();
  const roleTitle =
    user?.user_metadata?.account_type === 'other' ? 'Foydalanuvchi' : "O'qituvchi";

  // Calculate today's lessons based on real calendar date and recurring schedule
  const todayLessons = getLessonsForDate(lessons, new Date());

  // Compute total duration of today's lessons
  let totalMinutes = 0;
  todayLessons.forEach(l => {
    const s = l.start_time || l.start || '08:00';
    const e = l.end_time || l.end || '09:00';
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    const dur = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
    if (dur > 0) totalMinutes += dur;
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeFormatted = mins > 0 ? `${hours}:${mins < 10 ? '0' : ''}${mins}` : `${hours}:00`;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header
      className="flex items-center justify-between px-3 sm:px-6 h-[60px] flex-shrink-0 relative select-none w-full z-30 shadow-sm"
      style={{ background: '#ef5b5b' }}
    >
      {/* Left side: Logo + Greeting */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 mr-2">
        {/* Logo area on desktop */}
        <div className="hidden md:flex items-center justify-center w-[46px] flex-shrink-0">
          <GraduationCap size={26} className="text-white" />
        </div>

        {/* User Avatar */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white/60 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs sm:text-sm shadow-sm"
          style={{ background: 'rgba(255,255,255,0.25)' }}
        >
          {avatarLetter}
        </div>

        {/* Greeting text */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="text-white font-extrabold text-xs sm:text-base leading-tight truncate">
            Salom, {firstName}!
          </div>
          <div className="text-white/85 text-[10px] sm:text-xs leading-tight truncate mt-0.5">
            {todayLessons.length > 0 ? (
              <>Bugun <strong className="text-white font-bold">{timeFormatted} soat</strong> dars</>
            ) : (
              "Bugun darslar yo'q"
            )}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center flex-shrink-0">
        {/* Quick theme toggle button in header */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/15 transition-all mr-2"
          title={isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Profile dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full border border-white/50 flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {avatarLetter}
            </div>
            <ChevronDown size={14} className="text-white/80 hidden sm:block" />
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 top-10 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl py-2 w-56 z-50 animate-in fade-in zoom-in-95 duration-100 border border-gray-100 dark:border-slate-700/80">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700/70">
                  <p className="font-bold text-[#283593] dark:text-white text-sm truncate">{fullName}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400 truncate">{user?.email || roleTitle}</p>
                </div>

                <div className="py-1">
                  {['Profil', 'Sozlamalar'].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setOpen(false);
                        navigate('/sozlamalar');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Dark / Light Mode Switcher inside dropdown */}
                <div className="px-4 py-2.5 flex items-center justify-between border-t border-gray-100 dark:border-slate-700/70 bg-gray-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#455a7a] dark:text-slate-200">
                    {isDark ? (
                      <Moon size={14} className="text-indigo-400" />
                    ) : (
                      <Sun size={14} className="text-amber-500" />
                    )}
                    <span>{isDark ? 'Tungi rejim' : 'Kunduzgi rejim'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                      isDark ? 'bg-[#3949ab]' : 'bg-gray-300'
                    }`}
                    title={isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform flex items-center justify-center text-[10px] ${
                        isDark ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {isDark ? '🌙' : '☀️'}
                    </span>
                  </button>
                </div>

                <div className="pt-1 border-t border-gray-100 dark:border-slate-700/70">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-between transition-colors"
                  >
                    <span>Chiqish</span>
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
