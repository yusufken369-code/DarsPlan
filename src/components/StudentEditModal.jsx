import React, { useState, useEffect } from 'react';
import { X, DollarSign, Award, User, Phone, Check, Trash2 } from 'lucide-react';

export const GRADE_CONFIG = {
  2: {
    label: 'Qoniqarsiz',
    bg: 'bg-[#ef4444]',
    hoverBg: 'hover:bg-[#dc2626]',
    lightBg: 'bg-red-50 text-[#dc2626] border-red-200',
    ring: 'ring-red-400',
    border: 'border-[#ef4444]',
  },
  3: {
    label: 'Qoniqarli',
    bg: 'bg-[#f97316]',
    hoverBg: 'hover:bg-[#ea580c]',
    lightBg: 'bg-orange-50 text-[#ea580c] border-orange-200',
    ring: 'ring-orange-400',
    border: 'border-[#f97316]',
  },
  4: {
    label: 'Yaxshi',
    bg: 'bg-[#eab308]',
    hoverBg: 'hover:bg-[#ca8a04]',
    lightBg: 'bg-amber-50 text-[#ca8a04] border-amber-200',
    ring: 'ring-amber-400',
    border: 'border-[#eab308]',
  },
  5: {
    label: "A'lo",
    bg: 'bg-[#22c55e]',
    hoverBg: 'hover:bg-[#16a34a]',
    lightBg: 'bg-emerald-50 text-[#16a34a] border-emerald-200',
    ring: 'ring-emerald-400',
    border: 'border-[#22c55e]',
  },
};

export default function StudentEditModal({ student, onClose, onSave, onDelete }) {
  if (!student) return null;

  const [name, setName] = useState(student.name || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [parentPhone, setParentPhone] = useState(student.parent_phone || '');
  const [note, setNote] = useState(student.note || '');
  const [fee, setFee] = useState(student.fee ?? '');
  const [paid, setPaid] = useState(Boolean(student.paid));
  const [grade, setGrade] = useState(student.grade ? Number(student.grade) : null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(student.name || '');
    setPhone(student.phone || '');
    setParentPhone(student.parent_phone || '');
    setNote(student.note || '');
    setFee(student.fee !== undefined && student.fee !== null ? student.fee : '');
    setPaid(Boolean(student.paid));
    setGrade(student.grade ? Number(student.grade) : null);
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await onSave(student.id, {
      name: name.trim(),
      phone: phone.trim(),
      parent_phone: parentPhone.trim(),
      note: note.trim(),
      fee: Number(fee) || 0,
      paid: Boolean(paid),
      grade: grade ? Number(grade) : null,
    });
    setSaving(false);
    onClose();
  };

  const quickAmounts = [300000, 400000, 500000, 600000, 800000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#f7f9fc]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3949ab] to-[#5c6bc0] text-white flex items-center justify-center shadow-sm font-bold text-base">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#283593] leading-snug">
                {student.name || "O'quvchi ma'lumotlari"}
              </h3>
              <p className="text-xs text-[#90a4ae]">
                Daromad va 2-5 baholarni tahrirlash
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* 1. Baholash (2 dan 5 gacha) - NO EMOJIS, pure colors as requested */}
          <div className="bg-[#fbfcff] p-4 rounded-2xl border border-indigo-100/70">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-[#283593] flex items-center gap-1.5">
                <Award size={15} className="text-[#3949ab]" />
                <span>O'quvchining bahosi (2 dan 5 gacha)</span>
              </label>
              {grade && (
                <button
                  type="button"
                  onClick={() => setGrade(null)}
                  className="text-[11px] text-[#90a4ae] hover:text-red-500 transition-colors"
                >
                  Bahoni tozalash
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {[2, 3, 4, 5].map((g) => {
                const cfg = GRADE_CONFIG[g];
                const isSelected = grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all font-bold text-center border-2 ${
                      isSelected
                        ? `${cfg.bg} text-white ${cfg.border} shadow-md scale-[1.03]`
                        : `bg-white text-gray-700 border-gray-200 hover:border-gray-300`
                    }`}
                  >
                    <span className="text-2xl font-black leading-none mb-1">{g}</span>
                    <span
                      className={`text-[10px] font-semibold tracking-tight ${
                        isSelected ? 'text-white/95' : 'text-[#78909c]'
                      }`}
                    >
                      {cfg.label}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center text-white text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Daromad / Oylik to'lov */}
          <div className="bg-[#fbfcff] p-4 rounded-2xl border border-indigo-100/70 flex flex-col gap-3">
            <label className="text-xs font-bold text-[#283593] flex items-center gap-1.5">
              <DollarSign size={15} className="text-[#3949ab]" />
              <span>Oylik to'lov / Daromad (so'mda)</span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="masalan: 400000"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full h-10 px-3 pr-12 rounded-xl border border-gray-200 text-xs font-bold text-[#283593] focus:border-[#3949ab] focus:outline-none bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#90a4ae] pointer-events-none">
                  so'm
                </span>
              </div>

              {/* Paid Status Toggle */}
              <button
                type="button"
                onClick={() => setPaid(!paid)}
                className={`px-3.5 h-10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  paid
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200/70'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    paid ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-transparent'
                  }`}
                >
                  <Check size={10} strokeWidth={3} />
                </div>
                <span>{paid ? "To'landi" : "To'lanmagan"}</span>
              </button>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#90a4ae]">Tezkor tanlash:</span>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFee(amt)}
                  className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition-colors ${
                    Number(fee) === amt
                      ? 'bg-indigo-50 border-[#3949ab] text-[#3949ab] font-bold'
                      : 'bg-white border-gray-200 text-[#455a7a] hover:bg-gray-50'
                  }`}
                >
                  {(amt / 1000).toLocaleString('uz-UZ')}k
                </button>
              ))}
            </div>
          </div>

          {/* 3. Student General Info */}
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-[#455a7a] mb-1 block">
                O'quvchi F.I.SH. *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#455a7a] mb-1 block">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#455a7a] mb-1 block">
                Izoh / Eslatma
              </label>
              <input
                type="text"
                placeholder="masalan: A'lochi o'quvchi, olimpiadachi"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs text-[#283593] focus:border-[#3949ab] focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${student.name}"ni ro'yxatdan o'chirmoqchimisiz?`)) {
                    onDelete(student.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
                <span>O'chirish</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-5 py-2 rounded-xl bg-[#ef5b5b] hover:bg-[#e53935] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
