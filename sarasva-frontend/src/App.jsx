import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.js";

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

  // Show nothing while checking stored token to avoid flash of wrong page
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <>
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
