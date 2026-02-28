/**
 * Study Groups service — Firestore implementation.
 *
 * Collections:
 *   studyGroups/{groupId}                   — group doc
 *   studyGroups/{groupId}/posts/{postId}    — shared posts
 *   groupInvites/{inviteId}                 — pending group invitations
 *   users/{uid}/groups/{groupId}            — denormalized list per user
 */
import {
  doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, arrayUnion, arrayRemove, writeBatch,
} from "firebase/firestore";
import { db, userCol, userDoc } from "@/firebase/config.js";

const groupRef      = (id)  => doc(db, "studyGroups", id);
const groupPostsCol = (id)  => collection(db, "studyGroups", id, "posts");
const groupInvites  = ()    => collection(db, "groupInvites");
const inviteRef     = (id)  => doc(db, "groupInvites", id);

export const groupsService = {

  /** Create a new study group. Creator is the first member. */
  async createGroup(uid, memberName, groupName) {
    const ref = await addDoc(collection(db, "studyGroups"), {
      name:       groupName,
      createdBy:  uid,
      memberUids: [uid],
      members:    [{ uid, name: memberName, joinedAt: new Date().toISOString() }],
      createdAt:  new Date().toISOString(),
    });
    // Denormalized entry in creator's user subcollection
    await setDoc(userDoc(uid, "groups", ref.id), {
      groupId:  ref.id,
      name:     groupName,
      joinedAt: new Date().toISOString(),
    });
    return ref.id;
  },

  /** Invite a friend to a group. Sender must already be a member. */
  async inviteToGroup(groupId, groupName, fromUid, fromName, toUid, toName) {
    const snap = await getDoc(groupRef(groupId));
    if (snap.data()?.memberUids?.includes(toUid)) {
      throw new Error("Already a member of this group.");
    }
    const dup = await getDocs(query(
      groupInvites(),
      where("groupId", "==", groupId)
    ));
    if (dup.docs.some((d) => {
      const data = d.data();
      return data.toUid === toUid && data.status === "pending";
    })) throw new Error("Invite already sent.");

    await addDoc(groupInvites(), {
      groupId, groupName, fromUid, fromName, toUid, toName,
      status:    "pending",
      createdAt: new Date().toISOString(),
    });
    // Track pending invitees on the group doc so Firestore rules can allow them to accept
    await updateDoc(groupRef(groupId), {
      pendingInviteUids: arrayUnion(toUid),
    });
  },

  /** Accept a group invite — adds user to group and updates their list. */
  async acceptGroupInvite(inviteId, groupId, uid, memberName) {
    const snap      = await getDoc(groupRef(groupId));
    const groupName = snap.data()?.name ?? "";
    // Move uid from pendingInviteUids → memberUids (rule allows update because uid is in pendingInviteUids)
    await updateDoc(groupRef(groupId), {
      memberUids:        arrayUnion(uid),
      members:           arrayUnion({ uid, name: memberName, joinedAt: new Date().toISOString() }),
      pendingInviteUids: arrayRemove(uid),
    });
    await setDoc(userDoc(uid, "groups", groupId), {
      groupId, name: groupName, joinedAt: new Date().toISOString(),
    });
    await updateDoc(inviteRef(inviteId), { status: "accepted" });
  },

  /** Reject a group invite. */
  async rejectGroupInvite(inviteId) {
    await updateDoc(inviteRef(inviteId), { status: "rejected" });
  },

  /**
   * Delete a group (creator only).
   * Removes the group doc and all members' denormalized entries.
   * Posts subcollection is orphaned (harmless).
   */
  async deleteGroup(groupId, uid) {
    const snap = await getDoc(groupRef(groupId));
    const data = snap.data();
    if (!data) throw new Error("Group not found.");
    if (data.createdBy !== uid) throw new Error("Only the group creator can delete this group.");

    const batch = writeBatch(db);
    (data.memberUids ?? []).forEach((memberUid) => {
      batch.delete(userDoc(memberUid, "groups", groupId));
    });
    batch.delete(groupRef(groupId));
    await batch.commit();
  },

  /**
   * Leave a group (non-creator members).
   * Removes uid from group membership and deletes the user's denormalized entry.
   */
  async leaveGroup(groupId, uid) {
    const snap = await getDoc(groupRef(groupId));
    const data = snap.data();
    if (!data) throw new Error("Group not found.");

    const updatedMembers = (data.members ?? []).filter((m) => m.uid !== uid);

    const batch = writeBatch(db);
    batch.update(groupRef(groupId), {
      memberUids:        arrayRemove(uid),
      members:           updatedMembers,
      pendingInviteUids: arrayRemove(uid),
    });
    batch.delete(userDoc(uid, "groups", groupId));
    await batch.commit();
  },

  /**
   * Create a shared post in a group.
   * type: 'task' | 'assignment' | 'exam_date' | 'exam_pattern' | 'note'
   */
  async createPost(groupId, { authorUid, authorName, type, title, description, date, payload }) {
    await addDoc(groupPostsCol(groupId), {
      authorUid, authorName, type, title,
      description: description ?? "",
      date:        date ?? null,
      payload:     payload ?? null,
      savedBy:     [],
      createdAt:   new Date().toISOString(),
    });
  },

  /** Mark a post as saved by uid. */
  async savePost(groupId, postId, uid) {
    await updateDoc(doc(db, "studyGroups", groupId, "posts", postId), {
      savedBy: arrayUnion(uid),
    });
  },

  /** Un-mark a post as saved by uid. */
  async unsavePost(groupId, postId, uid) {
    await updateDoc(doc(db, "studyGroups", groupId, "posts", postId), {
      savedBy: arrayRemove(uid),
    });
  },
};
