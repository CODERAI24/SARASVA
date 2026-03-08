/**
 * OnboardingGuide — first-time walkthrough + revisitable tutorial
 *
 * Usage:
 *   • Wrap your authenticated layout with <OnboardingProvider>
 *   • The guide auto-shows on the very first visit (localStorage flag)
 *   • From anywhere: const { startGuide } = useOnboarding(); startGuide();
 */

import { createContext, useContext, useState, useEffect } from "react";
import { cn } from "@/lib/utils.js";
import {
  Sparkles, LayoutDashboard, BookOpen, CalendarDays,
  CheckSquare, GraduationCap, ListTodo, Flame, Users, Settings,
} from "lucide-react";

/* ── Steps definition ─────────────────────────────────────────────── */
const STEPS = [
  {
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Welcome to Sarasva!",
    desc: "Your all-in-one academic tracker. This quick guide walks you through every feature. Tap Next to begin.",
    tips: [],
  },
  {
    icon: LayoutDashboard,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Dashboard",
    desc: "Your home screen — everything at a glance.",
    tips: [
      "See today's timetable and which class is next",
      "Attendance risk alerts for subjects below 75%",
      "Exam countdown banner when an exam is near",
      "Pending tasks due today with priority colors",
      "Habit check-ins and a rotating motivational quote",
    ],
  },
  {
    icon: BookOpen,
    color: "text-purple-600",
    bg: "bg-purple-50",
    title: "Subjects",
    desc: "Start here — add all your semester subjects first.",
    tips: [
      "Tap + Add Subject and enter the subject name",
      "Open a subject to add chapters (they auto-import into Exams)",
      "Archive subjects you're no longer studying to declutter",
      "Share your subject list with friends via Friends & Groups",
    ],
  },
  {
    icon: CalendarDays,
    color: "text-green-600",
    bg: "bg-green-50",
    title: "Timetable",
    desc: "Set up your weekly class schedule for attendance tracking.",
    tips: [
      "Create a timetable (e.g. \"Sem 4 Regular\") and give it a start date",
      "Add slots: choose a day, subject, start time and end time",
      "Tap Activate — only active timetables are used for attendance",
      "Up to 2 timetables can be active at once (e.g. theory + lab)",
      "Today's classes are shown in a banner at the top of the page",
    ],
  },
  {
    icon: CheckSquare,
    color: "text-orange-600",
    bg: "bg-orange-50",
    title: "Attendance",
    desc: "Mark and track your class attendance day by day.",
    tips: [
      "Tap any class slot on the Attendance page to mark it",
      "Status options: Present, Absent, Cancelled, or Extra class",
      "Each subject shows your current % and how many classes you need",
      "Switch to Calendar view to see a month at a glance",
      "You can retroactively mark past dates from the calendar",
    ],
  },
  {
    icon: GraduationCap,
    color: "text-rose-600",
    bg: "bg-rose-50",
    title: "Exam Preparation",
    desc: "Track chapter-by-chapter study progress for each exam.",
    tips: [
      "Create an exam and set the exam date",
      "Check multiple subjects at once — they're all added in a single tap",
      "For each chapter: mark it Studied (theory) or add Practice rounds",
      "Set a per-subject study deadline to pace yourself",
      "When all chapters are done, schedule a spaced-repetition reminder",
    ],
  },
  {
    icon: ListTodo,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Tasks",
    desc: "Stay on top of assignments and to-dos with priorities.",
    tips: [
      "Add a task with a title, priority (Low / Medium / High), and due date",
      "Tasks due today will remind you every 2 hours via browser notifications",
      "Mark tasks complete or archive them to keep the list clean",
      "The Dashboard shows your top pending tasks for quick access",
    ],
  },
  {
    icon: Flame,
    color: "text-red-500",
    bg: "bg-red-50",
    title: "Habits",
    desc: "Build daily habits and maintain streaks.",
    tips: [
      "Add habits from the Habits section in the navigation",
      "Check off each habit from the Dashboard panel every day",
      "Your streak counter resets if you miss a day — stay consistent!",
      "Habit progress is visible on the Dashboard at a glance",
    ],
  },
  {
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
    title: "Friends & Groups",
    desc: "Connect with classmates and share academic resources.",
    tips: [
      "Search for friends by name and send a friend request",
      "Open a friend's profile to share your timetable or subject list",
      "Received shares appear with a download icon — tap to import",
      "Create Groups to share resources with multiple people at once",
    ],
  },
  {
    icon: Settings,
    color: "text-slate-600",
    bg: "bg-slate-100",
    title: "Profile & Settings",
    desc: "Personalize your Sarasva experience.",
    tips: [
      "Pick an avatar emoji or use your initials with a custom color",
      "Enable browser notifications for class reminders and task alerts",
      "Toggle Focus Mode, Motivation Quotes, and Safe Mode from App Settings",
      "Change your email or password from Account & Security",
      "Tap \"View App Guide\" in App Settings to revisit this guide anytime",
    ],
  },
];

/* ── localStorage key ─────────────────────────────────────────────── */
const LS_KEY = "sarasva_guide_v1_done";

/* ── Context ──────────────────────────────────────────────────────── */
const OnboardingContext = createContext(null);
export function useOnboarding() { return useContext(OnboardingContext); }

/* ── Provider (mount once in AppLayout) ──────────────────────────── */
export function OnboardingProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Auto-show on first-ever visit (localStorage flag absent)
  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) {
      setOpen(true);
    }
  }, []);

  function startGuide() {
    setStep(0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    localStorage.setItem(LS_KEY, "1");
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <OnboardingContext.Provider value={{ startGuide }}>
      {children}
      {open && (
        <GuideModal
          step={step}
          total={STEPS.length}
          onNext={next}
          onBack={back}
          onSkip={close}
        />
      )}
    </OnboardingContext.Provider>
  );
}

/* ── Modal ────────────────────────────────────────────────────────── */
function GuideModal({ step, total, onNext, onBack, onSkip }) {
  const s    = STEPS[step];
  const Icon = s.icon;
  const isFirst = step === 0;
  const isLast  = step === total - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* Top row: step counter + skip */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Step {step + 1} of {total}
            </span>
            {!isLast && (
              <button
                onClick={onSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip guide
              </button>
            )}
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className={cn("rounded-2xl p-5", s.bg)}>
              <Icon size={38} className={s.color} strokeWidth={1.8} />
            </div>
          </div>

          {/* Title + description */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>

          {/* Tip bullets */}
          {s.tips.length > 0 && (
            <ul className="space-y-2 rounded-xl bg-muted/50 px-4 py-3">
              {s.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-foreground leading-snug">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === step
                    ? "w-5 h-1.5 bg-primary"
                    : i < step
                    ? "w-1.5 h-1.5 bg-primary/40"
                    : "w-1.5 h-1.5 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={onBack}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={onNext}
              className={cn(
                "rounded-xl py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 transition-opacity",
                isFirst ? "w-full" : "flex-1"
              )}
            >
              {isLast ? "Let's go! 🎉" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
