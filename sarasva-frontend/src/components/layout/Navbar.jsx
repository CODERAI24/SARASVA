import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  BookOpen,
  CheckSquare,
  Library,
  LogOut,
  Calendar,
  Users2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth.js";
import { cn } from "@/lib/utils.js";
import UserAvatar from "@/components/UserAvatar.jsx";

const NAV_ITEMS = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck   },
  { to: "/timetable",  label: "Timetable",  icon: CalendarDays    },
  { to: "/subjects",   label: "Subjects",   icon: Library         },
  { to: "/exams",      label: "Exams",      icon: BookOpen        },
  { to: "/tasks",      label: "Tasks",      icon: CheckSquare     },
  { to: "/calendar",   label: "Calendar",   icon: Calendar        },
  { to: "/ptp",        label: "Study Peers",icon: Users2          },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-border bg-card px-3 py-5">

      {/* Brand */}
      <div className="mb-6 px-2 flex items-center gap-2.5">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-primary/25 blur-md" />
          <img
            src="/SARASVA/logo.png"
            alt="Sarasva"
            className="relative h-9 w-9 rounded-xl object-contain shadow-sm"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-gradient">Sarasva</h1>
          <p className="truncate text-[11px] text-muted-foreground leading-tight max-w-[108px]">{user?.name}</p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "gradient-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Admin link */}
      {user?.role === "admin" && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              "mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              isActive
                ? "gradient-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )
          }
        >
          <Sparkles size={15} />
          Admin
        </NavLink>
      )}

      {/* Profile + Logout */}
      <div className="mt-auto flex flex-col gap-0.5 border-t border-border pt-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              isActive
                ? "gradient-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )
          }
        >
          <UserAvatar user={user} size="xs" />
          Profile
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
