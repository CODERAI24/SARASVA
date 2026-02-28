import { useState, useEffect, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
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
    const unsub = onSnapshot(
      userCol(user.id, "tasks"),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t) => archived ? t.archived === true : t.archived !== true)
          .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
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

  /* ── Subtask mutations ── */
  const addSubtask = useCallback(async (taskId, title) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    try { await tasksService.addSubtask(user.id, taskId, task?.subtasks ?? [], title); }
    catch (err) { setError(err.message); }
  }, [user, tasks]);

  const toggleSubtask = useCallback(async (taskId, subtaskId) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    try { await tasksService.toggleSubtask(user.id, taskId, task?.subtasks ?? [], subtaskId); }
    catch (err) { setError(err.message); }
  }, [user, tasks]);

  const deleteSubtask = useCallback(async (taskId, subtaskId) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    try { await tasksService.deleteSubtask(user.id, taskId, task?.subtasks ?? [], subtaskId); }
    catch (err) { setError(err.message); }
  }, [user, tasks]);

  return { tasks, loading, error, create, update, toggle, archive, addSubtask, toggleSubtask, deleteSubtask };
}
