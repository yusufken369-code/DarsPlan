import React, { useState } from 'react';
import { User, Mail, Lock, Shield, CheckCircle2, AlertCircle, LogOut, Save, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';

export default function Sozlamalar() {
  const { user, signOut } = useAuth();
  const { lessons, classes, materials, assignments, lessonPlans } = useData();

  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  );
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSavingName(true);
    setNameMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      });

      if (error) {
        setNameMsg(`Xatolik: ${error.message}`);
      } else {
        setNameMsg("Ma'lumotlar muvaffaqiyatli saqlandi!");
        setTimeout(() => setNameMsg(''), 4000);
      }
    } catch (err) {
      setNameMsg("Server bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');

    if (password.length < 6) {
      setPwdError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setPwdError("Kiritilgan parollar bir-biriga mos kelmadi.");
      return;
    }

    setSavingPwd(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setPwdError(error.message || "Parolni o'zgartirishda xatolik yuz berdi.");
      } else {
        setPwdMsg("Parol muvaffaqiyatli yangilandi!");
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwdMsg(''), 4000);
      }
    } catch (err) {
      setPwdError("Server bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setSavingPwd(false);
    }
  };

  const avatarLetter = (fullName.trim()[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-4xl pb-10">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-[#283593]">Sozlamalar</h1>
        <p className="text-xs text-[#90a4ae] mt-0.5">
          Shaxsiy profil, xavfsizlik va ish maydoni parametrlari
        </p>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* 1. Shaxsiy profil */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#ef5b5b] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                {avatarLetter}
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#283593]">Shaxsiy profil</h2>
                <p className="text-xs text-[#90a4ae]">{user?.email}</p>
              </div>
            </div>

            {nameMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={15} />
                <span>{nameMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateName} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">To'liq ism</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bec5]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ismingiz va familiyangiz"
                    className="w-full h-11 rounded-xl border border-[#e8edf5] bg-[#f7f9fc] pl-10 pr-3 text-xs text-[#283593] focus:outline-none focus:border-[#3949ab]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Elektron pochta</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bec5]" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full h-11 rounded-xl border border-[#e8edf5] bg-gray-100 pl-10 pr-3 text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingName}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#3949ab] text-white text-xs font-bold hover:bg-[#303f9f] transition-all shadow-sm disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{savingName ? 'Saqlanmoqda…' : "Ismni saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 2. Parolni o'zgartirish */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#3949ab] flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#283593]">Xavfsizlik</h2>
                <p className="text-xs text-[#90a4ae]">Parolni yangilash</p>
              </div>
            </div>

            {pwdMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={15} />
                <span>{pwdMsg}</span>
              </div>
            )}

            {pwdError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle size={15} />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Yangi parol</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bec5]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    className="w-full h-11 rounded-xl border border-[#e8edf5] bg-[#f7f9fc] pl-10 pr-3 text-xs text-[#283593] focus:outline-none focus:border-[#3949ab]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#455a7a] mb-1 block">Parolni tasdiqlang</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bec5]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Parolni qayta kiriting"
                    className="w-full h-11 rounded-xl border border-[#e8edf5] bg-[#f7f9fc] pl-10 pr-3 text-xs text-[#283593] focus:outline-none focus:border-[#3949ab]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#3949ab] text-white text-xs font-bold hover:bg-[#303f9f] transition-all shadow-sm disabled:opacity-50"
                >
                  <Lock size={14} />
                  <span>{savingPwd ? 'Yangilanmoqda…' : "Parolni yangilash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 3. Ish maydoni statistikasi (faqat joriy ustoz ma'lumotlari) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#ef5b5b] flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#283593]">Shaxsiy ish maydoni holati</h2>
              <p className="text-xs text-[#90a4ae]">
                Ushbu hisobga tegishli saqlangan ma'lumotlar ko'rsatkichi (boshqa foydalanuvchilardan to'liq ajratilgan)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {[
              { label: 'Darslar', count: (lessons || []).length, unit: 'ta' },
              { label: 'Sinflar', count: (classes || []).length, unit: 'ta' },
              { label: 'Materiallar', count: (materials || []).length, unit: 'ta' },
              { label: 'Topshiriqlar', count: (assignments || []).length, unit: 'ta' },
              { label: 'Dars rejalari', count: (lessonPlans || []).length, unit: 'ta' },
            ].map((st) => (
              <div key={st.label} className="p-3.5 rounded-xl bg-[#f7f9fc] border border-gray-100 text-center">
                <span className="text-xl font-extrabold text-[#283593] leading-none block mb-1">
                  {st.count}
                </span>
                <span className="text-[11px] font-semibold text-[#455a7a]">{st.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-[#90a4ae]">
              Foydalanuvchi ID: <span className="font-mono text-gray-500">{user?.id || '—'}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 text-xs font-bold transition-colors"
            >
              <LogOut size={14} />
              <span>Tizimdan chiqish</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
