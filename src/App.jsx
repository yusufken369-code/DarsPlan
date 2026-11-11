import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DarsJadvali from './pages/DarsJadvali';
import Sinflar from './pages/Sinflar';
import SinfDavomati from './pages/SinfDavomati';
import Jurnal from './pages/Jurnal';
import Hisobotlar from './pages/Hisobotlar';
import Sozlamalar from './pages/Sozlamalar';
import SignUp from './pages/SignUp';
import Login from './pages/Login';

/* ── Branded loading state ── */
function AppLoader() {
  return (
    <div className="min-h-screen bg-[#2b3a99] flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
          <GraduationCap size={24} className="text-white" />
        </div>
        <span className="text-white font-extrabold text-2xl tracking-wide">DarsPlan</span>
      </div>
      <div className="flex items-center gap-2.5 text-white/80 text-sm font-medium">
        <svg className="animate-spin w-5 h-5 text-[#ef5b5b]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Yuklanmoqda…</span>
      </div>
    </div>
  );
}

/* ── Protected Route: only authenticated users can enter ── */
function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

/* ── Public Only Route: redirect to dashboard if already authenticated ── */
function PublicOnlyRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ── Dashboard shell layout for protected pages ── */
function DashboardLayout() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#f0f3fa] dark:bg-[#0b1120] text-[#283593] dark:text-slate-100 transition-colors duration-200">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 pb-20 md:pb-5 min-w-0 h-full">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/jadval"      element={<DarsJadvali />} />
            <Route path="/sinflar"             element={<Sinflar />} />
            <Route path="/sinflar/:classId"    element={<SinfDavomati />} />
            <Route path="/jurnal"      element={<Jurnal />} />
            <Route path="/hisobotlar"  element={<Hisobotlar />} />
            <Route path="/sozlamalar"  element={<Sozlamalar />} />

            {/* Eski yo'nalishlar uchun avtomatik yo'naltirish */}
            <Route path="/rejalar"     element={<Navigate to="/jurnal" replace />} />
            <Route path="/materiallar" element={<Navigate to="/hisobotlar" replace />} />
            <Route path="/vazifalar"   element={<Navigate to="/jurnal" replace />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignUp />
          </PublicOnlyRoute>
        }
      />

      {/* Protected routes wrapped in guard */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
