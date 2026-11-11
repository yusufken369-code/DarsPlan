import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Users,
  Check,
  X,
  Sparkles,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { isStudentInClass } from '../utils/dateUtils';
import { GRADE_CONFIG } from '../components/StudentEditModal';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const WEEKDAY_NAMES_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export default function Jurnal() {
  const navigate = useNavigate();
  const { classes, students, attendanceList, saveAttendance } = useData();

  // Active class selection
  const [selectedClassId, setSelectedClassId] = useState(() => {
    return classes?.[0]?.id || classes?.[0]?.name || '';
  });

  // Current year & month (0-indexed month)
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  // Filter mode: 'all' | 'grades' | 'attendance'
  const [viewFilter, setViewFilter] = useState('all');

  // Quick edit cell modal state
  const [editingCell, setEditingCell] = useState(null); // { student, dateStr, currentRecord }

  // Fallback active class
  const activeClass = useMemo(() => {
    if (!classes || classes.length === 0) return null;
    return classes.find((c) => String(c.id) === String(selectedClassId) || c.name === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  // Students belonging to active class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    const identifier = activeClass.id || activeClass.name;
    return (students || []).filter((s) => isStudentInClass(s, identifier, classes));
  }, [students, activeClass, classes]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday =
        new Date().getFullYear() === year &&
        new Date().getMonth() === month &&
        new Date().getDate() === d;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      days.push({
        dayNumber: d,
        weekdayShort: WEEKDAY_NAMES_SHORT[dayOfWeek],
        dateStr,
        isToday,
        isWeekend,
      });
    }
    return days;
  }, [year, month]);

  // Map attendance records for fast lookup: [dateStr][studentId] -> record
  const monthAttendanceMap = useMemo(() => {
    const map = {};
    if (!activeClass || !attendanceList) return map;
    const targetId = String(activeClass.id || '').toLowerCase().trim();
    const targetName = String(activeClass.name || '').toLowerCase().trim();

    attendanceList.forEach((att) => {
      if (!att || !att.date) return;
      const aId = String(att.class_id || '').toLowerCase().trim();
      const aName = String(att.class_name || '').toLowerCase().trim();
      const match =
        aId === targetId ||
        (targetName && aId === targetName) ||
        (targetName && aName === targetName) ||
        (targetId && aName === targetId);

      if (match && att.records) {
        map[att.date] = att.records;
      }
    });

    return map;
  }, [activeClass, attendanceList]);

  // Navigate months
  const handleMonthChange = (delta) => {
    let nextM = month + delta;
    let nextY = year;
    if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    } else if (nextM < 0) {
      nextM = 11;
      nextY -= 1;
    }
    setMonth(nextM);
    setYear(nextY);
  };

  const jumpToCurrentMonth = () => {
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth());
  };

  // Quick cell update handler
  const handleSaveCell = async (newStatus, newGrade) => {
    if (!editingCell || !activeClass) return;
    const { student, dateStr } = editingCell;
    const existingDateRecords = { ...(monthAttendanceMap[dateStr] || {}) };
    const curStdRec = existingDateRecords[student.id] || { status: null, grade: null, comment: '' };

    existingDateRecords[student.id] = {
      ...curStdRec,
      status: newStatus !== undefined ? newStatus : curStdRec.status,
      grade: newGrade !== undefined ? newGrade : curStdRec.grade,
    };

    await saveAttendance(activeClass.id, dateStr, existingDateRecords, activeClass.name);
    setEditingCell(null);
  };

  // Student monthly summary metrics
  const studentMetrics = useMemo(() => {
    const res = {};
    classStudents.forEach((std) => {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let reasonCount = 0;
      const grades = [];

      daysInMonth.forEach((d) => {
        const dateRec = monthAttendanceMap[d.dateStr]?.[std.id];
        if (dateRec) {
          if (dateRec.status === 'B' || dateRec.status === 'P') presentCount++;
          else if (dateRec.status === 'Y' || dateRec.status === 'A') absentCount++;
          else if (dateRec.status === 'K') lateCount++;
          else if (dateRec.status === 'S') reasonCount++;

          if (dateRec.grade) {
            grades.push(Number(dateRec.grade));
          }
        }
      });

      const avgGrade =
        grades.length > 0
          ? (grades.reduce((acc, g) => acc + g, 0) / grades.length).toFixed(1)
          : null;

      res[std.id] = {
        presentCount,
        absentCount,
        lateCount,
        reasonCount,
        gradesCount: grades.length,
        avgGrade,
      };
    });
    return res;
  }, [classStudents, daysInMonth, monthAttendanceMap]);

  // Overall class summary
  const classSummary = useMemo(() => {
    let totalGradesCount = 0;
    let sumGrades = 0;
    let totalPresents = 0;
    let totalAbsents = 0;

    Object.values(studentMetrics).forEach((m) => {
      totalPresents += m.presentCount;
      totalAbsents += m.absentCount;
      if (m.avgGrade) {
        sumGrades += Number(m.avgGrade);
        totalGradesCount++;
      }
    });

    const classAvg = totalGradesCount > 0 ? (sumGrades / totalGradesCount).toFixed(1) : '-';
    const totalAttLessons = totalPresents + totalAbsents;
    const attRate = totalAttLessons > 0 ? Math.round((totalPresents / totalAttLessons) * 100) : 100;

    return {
      classAvg,
      attRate,
      totalStudents: classStudents.length,
    };
  }, [studentMetrics, classStudents]);

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (!activeClass || classStudents.length === 0) return;

    let csv = `\uFEFF`; // UTF-8 BOM for Excel
    csv += `DarsPlan - Baholar Jurnali\n`;
    csv += `Sinf: ${activeClass.name}; Davr: ${UZ_MONTHS[month]} ${year}\n\n`;

    // Header row
    const headers = ['#', 'F.I.SH.'];
    daysInMonth.forEach((d) => headers.push(`${d.dayNumber}-${d.weekdayShort}`));
    headers.push('Qatnashdi (B)', "Yo'q (Y)", "O'rtacha");
    csv += headers.join(';') + '\n';

    // Student rows
    classStudents.forEach((std, idx) => {
      const row = [`${idx + 1}`, `"${std.name}"`];
      daysInMonth.forEach((d) => {
        const rec = monthAttendanceMap[d.dateStr]?.[std.id];
        let val = '';
        if (rec) {
          if (rec.grade) val = `${rec.grade}`;
          else if (rec.status) val = `${rec.status}`;
        }
        row.push(val);
      });

      const m = studentMetrics[std.id];
      row.push(`${m?.presentCount || 0}`);
      row.push(`${m?.absentCount || 0}`);
      row.push(`${m?.avgGrade || '-'}`);
      csv += row.join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Jurnal_${activeClass.name}_${UZ_MONTHS[month]}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-16 select-none animate-in fade-in duration-150">
      {/* ── TOP HEADER: Title + Month Navigation + Export actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#3949ab] text-white flex items-center justify-center shadow-md">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#283593] dark:text-white tracking-tight">
                Umumiy Baholar Jurnali
              </h1>
              <p className="text-xs text-[#90a4ae] dark:text-slate-400">
                Oylik to'liq baholar, davomat va o'rtacha ballar jadvali
              </p>
            </div>
          </div>
        </div>

        {/* Month selector & Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Navigator */}
          <div className="flex items-center bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-800 rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              title="Oldingi oy"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-3 py-1 text-center min-w-[130px]">
              <span className="text-xs font-black text-[#283593] dark:text-white block">
                {UZ_MONTHS[month]} {year}
              </span>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              title="Keyingi oy"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={jumpToCurrentMonth}
            className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#3949ab] dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            Joriy oy
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            title="Excel (CSV) fayl qilib yuklab olish"
          >
            <Download size={14} />
            <span>Excel yuklab olish</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors"
            title="Chop etish yoki PDF"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Chop etish</span>
          </button>
        </div>
      </div>

      {/* ── TOOLBAR: Class Selector Tabs & View Filters ── */}
      <div className="bg-white dark:bg-[#151f32] p-3.5 px-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Class Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-[#455a7a] dark:text-slate-400 mr-1 flex-shrink-0">
            Sinf / Guruh:
          </span>
          {classes && classes.length > 0 ? (
            classes.map((cls) => {
              const isActive = String(activeClass?.id) === String(cls.id);
              const count = (students || []).filter((s) => isStudentInClass(s, cls.id, classes)).length;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-[#3949ab] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cls.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-gray-400">Sinflar mavjud emas</span>
          )}
        </div>

        {/* View mode filter */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <span className="text-xs font-bold text-[#455a7a] dark:text-slate-400 mr-1">
            Ko'rinish:
          </span>
          {[
            { id: 'all', label: 'Hammasi' },
            { id: 'grades', label: 'Faqat baholar' },
            { id: 'attendance', label: 'Faqat davomat' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewFilter(mode.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                viewFilter === mode.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#3949ab] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN GRADEBOOK MATRIX TABLE ── */}
      <div className="bg-white dark:bg-[#151f32] rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {classStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-slate-800 text-[#3949ab] dark:text-indigo-400 flex items-center justify-center mb-3">
              <Users size={30} />
            </div>
            <h3 className="text-base font-bold text-[#283593] dark:text-white">Ushbu guruhda o'quvchilar yo'q</h3>
            <p className="text-xs text-[#90a4ae] dark:text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
              Jurnalni to'ldirish uchun avval sinflar bo'limidan o'quvchilarni qo'shing.
            </p>
            <button
              onClick={() => navigate('/sinflar')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#3949ab] hover:bg-[#303f9f] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Users size={15} />
              <span>Sinflar sahifasiga o'tish</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/60 text-[#455a7a] dark:text-slate-300 text-[11px] font-extrabold uppercase">
                  {/* Sticky left student info */}
                  <th className="py-3.5 px-4 w-[200px] min-w-[180px] sticky left-0 bg-[#f8fafc] dark:bg-slate-900 z-10 border-r border-gray-200 dark:border-slate-800">
                    O'quvchi F.I.SH.
                  </th>

                  {/* Day columns */}
                  {daysInMonth.map((d) => (
                    <th
                      key={d.dateStr}
                      className={`py-2 px-1 text-center min-w-[32px] font-bold border-r border-gray-100 dark:border-slate-800/60 ${
                        d.isToday
                          ? 'bg-indigo-100/70 dark:bg-indigo-950/80 text-[#3949ab] dark:text-indigo-300 ring-2 ring-[#3949ab]/20'
                          : d.isWeekend
                          ? 'bg-slate-100/50 dark:bg-slate-900/80 text-slate-400'
                          : ''
                      }`}
                      title={`${d.dayNumber}-${UZ_MONTHS[month]} (${d.weekdayShort})`}
                    >
                      <div className="text-[12px] font-extrabold">{d.dayNumber}</div>
                      <div className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                        {d.weekdayShort}
                      </div>
                    </th>
                  ))}

                  {/* Summary columns */}
                  <th className="py-3.5 px-3 text-center min-w-[65px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-l border-gray-200 dark:border-slate-800">
                    Bor (B)
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[65px] bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
                    Yo'q (Y)
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[75px] bg-indigo-50/50 dark:bg-indigo-950/20 text-[#3949ab] dark:text-indigo-300">
                    O'rtacha
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/70 text-xs">
                {classStudents.map((std, idx) => {
                  const m = studentMetrics[std.id] || {};
                  const nameParts = std.name.trim().split(' ');
                  const initials =
                    nameParts.length >= 2
                      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
                      : (std.name.slice(0, 2) || 'ST').toUpperCase();

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Sticky student name */}
                      <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-[#151f32] z-10 border-r border-gray-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 w-4 text-right">
                            {idx + 1}
                          </span>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <span
                            className="font-bold text-xs text-[#283593] dark:text-white truncate max-w-[130px]"
                            title={std.name}
                          >
                            {std.name}
                          </span>
                        </div>
                      </td>

                      {/* Day cells */}
                      {daysInMonth.map((d) => {
                        const rec = monthAttendanceMap[d.dateStr]?.[std.id];
                        const grade = rec?.grade ? Number(rec.grade) : null;
                        const status = rec?.status;

                        // Filtering display
                        const showGrade = (viewFilter === 'all' || viewFilter === 'grades') && grade;
                        const showStatus =
                          (viewFilter === 'all' || viewFilter === 'attendance') && status && !showGrade;

                        return (
                          <td
                            key={d.dateStr}
                            onClick={() =>
                              setEditingCell({
                                student: std,
                                dateStr: d.dateStr,
                                dayNumber: d.dayNumber,
                                currentRecord: rec || { status: null, grade: null, comment: '' },
                              })
                            }
                            className={`p-1 text-center border-r border-gray-100 dark:border-slate-800/60 cursor-pointer transition-all hover:bg-indigo-100/40 dark:hover:bg-slate-700/50 ${
                              d.isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/30 font-bold' : ''
                            } ${d.isWeekend ? 'bg-slate-50/50 dark:bg-slate-900/40' : ''}`}
                            title={`${std.name} · ${d.dayNumber}-${UZ_MONTHS[month]}: Bosib o'zgartiring`}
                          >
                            {showGrade ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black shadow-2xs ${
                                  grade === 5
                                    ? 'bg-emerald-500 text-white'
                                    : grade === 4
                                    ? 'bg-amber-500 text-white'
                                    : grade === 3
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {grade}
                              </span>
                            ) : showStatus ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-extrabold ${
                                  status === 'B' || status === 'P'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                                    : status === 'Y' || status === 'A'
                                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 font-black'
                                    : status === 'K'
                                    ? 'bg-amber-100 text-amber-700 font-bold'
                                    : 'bg-orange-100 text-orange-700 font-bold'
                                }`}
                              >
                                {status === 'P' ? 'B' : status === 'A' ? 'Y' : status}
                              </span>
                            ) : (
                              <span className="text-gray-200 dark:text-slate-700 text-[10px]">·</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10 border-l border-gray-200 dark:border-slate-800">
                        {m.presentCount || 0}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                        {m.absentCount || 0}
                      </td>
                      <td className="py-2 px-2 text-center bg-indigo-50/30 dark:bg-indigo-950/10">
                        {m.avgGrade ? (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                              Number(m.avgGrade) >= 4.5
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : Number(m.avgGrade) >= 3.5
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {m.avgGrade}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TABLE FOOTER: Live Class Summary Statistics ── */}
        <div className="p-4 px-6 border-t border-gray-200/80 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/60 flex items-center justify-between flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-extrabold text-[#283593] dark:text-white">
              Sinf ko'rsatkichi ({activeClass?.name}):
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
              <Users size={13} className="text-[#3949ab] dark:text-indigo-400" />
              Jami o'quvchilar: {classSummary.totalStudents} nafar
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Davomat darajasi: {classSummary.attRate}%
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
              <Sparkles size={13} className="text-amber-500" />
              Sinf o'rtacha bahosi: {classSummary.classAvg}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/sinflar`)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
            >
              Davomat olish sahifasiga o'tish →
            </button>
          </div>
        </div>
      </div>

      {/* ── QUICK CELL EDIT MODAL (When teacher clicks any cell in matrix) ── */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-5 w-full max-w-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#283593] dark:text-white">
                  {editingCell.student.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingCell.dayNumber}-{UZ_MONTHS[month]} {year} sanasi uchun baho yoki davomat
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {/* Grade choices */}
            <div>
              <label className="text-xs font-bold text-[#455a7a] dark:text-slate-300 mb-2 block">
                Baho qo'yish (2 - 5):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 4, 3, 2].map((g) => {
                  const isCur = Number(editingCell.currentRecord?.grade) === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleSaveCell('B', isCur ? null : g)}
                      className={`h-11 rounded-xl text-base font-black transition-all flex items-center justify-center shadow-xs ${
                        isCur
                          ? g === 5
                            ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                            : g === 4
                            ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                            : g === 3
                            ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                            : 'bg-rose-500 text-white ring-2 ring-rose-300'
                          : 'bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attendance choices */}
            <div>
              <label className="text-xs font-bold text-[#455a7a] dark:text-slate-300 mb-2 block">
                Davomat holati:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: 'B', label: 'Bor', color: 'emerald' },
                  { code: 'Y', label: "Yo'q", color: 'rose' },
                  { code: 'K', label: 'Kech', color: 'amber' },
                  { code: 'S', label: 'Sababli', color: 'orange' },
                ].map((item) => {
                  const isCur = editingCell.currentRecord?.status === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSaveCell(isCur ? null : item.code, isCur ? null : editingCell.currentRecord?.grade)}
                      className={`h-10 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center border shadow-xs ${
                        isCur
                          ? 'bg-[#3949ab] text-white border-[#3949ab]'
                          : 'bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear button */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSaveCell(null, null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                Belgilarni o'chirish
              </button>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-gray-200 transition-colors"
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
