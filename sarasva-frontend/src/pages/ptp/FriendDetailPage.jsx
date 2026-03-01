import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, UserMinus, X, Bookmark, BookmarkCheck,
  Calendar, ClipboardList, BookOpen, FileText, StickyNote,
  MessageSquareShare, Library, CalendarDays, Download,
} from "lucide-react";
import { usePTP }          from "@/hooks/usePTP.js";
import { useDirectChat }   from "@/hooks/useDirectChat.js";
import { useSubjects }     from "@/hooks/useSubjects.js";
import { useTimetable }    from "@/hooks/useTimetable.js";
import { useAuth }         from "@/hooks/useAuth.js";
import { tasksService }    from "@/services/tasks.service.js";
import { cn }              from "@/lib/utils.js";

/* ── Post type config ─────────────────────────────────────────────── */
const POST_TYPES = [
  { value: "note",         label: "Note",         icon: StickyNote,
    bg: "bg-emerald-100",  text: "text-emerald-700" },
  { value: "task",         label: "Task",         icon: ClipboardList,
    bg: "bg-blue-100",     text: "text-blue-700" },
  { value: "assignment",   label: "Assignment",   icon: FileText,
    bg: "bg-purple-100",   text: "text-purple-700" },
  { value: "exam_date",    label: "Exam Date",    icon: Calendar,
    bg: "bg-rose-100",     text: "text-rose-700" },
  { value: "exam_pattern", label: "Exam Pattern", icon: BookOpen,
    bg: "bg-amber-100",    text: "text-amber-700" },
  { value: "subject",      label: "Subject",      icon: Library,
    bg: "bg-teal-100",     text: "text-teal-700" },
  { value: "timetable",    label: "Timetable",    icon: CalendarDays,
    bg: "bg-violet-100",   text: "text-violet-700" },
];

function typeConfig(value) {
  return POST_TYPES.find((p) => p.value === value) ?? POST_TYPES[0];
}

/* ── Avatar ───────────────────────────────────────────────────────── */
function Avatar({ name, size = "lg" }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "lg" ? "h-16 w-16 text-xl" : size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div className={cn("shrink-0 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary", sz)}>
      {initials}
    </div>
  );
}

