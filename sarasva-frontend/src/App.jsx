import { Routes, Route, Navigate } from "react-router-dom";
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
          <Route path="/ptp"                element={<PTPPage />} />
          <Route path="/ptp/group/:groupId" element={<GroupDetailPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
