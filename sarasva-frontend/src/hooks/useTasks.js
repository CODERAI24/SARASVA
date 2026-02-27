import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot } from "firebase/firestore";
import { userCol } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { tasksService } from "@/services/tasks.service.js";

/**
 * Real-time tasks hook backed by Firestore onSnapshot.
 */
export function useTasks({ archived = false } = {}) {
  const { user } = useAuth();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(userCol(user.id, "tasks"), where("archived", "==", archived));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setTasks(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [user, archived]);

  const create = useCallback(async (data) => {
    if (!user) return;
    try { await tasksService.create(user.id, data); }
    catch (err) { setError(err.message); }
  }, [user]);

  const update = useCallback(async (id, patch) => {
    if (!user) return;
    try { await tasksService.update(user.id, id, patch); }
    catch (err) { setError(err.message); }
  }, [user]);

  const toggle = useCallback((id, currentCompleted) => {
    return update(id, { completed: !currentCompleted });
  }, [update]);

  const archive = useCallback(async (id) => {
    if (!user) return;
    try { await tasksService.archive(user.id, id); }
    catch (err) { setError(err.message); }
  }, [user]);

  return { tasks, loading, error, create, update, toggle, archive };
}
