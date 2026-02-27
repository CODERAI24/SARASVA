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
    id:       firebaseUser.uid,
    name:     profile.name     ?? firebaseUser.displayName ?? "",
    email:    firebaseUser.email,
    course:   profile.course   ?? "",
    semester: profile.semester ?? "",
    settings: profile.settings ?? DEFAULT_SETTINGS,
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
    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const snap    = await getDoc(profileRef(cred.user.uid));
    const profile = snap.exists() ? snap.data() : {};
    return buildUser(cred.user, profile);
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
};
