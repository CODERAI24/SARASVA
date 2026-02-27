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
  doc, setDoc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, arrayUnion, arrayRemove,
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
      where("groupId", "==", groupId),
      where("toUid",   "==", toUid),
      where("status",  "==", "pending")
    ));
    if (!dup.empty) throw new Error("Invite already sent.");

    await addDoc(groupInvites(), {
      groupId, groupName, fromUid, fromName, toUid, toName,
      status:    "pending",
      createdAt: new Date().toISOString(),
    });
  },

  /** Accept a group invite — adds user to group and updates their list. */
  async acceptGroupInvite(inviteId, groupId, uid, memberName) {
    const snap     = await getDoc(groupRef(groupId));
    const groupName = snap.data()?.name ?? "";
    await updateDoc(groupRef(groupId), {
      memberUids: arrayUnion(uid),
      members:    arrayUnion({ uid, name: memberName, joinedAt: new Date().toISOString() }),
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
   * Create a shared post in a group.
   * type: 'task' | 'assignment' | 'exam_date' | 'exam_pattern' | 'note'
   */
  async createPost(groupId, { authorUid, authorName, type, title, description, date }) {
    await addDoc(groupPostsCol(groupId), {
      authorUid, authorName, type, title,
      description: description ?? "",
      date:        date ?? null,
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
