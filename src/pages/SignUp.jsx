import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff,
  GraduationCap, Users, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── validation helpers ─────────────────────────── */
function validateForm({ name, email, password, role }) {
  const errs = {};
  if (!name.trim()) errs.name = "Ism va familiyani kiriting.";
  else if (name.trim().length < 3) errs.name = "Kamida 3 ta belgi kiriting.";

  if (!email.trim()) errs.email = "Email manzilini kiriting.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errs.email = "Email formati noto'g'ri.";

  if (!password) errs.password = "Parolni kiriting.";
  else if (password.length < 6)
    errs.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";

  if (!role) errs.role = "Hisob turini tanlang.";
  return errs;
}

/* ── field wrapper ──────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold text-[#283593]">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

/* ── input base styles ──────────────────────────── */
const inputCls = (hasErr) =>
  `w-full h-[42px] rounded-xl border ${hasErr ? 'border-red-400' : 'border-[#e3e8f0]'}
   bg-[#f7f9fc] px-3 text-[13px] text-[#283593] placeholder-[#b0bec5]
   focus:outline-none focus:border-[#3949ab] focus:ring-2 focus:ring-[#3949ab]/10 transition-all`;

/* ── desk illustration (CSS art) ───────────────── */
function DeskIllustration() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[210px] overflow-hidden">
      {/* desk surface */}
      <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-[#1a2870] rounded-t-3xl" />

      {/* stack of books */}
      <div className="absolute bottom-[76px] left-8">
        <div className="w-[54px] h-[12px] rounded-sm bg-[#ef5b5b] rotate-[-2deg] shadow" />
        <div className="w-[60px] h-[13px] rounded-sm bg-[#ffb74d] -mt-1 rotate-[1deg] shadow" />
        <div className="w-[56px] h-[14px] rounded-sm bg-[#4fc3f7] -mt-1 rotate-[-1deg] shadow" />
        <div className="w-[62px] h-[13px] rounded-sm bg-[#81c784] -mt-1 rotate-[2deg] shadow" />
      </div>

      {/* notebook / open book */}
      <div
        className="absolute bottom-[76px] left-24 w-[70px] h-[50px] rounded-md bg-white shadow-md"
        style={{ transform: 'rotate(-3deg)' }}
      >
        <div className="w-full h-[2px] bg-[#e0e0e0] mt-2" />
        <div className="w-3/4 h-[2px] bg-[#e0e0e0] mt-2 ml-2" />
        <div className="w-2/3 h-[2px] bg-[#e0e0e0] mt-2 ml-2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-[#c5cae9]" />
      </div>

      {/* mug */}
      <div className="absolute bottom-[76px] right-12">
        <div className="w-[28px] h-[34px] rounded-b-lg bg-[#90a4ae] border-2 border-[#78909c]">
          <div className="absolute -right-[10px] top-[6px] w-[10px] h-[16px] border-2 border-[#78909c] rounded-r-full bg-transparent" />
          <div className="w-full h-[4px] rounded-t-sm bg-[#b0bec5]" />
        </div>
      </div>

      {/* laptop */}
      <div className="absolute bottom-[76px] right-24" style={{ transform: 'rotate(2deg)' }}>
        {/* screen */}
        <div className="w-[72px] h-[48px] rounded-t-lg bg-[#1e2a7a] border-2 border-[#3949ab] shadow-md flex items-center justify-center">
          <div className="w-[52px] h-[34px] rounded bg-[#283593] flex items-center justify-center">
            <GraduationCap size={14} className="text-white/60" />
          </div>
        </div>
        {/* base */}
        <div className="w-[80px] h-[5px] rounded-b-lg bg-[#3949ab] -ml-1 shadow" />
      </div>

      {/* pencil */}
      <div
        className="absolute bottom-[82px] left-[200px] w-[3px] h-[44px] bg-[#ffeb3b] rounded-full shadow-sm"
        style={{ transform: 'rotate(30deg)' }}
      />
    </div>
  );
}

