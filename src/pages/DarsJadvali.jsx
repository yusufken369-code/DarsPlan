import React from 'react';
import Timetable from '../components/Timetable';

export default function DarsJadvali() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-dp-navy font-bold text-xl">Dars jadvali</h1>
      <div className="bg-dp-panel rounded-2xl p-4 shadow-sm">
        <Timetable />
      </div>
    </div>
  );
}
