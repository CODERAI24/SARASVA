import { Outlet, Link } from "react-router-dom";
import { UserCircle } from "lucide-react";
import Navbar    from "./Navbar.jsx";
import BottomNav from "./BottomNav.jsx";
import { useAuth } from "@/hooks/useAuth.js";

/**
 * Wraps every authenticated page with:
 *   Desktop — left sidebar (Navbar)
 *   Mobile  — top header + bottom navigation bar (BottomNav)
 */
export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <Navbar />

      {/* Content column */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile top bar — hidden on desktop */}
        <header className="flex md:hidden shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
          <span className="text-lg font-bold tracking-tight">Sarasva</span>
          <Link to="/profile" className="text-muted-foreground hover:text-foreground" title="Profile">
            <UserCircle size={22} />
          </Link>
        </header>

        {/* Page content — scrollable */}
        {/* pb-20 on mobile leaves room above the fixed bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — fixed to viewport, hidden on desktop */}
      <BottomNav />
    </div>
  );
}
