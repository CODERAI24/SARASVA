import { useState } from "react";
import { useSubjects } from "@/hooks/useSubjects.js";
import { cn } from "@/lib/utils.js";
import {
  Pencil, Trash2, Check, X, Plus, BookMarked,
  ChevronDown, ChevronUp, List,
} from "lucide-react";

/* ── Chapter management for a single subject ─────────────────────── */
function ChapterManager({ subject, onAdd, onUpdate, onDelete }) {
  const [addName, setAddName]     = useState("");
  const [editId, setEditId]       = useState(null);
  const [editName, setEditName]   = useState("");
  const [adding, setAdding]       = useState(false);

  const chapters = subject.chapters ?? [];

  function handleAdd(e) {
    e.preventDefault();
    const name = addName.trim();
    if (!name) return;
    onAdd(subject.id, name);
    setAddName("");
    setAdding(false);
  }

  function startEdit(ch) {
    setEditId(ch.id);
    setEditName(ch.name);
  }

  function commitEdit() {
    const name = editName.trim();
    if (name) onUpdate(subject.id, editId, name);
    setEditId(null);
  }

  return (
    <div className="border-t border-border bg-muted/30 px-4 pb-3 pt-2 space-y-2">
      {chapters.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">No chapters added yet.</p>
      ) : (
        <div className="space-y-1">
          {chapters.map((ch, idx) =>
            editId === ch.id ? (
              <div key={ch.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}.</span>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditId(null); }}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={commitEdit} className="rounded p-1 text-green-600 hover:bg-green-50"><Check size={14} /></button>
                <button onClick={() => setEditId(null)} className="rounded p-1 text-muted-foreground hover:bg-accent"><X size={14} /></button>
              </div>
            ) : (
              <div key={ch.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/40 transition-colors group">
                <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}.</span>
                <span className="flex-1 text-sm">{ch.name}</span>
                <button
                  onClick={() => startEdit(ch)}
                  className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDelete(subject.id, ch.id)}
                  className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          )}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            autoFocus
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Chapter name…"
            className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">Add</button>
          <button type="button" onClick={() => setAdding(false)} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent">Cancel</button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus size={12} /> Add chapter
        </button>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function SubjectsPage() {
  const { subjects, create, update, archive, addChapter, updateChapter, deleteChapter } = useSubjects({ archived: false });
  const [newName,      setNewName]      = useState("");
  const [editingId,    setEditingId]    = useState(null);
  const [editingName,  setEditingName]  = useState("");
  const [expandedIds,  setExpandedIds]  = useState(new Set());
  const [error,        setError]        = useState("");

  /* ── Add subject ────────────────────────────────────────────────── */
  function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (subjects.find((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setError("A subject with this name already exists.");
      return;
    }
    create(name);
    setNewName("");
    setError("");
  }

  /* ── Edit subject name ──────────────────────────────────────────── */
  function startEdit(subject) {
    setEditingId(subject.id);
    setEditingName(subject.name);
  }

  function commitEdit(id) {
    const name = editingName.trim();
    if (!name) { cancelEdit(); return; }
    update(id, { name });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  /* ── Archive ─────────────────────────────────────────────────────── */
  function handleArchive(id) {
    if (confirm("Archive this subject? It won't appear in attendance or timetable.")) {
      archive(id);
    }
  }

  /* ── Expand/collapse chapters ───────────────────────────────────── */
  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Subjects</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subjects and their chapters. Chapters are used in exam prep.
        </p>
      </div>

      {/* Add subject form */}
      <div className="rounded-xl border border-border bg-card p-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(""); }}
            placeholder="Subject name (e.g. Mathematics)"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Add
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>

      {/* Subject list */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <BookMarked size={32} className="opacity-30" />
            <p className="text-sm">No subjects yet. Add one above.</p>
          </div>
        ) : (
          subjects.map((subject) => {
            const chapters   = subject.chapters ?? [];
            const isExpanded = expandedIds.has(subject.id);
            const isEditing  = editingId === subject.id;

            return (
              <div key={subject.id} className="transition-colors">
                {isEditing ? (
                  /* Edit name row */
                  <div className="flex items-center gap-2 px-4 py-3">
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")  commitEdit(subject.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-offset-background"
                    />
                    <button onClick={() => commitEdit(subject.id)} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Save">
                      <Check size={16} />
                    </button>
                    <button onClick={cancelEdit} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" title="Cancel">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{subject.name}</span>
                      {chapters.length > 0 && (
                        <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <List size={9} /> {chapters.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleExpand(subject.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title={isExpanded ? "Collapse chapters" : "Manage chapters"}
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button
                        onClick={() => startEdit(subject)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Rename"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleArchive(subject.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Archive"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Chapter section — smooth expand */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isExpanded ? `${(chapters.length + 2) * 44 + 80}px` : "0px" }}
                >
                  {isExpanded && (
                    <ChapterManager
                      subject={subject}
                      onAdd={addChapter}
                      onUpdate={updateChapter}
                      onDelete={deleteChapter}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {subjects.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
