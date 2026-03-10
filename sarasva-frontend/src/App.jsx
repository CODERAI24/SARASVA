import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { WifiOff } from "lucide-react";

import AppLayout      from "@/components/layout/AppLayout.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";

import LoginPage      from "@/pages/auth/LoginPage.jsx";
import RegisterPage   from "@/pages/auth/RegisterPage.jsx";
import DashboardPage  from "@/pages/dashboard/DashboardPage.jsx";
import AttendancePage from "@/pages/attendance/AttendancePage.jsx";
import TimetablePage  from "@/pages/timetable/TimetablePage.jsx";
import SubjectsPage   from "@/pages/subjects/SubjectsPage.jsx";
import ExamsPage      from "@/pages/exams/ExamsPage.jsx";
import TasksPage      from "@/pages/tasks/TasksPage.jsx";
import ProfilePage    from "@/pages/profile/ProfilePage.jsx";
import CalendarPage        from "@/pages/calendar/CalendarPage.jsx";
import PTPPage             from "@/pages/ptp/PTPPage.jsx";
import GroupDetailPage     from "@/pages/ptp/GroupDetailPage.jsx";
import FriendDetailPage    from "@/pages/ptp/FriendDetailPage.jsx";
import AdminPage           from "@/pages/admin/AdminPage.jsx";

/* ── Offline banner ────────────────────────────────────────────────── */
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 py-1.5 text-xs font-semibold text-white">
      <WifiOff size={13} /> You're offline — showing cached data
    </div>
  );
}

function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Show banner when a new SW is waiting (about to take control)
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) setShow(true);
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      });
    });
  }, []);

  if (!show) return null;
  return (
    <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-xl bg-primary px-4 py-3 shadow-2xl text-white text-sm font-medium">
      <span>New update available!</span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold transition-colors"
      >
        Tap to update
      </button>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  // Show a skeleton while Firebase resolves auth state
  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 text-center">
          <div className="h-3 w-32 rounded bg-muted animate-pulse mx-auto" />
          <div className="h-2 w-20 rounded bg-muted animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <>
    <OfflineBanner />
    <UpdateBanner />
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — wrapped inside the main layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index                  element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/attendance"     element={<AttendancePage />} />
          <Route path="/timetable"      element={<TimetablePage />} />
          <Route path="/subjects"       element={<SubjectsPage />} />
          <Route path="/exams"          element={<ExamsPage />} />
          <Route path="/tasks"          element={<TasksPage />} />
          <Route path="/profile"        element={<ProfilePage />} />
          <Route path="/calendar"           element={<CalendarPage />} />
          <Route path="/ptp"                         element={<PTPPage />} />
          <Route path="/ptp/group/:groupId"          element={<GroupDetailPage />} />
          <Route path="/ptp/friend/:friendUid"       element={<FriendDetailPage />} />
          <Route path="/admin"                        element={<AdminPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}
