/**
 * PTP (Peer-to-Peer) service — Firestore implementation.
 * Public profiles live at root: publicProfiles/{uid}
 * Friend requests live at root: friendRequests/{id}
 * Confirmed friends live under each user: users/{uid}/friends/{friendUid}
 */
import {
  doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where,
} from "firebase/firestore";
import { db, userCol, userDoc } from "@/firebase/config.js";

function publicProfileRef(uid) {
  return doc(db, "publicProfiles", uid);
}

function friendRequestsCol() {
  return collection(db, "friendRequests");
}

function friendRequestRef(id) {
  return doc(db, "friendRequests", id);
}

export const ptpService = {
  /** Write/update public profile — called during register, login, and updateProfile */
  async upsertPublicProfile(uid, { name, course, institute }) {
    const n = name ?? "";
    await setDoc(
      publicProfileRef(uid),
      { name: n, nameLower: n.toLowerCase(), course: course ?? "", institute: institute ?? "", uid },
      { merge: true }
    );
  },

  /**
   * Search users by name substring — client-side filter so it works even for
   * legacy docs that were created before the nameLower field was added.
   */
  async searchUsers(nameQuery) {
    const lower = nameQuery.toLowerCase();
    const snap = await getDocs(collection(db, "publicProfiles"));
    return snap.docs
      .map(d => d.data())
      .filter(u => (u.name ?? "").toLowerCase().includes(lower));
  },

  /** Send a friend request — includes sender's course+institute so recipient card can show it */
  async sendRequest(fromUid, fromName, fromCourse, fromInstitute, toUid, toName) {
    // Avoid duplicate pending requests
    const existingQ = query(
      friendRequestsCol(),
      where("fromUid", "==", fromUid),
      where("toUid", "==", toUid),
      where("status", "==", "pending")
    );
    const existing = await getDocs(existingQ);
    if (!existing.empty) throw new Error("Friend request already sent.");

    // Check already friends
    const friendSnap = await getDoc(userDoc(fromUid, "friends", toUid));
    if (friendSnap.exists()) throw new Error("Already friends.");

    await addDoc(friendRequestsCol(), {
      fromUid, fromName, fromCourse: fromCourse ?? "", fromInstitute: fromInstitute ?? "",
      toUid, toName,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Accept an incoming friend request.
   * Only writes to the ACCEPTER's own friends collection (Firestore rules block
   * writing to the sender's collection). The sender's side is handled automatically
   * by the accepted-requests listener in usePTP.js.
   */
  async acceptRequest(requestId, fromUid, fromName, fromCourse, fromInstitute, toUid, toName) {
    await setDoc(userDoc(toUid, "friends", fromUid), {
      uid: fromUid, name: fromName,
      course: fromCourse ?? "", institute: fromInstitute ?? "",
      addedAt: new Date().toISOString(),
    });
    await updateDoc(friendRequestRef(requestId), { status: "accepted" });
  },

  /** Reject/decline a friend request */
  async rejectRequest(requestId) {
    await updateDoc(friendRequestRef(requestId), { status: "rejected" });
  },

  /**
   * Remove a friend from the caller's own friends collection.
   * Firestore rules prevent writing to another user's collection, so only
   * the caller's side is removed. The other person retains the caller in
   * their list until they also remove.
   */
  async removeFriend(myUid, friendUid) {
    await deleteDoc(userDoc(myUid, "friends", friendUid));
  },
};
