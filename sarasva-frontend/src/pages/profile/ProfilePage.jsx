import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { authService } from "@/services/auth.service.js";
import { notificationsService } from "@/services/notifications.service.js";
import { auth } from "@/firebase/config.js";
import UserAvatar, { AVATAR_COLORS, AVATAR_EMOJIS } from "@/components/UserAvatar.jsx";
import {
  User, Mail, BookOpen, Hash, Settings2, Check, KeyRound,
  BellRing, BellOff, Building2, Pencil, X, ChevronDown, ChevronUp,
  Lock, AtSign, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils.js";

const SETTINGS_LIST = [
  { key: "focusModeEnabled",   label: "Focus Mode",        desc: "Hide distracting elements during study sessions" },
  { key: "strictFocusEnabled", label: "Strict Focus",      desc: "Lock navigation while focus mode is active" },
  { key: "motivationEnabled",  label: "Motivation Quotes", desc: "Show inspirational quotes on the dashboard" },
  { key: "analyticsEnabled",   label: "Analytics",         desc: "Track detailed study and attendance patterns" },
  { key: "safeModeEnabled",    label: "Safe Mode",         desc: "Show confirmation dialogs before destructive actions" },
];

function Toggle({ on, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        on ? "bg-primary" : "bg-input"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out",
        on ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  );
}

function Accordion({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          {Icon && <Icon size={14} />}
          {title}
        </h3>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">{children}</div>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const providers = auth.currentUser?.providerData.map((p) => p.providerId) ?? [];
  const hasPassword = providers.includes("password");

  /* ── Avatar ─────────────────────────────────────────────────────── */
  const [avatarColor,   setAvatarColor]   = useState(user?.avatarColor ?? "#6366f1");
  const [avatarEmoji,   setAvatarEmoji]   = useState(user?.avatarEmoji ?? null);
  const [avatarSaving,  setAvatarSaving]  = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  async function handleSaveAvatar() {
    setAvatarSaving(true);
    try {
      await authService.updateAvatar({ avatarColor, avatarEmoji: avatarEmoji ?? null });
      await refreshUser();
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 2000);
    } finally { setAvatarSaving(false); }
  }

  /* ── Personal info (edit-gated) ─────────────────────────────────── */
  const [editing,       setEditing]       = useState(false);
  const [profile,       setProfile]       = useState({ name: user?.name ?? "", course: user?.course ?? "", semester: user?.semester ?? "", institute: user?.institute ?? "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess,setProfileSuccess]= useState(false);
  const [profileError,  setProfileError]  = useState("");

  function startEdit() {
    setProfile({ name: user?.name ?? "", course: user?.course ?? "", semester: user?.semester ?? "", institute: user?.institute ?? "" });
    setEditing(true);
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    if (!profile.name.trim()) return;
    setProfileSaving(true); setProfileError(""); setProfileSuccess(false);
    try {
      await authService.updateProfile({ name: profile.name.trim(), course: profile.course.trim(), semester: profile.semester.trim(), institute: profile.institute.trim() });
      await refreshUser();
      setProfileSuccess(true); setEditing(false);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) { setProfileError(err.message || "Failed to save."); }
    finally { setProfileSaving(false); }
  }

  /* ── Change email ────────────────────────────────────────────────── */
  const [emailForm,    setEmailForm]    = useState({ currentPw: "", newEmail: "" });
  const [emailSaving,  setEmailSaving]  = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError,   setEmailError]   = useState("");

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailSaving(true); setEmailError(""); setEmailSuccess(false);
    try {
      await authService.changeEmail(emailForm.currentPw, emailForm.newEmail.trim());
      await refreshUser();
      setEmailSuccess(true);
      setEmailForm({ currentPw: "", newEmail: "" });
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      setEmailError(err.code === "auth/wrong-password" ? "Incorrect current password." : err.message);
    } finally { setEmailSaving(false); }
  }

  /* ── Change password ─────────────────────────────────────────────── */
  const [pwForm,    setPwForm]    = useState({ currentPw: "", newPw: "", confirmPw: "" });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError,   setPwError]   = useState("");

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirmPw) { setPwError("Passwords do not match."); return; }
    if (pwForm.newPw.length < 6) { setPwError("Min 6 characters."); return; }
    setPwSaving(true); setPwError(""); setPwSuccess(false);
    try {
      await authService.changePassword(pwForm.currentPw, pwForm.newPw);
      setPwSuccess(true);
      setPwForm({ currentPw: "", newPw: "", confirmPw: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.code === "auth/wrong-password" ? "Incorrect current password." : err.message);
    } finally { setPwSaving(false); }
  }

  /* ── Set password (Google-only) ─────────────────────────────────── */
  const [addPwForm,    setAddPwForm]    = useState({ password: "", confirm: "" });
  const [addPwSaving,  setAddPwSaving]  = useState(false);
  const [addPwSuccess, setAddPwSuccess] = useState(false);
  const [addPwError,   setAddPwError]   = useState("");

  async function handleSetPassword(e) {
    e.preventDefault();
    if (addPwForm.password !== addPwForm.confirm) { setAddPwError("Passwords do not match."); return; }
    if (addPwForm.password.length < 6) { setAddPwError("Min 6 characters."); return; }
    setAddPwSaving(true); setAddPwError(""); setAddPwSuccess(false);
    try {
      await authService.addPassword(addPwForm.password);
      setAddPwSuccess(true);
      setAddPwForm({ password: "", confirm: "" });
    } catch (err) { setAddPwError(err.message || "Failed to set password."); }
    finally { setAddPwSaving(false); }
  }

  /* ── Settings ────────────────────────────────────────────────────── */
  const [settings, setSettings] = useState(user?.settings ?? {
    focusModeEnabled: true, strictFocusEnabled: false, motivationEnabled: true, analyticsEnabled: true, safeModeEnabled: true,
  });
  const [settingsSaving,  setSettingsSaving]  = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError,   setSettingsError]   = useState("");

  async function handleToggle(key) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated); setSettingsSaving(true); setSettingsError(""); setSettingsSuccess(false);
    try {
      await authService.updateSettings(updated); await refreshUser();
      setSettingsSuccess(true); setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (err) { setSettings(settings); setSettingsError(err.message || "Failed to save."); }
    finally { setSettingsSaving(false); }
  }

  /* ── Notifications ───────────────────────────────────────────────── */
  const [pushPermission, setPushPermission] = useState(
    () => (typeof Notification !== "undefined" ? Notification.permission : "denied")
  );
  const [emailNotif,   setEmailNotif]   = useState(user?.notificationsEmail ?? false);
  const [notifSaving,  setNotifSaving]  = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  async function handleEmailNotifToggle() {
    const newVal = !emailNotif;
    setEmailNotif(newVal); setNotifSaving(true); setNotifSuccess(false);
    try {
      await authService.updateNotificationPrefs({ notificationsEmail: newVal }); await refreshUser();
      setNotifSuccess(true); setTimeout(() => setNotifSuccess(false), 2000);
    } catch { setEmailNotif(!newVal); }
    finally { setNotifSaving(false); }
  }

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-xl space-y-5">

      <div>
        <h2 className="text-2xl font-bold">Profile & Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your identity, security, and preferences.</p>
      </div>

      {/* ── Avatar ───────────────────────────────────────────────────── */}
      <Accordion title="Profile Picture" icon={Palette} defaultOpen>
        <div className="flex items-center gap-5">
          <UserAvatar user={{ name: user?.name, avatarColor, avatarEmoji }} size="xl" />
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Style — pick an emoji or use initials</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_EMOJIS.map((em, i) => (
              <button
                key={i}
                onClick={() => setAvatarEmoji(em)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-lg transition-all border-2",
                  avatarEmoji === em ? "border-primary scale-110 shadow-md" : "border-transparent bg-muted hover:scale-105"
                )}
                style={em === null ? { background: avatarColor } : {}}
                title={em === null ? "Initials" : em}
              >
                {em === null
                  ? <span className="text-white text-[11px] font-bold leading-none">
                      {(user?.name ?? "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                    </span>
                  : em}
              </button>
            ))}
          </div>
        </div>

        {!avatarEmoji && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Color</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map(({ hex, label }) => (
                <button
                  key={hex}
                  onClick={() => setAvatarColor(hex)}
                  title={label}
                  className={cn("h-8 w-8 rounded-full transition-all border-2", avatarColor === hex ? "border-foreground scale-110" : "border-transparent hover:scale-105")}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={handleSaveAvatar} disabled={avatarSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
            {avatarSaving ? "Saving…" : "Save"}
          </button>
          {avatarSuccess && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} /> Saved</span>}
        </div>
      </Accordion>

      {/* ── Account & Security ────────────────────────────────────────── */}
      <Accordion title="Account & Security" icon={Lock}>

        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
          <Mail size={14} className="text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Email:</span>
          <span className="font-medium">{user?.email ?? "—"}</span>
        </div>

        {/* Change email (password accounts only) */}
        {hasPassword && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <AtSign size={11} /> Change Email
            </p>
            {emailSuccess && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-1.5"><Check size={14} /> Email updated.</div>}
            {emailError   && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{emailError}</div>}
            <form onSubmit={handleChangeEmail} className="space-y-2">
              <input type="password" placeholder="Current password" required value={emailForm.currentPw}
                onChange={(e) => setEmailForm((p) => ({ ...p, currentPw: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <input type="email" placeholder="New email address" required value={emailForm.newEmail}
                onChange={(e) => setEmailForm((p) => ({ ...p, newEmail: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit" disabled={emailSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
                {emailSaving ? "Updating…" : "Update Email"}
              </button>
            </form>
            <div className="border-t border-border" />
          </div>
        )}

        {/* Change or set password */}
        {hasPassword ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <KeyRound size={11} /> Change Password
            </p>
            {pwSuccess && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-1.5"><Check size={14} /> Password updated.</div>}
            {pwError   && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{pwError}</div>}
            <form onSubmit={handleChangePassword} className="space-y-2">
              <input type="password" placeholder="Current password" required value={pwForm.currentPw}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPw: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <input type="password" placeholder="New password (min 6 chars)" required value={pwForm.newPw}
                onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <input type="password" placeholder="Confirm new password" required value={pwForm.confirmPw}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPw: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit" disabled={pwSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
              <KeyRound size={11} /> Set a Password
            </p>
            <p className="text-xs text-muted-foreground">Your account uses Google sign-in only. Set a password to also log in with email.</p>
            {addPwSuccess && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-1.5"><Check size={14} /> Password set.</div>}
            {addPwError   && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{addPwError}</div>}
            <form onSubmit={handleSetPassword} className="space-y-2">
              <input type="password" placeholder="New password" required value={addPwForm.password}
                onChange={(e) => setAddPwForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <input type="password" placeholder="Confirm password" required value={addPwForm.confirm}
                onChange={(e) => setAddPwForm((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit" disabled={addPwSaving}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {addPwSaving ? "Setting…" : "Set Password"}
              </button>
            </form>
          </div>
        )}
      </Accordion>

      {/* ── Personal Info ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User size={14} /> Personal Info
          </h3>
          {!editing ? (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <button onClick={() => { setEditing(false); setProfileError(""); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {profileError && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{profileError}</div>}

        {editing ? (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium"><User size={13} className="text-muted-foreground" /> Full name</label>
              <input autoFocus required value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium"><BookOpen size={13} className="text-muted-foreground" /> Course</label>
                <input value={profile.course} onChange={(e) => setProfile((p) => ({ ...p, course: e.target.value }))} placeholder="B.Tech"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium"><Hash size={13} className="text-muted-foreground" /> Semester</label>
                <input value={profile.semester} onChange={(e) => setProfile((p) => ({ ...p, semester: e.target.value }))} placeholder="Sem 4"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium"><Building2 size={13} className="text-muted-foreground" /> Institute</label>
              <input value={profile.institute} onChange={(e) => setProfile((p) => ({ ...p, institute: e.target.value }))} placeholder="e.g. NIT Calicut"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={profileSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
                {profileSaving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => { setEditing(false); setProfileError(""); }}
                className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {[
              { icon: User,      label: "Name",      value: user?.name },
              { icon: BookOpen,  label: "Course",    value: user?.course },
              { icon: Hash,      label: "Semester",  value: user?.semester },
              { icon: Building2, label: "Institute", value: user?.institute },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon size={14} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                <span className="font-medium truncate">{value || <span className="text-muted-foreground/60 italic text-xs">Not set</span>}</span>
              </div>
            ))}
            {profileSuccess && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} /> Saved successfully</span>}
          </div>
        )}
      </div>

      {/* ── App Settings ──────────────────────────────────────────────── */}
      <Accordion title="App Settings" icon={Settings2}>
        {settingsError   && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{settingsError}</div>}
        {settingsSuccess && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} /> Settings saved</span>}
        <div className="divide-y divide-border -mx-5 px-5">
          {SETTINGS_LIST.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Toggle on={settings[key]} disabled={settingsSaving} onChange={() => handleToggle(key)} />
            </div>
          ))}
        </div>
      </Accordion>

      {/* ── Notifications ─────────────────────────────────────────────── */}
      <Accordion title="Notifications" icon={BellRing}>
        {notifSuccess && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} /> Saved</span>}
        <div className="divide-y divide-border -mx-5 px-5">
          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Browser Notifications</p>
              <p className="text-xs text-muted-foreground">
                {pushPermission === "granted" ? "Enabled — class reminders, task due-day alerts, attendance risk."
                  : pushPermission === "denied" ? "Blocked. Allow in browser/Android system settings."
                  : "Get notified 5 min before each class, task reminders every 2 hrs on due day, and attendance risk alerts."}
              </p>
            </div>
            {pushPermission === "granted" ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><BellRing size={11} /> On</span>
            ) : pushPermission === "denied" ? (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"><BellOff size={11} /> Blocked</span>
            ) : (
              <button onClick={async () => setPushPermission(await notificationsService.requestPermission())}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Enable</button>
            )}
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Email Alerts</p>
              <p className="text-xs text-muted-foreground">
                Send alerts to <span className="font-medium">{user?.email}</span>. Requires EmailJS config.
              </p>
            </div>
            <Toggle on={emailNotif} disabled={notifSaving} onChange={handleEmailNotifToggle} />
          </div>
        </div>
      </Accordion>
    </div>
  );
}
