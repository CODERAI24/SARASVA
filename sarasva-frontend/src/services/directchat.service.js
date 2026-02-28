/**
 * Direct Chat service — private sharing between two friends.
 *
 * Collections:
 *   directChats/{chatId}              — chat doc, chatId = [uid1, uid2].sort().join("_")
 *   directChats/{chatId}/posts/{id}   — shared posts (same structure as group posts)
 */
import {
  doc, setDoc, addDoc, updateDoc, collection, orderBy,
  arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "@/firebase/config.js";

export function chatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function chatRef(uid1, uid2) {
  return doc(db, "directChats", chatId(uid1, uid2));
}

function chatPostsCol(uid1, uid2) {
  return collection(db, "directChats", chatId(uid1, uid2), "posts");
}

export const directChatService = {
  /**
   * Create a shared post between two friends.
   * type: 'task' | 'assignment' | 'exam_date' | 'exam_pattern' | 'note'
   */
  async createPost(uid1, uid2, { authorUid, authorName, type, title, description, date }) {
    const cid = chatId(uid1, uid2);
    // Ensure chat doc exists (merge so we don't overwrite)
    await setDoc(doc(db, "directChats", cid), {
      memberUids: [uid1, uid2].sort(),
      updatedAt:  new Date().toISOString(),
    }, { merge: true });

    await addDoc(chatPostsCol(uid1, uid2), {
      authorUid,
      authorName,
      type,
      title,
      description: description ?? "",
      date:        date ?? null,
      savedBy:     [],
      createdAt:   new Date().toISOString(),
    });
  },

  /** Mark a post as saved by uid. */
  async savePost(uid1, uid2, postId, uid) {
    const cid = chatId(uid1, uid2);
    await updateDoc(doc(db, "directChats", cid, "posts", postId), {
      savedBy: arrayUnion(uid),
    });
  },

  /** Un-mark a post as saved by uid. */
  async unsavePost(uid1, uid2, postId, uid) {
    const cid = chatId(uid1, uid2);
    await updateDoc(doc(db, "directChats", cid, "posts", postId), {
      savedBy: arrayRemove(uid),
    });
  },
};
