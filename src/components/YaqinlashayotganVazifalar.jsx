import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, X, CalendarCheck } from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatDateBadge, formatToDateString, parseLocalDate } from '../utils/dateUtils';

const TYPE_UZ = { test: 'test', insho: 'insho', vazifa: 'vazifa', essay: 'insho', hw: 'vazifa' };

export default function YaqinlashayotganVazifalar() {
  const { assignments, addAssignment, deleteAssignment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    title: '',
    type: 'test',
    due_date: formatToDateString(new Date()),
    due_time: '12:00',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    await addAssignment({
      subject: form.subject.trim() || 'Umumiy',
      title: form.title.trim(),
      type: form.type,
      due_date: form.due_date,
      due_time: form.due_time,
    });
    setSubmitting(false);
    setShowModal(false);
    setForm({
      subject: '',
      title: '',
      type: 'test',
      due_date: formatToDateString(new Date()),
      due_time: '12:00',
    });
  };

  // Sort upcoming assignments by real calendar due date
  const sortedAssignments = [...(assignments || [])].sort((a, b) => {
    const da = parseLocalDate(a.due_date).getTime();
    const db = parseLocalDate(b.due_date).getTime();
    return da - db;
  });

  const isEmpty = sortedAssignments.length === 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3 h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="text-[#283593] font-bold text-[15px]">Yaqin muddatlar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-[#ef5b5b] hover:opacity-80 transition-opacity"
          >
            <Plus size={13} />
            <span>Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-gray-100 rounded-xl my-2">
          <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-[#ef5b5b] mb-2">
            <CalendarCheck size={18} />
          </div>
          <p className="text-xs font-bold text-[#283593]">Hozircha vazifalar yo'q</p>
          <p className="text-[11px] text-[#90a4ae] mt-0.5 mb-3">
            Topshiriq yoki test muddatlarini belgilang.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ef5b5b] text-white text-[11px] font-bold hover:bg-[#e53935] shadow-sm transition-colors"
          >
            <Plus size={12} />
            <span>Vazifa qo'shish</span>
          </button>
        </div>
      ) : (
        <>
          {/* Horizontal deadline cards */}
          <div className="flex gap-2.5 overflow-x-auto pb-0.5">
            {sortedAssignments.map((dl) => {
              const dt = formatDateBadge(dl.due_date);
              return (
                <div
                  key={dl.id}
                  className="flex-shrink-0 flex flex-col items-center rounded-xl px-3.5 py-3 min-w-[80px] cursor-pointer hover:opacity-90 transition-opacity relative group"
                  style={{ background: '#fdf1f1' }}
                >
                  <button
                    onClick={() => deleteAssignment(dl.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5"
                    title="O'chirish"
                  >
                    <Trash2 size={11} />
                  </button>
                  <span className="text-[#ef5b5b] text-[9px] font-bold uppercase tracking-widest">{dt.month}</span>
                  <span className="text-[#ef5b5b] font-extrabold text-[28px] leading-none mt-0.5">{dt.day}</span>
                  <span className="text-[#b0bec5] text-[9px] mt-1 whitespace-nowrap">{dt.dayName} · {dl.due_time || '12:00'}</span>
                  <span className="text-[#283593] font-bold text-[12px] mt-1.5 truncate max-w-[70px]">{dl.subject}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckSquare size={10} className="text-[#b0bec5]" />
                    <span className="text-[#b0bec5] text-[10px]">{TYPE_UZ[dl.type] || dl.type}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* List rows */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[140px]">
            {sortedAssignments.slice(0, 3).map((dl) => {
              const dt = formatDateBadge(dl.due_date);
              return (
                <div
                  key={dl.id + '-row'}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:opacity-90 transition-opacity group"
                  style={{ background: '#fdf1f1' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex-shrink-0 flex flex-col items-center justify-center"
                    style={{ background: '#ef5b5b' }}
                  >
                    <span className="text-white font-bold text-[11px] leading-none">{dt.day}</span>
                    <span className="text-white/70 text-[9px] leading-none">{dt.month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#283593] font-semibold text-[11px] truncate">
                      {dl.subject} — {dl.title}
                    </p>
                    <p className="text-[#b0bec5] text-[10px]">{dt.dayName} · {dl.due_time || '12:00'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: '#fde8e8', color: '#ef5b5b' }}
                    >
                      {TYPE_UZ[dl.type] || dl.type}
                    </span>
                    <button
                      onClick={() => deleteAssignment(dl.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                      title="O'chirish"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#283593]">Vazifa / Muddat qo'shish</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Fan</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Tarix"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Vazifa nomi / Tavsif</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Yakuniy nazorat testi"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Turi</label>
                <div className="flex gap-2">
                  {[
                    { val: 'test', label: 'Test' },
                    { val: 'insho', label: 'Insho' },
                    { val: 'vazifa', label: 'Uy vazifasi' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.val })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                        form.type === t.val
                          ? 'border-[#3949ab] bg-[#3949ab] text-white'
                          : 'border-gray-200 bg-[#f7f9fc] text-gray-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Sana</label>
                  <input
                    type="date"
                    required
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Vaqt</label>
                  <input
                    type="time"
                    value={form.due_time}
                    onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                  />
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
