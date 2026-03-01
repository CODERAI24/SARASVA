import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  CheckSquare,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils.js";

const ITEMS = [
  { to: "/dashboard",  label: "Home",   icon: LayoutDashboard },
  { to: "/attendance", label: "Attend", icon: CalendarCheck   },
  { to: "/exams",      label: "Exams",  icon: BookOpen        },
  { to: "/tasks",      label: "Tasks",  icon: CheckSquare     },
  { to: "/ptp",        label: "Peers",  icon: Users2          },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 lg:hidden border-t border-border bg-card/95 backdrop-blur-sm">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* Active glow pill behind icon */}
              {isActive && (
                <span className="absolute top-2 left-1/2 -translate-x-1/2 h-8 w-10 rounded-full gradient-primary-soft animate-scale-in" />
              )}
              <Icon size={19} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
