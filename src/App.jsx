import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DarsJadvali from './pages/DarsJadvali';
import DarsRejalari from './pages/DarsRejalari';
import Sinflar from './pages/Sinflar';
import Materiallar from './pages/Materiallar';
import Vazifalar from './pages/Vazifalar';
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
    <div className="min-h-screen bg-[#2b3a99] flex items-start justify-center p-2 sm:p-5">
      <div
        className="w-full max-w-[1200px] min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2.5rem)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: '#f0f3fa' }}
      >
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 min-w-0">
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/jadval"      element={<DarsJadvali />} />
              <Route path="/rejalar"     element={<DarsRejalari />} />
              <Route path="/sinflar"     element={<Sinflar />} />
              <Route path="/materiallar" element={<Materiallar />} />
              <Route path="/vazifalar"   element={<Vazifalar />} />
              <Route path="/sozlamalar"  element={<Sozlamalar />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
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
