# DarsPlan — O'qituvchilar Uchun Dars Rejalashtirish Tizimi

DarsPlan — o'qituvchilar uchun haftalik dars jadvallari, o'quv materiallari, sinflar va vazifalarni boshqarishga mo'ljallangan zamonaviy veb-platforma.

## 🚀 Texnologiyalar

- **Frontend**: React 18, Vite 6, React Router DOM v6
- **Styling**: Tailwind CSS
- **Ikonkalar**: Lucide React
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Til**: O'zbek tili

## 📋 Asosiy Imkoniyatlar

1. **Autentifikatsiya**:
   - Ro'yxatdan o'tish (Sign Up) va Tizimga kirish (Login).
   - Supabase Auth integratsiyasi.
   - Himoyalangan yo'nalishlar (Protected Routes) va avtomatik sessiya saqlanishi.
2. **Haftalik Dars Jadvali (Timetable)**:
   - Dushanbadan Yakshanbagacha (7 kun) real kalendar hisob-kitoblari.
   - Doimiy haftalik darslar va muayyan sana uchun bir martalik darslar.
   - O'tgan va kelasi haftalarga o'tish (hafta oraliqlari va joriy kun belgisi).
3. **Shaxsiy va Bo'sh Ish Maydoni**:
   - Har bir yangi ro'yxatdan o'tgan o'qituvchi toza, shaxsiy ish maydoni bilan boshlaydi.
   - Barcha ma'lumotlar foydalanuvchining `user.id` siga bog'langan va boshqa foydalanuvchilardan ajratilgan.
4. **Sinflar**:
   - Sinflarni qo'shish, o'quvchilar soni va xonalarni boshqarish.
5. **Dars Materiallari**:
   - Taqdimotlar (PPT), hujjatlar (PDF, DOC) ro'yxati.
6. **Yaqinlashayotgan Vazifalar**:
   - Testlar, insholar va uy vazifalari muddatlari.
7. **Statistika**:
   - Haqiqiy darslar asosida hisoblangan kunlik va umumiy statistika.

## 🛠 O'rnatish va Ishga Tushirish

### 1. Repozitoriyani klonlash
```bash
git clone https://github.com/yusufken369-code/DarsPlan.git
cd DarsPlan
```

### 2. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 3. Muhit o'zgaruvchilari (`.env`)
`.env` faylini yarating va quyidagi parametrlarni kiriting:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 4. Loyihani ishga tushirish
```bash
npm run dev
```

### 5. Production build
```bash
npm run build
```

## 🗄 Ma'lumotlar Bazasi (Supabase)
Supabase SQL Editor bo'limida `supabase-schema.sql` fayli ichidagi SQL kodini ishga tushirib jadvallar va RLS xavfsizlik qoidalarini faollashtirishingiz mumkin.
