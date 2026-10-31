import React, { useState } from 'react';
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
} from 'lucide-react';
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
function LessonCard({ lesson, onDelete, onSelect, studentCount }) {
  const c = COLORS[lesson.color] || COLORS.white;
  const startT = lesson.start_time || lesson.start || '08:00';
  const endT = lesson.end_time || lesson.end || '09:00';
  const topPx = (toMinutes(startT) / 60) * HOUR_H;
  const heightPx = Math.max(((toMinutes(endT) - toMinutes(startT)) / 60) * HOUR_H, 28);

  const isOneTime = lesson.schedule_type === 'date' || (lesson.specific_date && !lesson.is_recurring);

  return (
    <div
      onClick={() => onSelect && onSelect(lesson)}
      className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden group cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
      }}
      title={`Batafsil va o'quvchilar: ${lesson.subject} (${lesson.class_name || 'Guruh'})`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex items-baseline gap-1 leading-tight flex-wrap">
          <span className="font-bold text-[11px] truncate" style={{ color: c.text }}>
            {lesson.subject}
          </span>
          <span className="text-[10px] font-medium" style={{ color: c.time }}>
            {lesson.class_name || lesson.cls}
          </span>
          {studentCount > 0 && (
            <span
              className="text-[8px] font-bold px-1 rounded bg-black/20 flex items-center gap-0.5"
              style={{ color: c.text }}
              title={`${studentCount} nafar o'quvchi`}
            >
              👥 {studentCount}
            </span>
          )}
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
            if (confirm(`"${lesson.subject}" darsini o'chirmoqchimisiz?`)) {
              onDelete(lesson.id);
            }
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
  const { lessons, addLesson, deleteLesson, students, addStudent, deleteStudent } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', phone: '', parent_phone: '', note: '' });
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // New lesson form state
  const [form, setForm] = useState({
    subject: '',
    class_name: '',
    schedule_type: 'weekly', // 'weekly' or 'date'
    pattern: '0', // 'mon_wed_fri', 'tue_thu_sat', or '0'..'6'
    selectedDays: [0], // array of selected day indices: [0, 2, 4] or [1, 3, 5]
    specific_date: formatToDateString(new Date()),
    start_time: '08:00',
    end_time: '09:15',
    color: 'navy',
  });

  const handlePatternChange = (patternVal) => {
    if (patternVal === 'mon_wed_fri') {
      setForm((prev) => ({
        ...prev,
        pattern: 'mon_wed_fri',
        selectedDays: [0, 2, 4], // Du, Chor, Ju
      }));
    } else if (patternVal === 'tue_thu_sat') {
      setForm((prev) => ({
        ...prev,
        pattern: 'tue_thu_sat',
        selectedDays: [1, 3, 5], // Se, Pay, Shan
      }));
    } else {
      const dayNum = Number(patternVal);
      setForm((prev) => ({
        ...prev,
        pattern: patternVal,
        selectedDays: [dayNum],
      }));
    }
  };

  const toggleDay = (dayIndex) => {
    setForm((prev) => {
      const exists = prev.selectedDays.includes(dayIndex);
      let updated;
      if (exists) {
        if (prev.selectedDays.length === 1) return prev;
        updated = prev.selectedDays.filter((d) => d !== dayIndex);
      } else {
        updated = [...prev.selectedDays, dayIndex].sort((a, b) => a - b);
      }
      return {
        ...prev,
        pattern: 'custom',
        selectedDays: updated,
      };
    });
  };

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
      pattern: '0',
      selectedDays: [0],
      specific_date: formatToDateString(new Date()),
      start_time: '08:00',
      end_time: '09:15',
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
    await addStudent({
      class_id: grp,
      group_name: grp,
      name: studentForm.name.trim(),
      phone: studentForm.phone.trim(),
      parent_phone: studentForm.parent_phone.trim(),
      note: studentForm.note.trim(),
    });
    setSubmittingStudent(false);
    setStudentForm({ name: '', phone: '', parent_phone: '', note: '' });
  };

  const currentGroupStudents = selectedLesson
    ? (students || []).filter((s) => {
        const grp = String(selectedLesson.class_name || selectedLesson.cls || '').toLowerCase().trim();
        return (
          String(s.class_id || '').toLowerCase().trim() === grp ||
          String(s.group_name || '').toLowerCase().trim() === grp
        );
      })
    : [];

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
                  {dayLessons.map((lesson) => {
                    const grp = String(lesson.class_name || lesson.cls || '').toLowerCase().trim();
                    const stdCount = (students || []).filter(
                      (s) =>
                        String(s.class_id || '').toLowerCase().trim() === grp ||
                        String(s.group_name || '').toLowerCase().trim() === grp
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#455a7a]">
                      Hafta kuni / Dars tartibi
                    </label>
                  </div>

                  {/* Dropdown with multi-day patterns and individual weekdays */}
                  <select
                    value={form.pattern}
                    onChange={(e) => handlePatternChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-medium text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                  >
                    <optgroup label="Guruh darslari (Kombinatsiya)">
                      <option value="mon_wed_fri">Dushanba / Chorshanba / Juma</option>
                      <option value="tue_thu_sat">Seshanba / Payshanba / Shanba</option>
                    </optgroup>
                    <optgroup label="Alohida kunlar">
                      {WEEKDAYS.map((w) => (
                        <option key={w.index} value={String(w.index)}>
                          {w.titleUz}
                        </option>
                      ))}
                    </optgroup>
                    {form.pattern === 'custom' && (
                      <option value="custom">Tanlangan ({form.selectedDays.length} ta kun)</option>
                    )}
                  </select>

                  {/* Quick selection preset buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePatternChange('mon_wed_fri')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border text-center ${
                        form.pattern === 'mon_wed_fri'
                          ? 'border-[#3949ab] bg-indigo-50 text-[#3949ab] shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Du / Chor / Juma
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePatternChange('tue_thu_sat')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border text-center ${
                        form.pattern === 'tue_thu_sat'
                          ? 'border-[#3949ab] bg-indigo-50 text-[#3949ab] shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Se / Pay / Shanba
                    </button>
                  </div>

                  {/* Day pills */}
                  <div className="flex gap-1 justify-between pt-1 border-t border-gray-100">
                    {WEEKDAYS.map((w) => {
                      const active = form.selectedDays.includes(w.index);
                      return (
                        <button
                          key={w.index}
                          type="button"
                          onClick={() => toggleDay(w.index)}
                          title={w.titleUz}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            active
                              ? 'bg-[#ef5b5b] text-white shadow-sm'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
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

      {/* ── Guruh o'quvchilari va dars ma'lumotlari modali ── */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#f7f9fc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3949ab] text-white flex items-center justify-center shadow-sm font-bold text-sm">
                  <School size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#283593]">
                      {selectedLesson.subject}
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-pink-100 text-[#ef5b5b] font-bold text-xs">
                      {selectedLesson.class_name || selectedLesson.cls || '1-guruh'}
                    </span>
                  </div>
                  <p className="text-xs text-[#90a4ae] mt-0.5">
                    {selectedLesson.start_time || selectedLesson.start} - {selectedLesson.end_time || selectedLesson.end} · Jami {currentGroupStudents.length} nafar o'quvchi
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLesson(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-200/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              {/* Add Student Form */}
              <div className="bg-[#f0f4ff] border border-indigo-100 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-[#283593] flex items-center gap-1.5 mb-2.5">
                  <UserPlus size={15} className="text-[#3949ab]" />
                  <span>
                    "{selectedLesson.class_name || selectedLesson.cls || '1-guruh'}" guruhiga o'quvchi qo'shish
                  </span>
                </h4>

                <form onSubmit={handleAddStudentToLesson} className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[#455a7a] mb-1 block">
                      O'quvchi F.I.SH. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="masalan: Aliyev Jasur"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#455a7a] mb-1 block">
                        Telefon raqami
                      </label>
                      <input
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={studentForm.phone}
                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#455a7a] mb-1 block">
                        Ota-onasi telefoni
                      </label>
                      <input
                        type="tel"
                        placeholder="+998 90 987 65 43"
                        value={studentForm.parent_phone}
                        onChange={(e) =>
                          setStudentForm({ ...studentForm, parent_phone: e.target.value })
                        }
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-white"
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
                <h4 className="text-xs font-bold text-[#283593] mb-2.5 flex items-center justify-between">
                  <span>Guruh o'quvchilari ({currentGroupStudents.length})</span>
                </h4>

                {currentGroupStudents.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-[#fafbfe]">
                    <User size={22} className="mx-auto text-gray-400 mb-1.5" />
                    <p className="text-xs font-bold text-[#283593]">Ushbu guruhda hali o'quvchilar yo'q</p>
                    <p className="text-[11px] text-[#90a4ae] mt-0.5">
                      Yuqoridagi formadan foydalanib birinchi o'quvchini qo'shing.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {currentGroupStudents.map((std, idx) => (
                      <div
                        key={std.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#f7f9fc] border border-gray-100 hover:bg-white hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-white text-[#3949ab] font-bold text-[11px] flex items-center justify-center border border-gray-200 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#283593] truncate">{std.name}</p>
                            <div className="flex items-center gap-2.5 text-[10px] text-[#90a4ae] mt-0.5 flex-wrap">
                              {std.phone && <span>Tel: {std.phone}</span>}
                              {std.parent_phone && <span>Ota-ona: {std.parent_phone}</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`"${std.name}"ni ro'yxatdan o'chirmoqchimisiz?`)) {
                              deleteStudent(std.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all flex-shrink-0"
                          title="O'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
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

              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="px-4 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#455a7a] hover:bg-gray-100 transition-colors shadow-sm"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
