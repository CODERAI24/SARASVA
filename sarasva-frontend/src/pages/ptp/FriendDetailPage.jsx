import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, UserMinus, Plus, X, Bookmark, BookmarkCheck,
  Calendar, ClipboardList, BookOpen, FileText, StickyNote,
  MessageSquareShare, CheckCircle2, Circle,
} from "lucide-react";
import { usePTP }        from "@/hooks/usePTP.js";
import { useDirectChat } from "@/hooks/useDirectChat.js";
import { useAuth }       from "@/hooks/useAuth.js";
import { tasksService }  from "@/services/tasks.service.js";
import { cn }            from "@/lib/utils.js";

/* ── Post type config (same as groups) ───────────────────────────── */
const POST_TYPES = [
  { value: "task",         label: "Task",         icon: ClipboardList,
    bg: "bg-blue-100",   text: "text-blue-700" },
  { value: "assignment",   label: "Assignment",   icon: FileText,
    bg: "bg-purple-100", text: "text-purple-700" },
  { value: "exam_date",    label: "Exam Date",    icon: Calendar,
    bg: "bg-rose-100",   text: "text-rose-700" },
  { value: "exam_pattern", label: "Exam Pattern", icon: BookOpen,
    bg: "bg-amber-100",  text: "text-amber-700" },
  { value: "note",         label: "Note",         icon: StickyNote,
    bg: "bg-emerald-100",text: "text-emerald-700" },
];

function typeConfig(value) {
  return POST_TYPES.find((p) => p.value === value) ?? POST_TYPES[4];
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

  const { friends, removeFriend } = usePTP();
  const { posts, loading, createPost, toggleSave } = useDirectChat(friendUid);

  // Find friend data from the friends list
  const friend = useMemo(
    () => friends.find((f) => f.uid === friendUid),
    [friends, friendUid]
  );

  /* ── Share form state ─────────────────────────────────────────── */
  const [addingPost, setAddingPost] = useState(false);
  const [postType,   setPostType]   = useState("note");
  const [postTitle,  setPostTitle]  = useState("");
  const [postDesc,   setPostDesc]   = useState("");
  const [postDate,   setPostDate]   = useState("");
  const [postError,  setPostError]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── Save optimistic ──────────────────────────────────────────── */
  const [savedMap, setSavedMap] = useState({});

  /* ── Handlers ─────────────────────────────────────────────────── */
  async function handleRemoveFriend() {
    if (!confirm(`Remove ${friend?.name ?? "this friend"}? This cannot be undone.`)) return;
    await removeFriend(friendUid);
    navigate("/ptp");
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postTitle.trim()) return;
    setPostError(""); setSubmitting(true);
    try {
      await createPost({
        type: postType, title: postTitle.trim(),
        description: postDesc.trim(), date: postDate || null,
      });
      setPostTitle(""); setPostDesc(""); setPostDate(""); setAddingPost(false);
    } catch (err) { setPostError(err.message); }
    setSubmitting(false);
  }

  async function handleSaveToApp(post) {
    const isSaved = savedMap[post.id] ?? post.savedBy?.includes(user?.id);
    setSavedMap((m) => ({ ...m, [post.id]: !isSaved }));
    await toggleSave(post.id, isSaved);
    if (!isSaved) {
      try {
        await tasksService.create(user.id, {
          title:       post.title,
          description: `[From ${friend?.name ?? "Friend"}] ${post.description}`.trim(),
          dueDate:     post.date ?? "",
          priority:    post.type === "exam_date" ? "high" : "medium",
        });
      } catch { /* non-critical */ }
    }
  }

  /* ── Not found (friend may have been removed already) ─────────── */
  if (!loading && !friend) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Friend not found or you're no longer connected.</p>
        <button onClick={() => navigate("/ptp")} className="text-xs text-primary underline">Back to Peers</button>
      </div>
    );
  }

  const showDate = ["task","assignment","exam_date"].includes(postType);

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
            {friend.course && (
              <p className="text-sm text-muted-foreground">{friend.course}</p>
            )}
            {friend.institute && (
              <p className="text-xs text-muted-foreground">{friend.institute}</p>
            )}
          </div>
          <button
            onClick={handleRemoveFriend}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <UserMinus size={13} /> Remove
          </button>
        </div>
      )}

      {/* ── Share button ────────────────────────────────────────────── */}
      <button
        onClick={() => setAddingPost((v) => !v)}
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
        <form
          onSubmit={handleCreatePost}
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5">
            {POST_TYPES.map((t) => {
              const isActive = postType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPostType(t.value)}
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
            disabled={submitting || !postTitle.trim()}
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
            <p className="text-xs text-muted-foreground">Share a task, exam tip, or note</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const isSaved  = savedMap[post.id] ?? post.savedBy?.includes(user?.id);
              const isMyPost = post.authorUid === user?.id;
              return (
                <div key={post.id} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <PostTypeBadge type={post.type} />
                      <p className="text-sm font-semibold leading-snug">{post.title}</p>
                    </div>
                    {/* Save button — only for the receiver */}
                    {!isMyPost && (
                      <button
                        onClick={() => handleSaveToApp(post)}
                        className={cn(
                          "shrink-0 rounded-lg p-1.5 transition-colors",
                          isSaved ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                        title={isSaved ? "Saved to my tasks" : "Save to my tasks"}
                      >
                        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  {post.description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">{post.description}</p>
                  )}

                  {/* Footer */}
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
                        <span className="text-[10px] font-semibold text-primary">Saved ✓</span>
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
