import React from 'react';
import YaqinlashayotganVazifalar from '../components/YaqinlashayotganVazifalar';

export default function Vazifalar() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-[#283593]">Vazifalar va topshiriqlar</h1>
        <p className="text-xs text-[#90a4ae] mt-0.5">O'quvchilar uchun testlar, insholar va uy vazifalari</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[380px]">
        <YaqinlashayotganVazifalar />
      </div>
    </div>
  );
}
