/**
 * Notifications service — Browser Push + EmailJS email alerts.
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

const APP_ICON = "/SARASVA/icon.svg";

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
   * Show a browser push notification.
   * @param {string} title
   * @param {string} body
   */
  push(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, icon: APP_ICON, badge: APP_ICON });
    } catch {
      // Ignore — some browsers block new Notification() outside service worker
    }
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
        `${riskSubjects.length} subject${riskSubjects.length !== 1 ? "s" : ""} below 75% — check your dashboard.`
      );
      if (user.notificationsEmail && user.email) {
        this.sendAttendanceAlert(user.email, user.name, riskSubjects);
      }
    }

    if (overdueTasks.length > 0) {
      this.push(
        "Overdue Tasks",
        `${overdueTasks.length} task${overdueTasks.length !== 1 ? "s" : ""} past due date.`
      );
      if (user.notificationsEmail && user.email) {
        this.sendTaskAlert(user.email, user.name, overdueTasks);
      }
    }
  },
};