/* ── Post type badge ──────────────────────────────────────────────── */
function PostTypeBadge({ type }) {
  const t = typeConfig(type);
  const Icon = t.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", t.bg, t.text)}>
      <Icon size={10} />{t.label}
    </span>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function FriendDetailPage() {
  const { friendUid } = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();

  const { friends, removeFriend }                  = usePTP();
  const { posts, loading, createPost, toggleSave } = useDirectChat(friendUid);
  const { subjects, importSubject }                = useSubjects();
  const { timetables, importTimetable }            = useTimetable();

  const friend = useMemo(
    () => friends.find((f) => f.uid === friendUid),
    [friends, friendUid]
  );

  /* ── Remove friend two-step ────────────────────────────────────── */
  const [removePending, setRemovePending] = useState(false);

  /* ── Share form state ─────────────────────────────────────────── */
  const [addingPost,  setAddingPost]  = useState(false);
  const [postType,    setPostType]    = useState("note");
  const [postTitle,   setPostTitle]   = useState("");
  const [postDesc,    setPostDesc]    = useState("");
  const [postDate,    setPostDate]    = useState("");
  const [postPayload, setPostPayload] = useState(null);
  const [postError,   setPostError]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  /* ── Save optimistic ──────────────────────────────────────────── */
  const [savedMap, setSavedMap] = useState({});

  /* ── Handlers ─────────────────────────────────────────────────── */
  async function handleRemoveFriend() {
    if (!removePending) { setRemovePending(true); return; }
    await removeFriend(friendUid);
    navigate("/ptp");
  }

  function handleTypeChange(value) {
    setPostType(value);
    setPostPayload(null);
    if (value === "subject" || value === "timetable") {
      setPostTitle("");
      setPostDesc("");
    }
  }

  function handleSubjectSelect(e) {
    const subj = subjects.find((s) => s.id === e.target.value);
    if (!subj) { setPostTitle(""); setPostDesc(""); setPostPayload(null); return; }
    const chapters = subj.chapters ?? [];
    setPostTitle(subj.name);
    setPostDesc(chapters.length ? chapters.map((c) => c.name).join(", ") : "No chapters yet");
    setPostPayload({ name: subj.name, chapters });
  }

  function handleTimetableSelect(e) {
    const tt = timetables.find((t) => t.id === e.target.value);
    if (!tt) { setPostTitle(""); setPostDesc(""); setPostPayload(null); return; }
    setPostTitle(tt.name);
    setPostDesc(`${(tt.slots ?? []).length} time slot(s)`);
    setPostPayload({ name: tt.name, slots: tt.slots ?? [] });
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postTitle.trim()) return;
    if ((postType === "subject" || postType === "timetable") && !postPayload) return;
    setPostError(""); setSubmitting(true);
    try {
      await createPost({
        type:        postType,
        title:       postTitle.trim(),
        description: postDesc.trim(),
        date:        postDate || null,
        payload:     postPayload,
      });
      setPostTitle(""); setPostDesc(""); setPostDate("");
      setPostPayload(null); setAddingPost(false);
    } catch (err) { setPostError(err.message); }
    setSubmitting(false);
  }

  async function handleSaveToApp(post) {
    const isSaved = savedMap[post.id] ?? post.savedBy?.includes(user?.id);
    setSavedMap((m) => ({ ...m, [post.id]: !isSaved }));
    await toggleSave(post.id, isSaved);
    if (!isSaved) {
      try {
        if (post.type === "subject" && post.payload) {
          await importSubject(post.payload);
        } else if (post.type === "timetable" && post.payload) {
          await importTimetable(post.payload);
        } else {
          await tasksService.create(user.id, {
            title:       post.title,
            description: `[From ${friend?.name ?? "Friend"}] ${post.description}`.trim(),
            dueDate:     post.date ?? "",
            priority:    post.type === "exam_date" ? "high" : "medium",
          });
        }
      } catch { /* non-critical */ }
    }
  }

  /* ── Not found ─────────────────────────────────────────────────── */
  if (!loading && !friend) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Friend not found or you're no longer connected.</p>
        <button onClick={() => navigate("/ptp")} className="text-xs text-primary underline">Back to Peers</button>
      </div>
    );
  }

  const showDate   = ["task", "assignment", "exam_date"].includes(postType);
  const isSubjType = postType === "subject";
  const isTTType   = postType === "timetable";

  return (
    <div className="mx-auto max-w-md space-y-4">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/ptp")}
          className="rounded-lg p-1.5 hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{friend?.name ?? "…"}</h1>
          <p className="text-xs text-muted-foreground">Study peer</p>
        </div>
      </div>

      {/* ── Friend profile card ─────────────────────────────────────── */}
      {friend && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <Avatar name={friend.name} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold">{friend.name}</p>
            {friend.course && <p className="text-sm text-muted-foreground">{friend.course}</p>}
            {friend.institute && <p className="text-xs text-muted-foreground">{friend.institute}</p>}
          </div>

          {/* Two-step remove */}
          {removePending ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleRemoveFriend}
                className="rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground"
              >
                Confirm remove
              </button>
              <button
                onClick={() => setRemovePending(false)}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleRemoveFriend}
              title="Remove friend"
              className="rounded-md border border-border p-1 text-muted-foreground/50 hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
            >
              <UserMinus size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── Share button ────────────────────────────────────────────── */}
      <button
        onClick={() => { setAddingPost((v) => !v); setRemovePending(false); }}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
          addingPost
            ? "border-border bg-muted text-muted-foreground"
            : "border-primary bg-primary/5 text-primary hover:bg-primary/10"
        )}
      >
        {addingPost ? <X size={15} /> : <MessageSquareShare size={15} />}
        {addingPost ? "Cancel" : "Share with Friend"}
      </button>

      {/* ── Share form ──────────────────────────────────────────────── */}
      {addingPost && (
        <form onSubmit={handleCreatePost} className="space-y-3 rounded-xl border border-border bg-card p-4">
          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5">
            {POST_TYPES.map((t) => {
              const isActive = postType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    isActive ? `${t.bg} ${t.text}` : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Subject picker */}
          {isSubjType && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Pick a subject to share</label>
              <select
                onChange={handleSubjectSelect}
                defaultValue=""
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="" disabled>Select subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{(s.chapters ?? []).length > 0 ? ` (${s.chapters.length} chapters)` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timetable picker */}
          {isTTType && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Pick a timetable to share</label>
              <select
                onChange={handleTimetableSelect}
                defaultValue=""
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="" disabled>Select timetable…</option>
                {timetables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{(t.slots ?? []).length > 0 ? ` (${t.slots.length} slots)` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected subject/timetable preview */}
          {(isSubjType || isTTType) && postTitle && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{postTitle}</span>
              {postDesc && <span className="ml-1">— {postDesc}</span>}
            </div>
          )}

          {/* Manual title + desc for non-data types */}
          {!isSubjType && !isTTType && (
            <>
              <input
                autoFocus
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Title…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                value={postDesc}
                onChange={(e) => setPostDesc(e.target.value)}
                placeholder="Details, notes, tips…"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </>
          )}

          {showDate && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {postError && <p className="text-xs text-destructive">{postError}</p>}

          <button
            type="submit"
            disabled={submitting || !postTitle.trim() || ((isSubjType || isTTType) && !postPayload)}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Sharing…" : "Share"}
          </button>
        </form>
      )}

      {/* ── Shared posts feed ───────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Shared between you two
        </p>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-14">
            <MessageSquareShare size={34} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Nothing shared yet</p>
            <p className="text-xs text-muted-foreground">Share a task, exam tip, subject, or note</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const isSaved    = savedMap[post.id] ?? post.savedBy?.includes(user?.id);
              const isMyPost   = post.authorUid === user?.id;
              const isDataType = post.type === "subject" || post.type === "timetable";
              return (
                <div key={post.id} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <PostTypeBadge type={post.type} />
                      <p className="text-sm font-semibold leading-snug">{post.title}</p>
                    </div>
                    {!isMyPost && (
                      <button
                        onClick={() => handleSaveToApp(post)}
                        className={cn(
                          "shrink-0 rounded-lg p-1.5 transition-colors",
                          isSaved ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                        title={
                          isSaved
                            ? (isDataType ? "Already imported" : "Saved to my tasks")
                            : (isDataType ? "Import to my app" : "Save to my tasks")
                        }
                      >
                        {isSaved
                          ? <BookmarkCheck size={16} />
                          : isDataType ? <Download size={16} /> : <Bookmark size={16} />
                        }
                      </button>
                    )}
                  </div>

                  {post.description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">{post.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={post.authorName} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {isMyPost ? "You" : post.authorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.date && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {new Date(post.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {isSaved && !isMyPost && (
                        <span className="text-[10px] font-semibold text-primary">
                          {isDataType ? "Imported ✓" : "Saved ✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
