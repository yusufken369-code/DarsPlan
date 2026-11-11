import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Calendar,
  BookOpen,
  Users,
  Folder,
  ClipboardCheck,
  Settings,
} from 'lucide-react';

const NAV = [
  { to: '/',            icon: Home,           label: 'Bosh sahifa',       end: true },
  { to: '/jadval',      icon: Calendar,       label: 'Dars jadvali' },
  { to: '/rejalar',     icon: BookOpen,       label: 'Dars rejalari' },
  { to: '/sinflar',     icon: Users,          label: 'Sinflar' },
  { to: '/materiallar', icon: Folder,         label: "O'quv materiallari" },
  { to: '/vazifalar',   icon: ClipboardCheck, label: 'Vazifalar' },
];

const BOTTOM_NAV = [
  { to: '/sozlamalar', icon: Settings, label: 'Sozlamalar' },
];

function SideIcon({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-150 cursor-pointer ` +
        (isActive
          ? 'bg-[#fde8e8] text-[#ef5b5b] dark:bg-[#ef5b5b]/20 dark:text-[#ef5b5b]'
          : 'text-[#b0bec5] dark:text-slate-400 hover:bg-[#f0f4ff] dark:hover:bg-slate-800/80 hover:text-[#3949ab] dark:hover:text-indigo-400')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
          {/* Tooltip */}
          <span
            className="pointer-events-none absolute left-[calc(100%+8px)] z-50
              px-2.5 py-1 bg-[#283593] dark:bg-slate-800 text-white text-[11px] font-medium rounded-lg
              whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md border border-transparent dark:border-slate-700"
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <>
      {/* ── Desktop Sidebar (md+) ── */}
      <aside
        className="hidden md:flex flex-col items-center w-[66px] flex-shrink-0 h-full py-4 gap-1 select-none overflow-hidden bg-white dark:bg-[#151f32] border-r border-[#f0f3fa] dark:border-slate-800/80 transition-colors duration-200"
      >
        {/* Nav items */}
        <nav className="flex flex-col items-center gap-1.5 flex-1 mt-2">
          {NAV.map(item => (
            <SideIcon key={item.to} {...item} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-1.5">
          {BOTTOM_NAV.map(item => (
            <SideIcon key={item.to} {...item} />
          ))}
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar (< md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#151f32] border-t border-gray-200/90 dark:border-slate-800 px-1.5 py-1 flex items-center justify-around shadow-2xl select-none transition-colors duration-200">
        {[...NAV, ...BOTTOM_NAV].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ` +
              (isActive
                ? 'text-[#ef5b5b] font-bold bg-[#fde8e8]/60 dark:bg-[#ef5b5b]/20'
                : 'text-[#90a4ae] dark:text-slate-400 hover:text-[#3949ab] dark:hover:text-indigo-400')
            }
          >
            <item.icon size={19} strokeWidth={2} />
            <span className="text-[9px] mt-0.5 leading-none">
              {item.label === 'Bosh sahifa' ? 'Bosh' :
               item.label === 'Dars jadvali' ? 'Jadval' :
               item.label === 'Dars rejalari' ? 'Rejalar' :
               item.label === 'Sinflar' ? 'Sinflar' :
               item.label === "O'quv materiallari" ? 'Material' :
               item.label === 'Vazifalar' ? 'Vazifa' : 'Sozlama'}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
