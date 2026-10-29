import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ─── Shared input style ────────────────────────────────────────── */
const inputCls = (hasErr) =>
  `w-full h-[44px] rounded-xl border-2 text-[13px] px-4 transition-all outline-none
   bg-[#f7f9fc] placeholder-[#b0bec5] text-[#283593]
   ${hasErr
     ? 'border-red-400 focus:border-red-400'
     : 'border-[#e8edf5] focus:border-[#3949ab]'}
   focus:ring-2 focus:ring-[#3949ab]/10`;

/* ─── Field wrapper ─────────────────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[12px] font-semibold text-[#455a7a]">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500 leading-tight">{error}</p>}
    </div>
  );
}

/* ─── Classroom illustration (right panel) ──────────────────────── */
function ClassroomScene() {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#d4e8c8' }}>
      {/* Sky / upper wall */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #c8dfc0 0%, #d9ecd0 60%, #b5c9a8 100%)' }} />

      {/* Chalkboard */}
      <div
        className="absolute rounded-xl shadow-lg flex items-center justify-center"
        style={{
          top: '12%', left: '8%', right: '8%', height: '44%',
          background: '#2e5e3e',
          border: '6px solid #5d4037',
        }}
      >
        {/* Chalk text */}
        <div className="text-center px-4">
          <p className="text-white font-bold text-[15px] leading-snug" style={{ fontFamily: 'Georgia, serif', opacity: 0.9 }}>
            Yaxshi ustoz —
          </p>
          <p className="text-white font-bold text-[15px] leading-snug" style={{ fontFamily: 'Georgia, serif', opacity: 0.9 }}>
            buyuk kelajak!
          </p>
        </div>
        {/* Chalk dust */}
        <div className="absolute bottom-2 left-4 right-4 h-[2px] bg-white/20 rounded" />
      </div>

      {/* Board ledge */}
      <div
        className="absolute rounded"
        style={{
          top: 'calc(12% + 44% + 6px)',
          left: '6%', right: '6%', height: '10px',
          background: '#5d4037',
        }}
      />

      {/* Desk surface */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[36%] rounded-t-2xl"
        style={{ background: '#a0845c' }}
      />
      {/* Desk front edge highlight */}
      <div
        className="absolute left-0 right-0 h-[4px]"
        style={{ bottom: '36%', background: '#8d6e45' }}
      />

      {/* ── Objects on desk ── */}

      {/* Stack of books */}
      <div className="absolute" style={{ bottom: '36%', left: '12%' }}>
        {[
          { w: 62, h: 13, bg: '#1565c0', rotate: '-2deg' },
          { w: 68, h: 12, bg: '#283593', rotate: '1.5deg' },
          { w: 64, h: 13, bg: '#303f9f', rotate: '-1deg' },
          { w: 70, h: 11, bg: '#3949ab', rotate: '2deg'  },
        ].map((b, i) => (
          <div
            key={i}
            className="rounded-sm shadow-sm"
            style={{
              width: b.w, height: b.h,
              background: b.bg,
              transform: `rotate(${b.rotate})`,
              marginTop: i === 0 ? 0 : -2,
            }}
          />
        ))}
      </div>

      {/* Notebook (open) */}
      <div
        className="absolute rounded-md shadow"
        style={{
          bottom: '36%', left: '28%', width: 72, height: 52,
          background: 'white',
          transform: 'rotate(-2deg)',
        }}
      >
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-blue-100" />
        {[1,2,3].map(i => (
          <div key={i} className="mx-2 mt-2 h-[1.5px] rounded bg-blue-50" />
        ))}
      </div>

      {/* Pencil holder / cup */}
      <div
        className="absolute rounded-b-lg"
        style={{
          bottom: '36%', right: '22%', width: 28, height: 38,
          background: '#f5f5f5',
          border: '2px solid #e0e0e0',
        }}
      >
        {/* Pencils */}
        {[0, 4, 8].map((offset, i) => (
          <div
            key={i}
            className="absolute bottom-full rounded-sm"
            style={{
              left: 4 + offset, width: 4, height: 18,
              background: i === 0 ? '#ffeb3b' : i === 1 ? '#ef5b5b' : '#4caf50',
              transform: `rotate(${i === 0 ? '-5deg' : i === 1 ? '0deg' : '5deg'})`,
            }}
          />
        ))}
      </div>

      {/* Single pen on desk */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: 'calc(36% + 4px)', right: '36%',
          width: 3, height: 52,
          background: '#1565c0',
          transform: 'rotate(25deg)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Small plant pot */}
      <div className="absolute" style={{ bottom: '36%', right: '10%' }}>
        <div
          className="rounded-full mb-0.5"
          style={{ width: 22, height: 16, background: '#66bb6a', marginLeft: 3 }}
        />
        <div
          className="rounded-full"
          style={{ width: 28, height: 14, background: '#4caf50', marginLeft: 0 }}
        />
        <div
          className="rounded-b-lg mt-0.5"
          style={{
            width: 28, height: 20,
            background: '#8d6e45',
            border: '2px solid #795548',
          }}
        />
      </div>
    </div>
  );
}

/* ─── Login page ────────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [errors, setErrors]     = useState({});
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
    setApiError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) {
      errs.email = "Email manzilini kiriting.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Email formati noto'g'ri.";
    }
    if (!form.password.trim()) {
      errs.password = "Parolni kiriting.";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setApiError("Email yoki parol noto'g'ri.");
        } else if (error.message.includes('Email not confirmed')) {
          setApiError("Elektron pochtangiz hali tasdiqlanmagan. Iltimos, emailingizni tekshiring.");
        } else if (error.status === 429 || error.message.includes('rate limit')) {
          setApiError("Juda ko'p urinishlar bo'ldi. Birozdan so'ng qayta urinib ko'ring.");
        } else {
          setApiError(error.message || "Kirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        }
        return;
      }

      if (data?.session) {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setApiError("Server bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#2b3a99] flex items-center justify-center p-3 sm:p-4">

      {/* ── Two-panel card ─────────────────────────────────── */}
      <div
        className="w-full max-w-[440px] md:max-w-[880px] shadow-2xl overflow-hidden flex flex-col md:flex-row rounded-3xl bg-white"
        style={{
          minHeight: '520px',
        }}
      >

        {/* ═══════════════ LEFT — FORM PANEL ═══════════════ */}
        <div className="w-full md:w-[52%] flex-shrink-0 flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-9 bg-white">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-7">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#e8ebf8' }}
            >
              <GraduationCap size={17} style={{ color: '#3949ab' }} />
            </div>
            <span className="font-extrabold text-[16px]" style={{ color: '#283593' }}>
              DarsPlan
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-extrabold text-[24px] leading-tight mb-1" style={{ color: '#1a237e' }}>
            Tizimga kirish
          </h1>
          <p className="text-[13px] mb-6" style={{ color: '#90a4ae' }}>
            O'qituvchilar uchun maxsus platforma.
          </p>

          {/* API-level error */}
          {apiError && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[12px] font-medium leading-relaxed">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Email */}
            <Field label="Email" error={errors.email}>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#b0bec5' }}
                />
                <input
                  type="email"
                  placeholder="example@domain.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={inputCls(errors.email)}
                  style={{ paddingLeft: '2.25rem' }}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </Field>

            {/* Parol */}
            <Field label="Parol" error={errors.password}>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#b0bec5' }}
                />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Parolni kiriting"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className={inputCls(errors.password)}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#b0bec5' }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#3949ab] cursor-pointer"
                  disabled={loading}
                />
                <span className="text-[12px]" style={{ color: '#455a7a' }}>
                  Meni eslab qolish
                </span>
              </label>
              <button
                type="button"
                className="text-[12px] font-medium transition-colors hover:opacity-75"
                style={{ color: '#3949ab' }}
                onClick={() => alert("Parol tiklash funksiyasi tez orada qo'shiladi.")}
              >
                Parolni unutdingizmi?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold text-[14px] text-white rounded-xl transition-all
                active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              style={{
                height: '46px',
                background: loading ? '#ef9a9a' : '#ef5b5b',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Yuklanmoqda…
                </span>
              ) : 'Kirish'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-0.5">
              <div className="flex-1 h-px bg-[#edf0f7]" />
              <span className="text-[11px]" style={{ color: '#b0bec5' }}>yoki</span>
              <div className="flex-1 h-px bg-[#edf0f7]" />
            </div>

            {/* Google login (UI only) */}
            <button
              type="button"
              className="w-full h-[44px] rounded-xl border-2 border-[#e8edf5] bg-white flex items-center
                justify-center gap-2.5 text-[13px] font-semibold text-[#455a7a]
                hover:bg-[#f7f9fc] transition-colors"
              onClick={() => alert("Google bilan kirish hozircha mavjud emas.")}
            >
              <svg width="17" height="17" viewBox="0 0 48 48" fill="none">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
                <path d="M6.3 14.7l7 5.1C15.1 16.2 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.1-17.7 10.2" fill="#FF3D00"/>
                <path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.7 35.9 27 37 24 37c-6 0-10.7-3.1-11.8-8.5L5.3 34c3.4 6.5 10.2 11 18.7 11z" fill="#4CAF50"/>
                <path d="M44.5 20H24v8.5h11.8c-.7 2.8-2.4 5.1-4.8 6.6l6.6 5.6C42 37 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
              </svg>
              Google bilan kirish
            </button>

            {/* Signup link */}
            <p className="text-center text-[12px] mt-1" style={{ color: '#90a4ae' }}>
              Hisobingiz yo'qmi?{' '}
              <Link
                to="/signup"
                className="font-semibold transition-colors hover:opacity-75"
                style={{ color: '#3949ab' }}
              >
                Ro'yxatdan o'tish
              </Link>
            </p>

          </form>
        </div>

        {/* ═══════════════ RIGHT — CLASSROOM PHOTO ═══════════════ */}
        <div className="flex-1 relative hidden md:block overflow-hidden bg-[#2e5e3e]">
          <img
            src="/classroom-bg.png"
            alt="Yaxshi ustoz - buyuk kelajak"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

      </div>
    </div>
  );
}
