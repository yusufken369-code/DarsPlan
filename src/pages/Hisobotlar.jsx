import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  Phone,
  FileText,
  PieChart,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { isStudentInClass } from '../utils/dateUtils';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

export default function Hisobotlar() {
  const navigate = useNavigate();
  const { classes, students, attendanceList, lessons } = useData();

  // Class selection: 'all' or classId
  const [selectedClassId, setSelectedClassId] = useState('all');

  // Period: 'this_month' | 'last_month' | 'quarter_1' | 'all_year'
  const [period, setPeriod] = useState('this_month');

  const curYear = new Date().getFullYear();
  const curMonth = new Date().getMonth(); // 0-indexed

  // Filter attendance records by selected class & period
  const filteredData = useMemo(() => {
    let list = attendanceList || [];

    // Filter by class
    if (selectedClassId !== 'all') {
      const target = String(selectedClassId).toLowerCase().trim();
      const clsObj = classes.find((c) => String(c.id).toLowerCase() === target || c.name.toLowerCase() === target);
      const targetName = clsObj?.name?.toLowerCase().trim() || target;

      list = list.filter((a) => {
        const aId = String(a.class_id || '').toLowerCase().trim();
        const aName = String(a.class_name || '').toLowerCase().trim();
        return aId === target || aName === target || aId === targetName || aName === targetName;
      });
    }

    // Filter by period
    list = list.filter((a) => {
      if (!a.date) return false;
      const [y, m] = a.date.split('-').map(Number);
      if (period === 'this_month') {
        return y === curYear && m === curMonth + 1;
      }
      if (period === 'last_month') {
        const lastM = curMonth === 0 ? 12 : curMonth;
        const lastY = curMonth === 0 ? curYear - 1 : curYear;
        return y === lastY && m === lastM;
      }
      if (period === 'quarter_1') {
        // Sep, Oct, Nov (months 9, 10, 11)
        return m >= 9 && m <= 11;
      }
      return true; // all_year
    });

    return list;
  }, [attendanceList, selectedClassId, period, classes, curYear, curMonth]);

  // Target students
  const targetStudents = useMemo(() => {
    if (selectedClassId === 'all') {
      return students || [];
    }
    return (students || []).filter((s) => isStudentInClass(s, selectedClassId, classes));
  }, [students, selectedClassId, classes]);

  // Aggregate stats across all records in period
  const stats = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalReason = 0;
    const gradeCounts = { 5: 0, 4: 0, 3: 0, 2: 0 };
    let sumGrades = 0;
    let totalGrades = 0;

    // Per student aggregation: studentId -> { present, absent, grades: [] }
    const studentStats = {};
    targetStudents.forEach((s) => {
      studentStats[s.id] = { student: s, present: 0, absent: 0, late: 0, grades: [] };
    });

    filteredData.forEach((att) => {
      if (!att.records) return;
      Object.entries(att.records).forEach(([stdId, rec]) => {
        if (!rec) return;

        // Overall counters
        if (rec.status === 'B' || rec.status === 'P') totalPresent++;
        else if (rec.status === 'Y' || rec.status === 'A') totalAbsent++;
        else if (rec.status === 'K') totalLate++;
        else if (rec.status === 'S') totalReason++;

        if (rec.grade) {
          const g = Number(rec.grade);
          if (gradeCounts[g] !== undefined) gradeCounts[g]++;
          sumGrades += g;
          totalGrades++;
        }

        // Student counters
        if (studentStats[stdId]) {
          if (rec.status === 'B' || rec.status === 'P') studentStats[stdId].present++;
          else if (rec.status === 'Y' || rec.status === 'A') studentStats[stdId].absent++;
          else if (rec.status === 'K') studentStats[stdId].late++;

          if (rec.grade) {
            studentStats[stdId].grades.push(Number(rec.grade));
          }
        }
      });
    });

    const totalAttendanceMarks = totalPresent + totalAbsent;
    const attendanceRate =
      totalAttendanceMarks > 0 ? ((totalPresent / totalAttendanceMarks) * 100).toFixed(1) : 100;

    const avgGrade = totalGrades > 0 ? (sumGrades / totalGrades).toFixed(1) : '-';

    // Top performers (highest average grade and good attendance)
    const performers = Object.values(studentStats)
      .map((item) => {
        const avg =
          item.grades.length > 0
            ? (item.grades.reduce((a, b) => a + b, 0) / item.grades.length).toFixed(1)
            : null;
        return {
          ...item,
          avgGrade: avg,
        };
      })
      .filter((item) => item.avgGrade !== null)
      .sort((a, b) => Number(b.avgGrade) - Number(a.avgGrade));

    // Students at risk (most absences)
    const atRiskStudents = Object.values(studentStats)
      .filter((item) => item.absent > 0)
      .sort((a, b) => b.absent - a.absent);

    return {
      totalLessons: filteredData.length,
      totalPresent,
      totalAbsent,
      totalLate,
      totalReason,
      attendanceRate,
      avgGrade,
      totalGrades,
      gradeCounts,
      topPerformers: performers.slice(0, 5),
      atRiskStudents: atRiskStudents.slice(0, 5),
    };
  }, [filteredData, targetStudents]);

  // Export report as CSV
  const handleExportCSV = () => {
    let csv = `\uFEFF`; // UTF-8 BOM
    csv += `DarsPlan - Davomat va Baholar Hisoboti\n`;
    csv += `Sinf: ${selectedClassId === 'all' ? 'Barcha sinflar' : selectedClassId}; Davr: ${period}\n\n`;

    csv += `Umumiy ko'rsatkichlar:\n`;
    csv += `O'tilgan darslar soni;${stats.totalLessons}\n`;
    csv += `Davomat foizi;${stats.attendanceRate}%\n`;
    csv += `O'rtacha baho;${stats.avgGrade}\n`;
    csv += `Bor (kelgan);${stats.totalPresent}\n`;
    csv += `Yo'q (qoldirilgan);${stats.totalAbsent}\n`;
    csv += `Kechikkanlar;${stats.totalLate}\n`;
    csv += `Sababli;${stats.totalReason}\n\n`;

    csv += `Top a'lochi o'quvchilar:\n`;
    csv += `O'quvchi;O'rtacha baho;Baholar soni\n`;
    stats.topPerformers.forEach((p) => {
      csv += `"${p.student.name}";${p.avgGrade};${p.grades.length}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hisobot_${selectedClassId}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const periodLabel =
    period === 'this_month'
      ? `Joriy oy (${UZ_MONTHS[curMonth]} ${curYear})`
      : period === 'last_month'
      ? `O'tgan oy (${UZ_MONTHS[(curMonth + 11) % 12]})`
      : period === 'quarter_1'
      ? `1-Chorak (Sentabr - Noyabr)`
      : `Barcha davr`;

  return (
    <div className="flex flex-col gap-6 w-full pb-16 select-none animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#283593] dark:text-white tracking-tight">
                Hisobotlar va Tahlil
              </h1>
              <p className="text-xs text-[#90a4ae] dark:text-slate-400">
                Sinf davomati, o'zlashtirish tahlili va ma'muriyat uchun tayyor statistika
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download size={14} />
            <span>Excel hisobot</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-50 text-xs font-bold shadow-xs transition-colors"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Chop etish</span>
          </button>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="bg-white dark:bg-[#151f32] p-4 px-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Class selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-[#455a7a] dark:text-slate-400 mr-1 flex-shrink-0">
            Sinf:
          </span>
          <button
            onClick={() => setSelectedClassId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              selectedClassId === 'all'
                ? 'bg-[#3949ab] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200'
            }`}
          >
            Barcha sinflar
          </button>
          {(classes || []).map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                selectedClassId === cls.id
                  ? 'bg-[#3949ab] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200'
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <span className="text-xs font-bold text-[#455a7a] dark:text-slate-400 mr-1 flex-shrink-0">
            Davr:
          </span>
          {[
            { id: 'this_month', label: 'Shu oy' },
            { id: 'last_month', label: "O'tgan oy" },
            { id: 'quarter_1', label: '1-Chorak' },
            { id: 'all_year', label: 'Barchasi' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                period === p.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#3949ab] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Darslar soni */}
        <div className="bg-white dark:bg-[#151f32] p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#90a4ae] dark:text-slate-400 uppercase tracking-wider">
              O'tilgan darslar
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#283593] dark:text-white">
              {stats.totalLessons}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">ta dars</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {periodLabel} bo'yicha hisoblandi
            </div>
          </div>
        </div>

        {/* 2. Davomat foizi */}
        <div className="bg-white dark:bg-[#151f32] p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#90a4ae] dark:text-slate-400 uppercase tracking-wider">
              Umumiy Davomat
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.attendanceRate}%
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                {Number(stats.attendanceRate) >= 90 ? "A'lo" : "O'rtacha"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats.totalPresent} ta qatnashish, {stats.totalAbsent} ta qoldirish
            </div>
          </div>
        </div>

        {/* 3. O'rtacha baho */}
        <div className="bg-white dark:bg-[#151f32] p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#90a4ae] dark:text-slate-400 uppercase tracking-wider">
              O'rtacha O'zlashtirish
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#283593] dark:text-white">
              {stats.avgGrade}
              <span className="text-sm font-semibold text-slate-400 ml-1">/ 5.0</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Jami {stats.totalGrades} ta qo'yilgan baho asosida
            </div>
          </div>
        </div>

        {/* 4. O'quvchilar soni */}
        <div className="bg-white dark:bg-[#151f32] p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#90a4ae] dark:text-slate-400 uppercase tracking-wider">
              O'quvchilar
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#283593] dark:text-white">
              {targetStudents.length}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">nafar</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {selectedClassId === 'all' ? 'Barcha sinflar bo\'yicha' : 'Tanlangan sinfda'}
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN ROW: Grade Breakdown + Attendance Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Baholar taqsimoti */}
        <div className="bg-white dark:bg-[#151f32] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-[#3949ab] dark:text-indigo-400" />
                <h3 className="font-extrabold text-sm text-[#283593] dark:text-white">
                  Baholar Taqsimoti (O'zlashtirish)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">Jami: {stats.totalGrades} ta</span>
            </div>

            <div className="space-y-3.5">
              {[
                { grade: 5, label: "5 (A'lo)", color: 'bg-emerald-500', count: stats.gradeCounts[5] },
                { grade: 4, label: '4 (Yaxshi)', color: 'bg-amber-500', count: stats.gradeCounts[4] },
                { grade: 3, label: '3 (Qoniqarli)', color: 'bg-orange-500', count: stats.gradeCounts[3] },
                { grade: 2, label: '2 (Qoniqarsiz)', color: 'bg-rose-500', count: stats.gradeCounts[2] },
              ].map((item) => {
                const pct = stats.totalGrades > 0 ? Math.round((item.count / stats.totalGrades) * 100) : 0;
                return (
                  <div key={item.grade}>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.count} ta ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Sinf sifati (4 va 5 baholar):</span>
            <span className="font-black text-[#283593] dark:text-indigo-300">
              {stats.totalGrades > 0
                ? Math.round(((stats.gradeCounts[5] + stats.gradeCounts[4]) / stats.totalGrades) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Davomat tahlili */}
        <div className="bg-white dark:bg-[#151f32] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" />
                <h3 className="font-extrabold text-sm text-[#283593] dark:text-white">
                  Davomat Ko'rsatkichlari Tafsiloti
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                {stats.attendanceRate}% qatnashish
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
                  Bor (Darsga kelgan)
                </span>
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                  {stats.totalPresent}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block mb-1">
                  Yo'q (Sababsiz)
                </span>
                <span className="text-2xl font-black text-rose-800 dark:text-rose-200">
                  {stats.totalAbsent}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block mb-1">
                  Kechikkanlar (K)
                </span>
                <span className="text-2xl font-black text-amber-800 dark:text-amber-200">
                  {stats.totalLate}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40">
                <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 block mb-1">
                  Sababli kelmagan (S)
                </span>
                <span className="text-2xl font-black text-orange-800 dark:text-orange-200">
                  {stats.totalReason}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            * Dars qoldirishlar bo'yicha ko'rsatkichlar o'quvchining jurnaldagi barcha davomat qaydlariga asosan chiqarilgan.
          </p>
        </div>
      </div>

      {/* ── TWO COLUMN ROW: Top Performers & At-Risk Students ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ilg'or o'quvchilar (Top reyting) */}
        <div className="bg-white dark:bg-[#151f32] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-sm text-[#283593] dark:text-white">
                  Eng Yaxshi O'zlashtirgan O'quvchilar (Top 5)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#3949ab] dark:text-indigo-400">A'lochilar</span>
            </div>

            {stats.topPerformers.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Hozircha baholangan o'quvchilar mavjud emas.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {stats.topPerformers.map((item, idx) => (
                  <div key={item.student.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-white'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#283593] dark:text-white truncate block">
                          {item.student.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.grades.length} ta baho · {item.present} ta darsda qatnashgan
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-2xs">
                        {item.avgGrade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => navigate('/jurnal')}
              className="text-xs font-bold text-[#3949ab] dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Jurnalda to'liq ko'rish</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Ko'p dars qoldirgan o'quvchilar (Diqqat talab) */}
        <div className="bg-white dark:bg-[#151f32] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" />
                <h3 className="font-extrabold text-sm text-[#283593] dark:text-white">
                  Diqqat Talab O'quvchilar (Dars Qoldirganlar)
                </h3>
              </div>
              <span className="text-xs font-bold text-rose-500">Antireyting</span>
            </div>

            {stats.atRiskStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
                ✓ Ajoyib! Bu davrda dars qoldirgan o'quvchilar yo'q!
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {stats.atRiskStudents.map((item) => (
                  <div key={item.student.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">
                        {item.student.name}
                      </span>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        {item.student.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {item.student.phone}
                          </span>
                        )}
                        {item.student.parent_phone && (
                          <span className="text-[#ef5b5b]">Ota-onasi: {item.student.parent_phone}</span>
                        )}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold text-xs">
                      {item.absent} ta dars qoldirdi
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 text-[11px] text-slate-400">
            Dars qoldirish sabablarini aniqlash uchun ota-onalar bilan bog'lanish tavsiya etiladi.
          </div>
        </div>
      </div>

      {/* ── OFFICIAL SUMMARY MEMO FOR ADMINISTRATION (Ready text report) ── */}
      <div className="bg-white dark:bg-[#151f32] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-[#3949ab] dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm text-[#283593] dark:text-white">
            Maktab Ma'muriyati Uchun Rasmiy Hisobot Varaqasi
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
          <p className="font-bold text-[#283593] dark:text-white mb-2">
            HISOBOT: {selectedClassId === 'all' ? 'Barcha sinflar bo\'yicha umumiy' : `Sinf: ${selectedClassId}`}
          </p>
          <p className="mb-1">
            • <strong>Hisobot davri:</strong> {periodLabel}
          </p>
          <p className="mb-1">
            • <strong>Jami o'quvchilar soni:</strong> {targetStudents.length} nafar
          </p>
          <p className="mb-1">
            • <strong>O'tilgan darslar soni:</strong> {stats.totalLessons} ta dars
          </p>
          <p className="mb-1">
            • <strong>Davomat ko'rsatkichi:</strong> {stats.attendanceRate}% (Kelgan: {stats.totalPresent}, Qoldirilgan: {stats.totalAbsent})
          </p>
          <p className="mb-1">
            • <strong>O'rtacha sinf o'zlashtirish bali:</strong> {stats.avgGrade} / 5.0
          </p>
          <p className="mb-1">
            • <strong>A'lochi o'quvchilar soni (5 bahochilar):</strong> {stats.gradeCounts[5]} ta baho
          </p>
          <p className="mt-3 text-[11px] text-slate-400 font-sans">
            Tizim orqali avtomatik shakllantirildi. Ushbu hisobotni to'g'ridan-to'g'ri chop etishingiz yoki Excel fayl sifatida saqlab olishingiz mumkin.
          </p>
        </div>
      </div>
    </div>
  );
}
