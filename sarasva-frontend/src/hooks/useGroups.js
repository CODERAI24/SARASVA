import { useState, useEffect, useCallback } from "react";
import {
  onSnapshot, query, where, orderBy,
  collection, doc,
} from "firebase/firestore";
import { db, userCol } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { groupsService } from "@/services/groups.service.js";

/**
 * Hook for the groups list + invitations on PTPPage.
 */
export function useGroups() {
  const { user } = useAuth();
  const [myGroups,      setMyGroups]      = useState([]);
  const [groupInvites,  setGroupInvites]  = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Real-time list of groups user belongs to
  useEffect(() => {
    if (!user) return;
    return onSnapshot(userCol(user.id, "groups"), (snap) => {
      setMyGroups(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""))
      );
      setLoading(false);
    });
  }, [user]);

  // Real-time incoming group invitations
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "groupInvites"),
      where("toUid",  "==", user.id),
      where("status", "==", "pending")
    );
    return onSnapshot(q, (snap) => {
      setGroupInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const createGroup = useCallback(async (groupName) => {
    if (!user || !groupName.trim()) return;
    return groupsService.createGroup(user.id, user.name, groupName.trim());
  }, [user]);

  const inviteToGroup = useCallback(async (groupId, groupName, friend) => {
    if (!user) return;
    return groupsService.inviteToGroup(
      groupId, groupName, user.id, user.name, friend.uid, friend.name
    );
  }, [user]);

  const acceptInvite = useCallback(async (invite) => {
    if (!user) return;
    return groupsService.acceptGroupInvite(
      invite.id, invite.groupId, user.id, user.name
    );
  }, [user]);

  const rejectInvite = useCallback(async (inviteId) => {
    return groupsService.rejectGroupInvite(inviteId);
  }, []);

  const deleteGroup = useCallback(async (groupId) => {
    if (!user) return;
    return groupsService.deleteGroup(groupId, user.id);
  }, [user]);

  const leaveGroup = useCallback(async (groupId) => {
    if (!user) return;
    return groupsService.leaveGroup(groupId, user.id);
  }, [user]);

  return {
    myGroups, groupInvites, loading,
    createGroup, inviteToGroup, acceptInvite, rejectInvite,
    deleteGroup, leaveGroup,
  };
}

/**
 * Hook for a single group's detail view (members + posts feed).
 */
export function useGroupDetail(groupId) {
  const { user } = useAuth();
  const [group,   setGroup]   = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId) return;

    const unsubGroup = onSnapshot(
      doc(db, "studyGroups", groupId),
      (snap) => {
        if (snap.exists()) setGroup({ id: snap.id, ...snap.data() });
        setLoading(false);
      }
    );

    const unsubPosts = onSnapshot(
      query(
        collection(db, "studyGroups", groupId, "posts"),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => { unsubGroup(); unsubPosts(); };
  }, [user, groupId]);

  const createPost = useCallback(async (data) => {
    if (!user || !groupId) return;
    return groupsService.createPost(groupId, {
      ...data,
      authorUid:  user.id,
      authorName: user.name,
    });
  }, [user, groupId]);

  const toggleSave = useCallback(async (postId, isSaved) => {
    if (!user || !groupId) return;
    if (isSaved) {
      return groupsService.unsavePost(groupId, postId, user.id);
    } else {
      return groupsService.savePost(groupId, postId, user.id);
    }
  }, [user, groupId]);

  return { group, posts, loading, createPost, toggleSave };
}
