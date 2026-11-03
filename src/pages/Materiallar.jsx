import React from 'react';
import DarsMateriallari from '../components/DarsMateriallari';

export default function Materiallar() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-[#283593] dark:text-white">O'quv materiallari</h1>
        <p className="text-xs text-[#90a4ae] dark:text-slate-400 mt-0.5">Darslar uchun taqdimotlar, hujjatlar va qo'llanmalar</p>
      </div>
      <div className="bg-white dark:bg-[#151f32] rounded-2xl p-6 shadow-sm min-h-[380px] border border-transparent dark:border-slate-800 transition-colors duration-200">
        <DarsMateriallari />
      </div>
    </div>
  );
}
