/**
 * Admin Panel — accessible only to users with role: "admin" in their Firestore profile.
 *
 * HOW TO MAKE YOURSELF ADMIN:
 * 1. Open Firebase Console → Firestore → users/{your-uid}/profile/data
 * 2. Add field:  role  (string)  =  "admin"
 * 3. Reload the app — the Admin link will appear in the sidebar.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Quote, Plus, Trash2, ToggleLeft, ToggleRight, Edit3,
  Check, X, ShieldAlert, Sparkles,
} from "lucide-react";
import { useAuth }      from "@/hooks/useAuth.js";
import { useAllQuotes } from "@/hooks/useQuotes.js";
import { quotesService } from "@/services/quotes.service.js";
import { cn }           from "@/lib/utils.js";

/* ── Access guard ─────────────────────────────────────────────────── */
function AdminGuard({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <ShieldAlert size={48} className="text-destructive/40" />
        <div>
          <p className="text-lg font-bold">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">
            This area is restricted to admin users.
          </p>
          <p className="mt-3 text-xs text-muted-foreground max-w-xs mx-auto">
            To become admin: open Firebase Console → Firestore →{" "}
            <code className="font-mono bg-muted px-1 rounded">users/&#123;uid&#125;/profile/data</code>{" "}
            and add field <code className="font-mono bg-muted px-1 rounded">role = "admin"</code>
          </p>
        </div>
      </div>
    );
  }
  return children;
}

/* ── Quote row ─────────────────────────────────────────────────────── */
function QuoteRow({ quote, onDelete, onToggle, onSave }) {
  const [editing,  setEditing]  = useState(false);
  const [text,     setText]     = useState(quote.text);
  const [author,   setAuthor]   = useState(quote.author ?? "");
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    await onSave(quote.id, { text: text.trim(), author: author.trim() });
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      {editing ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !text.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
              <Check size={12} />{saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setText(quote.text); setAuthor(quote.author ?? ""); }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
              <X size={12} />Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm italic text-foreground">"{quote.text}"</p>
          {quote.author && (
            <p className="text-xs text-muted-foreground">— {quote.author}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => setEditing(true)}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              title="Edit">
              <Edit3 size={13} />
            </button>
            <button onClick={() => onToggle(quote.id, quote.active)}
              className={cn(
                "rounded-lg border p-1.5 transition-colors",
                quote.active
                  ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
              title={quote.active ? "Deactivate" : "Activate"}>
              {quote.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            </button>
            <button onClick={() => onDelete(quote.id)}
              className="rounded-lg border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete">
              <Trash2 size={13} />
            </button>
            <span className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
              quote.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            )}>
              {quote.active ? "Active" : "Inactive"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Add quote form ─────────────────────────────────────────────────── */
function AddQuoteForm({ onAdd }) {
  const [text,   setText]   = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [open,   setOpen]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onAdd({ text: text.trim(), author: author.trim() });
      setText(""); setAuthor(""); setOpen(false);
    } catch {}
    setSaving(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
        <Plus size={15} /> Add Quote
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Motivational quote text…"
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Author (optional)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          <Check size={13} />{saving ? "Saving…" : "Add Quote"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setText(""); setAuthor(""); }}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Main admin page ──────────────────────────────────────────────── */
export default function AdminPage() {
  const { quotes, loading, refresh } = useAllQuotes();

  async function handleAdd(data) {
    await quotesService.add(data);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this quote?")) return;
    await quotesService.remove(id);
    refresh();
  }

  async function handleToggle(id, currentActive) {
    await quotesService.update(id, { active: !currentActive });
    refresh();
  }

  async function handleSave(id, patch) {
    await quotesService.update(id, patch);
    refresh();
  }

  const activeCount = quotes.filter((q) => q.active).length;

  return (
    <AdminGuard>
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles size={22} className="text-primary" /> Admin Panel
          </h2>
          <p className="text-sm text-muted-foreground">Control motivational quotes and app content.</p>
        </div>

        {/* Motivational Quotes */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Quote size={16} className="text-primary" />
              Motivational Quotes
            </h3>
            <div className="text-xs text-muted-foreground">
              {activeCount} active · {quotes.length} total
            </div>
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            Active quotes rotate hourly on the dashboard for all users. Add as many as you like.
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : (
            <div className="space-y-3">
              <AddQuoteForm onAdd={handleAdd} />
              {quotes.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No quotes yet. Add some above!
                </p>
              )}
              {quotes.map((q) => (
                <QuoteRow
                  key={q.id}
                  quote={q}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onSave={handleSave}
                />
              ))}
            </div>
          )}
        </div>

        {/* Setup instructions */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">📋 Admin Setup Reminder</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>Firestore security rules: add <code className="font-mono bg-amber-100 px-0.5 rounded">quotes</code> collection rules to allow authenticated reads and admin writes.</li>
            <li>To add another admin: set <code className="font-mono bg-amber-100 px-0.5 rounded">role = "admin"</code> in their profile doc.</li>
            <li>Quotes are stored in <code className="font-mono bg-amber-100 px-0.5 rounded">quotes/&#123;id&#125;</code> — top-level Firestore collection.</li>
          </ul>
        </div>
      </div>
    </AdminGuard>
  );
}
