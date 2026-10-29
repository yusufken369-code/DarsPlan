import React, { useState } from 'react';
import { Download, Plus, Trash2, X, FolderOpen } from 'lucide-react';
import { useData } from '../context/DataContext';

const TYPE_COLORS = {
  PPT: '#3949ab',
  PDF: '#ef5b5b',
  DOC: '#5c6bc0',
};

export default function DarsMateriallari() {
  const { materials, addMaterial, deleteMaterial } = useData();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', title: '', type: 'PPT' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const now = new Date();
    const dStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const tStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setSubmitting(true);
    await addMaterial({
      subject: form.subject.trim() || 'Umumiy',
      title: form.title.trim(),
      type: form.type,
      date: `${dStr} · ${tStr}`,
    });
    setSubmitting(false);
    setShowModal(false);
    setForm({ subject: '', title: '', type: 'PPT' });
  };

  const isEmpty = (materials || []).length === 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2.5 h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <h2 className="text-[#283593] font-bold text-[15px]">Dars materiallari</h2>
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
            <FolderOpen size={18} />
          </div>
          <p className="text-xs font-bold text-[#283593]">Hozircha materiallar yo'q</p>
          <p className="text-[11px] text-[#90a4ae] mt-0.5 mb-3">
            Dars taqdimotlari yoki qo'llanmalarni kiriting.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ef5b5b] text-white text-[11px] font-bold hover:bg-[#e53935] shadow-sm transition-colors"
          >
            <Plus size={12} />
            <span>Material qo'shish</span>
          </button>
        </div>
      ) : (
        /* Material rows */
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px]">
          {materials.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 group hover:opacity-90 transition-opacity"
              style={{ background: '#fdf1f1' }}
            >
              {/* File type badge */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: TYPE_COLORS[m.type] || '#5c6bc0' }}
              >
                <span className="text-white text-[10px] font-bold">{m.type}</span>
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <p className="text-[#283593] font-semibold text-[11px] leading-tight truncate">
                  {m.subject} · {m.title}
                </p>
                <p className="text-[#b0bec5] text-[10px] mt-0.5">{m.date}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => deleteMaterial(m.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                  title="O'chirish"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  onClick={() => alert(`"${m.title}" yuklab olinmoqda…`)}
                  className="text-[#ef5b5b] opacity-60 group-hover:opacity-100 transition-opacity p-1"
                  title="Yuklab olish"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#283593]">Material qo'shish</h3>
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
                  placeholder="masalan: Geografiya"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Mavzu / Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Iqlim mintaqalari"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-[#f7f9fc]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Fayl turi</label>
                <div className="flex gap-2">
                  {['PPT', 'PDF', 'DOC'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                        form.type === t
                          ? 'border-[#3949ab] bg-[#3949ab] text-white'
                          : 'border-gray-200 bg-[#f7f9fc] text-gray-600'
                      }`}
                    >
                      {t}
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
