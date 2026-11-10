import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2, X, School, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { isStudentInClass } from '../utils/dateUtils';

export default function Sinflar() {
  const navigate = useNavigate();
  const { classes, addClass, deleteClass, students } = useData();
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [submittingClass, setSubmittingClass] = useState(false);

  // New Class Form State
  const [classForm, setClassForm] = useState({ name: '', room: '', student_count: '' });

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

  const isEmpty = (classes || []).length === 0;

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
              const classStds = (students || []).filter((s) => isStudentInClass(s, cls.id, classes));
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

      {/* ── MODAL: Yangi sinf qo'shish ── */}
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
    </div>
  );
}
