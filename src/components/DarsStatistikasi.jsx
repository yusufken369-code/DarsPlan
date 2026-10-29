import React from 'react';
import { useData } from '../context/DataContext';
import { getLessonsForDate } from '../utils/dateUtils';

/* SVG ring that matches the screenshot's white ring on coral */
function RingChart({ value, max = 5, size = 108, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={stroke}
      />
      {/* Arc */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="white"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
      {/* Center value */}
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="central"
        fill="white"
        fontSize="24" fontWeight="800"
        fontFamily="Inter, sans-serif"
        letterSpacing="-0.5"
      >
        {value.toFixed(1).replace('.', ',')}
      </text>
    </svg>
  );
}

export default function DarsStatistikasi() {
  const { lessons } = useData();

  const totalLessons = (lessons || []).length;

  // Calculate subject counts
  const subjectMap = {};
  (lessons || []).forEach(l => {
    const s = l.subject || 'Dars';
    subjectMap[s] = (subjectMap[s] || 0) + 1;
  });

  const subjectList = Object.keys(subjectMap).map(subj => ({
    subject: subj.toUpperCase(),
    count: subjectMap[subj],
  }));

  // Today's lessons calculation using real calendar date and recurring schedule
  const todayLessons = getLessonsForDate(lessons, new Date());

  // Check how many have passed based on current time
  const now = new Date();
  const currentHourMin = now.getHours() * 60 + now.getMinutes();

  let completedToday = 0;
  todayLessons.forEach(l => {
    const endT = l.end_time || l.end || '09:00';
    const [eh, em] = endT.split(':').map(Number);
    if (currentHourMin >= (eh * 60 + (em || 0))) {
      completedToday += 1;
    }
  });

  const remainingToday = Math.max(todayLessons.length - completedToday, 0);

  // Score or load metric (average lessons per day out of 5 days)
  const avgPerDay = totalLessons > 0 ? Number((totalLessons / 5).toFixed(1)) : 0.0;

  return (
    <div
      className="rounded-2xl p-4 shadow-sm flex flex-col items-center gap-3 flex-shrink-0 w-[185px] justify-between"
      style={{ background: '#ef5b5b' }}
    >
      {/* Title */}
      <p className="text-white/70 text-[9px] font-bold uppercase tracking-[2px] text-center">
        Dars statistikasi
      </p>

      {/* Ring Chart */}
      <RingChart value={avgPerDay} max={5} />

      {/* Subject list or empty state */}
      <div className="w-full flex flex-col gap-1.5 mt-0.5 min-h-[50px] justify-center">
        {subjectList.length > 0 ? (
          subjectList.slice(0, 4).map(s => (
            <div key={s.subject} className="flex items-center justify-between">
              <span className="text-white/75 text-[11px] font-medium uppercase truncate max-w-[120px]">
                {s.subject}
              </span>
              <span className="text-white font-bold text-[11px]">
                {s.count} ta
              </span>
            </div>
          ))
        ) : (
          <p className="text-white/60 text-[10px] text-center italic py-2">
            Hozircha darslar yo'q
          </p>
        )}
      </div>

      {/* Divider + today counters */}
      <div className="w-full border-t border-white/20 pt-2.5 flex justify-around">
        {[
          { n: completedToday, label: 'Bajarildi' },
          { n: remainingToday, label: 'Qoldi' },
          { n: totalLessons, label: 'Jami' },
        ].map(item => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="text-white font-extrabold text-lg leading-none">{item.n}</span>
            <span className="text-white/65 text-[9px] mt-0.5">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
