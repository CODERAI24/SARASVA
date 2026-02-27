import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.js";

/**
 * Wraps all routes that require authentication.
 * If there is no logged-in user, redirects to /login.
 * Passes the current path as `state.from` so LoginPage can redirect back after login.
 */
export default function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
