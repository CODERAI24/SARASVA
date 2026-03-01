import { useState, useEffect, useRef, useCallback } from "react";
import {
  onSnapshot, query, where, collection, getDoc, setDoc,
} from "firebase/firestore";
import { db, userCol, userDoc } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { ptpService } from "@/services/ptp.service.js";
import { notificationsService } from "@/services/notifications.service.js";

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
  const prevIncomingCount  = useRef(null); // null = initial load (don't notify)

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

  // Real-time incoming requests listener + friend-request notification
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("toUid", "==", user.id)
    );
    return onSnapshot(
      q,
      (snap) => {
        const pending = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((req) => req.status === "pending");
        setIncomingRequests(pending);

        // Notify only when count grows (skip initial load)
        if (prevIncomingCount.current !== null && pending.length > prevIncomingCount.current) {
          const newest = pending[pending.length - 1];
          if (newest?.fromName) notificationsService.notifyFriendRequest(newest.fromName);
        }
        prevIncomingCount.current = pending.length;
      },
      (err) => setError(err.message)
    );
  }, [user]);

  // Real-time outgoing requests listener (pending)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("fromUid", "==", user.id)
    );
    return onSnapshot(
      q,
      (snap) => {
        setOutgoingRequests(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((req) => req.status === "pending")
        );
      },
      (err) => setError(err.message)
    );
  }, [user]);

  /**
   * When an outgoing request is accepted by the other person, they only write
   * to their own friends collection (Firestore rules block them writing to ours).
   * This listener detects accepted requests and self-writes the friend to our
   * own collection so the friendship becomes bidirectional.
   */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("fromUid", "==", user.id)
    );
    return onSnapshot(q, async (snap) => {
      for (const d of snap.docs.filter((docSnap) => docSnap.data().status === "accepted")) {
        const req = d.data();
        const existing = await getDoc(userDoc(user.id, "friends", req.toUid));
        if (!existing.exists()) {
          await setDoc(userDoc(user.id, "friends", req.toUid), {
            uid:       req.toUid,
            name:      req.toName,
            course:    "",
            institute: "",
            addedAt:   new Date().toISOString(),
          });
        }
      }
    });
  }, [user]);

  const searchUsers = useCallback(async (nameQuery) => {
    if (!nameQuery.trim() || !user) return { results: [], error: null };
    try {
      const results = await ptpService.searchUsers(nameQuery.trim());
      return {
        // Only exclude the current user — friends still show with a "Friends" badge
        results: results.filter(u => u.uid !== user.id),
        error: null,
      };
    } catch (err) {
      return { results: [], error: err.message };
    }
  }, [user]);

  const sendRequest = useCallback(async (toUser) => {
    if (!user) return;
    try {
      await ptpService.sendRequest(
        user.id, user.name, user.course ?? "", user.institute ?? "",
        toUser.uid, toUser.name
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const acceptRequest = useCallback(async (request) => {
    if (!user) return;
    try {
      await ptpService.acceptRequest(
        request.id,
        request.fromUid, request.fromName,
        request.fromCourse ?? "", request.fromInstitute ?? "",
        user.id, user.name
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
