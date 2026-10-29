import React, { useState } from 'react';
import { Users, Plus, Trash2, X, School } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Sinflar() {
  const { classes, addClass, deleteClass } = useData();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', student_count: '', room: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    await addClass({
      name: form.name.trim(),
      student_count: Number(form.student_count) || 0,
      room: form.room.trim(),
    });
    setSubmitting(false);
    setShowModal(false);
    setForm({ name: '', student_count: '', room: '' });
  };

  const isEmpty = (classes || []).length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#283593]">Sinflar</h1>
          <p className="text-xs text-[#90a4ae] mt-0.5">Siz dars beradigan sinflar va guruhlar ro'yxati</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow-sm transition-all"
        >
          <Plus size={14} />
          <span>Sinf qo'shish</span>
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl my-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#3949ab] flex items-center justify-center mb-3">
              <Users size={26} />
            </div>
            <h2 className="text-base font-bold text-[#283593] mb-1">Hozircha sinflar yo'q</h2>
            <p className="text-xs text-[#90a4ae] max-w-sm mb-4 leading-relaxed">
              O'zingiz dars o'tadigan birinchi sinfni qo'shing va o'quv jarayonini rejalashtirishni boshlang.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow transition-colors"
            >
              <Plus size={14} />
              <span>Sinf qo'shish</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-4 rounded-xl border border-gray-100 bg-[#f7f9fc] hover:shadow-md transition-shadow relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white text-[#3949ab] flex items-center justify-center shadow-sm font-bold text-sm">
                      <School size={18} />
                    </div>
                    <button
                      onClick={() => deleteClass(cls.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="font-extrabold text-lg text-[#283593] mt-3">{cls.name}</h3>
                  <p className="text-xs text-[#90a4ae] mt-0.5">Xona: {cls.room || 'Belgilanmagan'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="text-[#455a7a] font-medium">O'quvchilar soni:</span>
                  <span className="font-bold text-[#3949ab] bg-white px-2 py-0.5 rounded-lg border border-gray-100">
                    {cls.student_count || 0} nafar
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#283593]">Yangi sinf qo'shish</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Sinf nomi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: 9-A yoki 11-B"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">O'quvchilar soni</label>
                <input
                  type="number"
                  min="0"
                  placeholder="masalan: 28"
                  value={form.student_count}
                  onChange={(e) => setForm({ ...form, student_count: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Xona raqami</label>
                <input
                  type="text"
                  placeholder="masalan: 204-xona"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
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
