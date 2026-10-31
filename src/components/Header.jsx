import React, { useState } from 'react';
import { ChevronDown, GraduationCap, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getLessonsForDate } from '../utils/dateUtils';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { lessons } = useData();
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
      className="flex items-center justify-between px-3 sm:px-6 h-[60px] flex-shrink-0 relative select-none w-full"
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
            <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl py-1.5 w-52 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="font-semibold text-[#283593] text-sm truncate">{fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || roleTitle}</p>
              </div>
              {['Profil', 'Sozlamalar'].map((item) => (
                <button
                  key={item}
                  onClick={() => setOpen(false)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {item}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center justify-between"
              >
                <span>Chiqish</span>
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
