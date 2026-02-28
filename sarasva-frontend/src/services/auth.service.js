/**
 * Auth service — Firebase Auth + Firestore implementation.
 * AuthContext imports from here only. Pages and hooks are unchanged.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config.js";

/** Write searchable public profile so PTP peer search works */
async function upsertPublicProfile(uid, { name, course }) {
  const n = name ?? "";
  await setDoc(
    doc(db, "publicProfiles", uid),
    { name: n, nameLower: n.toLowerCase(), course: course ?? "", uid },
    { merge: true }
  );
}

const DEFAULT_SETTINGS = {
  focusModeEnabled:   true,
  strictFocusEnabled: false,
  motivationEnabled:  true,
  analyticsEnabled:   true,
  safeModeEnabled:    true,
};

/** Firestore profile document for a user */
function profileRef(uid) {
  return doc(db, "users", uid, "profile", "data");
}

/** Build a normalized user object (same shape as the old localStorage user) */
function buildUser(firebaseUser, profile = {}) {
  return {
    id:                 firebaseUser.uid,
    name:               profile.name        ?? firebaseUser.displayName ?? "",
    email:              firebaseUser.email,
    course:             profile.course      ?? "",
    semester:           profile.semester    ?? "",
    institute:          profile.institute   ?? "",
    settings:           profile.settings    ?? DEFAULT_SETTINGS,
    notificationsEmail: profile.notificationsEmail ?? false,
    avatarColor:        profile.avatarColor ?? "#6366f1",
    avatarEmoji:        profile.avatarEmoji ?? null,
    role:               profile.role        ?? "user", // "admin" for admin users
  };
}

export const authService = {
  async register({ name, email, password, course = "", semester = "" }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Store display name in Firebase Auth
    await updateProfile(cred.user, { displayName: name });

    // Store extended profile in Firestore
    const profile = { name, course, semester, institute: "", settings: DEFAULT_SETTINGS };
    await setDoc(profileRef(cred.user.uid), profile);
    await upsertPublicProfile(cred.user.uid, { name, course, institute: "" });

    return buildUser(cred.user, profile);
  },

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred     = await signInWithPopup(auth, provider);
    const snap     = await getDoc(profileRef(cred.user.uid));
    if (!snap.exists()) {
      // First-time Google user — create Firestore profile
      const profile = {
        name:     cred.user.displayName ?? "",
        course:   "",
        semester: "",
        settings: DEFAULT_SETTINGS,
      };
      await setDoc(profileRef(cred.user.uid), profile);
      await upsertPublicProfile(cred.user.uid, { name: profile.name, course: "", institute: "" });
      return buildUser(cred.user, profile);
    }
    // Backfill publicProfile for returning Google users who existed before PTP
    const existingProfile = snap.data();
    upsertPublicProfile(cred.user.uid, {
      name:      existingProfile.name      ?? cred.user.displayName ?? "",
      course:    existingProfile.course    ?? "",
      institute: existingProfile.institute ?? "",
    }).catch(() => {}); // non-blocking, best-effort
    return buildUser(cred.user, existingProfile);
  },

  async login({ email, password }) {
    try {
      const cred    = await signInWithEmailAndPassword(auth, email, password);
      const snap    = await getDoc(profileRef(cred.user.uid));
      const profile = snap.exists() ? snap.data() : {};
      // Backfill publicProfile for users who registered before PTP feature
      upsertPublicProfile(cred.user.uid, {
        name:      profile.name      ?? cred.user.displayName ?? "",
        course:    profile.course    ?? "",
        institute: profile.institute ?? "",
      }).catch(() => {}); // non-blocking, best-effort
      return buildUser(cred.user, profile);
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        throw Object.assign(new Error(
          'Incorrect password. If you previously signed in with Google, use "Forgot password?" to set a password for email login.'
        ), { code: err.code });
      }
      throw err;
    }
  },

  /** Link Google provider to an existing email/password account (call while logged in) */
  async linkGoogle() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    const provider = new GoogleAuthProvider();
    await linkWithPopup(firebaseUser, provider);
  },

  /**
   * Add email/password sign-in to a Google-only account (call while logged in via Google).
   * After this, the user can sign in with either Google or email+password.
   */
  async addPassword(password) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    if (!firebaseUser.email) throw new Error("No email on account.");
    const credential = EmailAuthProvider.credential(firebaseUser.email, password);
    await linkWithCredential(firebaseUser, credential);
  },

  async getMe() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    const snap    = await getDoc(profileRef(firebaseUser.uid));
    const profile = snap.exists() ? snap.data() : {};
    // Backfill / refresh public profile on every app startup so nameLower is always present
    upsertPublicProfile(firebaseUser.uid, {
      name:      profile.name      ?? firebaseUser.displayName ?? "",
      course:    profile.course    ?? "",
      institute: profile.institute ?? "",
    }).catch(() => {}); // non-blocking
    return buildUser(firebaseUser, profile);
  },

  async logout() {
    await signOut(auth);
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  async updateProfile({ name, course, semester, institute }) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    await updateProfile(firebaseUser, { displayName: name });
    await updateDoc(profileRef(firebaseUser.uid), { name, course, semester, institute: institute ?? "" });
    await upsertPublicProfile(firebaseUser.uid, { name, course, institute: institute ?? "" });
    const snap = await getDoc(profileRef(firebaseUser.uid));
    return buildUser(firebaseUser, snap.data());
  },

  async getSettings() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    const snap = await getDoc(profileRef(firebaseUser.uid));
    return snap.exists() ? (snap.data().settings ?? DEFAULT_SETTINGS) : DEFAULT_SETTINGS;
  },

  async updateSettings(patch) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    const snap    = await getDoc(profileRef(firebaseUser.uid));
    const current = snap.exists() ? (snap.data().settings ?? DEFAULT_SETTINGS) : DEFAULT_SETTINGS;
    const updated = { ...current, ...patch };
    await updateDoc(profileRef(firebaseUser.uid), { settings: updated });
    return updated;
  },

  async updateNotificationPrefs({ notificationsEmail }) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    await updateDoc(profileRef(firebaseUser.uid), { notificationsEmail });
  },

  /** Change email — requires current password for reauthentication. */
  async changeEmail(currentPassword, newEmail) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    if (!firebaseUser.email) throw new Error("No email on account.");
    const cred = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, cred);
    await updateEmail(firebaseUser, newEmail);
  },

  /** Change password — requires current password for reauthentication. */
  async changePassword(currentPassword, newPassword) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    if (!firebaseUser.email) throw new Error("No email on account.");
    const cred = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, cred);
    await updatePassword(firebaseUser, newPassword);
  },

  /** Save avatar appearance: color hex string and optional emoji. */
  async updateAvatar({ avatarColor, avatarEmoji }) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    const patch = {};
    if (avatarColor !== undefined) patch.avatarColor = avatarColor;
    if (avatarEmoji  !== undefined) patch.avatarEmoji  = avatarEmoji;
    await updateDoc(profileRef(firebaseUser.uid), patch);
  },
};
