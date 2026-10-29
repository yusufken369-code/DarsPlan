import React from 'react';

// Generic placeholder page component
export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
        <span className="text-3xl">📋</span>
      </div>
      <h1 className="text-dp-navy font-bold text-xl">{title}</h1>
      <p className="text-dp-text-muted text-sm">Bu sahifa tez orada ishga tushadi.</p>
    </div>
  );
}
