import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Calendar,
  Clock,
  Users,
  UserPlus,
  School,
  User,
  Award,
  Edit3,
  ClipboardCheck,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import StudentEditModal, { GRADE_CONFIG } from './StudentEditModal';
import {
  WEEKDAYS,
  getWeekDates,
  getWeekRangeLabel,
  formatToDateString,
  parseLocalDate,
  isStudentInClass,
} from '../utils/dateUtils';

/* ─── Time grid constants ───────────────────────────────────────── */
const HOURS = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const HOUR_H = 64; // px per hour (generous spacing for lesson cards)
const GRID_START_H = 8; // 8:00

export const TIME_OPTIONS = [
  '08:00', '08:30', '08:45',
  '09:00', '09:30', '09:45',
  '10:00', '10:30', '10:45',
  '11:00', '11:30', '11:45',
  '12:00', '12:30', '12:45',
  '13:00', '13:30', '13:45',
  '14:00', '14:30', '14:45',
  '15:00', '15:30', '15:45',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

function toMinutes(t) {
  if (!t) return 0;
  const [h, m = 0] = t.split(':').map(Number);
  return (h - GRID_START_H) * 60 + m;
}

/* ─── Color styles ──────────────────────────────────────────────── */
const COLORS = {
  navy: {
    bg: '#3949ab',
    text: '#ffffff',
    time: 'rgba(255,255,255,0.85)',
    border: '#303f9f',
    shadow: '0 4px 12px rgba(57,73,171,0.28)',
  },
  coral: {
    bg: '#ef5b5b',
    text: '#ffffff',
    time: 'rgba(255,255,255,0.88)',
    border: '#e53935',
    shadow: '0 4px 12px rgba(239,91,91,0.28)',
  },
  white: {
    bg: '#ffffff',
    text: '#283593',
    time: '#64748b',
    border: '#e2e8f0',
    shadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
};

/* ─── Lesson card ───────────────────────────────────────────────── */
function LessonCard({ lesson, onDelete, onSelect, studentCount }) {
  const c = COLORS[lesson.color] || COLORS.white;
  const isWhite = lesson.color === 'white';
  const startT = lesson.start_time || lesson.start || '08:00';
  const endT = lesson.end_time || lesson.end || '09:00';
  const topPx = (toMinutes(startT) / 60) * HOUR_H;
  const rawHeight = ((toMinutes(endT) - toMinutes(startT)) / 60) * HOUR_H;
  // Ensure enough height to fit title, group, and time neatly without squeezing
  const heightPx = Math.max(rawHeight, 48);

  const isOneTime = lesson.schedule_type === 'date' || (lesson.specific_date && !lesson.is_recurring);

  return (
    <div
      onClick={() => onSelect && onSelect(lesson)}
      className={`absolute left-1 right-1 rounded-xl p-2 sm:p-2.5 overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl z-10 hover:z-20 flex flex-col justify-between ${
        isWhite ? 'dark:!bg-slate-800 dark:!border-slate-700 dark:!text-white' : ''
      }`}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
      }}
      title={`Batafsil va o'quvchilar: ${lesson.subject} (${lesson.class_name || 'Guruh'})`}
    >
      <div className="flex items-start justify-between gap-1 min-w-0">
        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-black text-xs sm:text-[13px] leading-tight truncate ${
              isWhite ? 'dark:!text-white' : ''
            }`}
            style={{ color: c.text }}
          >
            {lesson.subject}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              isWhite
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                : 'bg-black/20 text-white'
            }`}
          >
            {lesson.class_name || lesson.cls}
          </span>
          {studentCount > 0 && (
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                isWhite
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#3949ab] dark:text-indigo-300'
                  : 'bg-white/25 text-white'
              }`}
              title={`${studentCount} nafar o'quvchi`}
            >
              <Users size={9} />
              <span>{studentCount}</span>
            </span>
          )}
          {isOneTime && (
            <span
              className="text-[8px] font-black px-1.5 py-0.5 rounded bg-black/25 uppercase tracking-tight text-white"
              title="Bir martalik dars"
            >
              sana
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`"${lesson.subject}" darsini o'chirmoqchimisiz?`)) {
              onDelete(lesson.id);
            }
          }}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity hover:bg-black/20 flex-shrink-0 ${
            isWhite ? 'dark:!text-slate-300 dark:hover:!text-red-400' : ''
          }`}
          style={{ color: c.text }}
          title="O'chirish"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div
        className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold opacity-90 truncate mt-1 ${
          isWhite ? 'dark:!text-slate-300' : ''
        }`}
        style={{ color: c.time }}
      >
        <Clock size={11} className="flex-shrink-0" />
        <span>{startT} – {endT}</span>
      </div>
    </div>
  );
}

