import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import Navbar      from "./Navbar.jsx";
import BottomNav   from "./BottomNav.jsx";
import SideDrawer  from "./SideDrawer.jsx";
import { useAuth } from "@/hooks/useAuth.js";
import UserAvatar  from "@/components/UserAvatar.jsx";

/**
 * Wraps every authenticated page with:
 *   Desktop — left sidebar (Navbar)
 *   Mobile  — top header (with hamburger) + bottom navigation bar (BottomNav)
 *             + slide-in SideDrawer for quick actions
 */
export default function AppLayout() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile/tablet, shown at lg (1024px+) */}
      <Navbar />

      {/* Content column */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile/tablet top bar — hidden on desktop */}
        <header className="flex lg:hidden shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Hamburger — opens SideDrawer */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="-ml-1 rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Open quick actions"
            >
              <Menu size={20} />
            </button>
            <span className="text-lg font-bold tracking-tight">Sarasva</span>
          </div>
          <Link to="/profile" title="Profile">
            <UserAvatar user={user} size="sm" />
          </Link>
        </header>

        {/* Page content — scrollable */}
        {/* pb-20 on mobile/tablet leaves room above the fixed bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — fixed to viewport, hidden on desktop */}
      <BottomNav />

      {/* Slide-in quick-actions drawer (mobile only) */}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
