import React from 'react';
import DarsMateriallari from '../components/DarsMateriallari';

export default function Materiallar() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-[#283593]">O'quv materiallari</h1>
        <p className="text-xs text-[#90a4ae] mt-0.5">Darslar uchun taqdimotlar, hujjatlar va qo'llanmalar</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[380px]">
        <DarsMateriallari />
      </div>
    </div>
  );
}
