/**
 * Notifications service — Browser Push + EmailJS email alerts + Period/Task scheduling.
 *
 * EmailJS Setup (free at emailjs.com):
 *  1. Create account → add Email Service (Gmail recommended)
 *  2. Create two email templates:
 *       - Attendance risk template (template vars: {{to_name}}, {{subject_list}}, {{reply_to}})
 *       - Task overdue template  (template vars: {{to_name}}, {{task_list}}, {{reply_to}})
 *  3. Copy Service ID, Public Key, and both Template IDs into .env.local
 */
import emailjs from "@emailjs/browser";

// EmailJS client-side credentials (safe to expose — public keys only)
const SERVICE_ID = "service_hjvrjoa";
const PUBLIC_KEY = "ED2eDc6-CLeSavBsg";
// Add your template IDs here once created in the EmailJS dashboard
const TPL_ATTEND = import.meta.env.VITE_EMAILJS_TPL_ATTEND || "";
const TPL_TASK   = import.meta.env.VITE_EMAILJS_TPL_TASK   || "";

const APP_ICON = "/SARASVA/logo.png";
const BASE_URL  = window.location.origin;

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// Track scheduled timers for cleanup on re-schedule
let _periodTimers = [];
let _taskTimers   = [];

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

/* ── Browser Push ─────────────────────────────────────────────────── */
export const notificationsService = {

  /** Ask for browser notification permission. */
  async requestPermission() {
    if (!("Notification" in window)) return "denied";
    return Notification.requestPermission();
  },

  /** Get current browser permission status. */
  get permission() {
    if (!("Notification" in window)) return "denied";
    return Notification.permission;
  },

  /**
   * Show a browser push notification with optional click-through URL.
   * @param {string} title
   * @param {string} body
   * @param {object} opts — { tag, path } where path is e.g. "/attendance"
   */
  push(title, body, { tag, path } = {}) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      const n = new Notification(title, { body, icon: APP_ICON, badge: APP_ICON, tag });
      if (path) {
        n.onclick = () => { window.focus(); window.location.href = BASE_URL + path; };
      }
    } catch {
      // Ignore — some browsers block new Notification() outside service worker
    }
  },

  /**
   * Schedule period (class) notifications for today.
   * Shows a notification 5 minutes before each class, clickable → /attendance.
   *
   * @param {Array}    slots          — active timetable slots for all active TTs
   * @param {Function} getSubjectName — (subjectId) => name string
   */
  schedulePeriodNotifications(slots, getSubjectName) {
    _periodTimers.forEach(clearTimeout);
    _periodTimers = [];
    if (Notification.permission !== "granted") return;

    const now      = new Date();
    const todayDay = DAYS[now.getDay()];

    slots
      .filter((s) => s.day === todayDay)
      .forEach((slot) => {
        if (!slot.startTime) return;
        const [h, m] = slot.startTime.split(":").map(Number);
        const fireAt = new Date(now);
        fireAt.setHours(h, Math.max(0, m - 5), 0, 0); // 5 min before
        const delay  = fireAt - now;
        if (delay <= 0) return;

        const subjectName = getSubjectName?.(slot.subjectId) || slot.subjectName || "Class";
        const timer = setTimeout(() => {
          this.push(
            `🔔 ${subjectName} in 5 minutes`,
            `Starting at ${slot.startTime}${slot.room ? " · " + slot.room : ""} — mark attendance after class!`,
            { tag: `period-${slot.id ?? slot.subjectId}`, path: "/attendance" }
          );
        }, delay);
        _periodTimers.push(timer);
      });
  },

  /**
   * Schedule pending-task reminders every 2 hours for tasks due today.
   * Fires at +2h, +4h, +6h from now (capped at 10 PM).
   *
   * @param {Array} tasks
   */
  scheduleTaskReminders(tasks) {
    _taskTimers.forEach(clearTimeout);
    _taskTimers = [];
    if (Notification.permission !== "granted") return;

    const today   = todayDateStr();
    const pending = tasks.filter((t) => !t.completed && !t.archived && t.dueDate === today);
    if (!pending.length) return;

    const now      = new Date();
    const endOfDay = new Date(now); endOfDay.setHours(22, 0, 0, 0);

    [2, 4, 6].forEach((hrs) => {
      const fireAt = new Date(now.getTime() + hrs * 3600 * 1000);
      if (fireAt > endOfDay) return;
      const timer = setTimeout(() => {
        this.push(
          `📋 ${pending.length} task${pending.length !== 1 ? "s" : ""} due today`,
          pending.slice(0, 3).map((t) => t.title).join(" · "),
          { tag: "tasks-due-today", path: "/tasks" }
        );
      }, fireAt - now);
      _taskTimers.push(timer);
    });
  },

  /* ── EmailJS ──────────────────────────────────────────────────────── */

  /** Send attendance risk email via EmailJS. */
  async sendAttendanceAlert(toEmail, toName, riskSubjects) {
    if (!SERVICE_ID || !PUBLIC_KEY || !TPL_ATTEND) return;
    const subjectList = riskSubjects
      .map((s) => `• ${s.subject.name}: ${s.percent}% (need ${s.classesNeededFor75} more classes)`)
      .join("\n");
    try {
      await emailjs.send(
        SERVICE_ID,
        TPL_ATTEND,
        {
          to_email:    toEmail,
          to_name:     toName,
          subject_list: subjectList,
          reply_to:    toEmail,
        },
        PUBLIC_KEY
      );
    } catch {
      // Email send is best-effort; silently ignore failures
    }
  },

  /** Send task overdue email via EmailJS. */
  async sendTaskAlert(toEmail, toName, overdueTasks) {
    if (!SERVICE_ID || !PUBLIC_KEY || !TPL_TASK) return;
    const taskList = overdueTasks
      .map((t) => `• ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})` : ""}`)
      .join("\n");
    try {
      await emailjs.send(
        SERVICE_ID,
        TPL_TASK,
        {
          to_email:  toEmail,
          to_name:   toName,
          task_list: taskList,
          reply_to:  toEmail,
        },
        PUBLIC_KEY
      );
    } catch {
      // Best-effort
    }
  },

  /**
   * Run all alert checks once per calendar day per user.
   * Call this from DashboardPage after data loads.
   *
   * @param {{ id: string, email: string, name: string, notificationsEmail?: boolean }} user
   * @param {Array} subjects  — from useAttendanceSummary
   * @param {Array} tasks     — from useTasks
   */
  checkAndAlert(user, subjects, tasks) {
    if (!user) return;
    // Throttle to once per calendar day
    const sessionKey = `sarasva_alerted_${user.id}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    const riskSubjects = subjects.filter((s) => s.zone === "risk");
    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    );

    if (riskSubjects.length > 0) {
      this.push(
        "Attendance Risk ⚠️",
        `${riskSubjects.length} subject${riskSubjects.length !== 1 ? "s" : ""} below 75% — check your dashboard.`,
        { tag: "att-risk", path: "/attendance" }
      );
      if (user.notificationsEmail && user.email) {
        this.sendAttendanceAlert(user.email, user.name, riskSubjects);
      }
    }

    if (overdueTasks.length > 0) {
      this.push(
        "Overdue Tasks",
        `${overdueTasks.length} task${overdueTasks.length !== 1 ? "s" : ""} past due date.`,
        { tag: "tasks-overdue", path: "/tasks" }
      );
      if (user.notificationsEmail && user.email) {
        this.sendTaskAlert(user.email, user.name, overdueTasks);
      }
    }
  },

  /** Notify that a new friend request arrived. */
  notifyFriendRequest(fromName) {
    this.push(
      `👋 Friend request from ${fromName}`,
      "Tap to view and respond on your Study Peers page.",
      { tag: `friend-req-${fromName}`, path: "/ptp" }
    );
  },
};
