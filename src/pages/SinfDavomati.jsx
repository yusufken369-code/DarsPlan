import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  Save,
  School,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatToDateString } from '../utils/dateUtils';
import StudentEditModal, { GRADE_CONFIG } from '../components/StudentEditModal';

/* ── ATTENDANCE CODE CONFIGURATION ── */
const ATTENDANCE_CODES = [
  {
    code: 'B',
    label: 'Bor',
    title: 'Darsga kelgan (Bor)',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/20',
    badgeBg: 'bg-emerald-500 text-white',
    ringColor: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
    dotBg: 'bg-emerald-500',
  },
  {
    code: 'Y',
    label: "Yo'q",
    title: "Darsga kelmagan (Yo'q)",
    activeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/20',
    badgeBg: 'bg-rose-500 text-white',
    ringColor: 'border-rose-500 text-rose-600 dark:text-rose-400',
    dotBg: 'bg-rose-500',
  },
  {
    code: 'K',
    label: 'Kech',
    title: 'Kechikkan (Kech)',
    activeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/20',
    badgeBg: 'bg-amber-500 text-white',
    ringColor: 'border-amber-500 text-amber-600 dark:text-amber-400',
    dotBg: 'bg-amber-500',
  },
  {
    code: 'S',
    label: 'Sababli',
    title: 'Sababli kelmagan (Sababli)',
    activeBg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-400 text-orange-700 dark:text-orange-300 ring-2 ring-orange-400/20',
    badgeBg: 'bg-orange-500 text-white',
    ringColor: 'border-orange-500 text-orange-600 dark:text-orange-400',
    dotBg: 'bg-orange-500',
  },
];

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

