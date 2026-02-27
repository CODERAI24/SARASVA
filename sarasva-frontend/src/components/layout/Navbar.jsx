import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  BookOpen,
  CheckSquare,
  Library,
  LogOut,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth.js";
import { cn } from "@/lib/utils.js";

const NAV_ITEMS = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck   },
  { to: "/timetable",  label: "Timetable",  icon: CalendarDays    },
  { to: "/subjects",   label: "Subjects",   icon: Library         },
  { to: "/exams",      label: "Exams",      icon: BookOpen        },
  { to: "/tasks",      label: "Tasks",      icon: CheckSquare     },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-border bg-card px-3 py-6">
      {/* Brand */}
      <div className="mb-8 px-3">
        <h1 className="text-xl font-bold tracking-tight">Sarasva</h1>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.name}</p>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Profile + Logout at the bottom */}
      <div className="mt-auto flex flex-col gap-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <UserCircle size={16} />
          Profile
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
