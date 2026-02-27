/**
 * PTP (Peer-to-Peer) service — Firestore implementation.
 * Public profiles live at root: publicProfiles/{uid}
 * Friend requests live at root: friendRequests/{id}
 * Confirmed friends live under each user: users/{uid}/friends/{friendUid}
 */
import {
  doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, limit,
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
  /** Write/update public profile — called during register and updateProfile */
  async upsertPublicProfile(uid, { name, course }) {
    await setDoc(
      publicProfileRef(uid),
      { name: name ?? "", course: course ?? "", uid },
      { merge: true }
    );
  },

  /** Search users by name prefix (case-sensitive, Firestore range query) */
  async searchUsers(nameQuery) {
    const q = query(
      collection(db, "publicProfiles"),
      where("name", ">=", nameQuery),
      where("name", "<=", nameQuery + "\uf8ff"),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data() }));
  },

  /** Send a friend request */
  async sendRequest(fromUid, fromName, toUid, toName) {
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
      fromUid, fromName, toUid, toName,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },

  /** Accept an incoming friend request — adds to both users' friends collections */
  async acceptRequest(requestId, fromUid, fromName, toUid, toName) {
    await setDoc(userDoc(toUid, "friends", fromUid), {
      uid: fromUid, name: fromName, addedAt: new Date().toISOString(),
    });
    await setDoc(userDoc(fromUid, "friends", toUid), {
      uid: toUid, name: toName, addedAt: new Date().toISOString(),
    });
    await updateDoc(friendRequestRef(requestId), { status: "accepted" });
  },

  /** Reject/decline a friend request */
  async rejectRequest(requestId) {
    await updateDoc(friendRequestRef(requestId), { status: "rejected" });
  },

  /** Remove a friend (bidirectional) */
  async removeFriend(myUid, friendUid) {
    await deleteDoc(userDoc(myUid, "friends", friendUid));
    await deleteDoc(userDoc(friendUid, "friends", myUid));
  },
};
