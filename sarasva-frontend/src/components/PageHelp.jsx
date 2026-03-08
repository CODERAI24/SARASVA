/**
 * PageHelp — floating ? button on every page.
 * Auto-detects the current route and opens a slide-in help drawer.
 * Click backdrop or X to close.
 */

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils.js";

/* ── Per-page help content ────────────────────────────────────────── */
const HELP = {
  "/dashboard": {
    title: "Dashboard",
    items: [
      { q: "Today's Schedule",   a: "Shows your active timetable slots for today. Tap any slot to jump straight to attendance marking." },
      { q: "Attendance Risk",    a: "Subjects below 75% are highlighted in red with exactly how many classes you need to attend — or can skip — to stay on track." },
      { q: "Habits Panel",       a: "Check off your daily habits here. Your streak resets if you miss a day, so mark them every day!" },
      { q: "Tasks Panel",        a: "Lists your top pending tasks. Overdue tasks appear in red. Tap to go to the full Tasks page." },
      { q: "Exam Countdown",     a: "Your nearest upcoming exam is shown with a live countdown. Tap it to go to Exam Prep." },
      { q: "Motivational Quote", a: "A new quote loads every hour. You can toggle this off in Profile → App Settings → Motivation Quotes." },
    ],
  },
  "/subjects": {
    title: "Subjects",
    items: [
      { q: "Add a subject",    a: "Tap + Add Subject, enter the name and save. Active subjects appear in Timetable slots and Attendance." },
      { q: "Add chapters",     a: "Tap a subject to expand it, then tap + Add Chapter. These auto-import when you add the subject to an Exam." },
      { q: "Archive subjects", a: "Tap the archive icon to hide a subject you're no longer studying. Archived subjects are excluded from attendance." },
      { q: "Share subjects",   a: "Open a friend's profile and tap Share to send your entire subject list (including chapters) to them." },
    ],
  },
  "/timetable": {
    title: "Timetable",
    items: [
      { q: "Create a timetable", a: "Tap Create, give it a name (e.g. 'Sem 4 Regular') and optionally a start date. The start date stops it applying to older attendance records." },
      { q: "Add class slots",    a: "Expand a timetable → fill in Day, Subject, From / To time → tap Add Slot. Repeat for each class." },
      { q: "Activate / Deactivate", a: "Only active timetables drive attendance. Tap Activate to enable it. Up to 2 timetables can be active at once (e.g. theory + lab)." },
      { q: "Table vs List view", a: "Table view shows the full week at a glance with color-coded subjects. List view groups slots by day." },
      { q: "Today's classes",    a: "The banner at the top of this page shows today's active slots so you never miss a class." },
    ],
  },
  "/attendance": {
    title: "Attendance",
    items: [
      { q: "Mark attendance",    a: "Tap a class slot for today and choose Present, Absent, Cancelled, or Extra. Cancelled doesn't hurt your %." },
      { q: "Attendance summary", a: "Each subject card shows your current %, how many classes remain, and how many you need (or can skip) for 75%." },
      { q: "Calendar view",      a: "Switch to Calendar to see your full month history with color-coded dots per subject per day." },
      { q: "Retroactive marking",a: "Tap any past date in the Calendar view to mark attendance for that day — useful if you forgot to log it." },
      { q: "Extra class",        a: "Mark a slot as Extra if you attended a bonus class — it boosts your % count." },
    ],
  },
  "/exams": {
    title: "Exam Preparation",
    items: [
      { q: "Create an exam",     a: "Tap + Create New Exam, enter a name and the exam date. The date drives the countdown banner on Dashboard." },
      { q: "Add subjects",       a: "Expand an exam → check one or more subjects from the checklist → tap Add N Subjects. All are added in a single tap." },
      { q: "Track chapters",     a: "For each chapter: tap Mark Studied when theory is done, and + Practice each time you revise it." },
      { q: "Study deadline",     a: "Tap the calendar icon on a subject block to set a deadline for finishing that subject." },
      { q: "Spaced repetition",  a: "When all chapters of a subject are complete, tap Remind Me to auto-create a revision task after your chosen number of days." },
      { q: "Not Yet Studied",    a: "The amber panel inside each exam lists chapters where theory is still not marked done — use it as your to-do list." },
    ],
  },
  "/tasks": {
    title: "Tasks",
    items: [
      { q: "Add a task",          a: "Tap + Add Task, enter a title, choose priority (Low / Medium / High), and optionally set a due date." },
      { q: "Due-day reminders",   a: "Tasks due today send browser notifications every 2 hours (requires notifications to be enabled in Profile)." },
      { q: "Complete a task",     a: "Tap the circle/check icon to mark a task done. Completed tasks move to the bottom." },
      { q: "Archive",             a: "Tap the archive icon to remove a task from your active list without deleting it permanently." },
      { q: "7-day auto-cleanup",  a: "The Dashboard prompts you once per session to bulk-archive completed tasks older than 7 days." },
      { q: "Priority colors",     a: "High = red, Medium = amber, Low = grey — visible at a glance so you tackle the right tasks first." },
    ],
  },
  "/habits": {
    title: "Habits",
    items: [
      { q: "Add a habit",   a: "Tap + Add Habit and name it (e.g. 'Read 20 mins', 'Exercise', 'Meditate')." },
      { q: "Mark daily",    a: "Check off each habit from the Habits panel on the Dashboard every day. You can also mark them here." },
      { q: "Streaks",       a: "Your streak count increases each consecutive day you mark a habit. Missing a day resets it to 0." },
      { q: "Delete a habit",a: "Tap the trash icon on a habit to remove it and its full history." },
    ],
  },
  "/calendar": {
    title: "Calendar",
    items: [
      { q: "Read the dots",       a: "Each date shows colored dots — one per subject. Green = present, Red = absent, Grey = cancelled, Violet = extra." },
      { q: "Mark past attendance",a: "Tap any past date to open the attendance panel for that day and retroactively mark slots." },
      { q: "Navigate months",     a: "Use the ← → arrows to move between months. Today is always highlighted." },
      { q: "No dots on a date",   a: "If a date has no dots, either no timetable was active that day or attendance wasn't marked yet." },
    ],
  },
  "/profile": {
    title: "Profile & Settings",
    items: [
      { q: "Avatar",            a: "Tap an emoji to use it as your avatar, or tap the initials option and pick a background color." },
      { q: "Personal info",     a: "Tap Edit to update your name, course, semester, and institute. Saved to all connected devices instantly." },
      { q: "Change email / password", a: "Expand Account & Security. Both actions require your current password for security verification." },
      { q: "App Settings",      a: "Toggle Focus Mode, Motivation Quotes, Safe Mode, and more. Changes auto-save to the cloud." },
      { q: "Notifications",     a: "Tap Enable to allow browser notifications for class reminders (5 min before) and task due-day alerts." },
      { q: "Active Sessions",   a: "Lists every device where you're logged in. Tap Sign Out on any device to remotely kick it out instantly." },
      { q: "App Guide",         a: "Tap View Guide to replay the full 10-step feature walkthrough anytime from scratch." },
    ],
  },
  "/ptp": {
    title: "Friends & Groups",
    items: [
      { q: "Add a friend",         a: "Tap + Add Friend and search by name. The other person must accept the request before you're connected." },
      { q: "Share timetable",      a: "Open a friend's profile → tap Share next to any of your timetables to send it to them." },
      { q: "Share subjects",       a: "Same as timetable — open a friend's profile and share your subject list (chapters included)." },
      { q: "Import a share",       a: "When a friend shares something, a download icon appears on their profile. Tap it to import into your account." },
      { q: "Groups",               a: "Tap + Create Group to make a shared space. Add members and share timetables or subjects with everyone at once." },
      { q: "Remove a friend",      a: "Open the friend's profile, tap the remove icon, and confirm. This removes them from both sides." },
    ],
  },
};

function getHelp(pathname) {
  const key = Object.keys(HELP).find(
    (k) => pathname === k || pathname.startsWith(k + "/")
  );
  return key ? { ...HELP[key], key } : null;
}

/* ── Component ────────────────────────────────────────────────────── */
export default function PageHelp() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const help = getHelp(pathname);
  if (!help) return null;

  return (
    <>
      {/* ── Floating help button ── */}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 lg:top-6 lg:right-6 z-20 flex items-center gap-1.5 rounded-full border border-border bg-card/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground transition-colors"
        title="How to use this page"
      >
        <HelpCircle size={13} />
        Help
      </button>

      {/* ── Backdrop (click to close) ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in drawer from right ── */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[min(340px,92vw)] bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border px-5 py-4 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <HelpCircle size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">How to use</p>
              <h3 className="text-sm font-bold leading-tight">{help.title}</h3>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {help.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              {/* Number badge */}
              <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-semibold leading-snug">{item.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}

          <p className="text-[10px] text-muted-foreground/60 text-center pt-2">
            Tap anywhere outside to close
          </p>
        </div>
      </div>
    </>
  );
}
