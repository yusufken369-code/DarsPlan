import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, X, Calendar, Target } from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatToDateString } from '../utils/dateUtils';

export default function DarsRejalari() {
  const { lessonPlans, addLessonPlan, deleteLessonPlan } = useData();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    class_name: '',
    topic: '',
    objective: '',
    date: formatToDateString(new Date()),
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.topic.trim()) return;

    setSubmitting(true);
    await addLessonPlan({
      subject: form.subject.trim() || 'Umumiy',
      class_name: form.class_name.trim() || 'Sinf',
      topic: form.topic.trim(),
      objective: form.objective.trim(),
      date: form.date,
    });
    setSubmitting(false);
    setShowModal(false);
    setForm({
      subject: '',
      class_name: '',
      topic: '',
      objective: '',
      date: formatToDateString(new Date()),
    });
  };

  const isEmpty = (lessonPlans || []).length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#283593]">Dars rejalari</h1>
          <p className="text-xs text-[#90a4ae] mt-0.5">Mavzular, dars maqsadlari va reja bosqichlari</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow-sm transition-all"
        >
          <Plus size={14} />
          <span>Reja qo'shish</span>
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl my-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#3949ab] flex items-center justify-center mb-3">
              <BookOpen size={26} />
            </div>
            <h2 className="text-base font-bold text-[#283593] mb-1">Hozircha dars rejalari yo'q</h2>
            <p className="text-xs text-[#90a4ae] max-w-sm mb-4 leading-relaxed">
              O'quv rejangizni shakllantirish uchun birinchi dars rejasini kiriting.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ef5b5b] text-white text-xs font-bold hover:bg-[#e53935] shadow transition-colors"
            >
              <Plus size={14} />
              <span>Reja qo'shish</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessonPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 rounded-xl border border-gray-100 bg-[#f7f9fc] hover:shadow-md transition-shadow relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#3949ab] font-bold text-xs">
                      {plan.subject} · {plan.class_name}
                    </span>
                    <button
                      onClick={() => deleteLessonPlan(plan.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="font-extrabold text-base text-[#283593] mt-3 leading-snug">
                    {plan.topic}
                  </h3>
                  {plan.objective && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-[#455a7a]">
                      <Target size={14} className="text-[#ef5b5b] flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2 leading-relaxed">{plan.objective}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs text-[#90a4ae]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{plan.date}</span>
                  </span>
                  <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">
                    Rejalashtirilgan
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
              <h3 className="font-bold text-base text-[#283593]">Dars rejasi qo'shish</h3>
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
                  placeholder="masalan: Adabiyot"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Sinf</label>
                <input
                  type="text"
                  placeholder="masalan: 10-A"
                  value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Dars mavzusi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Alisher Navoiy g'azallari tahlili"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Dars maqsadi</label>
                <textarea
                  rows="2"
                  placeholder="O'quvchilarda g'azal janri bo'yicha tushuncha hosil qilish..."
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Sana</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
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
