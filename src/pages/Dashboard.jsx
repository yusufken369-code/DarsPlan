import React from 'react';
import Timetable from '../components/Timetable';
import DarsMateriallari from '../components/DarsMateriallari';
import DarsStatistikasi from '../components/DarsStatistikasi';
import YaqinlashayotganVazifalar from '../components/YaqinlashayotganVazifalar';

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4">

      {/* ── Timetable section ── */}
      <section
        className="rounded-2xl p-4 shadow-sm"
        style={{ background: '#eef1f8' }}
      >
        <Timetable />
      </section>

      {/* ── Lower three-section row ── */}
      <section className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Left: Materials */}
        <div className="flex-1 min-w-0">
          <DarsMateriallari />
        </div>

        {/* Center: Statistics (fixed width) */}
        <div className="flex justify-center flex-shrink-0">
          <DarsStatistikasi />
        </div>

        {/* Right: Deadlines */}
        <div className="flex-1 min-w-0">
          <YaqinlashayotganVazifalar />
        </div>
      </section>
    </div>
  );
}
