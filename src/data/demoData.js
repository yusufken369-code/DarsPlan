// Demo timetable data for DarsPlan
// Each lesson: { id, subject, class, type (S=small/L=large), startTime, endTime, day (0=Mon..4=Fri), color }

export const DAYS = [
  { key: 0, uz: "DUSHANBA", date: "8.03" },
  { key: 1, uz: "SESHANBA", date: "9.03" },
  { key: 2, uz: "CHORSHANBA", date: "10.03" },
  { key: 3, uz: "PAYSHANBA", date: "11.03" },
  { key: 4, uz: "JUMA", date: "12.03" },
];

export const TIME_SLOTS = [
  "8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
];

// color variants: 'navy' | 'coral' | 'white' | 'pink'
export const LESSONS = [
  // Monday
  { id: 1,  subject: "MATH", cls: "S", type: "S", start: "8:00",  end: "9:15",  day: 0, color: "navy" },
  { id: 2,  subject: "HIS",  cls: "L", type: "L", start: "9:40",  end: "10:40", day: 0, color: "navy" },
  { id: 3,  subject: "ENG",  cls: "L", type: "L", start: "11:00", end: "11:45", day: 0, color: "navy" },
  { id: 4,  subject: "GEO",  cls: "S", type: "S", start: "12:00", end: "12:45", day: 0, color: "navy" },
  { id: 5,  subject: "CHEM", cls: "L", type: "L", start: "13:00", end: "13:45", day: 0, color: "navy" },
  { id: 6,  subject: "BIOL", cls: "S", type: "S", start: "14:00", end: "14:45", day: 0, color: "navy" },

  // Tuesday
  { id: 7,  subject: "PHYS", cls: "S", type: "S", start: "8:00",  end: "9:15",  day: 1, color: "white" },
  { id: 8,  subject: "ECO",  cls: "L", type: "L", start: "9:40",  end: "10:40", day: 1, color: "coral" },
  { id: 9,  subject: "FRE",  cls: "S", type: "S", start: "11:00", end: "11:45", day: 1, color: "white" },
  { id: 10, subject: "PHOT", cls: "S", type: "S", start: "12:00", end: "12:45", day: 1, color: "white" },
  { id: 11, subject: "SPA",  cls: "L", type: "L", start: "13:00", end: "13:45", day: 1, color: "white" },

  // Wednesday
  { id: 12, subject: "PHOT", cls: "L", type: "L", start: "9:40",  end: "10:40", day: 2, color: "white" },
  { id: 13, subject: "SPA",  cls: "S", type: "S", start: "11:00", end: "11:45", day: 2, color: "white" },
  { id: 14, subject: "GEO",  cls: "L", type: "L", start: "12:00", end: "12:45", day: 2, color: "white" },
  { id: 15, subject: "BIOL", cls: "L", type: "L", start: "13:00", end: "13:45", day: 2, color: "white" },
  { id: 16, subject: "MATH", cls: "S", type: "S", start: "14:00", end: "14:45", day: 2, color: "white" },

  // Thursday
  { id: 17, subject: "ENG",  cls: "S", type: "S", start: "11:00", end: "11:45", day: 3, color: "white" },
  { id: 18, subject: "MATH", cls: "L", type: "L", start: "8:00",  end: "9:15",  day: 3, color: "white" },
  { id: 19, subject: "GEO",  cls: "L", type: "L", start: "12:00", end: "12:45", day: 3, color: "coral" },
  { id: 20, subject: "HIS",  cls: "S", type: "S", start: "9:40",  end: "10:40", day: 3, color: "white" },

  // Friday
  { id: 21, subject: "MATH", cls: "S", type: "S", start: "8:00",  end: "9:15",  day: 4, color: "white" },
  { id: 22, subject: "HIS",  cls: "L", type: "L", start: "9:40",  end: "10:40", day: 4, color: "white" },
  { id: 23, subject: "ENG",  cls: "L", type: "L", start: "11:00", end: "11:45", day: 4, color: "white" },
  { id: 24, subject: "GEO",  cls: "S", type: "S", start: "12:00", end: "12:45", day: 4, color: "white" },
  { id: 25, subject: "CHEM", cls: "S", type: "S", start: "13:00", end: "13:45", day: 4, color: "white" },
  { id: 26, subject: "BIOL", cls: "L", type: "L", start: "14:00", end: "14:45", day: 4, color: "white" },
  { id: 27, subject: "PHYS", cls: "S", type: "S", start: "15:00", end: "15:45", day: 4, color: "white" },
];

export const MATERIALS = [
  { id: 1, type: "PPT", subject: "GEO", title: "Geografiya - Iqlim mintaqalari", date: "27-02-2026 · 10:06" },
  { id: 2, type: "PDF", subject: "BIOL", title: "Biologiya - Hujayra tuzilishi", date: "27-02-2026 · 10:06" },
  { id: 3, type: "DOC", subject: "GEO", title: "Geografiya - Tog' tizmalari", date: "26-02-2026 · 09:30" },
];

export const DEADLINES = [
  { id: 1, month: "MAR", day: 11, dayName: "DU", time: "12:00", subject: "GEO", type: "test", desc: "Mamlakat geografiyasi testi" },
  { id: 2, month: "MAR", day: 19, dayName: "CH", time: "8:30",  subject: "ENG", type: "essay", desc: "Ingliz tili insho topshiriq" },
  { id: 3, month: "MAR", day: 27, dayName: "SE", time: "11:30", subject: "HIS", type: "test",  desc: "Tarix yakuniy test" },
];

export const SUBJECT_STATS = [
  { subject: "MATH", avg: 4.4 },
  { subject: "BIOL", avg: 3.9 },
  { subject: "ENG",  avg: 4.7 },
  { subject: "GEO",  avg: 4.1 },
];

export const TEACHER = {
  name: "Aziza",
  avatar: null,
  todayLessons: 6,
  completedLessons: 4,
  remainingHours: "4:31",
};
