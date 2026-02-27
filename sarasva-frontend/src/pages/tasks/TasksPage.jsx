import { useState } from "react";
import { useTasks } from "@/hooks/useTasks.js";
import { cn }       from "@/lib/utils.js";
import {
  Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, ListChecks,
} from "lucide-react";

const PRIORITIES = ["low", "medium", "high"];

/* ── Priority badge ──────────────────────────────────────────────── */
function PriorityBadge({ priority }) {
  return (
    <span className={cn(
      "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
      priority === "high"   && "bg-red-100 text-red-800",
      priority === "medium" && "bg-amber-100 text-amber-800",
      priority === "low"    && "bg-green-100 text-green-800",
    )}>
      {priority}
    </span>
  );
}

/* ── Task row ─────────────────────────────────────────────────────── */
function TaskRow({ task, onToggle, onArchive }) {
  const overdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40",
      task.completed && "opacity-50"
    )}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
        title={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed
          ? <CheckSquare size={18} className="text-primary" />
          : <Square size={18} />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-sm font-medium leading-snug",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{task.description}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className={cn(
              "text-xs",
              overdue ? "font-medium text-red-600" : "text-muted-foreground"
            )}>
              {overdue ? "Overdue · " : "Due · "}
              {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      {/* Archive */}
      <button
        onClick={() => onArchive(task.id)}
        className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Archive task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ── Add task form ────────────────────────────────────────────────── */
function AddTaskForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "", priority: "medium",
  });
  const [err, setErr] = useState("");

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Title is required."); return; }
    onCreate({
      title:       form.title.trim(),
      description: form.description.trim(),
      dueDate:     form.dueDate || null,
      priority:    form.priority,
    });
    setForm({ title: "", description: "", dueDate: "", priority: "medium" });
    setErr("");
    setOpen(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus size={16} />
          Add a task...
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Task title"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          />

          {/* Description */}
          <input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          />

          {/* Due date + Priority */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-0.5">
              <p className="text-xs text-muted-foreground">Due date</p>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs text-muted-foreground">Priority</p>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {err && <p className="text-xs text-destructive">{err}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus size={14} /> Add task
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setErr(""); }}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function TasksPage() {
  const { tasks, create, toggle, archive } = useTasks({ archived: false });

  const [filter,   setFilter]   = useState("all");     // all | low | medium | high
  const [showDone, setShowDone] = useState(false);

  const pending   = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) =>  t.completed);

  function applyPriorityFilter(list) {
    if (filter === "all") return list;
    return list.filter((t) => t.priority === filter);
  }

  const visiblePending   = applyPriorityFilter(pending);
  const visibleCompleted = applyPriorityFilter(completed);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {pending.length} pending · {completed.length} done
          </p>
        </div>

        {/* Priority filter */}
        <div className="flex self-start overflow-hidden rounded-md border border-border text-xs font-medium">
          {["all", ...PRIORITIES].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "px-3 py-1.5 capitalize transition-colors",
                filter === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Add task */}
      <AddTaskForm onCreate={create} />

      {/* Pending tasks */}
      {visiblePending.length === 0 && filter === "all" ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <ListChecks size={36} className="opacity-30" />
          <p className="text-sm">No pending tasks. Add one above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
          {visiblePending.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No {filter} priority tasks pending.</p>
          ) : (
            visiblePending.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggle}
                onArchive={archive}
              />
            ))
          )}
        </div>
      )}

      {/* Completed tasks (collapsible) */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone((p) => !p)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Completed ({visibleCompleted.length})</span>
            {showDone ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showDone && (
            <div className="mt-1 overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
              {visibleCompleted.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No completed {filter} priority tasks.</p>
              ) : (
                visibleCompleted.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggle}
                    onArchive={archive}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
