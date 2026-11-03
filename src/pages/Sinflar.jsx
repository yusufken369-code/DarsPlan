import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2, X, School, UserPlus, User, Award, Edit3, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import StudentEditModal, { GRADE_CONFIG } from '../components/StudentEditModal';

export default function Sinflar() {
  const navigate = useNavigate();
  const { classes, addClass, deleteClass, students, addStudent, updateStudent, deleteStudent } = useData();
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submittingClass, setSubmittingClass] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // New Class Form State
  const [classForm, setClassForm] = useState({ name: '', room: '', student_count: '' });

  // New Student Form State
  const [studentForm, setStudentForm] = useState({
    name: '',
    phone: '',
    parent_phone: '',
    note: '',
  });

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;

    setSubmittingClass(true);
    const created = await addClass({
      name: classForm.name.trim(),
      student_count: Number(classForm.student_count) || 0,
      room: classForm.room.trim(),
    });
    setSubmittingClass(false);
    setShowAddClassModal(false);
    setClassForm({ name: '', room: '', student_count: '' });

    // Open attendance and students page directly for this newly created class!
    if (created) {
      navigate(`/sinflar/${created.id}`);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !selectedClass) return;

    setSubmittingStudent(true);
    await addStudent({
      class_id: selectedClass.id,
      name: studentForm.name.trim(),
      phone: studentForm.phone.trim(),
      parent_phone: studentForm.parent_phone.trim(),
      note: studentForm.note.trim(),
    });
    setSubmittingStudent(false);
    setStudentForm({ name: '', phone: '', parent_phone: '', note: '' });
  };

  const isEmpty = (classes || []).length === 0;

  // Selected class students
  const activeClassStudents = selectedClass
    ? (students || []).filter((s) => s.class_id === selectedClass.id)
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#283593] dark:text-white">Sinflar va guruhlar</h1>
          <p className="text-xs text-[#90a4ae] dark:text-slate-400 mt-0.5">
            Siz dars beradigan sinflar, guruhlar va ularning o'quvchilari
          </p>
        </div>
        <button
          onClick={() => setShowAddClassModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow-sm transition-all"
        >
          <Plus size={14} />
          <span>Sinf qo'shish</span>
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-[#151f32] rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col border border-transparent dark:border-slate-800 transition-colors duration-200">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl my-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#3949ab] dark:text-indigo-400 flex items-center justify-center mb-3">
              <Users size={26} />
            </div>
            <h2 className="text-base font-bold text-[#283593] dark:text-white mb-1">Hozircha sinflar yo'q</h2>
            <p className="text-xs text-[#90a4ae] dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
              O'zingiz dars o'tadigan birinchi sinfni qo'shing va o'quvchilar ro'yxatini shakllantiring.
            </p>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow transition-colors"
            >
              <Plus size={14} />
              <span>Sinf qo'shish</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const classStds = (students || []).filter((s) => s.class_id === cls.id);
              const count = classStds.length > 0 ? classStds.length : (cls.student_count || 0);

              return (
                <div
                  key={cls.id}
                  onClick={() => navigate(`/sinflar/${cls.id}`)}
                  className="p-5 rounded-3xl border border-gray-100 dark:border-slate-700/80 bg-[#f7f9fc] dark:bg-slate-800/60 hover:shadow-lg hover:border-indigo-200 dark:hover:border-slate-600 transition-all cursor-pointer relative group flex flex-col justify-between"
                  title="Sinf davomati va baholash sahifasiga o'tish"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 text-[#3949ab] dark:text-indigo-400 flex items-center justify-center shadow-xs font-bold text-sm">
                        <School size={20} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#3949ab] dark:text-indigo-300 font-extrabold text-[11px] flex items-center gap-1 group-hover:bg-[#3949ab] group-hover:text-white transition-colors">
                          <ClipboardCheck size={13} />
                          <span>Davomat</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`"${cls.name}" sinfini o'chirmoqchimisiz?`)) {
                              deleteClass(cls.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-lg text-[#283593] dark:text-white mt-3 leading-snug">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-[#90a4ae] dark:text-slate-400 mt-0.5">
                      Xona: <span className="text-[#455a7a] dark:text-slate-300 font-medium">{cls.room || 'Belgilanmagan'}</span>
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-gray-200/70 dark:border-slate-700/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#455a7a] dark:text-slate-300">
                      <Users size={14} className="text-[#3949ab] dark:text-indigo-400" />
                      <span>{count} nafar o'quvchi</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#3949ab] dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span>Ochish</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL 1: Yangi sinf qo'shish ── */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/80 pb-3">
              <h3 className="font-bold text-base text-[#283593] dark:text-white">Yangi sinf / guruh ochish</h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Sinf / Guruh nomi
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: 9-A yoki Ingliz tili A1"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Xona raqami / Bino
                </label>
                <input
                  type="text"
                  placeholder="masalan: 204-xona yoki 2-bino"
                  value={classForm.room}
                  onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                  Boshlang'ich o'quvchilar soni (ixtiyoriy)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="masalan: 25"
                  value={classForm.student_count}
                  onChange={(e) => setClassForm({ ...classForm, student_count: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] dark:bg-slate-900"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingClass}
                  className="flex-1 h-10 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow-sm transition-colors"
                >
                  {submittingClass ? 'Ochilmoqda…' : 'Guruhni ochish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Guruhdagi o'quvchilarni boshqarish va o'quvchi qo'shish ── */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700/80 bg-[#f7f9fc] dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ef5b5b] text-white flex items-center justify-center shadow-sm font-bold">
                  <School size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#283593] dark:text-white">
                    {selectedClass.name}
                  </h3>
                  <p className="text-xs text-[#90a4ae] dark:text-slate-400 mt-0.5">
                    {selectedClass.room ? `${selectedClass.room} · ` : ''}
                    Jami {activeClassStudents.length} nafar o'quvchi
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClass(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Form to add a student */}
              <div className="bg-[#f0f4ff] dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-[#283593] dark:text-white flex items-center gap-1.5 mb-3">
                  <UserPlus size={15} className="text-[#3949ab] dark:text-indigo-400" />
                  <span>Yangi o'quvchi qo'shish</span>
                </h4>

                <form onSubmit={handleAddStudent} className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

                    <div>
                      <label className="text-[11px] font-semibold text-[#455a7a] dark:text-slate-300 mb-1 block">
                        Eslatma / Izoh
                      </label>
                      <input
                        type="text"
                        placeholder="masalan: A'lochi yoki sardor"
                        value={studentForm.note}
                        onChange={(e) => setStudentForm({ ...studentForm, note: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-[#283593] dark:text-white focus:border-[#3949ab] focus:outline-none bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={submittingStudent || !studentForm.name.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3949ab] text-white text-xs font-bold hover:bg-[#303f9f] transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <Plus size={14} />
                      <span>{submittingStudent ? "Qo'shilmoqda…" : "O'quvchini qo'shish"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Students List */}
              <div>
                <h4 className="text-xs font-bold text-[#283593] dark:text-white mb-3 flex items-center justify-between">
                  <span>O'quvchilar ro'yxati ({activeClassStudents.length})</span>
                  <span className="text-[10px] text-[#90a4ae] dark:text-slate-400 font-normal">
                    Baholash uchun o'quvchi ustiga bosing
                  </span>
                </h4>

                {activeClassStudents.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl bg-[#fafbfe] dark:bg-slate-900/40">
                    <User size={24} className="mx-auto text-gray-400 dark:text-slate-500 mb-2" />
                    <p className="text-xs font-bold text-[#283593] dark:text-white">Hozircha o'quvchilar kiritilmagan</p>
                    <p className="text-[11px] text-[#90a4ae] dark:text-slate-400 mt-0.5">
                      Yuqoridagi formadan foydalanib o'quvchilarni birma-bir ro'yxatga oling.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {activeClassStudents.map((std, idx) => (
                      <div
                        key={std.id}
                        onClick={() => setEditingStudent(std)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#f7f9fc] dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 hover:bg-white hover:dark:bg-slate-800 hover:border-indigo-200 hover:dark:border-slate-600 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 text-[#3949ab] dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-gray-200 dark:border-slate-700 flex-shrink-0 shadow-sm">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-bold text-[#283593] dark:text-white truncate">{std.name}</p>

                              {/* Grade badge (2..5) - Exact color styling, no emoji */}
                              {std.grade && GRADE_CONFIG[std.grade] && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 shadow-xs ${GRADE_CONFIG[std.grade].lightBg} dark:bg-slate-900/80`}
                                  title={`Baho: ${std.grade} - ${GRADE_CONFIG[std.grade].label}`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${GRADE_CONFIG[std.grade].bg}`} />
                                  Baho: {std.grade}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-[#90a4ae] dark:text-slate-400 mt-1 flex-wrap">
                              {std.phone && <span>Tel: {std.phone}</span>}
                              {std.parent_phone && <span>Ota-ona: {std.parent_phone}</span>}
                              {std.note && (
                                <span className="bg-indigo-50 dark:bg-indigo-950/60 text-[#3949ab] dark:text-indigo-300 px-1.5 py-0.2 rounded font-medium">
                                  {std.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStudent(std);
                            }}
                            className="text-[#3949ab] dark:text-indigo-400 hover:text-[#283593] dark:hover:text-white p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                            title="Tahrirlash / Baholash"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`"${std.name}"ni ro'yxatdan o'chirmoqchimisiz?`)) {
                                deleteStudent(std.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                            title="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700/80 flex justify-end bg-gray-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-[#455a7a] dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: O'quvchi ma'lumotlari, daromad va 2-5 baholarni tahrirlash ── */}
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
