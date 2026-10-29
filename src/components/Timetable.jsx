import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Calendar, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  WEEKDAYS,
  getWeekDates,
  getWeekRangeLabel,
  formatToDateString,
  parseLocalDate,
} from '../utils/dateUtils';

/* ─── Time grid constants ───────────────────────────────────────── */
const HOURS = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const HOUR_H = 56; // px per hour
const GRID_START_H = 8; // 8:00

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
    time: 'rgba(255,255,255,0.7)',
    border: '#3949ab',
    shadow: '0 2px 8px rgba(57,73,171,0.35)',
  },
  coral: {
    bg: '#ef5b5b',
    text: '#ffffff',
    time: 'rgba(255,255,255,0.75)',
    border: '#ef5b5b',
    shadow: '0 2px 8px rgba(239,91,91,0.35)',
  },
  white: {
    bg: '#ffffff',
    text: '#283593',
    time: '#90a4ae',
    border: '#e8edf6',
    shadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
};

/* ─── Lesson card ───────────────────────────────────────────────── */
function LessonCard({ lesson, onDelete }) {
  const c = COLORS[lesson.color] || COLORS.white;
  const startT = lesson.start_time || lesson.start || '08:00';
  const endT = lesson.end_time || lesson.end || '09:00';
  const topPx = (toMinutes(startT) / 60) * HOUR_H;
  const heightPx = Math.max(((toMinutes(endT) - toMinutes(startT)) / 60) * HOUR_H, 28);

  const isOneTime = lesson.schedule_type === 'date' || (lesson.specific_date && !lesson.is_recurring);

  return (
    <div
      className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden group cursor-pointer transition-transform hover:-translate-y-px"
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex items-baseline gap-1 leading-tight">
          <span className="font-bold text-[11px] truncate" style={{ color: c.text }}>
            {lesson.subject}
          </span>
          <span className="text-[10px] font-medium" style={{ color: c.time }}>
            {lesson.class_name || lesson.cls}
          </span>
          {isOneTime && (
            <span
              className="text-[8px] font-bold px-1 rounded bg-black/15 uppercase tracking-tighter"
              style={{ color: c.text }}
              title="Bir martalik dars"
            >
              sana
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(lesson.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
          style={{ color: c.text }}
          title="O'chirish"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {heightPx >= 36 && (
        <div className="text-[10px] leading-tight mt-0.5" style={{ color: c.time }}>
          {startT} · {endT}
        </div>
      )}
    </div>
  );
}

/* ─── Timetable Component ────────────────────────────────────────── */
export default function Timetable() {
  const { lessons, addLesson, deleteLesson } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New lesson form state
  const [form, setForm] = useState({
    subject: '',
    class_name: '',
    schedule_type: 'weekly', // 'weekly' or 'date'
    day: 0,
    specific_date: formatToDateString(new Date()),
    start_time: '08:00',
    end_time: '09:15',
    color: 'navy',
  });

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

    let resolvedDay = Number(form.day);
    if (form.schedule_type === 'date') {
      const parsed = parseLocalDate(form.specific_date);
      resolvedDay = (parsed.getDay() + 6) % 7;
    }

    await addLesson({
      subject: form.subject.trim(),
      class_name: form.class_name.trim() || 'A',
      schedule_type: form.schedule_type,
      day: resolvedDay,
      specific_date: form.schedule_type === 'date' ? form.specific_date : null,
      start_time: form.start_time,
      end_time: form.end_time,
      color: form.color,
    });

    setSubmitting(false);
    setShowModal(false);
    setForm({
      subject: '',
      class_name: '',
      schedule_type: 'weekly',
      day: 0,
      specific_date: formatToDateString(new Date()),
      start_time: '08:00',
      end_time: '09:15',
      color: 'navy',
    });
  };

  const isEmpty = (lessons || []).length === 0;

  return (
    <div className="flex flex-col select-none relative">
      {/* ── Top controls bar: chevrons + week range label + day headers + add button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week navigation buttons */}
          <div className="flex items-center gap-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100 flex-shrink-0">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#3949ab] hover:bg-indigo-50 transition-colors"
              title="Oldingi hafta"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#3949ab] hover:bg-indigo-50 transition-colors"
              title="Keyingi hafta"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Current week indicator or Jump-to-Today button */}
          {weekOffset !== 0 ? (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#3949ab] text-[11px] font-bold hover:bg-indigo-100 transition-colors flex-shrink-0"
            >
              Joriy hafta
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-[#3949ab] bg-blue-50/70 px-2.5 py-1 rounded-lg flex-shrink-0">
              Joriy hafta
            </span>
          )}

          {/* Week Range Label */}
          <span className="text-[11px] sm:text-xs font-semibold text-[#455a7a] whitespace-nowrap">
            {weekLabel}
          </span>
        </div>

        {/* Add lesson button */}
        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ef5b5b] text-white text-[12px] font-bold hover:bg-[#e53935] shadow-sm transition-all flex-shrink-0"
        >
          <Plus size={14} />
          <span>Dars qo'shish</span>
        </button>
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
                      isToday ? 'bg-[#ef5b5b]/10' : ''
                    }`}
                  >
                    <div
                      className="text-[9px] font-semibold tracking-widest uppercase"
                      style={{ color: isToday ? '#ef5b5b' : '#90a4ae' }}
                    >
                      {day.label}
                    </div>
                    <div
                      className="text-sm font-bold flex items-center justify-center gap-1"
                      style={{ color: isToday ? '#ef5b5b' : '#283593' }}
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
          <div className="flex relative">
            {/* Time labels column */}
            <div className="w-10 sm:w-11 flex-shrink-0 relative" style={{ height: `${gridH}px` }}>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute right-2 text-right"
                  style={{ top: `${i * HOUR_H - 7}px` }}
                >
                  <span className="text-[10px] font-medium text-[#b0bec5]">{h}</span>
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
                  className="flex-1 relative"
                  style={{
                    height: `${gridH}px`,
                    background: isToday ? 'rgba(239, 91, 91, 0.04)' : 'transparent',
                    borderLeft: '1px solid #e8edf6',
                  }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0"
                      style={{ top: `${i * HOUR_H}px`, borderTop: '1px solid #edf0f7' }}
                    />
                  ))}

                  {/* Lesson cards on this exact day */}
                  {dayLessons.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} onDelete={deleteLesson} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Empty state overlay when no lessons ── */}
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl pointer-events-auto">
            <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100 flex flex-col items-center gap-2 max-w-xs text-center mx-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#3949ab]">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#283593]">Hozircha darslar yo'q</h3>
              <p className="text-xs text-[#90a4ae] leading-relaxed">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#283593]">Yangi dars qo'shish</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
                  Fan nomi
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Matematika"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
                  Sinf / Guruh
                </label>
                <input
                  type="text"
                  placeholder="masalan: 9-A yoki S"
                  value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              {/* Schedule Type Selection */}
              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
                  Dars turi
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, schedule_type: 'weekly' })}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                      form.schedule_type === 'weekly'
                        ? 'border-[#3949ab] bg-[#3949ab] text-white shadow-sm'
                        : 'border-gray-200 bg-[#f7f9fc] text-gray-600'
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
                        : 'border-gray-200 bg-[#f7f9fc] text-gray-600'
                    }`}
                  >
                    Aniq sana uchun
                  </button>
                </div>
              </div>

              {/* Conditional: Weekday or Specific Date */}
              {form.schedule_type === 'weekly' ? (
                <div>
                  <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
                    Hafta kuni
                  </label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                  >
                    {WEEKDAYS.map((w) => (
                      <option key={w.index} value={w.index}>
                        {w.titleUz}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
                    Dars sanasi
                  </label>
                  <input
                    type="date"
                    required
                    value={form.specific_date}
                    onChange={(e) => setForm({ ...form, specific_date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                  />
                  {form.specific_date && (
                    <span className="text-[11px] text-[#3949ab] font-medium mt-1 block">
                      Hafta kuni: {WEEKDAYS[(parseLocalDate(form.specific_date).getDay() + 6) % 7].titleUz}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
                    Boshlanish
                  </label>
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
                    Tugash
                  </label>
                  <input
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">
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
                      } ${c.val === 'white' ? 'text-gray-700 border-gray-300' : 'text-white'}`}
                      style={{ background: c.bg }}
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
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
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
    </div>
  );
}
