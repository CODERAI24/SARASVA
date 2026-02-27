import { useState, useRef } from "react";
import { useTasks } from "@/hooks/useTasks.js";
import { cn }       from "@/lib/utils.js";
import {
  Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp,
  ListChecks, CheckCircle2, Circle, X, ChevronRight,
} from "lucide-react";

const PRIORITIES = ["low", "medium", "high"];

/* ── Priority badge ──────────────────────────────────────────────── */
function PriorityBadge({ priority }) {
  return (
    <span className={cn(
      "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
      priority === "high"   && "bg-rose-100 text-rose-700",
      priority === "medium" && "bg-amber-100 text-amber-700",
      priority === "low"    && "bg-emerald-100 text-emerald-700",
    )}>
      {priority}
    </span>
  );
}

/* ── Subtask list (expanded inline) ──────────────────────────────── */
function SubtaskList({ task, onAdd, onToggle, onDelete }) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);

  const subtasks = task.subtasks || [];
  const done  = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;

  function handleAdd(e) {
    e.preventDefault();
    const title = inputVal.trim();
    if (!title) return;
    onAdd(task.id, title);
    setInputVal("");
    inputRef.current?.focus();
  }

  return (
    <div className="mt-2 ml-8 space-y-1 border-l-2 border-border pl-3 pb-1">
      {/* Subtask rows */}
      {subtasks.map((s) => (
        <div
          key={s.id}
          className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors"
        >
          <button
            onClick={() => onToggle(task.id, s.id)}
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          >
            {s.completed
              ? <CheckCircle2 size={15} className="text-primary" />
              : <Circle size={15} />}
          </button>
          <span className={cn(
            "flex-1 text-xs leading-snug",
            s.completed && "line-through text-muted-foreground"
          )}>
            {s.title}
          </span>
          <button
            onClick={() => onDelete(task.id, s.id)}
            className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {/* Add subtask input */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-0.5">
        <Plus size={13} className="shrink-0 text-muted-foreground ml-0.5" />
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Add a subtask…"
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground py-1"
          onKeyDown={(e) => { if (e.key === "Escape") setInputVal(""); }}
        />
        {inputVal.trim() && (
          <button
            type="submit"
            className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            Add
          </button>
        )}
      </form>

      {total > 0 && (
        <p className="text-[10px] text-muted-foreground pl-1">
          {done}/{total} completed
        </p>
      )}
    </div>
  );
}

/* ── Task row ─────────────────────────────────────────────────────── */
function TaskRow({ task, onToggle, onArchive, onAddSubtask, onToggleSubtask, onDeleteSubtask }) {
  const [expanded, setExpanded] = useState(false);
  const overdue  = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  const subtasks = task.subtasks || [];
  const doneSub  = subtasks.filter((s) => s.completed).length;

  return (
    <div className={cn(
      "transition-colors",
      task.completed && "opacity-55"
    )}>
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
          title={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed
            ? <CheckSquare size={17} className="text-primary" />
            : <Square size={17} />}
        </button>

        {/* Clickable content area — expands subtasks */}
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => setExpanded((p) => !p)}
        >
          <div className="flex items-center gap-1.5">
            <p className={cn(
              "text-sm font-medium leading-snug",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>
            {subtasks.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                {doneSub}/{subtasks.length}
              </span>
            )}
            <ChevronRight
              size={13}
              className={cn(
                "ml-auto text-muted-foreground transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          </div>
          {task.description && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{task.description}</p>
          )}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className={cn(
                "text-xs",
                overdue ? "font-medium text-rose-600" : "text-muted-foreground"
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
          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Archive task"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Subtask list — expanded */}
      {expanded && (
        <div className="px-4 pb-2">
          <SubtaskList
            task={task}
            onAdd={onAddSubtask}
            onToggle={onToggleSubtask}
            onDelete={onDeleteSubtask}
          />
        </div>
      )}
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
    <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Plus size={14} className="text-primary" />
          </div>
          Add a new task…
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Task title"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-offset-background transition"
          />

          <input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-offset-background transition"
          />

          <div className="flex gap-3">
            <div className="flex-1 space-y-0.5">
              <p className="text-xs text-muted-foreground">Due date</p>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs text-muted-foreground">Priority</p>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
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
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> Add task
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setErr(""); }}
              className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
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
  const { tasks, create, toggle, archive, addSubtask, toggleSubtask, deleteSubtask } = useTasks({ archived: false });

  const [filter,   setFilter]   = useState("all");
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
    <div className="mx-auto max-w-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {pending.length} pending · {completed.length} done
          </p>
        </div>

        {/* Priority filter */}
        <div className="flex self-start overflow-hidden rounded-xl border border-border text-xs font-medium bg-card">
          {["all", ...PRIORITIES].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "px-3 py-1.5 capitalize transition-colors",
                filter === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
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
          <ListChecks size={36} className="opacity-25" />
          <p className="text-sm">No pending tasks. Add one above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow divide-y divide-border">
          {visiblePending.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No {filter} priority tasks pending.</p>
          ) : (
            visiblePending.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggle}
                onArchive={archive}
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSubtask}
                onDeleteSubtask={deleteSubtask}
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
            className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <span>Completed ({visibleCompleted.length})</span>
            {showDone ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showDone && (
            <div className="mt-1 overflow-hidden rounded-2xl border border-border bg-card card-shadow divide-y divide-border">
              {visibleCompleted.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No completed {filter} priority tasks.</p>
              ) : (
                visibleCompleted.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggle}
                    onArchive={archive}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onDeleteSubtask={deleteSubtask}
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
