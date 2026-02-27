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
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config.js";

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
    name:               profile.name     ?? firebaseUser.displayName ?? "",
    email:              firebaseUser.email,
    course:             profile.course   ?? "",
    semester:           profile.semester ?? "",
    settings:           profile.settings ?? DEFAULT_SETTINGS,
    notificationsEmail: profile.notificationsEmail ?? false,
  };
}

export const authService = {
  async register({ name, email, password, course = "", semester = "" }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Store display name in Firebase Auth
    await updateProfile(cred.user, { displayName: name });

    // Store extended profile in Firestore
    const profile = { name, course, semester, settings: DEFAULT_SETTINGS };
    await setDoc(profileRef(cred.user.uid), profile);

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
      return buildUser(cred.user, profile);
    }
    return buildUser(cred.user, snap.data());
  },

  async login({ email, password }) {
    try {
      const cred    = await signInWithEmailAndPassword(auth, email, password);
      const snap    = await getDoc(profileRef(cred.user.uid));
      const profile = snap.exists() ? snap.data() : {};
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
    return buildUser(firebaseUser, profile);
  },

  async logout() {
    await signOut(auth);
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  async updateProfile({ name, course, semester }) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not logged in.");
    await updateProfile(firebaseUser, { displayName: name });
    await updateDoc(profileRef(firebaseUser.uid), { name, course, semester });
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
};