/* ─── Timetable Component ────────────────────────────────────────── */
export default function Timetable() {
  const navigate = useNavigate();
  const { lessons, addLesson, updateLesson, deleteLesson, classes, students, addStudent, updateStudent, deleteStudent } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', phone: '', parent_phone: '', note: '' });
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [showGridLines, setShowGridLines] = useState(() => {
    try {
      const saved = localStorage.getItem('darsplan_show_grid');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleGridLines = () => {
    setShowGridLines((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('darsplan_show_grid', String(next));
      } catch {}
      return next;
    });
  };

  // New lesson form state
  const [form, setForm] = useState({
    subject: '',
    class_name: '',
    schedule_type: 'weekly', // 'weekly' or 'date'
    selectedDays: [0, 2, 4], // default: Dushanba / Chorshanba / Juma
    specific_date: formatToDateString(new Date()),
    start_time: '08:00',
    end_time: '09:00',
    color: 'navy',
  });

  const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const isMonWedFri = arraysEqual(form.selectedDays, [0, 2, 4]);
  const isTueThuSat = arraysEqual(form.selectedDays, [1, 3, 5]);

  const selectMonWedFri = () => {
    setForm((prev) => ({
      ...prev,
      selectedDays: [0, 2, 4],
    }));
  };

  const selectTueThuSat = () => {
    setForm((prev) => ({
      ...prev,
      selectedDays: [1, 3, 5],
    }));
  };

  const toggleDay = (dayIndex) => {
    setForm((prev) => {
      const exists = prev.selectedDays.includes(dayIndex);
      let updated;
      if (exists) {
        if (prev.selectedDays.length === 1) return prev; // kamida bitta kun qolishi kerak
        updated = prev.selectedDays.filter((d) => d !== dayIndex).sort((a, b) => a - b);
      } else {
        updated = [...prev.selectedDays, dayIndex].sort((a, b) => a - b);
      }
      return {
        ...prev,
        selectedDays: updated,
      };
    });
  };

  const selectedDayNames = form.selectedDays
    .map((d) => WEEKDAYS[d]?.titleUz)
    .filter(Boolean)
    .join(', ');

  // Calculate real calendar dates dynamically for all 7 days of the currently navigated week
  const days = getWeekDates(weekOffset);
  const gridH = HOUR_H * (HOURS.length - 1); // 448px
  const weekLabel = getWeekRangeLabel(days);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;

    // Validate times
    if (form.start_time >= form.end_time) {
      alert("Darsning tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak.");
      return;
    }

    setSubmitting(true);
    let lastCreated = null;

    if (form.schedule_type === 'date') {
      const parsed = parseLocalDate(form.specific_date);
      const resolvedDay = (parsed.getDay() + 6) % 7;
      lastCreated = await addLesson({
        subject: form.subject.trim(),
        class_name: form.class_name.trim() || '1-guruh',
        schedule_type: 'date',
        day: resolvedDay,
        specific_date: form.specific_date,
        start_time: form.start_time,
        end_time: form.end_time,
        color: form.color,
      });
    } else {
      // Weekly: add lesson for all selected days (e.g. Du/Chor/Ju or Se/Pay/Shan)
      const daysToAdd = form.selectedDays && form.selectedDays.length > 0 ? form.selectedDays : [0];
      for (const d of daysToAdd) {
        const created = await addLesson({
          subject: form.subject.trim(),
          class_name: form.class_name.trim() || '1-guruh',
          schedule_type: 'weekly',
          day: Number(d),
          specific_date: null,
          start_time: form.start_time,
          end_time: form.end_time,
          color: form.color,
        });
        if (created) lastCreated = created;
      }
    }

    setSubmitting(false);
    setShowModal(false);
    setForm({
      subject: '',
      class_name: '',
      schedule_type: 'weekly',
      selectedDays: [0, 2, 4],
      specific_date: formatToDateString(new Date()),
      start_time: '08:00',
      end_time: '09:00',
      color: 'navy',
    });

    // Automatically open group students manager for this newly added lesson/group!
    if (lastCreated) {
      setSelectedLesson(lastCreated);
    }
  };

  const handleAddStudentToLesson = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !selectedLesson) return;

    setSubmittingStudent(true);
    const grp = selectedLesson.class_name || selectedLesson.cls || '1-guruh';
    const target = grp.toLowerCase().trim();
    const matched = (classes || []).find(
      (c) => String(c.id).toLowerCase().trim() === target ||
             String(c.name || '').toLowerCase().trim() === target
    );

    await addStudent({
      class_id: matched ? matched.id : grp,
      group_name: matched ? matched.name : grp,
      name: studentForm.name.trim(),
      phone: studentForm.phone.trim(),
      parent_phone: studentForm.parent_phone.trim(),
      note: studentForm.note.trim(),
    });
    setSubmittingStudent(false);
    setStudentForm({ name: '', phone: '', parent_phone: '', note: '' });
  };

  const currentGroupStudents = useMemo(() => {
    if (!selectedLesson) return [];
    const grp = selectedLesson.class_name || selectedLesson.cls || '';
    return (students || []).filter((s) => isStudentInClass(s, grp, classes));
  }, [selectedLesson, students, classes]);

  const isEmpty = (lessons || []).length === 0;

  return (
    <div className="flex flex-col select-none relative">
      {/* ── Top controls bar: chevrons + week range label + day headers + add button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week navigation buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-slate-700 flex-shrink-0">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#3949ab] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
              title="Oldingi hafta"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#3949ab] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
              title="Keyingi hafta"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Current week indicator or Jump-to-Today button */}
          {weekOffset !== 0 ? (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[#3949ab] dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors flex-shrink-0"
            >
              Joriy hafta
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-[#3949ab] dark:text-indigo-300 bg-blue-50/70 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg flex-shrink-0">
              Joriy hafta
            </span>
          )}

          {/* Week Range Label */}
          <span className="text-[11px] sm:text-xs font-semibold text-[#455a7a] dark:text-slate-300 whitespace-nowrap">
            {weekLabel}
          </span>
        </div>

        {/* Action buttons: Grid toggle + Add lesson button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={toggleGridLines}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showGridLines
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-[#3949ab] dark:text-indigo-300'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
            title="Jadvaldagi chiziqlarni yoqish yoki toza ko'rinishga o'tkazish"
          >
            <LayoutGrid size={14} />
            <span>{showGridLines ? "Chiziqlar: Bor" : "Toza ko'rinish"}</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ef5b5b] text-white text-[12px] font-bold hover:bg-[#e53935] shadow-sm transition-all flex-shrink-0"
          >
            <Plus size={14} />
            <span>Dars qo'shish</span>
          </button>
        </div>
      </div>

      {/* ── Single scrollable container for both headers and grid ── */}
      <div className="overflow-x-auto relative rounded-xl pb-1">
        <div style={{ minWidth: 640 }}>
          {/* Day headers row (All 7 days) */}
          <div className="flex mb-1">
            <div className="w-10 sm:w-11 flex-shrink-0" />
            <div className="flex flex-1 min-w-0">
              {days.map((day) => {
                const isToday = day.isToday;
                return (
                  <div
                    key={day.dayIndex}
                    className={`flex-1 text-center px-0.5 py-1 rounded-lg transition-colors ${
                      isToday ? 'bg-[#ef5b5b]/10 dark:bg-[#ef5b5b]/20' : ''
                    }`}
                  >
                    <div
                      className={`text-[9px] font-semibold tracking-widest uppercase ${
                        isToday ? 'text-[#ef5b5b]' : 'text-[#90a4ae] dark:text-slate-400'
                      }`}
                    >
                      {day.label}
                    </div>
                    <div
                      className={`text-sm font-bold flex items-center justify-center gap-1 ${
                        isToday ? 'text-[#ef5b5b]' : 'text-[#283593] dark:text-slate-100'
                      }`}
                    >
                      <span>{day.date}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef5b5b]" title="Bugun" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid (All 7 days) */}
          <div className="flex relative bg-white/70 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-2xs">
            {/* Time labels column */}
            <div className="w-10 sm:w-11 flex-shrink-0 relative" style={{ height: `${gridH}px` }}>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute right-2 text-right"
                  style={{ top: `${i * HOUR_H - 7}px` }}
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{h}</span>
                </div>
              ))}
            </div>

            {/* 7 Day columns: Monday through Sunday */}
            {days.map((day) => {
              const isToday = day.isToday;

              // Correctly match lessons scheduled for this day
              const dayLessons = (lessons || []).filter((lesson) => {
                if (lesson.schedule_type === 'date' || (lesson.specific_date && !lesson.is_recurring)) {
                  return lesson.specific_date === day.fullDate;
                }
                return Number(lesson.day) === day.dayIndex;
              });

              return (
                <div
                  key={day.dayIndex}
                  className={`flex-1 relative border-l border-slate-200 dark:border-slate-800/80 transition-colors ${
                    isToday ? 'bg-indigo-50/25 dark:bg-indigo-950/25' : ''
                  }`}
                  style={{
                    height: `${gridH}px`,
                  }}
                >
                  {/* Grid lines (Whole hour line + 30-min dashed line for exact :30 lesson framing) */}
                  {showGridLines && (
                    <>
                      {HOURS.map((_, i) => (
                        <React.Fragment key={i}>
                          {/* Whole hour solid line */}
                          <div
                            className="absolute left-0 right-0 border-t border-slate-300 dark:border-slate-700/80 pointer-events-none"
                            style={{ top: `${i * HOUR_H}px` }}
                          />
                          {/* Half hour (30-min) dashed line */}
                          {i < HOURS.length - 1 && (
                            <div
                              className="absolute left-0 right-0 border-t border-dashed border-slate-200 dark:border-slate-800/70 pointer-events-none"
                              style={{ top: `${i * HOUR_H + (HOUR_H / 2)}px` }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </>
                  )}

                  {/* Lesson cards on this exact day */}
                  {dayLessons.map((lesson) => {
                    const grp = lesson.class_name || lesson.cls || '';
                    const stdCount = (students || []).filter((s) =>
                      isStudentInClass(s, grp, classes)
                    ).length;

                    return (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onDelete={deleteLesson}
                        onSelect={(l) => setSelectedLesson(l)}
                        studentCount={stdCount}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Empty state overlay when no lessons ── */}
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/60 backdrop-blur-[1px] rounded-xl pointer-events-auto">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] shadow-lg border border-gray-100 dark:border-slate-700/80 flex flex-col items-center gap-2 max-w-xs text-center mx-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-[#3949ab] dark:text-indigo-400">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#283593] dark:text-white">Hozircha darslar yo'q</h3>
              <p className="text-xs text-[#90a4ae] dark:text-slate-400 leading-relaxed">
                Haftalik jadvalingizni tuzish uchun darslaringizni kiriting.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow transition-colors"
              >
                <Plus size={14} />
                <span>Dars qo'shish</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Lesson Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 border border-transparent dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/80 pb-3">
              <h3 className="font-bold text-base text-[#283593] dark:text-white">Yangi dars qo'shish</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Fan nomi
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Matematika"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Sinf / Guruh
                </label>
                <input
                  type="text"
                  placeholder="masalan: 9-A yoki S"
                  value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              {/* Schedule Type Selection */}
              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Dars turi
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, schedule_type: 'weekly' })}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                      form.schedule_type === 'weekly'
                        ? 'border-[#3949ab] bg-[#3949ab] text-white shadow-sm'
                        : 'border-gray-200 dark:border-slate-700 bg-[#f7f9fc] dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    Har hafta (Doimiy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, schedule_type: 'date' })}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                      form.schedule_type === 'date'
                        ? 'border-[#3949ab] bg-[#3949ab] text-white shadow-sm'
                        : 'border-gray-200 dark:border-slate-700 bg-[#f7f9fc] dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    Aniq sana uchun
                  </button>
                </div>
              </div>

              {/* Conditional: Weekday or Specific Date */}
              {form.schedule_type === 'weekly' ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300">
                      Dars o'tiladigan kunlar
                    </label>
                    <span className="text-[11px] font-bold text-[#3949ab] dark:text-indigo-400">
                      {form.selectedDays.length} ta kun tanlandi
                    </span>
                  </div>

                  {/* 1. Asosiy kombinatsiya tugmalari (Du/Chor/Ju va Se/Pay/Shan) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={selectMonWedFri}
                      className={`h-11 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                        isMonWedFri
                          ? 'border-[#3949ab] bg-[#3949ab] text-white shadow-indigo-100 ring-2 ring-[#3949ab]/20'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#283593] dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>Du / Chor / Juma</span>
                    </button>
                    <button
                      type="button"
                      onClick={selectTueThuSat}
                      className={`h-11 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                        isTueThuSat
                          ? 'border-[#3949ab] bg-[#3949ab] text-white shadow-indigo-100 ring-2 ring-[#3949ab]/20'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#283593] dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>Se / Pay / Shanba</span>
                    </button>
                  </div>

                  {/* 2. Alohida har bir hafta kuni tugmalari (Scrollsiz, to'liq knopkalar) */}
                  <div>
                    <span className="text-[10px] font-semibold text-[#90a4ae] dark:text-slate-400 block mb-1.5">
                      Yoki alohida kunlarni bosing:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {WEEKDAYS.slice(0, 4).map((w) => {
                        const active = form.selectedDays.includes(w.index);
                        return (
                          <button
                            key={w.index}
                            type="button"
                            onClick={() => toggleDay(w.index)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center active:scale-95 ${
                              active
                                ? 'bg-[#ef5b5b] border-[#ef5b5b] text-white shadow-sm'
                                : 'bg-[#f7f9fc] dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-[#455a7a] dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-[#283593] dark:hover:text-white'
                            }`}
                          >
                            {w.titleUz}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {WEEKDAYS.slice(4, 7).map((w) => {
                        const active = form.selectedDays.includes(w.index);
                        return (
                          <button
                            key={w.index}
                            type="button"
                            onClick={() => toggleDay(w.index)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center active:scale-95 ${
                              active
                                ? 'bg-[#ef5b5b] border-[#ef5b5b] text-white shadow-sm'
                                : 'bg-[#f7f9fc] dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-[#455a7a] dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-[#283593] dark:hover:text-white'
                            }`}
                          >
                            {w.titleUz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tanlangan kunlar qisqacha ko'rinishi */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-[#283593] dark:text-indigo-200 flex items-center justify-between">
                    <span className="font-semibold truncate">
                      {selectedDayNames || 'Hech qaysi kun tanlanmadi'}
                    </span>
                    <span className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-[#3949ab] dark:text-indigo-400 flex-shrink-0 ml-2">
                      Haftalik
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                    Dars sanasi
                  </label>
                  <input
                    type="date"
                    required
                    value={form.specific_date}
                    onChange={(e) => setForm({ ...form, specific_date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                  />
                  {form.specific_date && (
                    <span className="text-[11px] text-[#3949ab] dark:text-indigo-400 font-medium mt-1 block">
                      Hafta kuni: {WEEKDAYS[(parseLocalDate(form.specific_date).getDay() + 6) % 7].titleUz}
                    </span>
                  )}
                </div>
              )}

              {/* Dars vaqti tanlash */}
              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1.5 block">
                  Dars vaqti (Tezkor tanlash — 1 marta bosish bilan):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    ['08:00', '09:00'],
                    ['09:00', '10:00'],
                    ['10:00', '11:00'],
                    ['11:00', '12:00'],
                    ['13:00', '14:00'],
                    ['14:00', '15:00'],
                    ['15:00', '16:00'],
                  ].map(([st, et]) => {
                    const isSelected = form.start_time === st && form.end_time === et;
                    return (
                      <button
                        key={`${st}-${et}`}
                        type="button"
                        onClick={() => setForm({ ...form, start_time: st, end_time: et })}
                        className={`text-xs py-2 px-2 rounded-xl border font-bold transition-all flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-[#3949ab] text-white border-[#3949ab] shadow-sm ring-2 ring-[#3949ab]/30'
                            : 'bg-[#f7f9fc] dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#3949ab] hover:bg-white'
                        }`}
                      >
                        {st} – {et}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Boshqa vaqt tanlash (Boshlanish va Tugash) */}
              <div className="bg-[#f8fafc] dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Yoki aniq vaqtni tanlang:
                  </span>
                  <span className="text-[11px] font-bold text-[#3949ab] dark:text-indigo-400">
                    Tanlandi: {form.start_time} – {form.end_time}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                      Boshlanish
                    </label>
                    <select
                      value={form.start_time}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const [h, m] = newStart.split(':').map(Number);
                        const endH = Math.min(h + 1, 18);
                        const newEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        setForm({ ...form, start_time: newStart, end_time: newEnd });
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-white dark:bg-slate-800 cursor-pointer"
                    >
                      {TIME_OPTIONS.filter((t) => t < '18:00').map((t) => (
                        <option key={`start-${t}`} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                      Tugash
                    </label>
                    <select
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-white dark:bg-slate-800 cursor-pointer"
                    >
                      {TIME_OPTIONS.filter((t) => t > form.start_time).map((t) => (
                        <option key={`end-${t}`} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Karta rangi
                </label>
                <div className="flex gap-2">
                  {[
                    { val: 'navy', label: "Ko'k", bg: '#3949ab' },
                    { val: 'coral', label: 'Qizil', bg: '#ef5b5b' },
                    { val: 'white', label: 'Oq', bg: '#ffffff', border: true },
                  ].map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setForm({ ...form, color: c.val })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                        form.color === c.val ? 'ring-2 ring-offset-1 ring-[#3949ab]' : ''
                      } ${c.val === 'white' ? 'text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-600 dark:bg-slate-800' : 'text-white'}`}
                      style={{ background: c.val === 'white' ? undefined : c.bg }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] transition-colors"
                >
                  {submitting ? 'Saqlanmoqda…' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Guruh o'quvchilari va dars ma'lumotlari modali ── */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-transparent dark:border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700/80 bg-[#f7f9fc] dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3949ab] text-white flex items-center justify-center shadow-sm font-bold text-sm">
                  <School size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#283593] dark:text-white">
                      {selectedLesson.subject}
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-[#ef5b5b] font-bold text-xs">
                      {selectedLesson.class_name || selectedLesson.cls || '1-guruh'}
                    </span>
                  </div>
                  <p className="text-xs text-[#90a4ae] dark:text-slate-400 mt-0.5">
                    {selectedLesson.start_time || selectedLesson.start} - {selectedLesson.end_time || selectedLesson.end} · Jami {currentGroupStudents.length} nafar o'quvchi
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLesson(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-gray-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              {/* Dars vaqti va jadvaldagi katakchaga moslash */}
              <div className="bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={15} className="text-[#3949ab] dark:text-indigo-400" />
                    <span className="text-xs font-bold text-[#283593] dark:text-white">
                      Dars vaqti: {selectedLesson.start_time || selectedLesson.start} – {selectedLesson.end_time || selectedLesson.end}
                    </span>
                  </div>
                  {((selectedLesson.start_time || selectedLesson.start || '').endsWith(':30') ||
                    (selectedLesson.end_time || selectedLesson.end || '').endsWith(':30')) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Oraliq dars
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  Darsni jadval katakchasiga (butun soatlar orasiga) to'liq moslash:
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    ['08:00', '09:00'],
                    ['09:00', '10:00'],
                    ['10:00', '11:00'],
                    ['11:00', '12:00'],
                    ['13:00', '14:00'],
                    ['14:00', '15:00'],
                    ['15:00', '16:00'],
                  ].map(([st, et]) => {
                    const isCur =
                      (selectedLesson.start_time || selectedLesson.start) === st &&
                      (selectedLesson.end_time || selectedLesson.end) === et;
                    return (
                      <button
                        key={`${st}-${et}`}
                        type="button"
                        onClick={async () => {
                          const updated = await updateLesson(selectedLesson.id, {
                            start_time: st,
                            start: st,
                            end_time: et,
                            end: et,
                          });
                          if (updated) {
                            setSelectedLesson((prev) => ({
                              ...prev,
                              start_time: st,
                              start: st,
                              end_time: et,
                              end: et,
                            }));
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          isCur
                            ? 'bg-[#3949ab] text-white border-[#3949ab] font-bold shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#3949ab]'
                        }`}
                      >
                        {st} – {et}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Student Form */}
              <div className="bg-[#f0f4ff] dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-700 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-[#283593] dark:text-white flex items-center gap-1.5 mb-2.5">
                  <UserPlus size={15} className="text-[#3949ab] dark:text-indigo-400" />
                  <span>
                    "{selectedLesson.class_name || selectedLesson.cls || '1-guruh'}" guruhiga o'quvchi qo'shish
                  </span>
                </h4>

                <form onSubmit={handleAddStudentToLesson} className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                      O'quvchi F.I.SH. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="masalan: Aliyev Jasur"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                        Telefon raqami
                      </label>
                      <input
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={studentForm.phone}
                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                        Ota-onasi telefoni
                      </label>
                      <input
                        type="tel"
                        placeholder="+998 90 987 65 43"
                        value={studentForm.parent_phone}
                        onChange={(e) =>
                          setStudentForm({ ...studentForm, parent_phone: e.target.value })
                        }
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={submittingStudent || !studentForm.name.trim()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3949ab] text-white text-xs font-bold hover:bg-[#303f9f] transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <Plus size={14} />
                      <span>{submittingStudent ? "Qo'shilmoqda…" : "O'quvchini qo'shish"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Students List */}
              <div>
                <h4 className="text-xs font-bold text-[#283593] dark:text-white mb-2.5 flex items-center justify-between">
                  <span>Guruh o'quvchilari ({currentGroupStudents.length})</span>
                  <span className="text-[10px] text-[#90a4ae] dark:text-slate-400 font-normal">
                    Baholash uchun o'quvchi ustiga bosing
                  </span>
                </h4>

                {currentGroupStudents.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl bg-[#fafbfe] dark:bg-slate-900/40">
                    <User size={22} className="mx-auto text-gray-400 mb-1.5" />
                    <p className="text-xs font-bold text-[#283593] dark:text-white">Ushbu guruhda hali o'quvchilar yo'q</p>
                    <p className="text-[11px] text-[#90a4ae] dark:text-slate-400 mt-0.5">
                      Yuqoridagi formadan foydalanib birinchi o'quvchini qo'shing.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {currentGroupStudents.map((std, idx) => (
                      <div
                        key={std.id}
                        onClick={() => setEditingStudent(std)}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-[#f7f9fc] dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-[#3949ab] dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center border border-gray-200 dark:border-slate-600 flex-shrink-0 shadow-xs">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-bold text-[#283593] dark:text-white truncate">{std.name}</p>

                              {/* Grade badge (2..5) - Exact color styling, no emoji */}
                              {std.grade && GRADE_CONFIG[std.grade] && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 shadow-xs ${GRADE_CONFIG[std.grade].lightBg}`}
                                  title={`Baho: ${std.grade} - ${GRADE_CONFIG[std.grade].label}`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${GRADE_CONFIG[std.grade].bg}`} />
                                  Baho: {std.grade}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 text-[10px] text-[#90a4ae] dark:text-slate-400 mt-0.5 flex-wrap">
                              {std.phone && <span>Tel: {std.phone}</span>}
                              {std.parent_phone && <span>Ota-ona: {std.parent_phone}</span>}
                              {std.note && (
                                <span className="bg-indigo-50 dark:bg-indigo-950/70 text-[#3949ab] dark:text-indigo-300 px-1.5 py-0.2 rounded font-medium">
                                  {std.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStudent(std);
                            }}
                            className="text-[#3949ab] dark:text-indigo-400 hover:text-[#283593] p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                            title="Tahrirlash / Baholash"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`"${std.name}"ni ro'yxatdan o'chirmoqchimisiz?`)) {
                                deleteStudent(std.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex-shrink-0"
                            title="O'chirish"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between bg-gray-50 dark:bg-slate-900/60 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${selectedLesson.subject}" darsini jadvaldan o'chirmoqchimisiz?`)) {
                    deleteLesson(selectedLesson.id);
                    setSelectedLesson(null);
                  }
                }}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-bold transition-colors"
              >
                <Trash2 size={13} />
                <span>Darsni o'chirish</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const grp = selectedLesson.class_name || selectedLesson.cls || '1-guruh';
                    const target = grp.toLowerCase().trim();
                    const matched = (classes || []).find(
                      (c) => String(c.id).toLowerCase().trim() === target ||
                             String(c.name || '').toLowerCase().trim() === target
                    );
                    navigate(`/sinflar/${matched ? matched.id : encodeURIComponent(grp)}`);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3949ab] hover:bg-[#303f9f] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <ClipboardCheck size={14} />
                  <span>Davomat va baholash</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLesson(null)}
                  className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-[#455a7a] dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: O'quvchi ma'lumotlari, daromad va 2-5 baholarni tahrirlash ── */}
      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={async (id, updates) => {
            const updated = await updateStudent(id, updates);
            if (updated) {
              setEditingStudent(null);
            }
          }}
          onDelete={async (id) => {
            await deleteStudent(id);
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
}