/* ── main SignUp page ───────────────────────────── */
export default function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
    setApiError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validateForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            account_type: form.role,
          },
        },
      });

      if (error) {
        if (
          error.message.includes('User already registered') ||
          error.message.includes('already exists')
        ) {
          setApiError("Bu email manzili allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring.");
        } else if (error.message.includes('Password should be at least')) {
          setApiError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
        } else if (error.status === 429 || error.message.includes('rate limit')) {
          setApiError("Juda ko'p so'rov yuborildi. Iltimos, birozdan keyin qayta urinib ko'ring.");
        } else {
          setApiError(error.message || "Ro'yxatdan o'tishda xatolik yuz berdi.");
        }
        return;
      }

      // Check if user already exists (Supabase identity obfuscation check)
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setApiError("Bu email manzili allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring.");
        return;
      }

      // If active session was created immediately (email confirmation disabled in Supabase)
      if (data?.session) {
        navigate('/', { replace: true });
        return;
      }

      // Otherwise, email confirmation is required
      setSuccessInfo({
        needsConfirmation: true,
        email: form.email.trim(),
      });
    } catch (err) {
      console.error('Sign up error:', err);
      setApiError("Server bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }

  if (successInfo) {
    return (
      <div className="min-h-screen bg-[#2b3a99] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-10 text-center max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Mail size={32} className="text-[#3949ab]" />
          </div>
          <h2 className="text-[#283593] font-extrabold text-2xl mb-2">
            Elektron pochtangizni tasdiqlang
          </h2>
          <p className="text-[#455a7a] text-sm leading-relaxed mb-3">
            Biz <strong className="text-[#283593]">{successInfo.email}</strong> manziliga tasdiqlash havolasini yubordik.
          </p>
          <p className="text-[#90a4ae] text-xs leading-relaxed mb-8">
            DarsPlan tizimiga kirishdan oldin pochtangizdagi havolani bosing va hisobingizni faollashtiring.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full h-[46px] rounded-xl bg-[#ef5b5b] text-white font-bold text-sm hover:bg-[#e53935] transition-all shadow-md active:scale-[0.99]"
          >
            Tizimga kirish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2b3a99] flex items-center justify-center p-3 sm:p-4">
      {/* ── Two-panel card ── */}
      <div className="w-full max-w-[440px] md:max-w-[860px] min-h-[520px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-white">

        {/* ════ LEFT PANEL ════ */}
        <div
          className="relative w-[42%] flex-shrink-0 flex-col p-8 overflow-hidden hidden md:flex"
          style={{ background: '#2b3a99' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-[15px] tracking-wide">DarsPlan</span>
          </div>

          {/* Heading */}
          <h1 className="text-white font-extrabold text-[22px] leading-tight mb-3">
            Ustozlar uchun zamonaviy rejalashtirish vositasi
          </h1>
          <p className="text-white/60 text-[13px] leading-relaxed">
            Darslaringiz, sinflaringiz va o'quvchilaringiz bilan ishlashni yanada osonlashtiring.
          </p>

          {/* Decorative desk illustration */}
          <DeskIllustration />
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="flex-1 bg-white flex flex-col justify-center px-6 py-8 sm:px-10">
          {/* Form header */}
          <div className="mb-6">
            <h2 className="text-[#283593] font-extrabold text-[22px]">Ro'yxatdan o'tish</h2>
            <p className="text-[#90a4ae] text-[13px] mt-1">
              Hisob yaratish uchun ma'lumotlaringizni kiriting.
            </p>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[12px] font-medium leading-relaxed">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* To'liq ism */}
            <Field label="To'liq ism" error={errors.name}>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0bec5]" />
                <input
                  type="text"
                  placeholder="Ismingiz va familiyangiz"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={inputCls(errors.name) + ' pl-9'}
                  disabled={loading}
                />
              </div>
            </Field>

            {/* Email */}
            <Field label="Email" error={errors.email}>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0bec5]" />
                <input
                  type="email"
                  placeholder="example@domain.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={inputCls(errors.email) + ' pl-9'}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </Field>

            {/* Parol */}
            <Field label="Parol" error={errors.password}>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0bec5]" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Parolni kiriting"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className={inputCls(errors.password) + ' pl-9 pr-10'}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0bec5] hover:text-[#3949ab] transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {/* Hisob turi */}
            <Field label="Hisob turi" error={errors.role}>
              <div className="flex gap-3">
                {[
                  { val: 'teacher', label: "O'qituvchi", Icon: GraduationCap },
                  { val: 'other', label: 'Boshqa', Icon: Users },
                ].map(({ val, label, Icon }) => {
                  const active = form.role === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={loading}
                      onClick={() => set('role', val)}
                      className="flex-1 flex items-center justify-center gap-2 h-[44px] rounded-xl border-2 text-[13px] font-semibold transition-all duration-150"
                      style={{
                        borderColor: active ? '#3949ab' : '#e3e8f0',
                        background: active ? '#3949ab' : '#f7f9fc',
                        color: active ? '#ffffff' : '#90a4ae',
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-xl bg-[#ef5b5b] text-white font-bold text-[14px]
                hover:bg-[#e53935] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Yuklanmoqda…
                </span>
              ) : "Ro'yxatdan o'tish"}
            </button>

            {/* Login link */}
            <p className="text-center text-[12px] text-[#90a4ae] mt-1">
              Hisobingiz bormi?{' '}
              <Link
                to="/login"
                className="text-[#3949ab] font-semibold hover:text-[#ef5b5b] transition-colors"
              >
                Kirish
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
