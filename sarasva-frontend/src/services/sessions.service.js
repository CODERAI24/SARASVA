/**
 * Sessions service — tracks active login sessions per device.
 *
 * Each device gets a persistent UUID in localStorage.
 * On every login / app load, it writes/updates a doc at:
 *   users/{uid}/sessions/{sessionId}
 *
 * Deleting a session doc causes that device to automatically sign out.
 */

import {
  doc, setDoc, deleteDoc, updateDoc,
  collection, getDocs, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config.js";

const LS_SESSION_KEY = "sarasva_session_id";

/* ── Session ID (stable per browser) ─────────────────────────────── */
export function getSessionId() {
  let id = localStorage.getItem(LS_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LS_SESSION_KEY, id);
  }
  return id;
}

/* ── Device fingerprint from User-Agent ──────────────────────────── */
function detectDevice() {
  const ua = navigator.userAgent;

  let browser = "Unknown";
  if      (ua.includes("Edg/"))                              browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera"))     browser = "Opera";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/"))  browser = "Chrome";
  else if (ua.includes("Firefox/"))                          browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome"))browser = "Safari";

  let os = "Unknown";
  if      (/android/i.test(ua))            os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua))   os = "iOS";
  else if (/windows nt/i.test(ua))         os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua))              os = "Linux";

  // Mobile vs desktop (coarse)
  const type = /android|iphone|ipad|ipod|mobile/i.test(ua) ? "mobile" : "desktop";

  return { browser, os, type };
}

/* ── Firestore ref helpers ───────────────────────────────────────── */
function sessionRef(uid, sessionId) {
  return doc(db, "users", uid, "sessions", sessionId);
}
function sessionsCol(uid) {
  return collection(db, "users", uid, "sessions");
}

/* ── Service ─────────────────────────────────────────────────────── */
export const sessionsService = {
  /** Write/update this device's session doc. Called on every login / page load. */
  async register(uid) {
    const sessionId = getSessionId();
    await setDoc(sessionRef(uid, sessionId), {
      sessionId,
      createdAt:  new Date().toISOString(),
      lastActive: serverTimestamp(),
      device:     detectDevice(),
    }, { merge: true });
    return sessionId;
  },

  /** Touch lastActive. Call on a 5-min interval. */
  async heartbeat(uid) {
    const sessionId = getSessionId();
    try {
      await updateDoc(sessionRef(uid, sessionId), { lastActive: serverTimestamp() });
    } catch { /* session may have been removed remotely — ignore */ }
  },

  /** Delete a specific session doc (triggers remote sign-out on that device). */
  async remove(uid, sessionId) {
    await deleteDoc(sessionRef(uid, sessionId));
  },

  /** Delete all session docs except the current device. */
  async removeOthers(uid) {
    const currentId = getSessionId();
    const snap = await getDocs(sessionsCol(uid));
    await Promise.all(
      snap.docs
        .filter((d) => d.id !== currentId)
        .map((d) => deleteDoc(d.ref))
    );
  },

  /**
   * Listen to this device's own session doc.
   * If it's deleted by another device → call onDeleted() to sign out.
   */
  listenToSelf(uid, onDeleted) {
    const sessionId = getSessionId();
    return onSnapshot(sessionRef(uid, sessionId), (snap) => {
      if (!snap.exists()) onDeleted();
    });
  },

  /** Real-time listener for all sessions (for the Settings UI). */
  listenToAll(uid, onChange) {
    return onSnapshot(sessionsCol(uid), (snap) => {
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(sessions);
    });
  },
};
