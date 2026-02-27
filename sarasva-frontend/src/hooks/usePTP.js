import { useState, useEffect, useCallback, useRef } from "react";
import { onSnapshot, query, where, collection } from "firebase/firestore";
import { db, userCol } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { ptpService } from "@/services/ptp.service.js";

/**
 * Real-time PTP (peer-to-peer) hook.
 * Listens to friends, incoming requests, and outgoing requests in real time.
 */
export function usePTP() {
  const { user } = useAuth();
  const [friends,          setFriends]          = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  // Real-time friends listener
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      userCol(user.id, "friends"),
      (snap) => {
        setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
  }, [user]);

  // Real-time incoming requests listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("toUid", "==", user.id),
      where("status", "==", "pending")
    );
    return onSnapshot(q, (snap) => {
      setIncomingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // Real-time outgoing requests listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("fromUid", "==", user.id),
      where("status", "==", "pending")
    );
    return onSnapshot(q, (snap) => {
      setOutgoingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const searchUsers = useCallback(async (nameQuery) => {
    if (!nameQuery.trim() || !user) return [];
    try {
      const results = await ptpService.searchUsers(nameQuery.trim());
      // Filter out self and existing friends
      return results.filter(u =>
        u.uid !== user.id &&
        !friends.find(f => f.uid === u.uid)
      );
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [user, friends]);

  const sendRequest = useCallback(async (toUser) => {
    if (!user) return;
    try {
      await ptpService.sendRequest(user.id, user.name, toUser.uid, toUser.name);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const acceptRequest = useCallback(async (request) => {
    if (!user) return;
    try {
      await ptpService.acceptRequest(
        request.id, request.fromUid, request.fromName, user.id, user.name
      );
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  const rejectRequest = useCallback(async (requestId) => {
    if (!user) return;
    try {
      await ptpService.rejectRequest(requestId);
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  const removeFriend = useCallback(async (friendUid) => {
    if (!user) return;
    try {
      await ptpService.removeFriend(user.id, friendUid);
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  return {
    friends, incomingRequests, outgoingRequests, loading, error,
    searchUsers, sendRequest, acceptRequest, rejectRequest, removeFriend,
  };
}
