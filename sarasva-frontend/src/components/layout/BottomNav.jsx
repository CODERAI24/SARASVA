import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  CheckSquare,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils.js";

/**
 * Subjects and Schedule are accessible via the hamburger SideDrawer.
 * PTP (Study Peers) replaces them here.
 */
const ITEMS = [
  { to: "/dashboard",  label: "Home",   icon: LayoutDashboard },
  { to: "/attendance", label: "Attend", icon: CalendarCheck   },
  { to: "/exams",      label: "Exams",  icon: BookOpen        },
  { to: "/tasks",      label: "Tasks",  icon: CheckSquare     },
  { to: "/ptp",        label: "Peers",  icon: Users2          },
];

/**
 * Fixed bottom navigation bar — visible only on mobile (hidden on lg+).
 */
export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 lg:hidden border-t border-border bg-card">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon size={19} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
