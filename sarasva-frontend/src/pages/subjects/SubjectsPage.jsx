import { useState } from "react";
import { useSubjects } from "@/hooks/useSubjects.js";
import { cn } from "@/lib/utils.js";
import { Pencil, Trash2, Check, X, Plus, BookMarked } from "lucide-react";

export default function SubjectsPage() {
  const { subjects, create, update, archive } = useSubjects({ archived: false });
  const [newName,     setNewName]     = useState("");
  const [editingId,   setEditingId]   = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error,       setError]       = useState("");

  /* ── Add ─────────────────────────────────────────────────────────── */
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

  /* ── Edit ────────────────────────────────────────────────────────── */
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

  return (
    <div className="mx-auto max-w-xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Subjects</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subjects. Archived subjects are hidden from attendance and timetable.
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
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus size={15} />
            Add
          </button>
        </form>
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>

      {/* Subject list */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <BookMarked size={32} className="opacity-30" />
            <p className="text-sm">No subjects yet. Add one above.</p>
          </div>
        ) : (
          subjects.map((subject) =>
            editingId === subject.id ? (
              /* Edit mode row */
              <div key={subject.id} className="flex items-center gap-2 px-4 py-3">
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
                <button
                  onClick={() => commitEdit(subject.id)}
                  className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                  title="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              /* Normal row */
              <div
                key={subject.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <span className="text-sm font-medium">{subject.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(subject)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Rename"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleArchive(subject.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Archive"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Count */}
      {subjects.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
