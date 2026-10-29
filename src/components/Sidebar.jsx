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
  LayoutGrid,
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
          ? 'bg-[#fde8e8] text-[#ef5b5b]'
          : 'text-[#b0bec5] hover:bg-[#f0f4ff] hover:text-[#3949ab]')
      }
    >
      <Icon size={19} strokeWidth={isActive => isActive ? 2.2 : 1.8} />
      {/* Tooltip */}
      <span
        className="pointer-events-none absolute left-[calc(100%+8px)] z-50
          px-2.5 py-1 bg-[#283593] text-white text-[11px] font-medium rounded-lg
          whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        {label}
      </span>
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col items-center w-[66px] flex-shrink-0 py-4 gap-1"
      style={{ background: 'white', borderRight: '1px solid #f0f3fa' }}
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
        {/* Grid/apps icon (decorative, matches screenshot) */}
        <button
          title="Ilovalar"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-[#b0bec5] hover:bg-[#f0f4ff] hover:text-[#3949ab] transition-colors mt-2"
        >
          <LayoutGrid size={19} />
        </button>
      </div>
    </aside>
  );
}
