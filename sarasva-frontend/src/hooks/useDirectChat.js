import { useState, useEffect, useCallback } from "react";
import { query, orderBy, onSnapshot, collection } from "firebase/firestore";
import { db } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { directChatService, chatId } from "@/services/directchat.service.js";

/**
 * Real-time hook for direct (friend-to-friend) shared posts.
 * Listens to directChats/{chatId}/posts in descending creation order.
 */
export function useDirectChat(friendUid) {
  const { user } = useAuth();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !friendUid) return;
    const cid = chatId(user.id, friendUid);

    const unsub = onSnapshot(
      query(
        collection(db, "directChats", cid, "posts"),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false) // Chat may not exist yet — that's fine
    );

    return unsub;
  }, [user, friendUid]);

  const createPost = useCallback(async (data) => {
    if (!user || !friendUid) return;
    return directChatService.createPost(user.id, friendUid, {
      ...data,
      authorUid:  user.id,
      authorName: user.name,
    });
  }, [user, friendUid]);

  const toggleSave = useCallback(async (postId, isSaved) => {
    if (!user || !friendUid) return;
    if (isSaved) {
      return directChatService.unsavePost(user.id, friendUid, postId, user.id);
    } else {
      return directChatService.savePost(user.id, friendUid, postId, user.id);
    }
  }, [user, friendUid]);

  return { posts, loading, createPost, toggleSave };
}
