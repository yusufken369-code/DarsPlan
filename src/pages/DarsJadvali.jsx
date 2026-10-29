import React from 'react';
import Timetable from '../components/Timetable';

export default function DarsJadvali() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-[#283593]">Dars jadvali</h1>
        <p className="text-xs text-[#90a4ae] mt-0.5">Haftalik va sanali darslar taqvimi</p>
      </div>
      <div className="rounded-2xl p-4 shadow-sm" style={{ background: '#eef1f8' }}>
        <Timetable />
      </div>
    </div>
  );
}