export default function SinfDavomati() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const {
    classes,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    getAttendance,
    saveAttendance,
  } = useData();

  // Selected date (defaults to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => formatToDateString(new Date()));

  // Active class record (with fallback so it never fails)
  const currentClass = useMemo(() => {
    const found = (classes || []).find(
      (c) => String(c.id) === String(classId) || c.name.toLowerCase().trim() === String(classId).toLowerCase().trim()
    );
    if (found) return found;
    return {
      id: classId,
      name: classId,
      room: '',
      student_count: 0,
    };
  }, [classes, classId]);

  // Students in this specific class / group
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    const targetId = String(currentClass.id).toLowerCase().trim();
    const targetName = String(currentClass.name || '').toLowerCase().trim();
    return (students || []).filter((s) => {
      const cid = String(s.class_id || '').toLowerCase().trim();
      const gname = String(s.group_name || '').toLowerCase().trim();
      return cid === targetId || cid === targetName || gname === targetId || gname === targetName;
    });
  }, [students, currentClass]);

  // Attendance & grades dictionary for this date:
  // { [studentId]: { status: 'B'|'Y'|'K'|'S'|null, grade: 2..5|null, comment: string } }
  const [records, setRecords] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSavedMsg, setAutoSavedMsg] = useState(false);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [commentStudent, setCommentStudent] = useState(null); // student for note dialog
  const [tempComment, setTempComment] = useState('');

  // New student form
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    phone: '',
    parent_phone: '',
    note: '',
  });
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // Helper to immediately persist records to backend & localStorage
  const persistRecords = async (newRecords) => {
    if (!currentClass) return;
    setAutoSaving(true);
    try {
      await saveAttendance(currentClass.id, selectedDate, newRecords, currentClass.name);
      setAutoSavedMsg(true);
      setTimeout(() => setAutoSavedMsg(false), 2500);
    } catch (err) {
      console.error('Auto save error:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  // Load attendance data when classId or selectedDate changes
  useEffect(() => {
    let isMounted = true;
    async function fetchAttendance() {
      if (!currentClass) return;
      setLoadingAttendance(true);
      try {
        const data = await getAttendance(currentClass.id, selectedDate, currentClass.name);
        if (isMounted) {
          if (data && data.records) {
            setRecords(data.records);
          } else {
            // Default: if no records for this date yet, preserve any student's general grade and set status to null
            const initial = {};
            classStudents.forEach((std) => {
              initial[std.id] = {
                status: null,
                grade: std.grade ? Number(std.grade) : null,
                comment: '',
              };
            });
            setRecords(initial);
          }
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
      } finally {
        if (isMounted) setLoadingAttendance(false);
      }
    }
    fetchAttendance();
    return () => {
      isMounted = false;
    };
  }, [currentClass?.id, currentClass?.name, selectedDate, classStudents.length]);

  // Handle setting attendance status for a student (with immediate auto-save)
  const handleSetStatus = (studentId, code) => {
    setRecords((prev) => {
      const current = prev[studentId] || { status: null, grade: null, comment: '' };
      const nextStatus = current.status === code ? null : code;
      const updated = {
        ...prev,
        [studentId]: {
          ...current,
          status: nextStatus,
        },
      };
      persistRecords(updated);
      return updated;
    });
  };

  // Handle setting grade for a student (2..5) (with immediate auto-save)
  const handleSetGrade = (studentId, gradeNum) => {
    setRecords((prev) => {
      const current = prev[studentId] || { status: null, grade: null, comment: '' };
      const nextGrade = current.grade === gradeNum ? null : gradeNum;
      const updated = {
        ...prev,
        [studentId]: {
          ...current,
          grade: nextGrade,
        },
      };
      persistRecords(updated);
      return updated;
    });
  };

  // Mark all students present (Bor - B) (with immediate auto-save)
  const handleMarkAllPresent = () => {
    setRecords((prev) => {
      const updated = { ...prev };
      classStudents.forEach((std) => {
        const cur = updated[std.id] || { grade: null, comment: '' };
        updated[std.id] = { ...cur, status: 'B' };
      });
      persistRecords(updated);
      return updated;
    });
  };

  // Submit / Save attendance (manual button feedback)
  const handleSubmit = async () => {
    if (!currentClass) return;
    setSaving(true);
    setSaveSuccessMsg('');
    try {
      await saveAttendance(currentClass.id, selectedDate, records, currentClass.name);
      setSaveSuccessMsg("Davomat va baholar muvaffaqiyatli saqlandi!");
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save attendance error:', err);
      alert("Davomatni saqlashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  // Add new student handler
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentForm.name.trim() || !currentClass) return;
    setSubmittingStudent(true);
    await addStudent({
      class_id: currentClass.id,
      group_name: currentClass.name,
      name: newStudentForm.name.trim(),
      phone: newStudentForm.phone.trim(),
      parent_phone: newStudentForm.parent_phone.trim(),
      note: newStudentForm.note.trim(),
    });
    setSubmittingStudent(false);
    setShowAddStudentModal(false);
    setNewStudentForm({ name: '', phone: '', parent_phone: '', note: '' });
  };

  // Date navigation helpers
  const handleDateChange = (offsetDays) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offsetDays);
    setSelectedDate(formatToDateString(date));
  };

  // Stats calculation (B = Bor, Y = Yo'q, K = Kech, S = Sababli)
  const stats = useMemo(() => {
    let b = 0;
    let y = 0;
    let k = 0;
    let s = 0;
    let graded = 0;
    classStudents.forEach((std) => {
      const r = records[std.id];
      if (r?.status === 'B' || r?.status === 'P') b++;
      else if (r?.status === 'Y' || r?.status === 'A') y++;
      else if (r?.status === 'K') k++;
      else if (r?.status === 'S') s++;

      if (r?.grade) graded++;
    });
    return { b, y, k, s, graded, total: classStudents.length };
  }, [classStudents, records]);

  // Format date display (e.g. 3-noyabr, 2026-yil)
  const formattedDateHeader = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const monthName = UZ_MONTHS[m - 1] || '';
      return `${d}-${monthName}, ${y}-yil`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  if (!currentClass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] p-6 text-center">
        <School size={36} className="text-gray-400 mb-2" />
        <h2 className="text-base font-bold text-[#283593] dark:text-white">Sinf topilmadi</h2>
        <p className="text-xs text-[#90a4ae] mt-1 mb-4">
          Qidirilayotgan sinf yoki guruh tizimda mavjud emas yoki o'chirilgan bo'lishi mumkin.
        </p>
        <button
          onClick={() => navigate('/sinflar')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3949ab] text-white text-xs font-bold shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Sinflar ro'yxatiga qaytish</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto pb-16 select-none animate-in fade-in duration-150">
      {/* ── TOP HEADER: Back button + Title + Date Picker Card (Like user image) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back & Class information */}
        <div>
          <button
            onClick={() => navigate('/sinflar')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#3949ab] dark:text-indigo-400 hover:text-[#ef5b5b] transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            <span>Sinflar va guruhlar ro'yxatiga qaytish</span>
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[#283593] dark:text-white tracking-tight">
              Attendance · Davomat va Baholash
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/70 text-[#ef5b5b] text-xs font-extrabold shadow-2xs">
              {currentClass.name}
            </span>

            {/* Auto-Save live indicator */}
            {autoSaving ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-[#3949ab] dark:text-indigo-300 font-bold text-[11px] animate-pulse border border-indigo-200 dark:border-indigo-800">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3949ab]" />
                Saqlanmoqda…
              </span>
            ) : autoSavedMsg ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 animate-in fade-in duration-100">
                <Check size={11} strokeWidth={3} />
                Avtomatik saqlandi ✓
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                • Avto-saqlash yoqilgan
              </span>
            )}
          </div>
          <p className="text-xs text-[#90a4ae] dark:text-slate-400 mt-0.5">
            {currentClass.room ? `Xona: ${currentClass.room} · ` : ''}Jami {classStudents.length} nafar o'quvchi
          </p>
        </div>

        {/* Right: Date selector card matching the user's uploaded screenshot */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700/80 rounded-2xl p-2 px-3.5 shadow-xs">
            <div className="flex items-center gap-2 mr-3">
              <button
                type="button"
                onClick={() => handleDateChange(-1)}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title="Oldingi kun"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(1)}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title="Keyingi kun"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="relative flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-[#90a4ae] dark:text-slate-400 uppercase tracking-wider leading-none mb-1">
                Taking attendance for
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[#283593] dark:text-white capitalize cursor-pointer">
                  {formattedDateHeader}
                </span>
                <label className="cursor-pointer text-[#3949ab] dark:text-indigo-400 hover:scale-110 transition-transform">
                  <CalendarIcon size={16} />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="absolute opacity-0 pointer-events-none inset-0"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(formatToDateString(new Date()))}
            className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#3949ab] dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            Bugun
          </button>
        </div>
      </div>

      {/* ── SUCCESS NOTIFICATION BANNER ── */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg('')}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── STATS & CONTROLS TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#151f32] p-3.5 px-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
        {/* Left: Quick Stat Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-[#455a7a] dark:text-slate-300 mr-1">Statistika:</span>
          <span className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold">
            Jami: {stats.total}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Bor (B): {stats.b}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Yo'q (Y): {stats.y}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Kech (K): {stats.k}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/60 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Sababli (S): {stats.s}
          </span>
        </div>

        {/* Right: Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors active:scale-95"
            title="Hamma o'quvchilarni 'Bor (B)' qilib belgilash"
          >
            <UserCheck size={14} />
            <span>Hammasini bor qilish</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3949ab] text-white text-xs font-bold hover:bg-[#303f9f] transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>O'quvchi qo'shish</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ATTENDANCE TABLE (Matches user screenshot) ── */}
      <div className="bg-white dark:bg-[#151f32] rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {classStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-slate-800 text-[#3949ab] dark:text-indigo-400 flex items-center justify-center mb-3">
              <Users size={30} />
            </div>
            <h3 className="text-base font-bold text-[#283593] dark:text-white">Ushbu guruhda o'quvchilar yo'q</h3>
            <p className="text-xs text-[#90a4ae] dark:text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
              Davomat va baholashni boshlash uchun avval guruhga o'quvchilarni qo'shing.
            </p>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#ef5b5b] hover:bg-[#e53935] text-white text-xs font-bold shadow-sm transition-all"
            >
              <UserPlus size={15} />
              <span>Birinchi o'quvchini qo'shish</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              {/* Table Header matching the screenshot */}
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/60 text-[#455a7a] dark:text-slate-300 text-xs font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6 w-[28%]">Students</th>
                  <th className="py-4 px-4 w-[34%]">Attendance Codes</th>
                  <th className="py-4 px-4 w-[24%]">Baholar (2 - 5)</th>
                  <th className="py-4 px-6 w-[14%] text-center">Comments</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80 text-xs">
                {classStudents.map((std, idx) => {
                  const rec = records[std.id] || { status: null, grade: null, comment: '' };
                  const selectedCode = rec.status;
                  const selectedGrade = rec.grade;
                  const hasComment = Boolean(rec.comment && rec.comment.trim());

                  // Initials
                  const nameParts = std.name.trim().split(' ');
                  const initials = nameParts.length >= 2
                    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
                    : (std.name.slice(0, 2) || 'ST').toUpperCase();

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Student avatar + name + ID */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setEditingStudent(std)}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                            title="O'quvchi profilini tahrirlash"
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              onClick={() => setEditingStudent(std)}
                              className="font-extrabold text-xs sm:text-sm text-[#283593] dark:text-white truncate cursor-pointer hover:underline"
                            >
                              {std.name}
                            </div>
                            <div className="text-[11px] text-[#90a4ae] dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>#{idx + 1}</span>
                              <span>•</span>
                              <span>{currentClass.name}</span>
                              {std.phone && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[100px]">{std.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Attendance Codes (B, Y, K, S: Bor, Yo'q, Kech, Sababli) matching user screenshot */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {ATTENDANCE_CODES.map((item) => {
                            const isSelected =
                              selectedCode === item.code ||
                              (item.code === 'B' && selectedCode === 'P') ||
                              (item.code === 'Y' && selectedCode === 'A');
                            return (
                              <button
                                key={item.code}
                                type="button"
                                onClick={() => handleSetStatus(std.id, item.code)}
                                className={`h-8 min-w-[50px] px-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-extrabold transition-all active:scale-95 shadow-2xs ${
                                  isSelected
                                    ? item.activeBg
                                    : 'bg-white dark:bg-slate-800/70 border-gray-200 dark:border-slate-700 text-[#455a7a] dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                                title={item.title}
                              >
                                {isSelected ? (
                                  <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${item.badgeBg}`}
                                  >
                                    <Check size={11} strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span
                                    className={`w-3.5 h-3.5 rounded-full border-2 ${item.ringColor}`}
                                  />
                                )}
                                <span>{item.code}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* 3. Baholar (2..5) pure color grading */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[2, 3, 4, 5].map((g) => {
                            const cfg = GRADE_CONFIG[g];
                            const isSelected = selectedGrade === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => handleSetGrade(std.id, g)}
                                className={`w-8 h-8 rounded-xl font-black text-xs transition-all flex items-center justify-center border active:scale-95 shadow-2xs ${
                                  isSelected
                                    ? `${cfg.bg} text-white ${cfg.border} ring-2 ring-offset-1 ring-slate-400 scale-105`
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                                }`}
                                title={`Baho: ${g} (${cfg.label})`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* 4. Comments (Izoh / Eslatma) with chat bubble icon */}
                      <td className="py-3.5 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCommentStudent(std);
                            setTempComment(rec.comment || '');
                          }}
                          className={`p-2 rounded-xl transition-all inline-flex items-center justify-center relative ${
                            hasComment
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 shadow-2xs'
                              : 'text-gray-400 hover:text-[#3949ab] dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
                          }`}
                          title={hasComment ? `Izoh: "${rec.comment}"` : "Izoh / Eslatma qoldirish"}
                        >
                          <MessageSquare size={17} />
                          {hasComment && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TABLE FOOTER: Submit Button (Matching the blue Submit button in user image) ── */}
        <div className="p-4 px-6 border-t border-gray-200/80 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-[#90a4ae] dark:text-slate-400 flex items-center gap-2 flex-wrap">
            <span>
              Davomat va baholar <strong className="text-[#283593] dark:text-slate-200">{formattedDateHeader}</strong> sanasi uchun saqlanadi.
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1">
              <Check size={11} strokeWidth={3} />
              Har bir bosish darhol avtomatik saqlanadi
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/sinflar')}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-[#455a7a] dark:text-slate-200 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Chiqish
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={15} />
              <span>{saving ? 'Saqlanmoqda…' : 'Submit / Saqlash'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: Izoh / Eslatma qoldirish ── */}
      {commentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={17} className="text-[#3949ab] dark:text-indigo-400" />
                <h3 className="font-extrabold text-sm text-[#283593] dark:text-white truncate">
                  {commentStudent.name} uchun izoh
                </h3>
              </div>
              <button
                onClick={() => setCommentStudent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X size={17} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1.5 block">
                Ushbu dars bo'yicha eslatma:
              </label>
              <textarea
                rows="3"
                placeholder="masalan: Darsda juda faol qatnashdi, uy vazifasi to'liq..."
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                className="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-[#f7f9fc] dark:bg-slate-900 text-xs text-[#283593] dark:text-white focus:outline-none focus:border-[#3949ab] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  // Clear note and persist
                  setRecords((prev) => {
                    const cur = prev[commentStudent.id] || { status: null, grade: null, comment: '' };
                    const updated = {
                      ...prev,
                      [commentStudent.id]: {
                        ...cur,
                        comment: '',
                      },
                    };
                    persistRecords(updated);
                    return updated;
                  });
                  setCommentStudent(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
              >
                O'chirish
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save note and persist
                  setRecords((prev) => {
                    const cur = prev[commentStudent.id] || { status: null, grade: null, comment: '' };
                    const updated = {
                      ...prev,
                      [commentStudent.id]: {
                        ...cur,
                        comment: tempComment.trim(),
                      },
                    };
                    persistRecords(updated);
                    return updated;
                  });
                  setCommentStudent(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#3949ab] hover:bg-[#303f9f] text-white text-xs font-bold transition-all shadow-sm"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Yangi o'quvchi qo'shish ── */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/80 pb-3">
              <h3 className="font-extrabold text-sm text-[#283593] dark:text-white">
                "{currentClass.name}"ga o'quvchi qo'shish
              </h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  O'quvchi F.I.SH. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Aliyev Jasur"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={newStudentForm.phone}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Ota-onasi telefoni
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 987 65 43"
                  value={newStudentForm.parent_phone}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, parent_phone: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Izoh / Eslatma
                </label>
                <input
                  type="text"
                  placeholder="masalan: A'lochi o'quvchi"
                  value={newStudentForm.note}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, note: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingStudent}
                  className="flex-1 h-10 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] transition-colors"
                >
                  {submittingStudent ? "Qo'shilmoqda…" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: O'quvchi umumiy ma'lumotlarini tahrirlash ── */}
      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={async (id, updates) => {
            await updateStudent(id, updates);
            setEditingStudent(null);
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
