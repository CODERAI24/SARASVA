import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { authService } from "@/services/auth.service.js";
import { auth } from "@/firebase/config.js";
import { User, Mail, BookOpen, Hash, Settings2, Check, KeyRound } from "lucide-react";

const SETTINGS_LIST = [
  {
    key:   "focusModeEnabled",
    label: "Focus Mode",
    desc:  "Hide distracting elements during study sessions",
  },
  {
    key:   "strictFocusEnabled",
    label: "Strict Focus",
    desc:  "Lock navigation while focus mode is active",
  },
  {
    key:   "motivationEnabled",
    label: "Motivation Quotes",
    desc:  "Show inspirational quotes on the dashboard",
  },
  {
    key:   "analyticsEnabled",
    label: "Analytics",
    desc:  "Track detailed study and attendance patterns",
  },
  {
    key:   "safeModeEnabled",
    label: "Safe Mode",
    desc:  "Show confirmation dialogs before destructive actions",
  },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  /* ── Profile form ────────────────────────────────────────────────── */
  const [profile, setProfile] = useState({
    name:     user?.name     ?? "",
    course:   user?.course   ?? "",
    semester: user?.semester ?? "",
  });
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError,   setProfileError]   = useState("");

  async function handleProfileSave(e) {
    e.preventDefault();
    const name = profile.name.trim();
    if (!name) return;
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      await authService.updateProfile({
        name,
        course:   profile.course.trim(),
        semester: profile.semester.trim(),
      });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      setProfileError(err.message || "Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  /* ── Settings toggles ────────────────────────────────────────────── */
  const [settings, setSettings] = useState(
    user?.settings ?? {
      focusModeEnabled:   true,
      strictFocusEnabled: false,
      motivationEnabled:  true,
      analyticsEnabled:   true,
      safeModeEnabled:    true,
    }
  );
  const [settingsSaving,  setSettingsSaving]  = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError,   setSettingsError]   = useState("");

  async function handleToggle(key) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSuccess(false);
    try {
      await authService.updateSettings(updated);
      await refreshUser();
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (err) {
      // roll back on error
      setSettings(settings);
      setSettingsError(err.message || "Failed to save settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

  /* ── Set Password (Google-only accounts) ─────────────────────────── */
  const providers = auth.currentUser?.providerData.map((p) => p.providerId) ?? [];
  const hasPassword = providers.includes("password");

  const [pwForm,    setPwForm]    = useState({ password: "", confirm: "" });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError,   setPwError]   = useState("");

  async function handleSetPassword(e) {
    e.preventDefault();
    if (pwForm.password !== pwForm.confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    if (pwForm.password.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await authService.addPassword(pwForm.password);
      setPwSuccess(true);
      setPwForm({ password: "", confirm: "" });
    } catch (err) {
      setPwError(err.message || "Failed to set password.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Profile & Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your personal info and app preferences.
        </p>
      </div>

      {/* ── Account info (read-only) ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Account
        </h3>
        <div className="flex items-center gap-3 text-sm">
          <Mail size={15} className="text-muted-foreground shrink-0" />
          <span>{user?.email ?? "—"}</span>
        </div>
      </div>

      {/* ── Set Password (shown only for Google-only accounts) ───────── */}
      {!hasPassword && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50/5 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wide flex items-center gap-2">
            <KeyRound size={14} />
            Set a Password
          </h3>
          <p className="text-xs text-muted-foreground">
            Your account uses Google sign-in only. Set a password to also log in with your email.
          </p>

          {pwError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 flex items-center gap-1.5">
              <Check size={14} /> Password set — you can now log in with email &amp; password.
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-3">
            <input
              type="password"
              placeholder="New password"
              value={pwForm.password}
              onChange={(e) => setPwForm((p) => ({ ...p, password: e.target.value }))}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            />
            <button
              type="submit"
              disabled={pwSaving}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pwSaving ? "Setting password..." : "Set password"}
            </button>
          </form>
        </div>
      )}

      {/* ── Profile form ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Personal Info
        </h3>

        {profileError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="flex items-center gap-1.5 text-sm font-medium">
              <User size={13} className="text-muted-foreground" />
              Full name
            </label>
            <input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            />
          </div>

          {/* Course + Semester */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="course" className="flex items-center gap-1.5 text-sm font-medium">
                <BookOpen size={13} className="text-muted-foreground" />
                Course
              </label>
              <input
                id="course"
                value={profile.course}
                onChange={(e) => setProfile((p) => ({ ...p, course: e.target.value }))}
                placeholder="B.Tech"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="semester" className="flex items-center gap-1.5 text-sm font-medium">
                <Hash size={13} className="text-muted-foreground" />
                Semester
              </label>
              <input
                id="semester"
                value={profile.semester}
                onChange={(e) => setProfile((p) => ({ ...p, semester: e.target.value }))}
                placeholder="Sem 4"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={profileSaving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {profileSaving ? "Saving..." : "Save changes"}
            </button>
            {profileSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check size={14} /> Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Settings toggles ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Settings2 size={14} />
            App Settings
          </h3>
          {settingsSuccess && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check size={12} /> Saved
            </span>
          )}
        </div>

        {settingsError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {settingsError}
          </div>
        )}

        <div className="divide-y divide-border">
          {SETTINGS_LIST.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[key]}
                onClick={() => handleToggle(key)}
                disabled={settingsSaving}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  settings[key] ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out ${
                    settings[key] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
